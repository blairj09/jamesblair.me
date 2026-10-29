import { createHash, randomBytes } from 'node:crypto';

// Leaderboard for Nana's Garden: fastest time from "Start gardening" to the party.
// The server keeps each run's start time, so times can't be set from the browser.
const RUN_TTL = 3 * 60 * 60;      // a run has three hours to reach the party
const DONE_TTL = 60 * 60;         // and its time can be saved for an hour after
const MIN_MS = 60 * 1000;         // nobody fills the basket in under a minute
const KEEP = 200;                 // stored scores; only the top 10 are shown
const SCORES = 'nanas-garden:scores';
const runKey = (id) => `nanas-garden:run:${id}`;
const idPattern = /^[a-f0-9]{24}$/;
const namePattern = /^[\p{L}\p{M}\p{N} .'’-]+$/u;
// Whole words that never belong on a family leaderboard, plus a few strings
// blocked anywhere in a name. Kept short to avoid flagging real names.
const BLOCKED_WORDS = new Set(['ass', 'asshole', 'bastard', 'cock', 'crap', 'damn', 'dick', 'fag', 'faggot',
  'hell', 'jerk', 'piss', 'rape', 'rapist', 'retard', 'sex', 'tits', 'twat', 'wank']);
const BLOCKED_ANYWHERE = ['fuck', 'shit', 'cunt', 'nigg', 'bitch', 'whore', 'slut', 'nazi', 'porn', 'penis', 'vagina'];
const hash = (value) => createHash('sha256').update(value).digest('hex');

export function cleanName(raw) {
  if (typeof raw !== 'string') return null;
  const name = raw.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (!name || [...name].length > 20 || !namePattern.test(name)) return null;
  const plain = name.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't');
  if (plain.split(/[^\p{L}]+/u).some((word) => BLOCKED_WORDS.has(word))) return null;
  const squashed = plain.replace(/[^\p{L}]/gu, '');
  if (BLOCKED_ANYWHERE.some((word) => squashed.includes(word))) return null;
  return name;
}

function bodyOf(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return req.body;
}

async function redis(...command) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error('Storage unavailable');
  const data = await response.json();
  if (data.error) throw new Error('Storage command failed');
  return data.result;
}

async function topTen() {
  const flat = await redis('ZRANGE', SCORES, 0, 9, 'WITHSCORES');
  const top = [];
  for (let i = 0; i < flat.length; i += 2) {
    let name = '';
    try { name = JSON.parse(flat[i]).name; } catch { continue; }
    top.push({ rank: top.length + 1, name, ms: Number(flat[i + 1]) });
  }
  return top;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const fail = (status, error, code) => res.status(status).json({ error, code });
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return fail(405, 'Method not allowed.');
  }
  if (!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) ||
      !(process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)) {
    return fail(503, 'The leaderboard is not set up yet.', 'SETUP_REQUIRED');
  }
  try {
    if (req.method === 'GET') return res.status(200).json({ top: await topTen() });
    const input = bodyOf(req);
    if (!input || typeof input !== 'object' || Array.isArray(input) || JSON.stringify(input).length > 1000) {
      return fail(400, 'Invalid leaderboard request.');
    }
    if (input.action === 'start') {
      const id = randomBytes(12).toString('hex');
      await redis('SET', runKey(id), Date.now(), 'EX', RUN_TTL);
      return res.status(201).json({ id });
    }
    if (typeof input.id !== 'string' || !idPattern.test(input.id)) return fail(400, 'Invalid run.');
    const key = runKey(input.id);
    if (input.action === 'finish') {
      const stored = await redis('GET', key);
      if (stored === null) return fail(404, 'This run has expired.', 'EXPIRED');
      if (String(stored).startsWith('done:')) return res.status(200).json({ ms: Number(String(stored).slice(5)) });
      const ms = Date.now() - Number(stored);
      if (!(ms >= MIN_MS)) {
        await redis('DEL', key);
        return fail(422, 'That run was too quick to count.', 'TOO_FAST');
      }
      await redis('SET', key, `done:${ms}`, 'EX', DONE_TTL);
      return res.status(200).json({ ms });
    }
    if (input.action === 'claim') {
      const name = cleanName(input.name);
      if (!name) return fail(400, 'Use up to 20 letters for your name, and keep it friendly.', 'NAME');
      const forwarded = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
      const limitKey = `nanas-garden:limit:${hash(forwarded || 'unknown')}`;
      const count = await redis('INCR', limitKey);
      if (count === 1) await redis('EXPIRE', limitKey, 60);
      if (count > 5) return fail(429, 'Too many saves at once. Try again in a minute.', 'RATE_LIMIT');
      const stored = await redis('GETDEL', key);
      if (stored === null || !String(stored).startsWith('done:')) {
        return fail(404, 'This time was already saved or has expired.', 'EXPIRED');
      }
      const ms = Number(String(stored).slice(5));
      const member = JSON.stringify({ id: input.id, name });
      await redis('ZADD', SCORES, ms, member);
      await redis('ZREMRANGEBYRANK', SCORES, KEEP, -1);
      const rank = await redis('ZRANK', SCORES, member);
      return res.status(200).json({ ms, rank: rank === null ? null : rank + 1, top: await topTen() });
    }
    return fail(400, 'Invalid leaderboard request.');
  } catch {
    return fail(503, 'The leaderboard is temporarily unavailable. Please try again.', 'CONNECTION_ERROR');
  }
}
