// api/share.js — FlexExams Social Share Handler v2
// Facebook/bots → يقرأ OG tags مباشرة (بدون redirect)
// المستخدم العادي → JS redirect للـ exam page

const SOCIAL_BOTS = [
  'facebookexternalhit', 'facebot', 'linkedinbot', 'twitterbot',
  'whatsapp', 'telegrambot', 'slackbot', 'discordbot',
  'googlebot', 'bingbot', 'applebot', 'pinterest',
];

function isSocialBot(ua = '') {
  const lower = ua.toLowerCase();
  return SOCIAL_BOTS.some(bot => lower.includes(bot));
}

export default async function handler(req, res) {
  const slug = req.url?.split('/share/exam/')?.[1]?.replace(/\/$/, '') || '';

  if (!slug) return res.redirect(302, '/');

  const examUrl  = `https://www.flexexams.com/exam/${slug}`;
  const shareUrl = `https://www.flexexams.com/share/exam/${slug}`;
  const ua       = req.headers['user-agent'] || '';

  // ── جيب بيانات الاختبار من Firestore ──
  let exam = null;
  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const apiKey    = process.env.VITE_FIREBASE_API_KEY;

    if (projectId && apiKey) {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
      const r   = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'exams' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'slug' },
                op: 'EQUAL',
                value: { stringValue: slug }
              }
            },
            limit: 1
          }
        })
      });
      const data = await r.json();
      const f    = data?.[0]?.document?.fields;
      if (f) {
        exam = {
          title:       f.title?.stringValue || f.name?.stringValue || '',
          description: f.description?.stringValue || '',
          image:       f.image?.stringValue || f.thumbnail?.stringValue || f.imageUrl?.stringValue || '',
        };
      }
    }
  } catch (e) {
    console.error('[share]', e);
  }

  const title = exam?.title || 'Certification Exam Practice';
  const desc  = (exam?.description || `Practice real ${title} exam questions with FlexExams. Timed tests, instant feedback, and AI-powered explanations.`).substring(0, 200);
  const image = exam?.image || 'https://www.flexexams.com/og-image.png';
  const bot   = isSocialBot(ua);

  // ── HTML مشترك للـ OG tags ──
  // بالنسبة للـ bots: مفيش redirect — بس meta tags
  // بالنسبة للمستخدم: JS redirect فوري
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | FlexExams</title>
  <meta name="description" content="${desc}" />

  <meta property="og:type"         content="website" />
  <meta property="og:site_name"    content="FlexExams" />
  <meta property="og:title"        content="${title}" />
  <meta property="og:description"  content="${desc}" />
  <meta property="og:url"          content="${shareUrl}" />
  <meta property="og:image"        content="${image}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt"    content="${title} — FlexExams" />
  <meta property="og:locale"       content="en_US" />

  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:site"        content="@FlexExams" />
  <meta name="twitter:title"       content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image"       content="${image}" />

  <link rel="canonical" href="${shareUrl}" />
  ${!bot ? `<script>window.location.replace("${examUrl}");</script>` : ''}
</head>
<body style="font-family:sans-serif;text-align:center;padding:60px;background:#0d1223;color:#eef1fb">
  <h2 style="color:#a5b4fc">${title}</h2>
  <p style="color:#9bb6f0">${desc}</p>
  <a href="${examUrl}" style="display:inline-block;margin-top:20px;padding:12px 28px;border-radius:10px;background:#4f46e5;color:#fff;text-decoration:none;font-size:15px">Start Practice →</a>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(html);
}
