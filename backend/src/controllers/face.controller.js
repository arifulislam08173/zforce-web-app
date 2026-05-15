const faceLocal = require("../services/faceLocal.service");
const { User } = require("../models");

function mapFaceErrorToResponse(res, next, e, context = "FACE") {
  console.error(`${context} ERROR:`, e.message, e.details || "");

  const msg = String(e.message || "");

  if (msg === "FACE_SERVICE_TIMEOUT") {
    return res.status(504).json({
      code: "FACE_SERVICE_TIMEOUT",
      message: "Face service took too long. Please try again.",
    });
  }

  if (msg === "FACE_SERVICE_UNAVAILABLE") {
    return res.status(503).json({
      code: "FACE_SERVICE_UNAVAILABLE",
      message: "Face service is not available. Please start the Python face service.",
    });
  }

  if (msg === "no_face_detected" || msg === "NO_FACE_DETECTED") {
    return res.status(400).json({
      code: "NO_FACE_DETECTED",
      message: "No face detected. Keep your face inside the circle.",
    });
  }

  if (msg === "image_too_dark" || msg === "IMAGE_TOO_DARK") {
    return res.status(400).json({
      code: "IMAGE_TOO_DARK",
      message: "Image is too dark. Move to brighter light and try again.",
    });
  }

  if (msg === "image_too_blurry" || msg === "IMAGE_TOO_BLURRY") {
    return res.status(400).json({
      code: "IMAGE_TOO_BLURRY",
      message: "Image is blurry. Hold the phone steady and try again.",
    });
  }

  if (msg === "face_too_small" || msg === "FACE_TOO_SMALL") {
    return res.status(400).json({
      code: "FACE_TOO_SMALL",
      message: "Move your face closer to the camera.",
    });
  }

  if (msg === "invalid_image" || msg === "INVALID_IMAGE") {
    return res.status(400).json({
      code: "INVALID_IMAGE",
      message: "Invalid face image. Please capture again.",
    });
  }

  if (msg === "image_too_large" || msg === "IMAGE_TOO_LARGE") {
    return res.status(400).json({
      code: "IMAGE_TOO_LARGE",
      message: "Image is too large. Please capture again.",
    });
  }

  if (msg === "face_processing_failed" || msg === "FACE_PROCESSING_FAILED") {
    return res.status(400).json({
      code: "FACE_PROCESSING_FAILED",
      message: "Face could not be checked clearly. Keep your face centered with good light and try again.",
    });
  }

  if (msg === "minimum_3_photos_required") {
    return res.status(400).json({
      code: "MINIMUM_3_PHOTOS_REQUIRED",
      message: "Exactly 3 face photos are required.",
    });
  }

  if (msg === "not_enough_good_samples") {
    return res.status(400).json({
      code: "NOT_ENOUGH_GOOD_SAMPLES",
      message: "Not enough clear face samples. Use good light and keep face steady.",
      details: e.details || null,
    });
  }

  return next(e);
}

function normalizeLabel(label, fallback = "sample") {
  const raw = String(label || fallback).trim().toLowerCase();
  if (["front", "straight"].includes(raw)) return "front";
  if (["left"].includes(raw)) return "left";
  if (["right"].includes(raw)) return "right";
  return fallback;
}

function isValidEmbedding(value) {
  return (
    Array.isArray(value) &&
    value.length >= 128 &&
    value.every((n) => Number.isFinite(Number(n)))
  );
}

exports.analyze = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: "PHOTO_REQUIRED",
        message: "Face photo is required.",
      });
    }

    const result = await faceLocal.analyzeFromUpload(req.file);

    return res.status(200).json({
      code: result?.fallback ? "FACE_ANALYZE_FALLBACK_SUCCESS" : "FACE_ANALYZE_SUCCESS",
      message: result?.fallback ? "Face sample accepted." : "Face sample looks good.",
      data: {
        fallback: Boolean(result?.fallback),
        quality: result.quality || null,
        facialArea: result.facial_area || result.facialArea || null,
        blurStatus: result.blur_status || result.blurStatus || null,
        detector: result.detector || null,
      },
    });
  } catch (e) {
    return mapFaceErrorToResponse(res, next, e, "FACE ANALYZE");
  }
};

exports.enrollSample = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: "PHOTO_REQUIRED",
        message: "Face photo is required.",
      });
    }

    const label = normalizeLabel(req.body.label, "sample");
    const result = await faceLocal.enrollSample(req.file);

    if (!result?.ok || !isValidEmbedding(result.embedding)) {
      return res.status(400).json({
        code: "FACE_SAMPLE_FAILED",
        message: "Face sample could not be secured. Please capture again.",
        details: result || null,
      });
    }

    return res.status(200).json({
      code: "FACE_SAMPLE_READY",
      message: "Face sample verified successfully.",
      data: {
        label,
        embedding: result.embedding,
        quality: result.quality || null,
        facialArea: result.facial_area || result.facialArea || null,
        blurStatus: result.blur_status || result.blurStatus || null,
        detector: result.detector || null,
      },
    });
  } catch (e) {
    return mapFaceErrorToResponse(res, next, e, "FACE ENROLL SAMPLE");
  }
};

exports.enrollComplete = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const samples = Array.isArray(req.body.samples) ? req.body.samples : [];

    if (samples.length < 3) {
      return res.status(400).json({
        code: "MINIMUM_3_SAMPLES_REQUIRED",
        message: "Exactly 3 verified face samples are required.",
      });
    }

    const firstThree = samples.slice(0, 3).map((sample, index) => ({
      label: normalizeLabel(sample?.label, `sample_${index + 1}`),
      embedding: sample?.embedding,
    }));

    const invalid = firstThree.find((sample) => !isValidEmbedding(sample.embedding));
    if (invalid) {
      return res.status(400).json({
        code: "INVALID_FACE_SAMPLE",
        message: "One face sample is invalid. Please enroll again.",
      });
    }

    await User.update(
      {
        faceEmbeddings: JSON.stringify(firstThree.map((sample) => sample.embedding)),
        faceEnrolled: true,
        faceEnrollAt: new Date(),
      },
      { where: { id: userId } }
    );

    return res.status(200).json({
      code: "FACE_ENROLL_SUCCESS",
      message: "Face enrolled successfully.",
      data: {
        acceptedCount: firstThree.length,
        labels: firstThree.map((sample) => sample.label),
      },
    });
  } catch (e) {
    return mapFaceErrorToResponse(res, next, e, "FACE ENROLL COMPLETE");
  }
};

exports.enrollMulti = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const files = Array.isArray(req.files) ? req.files : [];

    if (files.length < 3) {
      return res.status(400).json({
        code: "MINIMUM_3_PHOTOS_REQUIRED",
        message: "Exactly 3 clear face photos are required.",
      });
    }

    const labels = (() => {
      try {
        if (!req.body.labels) return ["front", "left", "right"];
        return Array.isArray(req.body.labels) ? req.body.labels : JSON.parse(req.body.labels);
      } catch {
        return ["front", "left", "right"];
      }
    })();

    const result = await faceLocal.enrollMulti(files.slice(0, 3), labels);

    if (!result?.ok || !Array.isArray(result.samples) || result.samples.length < 3) {
      return res.status(400).json({
        code: "FACE_ENROLL_FAILED",
        message: "Face service did not return enough good samples.",
        details: result || null,
      });
    }

    const embeddings = result.samples.map((s) => s.embedding);

    await User.update(
      {
        faceEmbeddings: JSON.stringify(embeddings),
        faceEnrolled: true,
        faceEnrollAt: new Date(),
      },
      { where: { id: userId } }
    );

    return res.status(200).json({
      code: "FACE_ENROLL_SUCCESS",
      message: "Face enrolled successfully.",
      data: {
        acceptedCount: result.accepted_count,
        rejectedCount: result.rejected_count,
        rejected: result.rejected || [],
      },
    });
  } catch (e) {
    return mapFaceErrorToResponse(res, next, e, "FACE ENROLL");
  }
};
