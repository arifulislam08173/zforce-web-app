// const attendanceService = require("../services/attendance.service");

// const pickLatLng = (body) => {
//   const lat = body?.lat ?? body?.latitude ?? null;
//   const lng = body?.lng ?? body?.longitude ?? null;
//   return { lat, lng };
// };

// exports.punchIn = async (req, res, next) => {
//   try {
//     const userId = req.user.id;
//     const { lat, lng } = pickLatLng(req.body);

//     const attendance = await attendanceService.punchIn(userId, { lat, lng });

//     return res.status(201).json({
//       message: "Punch in successful",
//       data: attendance,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.punchOut = async (req, res, next) => {
//   try {
//     const userId = req.user.id;
//     const { lat, lng } = pickLatLng(req.body);

//     const attendance = await attendanceService.punchOut(userId, { lat, lng });

//     return res.status(200).json({
//       message: "Punch out successful",
//       data: attendance,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.getTodayAttendance = async (req, res, next) => {
//   try {
//     const userId = req.user.id;

//     const attendance = await attendanceService.getTodayAttendance(userId);

//     return res.status(200).json({
//       data: attendance,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.getAttendanceReport = async (req, res, next) => {
//   try {
//     const { fromDate, toDate, userId, page, limit } = req.query;

//     const result = await attendanceService.getAttendanceReport({
//       fromDate,
//       toDate,
//       userId,
//       page,
//       limit,
//     });

//     return res.status(200).json(result);
//   } catch (error) {
//     next(error);
//   }
// };








const fs = require("fs");
const attendanceService = require("../services/attendance.service");
const { User } = require("../models");
const faceLocal = require("../services/faceLocal.service");

const pickLatLng = (body) => {
  const lat = body?.lat ?? body?.latitude ?? null;
  const lng = body?.lng ?? body?.longitude ?? null;
  return { lat, lng };
};

async function verifyFaceOrThrow(userId, file) {
  const user = await User.findByPk(userId);
  if (!user?.faceEnrolled || !user.faceEmbedding) throw new Error("FACE_NOT_ENROLLED");

  const embedding = JSON.parse(user.faceEmbedding);
  const result = await faceLocal.verifyFromUpload(file, embedding);

  if (!result.match) {
    const err = new Error("FACE_NOT_MATCHED");
    err.details = result;
    throw err;
  }

  return result;
}


// function safeUnlink(p) {
//   try { fs.unlinkSync(p); } catch (_) {}
// }

function safeUnlink(p) {
  if (!p) return;
  try { fs.unlinkSync(p); } catch (_) {}
}


exports.punchIn = async (req, res, next) => {
  try {
    console.log("PUNCH-IN req.file =", req.file);

    const userId = req.user.id;
    const { lat, lng } = pickLatLng(req.body);

    if (!req.file) return res.status(400).json({ message: "Face photo is required" });

    // await verifyFaceOrThrow(userId, req.file.path);
    await verifyFaceOrThrow(userId, req.file);

    // ✅ delete daily photo (no storage)
    safeUnlink(req.file.path);

    const attendance = await attendanceService.punchIn(userId, {
      lat,
      lng,
      photoPath: null,
    });

    return res.status(201).json({ message: "Punch in successful", data: attendance });
  } catch (e) {
    if (String(e.message) === "FACE_NOT_ENROLLED") return res.status(403).json({ message: "Face not enrolled. Please enroll first." });
    if (String(e.message) === "FACE_NOT_MATCHED") return res.status(400).json({ message: "Face not matched. Try again." });
    if (String(e.message).includes("no_face_detected")) return res.status(400).json({ message: "Face not detected. Try again with good light." });
    next(e);
  }
};

exports.punchOut = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { lat, lng } = pickLatLng(req.body);

    if (!req.file) return res.status(400).json({ message: "Face photo is required" });

    // await verifyFaceOrThrow(userId, req.file.path);
    await verifyFaceOrThrow(userId, req.file);

    // ✅ delete daily photo (no storage)
    safeUnlink(req.file.path);

    const attendance = await attendanceService.punchOut(userId, {
      lat,
      lng,
      photoPath: null,
    });

    return res.status(200).json({ message: "Punch out successful", data: attendance });
  } catch (e) {
    if (String(e.message) === "FACE_NOT_ENROLLED") return res.status(403).json({ message: "Face not enrolled. Please enroll first." });
    if (String(e.message) === "FACE_NOT_MATCHED") return res.status(400).json({ message: "Face not matched. Try again." });
    if (String(e.message).includes("no_face_detected")) return res.status(400).json({ message: "Face not detected. Try again with good light." });
    next(e);
  }
};



exports.getTodayAttendance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const attendance = await attendanceService.getTodayAttendance(userId);
    return res.status(200).json({ data: attendance });
  } catch (error) {
    next(error);
  }
};

exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { fromDate, toDate, userId, page, limit } = req.query;
    const result = await attendanceService.getAttendanceReport({ fromDate, toDate, userId, page, limit });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
