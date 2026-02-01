const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// --- 1. MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// Cek Folder Uploads (Bikin otomatis kalau tidak ada)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
    console.log("📁 Folder 'uploads' berhasil dibuat!");
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Konfigurasi Multer (Simpan Gambar)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});
const upload = multer({ storage: storage });

// --- 2. DATABASE CONNECTION ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'renaissans_db'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error Konek Database:', err);
    } else {
        console.log('✅ MySQL Connect! (Database Siap)');
    }
});

// ==========================================
// 3. ROUTES (JALUR DATA)
// ==========================================

// ------------------------------------------
// A. FITUR STUDENTS (SISWA)
// ------------------------------------------
app.get('/students', (req, res) => {
    db.query("SELECT * FROM students ORDER BY nama ASC", (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result);
    });
});

app.post('/students', upload.single('foto'), (req, res) => {
    const { nama, jabatan, instagram } = req.body;
    const foto_url = req.file ? req.file.filename : null; 
    
    const sql = "INSERT INTO students (nama, jabatan, instagram, foto_url) VALUES (?)";
    const values = [nama, jabatan, instagram, foto_url];

    db.query(sql, [values], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ status: "Success", id: result.insertId });
    });
});

app.put('/students/:id', upload.single('foto'), (req, res) => {
    const id = req.params.id;
    const { nama, jabatan, instagram } = req.body;
    
    let sql = "";
    let values = [];

    if (req.file) {
        sql = "UPDATE students SET nama=?, jabatan=?, instagram=?, foto_url=? WHERE id=?";
        values = [nama, jabatan, instagram, req.file.filename, id];
    } else {
        sql = "UPDATE students SET nama=?, jabatan=?, instagram=? WHERE id=?";
        values = [nama, jabatan, instagram, id];
    }

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Data updated" });
    });
});

app.delete('/students/:id', (req, res) => {
    const sql = "DELETE FROM students WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.json(err);
        return res.json({ message: "Deleted" });
    });
});


// ------------------------------------------
// B. FITUR WALI KELAS
// ------------------------------------------
app.get('/wali', (req, res) => {
    db.query("SELECT * FROM wali_kelas WHERE id = 1", (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result[0] || {}); 
    });
});

app.post('/wali', upload.single('foto'), (req, res) => {
    const { nama, quote } = req.body;
    
    db.query("SELECT * FROM wali_kelas WHERE id = 1", (err, result) => {
        if (err) return res.status(500).json(err);

        let sql = "";
        let values = [];

        if (result.length === 0) {
            const foto_url = req.file ? req.file.filename : null;
            sql = "INSERT INTO wali_kelas (id, nama, quote, foto_url) VALUES (1, ?, ?, ?)";
            values = [nama, quote, foto_url];
        } else {
            if (req.file) {
                sql = "UPDATE wali_kelas SET nama=?, quote=?, foto_url=? WHERE id=1";
                values = [nama, quote, req.file.filename];
            } else {
                sql = "UPDATE wali_kelas SET nama=?, quote=? WHERE id=1";
                values = [nama, quote];
            }
        }

        db.query(sql, values, (err, result) => {
            if (err) return res.status(500).json(err);
            return res.json({ message: "Wali Kelas Updated" });
        });
    });
});


// ------------------------------------------
// C. FITUR OUR JOURNEY
// ------------------------------------------
app.get('/journey', (req, res) => {
    db.query("SELECT * FROM journey ORDER BY id ASC", (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result);
    });
});

app.post('/journey', (req, res) => {
    const { tahun, judul, deskripsi } = req.body;
    const sql = "INSERT INTO journey (tahun, judul, deskripsi) VALUES (?, ?, ?)";
    db.query(sql, [tahun, judul, deskripsi], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Journey Added" });
    });
});

app.delete('/journey/:id', (req, res) => {
    db.query("DELETE FROM journey WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Journey Deleted" });
    });
});


// ------------------------------------------
// D. FITUR SIGNATURE WALL
// ------------------------------------------
app.get('/signatures', (req, res) => {
    db.query("SELECT * FROM signatures ORDER BY created_at DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result);
    });
});

app.post('/signatures', (req, res) => {
    const { nama_pengirim, pesan } = req.body;
    const sql = "INSERT INTO signatures (nama_pengirim, pesan) VALUES (?, ?)";
    db.query(sql, [nama_pengirim, pesan], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Signature Added" });
    });
});

app.delete('/signatures/:id', (req, res) => {
    db.query("DELETE FROM signatures WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Signature Deleted" });
    });
});


// ------------------------------------------
// E. FITUR WORDS UNSAID
// ------------------------------------------
app.get('/words', (req, res) => {
    db.query("SELECT * FROM words_unsaid ORDER BY created_at DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result);
    });
});

app.post('/words', (req, res) => {
    const { untuk, pesan } = req.body;
    const sql = "INSERT INTO words_unsaid (untuk, pesan) VALUES (?, ?)";
    db.query(sql, [untuk, pesan], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Words Added" });
    });
});

app.delete('/words/:id', (req, res) => {
    db.query("DELETE FROM words_unsaid WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Word Deleted" });
    });
});


// ------------------------------------------
// F. FITUR PLAYLIST (DIPERBAIKI)
// ------------------------------------------

// 1. Ambil semua lagu
app.get('/playlist', (req, res) => {
    const sql = "SELECT * FROM playlist ORDER BY id DESC";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result);
    });
});

// 2. User Request Lagu Baru
app.post('/playlist', (req, res) => {
    const { song_title, artist, spotify_id, requested_by } = req.body; 
    
    let cleanId = "";
    let source = "spotify";

    // Deteksi YouTube
    if (spotify_id.includes('youtu')) {
        source = "youtube";
        if (spotify_id.includes("youtu.be/")) {
            cleanId = spotify_id.split("youtu.be/")[1].split("?")[0];
        } else if (spotify_id.includes("watch?v=")) {
            cleanId = spotify_id.split("watch?v=")[1].split("&")[0];
        } else {
            cleanId = spotify_id;
        }
    } 
    // Deteksi Spotify
    else if (spotify_id.includes('spotify')) {
        source = "spotify";
        if (spotify_id.includes('track/')) {
            cleanId = spotify_id.split('track/')[1].split('?')[0];
        } else {
            cleanId = spotify_id;
        }
    }

    const sql = "INSERT INTO playlist (song_title, artist, spotify_id, source, requested_by) VALUES (?, ?, ?, ?, ?)";
    const reqName = requested_by || "Secret Admirer";

    db.query(sql, [song_title, artist, cleanId, source, reqName], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Song Added" });
    });
});

// 3. Hapus Lagu (INI YANG TADI SALAH POSISI)
// Sekarang sudah diluar app.post, jadi pasti BISA.
app.delete('/playlist/:id', (req, res) => {
    const sql = "DELETE FROM playlist WHERE id = ?";
    const id = req.params.id;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error deleting song:", err);
            return res.status(500).json(err);
        }
        return res.json({ message: "Song deleted successfully", result });
    });
});


// ------------------------------------------
// G. FITUR GALLERY
// ------------------------------------------
app.get('/gallery', (req, res) => {
    db.query("SELECT * FROM gallery ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result);
    });
});

app.post('/gallery', upload.single('image'), (req, res) => {
    const { caption } = req.body;
    const image_url = req.file ? req.file.filename : null;
    
    if (!image_url) return res.status(400).json({ message: "No Image Uploaded" });

    const sql = "INSERT INTO gallery (image_url, caption) VALUES (?, ?)";
    db.query(sql, [image_url, caption], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Image Uploaded" });
    });
});

app.delete('/gallery/:id', (req, res) => {
    db.query("DELETE FROM gallery WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Image Deleted" });
    });
});


// ------------------------------------------
// H. FITUR FLASHBACK
// ------------------------------------------
app.get('/flashback', (req, res) => {
    db.query("SELECT * FROM flashback ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result);
    });
});

app.post('/flashback', upload.single('video'), (req, res) => {
    const { title, description } = req.body;
    const video_url = req.file ? req.file.filename : null;

    if (!video_url) {
        return res.status(400).json({ message: "Wajib upload video!" });
    }

    const sql = "INSERT INTO flashback (video_url, title, description) VALUES (?, ?, ?)";
    db.query(sql, [video_url, title, description], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Video Berhasil Diupload" });
    });
});

app.delete('/flashback/:id', (req, res) => {
    db.query("DELETE FROM flashback WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Video Deleted" });
    });
});
// ==========================================
// I. FITUR TIME CAPSULE (REAL DATABASE)
// ==========================================

// 1. Simpan Pesan (User Bikin Kode Sendiri)
app.post('/timecapsule', (req, res) => {
    const { sender_name, message, unlock_date, secret_key } = req.body; 
    
    // Validasi: Kode wajib diisi
    if (!secret_key) return res.status(400).json({ message: "Wajib bikin kode rahasia!" });

    // Cek dulu: Apakah kode ini sudah ada di database?
    db.query("SELECT * FROM time_capsules WHERE secret_key = ?", [secret_key], (err, result) => {
        if (err) return res.status(500).json(err);

        // Jika kode sudah ada (result > 0), tolak!
        if (result.length > 0) {
            return res.status(400).json({ message: "Yah, kode itu sudah dipakai orang lain. Coba ganti yang unik!" });
        }

        // Jika kode aman, BARU SIMPAN ke Database
        const sql = "INSERT INTO time_capsules (sender_name, message, unlock_date, secret_key) VALUES (?, ?, ?, ?)";
        
        db.query(sql, [sender_name, message, unlock_date, secret_key], (err, insertResult) => {
            if (err) return res.status(500).json(err);
            return res.json({ status: "Success", secret_key: secret_key });
        });
    });
});

// 2. Buka Pesan (Cek Kode & Tanggal)
app.post('/timecapsule/open', (req, res) => {
    const { secret_key } = req.body;
    const today = new Date().toISOString().split('T')[0]; // Ambil tanggal hari ini (YYYY-MM-DD)

    const sql = "SELECT * FROM time_capsules WHERE secret_key = ?";
    
    db.query(sql, [secret_key], (err, result) => {
        if (err) return res.status(500).json(err);
        
        // 1. Cek apakah kodenya ada?
        if (result.length === 0) {
            return res.json({ status: "Not Found", message: "Kode kapsul tidak ditemukan!" });
        }

        const capsule = result[0];
        
        // 2. Cek apakah tanggalnya sudah sampai?
        // Ambil tanggal unlock dari database
        const unlockDate = new Date(capsule.unlock_date).toISOString().split('T')[0];

        if (unlockDate > today) {
            // Jika tanggal buka > hari ini = BELUM WAKTUNYA
            return res.json({ 
                status: "Locked", 
                message: `Sabar ya! Pesan ini baru bisa dibuka tanggal ${unlockDate}`,
                sender: capsule.sender_name 
            });
        }

        // 3. Kalau lolos semua, tampilkan pesan
        return res.json({ 
            status: "Unlocked", 
            data: capsule 
        });
    });
});

// --- 4. START SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 Server BERJALAN di port ${PORT}`);
    console.log(`🔗 Backend siap melayani Admin Dashboard & Home!`);
});