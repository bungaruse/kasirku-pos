# 🏪 KasirKu POS - All-in-One Google Apps Script

Aplikasi kasir (POS) sederhana buat warung, restoran, dan UMKM Indonesia.
**100% GRATIS** - semua di Google Apps Script + Google Sheets.

## Fitur
- ✅ Menu dengan emoji & kategori
- ✅ Dine In / Take Away / Delivery
- ✅ Input meja & catatan
- ✅ Keranjang +/- quantity
- ✅ Pembayaran + kembalian
- ✅ Status pesanan (Pending → Siap → Selesai)
- ✅ Laporan harian (omzet, pesanan)
- ✅ Mobile-friendly
- ✅ Offline backup (localStorage)

## Cara Setup (3 menit!)

### 1. Buat Google Sheet
- Buka [sheets.new](https://sheets.new)
- Kasih nama: **"KasirKu"**

### 2. Buka Apps Script
- Klik **Extensions** → **Apps Script**

### 3. Copy Kode
- Hapus semua kode di Code.gs
- Copy-paste isi `Code.gs` dari repo ini
- Klik **Save** (💾)

### 4. Deploy
- Klik **Deploy** → **New Deployment**
- Klik gear ⚙️ → **Web App**
- Isi:
  - Description: "KasirKu POS"
  - Execute as: **Me**
  - Who has access: **Anyone**
- Klik **Deploy**
- **Copy URL** yang muncul

### 5. Buka di HP
- Paste URL di browser HP
- Bookmark biar gampang diakses
- Done! 🎉

## Cara Pakai

### Tambah Pesanan
1. Pilih menu (klik item)
2. Atur quantity (+/-)
3. Pilih tipe (Dine In/Take Away/Delivery)
4. Isi nomor meja & catatan
5. Klik **💰 Bayar**
6. Masukkan uang diterima
7. Klik **✅ Konfirmasi Bayar**

### Lihat Pesanan
- Klik tab **📋 Pesanan**
- Update status: Pending → Siap → Selesai

### Lihat Laporan
- Klik **📊 Laporan** di header
- Lihat omzet, pesanan, rata-rata

## Edit Menu

Buka Google Sheet "KasirKu" → Tab "Menu":

| ID | Nama | Emoji | Harga | Kategori | Stok | Aktif |
|----|------|-------|-------|----------|------|-------|
| 1 | Nasi Goreng | 🍚 | 15000 | Makanan | 99 | TRUE |

- Tambah row baru untuk menu baru
- Set Aktif = FALSE untuk sembunyikan menu
- Stok otomatis berkurang setiap pesanan

## Tips

### Untuk Warung
- Edit menu sesuai jualan
- Pakai HP sebagai kasir
- Cek laporan setiap malam

### Untuk Restoran
- Tambah nomor meja
- Gunakan catatan untuk request khusus
- Monitor pesanan real-time

### Backup Data
- Data tersimpan di Google Sheets
- Buka Sheets langsung untuk export
- Local storage sebagai backup offline

## Troubleshooting

### "Gagal memuat menu"
- Pastikan Google Sheet bernama "KasirKu"
- Cek ada tab "Menu" dengan header yang benar

### "Error koneksi"
- Cek internet
- Refresh halaman

### Pesanan gak tersimpan
- Cek Apps Script sudah di-deploy
- Pastikan "Who has access: Anyone"

## Upgrade

### Custom Menu
Edit langsung di Google Sheet

### Multi-device
Buka URL yang sama di beberapa HP

### Laporan Bulanan
Buka Google Sheet → Filter berdasarkan bulan

---

**Dibuat dengan ❤️ buat UMKM Indonesia**
# KasirKu POS - rebuilt Mon Jun  1 09:20:18 PM WIB 2026
