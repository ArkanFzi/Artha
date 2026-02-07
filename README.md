# Artha - Smart Financial Management 💰

[![Expo](https://img.shields.io/badge/EXPO-SDK_50+-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.73-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

> **Artha** (Sanskerta: *Kekayaan*) adalah aplikasi manajemen keuangan pribadi yang modern, aman, dan intuitif. Dirancang untuk membantu Anda mencapai kebebasan finansial melalui pencatatan yang mudah dan analisis yang mendalam.

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

## ✨ Fitur Utama

### 1. 💰 Smart Tracking
- **Pencatatan Cepat**: Input transaksi dalam hitungan detik.
- **Kategori Fleksibel**: Kustomisasi kategori pemasukan dan pengeluaran.
- **Photo Receipts**: Simpan bukti struk belanja langsung di aplikasi. (#ComingSoon)

### 2. 📊 Visual Analytics
- **Grafik Interaktif**: Analisis tren pengeluaran dengan Line Chart dan Pie Chart yang responsif.
- **Financial Insights**: Dapatkan ringkasan kondisi keuangan bulanan Anda secara otomatis.
- **Export Data**: Unduh laporan keuangan dalam format `.CSV` atau `.TXT` untuk analisis lebih lanjut.

### 3. 🎯 Goal Setting
- **Tabungan Impian**: Set target tabungan (misal: "Dana Liburan", "Beli Gadget").
- **Asset Management**: Kelola data asset Anda secara terpusat.

### 4. 🔒 Enterprise-Grade Security
- **PIN Protection**: Amankan data finansial dengan PIN 6-digit (SHA-256 Encrypted).
- **Cloud Sync**: Sinkronisasi data real-time menggunakan Firebase Firestore.
- **Offline First**: Tetap bisa mencatat transaksi tanpa koneksi internet.

---

## 🛠 Teknologi

Project ini dibangun dengan stack teknologi modern untuk memastikan performa yang cepat dan *scalable*.

| Kategori | Teknologi |
|----------|-----------|
| **Mobile Framework** | React Native (Expo SDK 50+) |
| **Language** | TypeScript / JavaScript |
| **Backend / DB** | Firebase Firestore & Auth |
| **Local Storage** | Async Storage & SQLite |
| **Charts** | React Native Chart Kit |
| **Icons** | Lucide React Native |
| **Navigation** | React Navigation 6 |

---

## 🚀 Memulai (Getting Started)

Ikuti langkah-langkah berikut untuk menjalankan project ini di komputer lokal Anda.

### Prerequisites (Prasyarat)
Pastikan Anda sudah menginstall:
- [Node.js](https://nodejs.org/) (LTS Version disarankan)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/client) di HP Android/iOS Anda.

### Instalasi

1.  **Clone Repository**
    ```bash
    git clone https://github.com/ArkanFzi/artha.git
    cd artha
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # atau
    yarn install
    ```

3.  **Konfigurasi Environment** (Opsional)
    Buat file `.env` jika diperlukan untuk API Keys Firebase (lihat `.env.example`).

4.  **Jalankan Aplikasi**
    ```bash
    npx expo start
    ```
    Scan QR Code yang muncul di terminal menggunakan aplikasi **Expo Go**.

---

## 📂 Struktur Folder

```
src/
├── 📂 components/   # Komponen UI reusable (Button, Card, Input)
├── 📂 screens/      # Halaman utama aplikasi (Home, Report, Profile)
├── 📂 navigation/   # Konfigurasi routing (Stack & Tab Navigator)
├── 📂 utils/        # Fungsi helper, konstanta, dan logic bisnis
├── 📂 styles/       # Global styles dan tema warna
├── 📂 config/       # Konfigurasi Firebase dan layanan pihak ketiga
└── 📂 contexts/     # Global state management (Auth, Theme)
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

## 📄 Lisensi

Copyright © 2026 Arkan.
Dibuat untuk manajemen keuangan yang lebih baik.

---
<div align="center">
  <sub>Developed by Arkan</sub>
</div>
