import { send } from '../lib/data.js';
import { searchMovies } from '../lib/posters.js';

export default async function handler(req, res) {
  try {
    const q = new URL(req.url, 'http://x').searchParams.get('q') || '';
    send(res, 200, { results: await searchMovies(q) });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}
