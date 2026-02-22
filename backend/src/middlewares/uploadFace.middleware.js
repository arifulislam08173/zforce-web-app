// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const dir = path.join(process.cwd(), "uploads", "faces");
// fs.mkdirSync(dir, { recursive: true });

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, dir),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname || ".jpg");
//     cb(null, `face_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
//   },
// });

// module.exports = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     if (!file.mimetype?.startsWith("image/")) return cb(new Error("Only images allowed"), false);
//     cb(null, true);
//   },
// });






const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dir = path.join(__dirname, "..", "..", "uploads", "tmp");
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => cb(null, `face_${Date.now()}${path.extname(file.originalname || ".jpg")}`),
});

module.exports = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
