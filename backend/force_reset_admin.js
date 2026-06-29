const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/user');
const connectDB = require('./config/db');

dotenv.config();

const resetAdmin = async () => {
    try {
        await connectDB();

        const email = 'admin@graphology.com';
        const password = 'admin123456';

        let admin = await User.findOne({ email });

        if (admin) {
            console.log('Found existing admin. Updating password...');
            admin.password = password;
            // Setting password triggers 'isModified' in pre-save hook
            await admin.save();
            console.log('✅ Admin password updated successfully.');
        } else {
            console.log('Admin not found. Creating new one...');
            await User.create({
                name: 'Admin Graphology',
                email: email,
                password: password,
                phoneNumber: '08123456789',
                role: 'admin',
                profile: {
                    age: 30,
                    gender: 'Laki-laki',
                    education: 'S1',
                    dominant_hand: 'Kanan'
                }
            });
            console.log('✅ New Admin created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

resetAdmin();
