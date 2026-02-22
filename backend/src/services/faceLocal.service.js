// const axios = require("axios");
// const fs = require("fs");
// const FormData = require("form-data");

// const FACE_URL = process.env.FACE_LOCAL_URL || "http://localhost:7001";

// async function embedFromFile(filePath) {
//   const fd = new FormData();
//   fd.append("photo", fs.createReadStream(filePath));

//   const res = await axios.post(`${FACE_URL}/embed`, fd, { headers: fd.getHeaders(), timeout: 30000 });
//   if (!res.data?.ok) throw new Error(res.data?.error || "embed_failed");
//   return res.data.embedding;
// }

// async function verifyWithEmbedding(filePath, embeddingArray) {
//   const fd = new FormData();
//   fd.append("photo", fs.createReadStream(filePath));
//   fd.append("embedding", JSON.stringify(embeddingArray));
//   const res = await axios.post(`${FACE_URL}/verify`, fd, { headers: fd.getHeaders(), timeout: 30000 });
//   if (!res.data?.ok) throw new Error(res.data?.error || "verify_failed");
//   return res.data; // {match,distance,threshold}
// }

// module.exports = { embedFromFile, verifyWithEmbedding };




// const axios = require("axios");
// const FormData = require("form-data");
// const fs = require("fs");

// const FACE_BASE = process.env.FACE_SERVICE_URL || "http://localhost:7001";

// async function postWithFile(url, file, extraFields = {}) {
//   const form = new FormData();

//   // ✅ support diskStorage (path)
//   if (file?.path) {
//     form.append("photo", fs.createReadStream(file.path), {
//       filename: file.originalname || "photo.jpg",
//       contentType: file.mimetype || "image/jpeg",
//     });
//   }
//   // ✅ support memoryStorage (buffer)
//   else if (file?.buffer) {
//     form.append("photo", file.buffer, {
//       filename: file.originalname || "photo.jpg",
//       contentType: file.mimetype || "image/jpeg",
//     });
//   } else {
//     throw new Error("FACE_FILE_MISSING");
//   }

//   Object.entries(extraFields).forEach(([k, v]) => {
//     form.append(k, typeof v === "string" ? v : JSON.stringify(v));
//   });

//   const res = await axios.post(url, form, {
//     headers: form.getHeaders(),
//     timeout: 120000, // ✅ deepface can take time
//   });

//   return res.data;
// }

// exports.embedFromUpload = async (file) => {
//   const data = await postWithFile(`${FACE_BASE}/embed`, file);
//   if (!data?.ok) throw new Error(data?.error || "embed_failed");
//   return data.embedding;
// };

// exports.verifyFromUpload = async (file, embedding) => {
//   const data = await postWithFile(`${FACE_BASE}/verify`, file, { embedding });
//   if (!data?.ok) throw new Error(data?.error || "verify_failed");
//   return data;
// };






// src/services/faceLocal.service.js
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const FACE_BASE = process.env.FACE_SERVICE_URL || "http://localhost:7001";

async function postWithFile(url, file, extraFields = {}) {
  const form = new FormData();

  // ✅ support diskStorage (path)
  if (file?.path) {
    form.append("photo", fs.createReadStream(file.path), {
      filename: file.originalname || "photo.jpg",
      contentType: file.mimetype || "image/jpeg",
    });
  }
  // ✅ support memoryStorage (buffer)
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
    timeout: 120000, // ✅ deepface can take time
  });

  return res.data;
}

async function embedFromUpload(file) {
  const data = await postWithFile(`${FACE_BASE}/embed`, file);

  // If your FaceService returns { embedding: [...] } only:
  // return data.embedding;

  // If your FaceService returns { ok: true, embedding: [...] }:
  if (data?.ok === false) throw new Error(data?.error || "embed_failed");
  if (!data?.embedding) throw new Error(data?.error || "embed_failed");

  return data.embedding;
}

async function verifyFromUpload(file, embedding) {
  const data = await postWithFile(`${FACE_BASE}/verify`, file, { embedding });

  if (data?.ok === false) throw new Error(data?.error || "verify_failed");
  return data;
}

/**
 * ✅ Backward-compatible alias
 * Some code calls embedFromFile(path). We'll support it by building a "file-like" object.
 */
async function embedFromFile(filePath) {
  if (!filePath) throw new Error("FACE_FILE_MISSING");
  const fakeMulter = { path: filePath, originalname: "photo.jpg", mimetype: "image/jpeg" };
  return embedFromUpload(fakeMulter);
}

module.exports = {
  embedFromUpload,
  verifyFromUpload,
  embedFromFile, // ✅ keeps older controller code from breaking (if used anywhere)
};
