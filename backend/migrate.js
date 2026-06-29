const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User'); // Pastikan path model benar

dotenv.config();

const LOCAL_URI = 'mongodb://localhost:27017/graphology-ai';
const CLOUD_URI = process.env.MONGO_URI;

const migrate = async () => {
    console.log('🚀 Mulai Migrasi Data dari Local ke Cloud...');

    try {
        // 1. Connect ke Local & Ambil Data
        console.log('1️⃣  Connecting to Local DB...');
        const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
        const LocalUser = localConn.model('User', User.schema);

        const localUsers = await LocalUser.find({});
        console.log(`✅ Ditemukan ${localUsers.length} users di Local.`);

        if (localUsers.length === 0) {
            console.log('⚠️ Tidak ada data di local untuk dimigrasi.');
            process.exit(0);
        }

        await localConn.close();

        // 2. Connect ke Cloud & Insert Data
        console.log('2️⃣  Connecting to Cloud DB...');
        await mongoose.connect(CLOUD_URI);

        console.log('3️⃣  Inserting data to Cloud...');
        let successCount = 0;
        let failCount = 0;

        for (const user of localUsers) {
            try {
                // Cek jika user sudah ada di cloud (berdasarkan email)
                const exists = await User.findOne({ email: user.email });

                if (exists) {
                    console.log(`   ⚠️ Skip: ${user.email} (Sudah ada)`);

                    // Optional: Update data yang ada jika perlu
                    // await User.updateOne({ email: user.email }, user.toObject());
                } else {
                    // Hapus _id agar digenerate baru oleh Cloud (atau pertahankan jika ingin persis)
                    // Kita pertahankan _id agar relasi data (misal TestResult) tetap nyambung jika nanti dimigrasi juga
                    const userData = user.toObject();
                    await User.create(userData);
                    console.log(`   ✅ Migrated: ${user.email}`);
                    successCount++;
                }
            } catch (err) {
                console.log(`   ❌ Failed: ${user.email} - ${err.message}`);
                failCount++;
            }
        }

        console.log('\n🏁 Migrasi Selesai!');
        console.log(`   Berhasil: ${successCount}`);
        console.log(`   Gagal/Skip: ${failCount}`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Error Migrasi:', error);
        process.exit(1);
    }
};

migrate();
