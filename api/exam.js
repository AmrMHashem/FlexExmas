export default async function handler(req, res) {
  const { slug } = req.query;

  // بيانات مؤقتة
  // لاحقًا هنجيبها من Firebase
  const exam = {
    title: `FlexExams - ${slug}`,
    description:
      "Practice real certification exam questions with FlexExams.",
    image: "https://www.flexexams.com/og-image.png",
    url: `https://www.flexexams.com/exam/${slug}`,
  };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">

<title>${exam.title}</title>

<meta property="og:type" content="website" />
<meta property="og:title" content="${exam.title}" />
<meta property="og:description" content="${exam.description}" />
<meta property="og:image" content="${exam.image}" />
<meta property="og:url" content="${exam.url}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${exam.title}" />
<meta name="twitter:description" content="${exam.description}" />
<meta name="twitter:image" content="${exam.image}" />

<meta http-equiv="refresh" content="0; url=${exam.url}">
</head>

<body>
Redirecting...
</body>
</html>
`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
}
