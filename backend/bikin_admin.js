const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/user'); // Pastikan path ini benar (user.js atau User.js)
const connectDB = require('./config/db');

dotenv.config();

const createAdmin = async () => {
    // SILAKAN UBAH EMAIL DAN PASSWORD DI SINI
    const ADMIN_EMAIL = 'admin@admin.com';
    const ADMIN_PASSWORD = 'password123';

    try {
        await connectDB();
        console.log('Menghubungkan ke database...');

        let admin = await User.findOne({ email: ADMIN_EMAIL });

        if (admin) {
            console.log(`Akun ${ADMIN_EMAIL} sudah ada. Mengupdate password...`);
            admin.password = ADMIN_PASSWORD;
            admin.role = 'admin'; // Pastikan role-nya admin
            await admin.save();
            console.log('✅ Password Admin berhasil diupdate!');
        } else {
            console.log(`Akun ${ADMIN_EMAIL} tidak ditemukan. Membuat baru...`);
            await User.create({
                name: 'Administrator',
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                role: 'admin',
                phoneNumber: '08123456789',
                profile: {
                    age: 25,
                    gender: 'Laki-laki',
                    education: 'S1',
                    dominant_hand: 'Kanan'
                }
            });
            console.log('✅ Akun Admin baru berhasil dibuat!');
        }

        console.log('\n--- DETAIL LOGIN ---');
        console.log(`Email: ${ADMIN_EMAIL}`);
        console.log(`Password: ${ADMIN_PASSWORD}`);
        console.log('--------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Gagal membuat admin:', error.message);
        process.exit(1);
    }
};

createAdmin();
