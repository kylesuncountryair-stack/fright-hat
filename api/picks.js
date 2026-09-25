import { cleanName, getMovies, nameKey, readBody, send, PICKS_PER_PERSON } from '../lib/data.js';
import { hset, hdel } from '../lib/store.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const b = await readBody(req);
      const name = cleanName(b.name);
      if (!name) return send(res, 400, { error: 'Enter your name first.' });
      const valid = new Set((await getMovies()).map((m) => m.id));
      const ids = [...new Set((b.ids || []).map(String))].filter((id) => valid.has(id));
      if (ids.length !== PICKS_PER_PERSON)
        return send(res, 400, { error: `Pick exactly ${PICKS_PER_PERSON} movies (you have ${ids.length}).` });
      const pick = { name, ids, at: Date.now() };
      await hset('picks', nameKey(name), JSON.stringify(pick));
      return send(res, 200, { pick });
    }
    if (req.method === 'DELETE') {
      const name = new URL(req.url, 'http://x').searchParams.get('name');
      await hdel('picks', nameKey(name));
      return send(res, 200, { ok: true });
    }
    send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}
