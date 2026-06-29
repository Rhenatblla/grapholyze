const axios = require('axios');

const testLogin = async () => {
    try {
        console.log('Attempting login with admin credentials...');
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@graphology.com',
            password: 'admin123456'
        });

        console.log('✅ Login Successful!');
        console.log('Token:', response.data.token ? 'Received' : 'Missing');
        console.log('User:', response.data.name);
        console.log('Role:', response.data.role);
    } catch (error) {
        console.error('❌ Login Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

testLogin();
