# FlashGo - Aplikasi Pembelajaran Flashcard Berbasis AI

## Deskripsi Umum Proyek

FlashGo adalah aplikasi web multiplatform dengan repo ini sebagai Backendnya untuk pembelajaran menggunakan flashcard yang dilengkapi dengan kemampuan AI. Aplikasi ini memungkinkan pengguna membuat deck kartu belajar, menghasilkan kuis interaktif dengan AI, dan melacak progress pembelajaran melalui sistem spaced repetition yang cerdas.

**Fitur Utama:**
- Autentikasi pengguna dengan JWT dan bcrypt
- Manajemen deck dan flashcard dengan dukungan gambar
- Generasi kuis AI menggunakan Hugging Face
- Pelacakan progress pembelajaran yang komprehensif
- Analitik pembelajaran dan riwayat belajar 

## Penjelasan Arsitektur

### Arsitektur Sistem
FlashGo menggunakan arsitektur MVC (Model-View-Controller) dengan Express.js sebagai framework utama:

**Komponen Utama:**
- **Server Layer**: Express.js dengan middleware pipeline untuk CORS, autentikasi, dan parsing
- **Controller Layer**: Menangani logika bisnis untuk auth, deck, dan flashcard
- **Data Layer**: Prisma ORM dengan PostgreSQL sebagai database utama
- **External Services**: Integrasi Hugging Face API untuk generasi distractor AI 

### Flow Request
1. Request masuk melalui middleware pipeline (CORS → Auth → Parsers)
2. Routing ke handler yang sesuai (auth, deck, flashcard)
3. Controller memproses logika bisnis
4. Interaksi dengan database melalui Prisma
5. Response JSON dikembalikan ke client

## Model Data Utama

### User Model
Model untuk manajemen pengguna dengan autentikasi:

### Deck Model  
Model untuk mengelompokkan flashcard berdasarkan kategori:

### Flashcard Model
Model utama untuk kartu belajar dengan dukungan gambar:

### Progress & History Models
Model untuk pelacakan kemajuan dan riwayat pembelajaran:

## Dependensi Penting

### Runtime & Framework
- **Node.js**: Runtime JavaScript server-side
- **Express.js 4.16.1**: Framework web untuk HTTP server dan routing

### Database & ORM
- **PostgreSQL**: Database relasional utama
- **Prisma 6.5.0**: ORM type-safe untuk operasi database

### Autentikasi & Keamanan
- **jsonwebtoken 9.0.2**: Manajemen token JWT
- **bcrypt 5.1.1**: Hashing password yang aman

### AI & External Services
- **@huggingface/inference 3.6.2**: Integrasi AI untuk generasi kuis
- **axios 1.8.4**: HTTP client untuk komunikasi API eksternal

### File Handling
- **multer 1.4.5**: Handling upload file multipart 

## Quick Start

### Prerequisites
- Node.js (v14 atau lebih tinggi)
- PostgreSQL database
- Akun Hugging Face untuk API key

### Instalasi

1. **Clone repository**
```bash
git clone <repository-url>
cd flashgo
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
# Buat file .env
DATABASE_URL="postgresql://username:password@localhost:5432/flashgo"
JWT_SECRET="your-jwt-secret-key"
HUGGINGFACE_API_KEY="your-huggingface-api-key"
```

4. **Setup database**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push
```

5. **Jalankan aplikasi**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### API Endpoints
- **Auth**: `POST /auth/login`, `POST /auth/register`
- **Decks**: `GET /user/getAllDeck`, `POST /user/createDeck`
- **Flashcards**: `POST /user/flashcards`, `POST /user/flashcards/:id/answer` 

Aplikasi akan berjalan di `http://localhost:3000` secara default.

