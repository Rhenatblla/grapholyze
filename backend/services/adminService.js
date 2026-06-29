const User = require('../models/user');
const TestResult = require('../models/TestResult');

const adminService = {
    // Get Dashboard Stats
    getStats: async () => {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalTests = await TestResult.countDocuments();

        // Distribution of personality types
        const distribution = await TestResult.aggregate([
            { "$group": { _id: "$results.personalityType", count: { $sum: 1 } } }
        ]);

        return {
            totalUsers,
            totalTests,
            distribution
        };
    },

    // Get All Users
    getAllUsers: async () => {
        const users = await User.find({ role: 'user' }).select('-password');
        return users;
    }
};

module.exports = adminService;
