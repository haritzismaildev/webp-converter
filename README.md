1. jalankan server :
Node index.js
2. pastikan muncul  Server berjalan di http://localhost:3000
3. sebelum mengirim request, silahkan buat signature :
Simpan payload JSON ke file payload.json, missal :
{
  "url_gambar": "https://example.com/photo.jpg",
  "persentase_kompresi": 60
}
4. jalankan : 
node sign.js
5. uji endpoint dengan curl :
curl -X POST http://localhost:3000/convert-webp \
  -H "Content-Type: application/json" \
  -H "Authorization: HMACSHA512 <hash-dari-sign.js>" \
  --data @payload.json
6. jika anda sukses melakukan pengujian, maka seharusnya akan menerima return output hasil json :
{
  "url_webp": "http://localhost:3000/output/img-1669123456789.webp",
  "ukuran_webp": 34567,
  "status": "success",
  "message": "Konversi selesai"
}
7. Kasus Uji Error :
•	Tanpa header Authorization → HTTP 401, message “Missing or invalid auth header”.
•	Payload tidak valid
o	url_gambar kosong → HTTP 400, message “url_gambar wajib diisi…”.
o	persentase_kompresi di luar 1–100 → HTTP 400, message “persentase_kompresi antara 1–100”.
•	Gagal unduh gambar (404/timeout) → HTTP 500, message “Gagal ambil gambar (status: …)” atau “timeout”.
