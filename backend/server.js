const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// ⬅️ WAJIB ADA
app.use(cookieParser());

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
// ⬅️ STOP preflight di sini (PENTING)
app.options(/(.*)/, (req, res) => {
  res.sendStatus(200);
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// sisanya tetap sama...

// Create uploads directory if it doesn't exist
const fs = require("fs");
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} [${req.headers["content-type"]}]`);
  next();
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/analysis", require("./routes/analysis"));
app.use("/api/tests", require("./routes/testRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// Make uploads folder static
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

app.get("/", (req, res) => {
  res.send("Graphology AI API is running...");
});

// 404 Handler - Forces JSON for API 404s
app.use((req, res, next) => {
  res.status(404).json({ message: `Not Found - ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ message: err.message || "Server Error" });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on port ${PORT}`);
});
