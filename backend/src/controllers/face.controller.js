const faceLocal = require("../services/faceLocal.service");
const { User } = require("../models");

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
        return Array.isArray(req.body.labels)
          ? req.body.labels
          : JSON.parse(req.body.labels);
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
    console.error("FACE ENROLL ERROR:", e.message, e.details || "");

    const msg = String(e.message || "");

    if (msg === "FACE_SERVICE_TIMEOUT") {
      return res.status(504).json({
        code: "FACE_SERVICE_TIMEOUT",
        message: "Face enrollment took too long. Please retry with 3 clear photos only.",
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

    if (msg === "image_too_dark") {
      return res.status(400).json({
        code: "IMAGE_TOO_DARK",
        message: "Image is too dark. Move to brighter light and try again.",
      });
    }

    if (msg === "image_too_blurry") {
      return res.status(400).json({
        code: "IMAGE_TOO_BLURRY",
        message: "Image is blurry. Hold the phone steady and try again.",
      });
    }

    if (msg === "face_too_small") {
      return res.status(400).json({
        code: "FACE_TOO_SMALL",
        message: "Move your face closer to the camera.",
      });
    }

    return next(e);
  }
};