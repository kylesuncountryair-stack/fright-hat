import { del, hgetall, hset, setnx } from './store.js';

// Your movie list. Posters are fetched automatically the first time the site loads.
// If you change this list later, bump SEED_VERSION and redeploy: the site will
// replace its movie list with this one (and clear picks that point to removed movies).
export const SEED_VERSION = 3;
export const SEED = [
  ['Creepshow', 1982],
  ["The 'Burbs", 1989],
  ['Alien', 1979],
  ['Aliens', 1986],
  ['Army of Darkness', 1992],
  ['Beetlejuice', 1988],
  // Child's Play
  ["Child's Play", 1988], ["Child's Play 2", 1990], ["Child's Play 3", 1991], ['Bride of Chucky', 1998],
  ['Seed of Chucky', 2004], ['Curse of Chucky', 2013], ['Cult of Chucky', 2017], ["Child's Play", 2019],
  ['Children of the Corn', 1984],
  ['Club Dread', 2004],
  ['The Craft', 1996],
  ['The Cabin in the Woods', 2011],
  ['Death Becomes Her', 1992],
  ['The Evil Dead', 1981],
  // Final Destination
  ['Final Destination', 2000], ['Final Destination 2', 2003], ['Final Destination 3', 2006],
  ['The Final Destination', 2009], ['Final Destination 5', 2011], ['Final Destination Bloodlines', 2025],
  ['Freddy vs. Jason', 2003],
  // Friday the 13th
  ['Friday the 13th', 1980], ['Friday the 13th Part 2', 1981], ['Friday the 13th Part III', 1982],
  ['Friday the 13th: The Final Chapter', 1984], ['Friday the 13th: A New Beginning', 1985],
  ['Friday the 13th Part VI: Jason Lives', 1986], ['Friday the 13th Part VII: The New Blood', 1988],
  ['Friday the 13th Part VIII: Jason Takes Manhattan', 1989], ['Jason Goes to Hell: The Final Friday', 1993],
  ['Jason X', 2001], ['Friday the 13th', 2009],
  ['Fright Night', 1985],
  ['The Gate', 1987],
  ['Ghoulies', 1985],
  ['Gremlins', 1984],
  // Halloween
  ['Halloween', 1978], ['Halloween II', 1981], ['Halloween III: Season of the Witch', 1982],
  ['Halloween 4: The Return of Michael Myers', 1988], ['Halloween 5: The Revenge of Michael Myers', 1989],
  ['Halloween: The Curse of Michael Myers', 1995], ['Halloween H20: 20 Years Later', 1998],
  ['Halloween: Resurrection', 2002], ['Halloween', 2007], ['Halloween II', 2009],
  ['Halloween', 2018], ['Halloween Kills', 2021], ['Halloween Ends', 2022],
  ['Happy Death Day', 2017],
  ['Hellraiser', 1987],
  ['House II: The Second Story', 1987],
  ['Killer Klowns from Outer Space', 1988],
  ['Little Shop of Horrors', 1986],
  ['The Lost Boys', 1987],
  ['The Monster Squad', 1987],
  // A Nightmare on Elm Street
  ['A Nightmare on Elm Street', 1984], ["A Nightmare on Elm Street 2: Freddy's Revenge", 1985],
  ['A Nightmare on Elm Street 3: Dream Warriors', 1987], ['A Nightmare on Elm Street 4: The Dream Master', 1988],
  ['A Nightmare on Elm Street 5: The Dream Child', 1989], ["Freddy's Dead: The Final Nightmare", 1991],
  ["Wes Craven's New Nightmare", 1994], ['A Nightmare on Elm Street', 2010],
  ['Poltergeist', 1982],
  ['Predator', 1987],
  ['Puppet Master', 1989],
  ['Return of the Killer Tomatoes!', 1988],
  ['The Return of the Living Dead', 1985],
  ['Sleepaway Camp', 1983],
  ['Saw', 2004],
  ['Scary Movie', 2000],
  // Scream 1-7
  ['Scream', 1996], ['Scream 2', 1997], ['Scream 3', 2000], ['Scream 4', 2011],
  ['Scream', 2022], ['Scream VI', 2023], ['Scream 7', 2026],
  ['Shaun of the Dead', 2004],
  ['Stan Helsing', 2009],
  ['They Live', 1988],
  ['Tucker & Dale vs. Evil', 2010],
  ['Urban Legend', 1998],
  ['Transylvania 6-5000', 1985],
  ['Weapons', 2025],
  ['Zombieland', 2009],
  ['Young Frankenstein', 1974],
  ['Chopping Mall', 1986],
  ['Cocoon', 1985],
  ['Critters', 1986],
  ['Ghostbusters', 1984],
  ['Ghostbusters II', 1989],
  ['The Thing', 1982],
  ['TerrorVision', 1986],
  ['Tremors', 1990],
];

export const slug = (title, year) =>
  `${String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${year || 'na'}`;

const parseAll = (obj) => Object.values(obj).map((v) => { try { return JSON.parse(v); } catch { return null; } }).filter(Boolean);

export async function ensureSeeded() {
  if (!(await setnx(`seeded:v${SEED_VERSION}`, '1'))) return;
  // New list version: replace the whole movie list (keeps posters we already found).
  const old = parseAll(await hgetall('movies'));
  const oldPosters = Object.fromEntries(old.map((m) => [m.id, m.poster]));
  await del('movies');
  let i = 0;
  for (const [title, year] of SEED) {
    const id = slug(title, year);
    await hset('movies', id, JSON.stringify({ id, title, year, poster: oldPosters[id] || null, addedAt: i++ }));
  }
}

const sortKey = (t) => t.replace(/^(the|a|an) /i, '').replace(/^[^a-z0-9]+/i, '');
// Keep each franchise together, in release order.
const FRANCHISES = [
  [/^friday the 13th|^jason (goes|x)/i, 'Friday the 13th'],
  [/nightmare on elm street|^freddy's dead|new nightmare/i, 'Nightmare on Elm Street'],
  [/^halloween/i, 'Halloween'],
  [/final destination/i, 'Final Destination'],
  [/^scream\b/i, 'Scream'],
  [/^ghostbusters/i, 'Ghostbusters'],
  [/^child's play|chucky$/i, "Child's Play"],
];
// Which series a movie belongs to: one set when it was added, else a known franchise.
export const seriesOf = (m) => m.series || (FRANCHISES.find(([re]) => re.test(m.title)) || [])[1] || null;
const groupKey = (m) => sortKey(m.series || m.title);
export const byTitle = (a, b) =>
  groupKey(a).localeCompare(groupKey(b), 'en') || (a.year || 0) - (b.year || 0) || a.title.localeCompare(b.title);

export async function getMovies() {
  await ensureSeeded();
  const movies = parseAll(await hgetall('movies')).map((m) => ({ ...m, series: seriesOf(m) }));
  return movies.sort(byTitle);
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
