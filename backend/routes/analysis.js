const express = require("express");
const router = express.Router();
const analysisController = require("../controllers/analysisController");
const { protect, admin } = require("../middleware/authMiddleware");

// Admin routes - MUST be defined first before :analysisId
router.get("/admin/analyses", protect, admin, analysisController.getAllAnalyses);
router.get("/admin/stats", protect, admin, analysisController.getStatistics);

// User routes
router.post("/upload", protect, analysisController.uploadImage);
router.post("/canvas", protect, analysisController.analyzeCanvas);
router.get("/:analysisId", protect, analysisController.getAnalysis);
router.get("/:analysisId/pdf", protect, analysisController.generatePDF); // New PDF Route
router.get("/history/:userId", protect, analysisController.getUserHistory);
router.delete("/:analysisId", protect, analysisController.deleteAnalysis);

module.exports = router;
