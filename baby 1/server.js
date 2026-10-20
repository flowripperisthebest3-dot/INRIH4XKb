const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "Fearless@Admin2026";

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Make sure uploads folder dey
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

let files = [];
let keys = {};

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage: storage });

// HOME
app.get('/', (req, res) => {
  res.send('Fearless Server Running');
});

// GET ALL FILES
app.get('/api/v1/files', (req, res) => {
  res.json({ files: files });
});

// UPLOAD TEXT FILE (no real file)
app.post('/api/v1/files', (req, res) => {
  const { title, desc, adminPassword } = req.body;
  if (adminPassword !== ADMIN_PASS) {
    return res.status(403).json({ error: "Wrong Admin Password. Must be Fearless@Admin2026" });
  }
  const newFile = {
    _id: Date.now().toString(),
    title: title,
    desc: desc,
    fileUrl: null,
    createdAt: new Date()
  };
  files.push(newFile);
  res.json({ success: true, file: newFile });
});

// UPLOAD REAL FILE - PDF, ZIP, etc
app.post('/api/v1/files/upload', upload.single('file'), (req, res) => {
  const adminPassword = req.body.adminPassword;
  const title = req.body.title;
  const desc = req.body.desc;

  if (adminPassword !== ADMIN_PASS) {
    // Delete uploaded file if password wrong
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(403).json({ error: "Wrong Admin Password" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No file selected" });
  }

  const fullUrl = req.protocol + '://' + req.get('host') + '/uploads/' + req.file.filename;

  const newFile = {
    _id: Date.now().toString(),
    title: title || req.file.originalname,
    desc: desc || "",
    fileUrl: fullUrl,
    filename: req.file.originalname,
    createdAt: new Date()
  };
  files.push(newFile);
  res.json({ success: true, file: newFile });
});

// CLEAR ALL
app.post('/api/v1/files/clear', (req, res) => {
  const { adminPassword } = req.body;
  if (adminPassword !== ADMIN_PASS) {
    return res.status(403).json({ error: "Wrong password" });
  }
  files = [];
  // Optional: delete physical files
  // fs.readdirSync('uploads').forEach(f => fs.unlinkSync(path.join('uploads', f)));
  res.json({ success: true });
});

// AUTH
app.post('/api/v1/auth/validate', (req, res) => {
  res.json({ valid: true });
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
