const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const FACE_API_URL = process.env.FACE_API_URL || "http://localhost:7001";

function appendFileToForm(form, fieldName, file) {
  if (!file) {
    throw new Error("INVALID_UPLOAD_FILE");
  }

  const filename = file.originalname || "upload.jpg";
  const contentType = file.mimetype || "image/jpeg";

  // Multer diskStorage
  if (file.path) {
    form.append(fieldName, fs.createReadStream(file.path), {
      filename,
      contentType,
    });
    return;
  }

  // Multer memoryStorage
  if (file.buffer) {
    form.append(fieldName, file.buffer, {
      filename,
      contentType,
      knownLength: file.size || file.buffer.length,
    });
    return;
  }

  throw new Error("UPLOAD_FILE_HAS_NO_PATH_OR_BUFFER");
}

async function postWithFiles(path, fields = {}, files = [], timeout = 180000) {
  const form = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    form.append(key, typeof value === "string" ? value : JSON.stringify(value));
  });

  files.forEach(({ fieldName, file }) => {
    appendFileToForm(form, fieldName, file);
  });

  try {
    const headers = form.getHeaders();

    const contentLength = await new Promise((resolve, reject) => {
      form.getLength((err, length) => {
        if (err) return reject(err);
        resolve(length);
      });
    });

    if (Number.isFinite(contentLength)) {
      headers["Content-Length"] = contentLength;
    }

    const res = await axios.post(`${FACE_API_URL}${path}`, form, {
      headers,
      timeout,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return res.data;
  } catch (err) {
    if (err.response?.data) {
      const e = new Error(err.response.data.error || "FACE_SERVICE_ERROR");
      e.details = err.response.data;
      throw e;
    }

    if (err.code === "ECONNABORTED") {
      const e = new Error("FACE_SERVICE_TIMEOUT");
      e.details = { timeout, path };
      throw e;
    }

    const e = new Error(err.message || "FACE_SERVICE_UNAVAILABLE");
    e.details = { code: err.code };
    throw e;
  }
}

async function analyzeFromUpload(file) {
  const result = await postWithFiles(
    "/analyze",
    {},
    [{ fieldName: "photo", file }],
    60000
  );

  if (!result?.ok) {
    const e = new Error(result?.error || "FACE_ANALYZE_FAILED");
    e.details = result;
    throw e;
  }

  return result;
}

async function embedFromUpload(file) {
  const result = await postWithFiles(
    "/embed",
    {},
    [{ fieldName: "photo", file }],
    90000
  );

  if (!result?.ok) {
    const e = new Error(result?.error || "FACE_EMBED_FAILED");
    e.details = result;
    throw e;
  }

  return result;
}

async function enrollMulti(files, labels = []) {
  const safeFiles = (files || []).filter(Boolean).slice(0, 5);

  if (safeFiles.length < 3) {
    const e = new Error("minimum_3_photos_required");
    e.details = { count: safeFiles.length };
    throw e;
  }

  const photoFiles = safeFiles.map((file) => ({
    fieldName: "photos",
    file,
  }));

  const result = await postWithFiles(
    "/enroll-multi",
    { labels: labels || [] },
    photoFiles,
    240000
  );

  if (!result?.ok) {
    const e = new Error(result?.error || "FACE_ENROLL_FAILED");
    e.details = result;
    throw e;
  }

  return result;
}

async function verifyFromUpload(file, embeddings) {
  const result = await postWithFiles(
    "/verify",
    { embeddings },
    [{ fieldName: "photo", file }],
    90000
  );

  if (!result?.ok) {
    const e = new Error(result?.error || "FACE_VERIFY_FAILED");
    e.details = result;
    throw e;
  }

  return result;
}

module.exports = {
  analyzeFromUpload,
  embedFromUpload,
  enrollMulti,
  verifyFromUpload,
};