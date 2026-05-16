
# 🚀 RizqinaStore - Public Launch Roadmap

File ini digunakan untuk melacak progres pengembangan fitur hingga aplikasi siap dirilis ke publik.

## 📋 Status Saat Ini
- [x] Sistem Autentikasi (Admin & Konsumen)
- [x] Manajemen Produk (CRUD, Stok, Harga Modal)
- [x] Manajemen Pesanan (Filter Status, Dropdown Status)
- [x] Laporan Penjualan & Keuntungan (Export CSV)
- [x] Keranjang Belanja & Checkout Dasar
- [x] Desain UI Modern & Responsive
- [x] Fitur Share Web API & WhatsApp Inquiry
- [x] Pengaturan & Sinkronisasi Tema (Gelap/Terang)
- [x] Fix Dashboard Metrics (Real-time Calculation)

---

## 🛠️ Pekerjaan Mendatang (To-Do)

### Phase 1: Pengaturan & Personalisasi (Selesai ✅)
- [x] **Halaman Pengaturan Toko (Admin)**: Form untuk mengubah Nama Toko, WhatsApp Admin, Alamat Toko, dan Logo tanpa edit kode.
- [/] **Branding**: Implementasi nama & info toko dinamis di seluruh aplikasi.

### Phase 2: Komunikasi & Pengiriman (Sedang Berjalan 🛠️)
- [x] **Manajemen Pengiriman**: Pilihan Pengiriman Paket (dengan Input Resi) vs Antar Langsung (tanpa kurir).
- [x] **Notifikasi WhatsApp Otomatis**: Pesan instruksi konfirmasi pesanan dan link pelacakan otomatis ke konsumen.
- [x] **Fitur Konfirmasi Konsumen**: Tombol "Pesanan Diterima" di sisi pembeli yang otomatis mengubah status di Admin.
- [x] **Rating & Review**: Sistem ulasan produk yang muncul setelah konsumen mengonfirmasi penerimaan barang.
- [x] **Auto-Confirm (Cron Job)**: Sistem otomatis menyelesaikan pesanan yang tidak dikonfirmasi dalam 7 hari.

### Phase 3: Integrasi Pembayaran (Menunggu Konfirmasi User)
- [ ] **Integrasi Midtrans Snap**: Generate pembayaran QRIS otomatis saat checkout.
- [ ] **Kalkulasi Biaya Layanan (Surcharge)**: Sistem otomatis menambahkan biaya admin (0.7% - 2%) ke total belanja sesuai metode bayar yang dipilih agar laba toko tidak berkurang.
- [ ] **Update Laporan Keuangan**: Penambahan kolom "Biaya Admin" dan "Laba Bersih" di dataset untuk analisis bisnis yang lebih akurat.
- [ ] **Webhook Midtrans**: Sistem otomatis mengubah status menjadi "Lunas" setelah konsumen membayar.
- [ ] **Halaman Statis Legal**: Pembuatan halaman *Terms & Conditions* dan *Privacy Policy* (Syarat wajib aktivasi Midtrans Production).

### Phase 4: Finalisasi & Deployment
- [ ] **Data Cleanup**: Menghapus data transaksi uji coba, pesanan fiktif, dan akun percobaan agar laporan keuangan mulai dari nol.
- [ ] **Product Audit**: Memastikan semua deskripsi produk, stok, dan gambar sudah asli dan siap jual.
- [ ] **Optimasi SEO**: Pengaturan metadata lengkap agar toko mudah ditemukan di Google.
- [ ] **Deployment**: Menghubungkan ke domain kustom (misal: rizqinastore.com) melalui Vercel atau platform lainnya.
- [ ] **Handover**: Penyerahan panduan penggunaan Admin untuk operasional harian.

---

## 📝 Catatan Khusus
- Integrasi Midtrans membutuhkan dokumen identitas untuk pendaftaran akun Production.
- Deployment dilakukan di paling akhir setelah semua fitur di atas sudah stabil.

---

## 🚀 Panduan Langkah-Langkah Deployment

Jika Anda sudah siap untuk online, lakukan hal-hal berikut secara berurutan:

### 1. Persiapan Database (Supabase)
Buka **SQL Editor** di Supabase Dashboard dan jalankan kode ini untuk memastikan semua fitur baru berfungsi:
```sql
-- Izin agar pembeli bisa konfirmasi pesanan sendiri
CREATE POLICY "Users can confirm own delivery" ON orders 
FOR UPDATE USING (auth.uid() = user_id) 
WITH CHECK (order_status = 'delivered');

-- Kolom tambahan untuk pelacakan waktu kirim
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
```

### 2. Pengaturan di Vercel Dashboard
Saat mengunggah ke Vercel, pastikan Anda mengisi **Environment Variables** berikut:
- `CRON_SECRET`: Buat kunci rahasia (bebas), ini untuk keamanan fitur Auto-Confirm.
- `NEXT_PUBLIC_SUPABASE_URL`: URL Supabase Anda.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Kunci anonim Supabase Anda.

### 3. Mengaktifkan Robot Otomatis (Cron Jobs)
Di dashboard Vercel, masuk ke menu **Settings > Cron Jobs**, lalu daftarkan:
- **Path**: `/api/cron/auto-complete`
- **Schedule**: `0 0 * * *` (Artinya robot akan mengecek pesanan setiap jam 12 malam).

### 4. Pembersihan Akhir
Gunakan menu **Pembersihan Data** di dashboard Admin (jika sudah dibuat) atau hapus secara manual data pesanan uji coba agar laporan keuangan Anda mulai dari angka nol yang bersih.
