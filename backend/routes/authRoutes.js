const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    updateUserProfile,
    changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Middleware upload yang baru kita buat di atas
const upload = require('../middleware/uploadMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// ✅ Route ini sekarang sudah siap menerima file gambar
router.put('/profile', protect, upload.single('profilePicture'), updateUserProfile);

router.post('/change-password', protect, changePassword);

module.exports = router;