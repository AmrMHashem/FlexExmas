// api/share.js — FlexExams Social Share Handler
// Vercel Serverless Function
// يقرأ بيانات الاختبار من Firestore ويرجع HTML بـ OG tags صحيحة
// لا يحتاج Firebase Admin SDK — يستخدم Firestore REST API (بدون auth لأن exams public)

export default async function handler(req, res) {
  // استخرج الـ slug من الـ URL
  const slug = req.url?.split('/share/exam/')?.[1]?.replace(/\/$/, '') || '';

  if (!slug) {
    return res.redirect(302, '/');
  }

  let exam = null;

  try {
    // Firestore REST API — exams collection قراءتها public (allow read: if true)
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const apiKey    = process.env.VITE_FIREBASE_API_KEY;

    if (projectId) {
      // ابحث عن الاختبار بالـ slug
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;

      const queryBody = {
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
      };

      const firestoreRes = await fetch(firestoreUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryBody)
      });

      const data = await firestoreRes.json();
      const doc  = data?.[0]?.document?.fields;

      if (doc) {
        exam = {
          title:       doc.title?.stringValue       || doc.name?.stringValue  || '',
          description: doc.description?.stringValue || '',
          image:       doc.image?.stringValue        || doc.thumbnail?.stringValue || doc.imageUrl?.stringValue || '',
          slug:        doc.slug?.stringValue         || slug,
          questionsCount: doc.questionsCount?.integerValue || doc.totalQuestions?.integerValue || '',
          category:    doc.category?.stringValue     || '',
          vendor:      doc.vendor?.stringValue       || '',
          price:       doc.price?.doubleValue        || doc.price?.integerValue || 0,
        };
      }
    }
  } catch (err) {
    console.error('[share] Firestore fetch error:', err);
  }

  // Fallback لو مش لاقي الاختبار
  const title       = exam?.title       || 'Certification Exam Practice';
  const description = exam?.description
    ? exam.description.substring(0, 160)
    : `Practice real ${title} exam questions with FlexExams. Timed tests, instant feedback, and AI-powered explanations.`;
  const image       = exam?.image       || 'https://www.flexexams.com/og-image.png';
  const examUrl     = `https://www.flexexams.com/exam/${slug}`;
  const shareUrl    = `https://www.flexexams.com/share/exam/${slug}`;

  const extraMeta = exam?.questionsCount
    ? `<meta name="description" content="${description}" />`
    : `<meta name="description" content="${description}" />`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>${title} | FlexExams</title>
  ${extraMeta}

  <!-- Open Graph -->
  <meta property="og:type"        content="website" />
  <meta property="og:site_name"   content="FlexExams" />
  <meta property="og:title"       content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url"         content="${shareUrl}" />
  <meta property="og:image"       content="${image}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt"   content="${title} — FlexExams" />
  <meta property="og:locale"      content="en_US" />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:site"        content="@FlexExams" />
  <meta name="twitter:title"       content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image"       content="${image}" />

  <!-- Redirect to exam page -->
  <meta http-equiv="refresh" content="0; url=${examUrl}" />
  <link rel="canonical" href="${shareUrl}" />
</head>
<body>
  <p style="font-family:sans-serif;text-align:center;padding:40px;color:#555">
    Redirecting to <a href="${examUrl}">${title}</a>...
  </p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Cache لمدة 1 ساعة عند Vercel CDN
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(html);
}