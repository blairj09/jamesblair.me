// Test-only Upstash REST adapter. Executes the production Lua script in real
// Redis, without cloud credentials. Never used by the deployed API.
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const run = promisify(execFile);
export async function redisHarness() {
  const folder = await mkdtemp(join(tmpdir(), 'poll-'));
  const socket = join(folder, 'redis.sock');
  const prefix = process.env.POLL_REDIS_BIN || '';
  const cli = prefix ? join(prefix, 'redis-cli') : 'redis-cli';
  const server = prefix ? join(prefix, 'redis-server') : 'redis-server';
  const child = spawn(server, ['--port', '0', '--unixsocket', socket,
    '--save', '', '--appendonly', 'no'], { stdio: 'ignore' });
  let spawnError;
  child.on('error', error => { spawnError = error; });
  async function command(args) {
    const { stdout } = await run(cli, ['-s', socket, '--json', ...args.map(String)]);
    return JSON.parse(stdout);
  }
  let connected = false;
  for (let i = 0; i < 100; i++) {
    if (spawnError) throw spawnError;
    try { await command(['PING']); connected = true; break; }
    catch { await new Promise(resolve => setTimeout(resolve, 25)); }
  }
  if (!connected) { child.kill(); throw new Error('Local test Redis did not start.'); }
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (url !== 'https://poll-test.invalid') return originalFetch(url, options);
    const result = await command(JSON.parse(options.body));
    return new Response(JSON.stringify({ result }), { headers: { 'Content-Type': 'application/json' } });
  };
  const keys = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'POLL_ADMIN_KEY'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.UPSTASH_REDIS_REST_URL = 'https://poll-test.invalid';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-only';
  process.env.POLL_ADMIN_KEY = 'test-instructor-key';
  return {
    command,
    async close() {
      globalThis.fetch = originalFetch;
      for (const key of keys) {
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
      const exited = new Promise(resolve => child.once('exit', resolve));
      child.kill();
      await exited;
      await rm(folder, { recursive: true, force: true });
    }
  };
}
