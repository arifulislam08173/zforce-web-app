const multer = require("multer");

// In-memory upload (no disk write)
const storage = multer.memoryStorage();

module.exports = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
