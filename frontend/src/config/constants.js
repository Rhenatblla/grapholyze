/**
 * Application Configuration Constants
 * Centralized configuration untuk seluruh aplikasi
 */

// Image Processing Configuration
export const IMAGE_CONFIG = {
  maxWidth: 800,
  maxHeight: 400,
  quality: 0.9,
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
};

// Canvas Drawing Configuration
export const DRAWING_CONFIG = {
  minThickness: 2,
  maxThickness: 12,
  eraserMultiplier: 4,
  quality: 0.95,
  lineJoin: "round",
  lineCap: "round",
  strokeColor: "#000000",
  fillColor: "#ffffff",
};

// Animation Configuration
export const ANIMATION_CONFIG = {
  galleryFps: 20,
  galleryDensity: 0.4,
  galleryGlowIntensity: 0.2,
  galleryHueShift: 230,
  scrollThreshold: 500,
  scrollResumeDelay: 500,
};

// Form Configuration
export const FORM_CONFIG = {
  passwordMinLength: 6,
  emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  nameMinLength: 2,
  nameMaxLength: 100,
};

// UI Colors & Styles
export const UI_CONFIG = {
  colors: {
    primary: "#7B61FF",
    primaryDark: "#6B51EF",
    logoBlue: "#1e3a8a",
    gradientStart: "#7c3aed", // purple-600
    gradientEnd: "#ec4899", // pink-600
  },
  timing: {
    animationDuration: 1500, // ms
    scrollAnimationDuration: 500, // ms
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  emailEmpty: "Email tidak boleh kosong",
  emailInvalid: "Format email tidak valid",
  passwordEmpty: "Password tidak boleh kosong",
  passwordTooShort: `Password minimal ${FORM_CONFIG.passwordMinLength} karakter`,
  passwordMismatch: "Password tidak cocok",
  fileTooLarge: `File terlalu besar (max ${IMAGE_CONFIG.maxSizeBytes / (1024 * 1024)}MB)`,
  fileInvalid: "File harus berupa gambar",
  imageProcessFailed: "Gagal memproses gambar",
  nameTooShort: `Nama minimal ${FORM_CONFIG.nameMinLength} karakter`,
  nameRequired: "Nama tidak boleh kosong",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  loginSuccess: "Berhasil login!",
  registerSuccess: "Berhasil mendaftar!",
  uploadSuccess: "Gambar berhasil diupload",
};
