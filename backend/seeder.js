const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedAdmin = async () => {
    try {
        // Cek apakah admin sudah ada
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('✅ Admin sudah ada:', adminExists.email);
            console.log('Email:', adminExists.email);
            console.log('Password: Gunakan password yang kamu set saat create');
            process.exit(0);
        }

        // Create admin
        const admin = await User.create({
            name: 'Admin Graphology',
            email: 'admin@graphology.com',
            password: 'admin123456', // Will be hashed by model
            phoneNumber: '08123456789',
            role: 'admin',
            profile: {
                age: 30,
                gender: 'Laki-laki',
                education: 'S1',
                dominant_hand: 'Kanan'
            }
        });

        console.log('✅ Admin berhasil dibuat!');
        console.log('Email:', admin.email);
        console.log('Password: admin123456');
        console.log('\n⚠️ PENTING!');
        console.log('- SIMPAN EMAIL DAN PASSWORD INI');
        console.log('- Gunakan untuk login admin pertama kali');
        console.log('- Setelah login, segera ubah password di settings admin');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
};

const importData = async () => {
    try {
        await User.deleteMany();

        const users = [
            {
                name: 'Admin Graphology',
                email: 'admin@graphology.com',
                password: 'admin123456',
                phoneNumber: '08123456789',
                role: 'admin',
                profile: {
                    age: 30,
                    gender: 'Laki-laki',
                    education: 'S1',
                    dominant_hand: 'Kanan'
                }
            },
            {
                name: 'Test User',
                email: 'user@graphology.com',
                password: 'user123456',
                phoneNumber: '08198765432',
                role: 'user',
                profile: {
                    age: 25,
                    gender: 'Perempuan',
                    education: 'S1',
                    dominant_hand: 'Kanan'
                }
            }
        ];

        const createdUsers = await User.insertMany(users);

        console.log('✅ Data Imported!');
        console.log('Admin Email: admin@graphology.com');
        console.log('Admin Password: admin123456');
        console.log('User Email: user@graphology.com');
        console.log('User Password: user123456');
        process.exit();
    } catch (error) {
        console.error(`❌ ${error.message}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await User.deleteMany();

        console.log('✅ Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`❌ ${error}`);
        process.exit(1);
    }
};

const args = process.argv[2];
if (args === '-d') {
    destroyData();
} else if (args === '-admin') {
    seedAdmin();
} else {
    importData();
}
