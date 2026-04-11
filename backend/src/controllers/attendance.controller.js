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

  if (!user?.faceEnrolled || !user.faceEmbeddings) {
    throw new Error("FACE_NOT_ENROLLED");
  }

  let embeddings;
  try {
    embeddings = JSON.parse(user.faceEmbeddings);
  } catch (err) {
    const e = new Error("FACE_EMBEDDINGS_CORRUPTED");
    e.cause = err;
    throw e;
  }

  if (!Array.isArray(embeddings) || embeddings.length === 0) {
    throw new Error("FACE_NOT_ENROLLED");
  }

  const result = await faceLocal.verifyFromUpload(file, embeddings);

  if (!result?.ok) {
    const e = new Error(result?.error || "FACE_VERIFY_FAILED");
    e.details = result;
    throw e;
  }

  if (!result.match) {
    const err = new Error("FACE_NOT_MATCHED");
    err.details = result;
    throw err;
  }

  return result;
}

const mapFaceErrorToResponse = (e, res, next) => {
  const msg = String(e.message || "");
  const details = e.details || null;

  if (msg === "FACE_NOT_ENROLLED") {
    return res.status(403).json({
      code: "FACE_NOT_ENROLLED",
      message: "Face not enrolled. Please enroll first.",
    });
  }

  if (msg === "FACE_EMBEDDINGS_CORRUPTED") {
    return res.status(500).json({
      code: "FACE_EMBEDDINGS_CORRUPTED",
      message: "Stored face data is invalid. Please re-enroll face.",
    });
  }

  if (msg === "FACE_NOT_MATCHED") {
    return res.status(400).json({
      code: "FACE_NOT_MATCHED",
      message: "Face not matched. Please look straight and try again.",
      verify: details
        ? {
            bestDistance: details.best_distance,
            avgTop2Distance: details.avg_top2_distance,
            threshold: details.threshold,
            blurStatus: details.blur_status,
            quality: details.quality,
          }
        : undefined,
    });
  }

  if (msg.includes("no_face_detected")) {
    return res.status(400).json({
      code: "NO_FACE_DETECTED",
      message: "No face detected. Keep your face inside the frame and improve lighting.",
    });
  }

  if (msg.includes("image_too_blurry")) {
    return res.status(400).json({
      code: "IMAGE_TOO_BLURRY",
      message: "Image is blurry. Hold phone steady and keep your face still for a moment.",
    });
  }

  if (msg.includes("image_too_dark")) {
    return res.status(400).json({
      code: "IMAGE_TOO_DARK",
      message: "Image is too dark. Move to better lighting and try again.",
    });
  }

  if (msg.includes("face_too_small")) {
    return res.status(400).json({
      code: "FACE_TOO_SMALL",
      message: "Move closer to the camera so your face fills more of the frame.",
    });
  }

  if (msg.includes("invalid_image")) {
    return res.status(400).json({
      code: "INVALID_IMAGE",
      message: "Invalid camera image received. Please try again.",
    });
  }

  if (msg.includes("no_stored_embeddings")) {
    return res.status(403).json({
      code: "NO_STORED_EMBEDDINGS",
      message: "No enrolled face samples found. Please enroll face again.",
    });
  }

  if (msg.includes("FACE_VERIFY_FAILED")) {
    return res.status(502).json({
      code: "FACE_VERIFY_FAILED",
      message: "Face verification service failed. Please try again.",
    });
  }

  return next(e);
};

exports.punchIn = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { lat, lng } = pickLatLng(req.body);

    if (!req.file) {
      return res.status(400).json({
        code: "FACE_PHOTO_REQUIRED",
        message: "Face photo is required.",
      });
    }

    const verify = await verifyFaceOrThrow(userId, req.file);

    const attendance = await attendanceService.punchIn(userId, {
      lat,
      lng,
      photoPath: null,
    });

    return res.status(201).json({
      code: "PUNCH_IN_SUCCESS",
      message: "Punch in successful.",
      data: attendance,
      verify: {
        bestDistance: verify.best_distance,
        avgTop2Distance: verify.avg_top2_distance,
        threshold: verify.threshold,
        blurStatus: verify.blur_status,
        quality: verify.quality,
      },
    });
  } catch (e) {
    return mapFaceErrorToResponse(e, res, next);
  }
};

exports.punchOut = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { lat, lng } = pickLatLng(req.body);

    if (!req.file) {
      return res.status(400).json({
        code: "FACE_PHOTO_REQUIRED",
        message: "Face photo is required.",
      });
    }

    const verify = await verifyFaceOrThrow(userId, req.file);

    const attendance = await attendanceService.punchOut(userId, {
      lat,
      lng,
      photoPath: null,
    });

    return res.status(200).json({
      code: "PUNCH_OUT_SUCCESS",
      message: "Punch out successful.",
      data: attendance,
      verify: {
        bestDistance: verify.best_distance,
        avgTop2Distance: verify.avg_top2_distance,
        threshold: verify.threshold,
        blurStatus: verify.blur_status,
        quality: verify.quality,
      },
    });
  } catch (e) {
    return mapFaceErrorToResponse(e, res, next);
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

    const result = await attendanceService.getAttendanceReport({
      fromDate,
      toDate,
      userId,
      page,
      limit,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};