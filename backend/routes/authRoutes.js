const express = require("express");

const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

console.log("AUTH CONTROLLER:", authController);
console.log("AUTH MIDDLEWARE:", authMiddleware);

const router = express.Router();

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.get("/me", authMiddleware.protect, authController.getMe);
router.put("/profile", authMiddleware.protect, authController.updateUserProfile);
router.post("/change-password", authMiddleware.protect, authController.changePassword);

module.exports = router;
