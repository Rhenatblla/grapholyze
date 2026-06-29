// Seed script untuk create test admin user
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/graphologyai');
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@test.com' });
        if (adminExists) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@test.com',
            password: 'Admin123!',
            phoneNumber: '08123456789',
            role: 'admin'
        });

        console.log('✅ Admin user created successfully!');
        console.log('Email: admin@test.com');
        console.log('Password: Admin123!');
        console.log('Role: admin');

        // Create regular test user
        const userExists = await User.findOne({ email: 'user@test.com' });
        if (!userExists) {
            const user = await User.create({
                name: 'Test User',
                email: 'user@test.com',
                password: 'User123!',
                phoneNumber: '08987654321',
                role: 'user'
            });
            console.log('\n✅ Test user created successfully!');
            console.log('Email: user@test.com');
            console.log('Password: User123!');
            console.log('Role: user');
        } else {
            console.log('\n ℹ Test user already exists');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedAdmin();
