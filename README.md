# 💰 DuaSaku - Smart Finance Companion

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)

> **DuaSaku** adalah aplikasi manajemen keuangan pribadi yang cerdas, modern, dan menyenangkan. Didesain untuk Gen-Z dan Milenial yang ingin mengatur cashflow tanpa ribet.

## ✨ Fitur Unggulan (Premium Features)

### 🤖 1. Smart Transaction Parser
Catat pengeluaran semudah chat! Cukup ketik:
> *"Beli Kopi Kenangan 25rb pakai Gopay"*
Aplikasi akan otomatis mendeteksi:
- **Judul**: Beli Kopi Kenangan
- **Nominal**: 25.000
- **Dompet**: Gopay
- **Kategori**: F&B (Otomatis)

### 🧠 2. AI Financial Advisor (Gemini)
Bingung kenapa uang cepat habis? Tanya Advisor kami!
- Analisis pola pengeluaran bulanan.
- Saran hemat yang personal & actionable.
- Deteksi "Bocor Halus" pada keuangan Anda.

### 🎮 3. Gamification & "Juice"
Mengatur uang tidak lagi membosankan.
- **Confetti Celebration** saat berhasil menabung atau membuat budget.
- **School Pride Effect** saat mencapai target impian (Goals).
- UI interaktif dengan animasi halus (`framer-motion`).

### 💳 4. Multi-Wallet System
Kelola semua sumber danamu di satu tempat:
- Bank (BCA, Mandiri, Jago, dll)
- E-Wallet (Gopay, OVO, ShopeePay)
- Cash / Tunai
- Tabungan Khusus

## 📱 Screenshots

| Dashboard | Analisis | Impian (Goals) |
|-----------|----------|----------------|
| ![Dashboard](./screenshots/dashboard.png) | ![Analysis](./screenshots/analysis.png) | ![Goals](./screenshots/goals.png) |

*(Note: Screenshot files to be added in `screenshots/` folder)*

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite)
- **Styling**: Tailwind CSS + Framer Motion
- **Database**: Firebase Firestore (Realtime)
- **Auth**: Firebase Authentication
- **AI Engine**: Google Gemini API
- **Export**: JS-PDF & CSV Generator

## 🚀 Cara Menjalankan (Local)

1.  **Clone Repository**
    ```bash
    git clone https://github.com/naansa-naufalsaputra/duasaku-app.git
    cd duasaku-app
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**
    Buat file `.env` dan isi dengan konfigurasi Firebase & Gemini API Anda:
    ```env
    VITE_FIREBASE_API_KEY=...
    VITE_GEMINI_API_KEY=...
    ```

4.  **Jalankan Server**
    ```bash
    npm run dev
    ```

## 📄 License

Project ini dibuat untuk tujuan edukasi dan portofolio.
**DuaSaku Team** © 2026. All Rights Reserved.
