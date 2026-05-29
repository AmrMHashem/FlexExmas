// api/share.js — FlexExams Social Share Handler v5 (hardcoded config)

const FIREBASE_PROJECT_ID = 'exampro-1e4de';
const FIREBASE_API_KEY    = 'AIzaSyCHbNx6tveBKqN3BwKzK8Ap23d8DHmUSGs';

const SOCIAL_BOTS = [
  'facebookexternalhit','facebot','linkedinbot','twitterbot',
  'whatsapp','telegrambot','slackbot','discordbot',
  'googlebot','bingbot','applebot','pinterest',
];
function isSocialBot(ua=''){return SOCIAL_BOTS.some(b=>ua.toLowerCase().includes(b));}

function fv(field) {
  if (!field) return '';
  return field.stringValue ?? String(field.integerValue ?? field.doubleValue ?? '');
}

export default async function handler(req, res) {
  const slug = req.query.slug || '';
  if (!slug) return res.redirect(302, '/');

  const examUrl  = `https://www.flexexams.com/exam/${slug}`;
  const shareUrl = `https://www.flexexams.com/share/exam/${slug}`;
  const ua       = req.headers['user-agent'] || '';

  let exam = null;
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          structuredQuery: {
            from: [{collectionId:'exams'}],
            where: {fieldFilter:{field:{fieldPath:'slug'},op:'EQUAL',value:{stringValue:slug}}},
            limit: 1
          }
        })
      }
    );
    const data = await r.json();
    const f    = data?.[0]?.document?.fields;
    if (f) {
      exam = {
        title: fv(f.title) || fv(f.name) || fv(f.examName) || '',
        description: fv(f.description) || fv(f.shortDescription) || '',
        image: fv(f.image) || fv(f.thumbnail) || fv(f.imageUrl) || fv(f.coverImage) || '',
      };
    }

    // Debug mode
    if (req.query.debug === '1') {
      res.setHeader('Content-Type','application/json');
      return res.status(200).json({
        slug,
        examFound: !!f,
        fields: f ? Object.keys(f) : [],
        exam,
        rawSample: f ? JSON.stringify(f).substring(0,800) : null
      });
    }
  } catch(e) {
    console.error('[share]', e);
  }

  const title = exam?.title || 'Certification Exam Practice';
  const desc  = (exam?.description || `Practice real ${title} exam questions with FlexExams. Timed tests, instant feedback, and AI-powered explanations.`).substring(0,200);
  const image = exam?.image || 'https://www.flexexams.com/og-image.png';
  const bot   = isSocialBot(ua);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title} | FlexExams</title>
  <meta name="description" content="${desc}"/>
  <meta property="og:type"         content="website"/>
  <meta property="og:site_name"    content="FlexExams"/>
  <meta property="og:title"        content="${title}"/>
  <meta property="og:description"  content="${desc}"/>
  <meta property="og:url"          content="${shareUrl}"/>
  <meta property="og:image"        content="${image}"/>
  <meta property="og:image:width"  content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:image:alt"    content="${title} — FlexExams"/>
  <meta property="og:locale"       content="en_US"/>
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:site"        content="@FlexExams"/>
  <meta name="twitter:title"       content="${title}"/>
  <meta name="twitter:description" content="${desc}"/>
  <meta name="twitter:image"       content="${image}"/>
  <link rel="canonical" href="${shareUrl}"/>
  ${!bot ? `<script>window.location.replace("${examUrl}");</script>` : ''}
</head>
<body style="font-family:sans-serif;text-align:center;padding:60px;background:#0d1223;color:#eef1fb">
  <h2 style="color:#a5b4fc">${title}</h2>
  <p style="color:#9bb6f0;max-width:500px;margin:0 auto">${desc}</p>
  <a href="${examUrl}" style="display:inline-block;margin-top:24px;padding:12px 28px;border-radius:10px;background:#4f46e5;color:#fff;text-decoration:none;font-size:15px">Start Practice →</a>
</body>
</html>`;

  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','s-maxage=3600,stale-while-revalidate=86400');
  res.status(200).send(html);
}
