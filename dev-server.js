// Local preview: `npm run dev` then open http://localhost:3000
// Uses an in-memory store unless KV_REST_API_URL / KV_REST_API_TOKEN are set.
import http from 'node:http';
import { readFile } from 'node:fs/promises';

const routes = ['state', 'movies', 'poster', 'posters', 'search', 'picks', 'draw', 'reset'];
const handlers = Object.fromEntries(
  await Promise.all(routes.map(async (r) => [r, (await import(`./api/${r}.js`)).default]))
);

http
  .createServer(async (req, res) => {
    const path = new URL(req.url, 'http://x').pathname;
    const m = path.match(/^\/api\/(\w+)$/);
    if (m && handlers[m[1]]) return handlers[m[1]](req, res);
    if (path === '/' || path === '/index.html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end(await readFile('./public/index.html'));
    }
    res.statusCode = 404;
    res.end('Not found');
  })
  .listen(process.env.PORT || 3000, () => console.log(`Fright Hat running at http://localhost:${process.env.PORT || 3000}`));
