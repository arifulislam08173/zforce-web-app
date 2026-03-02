const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const FACE_BASE = process.env.FACE_SERVICE_URL || "http://localhost:7001";

async function postWithFile(url, file, extraFields = {}) {
  const form = new FormData();

  // support diskStorage
  if (file?.path) {
    form.append("photo", fs.createReadStream(file.path), {
      filename: file.originalname || "photo.jpg",
      contentType: file.mimetype || "image/jpeg",
    });
  }
  // support memoryStorage
  else if (file?.buffer) {
    form.append("photo", file.buffer, {
      filename: file.originalname || "photo.jpg",
      contentType: file.mimetype || "image/jpeg",
    });
  } else {
    throw new Error("FACE_FILE_MISSING");
  }

  Object.entries(extraFields).forEach(([k, v]) => {
    form.append(k, typeof v === "string" ? v : JSON.stringify(v));
  });

  const res = await axios.post(url, form, {
    headers: form.getHeaders(),
    timeout: 120000,
  });

  return res.data;
}

async function embedFromUpload(file) {
  const data = await postWithFile(`${FACE_BASE}/embed`, file);

  // Face emmbinding data
  if (data?.ok === false) throw new Error(data?.error || "embed_failed");
  if (!data?.embedding) throw new Error(data?.error || "embed_failed");

  return data.embedding;
}

async function verifyFromUpload(file, embedding) {
  const data = await postWithFile(`${FACE_BASE}/verify`, file, { embedding });

  if (data?.ok === false) throw new Error(data?.error || "verify_failed");
  return data;
}

async function embedFromFile(filePath) {
  if (!filePath) throw new Error("FACE_FILE_MISSING");
  const fakeMulter = { path: filePath, originalname: "photo.jpg", mimetype: "image/jpeg" };
  return embedFromUpload(fakeMulter);
}

module.exports = {
  embedFromUpload,
  verifyFromUpload,
  embedFromFile,
};
