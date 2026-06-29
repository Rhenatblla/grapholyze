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
    res.status(201).json(result);
  } catch (error) {
    const status = error.message === "User already exists" || error.message === "Please add all fields" ? 400 : 500;

    res.status(status).json({ message: error.message });
  }
};

// ==============================
// LOGIN  ✅ FIXED
// ==============================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);
    const { token, user } = result;

    const isProduction = process.env.NODE_ENV === "production";

    // ✅ SET COOKIE (WAJIB UNTUK NETLIFY + RAILWAY)
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction, // WAJIB (HTTPS)
      sameSite: isProduction ? "none" : "lax", // WAJIB (cross-domain)
      maxAge: 24 * 60 * 60 * 1000, // 1 hari
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==============================
// GET ME
// ==============================
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

// ==============================
// UPDATE PROFILE
// ==============================
const updateUserProfile = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Handle profile fields
    if (req.body.age || req.body.gender || req.body.education || req.body.dominant_hand) {
      updateData.profile = {
        ...(req.body.age && { age: req.body.age }),
        ...(req.body.gender && { gender: req.body.gender }),
        ...(req.body.education && { education: req.body.education }),
        ...(req.body.dominant_hand && { dominant_hand: req.body.dominant_hand }),
      };
    }

    // Handle profile picture upload
    if (req.file) {
      updateData.profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    const result = await authService.updateProfile(req.user._id, updateData);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// ==============================
// CHANGE PASSWORD
// ==============================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide current and new password" });
    }

    const result = await authService.changePassword(req.user._id, currentPassword, newPassword);

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateUserProfile,
  changePassword,
};
