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

  let result = null;

  // Professional hybrid verification:
  // 1) Try strict fast accept. It never rejects the user.
  // 2) If not confident, fall back to the full accurate /verify path.
  try {
    const fast = await faceLocal.verifyFastFromUpload(file, embeddings);

    if (fast?.ok && fast.match === true) {
      return {
        ...fast,
        mode: "fast",
      };
    }

    console.log("FACE FAST VERIFY NOT CONFIDENT, USING FULL VERIFY", {
      bestDistance: fast?.best_distance,
      threshold: fast?.threshold,
      blurStatus: fast?.blur_status,
      detector: fast?.detector,
    });
  } catch (fastError) {
    const fastMessage = String(fastError.message || "");
    const fastCode = String(fastError.details?.error || fastError.details?.code || "");

    // Security rule: if Python says full face is not visible, do NOT fallback.
    // A masked/covered face must be rejected immediately.
    if (
      fastMessage.includes("face_occluded") ||
      fastMessage.includes("FACE_OCCLUDED") ||
      fastCode.includes("face_occluded") ||
      fastCode.includes("FACE_OCCLUDED")
    ) {
      throw fastError;
    }

    console.log("FACE FAST VERIFY FALLBACK", {
      message: fastError.message,
      details: fastError.details || null,
    });
  }

  result = await faceLocal.verifyFromUpload(file, embeddings);

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

  return {
    ...result,
    mode: result.mode || "full",
  };
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
            threshold: details.threshold,
            blurStatus: details.blur_status,
            quality: details.quality,
          }
        : undefined,
    });
  }

  if (msg.includes("face_occluded") || msg.includes("FACE_OCCLUDED")) {
    return res.status(400).json({
      code: "FACE_OCCLUDED",
      message: "Please remove mask or obstruction and keep your full face visible.",
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

  if (msg.includes("image_too_large")) {
    return res.status(400).json({
      code: "IMAGE_TOO_LARGE",
      message: "Captured image is too large. Please try again.",
    });
  }

  if (msg.includes("no_stored_embeddings")) {
    return res.status(403).json({
      code: "NO_STORED_EMBEDDINGS",
      message: "No enrolled face samples found. Please enroll face again.",
    });
  }

  if (msg === "FACE_SERVICE_TIMEOUT") {
    return res.status(504).json({
      code: "FACE_SERVICE_TIMEOUT",
      message: "Face verification took too long. Please retry.",
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
        threshold: verify.threshold,
        blurStatus: verify.blur_status,
        quality: verify.quality,
        mode: verify.mode || verify.verifyMode || "full",
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
        threshold: verify.threshold,
        blurStatus: verify.blur_status,
        quality: verify.quality,
        mode: verify.mode || verify.verifyMode || "full",
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