import express from 'express';
import path from 'path';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use('/heitor-md', express.static(path.join(__dirname, '../public')));

app.get('/heitor-md/vendor/marked.min.js', (_req, res) => {
  res.sendFile(path.join(__dirname, '../node_modules/marked/marked.min.js'));
});

app.get('/heitor-md/vendor/purify.min.js', (_req, res) => {
  res.sendFile(
    path.join(__dirname, '../node_modules/dompurify/dist/purify.min.js')
  );
});

app.get('/', (_req, res) => res.redirect('/heitor-md'));

app.listen(PORT, () => {
  console.log(`Markdown editor running at http://localhost:${PORT}/heitor-md`);
});
