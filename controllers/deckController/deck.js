const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");



const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Ambil userId dari token JWT

    // Ambil data pengguna beserta deck-nya dan hitung total deck
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        decks: {
          select: {
            id: true,
            name: true,
            category: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: { decks: true }, // Hitung total deck
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    // Restrukturasi respons untuk menyertakan total deck
    const response = {
      message: "Profil berhasil diambil",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        totalDecks: user._count.decks, // Total deck
        decks: user.decks,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};


  const saveFcmToken = async (req, res) => {
  try {
    const { fcmToken, authToken } = req.body;
    console.log('saveFcmToken - authToken:', authToken, 'fcmToken:', fcmToken); // Debug

    if (!authToken) {
      return res.status(401).json({ message: 'No auth token provided' });
    }

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token diperlukan' });
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded); // Debug

    const userId = decoded.userId; // Deklarasi userId
    console.log('Decoded userId:', userId); // Debug

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token: No userId found' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });

    res.status(200).json({ message: 'FCM token berhasil disimpan' });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

const admin = require('../../firebase_admin');

const handleUserStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status diperlukan' });
    }

    if (status === 'offline') {
      // Ambil FCM token dari database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });

      if (!user || !user.fcmToken) {
        return res.status(404).json({ message: 'FCM token tidak ditemukan' });
      }

      // Jadwalkan notifikasi setelah 5 detik tanpa perlu cek status terakhir
      setTimeout(async () => {
        try {
          const message = {
            notification: {
              title: 'Kamu Offline!',
              body: 'Kamu keluar dari aplikasi 5 detik lalu.',
            },
            token: user.fcmToken,
            android: {
              priority: 'high',
            },
            apns: {
              headers: {
                'apns-priority': '10',
              },
              payload: {
                aps: {
                  contentAvailable: true,
                },
              },
            },
          };
          
          await admin.messaging().send(message);
          console.log('Notifikasi berhasil dikirim');
        } catch (error) {
          console.error('Gagal mengirim notifikasi:', error);
        }
      }, 5000);
    }

    res.status(200).json({ message: 'Status diterima' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

const getDecks = async (req, res) => {
  try {
    const userId = req.user.id; // Ambil user ID dari token

    // Ambil semua deck milik user
    const decks = await prisma.deck.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        category: true,
        createdAt: true,
        flashcards: {
          select: {
            id: true,
            progress: {
              where: { userId, status: "MASTERED" }, // Hanya ambil progress MASTERED
              select: { id: true }, // Minimal data untuk efisiensi
            },
          },
        },
      },
    });

    // Transformasi data untuk menyertakan progress
    const decksWithProgress = decks.map((deck) => {
      const totalFlashcards = deck.flashcards.length;
      const masteredFlashcards = deck.flashcards.filter(
        (flashcard) => flashcard.progress.length > 0 // Hitung flashcard dengan status MASTERED
      ).length;
      const percentage =
        totalFlashcards > 0
          ? Math.round((masteredFlashcards / totalFlashcards) * 100)
          : 0;

      return {
        id: deck.id,
        name: deck.name,
        category: deck.category,
        createdAt: deck.createdAt,
        flashcardCount: totalFlashcards,
        mastered: masteredFlashcards,
        percentage, // Persentase penyelesaian
      };
    });

    res.status(200).json({ message: "Daftar deck", decks: decksWithProgress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const createDeck = async (req, res) => {
  try {
    const { name, category } = req.body;
    const userId = req.user.id; // Ambil userId dari token JWT

    // Validasi input
    if (!name || !category) {
      return res
        .status(400)
        .json({ message: "Nama deck dan kategori wajib diisi" });
    }

    // Simpan ke database
    const newDeck = await prisma.deck.create({
      data: {
        name,
        category,
        userId,
      },
    });

    res.status(201).json({ message: "Deck berhasil dibuat", deck: newDeck });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const updateDeck = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category } = req.body;
    const userId = req.user.id;

    // Cek apakah deck milik user
    const deck = await prisma.deck.findUnique({
      where: { id },
    });

    if (!deck || deck.userId !== userId) {
      return res
        .status(404)
        .json({ message: "Deck tidak ditemukan atau bukan milik Anda" });
    }

    // Update deck
    const updatedDeck = await prisma.deck.update({
      where: { id },
      data: { name, category, updatedAt: new Date() },
    });

    res
      .status(200)
      .json({ message: "Deck berhasil diperbarui", deck: updatedDeck });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const deleteDeck = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Cek apakah deck milik user
    const deck = await prisma.deck.findUnique({
      where: { id },
    });

    if (!deck || deck.userId !== userId) {
      return res
        .status(404)
        .json({ message: "Deck tidak ditemukan atau bukan milik Anda" });
    }

    // Gunakan transaksi untuk menghapus semua data terkait
    await prisma.$transaction([
      // Hapus semua History yang terkait dengan Flashcard di Deck ini
      prisma.history.deleteMany({
        where: {
          flashcard: {
            deckId: id,
          },
        },
      }),
      // Hapus semua Progress yang terkait dengan Flashcard di Deck ini
      prisma.progress.deleteMany({
        where: {
          flashcard: {
            deckId: id,
          },
        },
      }),
      // Hapus semua Flashcard yang terkait dengan Deck
      prisma.flashcard.deleteMany({
        where: { deckId: id },
      }),
      // Hapus Deck
      prisma.deck.delete({
        where: { id },
      }),
    ]);

    res.status(200).json({ message: "Deck berhasil dihapus" });
  } catch (error) {
    console.error("Delete deck error:", error);
    res.status(500).json({
      message: "Terjadi kesalahan server",
      error: error.message,
    });
  }
};

module.exports = { getProfile,saveFcmToken,handleUserStatus, getDecks, createDeck, updateDeck, deleteDeck };
