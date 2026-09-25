import { randomInt } from 'node:crypto';
import { cleanName, getMovies, getPicks, readBody, send } from '../lib/data.js';
import { lrange, rpush } from '../lib/store.js';

// Pulls one ticket from the hat. Every pick is a ticket, so a movie
// picked by 3 people has 3 tickets. Movies already drawn tonight are skipped.
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const b = await readBody(req);
    const [movies, picks, drawsRaw] = await Promise.all([getMovies(), getPicks(), lrange('draws')]);
    const known = new Set(movies.map((m) => m.id));
    const drawn = new Set(drawsRaw.map((d) => JSON.parse(d).id));
    const tickets = picks.flatMap((p) => p.ids).filter((id) => known.has(id) && !drawn.has(id));
    if (!tickets.length) return send(res, 400, { error: picks.length ? 'The hat is empty. Every picked movie has been drawn.' : 'Nobody has put picks in the hat yet.' });
    const id = tickets[randomInt(tickets.length)];
    const draw = {
      id,
      at: Date.now(),
      by: cleanName(b.by) || null,
      tickets: tickets.filter((t) => t === id).length,
      total: tickets.length,
    };
    await rpush('draws', JSON.stringify(draw));
    send(res, 200, { draw });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}
