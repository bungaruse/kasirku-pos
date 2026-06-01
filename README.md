# 🏪 KasirKu - POS Warung & Restoran

Aplikasi kasir (POS) sederhana buat warung, restoran, dan UMKM Indonesia.
**100% GRATIS** - pakai Google Sheets sebagai database.

## Fitur
- ✅ Menu dengan kategori (Makanan, Minuman, Snack)
- ✅ Order type (Dine In, Take Away, Delivery)
- ✅ Input meja & catatan
- ✅ Keranjang dengan +/- quantity
- ✅ Pembayaran dengan kembalian
- ✅ Status pesanan (Pending → Siap → Selesai)
- ✅ Laporan harian (omzet, pesanan, item terjual)
- ✅ Export data
- ✅ Mobile-friendly (bisa dipakai di HP)
- ✅ Offline mode (data tersimpan lokal)

## Cara Setup (5 menit)

### 1. Buat Google Sheet
- Buka [sheets.new](https://sheets.new)
- Kasih nama: "KasirKu Data"

### 2. Buat Apps Script
- Klik **Extensions** → **Apps Script**
- Hapus kode default, copy-paste isi `Code.gs`
- Klik **Save** (💾)

### 3. Deploy sebagai Web App
- Klik **Deploy** → **New Deployment**
- Klik gear ⚙️ → **Web App**
- Isi:
  - **Description:** "KasirKu API"
  - **Execute as:** **Me**
  - **Who has access:** **Anyone**
- Klik **Deploy**
- **Copy URL** yang muncul

### 4. Update Frontend
- Buka `index.html`
- Cari baris: `const API_URL = 'YOUR_APPS_SCRIPT_URL_HERE'`
- Ganti dengan URL dari step 3
- Simpan

### 5. Hosting Frontend (gratis)
Pilih salah satu:

**Option A: Vercel (paling gampang)**
1. Buka [vercel.com](https://vercel.com)
2. Login dengan GitHub
3. Upload `index.html`
4. Dapat URL langsung

**Option B: Netlify**
1. Buka [netlify.com](https://netlify.com)
2. Drag-drop folder `pos-app`
3. Dapat URL langsung

**Option C: GitHub Pages**
1. Upload ke GitHub
2. Settings → Pages → Deploy from branch
3. Dapat URL: `username.github.io/pos-app`

## Cara Pakai

### Tambah Menu
1. Buka Google Sheet "KasirKu Data"
2. Tab "Menu"
3. Tambah row baru: ID, Nama, Emoji, Harga, Kategori, Stok, Aktif

### Proses Pesanan
1. Pilih menu (klik item)
2. Atur quantity (+/-)
3. Pilih tipe (Dine In/Take Away/Delivery)
4. Isi nomor meja & catatan
5. Klik **💰 Bayar**
6. Masukkan uang diterima
7. Klik **✅ Konfirmasi Bayar**

### Lihat Pesanan
- Klik tab **📋 Pesanan**
- Lihat status: Pending ⏳ → Siap ✅ → Selesai 📦
- Klik tombol untuk update status

### Lihat Laporan
- Klik tombol **📊 Laporan** di header
- Lihat omzet, pesanan, item terjual
- Lihat transaksi terakhir

## Kategori Menu

| Kategori | Contoh |
|----------|--------|
| Makanan | Nasi Goreng, Mie Ayam, Bakso |
| Minuman | Es Teh, Kopi, Jus |
| Snack | Roti Bakar, Pisang Goreng |

## Custom Menu

Edit di Google Sheet "Menu":

| ID | Nama | Emoji | Harga | Kategori | Stok | Aktif |
|----|------|-------|-------|----------|------|-------|
| 1 | Nasi Goreng | 🍚 | 15000 | Makanan | 99 | TRUE |
| 2 | Es Teh | 🧊 | 5000 | Minuman | 99 | TRUE |

## Tips Buat Warung

### Setup Awal
1. Edit menu sesuai jualan
2. Hapus menu yang gak ada
3. Tambah menu baru

### Operasional Harian
1. Buka app di HP/kasir
2. Input pesanan pelanggan
3. Cetak struk (opsional)
4. Tutup shift → lihat laporan

### Monitoring
1. Cek laporan harian
2. Lihat menu paling laku
3. Stok otomatis berkurang

## Troubleshooting

### "Gagal memuat data"
- Cek URL API_URL di index.html
- Pastikan Apps Script di-deploy sebagai "Anyone"

### "Error koneksi"
- Cek internet
- Coba buka Google Sheet langsung

### Menu gak muncul
- Pastikan sheet bernama "Menu"
- Cek ada header row

## Upgrade (Opsional)

### Struk Printer
- Tambah tombol "Cetak Struk"
- Pakai library thermal printer

### Multi-kasir
- Buka di beberapa HP
- Data sync via Google Sheets

### Laporan PDF
- Export laporan ke PDF
- Kirim ke WhatsApp owner

### Integrasi GoFood/Grab
- Auto-import pesanan online
- Label "Online" di order

## Monetisasi

### Model 1: Freemium
- **Gratis:** 100 pesanan/bulan
- **Premium:** Unlimited = Rp 50rb/bulan

### Model 2: Jual ke Warung
- Setup + training = Rp 200rb
- Support bulanan = Rp 50rb/bulan

### Model 3: SaaS
- Host sendiri = Rp 100rb/bulan per warung
- Include domain custom

---

**Dibuat dengan ❤️ buat UMKM Indonesia**
