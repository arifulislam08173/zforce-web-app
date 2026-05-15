const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const FACE_API_URL = process.env.FACE_SERVICE_URL || "http://127.0.0.1:7001";

const FACE_ANALYZE_TIMEOUT_MS = Number(
  process.env.FACE_ANALYZE_TIMEOUT_MS ||
    process.env.FACE_SERVICE_TIMEOUT_MS ||
    30000
);

const FACE_VERIFY_TIMEOUT_MS = Number(
  process.env.FACE_VERIFY_TIMEOUT_MS ||
    process.env.FACE_SERVICE_TIMEOUT_MS ||
    30000
);

const FACE_ENROLL_TIMEOUT_MS = Number(
  process.env.FACE_ENROLL_TIMEOUT_MS ||
    process.env.FACE_SERVICE_TIMEOUT_MS ||
    90000
);

function createFaceError(message, details = null) {
  const error = new Error(message || "FACE_SERVICE_ERROR");
  error.details = details;
  return error;
}

function appendFileToForm(form, fieldName, file) {
  if (!file) {
    throw createFaceError("INVALID_UPLOAD_FILE");
  }

  const filename = file.originalname || "upload.jpg";
  const contentType = file.mimetype || "image/jpeg";

  if (file.path) {
    form.append(fieldName, fs.createReadStream(file.path), {
      filename,
      contentType,
    });
    return;
  }

  if (file.buffer) {
    form.append(fieldName, file.buffer, {
      filename,
      contentType,
      knownLength: file.size || file.buffer.length,
    });
    return;
  }

  throw createFaceError("UPLOAD_FILE_HAS_NO_PATH_OR_BUFFER");
}

async function postWithFiles(path, fields = {}, files = [], timeout = 20000) {
  const form = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    form.append(key, typeof value === "string" ? value : JSON.stringify(value));
  });

  files.forEach(({ fieldName, file }) => {
    appendFileToForm(form, fieldName, file);
  });

  try {
    const headers = form.getHeaders();

    try {
      const contentLength = await new Promise((resolve, reject) => {
        form.getLength((err, length) => {
          if (err) return reject(err);
          resolve(length);
        });
      });

      if (Number.isFinite(contentLength)) {
        headers["Content-Length"] = contentLength;
      }
    } catch {
      // FormData length is optional.
    }

    const res = await axios.post(`${FACE_API_URL}${path}`, form, {
      headers,
      timeout,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return res.data;
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      throw createFaceError("FACE_SERVICE_TIMEOUT", {
        timeout,
        path,
      });
    }

    if (err.response?.data) {
      const responseError =
        err.response.data.error ||
        err.response.data.code ||
        err.response.data.message ||
        "FACE_SERVICE_ERROR";

      throw createFaceError(responseError, err.response.data);
    }

    throw createFaceError("FACE_SERVICE_UNAVAILABLE", {
      message: err.message,
      code: err.code,
      path,
    });
  }
}

async function analyzeFromUpload(file) {
  const result = await postWithFiles(
    "/analyze",
    {},
    [{ fieldName: "photo", file }],
    FACE_ANALYZE_TIMEOUT_MS
  );

  if (result?.ok) {
    return result;
  }

  const analyzeError =
    result?.error ||
    result?.code ||
    result?.message ||
    "FACE_ANALYZE_FAILED";

  if (analyzeError === "face_processing_failed") {
    try {
      const embedResult = await postWithFiles(
        "/embed",
        {},
        [{ fieldName: "photo", file }],
        FACE_ANALYZE_TIMEOUT_MS
      );

      if (embedResult?.ok && Array.isArray(embedResult.embedding)) {
        return {
          ok: true,
          fallback: true,
          message: "Face accepted by embed fallback.",
          quality: embedResult.quality || result?.quality || null,
          facial_area: embedResult.facial_area || null,
          blur_status: embedResult.blur_status || "fallback_embed_ok",
          detector: embedResult.detector || null,
        };
      }

      throw createFaceError(embedResult?.error || "face_processing_failed", {
        analyze: result,
        embed: embedResult,
      });
    } catch (fallbackError) {
      throw createFaceError("face_processing_failed", {
        analyze: result,
        fallback: fallbackError.details || fallbackError.message,
      });
    }
  }

  throw createFaceError(analyzeError, result);
}

async function embedFromUpload(file, timeout = FACE_ANALYZE_TIMEOUT_MS) {
  const result = await postWithFiles(
    "/embed",
    {},
    [{ fieldName: "photo", file }],
    timeout
  );

  if (!result?.ok) {
    throw createFaceError(result?.error || "FACE_EMBED_FAILED", result);
  }

  return result;
}

async function enrollSample(file) {
  return embedFromUpload(file, FACE_ENROLL_TIMEOUT_MS);
}

async function enrollMulti(files, labels = []) {
  const safeFiles = (files || []).filter(Boolean).slice(0, 3);

  if (safeFiles.length < 3) {
    throw createFaceError("minimum_3_photos_required", {
      count: safeFiles.length,
    });
  }

  const photoFiles = safeFiles.map((file) => ({
    fieldName: "photos",
    file,
  }));

  const result = await postWithFiles(
    "/enroll-multi",
    { labels: labels || [] },
    photoFiles,
    FACE_ENROLL_TIMEOUT_MS
  );

  if (!result?.ok) {
    throw createFaceError(result?.error || "FACE_ENROLL_FAILED", result);
  }

  return result;
}

async function verifyFromUpload(file, embeddings) {
  const result = await postWithFiles(
    "/verify",
    { embeddings },
    [{ fieldName: "photo", file }],
    FACE_VERIFY_TIMEOUT_MS
  );

  if (!result?.ok) {
    throw createFaceError(result?.error || "FACE_VERIFY_FAILED", result);
  }

  return result;
}

module.exports = {
  analyzeFromUpload,
  embedFromUpload,
  enrollSample,
  enrollMulti,
  verifyFromUpload,
};