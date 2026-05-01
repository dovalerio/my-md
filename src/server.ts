import express from 'express';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '../public')));

app.get('/vendor/marked.min.js', (_req, res) => {
  res.sendFile(path.join(__dirname, '../node_modules/marked/marked.min.js'));
});

app.get('/vendor/purify.min.js', (_req, res) => {
  res.sendFile(
    path.join(__dirname, '../node_modules/dompurify/dist/purify.min.js')
  );
});

app.listen(PORT, () => {
  console.log(`Markdown editor running at http://localhost:${PORT}`);
});
