import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../api/polls.js';
import { redisHarness } from './redis-harness.mjs';

const voter = 'student-browser-0000000001';
async function call(method, body, { id, hostToken, adminKey, voterId } = {}) {
  const headers = {};
  if (hostToken) headers['x-poll-host'] = hostToken;
  if (adminKey) headers['x-poll-admin'] = adminKey;
  if (voterId) headers['x-poll-voter'] = voterId;
  const result = { headers: {} };
  const res = {
    setHeader(key, value) { result.headers[key] = value; },
    status(value) { result.status = value; return res; },
    json(value) { result.body = value; return res; }
  };
  await handler({ method, body, headers, query: { id } }, res);
  return result;
}

describe('poll request validation', () => {
  const env = { ...process.env };
  before(() => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://poll-test.invalid';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-only';
    process.env.POLL_ADMIN_KEY = 'test-instructor-key';
  });
  after(() => {
    for (const key of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'POLL_ADMIN_KEY']) {
      if (env[key] === undefined) delete process.env[key]; else process.env[key] = env[key];
    }
  });
  test('rejects unsupported methods and disables response caching', async () => {
    const result = await call('DELETE');
    assert.equal(result.status, 405);
    assert.match(result.headers['Cache-Control'], /no-store/);
    assert.equal(result.headers.Allow, 'GET, POST, PATCH');
  });
  test('requires instructor authentication for creation', async () => {
    assert.equal((await call('POST', { action: 'create' })).status, 401);
  });
  test('rejects invalid links, malformed bodies, and missing voter credentials', async () => {
    assert.equal((await call('GET', null, { id: '../../other' })).status, 400);
    assert.equal((await call('POST', 'not json')).status, 400);
    assert.equal((await call('POST', { option: 0 }, { id: 'a'.repeat(24) })).status, 400);
  });
  test('rejects duplicates, empty answers, and excessive lengths', async () => {
    for (const options of [['Yes', 'yes'], ['Yes', ''], ['x'.repeat(121), 'No']]) {
      assert.equal((await call('POST', { action: 'create', question: 'Question?', options },
        { adminKey: 'test-instructor-key' })).status, 400);
    }
  });
  test('rejects non-boolean instructor controls', async () => {
    assert.equal((await call('PATCH', { open: 'false' }, { id: 'a'.repeat(24) })).status, 400);
  });
  test('reports missing setup without attempting a storage request', async () => {
    delete process.env.POLL_ADMIN_KEY;
    const result = await call('GET', null, { id: 'a'.repeat(24) });
    assert.equal(result.status, 503);
    assert.equal(result.body.code, 'SETUP_REQUIRED');
    process.env.POLL_ADMIN_KEY = 'test-instructor-key';
  });
  test('does not expose storage errors or credentials to users', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error('secret credential example'); };
    try {
      const result = await call('GET', null, { id: 'a'.repeat(24) });
      assert.equal(result.status, 503);
      assert.equal(result.body.code, 'CONNECTION_ERROR');
      assert.doesNotMatch(JSON.stringify(result.body), /secret credential/);
    } finally { globalThis.fetch = original; }
  });
});

describe('atomic live polls on real Redis', { skip: process.env.POLL_TEST_REDIS !== '1' }, () => {
  let redis;
  let poll;
  let host;
  before(async () => {
    redis = await redisHarness();
    const result = await call('POST', { action: 'create', question: 'Which method?', options: ['Random', 'Convenience', 'Stratified'] },
      { adminKey: 'test-instructor-key' });
    assert.equal(result.status, 201);
    poll = result.body;
    host = { id: poll.id, hostToken: poll.hostToken };
  });
  after(async () => { if (redis) await redis.close(); });
  test('creates a hidden, open poll with an expiring private host capability', async () => {
    assert.equal(poll.open, true);
    assert.equal(poll.revealed, false);
    assert.equal(poll.total, 0);
    assert.equal(poll.hostToken.length, 64);
    assert.ok(await redis.command(['TTL', `stat121:poll:${poll.id}`]) > 600000);
    assert.equal(poll.hostHash, undefined);
  });
  test('withholds counts and host secrets from public and forged-host reads', async () => {
    for (const hostToken of [undefined, 'forged']) {
      const result = await call('GET', null, { id: poll.id, hostToken });
      assert.equal(result.body.counts, undefined);
      assert.equal(result.body.hostToken, undefined);
      assert.equal(result.body.hostHash, undefined);
      assert.equal(result.body.host, false);
    }
    assert.deepEqual((await call('GET', null, host)).body.counts, [0, 0, 0]);
  });
  test('rejects instructor controls without the correct token', async () => {
    assert.equal((await call('PATCH', { revealed: true }, { id: poll.id })).status, 403);
    assert.equal((await call('PATCH', { open: false }, { id: poll.id, hostToken: 'wrong' })).status, 403);
  });
  test('rejects unavailable options and non-integer votes', async () => {
    for (const option of [-1, 3, 1.5]) {
      assert.equal((await call('POST', { option }, { id: poll.id, voterId: voter })).status, 400);
    }
  });
  test('counts simultaneous unique votes once and deduplicates concurrent retries', async () => {
    const submissions = Array.from({ length: 60 }, (_, i) =>
      call('POST', { option: i % 3 }, { id: poll.id, voterId: `student-browser-${String(i).padStart(10, '0')}` }));
    const results = await Promise.all(submissions);
    assert.ok(results.every(result => result.status === 200));
    await Promise.all(Array.from({ length: 20 }, () =>
      call('POST', { option: 0 }, { id: poll.id, voterId: 'repeated-browser-0000000000' })));
    const result = (await call('GET', null, host)).body;
    assert.equal(result.total, 61);
    assert.deepEqual(result.counts, [21, 20, 20]);
  });
  test('restores the browser’s vote after reload without exposing another voter', async () => {
    const result = (await call('GET', null, { id: poll.id, voterId: 'repeated-browser-0000000000' })).body;
    assert.equal(result.vote, 0);
    assert.equal(result.counts, undefined);
    assert.equal((await call('GET', null, { id: poll.id, voterId: 'new-browser-0000000000' })).body.vote, undefined);
  });
  test('reveals and hides public counts independently of voting', async () => {
    await call('PATCH', { revealed: true }, host);
    assert.deepEqual((await call('GET', null, { id: poll.id })).body.counts, [21, 20, 20]);
    await call('PATCH', { revealed: false }, host);
    assert.equal((await call('GET', null, { id: poll.id })).body.counts, undefined);
  });
  test('closing blocks new votes; reopening accepts them without clearing previous votes', async () => {
    await call('PATCH', { open: false }, host);
    assert.equal((await call('POST', { option: 1 }, { id: poll.id, voterId: 'new-browser-0000000000' })).status, 409);
    await call('PATCH', { open: true }, host);
    assert.equal((await call('POST', { option: 1 }, { id: poll.id, voterId: 'new-browser-0000000000' })).status, 200);
    assert.equal((await call('GET', null, host)).body.total, 62);
  });
  test('existing vote retries stay idempotent after voting closes', async () => {
    await call('PATCH', { open: false }, host);
    const result = await call('POST', { option: 2 }, { id: poll.id, voterId: 'new-browser-0000000000' });
    assert.equal(result.status, 200);
    assert.equal(result.body.alreadyVoted, true);
    assert.equal((await call('GET', null, host)).body.total, 62);
  });
  test('expired polls reject reads, votes, and instructor controls', async () => {
    await redis.command(['DEL', `stat121:poll:${poll.id}`]);
    assert.equal((await call('GET', null, host)).status, 404);
    assert.equal((await call('POST', { option: 0 }, { id: poll.id, voterId: voter })).status, 404);
    assert.equal((await call('PATCH', { open: true }, host)).status, 404);
  });
});
