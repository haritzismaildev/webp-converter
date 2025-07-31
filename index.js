require('dotenv').config();
const express = require('express');
const crypto  = require('crypto');
const axios   = require('axios');
const fs      = require('fs');
const path    = require('path');

const {
  PORT,
  SECRET_KEY,
  BASE_URL,
  OUTPUT_DIR
} = process.env;

const app = express();

// Tangkap raw JSON body untuk HMAC
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));

// Middleware: Verifikasi HMAC SHA-512
app.use((req, res, next) => {
  const auth = req.get('Authorization') || '';
  const [scheme, hash] = auth.split(' ');

  if (scheme !== 'HMACSHA512' || !hash) {
    return res.status(401).json({ status: 'error', message: 'Missing or invalid auth header' });
  }

  const hmac = crypto
    .createHmac('sha512', SECRET_KEY)
    .update(req.rawBody)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(hash))) {
    return res.status(401).json({ status: 'error', message: 'Invalid signature' });
  }
  next();
});

// Endpoint POST /convert-webp
app.post('/convert-webp', async (req, res) => {
  const { url_gambar, persentase_kompresi } = req.body;

  if (!url_gambar || typeof url_gambar !== 'string') {
    return res.status(400).json({ status: 'error', message: 'url_gambar wajib diisi dan harus string' });
  }
  const quality = parseInt(persentase_kompresi, 10);
  if (isNaN(quality) || quality < 1 || quality > 100) {
    return res.status(400).json({ status: 'error', message: 'persentase_kompresi antara 1–100' });
  }

  try {
    const resp = await axios.get(url_gambar, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    if (resp.status !== 200) {
      throw new Error(`Gagal ambil gambar (status: ${resp.status})`);
    }

    const outputBuffer = await require('sharp')(resp.data)
      .webp({ quality })
      .toBuffer();

    const fileName = `img-${Date.now()}.webp`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(filePath, outputBuffer);

    const ukuran_webp = fs.statSync(filePath).size;
    const url_webp    = `${BASE_URL}/${OUTPUT_DIR}/${fileName}`;

    return res.json({
      url_webp,
      ukuran_webp,
      status: 'success',
      message: 'Konversi selesai'
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Internal server error'
    });
  }
});

// Serve file WebP
app.use(`/${OUTPUT_DIR}`, express.static(OUTPUT_DIR));

// Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});