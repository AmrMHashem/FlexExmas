export default function handler(req, res) {
  const { slug } = req.query;

  const title = `FlexExams - ${slug}`;
  const image = "https://www.flexexams.com/og-image.png";
  const url = `https://www.flexexams.com/exam/${slug}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">

  <meta property="og:title" content="${title}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">

  <meta http-equiv="refresh" content="0; url=${url}">
</head>
<body></body>
</html>
`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
}