import { ensureSeeded, readBody, send } from '../lib/data.js';
import { hget, hset } from '../lib/store.js';
import { findPoster } from '../lib/posters.js';

// Looks up (or manually sets) a poster for one movie and saves it.
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const b = await readBody(req);
    await ensureSeeded();
    const raw = await hget('movies', String(b.id || ''));
    if (!raw) return send(res, 404, { error: 'That movie is no longer in the list.' });
    const movie = JSON.parse(raw);
    if (typeof b.poster === 'string') {
      movie.poster = /^https:\/\//.test(b.poster) ? b.poster : '';
    } else if (movie.poster === null || b.retry) {
      movie.poster = (await findPoster(movie.title, movie.year)) || '';
    }
    await hset('movies', movie.id, JSON.stringify(movie));
    send(res, 200, { movie });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}
