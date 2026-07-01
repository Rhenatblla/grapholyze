const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Helper: Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const formatUser = (user) => {
  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role || "user",
    profile: user.profile,
    profilePicture: user.profilePicture,
    photo: user.photo,
  };
};

const authService = {
  // Register User
  register: async (userData) => {
    const { name, email, password, phoneNumber, profile } = userData;

    if (!name || !email || !password) {
      throw new Error("Please add all fields");
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      throw new Error("User already exists");
    }

    const user = await User.create({
      name,
      email,
      password,
      phoneNumber,
      profile,
    });

    if (!user) {
      throw new Error("Invalid user data");
    }

    const token = generateToken(user._id);

    return {
      token,
      user: formatUser(user),
    };
  },

  // Login User
  login: async (email, password) => {
    if (!email || !password) {
      throw new Error("Please provide email and password");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = generateToken(user._id);

    return {
      token,
      user: formatUser(user),
    };
  },

  // Get User Profile
  getMe: async (user) => {
    return formatUser(user);
  },

  // Update User Profile
  updateProfile: async (userId, updateData) => {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    user.name = updateData.name || user.name;
    user.email = updateData.email || user.email;
    user.phoneNumber = updateData.phoneNumber || user.phoneNumber;

    if (updateData.profilePicture) {
      user.profilePicture = updateData.profilePicture;
    }

    if (updateData.password) {
      user.password = updateData.password;
    }

    if (updateData.profile) {
      user.profile = {
        ...user.profile,
        ...updateData.profile,
      };
    }

    const updatedUser = await user.save();
    const token = generateToken(updatedUser._id);

    return {
      token,
      user: formatUser(updatedUser),
    };
  },

  // Change Password
  changePassword: async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await user.matchPassword(currentPassword);

    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    return {
      message: "Password changed successfully",
    };
  },
};

module.exports = authService;
