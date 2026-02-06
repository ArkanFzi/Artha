# Artha - Aplikasi Pencatat Keuangan Pribadi

**Artha** (Sanskerta: *Kekayaan*) adalah aplikasi manajemen keuangan pribadi yang modern, aman, dan mudah digunakan. Didesain dengan antarmuka premium dan fitur lengkap untuk membantu pengguna mengelola pemasukan, pengeluaran, dan target finansial mereka secara bijak.

## ✨ Fitur Utama

### 1. 💰 Pencatatan & Manajemen
*   **Transaksi Harian**: Catat pemasukan dan pengeluaran dengan cepat.
*   **Kategori Kustom**: Buat dan kelola kategori sesuai kebutuhan (makan, transport, dll).
*   **Budgeting**: Set batas anggaran bulanan per kategori dan dapatkan peringatan jika mendekati batas.
*   **Recurring Transactions**: Otomatisasi pencatatan untuk tagihan rutin (listrik, kos, langganan).
*   **Photo Receipts**: Simpan foto struk/bukti transaksi.

### 2. 📊 Analisis & Laporan
*   **Laporan Interaktif**: Grafik tren pengeluaran (Line Chart) dan distribusi kategori (Pie Chart).
*   **Financial Insights**: Halaman khusus yang memberikan highlight kondisi keuangan bulanan.
*   **Multi-Currency**: Dukungan mata uang asing (USD, SGD, dll) dengan konversi otomatis ke IDR di laporan.
*   **Export Data**: Unduh laporan dalam format **CSV** (Excel) atau **TXT**.

### 3. 🎯 Target Keuangan (Goals)
*   Buat tabungan impian (misal: "Beli Laptop", "Dana Darurat").
*   Tentukan target dana dan deadline.
*   Track progress secara visual.

### 4. 🔒 Keamanan & Cloud
*   **PIN Protection**: Kunci aplikasi dengan PIN 6-digit (SHA-256 Encrypted).
*   **Cloud Backup & Sync**: Backup data aman ke Google Cloud (Firebase) dan restore saat ganti HP.
*   **Offline-First**: Data tersimpan lokal di HP, bisa berjalan tanpa internet.

## 🛠 Teknologi

Project ini dibangun menggunakan stack modern:
*   **Framework**: [React Native](https://reactnative.dev/) dengan [Expo SDK 50+](https://expo.dev/).
*   **Language**: JavaScript (React).
*   **Local Storage**: Async Storage.
*   **Cloud Backend**: Firebase (Auth & Firestore).
*   **Charts**: React Native Chart Kit.
*   **Icons**: Lucide Icons.

## 🚀 Cara Menjalankan Project

### Prerequisites
*   Node.js (LTS Version)
*   Git

### Instalasi
1.  **Clone Repository** (atau download folder project ini)
    ```bash
    git clone https://github.com/username/artha.git
    cd artha
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Jalankan Aplikasi (Development)**
    ```bash
    npx expo start
    ```
    *   Scan QR Code yang muncul dengan aplikasi **Expo Go** (Android/iOS).

## 📱 Cara Membuat APK (Android)

Untuk membuat file APK yang bisa diinstall di HP tanpa laptop:

1.  **Install EAS CLI**
    ```bash
    npm install -g eas-cli
    ```

2.  **Login ke Expo**
    ```bash
    eas login
    ```

3.  **Build APK**
    ```bash
    eas build --platform android --profile preview
    ```
    *   Tunggu proses build (10-20 menit).
    *   Download link yang muncul di terminal.

## 📝 Struktur Folder

```
src/
├── components/   # Komponen UI reusable (Button, Card, Chart)
├── screens/      # Halaman aplikasi (Home, Report, Settings)
├── navigation/   # Konfigurasi routing/navigasi
├── utils/        # Logic, helpers, dan storage service
├── styles/       # Tema warna dan dlobal styles
├── config/       # Konfigurasi Firebase dll
└── contexts/     # State management (Theme, PIN)
```

## 📄 Lisensi

Project ini dibuat untuk tujuan pembelajaran dan portfolio pribadi.

---
*Dibuat kopi oleh Arkan*
