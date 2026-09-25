import { readBody, send } from '../lib/data.js';
import { del } from '../lib/store.js';

// what: "draws" puts drawn movies back in the hat; "all" also clears everyone's picks.
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const { what } = await readBody(req);
    await del('draws');
    if (what === 'all') await del('picks');
    send(res, 200, { ok: true });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}
