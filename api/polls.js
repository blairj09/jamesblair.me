import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const TTL = 7 * 24 * 60 * 60;
const hash = (value) => createHash('sha256').update(value).digest('hex');
const idPattern = /^[a-f0-9]{24}$/;
const voterPattern = /^[a-zA-Z0-9-]{20,80}$/;

// One atomic operation keeps voting, closing a poll, and reading counts consistent
// across independent Vercel instances. The whole poll expires after seven days.
export const POLL_SCRIPT = `
local action = ARGV[1]
local input = cjson.decode(ARGV[2])
local key = KEYS[1]
if action == 'create' then
  if redis.call('EXISTS', key) == 1 then return cjson.encode({error='collision'}) end
  redis.call('HSET', key, 'meta', ARGV[2], 'total', 0)
  redis.call('EXPIRE', key, ARGV[5])
end
local raw = redis.call('HGET', key, 'meta')
if not raw then return cjson.encode({error='missing'}) end
local poll = cjson.decode(raw)
local host = ARGV[3] ~= '' and ARGV[3] == poll.hostHash
if action == 'update' then
  if not host then return cjson.encode({error='unauthorized'}) end
  if input.open ~= nil then poll.open = input.open end
  if input.revealed ~= nil then poll.revealed = input.revealed end
  redis.call('HSET', key, 'meta', cjson.encode(poll))
end
if action == 'vote' then
  local previous = redis.call('HGET', key, 'v:' .. ARGV[4])
  if previous then return cjson.encode({accepted=true, alreadyVoted=true}) end
  if not poll.open then return cjson.encode({error='closed'}) end
  if input.option < 0 or input.option >= #poll.options then
    return cjson.encode({error='option'})
  end
  redis.call('HSET', key, 'v:' .. ARGV[4], input.option)
  redis.call('HINCRBY', key, 'c:' .. input.option, 1)
  redis.call('HINCRBY', key, 'total', 1)
  return cjson.encode({accepted=true, alreadyVoted=false})
end
local result = {
  id=poll.id, question=poll.question, options=poll.options,
  open=poll.open, revealed=poll.revealed, expiresAt=poll.expiresAt,
  total=tonumber(redis.call('HGET', key, 'total') or '0'), host=host
}
if host or poll.revealed then
  local counts = {}
  for i=0,#poll.options-1 do
    counts[i+1] = tonumber(redis.call('HGET', key, 'c:' .. i) or '0')
  end
  result.counts = counts
end
if ARGV[4] ~= '' then
  local vote = redis.call('HGET', key, 'v:' .. ARGV[4])
  if vote then result.vote = tonumber(vote) end
end
return cjson.encode(result)
`;

function authorized(actual, expected) {
  if (typeof actual !== 'string' || !expected) return false;
  return timingSafeEqual(Buffer.from(hash(actual)), Buffer.from(hash(expected)));
}

function bodyOf(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return req.body;
}

async function execute(action, id, input, hostToken = '', voter = '') {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['EVAL', POLL_SCRIPT, 1, `stat121:poll:${id}`,
      action, JSON.stringify(input), hostToken ? hash(hostToken) : '', voter ? hash(voter) : '', TTL]),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error('Storage unavailable');
  const data = await response.json();
  if (data.error || typeof data.result !== 'string') throw new Error('Storage command failed');
  return JSON.parse(data.result);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const fail = (status, error, code) => res.status(status).json({ error, code });
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, PATCH');
    return fail(405, 'Method not allowed.');
  }
  if (!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) ||
      !(process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN) ||
      !process.env.POLL_ADMIN_KEY) {
    return fail(503, 'Class polls are not set up yet. Please contact your instructor.', 'SETUP_REQUIRED');
  }
  const input = req.method === 'GET' ? {} : bodyOf(req);
  if (!input || typeof input !== 'object' || Array.isArray(input) || JSON.stringify(input).length > 6000) {
    return fail(400, 'Invalid poll request.');
  }
  const create = req.method === 'POST' && input.action === 'create';
  let id = req.query?.id;
  let action = req.method === 'GET' ? 'read' : req.method === 'PATCH' ? 'update' : 'vote';
  let hostToken = req.headers['x-poll-host'] || '';
  const voter = req.headers['x-poll-voter'] || '';
  if (typeof hostToken !== 'string' || hostToken.length > 128 ||
      (voter && (typeof voter !== 'string' || !voterPattern.test(voter)))) {
    return fail(400, 'Invalid poll credentials.');
  }
  let payload = input;
  if (create) {
    if (!authorized(req.headers['x-poll-admin'], process.env.POLL_ADMIN_KEY)) {
      return fail(401, 'The instructor key is incorrect.');
    }
    const question = typeof input.question === 'string' ? input.question.trim() : '';
    const options = Array.isArray(input.options) ? input.options.map(x => typeof x === 'string' ? x.trim() : '') : [];
    if (!question || question.length > 240 || options.length < 2 || options.length > 6 ||
        options.some(x => !x || x.length > 120) || new Set(options.map(x => x.toLowerCase())).size !== options.length) {
      return fail(400, 'Enter a question and 2–6 different answers.');
    }
    id = randomBytes(12).toString('hex');
    hostToken = randomBytes(32).toString('hex');
    action = 'create';
    payload = { id, question, options, open: true, revealed: false,
      expiresAt: new Date(Date.now() + TTL * 1000).toISOString(), hostHash: hash(hostToken) };
  } else {
    if (typeof id !== 'string' || !idPattern.test(id)) return fail(400, 'Invalid poll link.');
    if (action === 'vote' && (!voter || !Number.isInteger(input.option))) {
      return fail(400, 'Choose an answer before voting.');
    }
    if (action === 'update' &&
        ((input.open === undefined && input.revealed === undefined) ||
         (input.open !== undefined && typeof input.open !== 'boolean') ||
         (input.revealed !== undefined && typeof input.revealed !== 'boolean'))) {
      return fail(400, 'Invalid poll controls.');
    }
  }
  try {
    const result = await execute(action, id, payload, hostToken, voter);
    const errors = {
      missing: [404, 'This poll has expired or does not exist.'],
      unauthorized: [403, 'Only the instructor can control this poll.'],
      closed: [409, 'Voting is closed.'],
      option: [400, 'Choose one of the available answers.'],
      collision: [503, 'Please try creating the poll again.']
    };
    if (result.error) return fail(...(errors[result.error] || [503, 'Please try again.']));
    return res.status(create ? 201 : 200).json(create ? { ...result, hostToken } : result);
  } catch {
    return fail(503, 'The poll connection is temporarily unavailable. Please try again.', 'CONNECTION_ERROR');
  }
}
