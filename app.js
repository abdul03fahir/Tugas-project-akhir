// ====== IMPORT MODULE ======
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const pool = require('./db'); // pastikan db.js sudah benar

// ====== KONFIGURASI DASAR ======
const app = express();
const PORT = process.env.PORT || 3000;
const WA_NUMBER = '6285887869015';
const CV_LINK =
  process.env.CV_LINK ||
  'https://drive.google.com/drive/folders/1ogaHlUCNcvkc6Q6EBjqibsfj5Z-r6RlJ?usp=sharing';

// ====== VIEW ENGINE & STATIC FILES ======
app.engine(
  'hbs',
  exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
  })
);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// ====== UPLOAD FILE ======
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});
const upload = multer({ storage });

// ====== ROUTES ======

// Home Page
app.get('/', async (req, res) => {
  try {
    const projectsRes = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    const worksRes = await pool.query('SELECT * FROM works ORDER BY created_at DESC');

    // Parse tags dan tambahkan type
    const projects = projectsRes.rows.map(p => ({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
      type: 'project',
    }));
    const works = worksRes.rows.map(w => ({
      ...w,
      tags: w.tags ? JSON.parse(w.tags) : [],
      type: 'work',
    }));

    res.render('index', {
      title: 'My Portfolio',
      projects,
      works,
      waLink: `https://wa.me/${WA_NUMBER}`,
      cvLink: CV_LINK,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Halaman tambah project/work
app.get('/add', (req, res) => {
  const type = req.query.type === 'work' ? 'work' : 'project';
  const availableTags = ['React', 'Next.js', 'Node.js', 'MongoDB', 'Tailwind', 'Express'];

  res.render('add', {
    title: `Add ${type}`,
    type,
    availableTags,
  });
});

// Proses tambah project/work
app.post('/add', upload.single('image'), async (req, res) => {
  const { title, description, type } = req.body;
  const tags = Array.isArray(req.body.tags)
    ? req.body.tags
    : req.body.tags
    ? [req.body.tags]
    : [];
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  const table = type === 'work' ? 'works' : 'projects';

  try {
    await pool.query(
      `INSERT INTO ${table} (title, description, image, tags) VALUES ($1, $2, $3, $4)`,
      [title, description, image, JSON.stringify(tags)]
    );
    res.redirect('/');
  } catch (err) {
    console.error('SQL ERROR:', err);
    res.status(500).send('Gagal menambahkan data');
  }
});

// Hapus project/work
app.post('/delete/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const table = type === 'work' ? 'works' : 'projects';

  try {
    await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    res.redirect('/');
  } catch (err) {
    console.error('Gagal menghapus data:', err);
    res.status(500).send('Gagal menghapus data');
  }
});

// Detail Project/Work
app.get('/project/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const table = type === 'work' ? 'works' : 'projects';

  try {
    const r = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    if (r.rows.length === 0) return res.status(404).send('Data tidak ditemukan');

    const item = r.rows[0];
    item.tags = item.tags ? JSON.parse(item.tags) : [];

    res.render('detail', {
      title: 'Detail',
      item,
      waLink: `https://wa.me/${WA_NUMBER}`,
      cvLink: CV_LINK,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// ====== START SERVER ======
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
