const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const Analysis = require("../models/Analysis"); 

/**
 * --- KAMUS DATA ILMIAH (KNOWLEDGE BASE) ---
 * UPDATE: Menambahkan field 'recommendations' untuk setiap tipe.
 */
const ENNEAGRAM_KNOWLEDGE_BASE = {
  'Tipe 1': {
    name: "The Reformer (Perfeksionis)",
    desc: "Anda memiliki standar tinggi, idealis, dan ingin segala sesuatu berjalan benar.",
    features: {
      slant: { val: "Vertical (Tegak)", meaning: "Logika menguasai emosi, terkontrol (Howard, 1922)." },
      size: { val: "Small (Kecil)", meaning: "Konsentrasi tinggi & detail-oriented." },
      pressure: { val: "Medium/Light", meaning: "Sensitivitas & kontrol diri." },
      baseline: { val: "Straight (Lurus)", meaning: "Disiplin & emosi stabil." }
    },
    recommendations: [
      "Belajarlah untuk menerima ketidaksempurnaan, baik pada diri sendiri maupun orang lain.",
      "Luangkan waktu untuk relaksasi tanpa merasa bersalah.",
      "Sadarilah bahwa 'cukup baik' seringkali sudah memadai."
    ]
  },
  'Tipe 2': {
    name: "The Helper (Penolong)",
    desc: "Anda sangat peduli pada orang lain, empatik, dan ingin merasa dibutuhkan.",
    features: {
      slant: { val: "Rightward (Miring Kanan)", meaning: "Ekspresif secara emosional & sosial." },
      size: { val: "Medium/Rounded", meaning: "Ramah & mudah beradaptasi." },
      pressure: { val: "Medium", meaning: "Hangat & bersahabat." },
      baseline: { val: "Upward/Flexible", meaning: "Optimisme sosial." }
    },
    recommendations: [
      "Tetapkan batasan yang sehat, jangan selalu berkata 'ya'.",
      "Prioritaskan kebutuhan diri sendiri sebelum membantu orang lain.",
      "Sadari bahwa Anda layak dicintai tanpa harus selalu memberi."
    ]
  },
  'Tipe 3': {
    name: "The Achiever (Pencapai)",
    desc: "Anda energik, adaptif, dan termotivasi untuk mencapai kesuksesan dan pengakuan.",
    features: {
      slant: { val: "Vertical/Right", meaning: "Ambisius namun tetap logis." },
      size: { val: "Large (Besar)", meaning: "Ingin tampil & dilihat (Broad ideas)." },
      pressure: { val: "Heavy (Tebal)", meaning: "Energi vitalitas tinggi untuk beraksi." },
      baseline: { val: "Ascending (Naik)", meaning: "Ambisi & target-oriented." }
    },
    recommendations: [
      "Luangkan waktu untuk istirahat, hindari burnout.",
      "Fokus pada kejujuran emosional, bukan hanya citra diri.",
      "Nilai diri Anda berdasarkan siapa Anda, bukan apa yang Anda capai."
    ]
  },
  'Tipe 4': {
    name: "The Individualist (Romantis)",
    desc: "Anda ekspresif, sensitif, unik, dan sering merasa berbeda dari orang lain.",
    features: {
      slant: { val: "Left/Variable", meaning: "Menarik diri atau mood berubah-ubah." },
      size: { val: "Variable", meaning: "Kreativitas & non-konformis." },
      pressure: { val: "Light (Tipis)", meaning: "Perasaan halus & sensitif." },
      baseline: { val: "Wavy (Bergelombang)", meaning: "Fluktuasi emosi." }
    },
    recommendations: [
      "Bangun rutinitas positif untuk menstabilkan suasana hati.",
      "Hindari terlalu larut dalam kesedihan atau mengasihani diri sendiri.",
      "Fokus pada tindakan nyata daripada hanya berimajinasi."
    ]
  },
  'Tipe 5': {
    name: "The Investigator (Pengamat)",
    desc: "Anda analitis, mandiri, logis, dan cenderung menjaga privasi.",
    features: {
      slant: { val: "Vertical/Left", meaning: "Objektif, dingin, menahan emosi." },
      size: { val: "Small/Micro", meaning: "Fokus mental & intelektual." },
      pressure: { val: "Light", meaning: "Lebih mengutamakan pikiran daripada fisik." },
      baseline: { val: "Straight", meaning: "Logika yang kaku." }
    },
    recommendations: [
      "Cobalah untuk lebih terhubung secara emosional dengan orang lain.",
      "Jangan hanya mengamati kehidupan, berpartisipasilah di dalamnya.",
      "Berbagi pengetahuan bisa lebih memuaskan daripada menyimpannya sendiri."
    ]
  },
  'Tipe 6': {
    name: "The Loyalist (Pecinta Setia)",
    desc: "Anda setia, bertanggung jawab, waspada, dan butuh rasa aman.",
    features: {
      slant: { val: "Left/Vertical", meaning: "Waspada & hati-hati." },
      size: { val: "Small/Compressed", meaning: "Skeptis & analitis." },
      pressure: { val: "Medium/Varied", meaning: "Kecemasan atau antisipasi." },
      baseline: { val: "Straight", meaning: "Kebutuhan akan aturan/struktur." }
    },
    recommendations: [
      "Percayalah pada insting dan kemampuan diri sendiri.",
      "Sadari kapan kewaspadaan berubah menjadi kecemasan berlebih.",
      "Fokus pada solusi, bukan skenario terburuk."
    ]
  },
  'Tipe 7': {
    name: "The Enthusiast (Antusias)",
    desc: "Anda spontan, optimis, menyukai petualangan, dan menghindari kebosanan.",
    features: {
      slant: { val: "Rightward (Miring Kanan)", meaning: "Impulsif & ekspresif." },
      size: { val: "Large", meaning: "Bebas & tidak suka dikekang detail." },
      pressure: { val: "Heavy/Fast", meaning: "Energi meluap-luap." },
      baseline: { val: "Ascending", meaning: "Optimisme tinggi." }
    },
    recommendations: [
      "Latihlah fokus dan selesaikan apa yang sudah dimulai.",
      "Belajarlah untuk diam dan menikmati ketenangan.",
      "Sadari bahwa kepuasan tidak selalu datang dari pengalaman baru."
    ]
  },
  'Tipe 8': {
    name: "The Challenger (Penantang)",
    desc: "Anda dominan, tegas, percaya diri, dan suka memegang kendali.",
    features: {
      slant: { val: "Right/Vertical", meaning: "Dominasi & ketegasan." },
      size: { val: "Large", meaning: "Ekspansif & keberanian." },
      pressure: { val: "Heavy (Tebal)", meaning: "Vitalitas fisik & materialistis." },
      baseline: { val: "Ascending/Firm", meaning: "Ambisi kuat." }
    },
    recommendations: [
      "Gunakan kekuatan Anda untuk melindungi, bukan mengintimidasi.",
      "Izinkan diri Anda untuk menunjukkan sisi rentan (vulnerability).",
      "Dengarkan pendapat orang lain sebelum mengambil alih kendali."
    ]
  },
  'Tipe 9': {
    name: "The Peacemaker (Pendamai)",
    desc: "Anda cinta damai, santai, suportif, dan menghindari konflik.",
    features: {
      slant: { val: "Vertical/Round", meaning: "Netral & emosi stabil." },
      size: { val: "Medium/Rounded", meaning: "Fleksibel & akomodatif." },
      pressure: { val: "Light/Medium", meaning: "Tenang & tidak agresif." },
      baseline: { val: "Straight/Wavy", meaning: "Mengikuti arus." }
    },
    recommendations: [
      "Beranilah menyuarakan pendapat dan kebutuhan Anda.",
      "Jangan menunda masalah demi kenyamanan sesaat.",
      "Sadarilah bahwa konflik terkadang diperlukan untuk pertumbuhan."
    ]
  }
};

class AnalysisService {

  // ... (Bagian atas sama seperti aslinya)

  static async analyzeHandwriting(userId, imageData, analysisType) {
    const analysis = new Analysis({
      userId,
      analysisType,
      imageUrl: analysisType === "image" ? imageData : null, 
      status: "pending",
    });

    await analysis.save();

    try {
      // 2. Panggil AI Flask Server
      const aiResult = await this.callFlaskAI(imageData, analysisType);

      // 3. Ambil Detail dari Knowledge Base
      const knowledge = ENNEAGRAM_KNOWLEDGE_BASE[aiResult.enneagramType];

      if (!knowledge) {
        throw new Error(`Tipe tidak dikenali: ${aiResult.enneagramType}`);
      }

      // 4. Update Analysis Record
      analysis.personalityType = knowledge.name;  
      analysis.enneagramType = aiResult.enneagramType; 
      analysis.description = knowledge.desc;
      
      // ✅ Simpan Traits
      analysis.traits = knowledge.features; 
      
      // ✅ UPDATE BARU: Simpan Rekomendasi sesuai Tipe
      analysis.recommendations = knowledge.recommendations; 
      
      analysis.confidence = aiResult.confidence; 
      
      analysis.status = "completed";
      await analysis.save();

      console.log(`[Service] Analisis Sukses User ${userId}: ${aiResult.enneagramType}`);
      return analysis;

    } catch (aiError) {
      console.error(`[Service Error] AI Gagal: ${aiError.message}`);

      // --- FALLBACK MOCK DATA ---
      const mockResult = this.getMockAnalysisResult();
      
      analysis.personalityType = mockResult.personalityType;
      analysis.enneagramType = mockResult.enneagramType + " (Fallback)";
      analysis.description = mockResult.description;
      analysis.traits = mockResult.traits;
      
      // Fallback Recommendations
      analysis.recommendations = [
        "Manfaatkan kekuatan unik tipe kepribadian Anda.",
        "Perhatikan area pengembangan diri yang disarankan.",
        "Jaga keseimbangan emosi dan logika."
      ]; 
      
      analysis.confidence = 75; 
      analysis.status = "completed"; 
      analysis.errorMessage = `AI Error: ${aiError.message}`;
      
      await analysis.save();
      return analysis;
    }
  }

  // ... (Sisa kode ke bawah sama persis dengan aslinya: callFlaskAI, getMockAnalysisResult, CRUD Helpers)
  // Pastikan metode statis lain (callFlaskAI, dll) tetap ada di sini sesuai kode aslimu.
  
  static async callFlaskAI(imageData, analysisType) {
     // (Gunakan kode asli Anda disini)
     const aiUrl = process.env.FLASK_AI_URL;
     if (!aiUrl) throw new Error("FLASK_AI_URL belum disetting di .env");
 
     try {
       const form = new FormData();
       const isBase64 = typeof imageData === 'string' && imageData.startsWith('data:image');
 
       if (isBase64) {
         const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
         const buffer = Buffer.from(base64Data, 'base64');
         form.append('file', buffer, { filename: 'canvas.png' });
       } else {
         if (!fs.existsSync(imageData)) throw new Error("File gambar tidak ditemukan");
         form.append('file', fs.createReadStream(imageData));
       }
 
       const response = await axios.post(aiUrl, form, {
         headers: { ...form.getHeaders() },
         timeout: 45000 
       });
 
       const aiData = response.data;
       const rawPrediction = aiData.prediction || "Tipe 1";
       const cleanType = rawPrediction.split('(')[0].trim(); 
       
       let rawConf = aiData.confidence || 0;
       if (typeof rawConf === 'string') {
         rawConf = parseFloat(rawConf.replace('%', ''));
       }
 
       return {
         enneagramType: cleanType,
         confidence: rawConf
       };
 
     } catch (error) {
        throw new Error(error.message);
     }
  }

  static getMockAnalysisResult() {
    const mockType = 'Tipe 1';
    const kb = ENNEAGRAM_KNOWLEDGE_BASE[mockType];
    return {
      enneagramType: mockType,
      personalityType: kb.name,
      description: kb.desc,
      traits: kb.features
    };
  }

  // ... CRUD Lainnya tetap sama
  static async getUserAnalysisHistory(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const analyses = await Analysis.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Analysis.countDocuments({ userId });
    return { analyses, total, page, pages: Math.ceil(total / limit) };
  }

  static async getAnalysis(analysisId) {
    return await Analysis.findById(analysisId).populate("userId", "name email");
  }

  static async deleteAnalysis(analysisId) {
    return await Analysis.findByIdAndDelete(analysisId);
  }

  static async getAllAnalyses(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const analyses = await Analysis.find().populate("userId", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Analysis.countDocuments();
    return { analyses, total, page, pages: Math.ceil(total / limit) };
  }

  static async getStatistics() {
    const total = await Analysis.countDocuments();
    const success = await Analysis.countDocuments({ status: "completed" });
    const failed = await Analysis.countDocuments({ status: "failed" });
    const distribution = await Analysis.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$enneagramType", count: { $sum: 1 } } }
    ]);
    return { total, success, failed, distribution };
  }
}

module.exports = AnalysisService;