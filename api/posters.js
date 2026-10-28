import { send } from '../lib/data.js';
import { posterOptions } from '../lib/posters.js';

// GET /api/posters?title=Halloween&year=1978 → { options: [{url, source}] }
export default async function handler(req, res) {
  try {
    const q = new URL(req.url, 'http://x').searchParams;
    const title = q.get('title') || '';
    if (!title) return send(res, 400, { error: 'Missing title.' });
    send(res, 200, { options: await posterOptions(title, Number(q.get('year')) || null) });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}
