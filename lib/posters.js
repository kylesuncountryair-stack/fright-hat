// Poster + movie lookup.
// Uses TMDB if you set TMDB_API_KEY (best results, free key at themoviedb.org).
// Otherwise falls back to Wikipedia, then iTunes — no keys needed.

const UA = 'FrightHat/1.0 (https://github.com/; movie night picker) node-fetch';
const TMDB_KEY = process.env.TMDB_API_KEY;

const yearOf = (s) => {
  const m = String(s || '').match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
};

async function getJSON(url, headers = {}) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', ...headers } });
  if (!r.ok) throw new Error(`${r.status} from ${new URL(url).host}`);
  return r.json();
}

// ---------- TMDB ----------
async function tmdbSearch(query, year) {
  if (!TMDB_KEY) return [];
  const u = new URL('https://api.themoviedb.org/3/search/movie');
  u.searchParams.set('query', query);
  u.searchParams.set('include_adult', 'false');
  if (year) u.searchParams.set('year', year);
  // Works with either a v3 "API key" or a v4 "read access token"
  const isV4 = TMDB_KEY.length > 40;
  if (!isV4) u.searchParams.set('api_key', TMDB_KEY);
  const data = await getJSON(u, isV4 ? { Authorization: `Bearer ${TMDB_KEY}` } : {});
  return (data.results || []).map((m) => ({
    title: m.title,
    year: yearOf(m.release_date),
    poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
    source: 'tmdb',
  }));
}

// ---------- Wikipedia ----------
async function wikiSearch(query, year) {
  const u = new URL('https://en.wikipedia.org/w/api.php');
  const params = {
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrsearch: `${query}${year ? ' ' + year : ''} film`,
    gsrlimit: '10',
    prop: 'pageimages|description',
    piprop: 'thumbnail',
    pithumbsize: '500',
    pilicense: 'any', // movie posters are non-free images; without this they're skipped
  };
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const data = await getJSON(u);
  const pages = (data.query?.pages || []).sort((a, b) => a.index - b.index);
  return pages
    .filter((p) => /film/i.test(p.description || '') && !/series|franchise|soundtrack|character|actor|actress|director/i.test(p.description || ''))
    .map((p) => ({
      title: p.title.replace(/\s*\((\d{4}\s+)?(\w+\s+)?film\)\s*$/i, ''),
      year: yearOf(p.description) || yearOf(p.title),
      poster: p.thumbnail?.source || '',
      source: 'wikipedia',
    }));
}

// ---------- iTunes ----------
async function itunesSearch(query) {
  const u = new URL('https://itunes.apple.com/search');
  u.searchParams.set('term', query);
  u.searchParams.set('media', 'movie');
  u.searchParams.set('entity', 'movie');
  u.searchParams.set('limit', '10');
  const data = await getJSON(u);
  return (data.results || []).map((m) => ({
    title: m.trackName,
    year: yearOf(m.releaseDate),
    poster: m.artworkUrl100 ? m.artworkUrl100.replace(/\/\d+x\d+bb\./, '/600x900bb.') : '',
    source: 'itunes',
  }));
}

async function safe(p) {
  try {
    return await p;
  } catch (e) {
    console.warn('lookup failed:', e.message);
    return [];
  }
}

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Candidates for the "add a movie" search box.
export async function searchMovies(query) {
  const q = String(query || '').trim();
  if (!q) return [];
  const year = yearOf(q);
  const bare = year ? q.replace(String(year), '').trim() : q;

  let results = await safe(tmdbSearch(bare, year));
  if (!results.length) {
    const [wiki, itunes] = await Promise.all([safe(wikiSearch(bare, year)), safe(itunesSearch(bare))]);
    results = [...wiki, ...itunes];
  }
  // de-dupe by title+year, prefer ones with posters
  const seen = new Map();
  for (const r of results) {
    const k = norm(r.title) + ':' + (r.year || '');
    const prev = seen.get(k);
    if (!prev || (!prev.poster && r.poster)) seen.set(k, r);
  }
  return [...seen.values()].slice(0, 10);
}

// Best poster for a known title + year.
export async function findPoster(title, year) {
  const pick = (list) => {
    const withPoster = list.filter((r) => r.poster);
    const near = (r) => !year || !r.year || Math.abs(r.year - year) <= 1;
    const t = norm(title);
    const exact = withPoster.find((r) => norm(r.title) === t && near(r));
    const close = withPoster.find((r) => near(r) && (norm(r.title).startsWith(t) || t.startsWith(norm(r.title))));
    return (exact || close || null)?.poster || '';
  };

  let poster = pick(await safe(tmdbSearch(title, year)));
  if (!poster) poster = pick(await safe(wikiSearch(title, year)));
  if (!poster) poster = pick(await safe(itunesSearch(title)));
  return poster;
}
