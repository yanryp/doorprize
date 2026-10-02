# Review & Saran Improvement — Aplikasi Doorprize Ibadah Oikumene

Tanggal uji: 2 Oktober 2026 · Cara uji: `npm ci` lalu `vite` (dev server), alur dijalankan otomatis dengan Playwright (HP 390×844 untuk peserta, laptop 1600×900 untuk admin/proyektor), memakai `data1.csv` (500 peserta).

## Status implementasi (v2)

Keputusan: FastAPI, input peserta tetap lewat impor CSV di laptop multimedia (tanpa HP jemaat), undian 1x per sesi, pemenang tidak hadir = hangus.

| Temuan | Status |
|---|---|
| Data di localStorage per perangkat | Diganti SQLite di backend FastAPI lokal |
| Password di kode frontend | Login server-side (scrypt + cookie HttpOnly), lockout 5x gagal |
| Build produksi gagal | Diperbaiki; file mati & komponen tidak terpakai dihapus |
| Pemenang tidak tersimpan / hilang saat refresh | Tersimpan per sesi; layar proyektor memuat ulang hasil yang sama |
| Pengacakan bias | `random.Random(seed).sample` di server, seed + hash daftar peserta disimpan, bisa diverifikasi |
| Undian bisa diulang | Dikunci 1x per sesi (constraint DB), daftar peserta terkunci setelah undian |
| Tidak ada audit trail | Tabel `audit_log` + file log berotasi; status Diambil/Hangus tercatat |
| Durasi undian tergantung jumlah peserta | Tetap ±6 detik + 0,9 detik per pemenang |
| Parser CSV naif | Modul `csv` Python; BOM, `;` (Excel Indonesia), kutip, duplikat ditangani |
| Unit tidak seragam | Master SDM (opsional) menyeragamkan nama & unit lewat NIP / nama |
| Pemenang berulang antar minggu | Opsi "kecualikan pemenang N minggu terakhir" (default mati) |

Screenshot versi baru: `screenshots/v2-*.png`. Screenshot di bawah ini adalah kondisi **sebelum** perbaikan.

## Screenshot (sebelum)

| # | File | Keterangan |
|---|------|------------|
| 1 | `screenshots/01-registrasi-hp.png` | Form pendaftaran di HP peserta |
| 2 | `screenshots/02-registrasi-berhasil.png` | Toast "berhasil terdaftar" |
| 3 | `screenshots/03-registrasi-duplikat.png` | Cek duplikat (hanya di HP yang sama) |
| 4 | `screenshots/04-admin-login.png` | Login admin via `?admin=true` |
| 5 | `screenshots/05-admin-kosong-padahal-sudah-ada-yg-daftar.png` | **Admin melihat 0 peserta padahal HP sudah mendaftar** |
| 6 | `screenshots/06-preview-import.png` | Preview impor CSV |
| 7 | `screenshots/07-dashboard-admin.png` | Dashboard admin setelah impor 500 peserta |
| 8 | `screenshots/08-layar-proyektor.png` | Mode tampilan proyektor |
| 9 | `screenshots/09-animasi-undian.png` | Animasi undian (grid nama) |
| 10 | `screenshots/10-pemenang.png` | Kartu pemenang + confetti |
| 11 | `screenshots/11-setelah-refresh.png` | Setelah refresh: kembali ke login, hasil undian hilang |

## Temuan kritis (perbaiki sebelum dipakai Kamis berikutnya)

1. **Pendaftaran lewat HP tidak sampai ke laptop admin.**
   Data disimpan di `localStorage` browser (`src/lib/storage.ts`). Hasil uji: HP = 1 peserta, laptop admin = 0 peserta.
   Artinya halaman pendaftaran hanya berguna kalau semua peserta mendaftar di laptop yang sama dengan laptop undian. `server/index.js` (Express + SQLite) sudah ada tapi tidak terpakai, dan dependensinya (`express`, `cors`, `better-sqlite3`) tidak ada di `package.json`.
2. **Password admin tertanam di kode frontend.** `src/components/AdminLogin.tsx:9` → `sulut127`. Siapa pun bisa membacanya lewat DevTools/view-source. Login juga hanya flag di state React — tanpa sesi, tanpa log.
3. **Build produksi gagal.** `npm run build` → 22 error TypeScript (file mati `Routes.tsx`, `AdminControls.tsx`, `lib/api.ts`, `lib/db.ts`, `ui/calendar.tsx`). Aplikasi hanya jalan di mode dev.
4. **Pemenang bisa menang lagi.** Tiap undian mengambil dari seluruh peserta; tidak ada pengecualian pemenang ronde sebelumnya maupun minggu lalu.
5. **Hasil undian tidak tersimpan.** Pemenang hanya ada di memori; setelah refresh hilang (screenshot 11). Satu-satunya jejak adalah file `.txt` yang harus diunduh manual. Tidak ada audit trail siapa menang, kapan, hadiah apa.
6. **Tidak bisa undi ronde berikutnya tanpa refresh.** Setelah pemenang tampil, satu-satunya tombol adalah "Unduh Daftar Pemenang". Refresh = login ulang.
7. **Pengacakan bias.** `sort(() => Math.random() - 0.5)` (`src/pages/DisplayPage.tsx:41-43`) bukan pengacakan seragam; mengulang 3x tidak memperbaikinya. Ganti dengan Fisher–Yates + `crypto.getRandomValues`.

## Temuan sedang

- **Durasi undian bergantung jumlah peserta.** Target kode 5 detik, terukur **23 detik** untuk 500 peserta (render per nama). Untuk ±100 peserta lebih cepat, tetapi tetap tidak konsisten.
- **Animasi sorotan bukan hasil undian.** Kartu yang disorot tidak ada hubungannya dengan pemenang (pemenang diacak setelah animasi). Wajar untuk efek, tapi jangan sampai panitia mengira sorotan terakhir = pemenang.
- **Parser CSV naif.** Split koma polos — nama dengan koma/kutip (mis. `"Simanjuntak, S.Kom"`) akan rusak. Tidak ada deduplikasi saat impor.
- **Cek duplikat lemah.** Hanya nama+unit persis (case-insensitive), dan hanya di perangkat yang sama. Typo = peserta ganda = peluang ganda.
- **Unit kerja diketik bebas.** "IT", "TI", "Divisi TI" dihitung sebagai unit berbeda di grafik.
- **Background proyektor dari Unsplash (internet).** Kalau jaringan kantor memblokir, tidak masalah fungsional, tapi aset sebaiknya lokal.
- **Judul tab masih "⚡️ Bolt.new + Vite + React"**, label "Pemenang Doorprize" muncul sebelum ada pemenang.

## Saran improvement (sesuai konteks ibadah Kamis)

### Prioritas 1 — supaya benar & bisa dipertanggungjawabkan
- **Backend terpusat**: aktifkan `server/index.js` (atau FastAPI + SQLite) di VM internal, frontend di-serve dari origin yang sama. Semua HP pendaftar & laptop proyektor membaca data yang sama.
- **Konsep "Sesi Ibadah"**: tiap Kamis = satu sesi (tanggal, tema/pelayan firman). Peserta terdaftar per sesi; data minggu lalu tidak tercampur dan tidak perlu "Hapus Semua Data".
- **Master pegawai** (impor sekali dari SDM: NIP, nama, unit). Pendaftaran = pilih/ketik NIP → nama & unit terisi otomatis. Menghilangkan typo, duplikat, dan unit tidak seragam. Satu NIP = satu entri per sesi.
- **Check-in via QR**: QR di pintu masuk/layar → buka halaman check-in → masukkan NIP. Opsional batasi hanya dari jaringan kantor dan jam ibadah (mis. 07.00–08.30) agar yang tidak hadir tidak bisa ikut.
- **Login admin di server** (password di-hash, sesi/cookie), log setiap aksi admin.
- **Tabel `draws`**: simpan setiap undian (sesi, ronde, hadiah, pemenang, waktu, operator, seed acak). Halaman riwayat + ekspor Excel/PDF untuk laporan ke panitia.

### Prioritas 2 — supaya acara lancar
- **Daftar hadiah per ronde** (mis. Ronde 1: 5× voucher, Ronde 2: 1× hadiah utama). Kartu pemenang menampilkan nama hadiah.
- **Tombol "Undi Ronde Berikutnya"** dan "Kembali ke Admin" tanpa refresh; pemenang ronde sebelumnya otomatis dikeluarkan.
- **Aturan pengecualian**: opsi "pemenang dalam N minggu terakhir tidak ikut" agar lebih merata.
- **Tombol "Pemenang tidak hadir → undi ulang 1"** dengan pencatatan alasan.
- **Durasi animasi tetap** (mis. 6 detik) berapa pun jumlah peserta; tampilkan sampel nama, bukan render semua 500 kartu.
- **Counter peserta live** di layar proyektor saat check-in berlangsung ("87 jemaat sudah check-in") — mendorong orang mendaftar sebelum ibadah selesai.

### Prioritas 3 — kerapian
- Hapus file mati dan komponen shadcn yang tidak dipakai, perbaiki build, tambah CI (`npm run build` + `lint`).
- Tema visual sesuai acara (logo BSG, nuansa rohani lebih tenang dibanding gradien ungu-pink), aset lokal.
- Judul tab & teks yang benar, mode layar penuh (F11) satu klik.

## Rekomendasi arsitektur minimal

```
HP jemaat ──(QR, Wi-Fi kantor)──┐
                                ├──> VM internal (Docker): Express/FastAPI + SQLite
Laptop proyektor (admin) ───────┘        tabel: employees, sessions, checkins, prizes, draws, audit_log
```

Satu container, satu file SQLite (backup harian), tanpa ketergantungan internet. Cukup untuk ±500 pengguna per sesi.
