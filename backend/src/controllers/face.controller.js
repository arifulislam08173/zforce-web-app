const faceLocal = require("../services/faceLocal.service");
const { User } = require("../models");

exports.enrollMulti = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const files = Array.isArray(req.files) ? req.files : [];

    if (files.length < 3) {
      return res.status(400).json({
        code: "MINIMUM_3_PHOTOS_REQUIRED",
        message: "At least 3 face photos are required.",
      });
    }

    const labels = (() => {
      try {
        if (!req.body.labels) return [];
        return Array.isArray(req.body.labels)
          ? req.body.labels
          : JSON.parse(req.body.labels);
      } catch {
        return [];
      }
    })();

    const result = await faceLocal.enrollMulti(files, labels);
    const embeddings = result.samples.map((s) => s.embedding);

    await User.update(
      {
        faceEmbeddings: JSON.stringify(embeddings),
        faceEnrolled: true,
      },
      { where: { id: userId } }
    );

    return res.status(200).json({
      code: "FACE_ENROLL_SUCCESS",
      message: "Face enrolled successfully.",
      data: {
        acceptedCount: result.accepted_count,
        rejectedCount: result.rejected_count,
        rejected: result.rejected,
      },
    });
  } catch (e) {
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
        message: "At least 3 face photos are required.",
      });
    }

    if (msg === "not_enough_good_samples") {
      return res.status(400).json({
        code: "NOT_ENOUGH_GOOD_SAMPLES",
        message: "Not enough clear face samples. Use good light and keep face steady.",
        details: e.details || null,
      });
    }

    if (msg === "INVALID_UPLOAD_FILE" || msg === "UPLOAD_FILE_HAS_NO_PATH_OR_BUFFER") {
      return res.status(400).json({
        code: "INVALID_UPLOAD_FILE",
        message: "Uploaded image data is invalid. Please capture the photos again.",
      });
    }

    return next(e);
  }
};