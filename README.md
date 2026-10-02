# Doorprize Ibadah Oikumene

Aplikasi undian doorprize untuk ibadah oikumene mingguan (Kamis) di Kantor Pusat. Berjalan **offline di satu laptop** (laptop multimedia), data tersimpan di SQLite lokal dengan log audit.

## Panduan Operator (Windows)

### Persiapan sekali saja
1. Pasang **Python 3.11+** dari python.org (centang *Add python.exe to PATH*).
2. Salin folder aplikasi ini ke laptop, termasuk folder `dist` (hasil build tampilan).
   Jika `dist` tidak ada, laptop memerlukan Node.js 20+ agar `start.bat` dapat membangunnya.
3. Klik dua kali **`start.bat`**. Pada jalan pertama:
   - lingkungan Python disiapkan otomatis;
   - Anda diminta membuat **password admin** (min. 8 karakter).
4. Browser terbuka di `http://127.0.0.1:8000`. Jangan tutup jendela hitam (server) selama acara.

### Setiap Kamis
1. Jalankan `start.bat` → login.
2. Klik **Buat Sesi** (tanggal hari ini terisi otomatis).
3. **Impor Peserta (CSV)** dari daftar hadir, cek preview, klik **Simpan**.
   - Kolom: `nama,unit` (format lama tetap didukung) atau `nip,nama,unit`.
   - File Excel "CSV (pemisah titik koma)" juga diterima.
4. Klik **Buka Layar Proyektor**, seret jendela ke layar proyektor, tekan ikon layar penuh / F11.
5. Isi jumlah pemenang → **Mulai Undian** → konfirmasi. **Undian hanya bisa sekali per sesi.**
   Pemenang tampil otomatis satu per satu (±2,7 detik per orang) dengan suara & confetti.
   Suara dibuat langsung di browser (tanpa file); tombol speaker di pojok kanan atas untuk mute.
6. Kembali ke panel admin: tandai tiap pemenang **Diambil** atau **Hangus**.
7. **Unduh CSV** hasil untuk laporan panitia.

### Master pegawai SDM (opsional, disarankan)
Tab **Data Pegawai (SDM)** → impor CSV `nip,nama,unit`. Setelah itu peserta yang diimpor dengan NIP,
atau dengan nama yang cocok, otomatis memakai nama & unit resmi. Manfaatnya: unit seragam, dan opsi
**"Kecualikan pemenang N minggu terakhir"** dapat mengenali orang yang sama antar minggu.

### Backup & keamanan
- Setiap `start.bat` dijalankan, database dicadangkan ke `backend\data\backups\` (60 terakhir disimpan).
- Server hanya dapat diakses dari laptop itu sendiri (127.0.0.1), tidak terbuka ke jaringan.
- Ganti password: `backend\.venv\Scripts\python -m app.cli set-password` dari folder `backend`.
- Verifikasi ulang undian lama: tombol **Verifikasi** di panel, atau `python -m app.cli verify-draw <id>`.

## Technical notes

- **Backend**: FastAPI + SQLite (`backend/app`). Tables: `employees`, `sessions`, `attendees`, `draws`,
  `draw_winners`, `audit_log`. Every mutation writes an audit row and a line to `backend/data/logs/doorprize.log`.
- **Draw**: server-side. The eligible list is canonicalised (sorted person keys), hashed (SHA-256) and stored
  with a 256-bit random seed; winners = `random.Random(seed).sample(eligible, k)`. Re-running with the stored
  list and seed reproduces the result exactly (`/api/draws/{id}/verify`). One draw per session (DB unique
  constraint); the attendee list is locked afterwards.
- **Auth**: single admin password (scrypt), HMAC-signed HttpOnly SameSite=Strict cookie, 5-attempt lockout.
- **Frontend**: React + Vite + Tailwind (`src/`), served by FastAPI from `dist/`.

### Development
```bash
# backend
python -m venv backend/.venv && backend/.venv/bin/pip install -r backend/requirements-dev.txt
cd backend && .venv/bin/python -m pytest && .venv/bin/python -m app.cli serve --no-browser
# frontend (proxies /api to :8000)
npm ci && npm run dev
```
`npm run build && npm run lint` must pass before merging.
