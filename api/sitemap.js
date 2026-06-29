const PROJECT_ID = 'exampro-1e4de';
const API_KEY    = 'AIzaSyCHbNx6tveBKqN3BwKzK8Ap23d8DHmUSGs';
const BASE_URL   = 'https://www.flexexams.com';
const FS_BASE    = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const CACHE_TTL = 60 * 60 * 1000;
let _cache = { xml: null, ts: 0 };

const fv = f => f ? String(f.stringValue ?? f.integerValue ?? f.doubleValue ?? '').trim() : '';

const slugify = (text) =>
  (text || '').toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 70) || 'exam';

const xmlEscape = (s = '') =>
  String(s).replace(/[<>&'"]/g, c =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

const toIsoDate = (val) => {
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
  } catch { return new Date().toISOString().split('T')[0]; }
};

async function fetchAllExams() {
  const exams = [];
  try {
    const r = await fetch(`${FS_BASE}:runQuery?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'exams' }],
          where: { fieldFilter: { field: { fieldPath: 'isActive' }, op: 'EQUAL', value: { booleanValue: true } } },
          limit: 1000,
        }
      }),
    });
    if (!r.ok) throw new Error(`runQuery ${r.status}`);
    const docs = await r.json();
    for (const row of (docs || []).filter(d => d.document)) {
      const fields = row.document.fields || {};
      const title = fv(fields.title) || fv(fields.name) || fv(fields.examName);
      if (!title) continue;
      exams.push({
        slug: slugify(title),
        updatedAt: fv(fields.updatedAt) || row.document.updateTime || '',
      });
    }
  } catch (e) {
    console.error('[sitemap] fetchAllExams error:', e.message);
  }
  return exams;
}

function buildXml(exams) {
  const today = new Date().toISOString().split('T')[0];
  const staticPages = [
    { loc: `${BASE_URL}/`,                  priority: '1.0', changefreq: 'daily',   lastmod: today },
    { loc: `${BASE_URL}/exams`,             priority: '0.9', changefreq: 'daily',   lastmod: today },
    { loc: `${BASE_URL}/topics`,            priority: '0.8', changefreq: 'weekly',  lastmod: today },
    { loc: `${BASE_URL}/categories`,        priority: '0.8', changefreq: 'weekly',  lastmod: today },
    { loc: `${BASE_URL}/pricing`,           priority: '0.7', changefreq: 'monthly', lastmod: today },
    { loc: `${BASE_URL}/career-diagnostic`, priority: '0.7', changefreq: 'monthly', lastmod: today },
    { loc: `${BASE_URL}/verify`,            priority: '0.6', changefreq: 'monthly', lastmod: today },
    { loc: `${BASE_URL}/leaderboard`,       priority: '0.5', changefreq: 'weekly',  lastmod: today },
    { loc: `${BASE_URL}/about`,             priority: '0.5', changefreq: 'monthly', lastmod: today },
    { loc: `${BASE_URL}/contact`,           priority: '0.5', changefreq: 'monthly', lastmod: today },
    { loc: `${BASE_URL}/terms`,             priority: '0.4', changefreq: 'monthly', lastmod: today },
  ];

  const all = [
    ...staticPages,
    ...exams.map(ex => ({
      loc: `${BASE_URL}/exam/${xmlEscape(ex.slug)}`,
      priority: '0.85',
      changefreq: 'weekly',
      lastmod: toIsoDate(ex.updatedAt),
    }))
  ];

  const body = all.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

export default async function handler(req, res) {
  try {
    const now = Date.now();
    if (_cache.xml && (now - _cache.ts) < CACHE_TTL) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).send(_cache.xml);
    }
    const exams = await fetchAllExams();
    const xml = buildXml(exams);
    _cache = { xml, ts: now };
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('[sitemap] error:', err.message);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send(buildXml([]));
  }
}
