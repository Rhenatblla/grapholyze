const multer = require('multer');
const path = require('path');
const fs = require('fs'); // ⬅️ Tambahkan ini

// 1. Pastikan folder tujuan ADA. Kalau tidak ada, buat dulu.
const uploadDir = './uploads/profiles/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set storage engine
const storage = multer.diskStorage({
    destination: uploadDir, // Gunakan variabel di atas
    filename: function (req, file, cb) {
        // Format: profile-TIMESTAMP.ext
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
    }
});

// Check file type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Images Only!')); // Gunakan new Error() agar lebih standar
    }
}

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;