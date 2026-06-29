const User = require("../models/User");
const TestResult = require("../models/TestResult");

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalTests = await TestResult.countDocuments();

    // Enneagram Distribution
    const distribution = await TestResult.aggregate([
      {
        $group: {
          _id: "$results.personalityType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Daily Activity (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyUsers = await User.aggregate([{ $match: { role: "user", createdAt: { $gte: sevenDaysAgo } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);

    const dailyTests = await TestResult.aggregate([{ $match: { createdAt: { $gte: sevenDaysAgo } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);

    // Monthly Growth (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyUsers = await User.aggregate([{ $match: { role: "user", createdAt: { $gte: sixMonthsAgo } } }, { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);

    const monthlyTests = await TestResult.aggregate([{ $match: { createdAt: { $gte: sixMonthsAgo } } }, { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);

    // Get Recent Tests (Recent Analyst) with User details
    const recentTests = await TestResult.find().sort({ createdAt: -1 }).limit(10).populate("userId", "name email");

    res.json({
      totalUsers,
      totalTests,
      distribution,
      dailyActivity: { users: dailyUsers, tests: dailyTests },
      monthlyGrowth: { users: monthlyUsers, tests: monthlyTests },
      recentTests,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users with pagination & search
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    // Fix: Allow limit to be 0
    const limitParam = parseInt(req.query.limit);
    const limit = isNaN(limitParam) ? 10 : limitParam;

    const search = req.query.search || "";

    const query = {
      role: "user",
      $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }],
    };

    const total = await User.countDocuments(query);

    let usersQuery = User.find(query).select("-password").sort({ createdAt: -1 });

    // If limit is 0, return ALL (for export)
    if (limit > 0) {
      usersQuery = usersQuery.skip((page - 1) * limit).limit(limit);
    }

    const users = await usersQuery;

    res.json({
      users,
      total,
      page,
      pages: limit > 0 ? Math.ceil(total / limit) : 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete admin user" });
    }

    await User.deleteOne({ _id: user._id });
    res.json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  deleteUser,
};
