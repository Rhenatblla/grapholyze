const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/user');

dotenv.config();

// Konfigurasi
const LOCAL_URI = 'mongodb://localhost:27017/graphology-ai';
const CLOUD_URI = process.env.MONGO_URI;

const syncDown = async () => {
    console.log('☁️  Mulai Sinkronisasi: Cloud (Atlas) -> Local...');

    try {
        // 1. Ambil Data dari Cloud
        console.log('1️⃣  Connecting to Cloud DB...');
        // Kita gunakan connection terpisah agar tidak conflict global mongoose
        const cloudConn = await mongoose.createConnection(CLOUD_URI).asPromise();
        const CloudUser = cloudConn.model('User', User.schema);

        const cloudUsers = await CloudUser.find({});
        console.log(`✅ Ditemukan ${cloudUsers.length} users di Cloud.`);

        await cloudConn.close();

        if (cloudUsers.length === 0) {
            console.log('⚠️ Cloud kosong. Tidak ada yang perlu disinkronkan.');
            process.exit(0);
        }

        // 2. Connect ke Local & Rewrite Data
        console.log('2️⃣  Connecting to Local DB...');
        await mongoose.connect(LOCAL_URI);

        console.log('3️⃣  Resetting Local Data...');
        await User.deleteMany({}); // Hapus data lokal lama agar bersih

        console.log('4️⃣  Inserting Data from Cloud...');
        await User.insertMany(cloudUsers);

        console.log('\n🏁 Sinkronisasi Selesai!');
        console.log(`   Database Local sekarang berisi ${cloudUsers.length} users dari Cloud.`);
        console.log('   (Compass di localhost sekarang akan menampilkan data yang sama dengan Atlas)');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error Sinkronisasi:', error);
        process.exit(1);
    }
};

syncDown();
