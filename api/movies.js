import { getMovies, readBody, send, slug } from '../lib/data.js';
import { hset, hdel } from '../lib/store.js';

const clean = (m) => {
  const title = String(m?.title || '').trim().slice(0, 120);
  const year = Number(m?.year) || null;
  const poster = /^https:\/\//.test(m?.poster || '') ? m.poster : null;
  const series = String(m?.series || '').trim().slice(0, 60) || null;
  return title ? { id: slug(title, year), title, year, poster, series } : null;
};

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      // Accepts one movie {title, year, poster} or many {movies: [...]}
      const b = await readBody(req);
      const incoming = (Array.isArray(b.movies) ? b.movies : [b]).slice(0, 50).map(clean).filter(Boolean);
      if (!incoming.length) return send(res, 400, { error: 'Add a title first.' });
      const have = new Map((await getMovies()).map((m) => [m.id, m]));
      const added = [];
      const existed = [];
      let t = Date.now();
      for (const m of incoming) {
        if (have.has(m.id)) { existed.push(have.get(m.id)); continue; }
        const movie = { ...m, addedAt: t++ };
        await hset('movies', movie.id, JSON.stringify(movie));
        have.set(movie.id, movie);
        added.push(movie);
      }
      // `movie`/`existed` kept for older pages that add one at a time
      return send(res, 200, { added, existed, movie: added[0] || existed[0], existedOne: !added.length });
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
