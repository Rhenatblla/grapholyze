const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Helper: Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const authService = {
  // Register User
  register: async (userData) => {
    const { name, email, password, phoneNumber, profile } = userData;

    // Validation
    if (!name || !email || !password) {
      throw new Error("Please add all fields");
    }

    // Check user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new Error("User already exists");
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phoneNumber,
      profile, // Object containing age, gender, etc.
    });

    if (user) {
      return {
        _id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profile: user.profile,
        token: generateToken(user._id),
      };
    } else {
      throw new Error("Invalid user data");
    }
  },

  // Login User
  login: async (email, password) => {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      return {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      };
    } else {
      throw new Error("Invalid credentials");
    }
  },

  // Get User Profile
  getMe: async (user) => {
    return user;
  },

  // Update User Profile
  updateProfile: async (userId, updateData) => {
    const user = await User.findById(userId);

    if (user) {
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
        user.profile = { ...user.profile, ...updateData.profile };
      }

      const updatedUser = await user.save();

      return {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
        profile: updatedUser.profile,
        profilePicture: updatedUser.profilePicture,
        token: generateToken(updatedUser._id),
      };
    } else {
      throw new Error("User not found");
    }
  },

  // Change Password
  changePassword: async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isPasswordValid = await user.matchPassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Update to new password
    user.password = newPassword;
    await user.save();

    return {
      message: "Password changed successfully",
    };
  },
};

module.exports = authService;
