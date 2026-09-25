import { hgetall, hset, setnx } from './store.js';

// Starter library. Posters are fetched automatically the first time the site loads.
export const SEED = [
  ['The Shining', 1980], ['The Exorcist', 1973], ['Halloween', 1978], ['Alien', 1979],
  ['The Thing', 1982], ['A Nightmare on Elm Street', 1984], ['The Texas Chain Saw Massacre', 1974],
  ["Rosemary's Baby", 1968], ['Scream', 1996], ['The Ring', 2002], ['28 Days Later', 2002],
  ['The Others', 2001], ['The Descent', 2005], ['Paranormal Activity', 2007], ['Insidious', 2010],
  ['The Cabin in the Woods', 2011], ['Sinister', 2012], ['The Conjuring', 2013], ['It Follows', 2014],
  ['The Babadook', 2014], ['The Witch', 2015], ['Train to Busan', 2016], ['Get Out', 2017],
  ['Hereditary', 2018], ['A Quiet Place', 2018], ['Midsommar', 2019], ['Us', 2019],
  ['Barbarian', 2022], ['Talk to Me', 2022], ['Smile', 2022], ['X', 2022], ['Pearl', 2022],
  ['Evil Dead Rise', 2023], ['Late Night with the Devil', 2023], ['Longlegs', 2024],
  ['The Substance', 2024], ['Heretic', 2024], ['Nosferatu', 2024], ['Sinners', 2025], ['Weapons', 2025],
];

export const slug = (title, year) =>
  `${String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${year || 'na'}`;

const parseAll = (obj) => Object.values(obj).map((v) => { try { return JSON.parse(v); } catch { return null; } }).filter(Boolean);

export async function ensureSeeded() {
  if (!(await setnx('seeded', '1'))) return;
  let i = 0;
  for (const [title, year] of SEED) {
    const id = slug(title, year);
    await hset('movies', id, JSON.stringify({ id, title, year, poster: null, addedAt: i++ }));
  }
}

export async function getMovies() {
  await ensureSeeded();
  const movies = parseAll(await hgetall('movies'));
  return movies.sort((a, b) => a.title.replace(/^(the|a|an) /i, '').localeCompare(b.title.replace(/^(the|a|an) /i, '')));
}

export async function getPicks() {
  return parseAll(await hgetall('picks')).sort((a, b) => a.at - b.at);
}

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch { return {}; }
}

export const cleanName = (n) => String(n || '').trim().replace(/\s+/g, ' ').slice(0, 24);
export const nameKey = (n) => cleanName(n).toLowerCase();

export const PICKS_PER_PERSON = 5;
