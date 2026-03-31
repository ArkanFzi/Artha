# Artha - Smart Financial Management 💰

[![Expo](https://img.shields.io/badge/EXPO-SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Local_DB-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

> **Artha** (Sanskerta: *Kekayaan*) adalah aplikasi manajemen keuangan pribadi yang modern, aman, dan intuitif. Dirancang dengan **Premium UI** yang mendukung **Light & Dark Mode** untuk membantu Anda mencapai kebebasan finansial melalui pencatatan yang cerdas dan analisis mendalam.

---

## 📱 Screenshots

<p align="center">
  <!-- Ganti link gambar di bawah ini dengan screenshot aplikasi Anda -->
  <img src="https://via.placeholder.com/200x400?text=Home+Screen" alt="Home Screen" width="200" style="margin-right: 10px;" />
  <img src="https://via.placeholder.com/200x400?text=Add+Transaction" alt="Add Transaction" width="200" style="margin-right: 10px;" />
  <img src="https://via.placeholder.com/200x400?text=Statistics" alt="Statistics" width="200" style="margin-right: 10px;" />
  <img src="https://via.placeholder.com/200x400?text=Profile" alt="Profile" width="200" />
</p>

---

## 📱 Ringkasan Fitur

### 1. 💰 Smart Tracking & Recurring
- **Pencatatan Cepat**: Input transaksi (pemasukan/pengeluaran) dalam hitungan detik.
- **Transaksi Berulang**: Otomatisasi pencatatan gaji, tagihan, atau langganan bulanan.
- **Photo Receipts**: Lampirkan foto struk belanja untuk pelacakan yang lebih akurat.

### 2. 📊 Visual Analytics & Budgeting
- **Grafik Interaktif**: Pantau tren pengeluaran bulanan dan tahunan dengan chart yang indah.
- **Smart Budgeting**: Dapatkan rekomendasi alokasi budget berdasarkan histori pengeluaran Anda.
- **Export Reports**: Ekspor laporan keuangan Anda ke format `.CSV` atau `.TXT` kapan saja.

### 3. 🎯 Goals & Savings
- **Target Tabungan**: Buat dan pantau progress tabungan impian Anda (Liburan, Gadget, dsb).
- **Investment Insight**: Rekomendasi alokasi dana investasi berdasarkan sisa budget bulanan.

### 4. 🔒 Keamanan & Sinkronisasi
- **PIN Security**: Amankan data finansial Anda dengan kunci PIN 6-digit.
- **Hybrid Storage**: Menggunakan **SQLite** untuk performa lokal yang cepat dengan dukungan sinkronisasi **Firebase Cloud**.
- **Offline First**: Tetap pantau dan catat keuangan Anda meskipun tanpa koneksi internet.

---

## 🛠 Teknologi

Project ini menggunakan standar pengembangan mobile terbaru:

| Komponen | Teknologi |
|----------|-----------|
| **Core** | React Native (Expo SDK 54) |
| **Database** | SQLite (`expo-sqlite`) |
| **Backend** | Firebase Firestore & Auth |
| **Analytics** | React Native Chart Kit |
| **Security** | PIN Encryption & Secure Store |
| **UI/UX** | Custom Theme Context (Dynamic Light/Dark) |

---

## 🚀 Memulai (Getting Started)

### Prasyarat
- Node.js LTS
- Git
- Aplikasi [Expo Go](https://expo.dev/client) di perangkat mobile.

### Instalasi & Menjalankan

1.  **Clone Project**
    ```bash
    git clone https://github.com/ArkanFzi/artha.git
    cd artha
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Jalankan Dev Server**
    ```bash
    npx expo start
    ```
    Scan QR Code menggunakan aplikasi **Expo Go** untuk melihat aplikasi langsung di HP Anda.

---

## 📂 Struktur Proyek

```
src/
├── 📂 components/   # Komponen UI Shared & Premium
├── 📂 screens/      # Semua halaman aplikasi (Home, Budget, Goals, dsb)
├── 📂 utils/        # Business logic, Storage, Notification & Export services
├── 📂 contexts/     # Global state management (Theme, PIN, Auth)
├── 📂 navigation/   # Routing Stack & Tab Navigator
└── 📂 styles/       # Design System & Theme Tokens
```

---

## 🤝 Kontribusi

Kontribusi selalu diterima! Caranya:

1.  Fork repository ini.
2.  Buat branch fitur baru (`git checkout -b fitur-keren`).
3.  Commit perubahan Anda (`git commit -m 'Menambahkan fitur keren'`).
4.  Push ke branch (`git push origin fitur-keren`).
5.  Buat Pull Request.

---

## 📄 Lisensi & Kredit

Copyright © 2026 **Arkan**.
Artha dikembangkan untuk mempermudah siapa saja dalam mengelola masa depan finansial mereka.

<div align="center">
  <sub>Developed with ❤️ for better financial life.</sub>
</div>
