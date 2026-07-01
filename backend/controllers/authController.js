const authService = require("../services/authService");

// ==============================
// REGISTER
// ==============================
const registerUser = async (req, res) => {
  try {
    const userData = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phoneNumber: req.body.phoneNumber,
      profile: {
        age: req.body.age,
        gender: req.body.gender,
        education: req.body.education,
        dominant_hand: req.body.dominant_hand,
      },
    };

    const result = await authService.register(userData);

    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const status = error.message === "User already exists" || error.message === "Please add all fields" ? 400 : 500;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// LOGIN
// ==============================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);
    const { token, user } = result;

    if (!token) {
      return res.status(500).json({
        success: false,
        message: "Token gagal dibuat di backend",
      });
    }

    return res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// GET ME
// ==============================
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

// ==============================
// UPDATE PROFILE
// ==============================
const updateUserProfile = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.body.age || req.body.gender || req.body.education || req.body.dominant_hand) {
      updateData.profile = {
        ...(req.body.age && { age: req.body.age }),
        ...(req.body.gender && { gender: req.body.gender }),
        ...(req.body.education && { education: req.body.education }),
        ...(req.body.dominant_hand && {
          dominant_hand: req.body.dominant_hand,
        }),
      };
    }

    if (req.file) {
      updateData.profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    const result = await authService.updateProfile(req.user._id, updateData);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// CHANGE PASSWORD
// ==============================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    const result = await authService.changePassword(req.user._id, currentPassword, newPassword);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateUserProfile,
  changePassword,
};
