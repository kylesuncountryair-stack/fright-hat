import { getMovies, getPicks, send } from '../lib/data.js';
import { lrange, usingRedis } from '../lib/store.js';

export default async function handler(req, res) {
  try {
    const [movies, picks, drawsRaw] = await Promise.all([getMovies(), getPicks(), lrange('draws')]);
    const draws = drawsRaw.map((d) => JSON.parse(d));
    send(res, 200, { movies, picks, draws, persistent: usingRedis });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}
