# 🛍️ RizqinaStore - Solusi E-Commerce UMKM Modern

**RizqinaStore** adalah platform e-commerce modern yang dirancang khusus untuk membantu UMKM lokal go-digital. Website ini dibangun dengan teknologi terbaru untuk memberikan pengalaman belanja yang cepat, aman, dan profesional.

![RizqinaStore Banner](https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=1200&auto=format&fit=crop)

## ✨ Fitur Unggulan

- 📱 **Desain Responsif**: Tampilan cantik dan optimal di perangkat mobile maupun desktop.
- 💳 **Integrasi Midtrans**: Mendukung pembayaran otomatis (QRIS, VA, E-Wallet) via Midtrans Snap Embed.
- 🚚 **Manajemen Pengiriman**: Dukungan metode COD dan pelacakan nomor resi.
- 🔐 **Autentikasi Aman**: Sistem login dan manajemen profil menggunakan Supabase Auth.
- 📊 **Dashboard Admin**: Kelola produk, stok, dan pantau pesanan masuk secara real-time.
- 💬 **WhatsApp Integration**: Notifikasi pesanan dan tanya jawab admin langsung via WhatsApp.
- 🕒 **Riwayat Pesanan**: Pembeli dapat memantau status pesanan dan membayar kembali transaksi yang tertunda.

## 🚀 Teknologi yang Digunakan

- **Framework**: [Next.js](https://nextjs.org/) (App Router & Server Actions)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Payment Gateway**: [Midtrans](https://midtrans.com/)
- **Styling**: Vanilla CSS & Modern Design Tokens
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.stevenlu.com/)

## 🛠️ Persiapan Mandiri (Local Setup)

1. **Clone Repository**
   ```bash
   git clone https://github.com/username/e-commerce-web-app.git
   cd e-commerce-web-app
   ```

2. **Instal Dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables**
   Buat file `.env.local` dan lengkapi data berikut:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   MIDTRANS_SERVER_KEY=your_midtrans_server_key
   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
   MIDTRANS_IS_PRODUCTION=false
   
   ADMIN_WHATSAPP_NUMBER=6285199260616
   ```

4. **Jalankan Aplikasi**
   ```bash
   npm run dev
   ```

## 📦 Struktur Database

Proyek ini menggunakan tabel-tabel utama berikut di Supabase:
- `products`: Menyimpan data produk dan stok.
- `orders`: Menyimpan informasi transaksi dan status pembayaran.
- `order_items`: Detail produk di setiap transaksi.
- `profiles`: Data pengguna dan peran (Admin/Consumer).
- `store_settings`: Pengaturan nama toko, alamat, dan nomor WhatsApp.

## 📄 Lisensi

Proyek ini dibuat untuk mendukung digitalisasi UMKM Indonesia.

---
Dibuat dengan ❤️ untuk kemajuan UMKM lokal.
