// const { User } = require("../models");
// const faceLocal = require("../services/faceLocal.service");

// exports.enroll = async (req, res, next) => {
//   try {
//     console.log("ENROLL content-type:", req.headers["content-type"]);
//     console.log("ENROLL req.file:", req.file);
//     console.log("ENROLL body keys:", Object.keys(req.body || {}));

//     const userId = req.user.id;

//     if (!req.file) return res.status(400).json({ message: "Face photo is required" });

//     const user = await User.findByPk(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const embedding = await faceLocal.embedFromFile(req.file.path);

//     user.faceEnrolled = true;
//     user.faceEmbedding = JSON.stringify(embedding);
//     user.faceEnrollAt = new Date();
//     await user.save();

//     return res.json({ message: "Face enrolled successfully", data: { faceEnrolled: true } });
//   } catch (e) {
//     if (String(e.message).includes("no_face_detected")) {
//       return res.status(400).json({ message: "Face not detected. Try again with good light." });
//     }
//     next(e);
//   }
// };








// src/controllers/face.controller.js
const { User } = require("../models");
const faceLocal = require("../services/faceLocal.service");
const fs = require("fs");

function safeUnlink(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
}

exports.enroll = async (req, res, next) => {
  console.log("ENROLL content-type:", req.headers["content-type"]);
  console.log("ENROLL req.file:", req.file);
  console.log("ENROLL body keys:", Object.keys(req.body || {}));

  const tmpPath = req?.file?.path; // may be undefined if memoryStorage

  try {
    const userId = req.user.id;

    if (!req.file) return res.status(400).json({ message: "Face photo is required" });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ FIX: your service function name is embedFromUpload and supports file.path OR file.buffer
    const embedding = await faceLocal.embedFromUpload(req.file);

    user.faceEnrolled = true;
    user.faceEmbedding = JSON.stringify(embedding);
    user.faceEnrollAt = new Date();
    await user.save();

    return res.json({
      message: "Face enrolled successfully",
      data: { faceEnrolled: true },
    });
  } catch (e) {
    console.error("FACE ENROLL ERROR:", e);

    if (String(e.message).includes("no_face_detected")) {
      return res.status(400).json({ message: "Face not detected. Try again with good light." });
    }

    if (String(e.message).includes("FACE_FILE_MISSING")) {
      return res.status(400).json({ message: "Face photo is required" });
    }

    next(e);
  } finally {
    // ✅ cleanup only if disk path exists
    safeUnlink(tmpPath);
  }
};
