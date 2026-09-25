import { getMovies, readBody, send, slug } from '../lib/data.js';
import { hset, hdel } from '../lib/store.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const b = await readBody(req);
      const title = String(b.title || '').trim().slice(0, 120);
      const year = Number(b.year) || null;
      if (!title) return send(res, 400, { error: 'Add a title first.' });
      const poster = /^https:\/\//.test(b.poster || '') ? b.poster : null;
      const id = slug(title, year);
      const existing = (await getMovies()).find((m) => m.id === id);
      if (existing) return send(res, 200, { movie: existing, existed: true });
      const movie = { id, title, year, poster, addedAt: Date.now() };
      await hset('movies', id, JSON.stringify(movie));
      return send(res, 200, { movie });
    }
    if (req.method === 'DELETE') {
      const id = new URL(req.url, 'http://x').searchParams.get('id');
      if (!id) return send(res, 400, { error: 'Missing movie id.' });
      await hdel('movies', id);
      return send(res, 200, { ok: true });
    }
    send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}
