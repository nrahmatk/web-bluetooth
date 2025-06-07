# Thermal Printer Bluetooth - EPSON EP5821

Aplikasi web untuk mencetak ke thermal printer Bluetooth EPSON EP5821 dengan lebar kertas 58mm menggunakan ESC/POS commands dan Web Bluetooth API.

## ✨ Fitur

- 🔗 **Koneksi Bluetooth**: Menggunakan Web Bluetooth API untuk koneksi wireless
- 🖨️ **ESC/POS Commands**: Support penuh untuk printer thermal 58mm
- 📱 **Mobile Friendly**: Interface responsive untuk smartphone dan tablet
- 📄 **Cetak Teks**: Cetak teks dengan berbagai format dan alignment
- 🧾 **Cetak Struk**: Template struk belanja lengkap dengan header, items, dan total
- 🧪 **Test Functions**: Berbagai fungsi test untuk validasi printer
- 📊 **Real-time Log**: Monitor aktivitas dan debugging

## 🖨️ Printer yang Didukung

- **EPSON EP5821** (Primary target)
- Printer thermal lain yang mendukung ESC/POS dengan Bluetooth SPP
- Lebar kertas: **58mm**

## 🚀 Cara Penggunaan

### 1. Persiapan Printer

- Pastikan printer EPSON EP5821 dalam kondisi ON
- Aktifkan mode pairing Bluetooth pada printer
- Pastikan kertas thermal 58mm terpasang dengan benar

### 2. Buka Aplikasi

- Buka file `index.html` di browser yang mendukung Web Bluetooth
- **Browser yang didukung**:
  - Chrome 56+ (Android/Desktop)
  - Edge 79+ (Desktop)
  - Opera 43+ (Android/Desktop)
  - Samsung Internet 6.0+ (Android)

### 3. Hubungkan Printer

- Klik tombol "**Hubungkan Printer**"
- Pilih device "**EP5821**" atau nama printer yang muncul
- Tunggu hingga status berubah menjadi "**Terhubung**"

### 4. Cetak Dokumen

#### Cetak Teks Sederhana

- Pilih tab "**Cetak Teks**"
- Masukkan teks yang ingin dicetak
- Atur alignment (Kiri/Tengah/Kanan) dan ukuran
- Klik "**Cetak Teks**"

#### Cetak Struk Belanja

- Pilih tab "**Cetak Struk**"
- Isi data toko (nama, alamat, kasir)
- Tambah items dengan nama, quantity, dan harga
- Atur metode pembayaran dan jumlah bayar
- Klik "**Cetak Struk**"

#### Test Print

- Pilih tab "**Test Print**"
- Gunakan berbagai tombol test untuk validasi
- "**Potong Kertas**" untuk memotong kertas manual

## 🔧 Struktur File

```
web-bluetooth/
├── index.html              # Main HTML file
├── style.css              # Styling dan responsive design
├── app.js                 # Main application logic
├── bluetooth-printer.js   # Web Bluetooth API handler
├── escpos-commands.js     # ESC/POS commands library
├── manifest.json          # PWA manifest
└── README.md             # Dokumentasi ini
```

## 📋 Spesifikasi ESC/POS

### Commands yang Didukung

- **Initialize**: Reset printer
- **Text Formatting**: Normal, Double Height/Width, Bold, Underline
- **Alignment**: Left, Center, Right
- **Paper Control**: Line feed, Cut paper
- **Barcode**: Code128 (jika didukung printer)
- **Cash Drawer**: Open drawer command

### Format Struk 58mm

- **Lebar karakter**: 32 karakter (font normal)
- **Header**: Nama toko, alamat, tanggal/wakir
- **Body**: List items dengan qty dan harga
- **Footer**: Total, pembayaran, kembalian
- **Auto cut**: Otomatis potong kertas setelah print

## 🔒 Keamanan

- Aplikasi berjalan secara lokal (tidak ada data yang dikirim ke server)
- Koneksi Bluetooth menggunakan enkripsi standar
- Web Bluetooth API memerlukan user interaction untuk keamanan

## 🐛 Troubleshooting

### Printer Tidak Terdeteksi

- Pastikan Bluetooth aktif di device dan printer
- Restart printer dan masuk ke mode pairing
- Coba refresh halaman web dan hubungkan ulang
- Periksa jarak antara device dan printer (maksimal 10 meter)

### Hasil Print Tidak Sesuai

- Pastikan lebar kertas 58mm
- Periksa kualitas kertas thermal
- Bersihkan head printer jika hasil print pudar
- Cek level baterai printer

### Koneksi Terputus

- Periksa stabilitas koneksi Bluetooth
- Pastikan printer tidak sleep/auto-off
- Gunakan tombol reconnect atau refresh halaman

### Browser Tidak Support

- Gunakan Chrome/Edge/Opera terbaru
- Aktifkan "Experimental Web Platform features" di chrome://flags
- Pastikan device mendukung Bluetooth LE

## 📱 Mobile Usage

### Android

- Buka Chrome browser
- Navigate ke aplikasi
- Pilih "Add to Home Screen" untuk install sebagai PWA
- Aktifkan Bluetooth dan location permission

### iOS

- Gunakan browser yang mendukung (Chrome/Edge)
- Web Bluetooth support terbatas pada iOS
- Disarankan menggunakan Android untuk pengalaman terbaik

## ⚡ Performance Tips

- Tutup aplikasi lain yang menggunakan Bluetooth
- Jaga jarak koneksi dalam radius optimal (1-5 meter)
- Gunakan kertas thermal berkualitas baik
- Restart printer jika ada masalah print quality

## 🔄 Update Log

### Version 1.0

- Initial release
- Basic text printing
- Receipt template
- Web Bluetooth integration
- ESC/POS commands library
- Mobile responsive design

## 📞 Support

Untuk bantuan teknis atau bug report:

- Check troubleshooting section di atas
- Review log aktivitas di aplikasi
- Pastikan menggunakan browser dan printer yang didukung

## 📜 License

Open source project untuk keperluan edukasi dan komersial.

---

**Developed for EPSON EP5821 Thermal Printer**  
_58mm paper width • ESC/POS compatible • Bluetooth connectivity_
