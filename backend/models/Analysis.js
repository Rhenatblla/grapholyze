const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    analysisType: {
      type: String,
      enum: ["image", "canvas", "pdf"],
      default: "image",
    },
    imageUrl: String,
    canvasData: String,

    // --- HASIL AI (Disamakan dengan Service) ---
    enneagramType: {
      type: String, // Contoh: "Tipe 1"
    },
    personalityType: {
      type: String, // Contoh: "The Reformer"
    },
    
    // ✅ CONFIDENCE (Sudah Benar)
    confidence: {
      type: Number, 
      default: 0
    },

    // ✅ TRAITS (Sudah Benar & Detail)
    // Struktur ini cocok dengan data yang dikirim dari AnalysisService
    traits: {
      slant: {
        val: String,
        meaning: String
      },
      size: {
        val: String,
        meaning: String
      },
      pressure: {
        val: String,
        meaning: String
      },
      baseline: {
        val: String,
        meaning: String
      }
    },

    description: String,

    // 🔥 TAMBAHAN BARU (WAJIB ADA) 🔥
    // Tanpa ini, rekomendasi spesifik dari Service tidak akan tersimpan di Database
    recommendations: {
      type: [String], // Array berisi kalimat-kalimat rekomendasi
      default: []
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    errorMessage: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analysis", analysisSchema);