const analysisService = require("../services/analysisService");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// @route   POST /api/analysis/upload
// @desc    Upload dan analyze image
// @access  Private
exports.uploadImage = async (req, res) => {
  try {
    // Get userId from authenticated user (from auth middleware)
    const userId = req.user._id;
    console.log("[Upload Debug] req.file:", req.file);
    // console.log("[Upload Debug] req.body.imageData type:", typeof req.body.imageData);

    // Prioritize Base64 from body if available
    let imageData;
    if (req.body.imageData && typeof req.body.imageData === "string" && req.body.imageData.startsWith("data:image")) {
      imageData = req.body.imageData;
      console.log("[Upload Debug] Using Base64 from req.body");
    } else {
      imageData = req.file ? req.file.path : req.body.imageData;
      console.log("[Upload Debug] Using file path or raw body");
    }

    if (!imageData) {
      return res.status(400).json({ message: "Image data required" });
    }

    const analysis = await analysisService.analyzeHandwriting(userId, imageData, "image");

    res.status(201).json({
      message: "Analysis completed successfully",
      analysis,
    });
  } catch (error) {
    console.error("[Upload Error]", error);
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/analysis/:analysisId/pdf
// @desc    Download Analysis PDF
// @access  Private
exports.generatePDF = async (req, res) => {
  try {
    const { analysisId } = req.params;
    const analysis = await analysisService.getAnalysis(analysisId);

    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    // Create PDF
    const doc = new PDFDocument();
    const filename = `Analysis_Result_${analysisId}.pdf`;

    res.setHeader("Content-disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-type", "application/pdf");

    doc.pipe(res);

    // --- PDF CONTENT ---

    // Header
    doc.fontSize(20).text("Hasil Analisis Grafologi AI", { align: "center" });
    doc.moveDown();

    // User Info
    doc.fontSize(12).text(`Nama: ${analysis.userId.name}`);
    doc.text(`Email: ${analysis.userId.email}`);
    doc.text(`Tanggal: ${new Date(analysis.createdAt).toLocaleDateString()}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); // Separator line
    doc.moveDown();

    // Enneagram Type
    doc
      .fontSize(16)
      .fillColor("purple")
      .text(`Tipe Kepribadian: ${analysis.enneagramType || "Tidak Terdeteksi"}`, { align: "center" });
    doc
      .fontSize(14)
      .fillColor("black")
      .text(`(${analysis.personalityType || "Unknown"})`, { align: "center" });

    // AI Confidence
    if (analysis.aiConfidence) {
      const confPercent = analysis.aiConfidence > 1 ? analysis.aiConfidence : (analysis.aiConfidence * 100).toFixed(0);
      doc.fontSize(10).fillColor("grey").text(`Akurasi AI: ${confPercent}%`, { align: "center" });
    }
    doc.moveDown();

    // Description
    doc.fontSize(12).text("Deskripsi:", { underline: true });
    doc.moveDown(0.5);
    doc.text(analysis.description || "Tidak ada deskripsi.", { align: "justify" });
    doc.moveDown();

    // Traits (Simple Bar Chart Visualization)
    if (analysis.traits) {
      doc.fontSize(12).text("Profil Kepribadian:", { underline: true });
      doc.moveDown(0.5);

      const traits = analysis.traits; // Access sub-document directly
      const traitKeys = Object.keys(traits).filter((k) => typeof traits[k] === "number");

      traitKeys.forEach((trait) => {
        const value = traits[trait];
        const label = trait.charAt(0).toUpperCase() + trait.slice(1).replace(/([A-Z])/g, " $1");

        doc.text(`${label}: ${value}%`);

        // Draw bar
        const barWidth = (value / 100) * 300;
        doc.rect(doc.x, doc.y, barWidth, 10).fill("purple");
        doc.moveDown(1.5);
        doc.fillColor("black"); // Reset color
      });
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).text("Graphology AI - Ungkap Kepribadian dari Tulisan Tangan", { align: "center", text: "grey" });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal membuat PDF" });
  }
};

// @route   POST /api/analysis/canvas
// @desc    Analyze canvas drawing
// @access  Private
exports.analyzeCanvas = async (req, res) => {
  try {
    // Get userId from authenticated user
    const userId = req.user._id;
    const { canvasData } = req.body;

    if (!canvasData) {
      return res.status(400).json({ message: "Canvas data required" });
    }

    const analysis = await analysisService.analyzeHandwriting(userId, canvasData, "canvas");

    res.status(201).json({
      message: "Analysis completed successfully",
      analysis,
    });
  } catch (error) {
    console.error("[Canvas Error]", error);
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/analysis/:analysisId
// @desc    Get single analysis result
// @access  Private
exports.getAnalysis = async (req, res) => {
  try {
    const { analysisId } = req.params;

    const analysis = await analysisService.getAnalysis(analysisId);

    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    res.status(200).json(analysis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/analysis/history/:userId
// @desc    Get user's analysis history
// @access  Private
exports.getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const history = await analysisService.getUserAnalysisHistory(userId, parseInt(page), parseInt(limit));

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   DELETE /api/analysis/:analysisId
// @desc    Delete analysis
// @access  Private
exports.deleteAnalysis = async (req, res) => {
  try {
    const { analysisId } = req.params;

    await analysisService.deleteAnalysis(analysisId);

    res.status(200).json({ message: "Analysis deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/admin/analyses
// @desc    Get all analyses (admin only)
// @access  Private/Admin
exports.getAllAnalyses = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const analyses = await analysisService.getAllAnalyses(parseInt(page), parseInt(limit));

    res.status(200).json(analyses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/admin/analysis-stats
// @desc    Get analysis statistics (admin only)
// @access  Private/Admin
exports.getStatistics = async (req, res) => {
  try {
    const stats = await analysisService.getStatistics();

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
