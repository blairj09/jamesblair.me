import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import handler, { cleanName } from '../../api/nanas-garden.js';

// A tiny in-memory stand-in for the Upstash REST commands this API uses.
function fakeRedis() {
  const strings = new Map();
  const zsets = new Map();
  const commands = {
    SET: (key, value) => { strings.set(key, String(value)); return 'OK'; },
    GET: (key) => strings.has(key) ? strings.get(key) : null,
    GETDEL: (key) => { const v = strings.has(key) ? strings.get(key) : null; strings.delete(key); return v; },
    DEL: (key) => Number(strings.delete(key)),
    INCR: (key) => { const v = Number(strings.get(key) || 0) + 1; strings.set(key, String(v)); return v; },
    EXPIRE: () => 1,
    ZADD: (key, score, member) => { const z = zsets.get(key) || new Map(); zsets.set(key, z); z.set(member, Number(score)); return 1; },
    ZRANGE: (key, start, stop) => sorted(key).slice(Number(start), Number(stop) + 1).flatMap(([m, s]) => [m, String(s)]),
    ZREMRANGEBYRANK: (key, start) => { const z = zsets.get(key); if (!z) return 0; const drop = sorted(key).slice(Number(start)); drop.forEach(([m]) => z.delete(m)); return drop.length; },
    ZRANK: (key, member) => { const i = sorted(key).findIndex(([m]) => m === member); return i < 0 ? null : i; }
  };
  function sorted(key) { return [...(zsets.get(key) || new Map())].sort((a, b) => a[1] - b[1]); }
  return {
    strings, zsets,
    fetch: async (url, options) => {
      const [name, ...args] = JSON.parse(options.body);
      const result = commands[name](...args);
      return new Response(JSON.stringify({ result }), { headers: { 'Content-Type': 'application/json' } });
    }
  };
}

async function call(method, body, ip = '203.0.113.7') {
  const result = { headers: {} };
  const res = {
    setHeader(key, value) { result.headers[key] = value; },
    status(value) { result.status = value; return res; },
    json(value) { result.body = value; return res; }
  };
  await handler({ method, body, headers: { 'x-forwarded-for': ip }, query: {} }, res);
  return result;
}

describe('Nana’s Garden leaderboard', () => {
  const env = { ...process.env };
  const realFetch = globalThis.fetch;
  const realNow = Date.now;
  let store; let now;
  before(() => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://leaderboard-test.invalid';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-only';
  });
  beforeEach(() => {
    store = fakeRedis(); globalThis.fetch = store.fetch;
    now = 1_000_000; Date.now = () => now;
  });
  after(() => {
    globalThis.fetch = realFetch; Date.now = realNow;
    for (const key of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) {
      if (env[key] === undefined) delete process.env[key]; else process.env[key] = env[key];
    }
  });

  async function finishedRun(ms, name, ip) {
    const { body: { id } } = await call('POST', { action: 'start' });
    now += ms;
    const finish = await call('POST', { action: 'finish', id });
    assert.equal(finish.status, 200);
    return call('POST', { action: 'claim', id, name }, ip);
  }

  test('times a run on the server and ranks the fastest first', async () => {
    await finishedRun(200_000, 'Ellie', '198.51.100.1');
    const fox = await finishedRun(150_000, 'Fox', '198.51.100.2');
    assert.equal(fox.status, 200);
    assert.equal(fox.body.rank, 1);
    assert.deepEqual(fox.body.top.map(r => [r.rank, r.name, r.ms]), [[1, 'Fox', 150_000], [2, 'Ellie', 200_000]]);
    const board = await call('GET');
    assert.equal(board.body.top.length, 2);
    assert.match(board.headers['Cache-Control'], /no-store/);
  });

  test('rejects runs faster than a minute and forgets them', async () => {
    const { body: { id } } = await call('POST', { action: 'start' });
    now += 30_000;
    const finish = await call('POST', { action: 'finish', id });
    assert.equal(finish.status, 422);
    assert.equal((await call('POST', { action: 'claim', id, name: 'Speedy' })).status, 404);
  });

  test('a time can only be saved once', async () => {
    const { body: { id } } = await call('POST', { action: 'start' });
    now += 120_000;
    await call('POST', { action: 'finish', id });
    assert.equal((await call('POST', { action: 'claim', id, name: 'Charlie' })).status, 200);
    assert.equal((await call('POST', { action: 'claim', id, name: 'Charlie' })).status, 404);
  });

  test('finishing twice keeps the first time', async () => {
    const { body: { id } } = await call('POST', { action: 'start' });
    now += 90_000;
    assert.equal((await call('POST', { action: 'finish', id })).body.ms, 90_000);
    now += 60_000;
    assert.equal((await call('POST', { action: 'finish', id })).body.ms, 90_000);
  });

  test('limits saves per visitor per minute', async () => {
    for (let i = 0; i < 5; i++) assert.equal((await finishedRun(100_000 + i, 'Luther', '192.0.2.9')).status, 200);
    assert.equal((await finishedRun(100_000, 'Luther', '192.0.2.9')).status, 429);
  });

  test('validates input', async () => {
    assert.equal((await call('DELETE')).status, 405);
    assert.equal((await call('POST', { action: 'finish', id: 'nope' })).status, 400);
    assert.equal((await call('POST', { action: 'claim', id: 'a'.repeat(24), name: '' })).status, 400);
    assert.equal((await call('POST', { action: 'finish', id: 'a'.repeat(24) })).status, 404);
  });

  test('cleans names and keeps the board friendly', () => {
    assert.equal(cleanName('  Nana   '), 'Nana');
    assert.equal(cleanName('Grandpa J'), 'Grandpa J');
    assert.equal(cleanName("O'Brien-Smith"), "O'Brien-Smith");
    assert.equal(cleanName('Cassie'), 'Cassie');
    assert.equal(cleanName('Glass Hancock'), 'Glass Hancock');
    assert.equal(cleanName('a'.repeat(21)), null);
    assert.equal(cleanName('<script>'), null);
    assert.equal(cleanName('sh1t head'), null);
    assert.equal(cleanName('big ass'), null);
  });
});
