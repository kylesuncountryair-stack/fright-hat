// Tiny storage layer.
// On Vercel: uses Upstash Redis over its REST API (env vars are added
// automatically when you connect an Upstash Redis database in Vercel → Storage).
// Locally (no env vars): falls back to an in-memory store so you can test.

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const usingRedis = Boolean(URL_ && TOKEN);

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const data = await r.json();
  if (data.error) throw new Error(`Redis: ${data.error}`);
  return data.result;
}

// ---- in-memory fallback (local dev only) ----
const mem = globalThis.__frightMem || (globalThis.__frightMem = { hashes: {}, lists: {}, keys: {} });

const PREFIX = 'frighthat:';

export async function hgetall(key) {
  if (!usingRedis) return { ...(mem.hashes[key] || {}) };
  const flat = (await redis(['HGETALL', PREFIX + key])) || [];
  const out = {};
  for (let i = 0; i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
  return out;
}

export async function hget(key, field) {
  if (!usingRedis) return (mem.hashes[key] || {})[field] ?? null;
  return redis(['HGET', PREFIX + key, field]);
}

export async function hset(key, field, value) {
  if (!usingRedis) {
    (mem.hashes[key] ||= {})[field] = value;
    return 1;
  }
  return redis(['HSET', PREFIX + key, field, value]);
}

export async function hdel(key, field) {
  if (!usingRedis) {
    delete (mem.hashes[key] || {})[field];
    return 1;
  }
  return redis(['HDEL', PREFIX + key, field]);
}

export async function lrange(key) {
  if (!usingRedis) return [...(mem.lists[key] || [])];
  return (await redis(['LRANGE', PREFIX + key, 0, -1])) || [];
}

export async function rpush(key, value) {
  if (!usingRedis) return (mem.lists[key] ||= []).push(value);
  return redis(['RPUSH', PREFIX + key, value]);
}

export async function del(key) {
  if (!usingRedis) {
    delete mem.hashes[key];
    delete mem.lists[key];
    delete mem.keys[key];
    return 1;
  }
  return redis(['DEL', PREFIX + key]);
}

// SET key value NX — returns true if we set it (first caller wins)
export async function setnx(key, value) {
  if (!usingRedis) {
    if (key in mem.keys) return false;
    mem.keys[key] = value;
    return true;
  }
  return (await redis(['SET', PREFIX + key, value, 'NX'])) === 'OK';
}
