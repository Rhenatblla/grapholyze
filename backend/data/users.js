const users = [
    {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123', // Will be hashed by model pre-save hook
        role: 'admin',
        profile: {
            age: 30,
            gender: 'Laki-laki',
            education: 'S1',
            dominant_hand: 'Kanan'
        }
    },
    {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user',
        profile: {
            age: 25,
            gender: 'Laki-laki',
            education: 'SMA',
            dominant_hand: 'Kanan'
        }
    },
    {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        role: 'user',
        profile: {
            age: 22,
            gender: 'Perempuan',
            education: 'S1',
            dominant_hand: 'Kanan'
        }
    }
];

module.exports = users;
