# from fastapi import FastAPI, UploadFile, File, Form
# from fastapi.middleware.cors import CORSMiddleware
# import numpy as np
# import cv2
# import json
# from deepface import DeepFace

# app = FastAPI()
# app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# MODEL_NAME = "Facenet512"
# DETECTOR = "opencv"
# THRESHOLD = 0.75  # lower=stricter

# def read_image(file_bytes: bytes):
#     arr = np.frombuffer(file_bytes, np.uint8)
#     img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
#     return img

# @app.on_event("startup")
# def warmup():
#     # warm-up: create a dummy image and run represent once
#     dummy = np.zeros((224, 224, 3), dtype=np.uint8)
#     try:
#         DeepFace.represent(img_path=dummy, model_name=MODEL_NAME, detector_backend=DETECTOR, enforce_detection=False)
#     except:
#         pass

# @app.get("/health")
# def health():
#     return {"ok": True, "model": MODEL_NAME, "detector": DETECTOR, "threshold": THRESHOLD}

# @app.post("/embed")
# async def embed(photo: UploadFile = File(...)):
#     img = read_image(await photo.read())
#     if img is None:
#         return {"ok": False, "error": "invalid_image"}
#     try:
#         reps = DeepFace.represent(
#             img_path=img,
#             model_name=MODEL_NAME,
#             detector_backend=DETECTOR,
#             enforce_detection=True
#         )
#         return {"ok": True, "embedding": reps[0]["embedding"]}
#     except Exception as e:
#         return {"ok": False, "error": "no_face_detected"}

# @app.post("/verify")
# async def verify(photo: UploadFile = File(...), embedding: str = Form(...)):
#     img = read_image(await photo.read())
#     if img is None:
#         return {"ok": False, "error": "invalid_image"}

#     try:
#         stored_list = json.loads(embedding)
#         stored = np.array(stored_list, dtype=np.float32)

#         reps = DeepFace.represent(
#             img_path=img,
#             model_name=MODEL_NAME,
#             detector_backend=DETECTOR,
#             enforce_detection=True
#         )
#         curr = np.array(reps[0]["embedding"], dtype=np.float32)

#         denom = (np.linalg.norm(stored) * np.linalg.norm(curr)) + 1e-8
#         dist = 1.0 - float(np.dot(stored, curr) / denom)  # cosine distance

#         return {"ok": True, "match": dist <= THRESHOLD, "distance": dist, "threshold": THRESHOLD}
#     except Exception as e:
#         return {"ok": False, "error": "no_face_detected"}







# from fastapi import FastAPI, UploadFile, File, Form
# from fastapi.middleware.cors import CORSMiddleware
# from typing import List, Optional
# import numpy as np
# import cv2
# import json
# from deepface import DeepFace

# app = FastAPI()
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# MODEL_NAME = "ArcFace"
# DETECTOR = "retinaface"

# VERIFY_THRESHOLD = 0.42
# BORDERLINE_VERIFY_THRESHOLD = 0.40

# MIN_FACE_W = 100
# MIN_FACE_H = 100
# MIN_BRIGHTNESS = 45

# BLUR_HARD_REJECT = 25.0
# BLUR_WARN = 40.0

# # Performance / payload safety
# MAX_IMAGE_DIMENSION = 1280
# MAX_ENROLL_PHOTOS = 5
# MIN_ENROLL_PHOTOS = 3

# def read_image(file_bytes: bytes):
#     arr = np.frombuffer(file_bytes, np.uint8)
#     img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
#     return img

# def resize_for_processing(img: np.ndarray, max_dim: int = MAX_IMAGE_DIMENSION):
#     if img is None or img.size == 0:
#         return img

#     h, w = img.shape[:2]
#     longest = max(h, w)

#     if longest <= max_dim:
#         return img

#     scale = max_dim / float(longest)
#     new_w = int(w * scale)
#     new_h = int(h * scale)

#     return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

# def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
#     a = a.astype(np.float32)
#     b = b.astype(np.float32)
#     denom = (np.linalg.norm(a) * np.linalg.norm(b)) + 1e-8
#     return 1.0 - float(np.dot(a, b) / denom)

# def clamp(v: int, lo: int, hi: int) -> int:
#     return max(lo, min(hi, v))

# def crop_face_region(img: np.ndarray, facial_area: dict, pad_ratio: float = 0.20):
#     img_h, img_w = img.shape[:2]

#     x = int(facial_area.get("x", 0))
#     y = int(facial_area.get("y", 0))
#     w = int(facial_area.get("w", 0))
#     h = int(facial_area.get("h", 0))

#     if w <= 0 or h <= 0:
#         return img

#     pad_x = int(w * pad_ratio)
#     pad_y = int(h * pad_ratio)

#     x1 = clamp(x - pad_x, 0, img_w)
#     y1 = clamp(y - pad_y, 0, img_h)
#     x2 = clamp(x + w + pad_x, 0, img_w)
#     y2 = clamp(y + h + pad_y, 0, img_h)

#     crop = img[y1:y2, x1:x2]
#     if crop is None or crop.size == 0:
#         return img

#     return crop

# def image_quality_score(img: np.ndarray):
#     gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
#     brightness = float(np.mean(gray))
#     sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
#     return {
#         "brightness": round(brightness, 2),
#         "sharpness": round(sharpness, 2),
#     }

# def extract_face_and_embedding(img: np.ndarray):
#     img = resize_for_processing(img)

#     reps = DeepFace.represent(
#         img_path=img,
#         model_name=MODEL_NAME,
#         detector_backend=DETECTOR,
#         enforce_detection=True,
#     )

#     if not reps or len(reps) == 0:
#         raise ValueError("no_face_detected")

#     rep = reps[0]
#     facial_area = rep.get("facial_area", {}) or {}

#     w = int(facial_area.get("w", 0))
#     h = int(facial_area.get("h", 0))

#     if w < MIN_FACE_W or h < MIN_FACE_H:
#         raise ValueError("face_too_small")

#     face_crop = crop_face_region(img, facial_area, pad_ratio=0.20)
#     quality = image_quality_score(face_crop)

#     if quality["brightness"] < MIN_BRIGHTNESS:
#         raise ValueError("image_too_dark")

#     blur_status = "good"
#     if quality["sharpness"] < BLUR_HARD_REJECT:
#         raise ValueError("image_too_blurry")
#     elif quality["sharpness"] < BLUR_WARN:
#         blur_status = "borderline"

#     embedding = np.array(rep["embedding"], dtype=np.float32)

#     return {
#         "embedding": embedding,
#         "facial_area": {
#             "x": int(facial_area.get("x", 0)),
#             "y": int(facial_area.get("y", 0)),
#             "w": w,
#             "h": h,
#         },
#         "quality": quality,
#         "blur_status": blur_status,
#     }

# def deduplicate_embeddings(samples: list, duplicate_distance_threshold: float = 0.08):
#     if not samples:
#         return []

#     accepted = []

#     for sample in samples:
#         emb = np.array(sample["embedding"], dtype=np.float32)

#         is_duplicate = False
#         for kept in accepted:
#             kept_emb = np.array(kept["embedding"], dtype=np.float32)
#             dist = cosine_distance(emb, kept_emb)
#             if dist < duplicate_distance_threshold:
#                 is_duplicate = True
#                 break

#         if not is_duplicate:
#             accepted.append(sample)

#     return accepted

# @app.on_event("startup")
# def warmup():
#     dummy = np.zeros((224, 224, 3), dtype=np.uint8)
#     try:
#         DeepFace.represent(
#             img_path=dummy,
#             model_name=MODEL_NAME,
#             detector_backend=DETECTOR,
#             enforce_detection=False,
#         )
#     except Exception:
#         pass

# @app.get("/health")
# def health():
#     return {
#         "ok": True,
#         "model": MODEL_NAME,
#         "detector": DETECTOR,
#         "threshold": VERIFY_THRESHOLD,
#         "borderline_threshold": BORDERLINE_VERIFY_THRESHOLD,
#         "min_face_w": MIN_FACE_W,
#         "min_face_h": MIN_FACE_H,
#         "min_brightness": MIN_BRIGHTNESS,
#         "blur_hard_reject": BLUR_HARD_REJECT,
#         "blur_warn": BLUR_WARN,
#         "max_image_dimension": MAX_IMAGE_DIMENSION,
#         "min_enroll_photos": MIN_ENROLL_PHOTOS,
#         "max_enroll_photos": MAX_ENROLL_PHOTOS,
#     }

# @app.post("/analyze")
# async def analyze(photo: UploadFile = File(...)):
#     img = read_image(await photo.read())
#     if img is None:
#         return {"ok": False, "error": "invalid_image"}

#     try:
#         data = extract_face_and_embedding(img)
#         return {
#             "ok": True,
#             "quality": data["quality"],
#             "facial_area": data["facial_area"],
#             "blur_status": data["blur_status"],
#         }
#     except Exception as e:
#         return {"ok": False, "error": str(e)}

# @app.post("/embed")
# async def embed(photo: UploadFile = File(...)):
#     img = read_image(await photo.read())
#     if img is None:
#         return {"ok": False, "error": "invalid_image"}

#     try:
#         data = extract_face_and_embedding(img)
#         return {
#             "ok": True,
#             "embedding": data["embedding"].tolist(),
#             "quality": data["quality"],
#             "facial_area": data["facial_area"],
#             "blur_status": data["blur_status"],
#         }
#     except Exception as e:
#         return {"ok": False, "error": str(e)}

# @app.post("/enroll-multi")
# async def enroll_multi(
#     photos: List[UploadFile] = File(...),
#     labels: Optional[str] = Form(None),
# ):
#     if not photos or len(photos) < MIN_ENROLL_PHOTOS:
#         return {"ok": False, "error": "minimum_3_photos_required"}

#     photos = photos[:MAX_ENROLL_PHOTOS]

#     parsed_labels = []
#     if labels:
#         try:
#             parsed_labels = json.loads(labels)
#         except Exception:
#             parsed_labels = []

#     accepted = []
#     rejected = []

#     for i, photo in enumerate(photos):
#         try:
#             raw = await photo.read()
#             img = read_image(raw)
#             label = parsed_labels[i] if i < len(parsed_labels) else f"sample_{i+1}"

#             if img is None:
#                 rejected.append({"label": label, "reason": "invalid_image"})
#                 continue

#             data = extract_face_and_embedding(img)
#             accepted.append({
#                 "label": label,
#                 "embedding": data["embedding"].tolist(),
#                 "quality": data["quality"],
#                 "facial_area": data["facial_area"],
#                 "blur_status": data["blur_status"],
#             })
#         except Exception as e:
#             label = parsed_labels[i] if i < len(parsed_labels) else f"sample_{i+1}"
#             rejected.append({
#                 "label": label,
#                 "reason": str(e),
#             })

#     accepted = deduplicate_embeddings(accepted)

#     if len(accepted) < MIN_ENROLL_PHOTOS:
#         return {
#             "ok": False,
#             "error": "not_enough_good_samples",
#             "accepted_count": len(accepted),
#             "rejected_count": len(rejected),
#             "rejected": rejected,
#         }

#     return {
#         "ok": True,
#         "accepted_count": len(accepted),
#         "rejected_count": len(rejected),
#         "samples": accepted,
#         "rejected": rejected,
#     }

# @app.post("/verify")
# async def verify(
#     photo: UploadFile = File(...),
#     embeddings: str = Form(...),
# ):
#     img = read_image(await photo.read())
#     if img is None:
#         return {"ok": False, "error": "invalid_image"}

#     try:
#         stored_list = json.loads(embeddings)
#         stored_embeddings = [np.array(x, dtype=np.float32) for x in stored_list]

#         if len(stored_embeddings) == 0:
#             return {"ok": False, "error": "no_stored_embeddings"}

#         data = extract_face_and_embedding(img)
#         live = data["embedding"]

#         distances = [cosine_distance(s, live) for s in stored_embeddings]
#         distances_sorted = sorted(float(x) for x in distances)

#         best_distance = distances_sorted[0]
#         avg_top2 = float(np.mean(distances_sorted[:2])) if len(distances_sorted) >= 2 else best_distance
#         blur_status = data["blur_status"]

#         effective_threshold = BORDERLINE_VERIFY_THRESHOLD if blur_status == "borderline" else VERIFY_THRESHOLD
#         match = best_distance <= effective_threshold

#         return {
#             "ok": True,
#             "match": match,
#             "best_distance": float(best_distance),
#             "avg_top2_distance": float(avg_top2),
#             "threshold": float(effective_threshold),
#             "quality": data["quality"],
#             "facial_area": data["facial_area"],
#             "blur_status": blur_status,
#             "all_distances": distances_sorted,
#         }
#     except Exception as e:
#         return {"ok": False, "error": str(e)}










# ******* New Update (23-Apr-2026) ********
# from dotenv import load_dotenv
# load_dotenv()

# from fastapi import FastAPI, UploadFile, File, Form
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.concurrency import run_in_threadpool
# from typing import List, Optional
# import numpy as np
# import cv2
# import json
# import os
# from deepface import DeepFace

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # =========================
# # Tunable config
# # =========================
# MODEL_NAME = os.getenv("FACE_MODEL_NAME", "ArcFace")

# # Full enroll/verify detector order: opencv first, retinaface fallback.
# DETECTOR = os.getenv("FACE_DETECTOR", "opencv")

# VERIFY_THRESHOLD = float(os.getenv("VERIFY_THRESHOLD", "0.42"))
# BORDERLINE_VERIFY_THRESHOLD = float(os.getenv("BORDERLINE_VERIFY_THRESHOLD", "0.40"))

# MIN_FACE_W = int(os.getenv("MIN_FACE_W", "70"))
# MIN_FACE_H = int(os.getenv("MIN_FACE_H", "70"))
# MIN_BRIGHTNESS = int(os.getenv("MIN_BRIGHTNESS", "35"))

# BLUR_HARD_REJECT = float(os.getenv("BLUR_HARD_REJECT", "12.0"))
# BLUR_WARN = float(os.getenv("BLUR_WARN", "25.0"))

# # Server-side safety resize. Mobile should also compress before upload.
# MAX_IMAGE_DIMENSION = int(os.getenv("MAX_IMAGE_DIMENSION", "640"))
# MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "4"))

# # Analyze is only a pre-check; it must be fast.
# ANALYZE_IMAGE_DIMENSION = int(os.getenv("ANALYZE_IMAGE_DIMENSION", "640"))
# ANALYZE_DETECTOR = os.getenv("ANALYZE_DETECTOR", "opencv")

# # Strict fast-accept verify. Backend should fallback to /verify when not confident.
# FAST_VERIFY_IMAGE_DIMENSION = int(os.getenv("FAST_VERIFY_IMAGE_DIMENSION", "448"))
# FAST_VERIFY_ACCEPT_THRESHOLD = float(os.getenv("FAST_VERIFY_ACCEPT_THRESHOLD", "0.34"))
# FAST_VERIFY_BORDERLINE_ACCEPT_THRESHOLD = float(
#     os.getenv("FAST_VERIFY_BORDERLINE_ACCEPT_THRESHOLD", "0.32")
# )

# # Full-face / mask guard.
# FACE_OCCLUSION_CHECK = os.getenv("FACE_OCCLUSION_CHECK", "true").lower() != "false"
# FACE_OCCLUSION_CHECK_ENROLL = (
#     os.getenv("FACE_OCCLUSION_CHECK_ENROLL", "true").lower() != "false"
# )

# # These are deliberately conservative. Tune only if normal clear faces get rejected.
# OCCLUSION_MIN_LOWER_EDGE_DENSITY = float(
#     os.getenv("OCCLUSION_MIN_LOWER_EDGE_DENSITY", "0.012")
# )
# OCCLUSION_MIN_LOWER_SHARPNESS = float(
#     os.getenv("OCCLUSION_MIN_LOWER_SHARPNESS", "16.0")
# )
# OCCLUSION_MIN_LOWER_UPPER_SHARPNESS_RATIO = float(
#     os.getenv("OCCLUSION_MIN_LOWER_UPPER_SHARPNESS_RATIO", "0.18")
# )
# OCCLUSION_MIN_LOWER_SKIN_RATIO = float(
#     os.getenv("OCCLUSION_MIN_LOWER_SKIN_RATIO", "0.08")
# )
# OCCLUSION_MIN_LOWER_UPPER_SKIN_RATIO = float(
#     os.getenv("OCCLUSION_MIN_LOWER_UPPER_SKIN_RATIO", "0.35")
# )
# OCCLUSION_MIN_LOWER_COLOR_STD = float(
#     os.getenv("OCCLUSION_MIN_LOWER_COLOR_STD", "8.0")
# )

# MAX_ENROLL_PHOTOS = 3
# MIN_ENROLL_PHOTOS = 3


# def fail(code: str, extra: dict | None = None):
#     payload = {"ok": False, "error": code}
#     if extra:
#         payload.update(extra)
#     return payload


# def read_image(file_bytes: bytes):
#     arr = np.frombuffer(file_bytes, np.uint8)
#     img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
#     return img


# def validate_upload_size(file_bytes: bytes):
#     size_mb = len(file_bytes) / (1024 * 1024)
#     if size_mb > MAX_UPLOAD_MB:
#         raise ValueError("image_too_large")


# def resize_for_processing(img: np.ndarray, max_dim: int = MAX_IMAGE_DIMENSION):
#     if img is None or img.size == 0:
#         return img

#     h, w = img.shape[:2]
#     longest = max(h, w)

#     if longest <= max_dim:
#         return img

#     scale = max_dim / float(longest)
#     new_w = max(1, int(w * scale))
#     new_h = max(1, int(h * scale))

#     return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)


# def normalize_image_for_deepface(img: np.ndarray, max_dim: int = MAX_IMAGE_DIMENSION):
#     if img is None or img.size == 0:
#         raise ValueError("invalid_image")

#     if len(img.shape) == 2:
#         img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

#     if len(img.shape) == 3 and img.shape[2] == 4:
#         img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

#     img = resize_for_processing(img, max_dim)

#     if not img.flags["C_CONTIGUOUS"]:
#         img = np.ascontiguousarray(img)

#     return img


# def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
#     a = a.astype(np.float32)
#     b = b.astype(np.float32)
#     denom = (np.linalg.norm(a) * np.linalg.norm(b)) + 1e-8
#     return 1.0 - float(np.dot(a, b) / denom)


# def clamp(v: int, lo: int, hi: int) -> int:
#     return max(lo, min(hi, v))


# def crop_face_region(img: np.ndarray, facial_area: dict, pad_ratio: float = 0.15):
#     img_h, img_w = img.shape[:2]

#     x = int(facial_area.get("x", 0))
#     y = int(facial_area.get("y", 0))
#     w = int(facial_area.get("w", 0))
#     h = int(facial_area.get("h", 0))

#     if w <= 0 or h <= 0:
#         return img

#     pad_x = int(w * pad_ratio)
#     pad_y = int(h * pad_ratio)

#     x1 = clamp(x - pad_x, 0, img_w)
#     y1 = clamp(y - pad_y, 0, img_h)
#     x2 = clamp(x + w + pad_x, 0, img_w)
#     y2 = clamp(y + h + pad_y, 0, img_h)

#     crop = img[y1:y2, x1:x2]
#     if crop is None or crop.size == 0:
#         return img

#     return crop


# def image_quality_score(img: np.ndarray):
#     gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
#     brightness = float(np.mean(gray))
#     sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
#     return {
#         "brightness": round(brightness, 2),
#         "sharpness": round(sharpness, 2),
#     }


# def edge_density(region: np.ndarray) -> float:
#     if region is None or region.size == 0:
#         return 0.0

#     gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
#     edges = cv2.Canny(gray, 60, 140)
#     return float(np.mean(edges > 0))


# def skin_ratio(region: np.ndarray) -> float:
#     """
#     Broad skin-color estimate. This is not used alone; it is combined with
#     texture/edge checks so different skin tones and lighting are handled better.
#     """
#     if region is None or region.size == 0:
#         return 0.0

#     ycrcb = cv2.cvtColor(region, cv2.COLOR_BGR2YCrCb)
#     y, cr, cb = cv2.split(ycrcb)

#     # Broad YCrCb range for skin-like pixels.
#     mask_ycrcb = (
#         (y > 35)
#         & (cr > 125)
#         & (cr < 185)
#         & (cb > 70)
#         & (cb < 150)
#     )

#     hsv = cv2.cvtColor(region, cv2.COLOR_BGR2HSV)
#     h, s, v = cv2.split(hsv)

#     # Broad HSV assistance for red/yellow/brown ranges.
#     mask_hsv = (
#         (((h < 28) | (h > 165)))
#         & (s > 18)
#         & (s < 210)
#         & (v > 35)
#     )

#     mask = mask_ycrcb | mask_hsv
#     return float(np.mean(mask))


# def color_std(region: np.ndarray) -> float:
#     if region is None or region.size == 0:
#         return 0.0
#     return float(np.mean(np.std(region.astype(np.float32), axis=(0, 1))))


# def face_visibility_metrics(img: np.ndarray, facial_area: dict):
#     face = crop_face_region(img, facial_area, pad_ratio=0.05)

#     if face is None or face.size == 0:
#         raise ValueError("face_occluded")

#     fh, fw = face.shape[:2]
#     if fh < 80 or fw < 80:
#         raise ValueError("face_too_small")

#     # Avoid hair/forehead-only and chin-border areas.
#     upper = face[int(fh * 0.22): int(fh * 0.52), int(fw * 0.18): int(fw * 0.82)]
#     lower = face[int(fh * 0.52): int(fh * 0.92), int(fw * 0.20): int(fw * 0.80)]
#     lower_center = face[int(fh * 0.58): int(fh * 0.88), int(fw * 0.28): int(fw * 0.72)]

#     upper_quality = image_quality_score(upper)
#     lower_quality = image_quality_score(lower)
#     lower_center_quality = image_quality_score(lower_center)

#     upper_skin = skin_ratio(upper)
#     lower_skin = skin_ratio(lower_center)
#     lower_edges = edge_density(lower_center)
#     lower_color = color_std(lower_center)

#     upper_sharp = max(float(upper_quality["sharpness"]), 1.0)
#     lower_sharp = float(lower_center_quality["sharpness"])
#     sharp_ratio = lower_sharp / upper_sharp

#     return {
#         "upper_skin_ratio": round(upper_skin, 4),
#         "lower_skin_ratio": round(lower_skin, 4),
#         "lower_edge_density": round(lower_edges, 4),
#         "lower_sharpness": round(lower_sharp, 2),
#         "upper_sharpness": round(upper_sharp, 2),
#         "lower_upper_sharpness_ratio": round(sharp_ratio, 4),
#         "lower_color_std": round(lower_color, 2),
#         "upper_brightness": upper_quality["brightness"],
#         "lower_brightness": lower_quality["brightness"],
#     }


# def validate_full_face_visible(img: np.ndarray, facial_area: dict):
#     if not FACE_OCCLUSION_CHECK:
#         return None

#     metrics = face_visibility_metrics(img, facial_area)

#     lower_skin = metrics["lower_skin_ratio"]
#     upper_skin = metrics["upper_skin_ratio"]
#     lower_edges = metrics["lower_edge_density"]
#     lower_sharp = metrics["lower_sharpness"]
#     sharp_ratio = metrics["lower_upper_sharpness_ratio"]
#     lower_color = metrics["lower_color_std"]

#     skin_blocked = (
#         upper_skin >= 0.14
#         and lower_skin < OCCLUSION_MIN_LOWER_SKIN_RATIO
#         and lower_skin < (upper_skin * OCCLUSION_MIN_LOWER_UPPER_SKIN_RATIO)
#     )

#     texture_blocked = (
#         lower_edges < OCCLUSION_MIN_LOWER_EDGE_DENSITY
#         and lower_sharp < OCCLUSION_MIN_LOWER_SHARPNESS
#         and sharp_ratio < OCCLUSION_MIN_LOWER_UPPER_SHARPNESS_RATIO
#     )

#     flat_lower_face = (
#         lower_color < OCCLUSION_MIN_LOWER_COLOR_STD
#         and lower_edges < (OCCLUSION_MIN_LOWER_EDGE_DENSITY * 1.25)
#     )

#     # Reject when the lower face looks hidden/flat compared with the visible upper face.
#     # This catches masks, cloth, hand cover, and phone blocking mouth/nose area.
#     if skin_blocked or texture_blocked or (flat_lower_face and skin_blocked):
#         raise ValueError("face_occluded")

#     return metrics


# def map_error(e: Exception) -> str:
#     msg = str(e)

#     known = {
#         "no_face_detected",
#         "face_too_small",
#         "image_too_dark",
#         "image_too_blurry",
#         "invalid_image",
#         "image_too_large",
#         "minimum_3_photos_required",
#         "not_enough_good_samples",
#         "no_stored_embeddings",
#         "invalid_embeddings_payload",
#         "face_occluded",
#     }

#     return msg if msg in known else "face_processing_failed"


# def get_detector_candidates():
#     primary = DETECTOR or "opencv"
#     candidates = [primary, "opencv", "retinaface"]

#     unique = []
#     for detector in candidates:
#         if detector and detector not in unique:
#             unique.append(detector)

#     return unique


# def _deepface_represent(img: np.ndarray, allow_soft_fallback: bool = True):
#     last_error = None

#     for detector in get_detector_candidates():
#         try:
#             reps = DeepFace.represent(
#                 img_path=img,
#                 model_name=MODEL_NAME,
#                 detector_backend=detector,
#                 enforce_detection=True,
#             )

#             if reps and len(reps) > 0:
#                 return reps, detector

#         except Exception as e:
#             last_error = e
#             print(f"[FACE DEBUG] detector={detector} failed: {repr(e)}")

#     # Soft fallback is useful during enrollment on mixed devices,
#     # but it is NOT safe for attendance verification because it may embed a partial/covered frame.
#     if allow_soft_fallback:
#         try:
#             reps = DeepFace.represent(
#                 img_path=img,
#                 model_name=MODEL_NAME,
#                 detector_backend="opencv",
#                 enforce_detection=False,
#             )

#             if reps and len(reps) > 0:
#                 print("[FACE DEBUG] soft fallback enforce_detection=False succeeded")
#                 return reps, "opencv_soft"

#         except Exception as e:
#             last_error = e
#             print(f"[FACE DEBUG] soft fallback failed: {repr(e)}")

#     print(f"[FACE DEBUG] all detectors failed. last_error={repr(last_error)}")
#     raise ValueError("no_face_detected")


# def get_analyze_detector_candidates():
#     candidates = [ANALYZE_DETECTOR, "opencv"]

#     unique = []
#     for detector in candidates:
#         if detector and detector not in unique:
#             unique.append(detector)

#     return unique


# def _deepface_extract_faces(img: np.ndarray, soft_fallback: bool = True):
#     last_error = None

#     for detector in get_analyze_detector_candidates():
#         try:
#             faces = DeepFace.extract_faces(
#                 img_path=img,
#                 detector_backend=detector,
#                 enforce_detection=True,
#                 align=False,
#             )

#             if faces and len(faces) > 0:
#                 return faces, detector

#         except Exception as e:
#             last_error = e
#             print(f"[FACE DEBUG] extract detector={detector} failed: {repr(e)}")

#     if soft_fallback:
#         try:
#             faces = DeepFace.extract_faces(
#                 img_path=img,
#                 detector_backend="opencv",
#                 enforce_detection=False,
#                 align=False,
#             )

#             if faces and len(faces) > 0:
#                 print("[FACE DEBUG] extract soft fallback enforce_detection=False succeeded")
#                 return faces, "opencv_soft"

#         except Exception as e:
#             last_error = e
#             print(f"[FACE DEBUG] extract soft fallback failed: {repr(e)}")

#     print(f"[FACE DEBUG] extract all detectors failed. last_error={repr(last_error)}")
#     raise ValueError("no_face_detected")


# def validate_face_quality(
#     img: np.ndarray,
#     facial_area: dict,
#     used_detector: str,
#     require_full_face: bool = False,
# ):
#     w = int(facial_area.get("w", 0))
#     h = int(facial_area.get("h", 0))

#     if w <= 0 or h <= 0:
#         if used_detector == "opencv_soft" and not require_full_face:
#             img_h, img_w = img.shape[:2]
#             facial_area = {
#                 "x": 0,
#                 "y": 0,
#                 "w": img_w,
#                 "h": img_h,
#             }
#             w = img_w
#             h = img_h
#         else:
#             raise ValueError("no_face_detected")

#     if w < MIN_FACE_W or h < MIN_FACE_H:
#         raise ValueError("face_too_small")

#     face_crop = crop_face_region(img, facial_area, pad_ratio=0.15)
#     quality = image_quality_score(face_crop)

#     if quality["brightness"] < MIN_BRIGHTNESS:
#         raise ValueError("image_too_dark")

#     blur_status = "good"

#     if quality["sharpness"] < BLUR_HARD_REJECT:
#         raise ValueError("image_too_blurry")
#     elif quality["sharpness"] < BLUR_WARN:
#         blur_status = "borderline"

#     visibility = None
#     if require_full_face:
#         visibility = validate_full_face_visible(img, facial_area)

#     return {
#         "facial_area": {
#             "x": int(facial_area.get("x", 0)),
#             "y": int(facial_area.get("y", 0)),
#             "w": w,
#             "h": h,
#         },
#         "quality": quality,
#         "blur_status": blur_status,
#         "visibility": visibility,
#     }


# def extract_face_quality(img: np.ndarray):
#     """
#     Fast analyze mode.
#     This checks face presence + brightness + blur without calculating ArcFace embedding.
#     """
#     img = normalize_image_for_deepface(img, ANALYZE_IMAGE_DIMENSION)
#     faces, used_detector = _deepface_extract_faces(img, soft_fallback=True)

#     if not faces or len(faces) == 0:
#         raise ValueError("no_face_detected")

#     face_obj = faces[0]
#     facial_area = face_obj.get("facial_area", {}) or {}

#     quality_data = validate_face_quality(
#         img,
#         facial_area,
#         used_detector,
#         require_full_face=False,
#     )

#     print(
#         "[FACE DEBUG] analyze accepted detector=",
#         used_detector,
#         "face=",
#         {
#             "w": quality_data["facial_area"]["w"],
#             "h": quality_data["facial_area"]["h"],
#         },
#         "quality=",
#         quality_data["quality"],
#     )

#     return {
#         **quality_data,
#         "detector": used_detector,
#     }


# def extract_face_and_embedding(img: np.ndarray, verify_mode: bool = False):
#     img = normalize_image_for_deepface(img, MAX_IMAGE_DIMENSION)

#     reps, used_detector = _deepface_represent(
#         img,
#         allow_soft_fallback=not verify_mode,
#     )

#     if not reps or len(reps) == 0:
#         raise ValueError("no_face_detected")

#     rep = reps[0]
#     facial_area = rep.get("facial_area", {}) or {}

#     require_full_face = bool(verify_mode or FACE_OCCLUSION_CHECK_ENROLL)

#     quality_data = validate_face_quality(
#         img,
#         facial_area,
#         used_detector,
#         require_full_face=require_full_face,
#     )

#     print(
#         "[FACE DEBUG] accepted detector=",
#         used_detector,
#         "face=",
#         {
#             "w": quality_data["facial_area"]["w"],
#             "h": quality_data["facial_area"]["h"],
#         },
#         "quality=",
#         quality_data["quality"],
#         "visibility=",
#         quality_data.get("visibility"),
#     )

#     embedding = np.array(rep["embedding"], dtype=np.float32)

#     return {
#         "embedding": embedding,
#         **quality_data,
#         "detector": used_detector,
#     }


# def extract_fast_verify_embedding(img: np.ndarray):
#     """
#     Fast strict attendance path:
#     - actual face detection required
#     - full lower-face visibility required
#     - ArcFace embedding on cropped face using detector_backend=skip
#     """
#     img = normalize_image_for_deepface(img, FAST_VERIFY_IMAGE_DIMENSION)

#     faces, used_detector = _deepface_extract_faces(img, soft_fallback=False)

#     if not faces or len(faces) == 0:
#         raise ValueError("no_face_detected")

#     face_obj = faces[0]
#     facial_area = face_obj.get("facial_area", {}) or {}

#     quality_data = validate_face_quality(
#         img,
#         facial_area,
#         used_detector,
#         require_full_face=True,
#     )

#     face_crop = crop_face_region(img, quality_data["facial_area"], pad_ratio=0.20)

#     reps = DeepFace.represent(
#         img_path=face_crop,
#         model_name=MODEL_NAME,
#         detector_backend="skip",
#         enforce_detection=False,
#     )

#     if not reps or len(reps) == 0:
#         raise ValueError("no_face_detected")

#     embedding = np.array(reps[0]["embedding"], dtype=np.float32)

#     print(
#         "[FACE DEBUG] fast verify accepted detector=",
#         used_detector,
#         "quality=",
#         quality_data["quality"],
#         "visibility=",
#         quality_data.get("visibility"),
#     )

#     return {
#         "embedding": embedding,
#         **quality_data,
#         "detector": used_detector,
#     }


# def deduplicate_embeddings(samples: list, duplicate_distance_threshold: float = 0.08):
#     if not samples:
#         return []

#     accepted = []

#     for sample in samples:
#         emb = np.array(sample["embedding"], dtype=np.float32)

#         is_duplicate = False
#         for kept in accepted:
#             kept_emb = np.array(kept["embedding"], dtype=np.float32)
#             dist = cosine_distance(emb, kept_emb)

#             if dist < duplicate_distance_threshold:
#                 is_duplicate = True
#                 break

#         if not is_duplicate:
#             accepted.append(sample)

#     return accepted


# @app.on_event("startup")
# def warmup():
#     dummy = np.zeros((224, 224, 3), dtype=np.uint8)
#     try:
#         DeepFace.represent(
#             img_path=dummy,
#             model_name=MODEL_NAME,
#             detector_backend="opencv",
#             enforce_detection=False,
#         )
#     except Exception as e:
#         print(f"[FACE DEBUG] represent warmup skipped: {repr(e)}")

#     try:
#         DeepFace.extract_faces(
#             img_path=dummy,
#             detector_backend="opencv",
#             enforce_detection=False,
#             align=False,
#         )
#     except Exception as e:
#         print(f"[FACE DEBUG] extract warmup skipped: {repr(e)}")


# @app.get("/health")
# def health():
#     return {
#         "ok": True,
#         "model": MODEL_NAME,
#         "detector": DETECTOR,
#         "detector_candidates": get_detector_candidates(),
#         "threshold": VERIFY_THRESHOLD,
#         "borderline_threshold": BORDERLINE_VERIFY_THRESHOLD,
#         "min_face_w": MIN_FACE_W,
#         "min_face_h": MIN_FACE_H,
#         "min_brightness": MIN_BRIGHTNESS,
#         "blur_hard_reject": BLUR_HARD_REJECT,
#         "blur_warn": BLUR_WARN,
#         "max_image_dimension": MAX_IMAGE_DIMENSION,
#         "analyze_image_dimension": ANALYZE_IMAGE_DIMENSION,
#         "analyze_detector": ANALYZE_DETECTOR,
#         "fast_verify_image_dimension": FAST_VERIFY_IMAGE_DIMENSION,
#         "fast_verify_accept_threshold": FAST_VERIFY_ACCEPT_THRESHOLD,
#         "fast_verify_borderline_accept_threshold": FAST_VERIFY_BORDERLINE_ACCEPT_THRESHOLD,
#         "face_occlusion_check": FACE_OCCLUSION_CHECK,
#         "face_occlusion_check_enroll": FACE_OCCLUSION_CHECK_ENROLL,
#         "occlusion_min_lower_edge_density": OCCLUSION_MIN_LOWER_EDGE_DENSITY,
#         "occlusion_min_lower_sharpness": OCCLUSION_MIN_LOWER_SHARPNESS,
#         "occlusion_min_lower_upper_sharpness_ratio": OCCLUSION_MIN_LOWER_UPPER_SHARPNESS_RATIO,
#         "occlusion_min_lower_skin_ratio": OCCLUSION_MIN_LOWER_SKIN_RATIO,
#         "occlusion_min_lower_upper_skin_ratio": OCCLUSION_MIN_LOWER_UPPER_SKIN_RATIO,
#         "min_enroll_photos": MIN_ENROLL_PHOTOS,
#         "max_enroll_photos": MAX_ENROLL_PHOTOS,
#         "max_upload_mb": MAX_UPLOAD_MB,
#         "analyze_mode": "fast_quality_check",
#         "verify_fast_mode": "strict_fast_accept_with_full_face_guard",
#     }


# @app.post("/analyze")
# async def analyze(photo: UploadFile = File(...)):
#     try:
#         raw = await photo.read()
#         validate_upload_size(raw)

#         img = read_image(raw)
#         if img is None:
#             return fail("invalid_image")

#         data = await run_in_threadpool(extract_face_quality, img)

#         return {
#             "ok": True,
#             "quality": data["quality"],
#             "facial_area": data["facial_area"],
#             "blur_status": data["blur_status"],
#             "detector": data.get("detector"),
#             "mode": "fast_quality_check",
#         }

#     except Exception as e:
#         code = map_error(e)
#         print(f"[FACE DEBUG] analyze failed: code={code}, error={repr(e)}")
#         return fail(code)


# @app.post("/embed")
# async def embed(photo: UploadFile = File(...)):
#     try:
#         raw = await photo.read()
#         validate_upload_size(raw)

#         img = read_image(raw)
#         if img is None:
#             return fail("invalid_image")

#         data = await run_in_threadpool(extract_face_and_embedding, img, False)

#         return {
#             "ok": True,
#             "embedding": data["embedding"].tolist(),
#             "quality": data["quality"],
#             "facial_area": data["facial_area"],
#             "blur_status": data["blur_status"],
#             "detector": data.get("detector"),
#             "visibility": data.get("visibility"),
#         }

#     except Exception as e:
#         code = map_error(e)
#         print(f"[FACE DEBUG] embed failed: code={code}, error={repr(e)}")
#         return fail(code)


# @app.post("/enroll-multi")
# async def enroll_multi(
#     photos: List[UploadFile] = File(...),
#     labels: Optional[str] = Form(None),
# ):
#     if not photos or len(photos) < MIN_ENROLL_PHOTOS:
#         return fail("minimum_3_photos_required")

#     photos = photos[:MAX_ENROLL_PHOTOS]

#     parsed_labels = []
#     if labels:
#         try:
#             parsed_labels = json.loads(labels)
#         except Exception:
#             parsed_labels = []

#     accepted = []
#     rejected = []

#     for i, photo in enumerate(photos):
#         label = parsed_labels[i] if i < len(parsed_labels) else f"sample_{i + 1}"

#         try:
#             raw = await photo.read()
#             validate_upload_size(raw)

#             img = read_image(raw)
#             if img is None:
#                 rejected.append({"label": label, "reason": "invalid_image"})
#                 continue

#             data = await run_in_threadpool(extract_face_and_embedding, img, False)

#             accepted.append({
#                 "label": label,
#                 "embedding": data["embedding"].tolist(),
#                 "quality": data["quality"],
#                 "facial_area": data["facial_area"],
#                 "blur_status": data["blur_status"],
#                 "detector": data.get("detector"),
#                 "visibility": data.get("visibility"),
#             })

#         except Exception as e:
#             reason = map_error(e)
#             print(f"[FACE DEBUG] enroll sample failed: label={label}, reason={reason}, error={repr(e)}")
#             rejected.append({
#                 "label": label,
#                 "reason": reason,
#             })

#     accepted = deduplicate_embeddings(accepted)

#     if len(accepted) < MIN_ENROLL_PHOTOS:
#         return fail(
#             "not_enough_good_samples",
#             {
#                 "accepted_count": len(accepted),
#                 "rejected_count": len(rejected),
#                 "rejected": rejected,
#             },
#         )

#     return {
#         "ok": True,
#         "accepted_count": len(accepted),
#         "rejected_count": len(rejected),
#         "samples": accepted,
#         "rejected": rejected,
#     }


# @app.post("/verify-fast")
# async def verify_fast(
#     photo: UploadFile = File(...),
#     embeddings: str = Form(...),
# ):
#     try:
#         raw = await photo.read()
#         validate_upload_size(raw)

#         img = read_image(raw)
#         if img is None:
#             return fail("invalid_image", {"mode": "fast", "fallback_required": True})

#         try:
#             stored_list = json.loads(embeddings)
#             stored_embeddings = [np.array(x, dtype=np.float32) for x in stored_list]
#         except Exception:
#             return fail(
#                 "invalid_embeddings_payload",
#                 {"mode": "fast", "fallback_required": True},
#             )

#         if len(stored_embeddings) == 0:
#             return fail("no_stored_embeddings", {"mode": "fast", "fallback_required": True})

#         data = await run_in_threadpool(extract_fast_verify_embedding, img)
#         live = data["embedding"]

#         distances = [cosine_distance(s, live) for s in stored_embeddings]
#         distances_sorted = sorted(float(x) for x in distances)

#         best_distance = distances_sorted[0]
#         blur_status = data["blur_status"]

#         effective_threshold = (
#             FAST_VERIFY_BORDERLINE_ACCEPT_THRESHOLD
#             if blur_status == "borderline"
#             else FAST_VERIFY_ACCEPT_THRESHOLD
#         )

#         match = best_distance <= effective_threshold

#         return {
#             "ok": True,
#             "match": bool(match),
#             "mode": "fast",
#             "best_distance": float(best_distance),
#             "threshold": float(effective_threshold),
#             "blur_status": blur_status,
#             "quality": data["quality"],
#             "detector": data.get("detector"),
#             "visibility": data.get("visibility"),
#             "fallback_required": not bool(match),
#         }

#     except Exception as e:
#         code = map_error(e)
#         print(f"[FACE DEBUG] verify-fast failed: code={code}, error={repr(e)}")

#         # For occlusion, do NOT treat it as a normal low-confidence fallback.
#         # Backend should return this to user as "remove mask / show full face".
#         fallback_required = code != "face_occluded"

#         return fail(
#             code,
#             {
#                 "mode": "fast",
#                 "fallback_required": fallback_required,
#             },
#         )


# @app.post("/verify")
# async def verify(
#     photo: UploadFile = File(...),
#     embeddings: str = Form(...),
# ):
#     try:
#         raw = await photo.read()
#         validate_upload_size(raw)

#         img = read_image(raw)
#         if img is None:
#             return fail("invalid_image")

#         try:
#             stored_list = json.loads(embeddings)
#             stored_embeddings = [np.array(x, dtype=np.float32) for x in stored_list]
#         except Exception:
#             return fail("invalid_embeddings_payload")

#         if len(stored_embeddings) == 0:
#             return fail("no_stored_embeddings")

#         data = await run_in_threadpool(extract_face_and_embedding, img, True)
#         live = data["embedding"]

#         distances = [cosine_distance(s, live) for s in stored_embeddings]
#         distances_sorted = sorted(float(x) for x in distances)

#         best_distance = distances_sorted[0]
#         blur_status = data["blur_status"]

#         effective_threshold = (
#             BORDERLINE_VERIFY_THRESHOLD
#             if blur_status == "borderline"
#             else VERIFY_THRESHOLD
#         )

#         match = best_distance <= effective_threshold

#         return {
#             "ok": True,
#             "match": bool(match),
#             "mode": "full",
#             "best_distance": float(best_distance),
#             "threshold": float(effective_threshold),
#             "blur_status": blur_status,
#             "quality": data["quality"],
#             "detector": data.get("detector"),
#             "visibility": data.get("visibility"),
#         }

#     except Exception as e:
#         code = map_error(e)
#         print(f"[FACE DEBUG] verify failed: code={code}, error={repr(e)}")
#         return fail(code)
















from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from typing import List, Optional
import numpy as np
import cv2
import json
import os
from deepface import DeepFace

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Tunable config
# =========================
MODEL_NAME = os.getenv("FACE_MODEL_NAME", "ArcFace")

# Full enroll/verify detector order: opencv first, retinaface fallback.
DETECTOR = os.getenv("FACE_DETECTOR", "opencv")

VERIFY_THRESHOLD = float(os.getenv("VERIFY_THRESHOLD", "0.42"))
BORDERLINE_VERIFY_THRESHOLD = float(os.getenv("BORDERLINE_VERIFY_THRESHOLD", "0.40"))

MIN_FACE_W = int(os.getenv("MIN_FACE_W", "70"))
MIN_FACE_H = int(os.getenv("MIN_FACE_H", "70"))
MIN_BRIGHTNESS = int(os.getenv("MIN_BRIGHTNESS", "35"))

BLUR_HARD_REJECT = float(os.getenv("BLUR_HARD_REJECT", "12.0"))
BLUR_WARN = float(os.getenv("BLUR_WARN", "25.0"))

# Server-side safety resize. Mobile should also compress before upload.
MAX_IMAGE_DIMENSION = int(os.getenv("MAX_IMAGE_DIMENSION", "640"))
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "4"))

# Analyze is only a pre-check; it must be fast.
ANALYZE_IMAGE_DIMENSION = int(os.getenv("ANALYZE_IMAGE_DIMENSION", "640"))
ANALYZE_DETECTOR = os.getenv("ANALYZE_DETECTOR", "opencv")

# Strict fast-accept verify. Backend should fallback to /verify when not confident.
FAST_VERIFY_IMAGE_DIMENSION = int(os.getenv("FAST_VERIFY_IMAGE_DIMENSION", "448"))
FAST_VERIFY_ACCEPT_THRESHOLD = float(os.getenv("FAST_VERIFY_ACCEPT_THRESHOLD", "0.34"))
FAST_VERIFY_BORDERLINE_ACCEPT_THRESHOLD = float(
    os.getenv("FAST_VERIFY_BORDERLINE_ACCEPT_THRESHOLD", "0.32")
)

# Full-face / mask guard.
FACE_OCCLUSION_CHECK = os.getenv("FACE_OCCLUSION_CHECK", "true").lower() != "false"
FACE_OCCLUSION_CHECK_ENROLL = (
    os.getenv("FACE_OCCLUSION_CHECK_ENROLL", "true").lower() != "false"
)

# These are deliberately conservative. Tune only if normal clear faces get rejected.
OCCLUSION_MIN_LOWER_EDGE_DENSITY = float(
    os.getenv("OCCLUSION_MIN_LOWER_EDGE_DENSITY", "0.012")
)
OCCLUSION_MIN_LOWER_SHARPNESS = float(
    os.getenv("OCCLUSION_MIN_LOWER_SHARPNESS", "16.0")
)
OCCLUSION_MIN_LOWER_UPPER_SHARPNESS_RATIO = float(
    os.getenv("OCCLUSION_MIN_LOWER_UPPER_SHARPNESS_RATIO", "0.18")
)
OCCLUSION_MIN_LOWER_SKIN_RATIO = float(
    os.getenv("OCCLUSION_MIN_LOWER_SKIN_RATIO", "0.08")
)
OCCLUSION_MIN_LOWER_UPPER_SKIN_RATIO = float(
    os.getenv("OCCLUSION_MIN_LOWER_UPPER_SKIN_RATIO", "0.35")
)
OCCLUSION_MIN_LOWER_COLOR_STD = float(
    os.getenv("OCCLUSION_MIN_LOWER_COLOR_STD", "10.0")
)

# Strict attendance security: if lower-face skin/texture looks suspicious, reject.
# This is important for attendance apps because ArcFace may still match a masked user
# from eyes/forehead only. Keep true for punch in/out.
OCCLUSION_STRICT_MODE = os.getenv("OCCLUSION_STRICT_MODE", "true").lower() != "false"

MAX_ENROLL_PHOTOS = 3
MIN_ENROLL_PHOTOS = 3


def fail(code: str, extra: dict | None = None):
    payload = {"ok": False, "error": code}
    if extra:
        payload.update(extra)
    return payload


def read_image(file_bytes: bytes):
    arr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img


def validate_upload_size(file_bytes: bytes):
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_MB:
        raise ValueError("image_too_large")


def resize_for_processing(img: np.ndarray, max_dim: int = MAX_IMAGE_DIMENSION):
    if img is None or img.size == 0:
        return img

    h, w = img.shape[:2]
    longest = max(h, w)

    if longest <= max_dim:
        return img

    scale = max_dim / float(longest)
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))

    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)


def normalize_image_for_deepface(img: np.ndarray, max_dim: int = MAX_IMAGE_DIMENSION):
    if img is None or img.size == 0:
        raise ValueError("invalid_image")

    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

    if len(img.shape) == 3 and img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

    img = resize_for_processing(img, max_dim)

    if not img.flags["C_CONTIGUOUS"]:
        img = np.ascontiguousarray(img)

    return img


def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
    a = a.astype(np.float32)
    b = b.astype(np.float32)
    denom = (np.linalg.norm(a) * np.linalg.norm(b)) + 1e-8
    return 1.0 - float(np.dot(a, b) / denom)


def clamp(v: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, v))


def crop_face_region(img: np.ndarray, facial_area: dict, pad_ratio: float = 0.15):
    img_h, img_w = img.shape[:2]

    x = int(facial_area.get("x", 0))
    y = int(facial_area.get("y", 0))
    w = int(facial_area.get("w", 0))
    h = int(facial_area.get("h", 0))

    if w <= 0 or h <= 0:
        return img

    pad_x = int(w * pad_ratio)
    pad_y = int(h * pad_ratio)

    x1 = clamp(x - pad_x, 0, img_w)
    y1 = clamp(y - pad_y, 0, img_h)
    x2 = clamp(x + w + pad_x, 0, img_w)
    y2 = clamp(y + h + pad_y, 0, img_h)

    crop = img[y1:y2, x1:x2]
    if crop is None or crop.size == 0:
        return img

    return crop


def image_quality_score(img: np.ndarray):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    return {
        "brightness": round(brightness, 2),
        "sharpness": round(sharpness, 2),
    }


def edge_density(region: np.ndarray) -> float:
    if region is None or region.size == 0:
        return 0.0

    gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 60, 140)
    return float(np.mean(edges > 0))


def skin_ratio(region: np.ndarray) -> float:
    """
    Broad skin-color estimate. This is not used alone; it is combined with
    texture/edge checks so different skin tones and lighting are handled better.
    """
    if region is None or region.size == 0:
        return 0.0

    ycrcb = cv2.cvtColor(region, cv2.COLOR_BGR2YCrCb)
    y, cr, cb = cv2.split(ycrcb)

    # Broad YCrCb range for skin-like pixels.
    mask_ycrcb = (
        (y > 35)
        & (cr > 125)
        & (cr < 185)
        & (cb > 70)
        & (cb < 150)
    )

    hsv = cv2.cvtColor(region, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)

    # Broad HSV assistance for red/yellow/brown ranges.
    mask_hsv = (
        (((h < 28) | (h > 165)))
        & (s > 18)
        & (s < 210)
        & (v > 35)
    )

    mask = mask_ycrcb | mask_hsv
    return float(np.mean(mask))


def color_std(region: np.ndarray) -> float:
    if region is None or region.size == 0:
        return 0.0
    return float(np.mean(np.std(region.astype(np.float32), axis=(0, 1))))


def face_visibility_metrics(img: np.ndarray, facial_area: dict):
    face = crop_face_region(img, facial_area, pad_ratio=0.05)

    if face is None or face.size == 0:
        raise ValueError("face_occluded")

    fh, fw = face.shape[:2]
    if fh < 80 or fw < 80:
        raise ValueError("face_too_small")

    # Avoid hair/forehead-only and chin-border areas.
    upper = face[int(fh * 0.22): int(fh * 0.52), int(fw * 0.18): int(fw * 0.82)]
    lower = face[int(fh * 0.52): int(fh * 0.92), int(fw * 0.20): int(fw * 0.80)]
    lower_center = face[int(fh * 0.58): int(fh * 0.88), int(fw * 0.28): int(fw * 0.72)]

    upper_quality = image_quality_score(upper)
    lower_quality = image_quality_score(lower)
    lower_center_quality = image_quality_score(lower_center)

    upper_skin = skin_ratio(upper)
    lower_skin = skin_ratio(lower_center)
    lower_edges = edge_density(lower_center)
    lower_color = color_std(lower_center)

    upper_sharp = max(float(upper_quality["sharpness"]), 1.0)
    lower_sharp = float(lower_center_quality["sharpness"])
    sharp_ratio = lower_sharp / upper_sharp

    return {
        "upper_skin_ratio": round(upper_skin, 4),
        "lower_skin_ratio": round(lower_skin, 4),
        "lower_edge_density": round(lower_edges, 4),
        "lower_sharpness": round(lower_sharp, 2),
        "upper_sharpness": round(upper_sharp, 2),
        "lower_upper_sharpness_ratio": round(sharp_ratio, 4),
        "lower_color_std": round(lower_color, 2),
        "upper_brightness": upper_quality["brightness"],
        "lower_brightness": lower_quality["brightness"],
    }


def validate_full_face_visible(img: np.ndarray, facial_area: dict):
    """
    Strict full-face visibility guard.

    Why this exists:
    ArcFace can sometimes match the same user from eyes/forehead only. For
    attendance, that is unsafe. This guard rejects masks, hands, cloth, phone
    covers, and lower-face obstruction before identity matching is accepted.
    """
    if not FACE_OCCLUSION_CHECK:
        return None

    metrics = face_visibility_metrics(img, facial_area)

    upper_skin = float(metrics["upper_skin_ratio"])
    lower_skin = float(metrics["lower_skin_ratio"])
    lower_edges = float(metrics["lower_edge_density"])
    lower_sharp = float(metrics["lower_sharpness"])
    sharp_ratio = float(metrics["lower_upper_sharpness_ratio"])
    lower_color = float(metrics["lower_color_std"])
    upper_brightness = float(metrics.get("upper_brightness", 0.0))
    lower_brightness = float(metrics.get("lower_brightness", 0.0))
    brightness_gap = abs(upper_brightness - lower_brightness)

    # A normal uncovered lower face should usually have enough skin-like pixels.
    # A mask/cloth often drops lower_skin sharply while upper face remains skin-like.
    absolute_skin_blocked = lower_skin < OCCLUSION_MIN_LOWER_SKIN_RATIO
    relative_skin_blocked = (
        upper_skin >= 0.10
        and lower_skin < (upper_skin * OCCLUSION_MIN_LOWER_UPPER_SKIN_RATIO)
    )

    # A covered lower face is often flatter/smoother or less detailed than the upper face.
    texture_flat = (
        lower_edges < OCCLUSION_MIN_LOWER_EDGE_DENSITY
        or lower_sharp < OCCLUSION_MIN_LOWER_SHARPNESS
        or sharp_ratio < OCCLUSION_MIN_LOWER_UPPER_SHARPNESS_RATIO
    )

    # Cloth/mask/hand regions often have lower color variation than real mouth/nose/chin skin.
    color_flat = lower_color < OCCLUSION_MIN_LOWER_COLOR_STD

    # Some masks are bright/dark compared with upper face.
    suspicious_brightness = brightness_gap > 45 and lower_skin < (OCCLUSION_MIN_LOWER_SKIN_RATIO * 1.4)

    # Strong reject rules.
    # In strict mode, skin absence alone is enough when the upper face is visible,
    # because attendance must require nose/mouth/chin visibility.
    strict_skin_missing = (
        OCCLUSION_STRICT_MODE
        and upper_skin >= 0.12
        and absolute_skin_blocked
    )

    covered_by_multiple_signals = (
        (absolute_skin_blocked or relative_skin_blocked)
        and (texture_flat or color_flat or suspicious_brightness)
    )

    very_flat_lower_face = (
        color_flat
        and lower_edges < (OCCLUSION_MIN_LOWER_EDGE_DENSITY * 1.35)
        and sharp_ratio < (OCCLUSION_MIN_LOWER_UPPER_SHARPNESS_RATIO * 1.35)
    )

    if strict_skin_missing or covered_by_multiple_signals or very_flat_lower_face:
        print(
            "[FACE DEBUG] face occlusion rejected visibility=",
            metrics,
            "rules=",
            {
                "strict_skin_missing": strict_skin_missing,
                "covered_by_multiple_signals": covered_by_multiple_signals,
                "very_flat_lower_face": very_flat_lower_face,
                "absolute_skin_blocked": absolute_skin_blocked,
                "relative_skin_blocked": relative_skin_blocked,
                "texture_flat": texture_flat,
                "color_flat": color_flat,
                "suspicious_brightness": suspicious_brightness,
            },
        )
        raise ValueError("face_occluded")

    return {
        **metrics,
        "full_face_visible": True,
    }

def map_error(e: Exception) -> str:
    msg = str(e)

    known = {
        "no_face_detected",
        "face_too_small",
        "image_too_dark",
        "image_too_blurry",
        "invalid_image",
        "image_too_large",
        "minimum_3_photos_required",
        "not_enough_good_samples",
        "no_stored_embeddings",
        "invalid_embeddings_payload",
        "face_occluded",
    }

    return msg if msg in known else "face_processing_failed"


def get_detector_candidates():
    primary = DETECTOR or "opencv"
    candidates = [primary, "opencv", "retinaface"]

    unique = []
    for detector in candidates:
        if detector and detector not in unique:
            unique.append(detector)

    return unique


def _deepface_represent(img: np.ndarray, allow_soft_fallback: bool = True):
    last_error = None

    for detector in get_detector_candidates():
        try:
            reps = DeepFace.represent(
                img_path=img,
                model_name=MODEL_NAME,
                detector_backend=detector,
                enforce_detection=True,
            )

            if reps and len(reps) > 0:
                return reps, detector

        except Exception as e:
            last_error = e
            print(f"[FACE DEBUG] detector={detector} failed: {repr(e)}")

    # Soft fallback is useful during enrollment on mixed devices,
    # but it is NOT safe for attendance verification because it may embed a partial/covered frame.
    if allow_soft_fallback:
        try:
            reps = DeepFace.represent(
                img_path=img,
                model_name=MODEL_NAME,
                detector_backend="opencv",
                enforce_detection=False,
            )

            if reps and len(reps) > 0:
                print("[FACE DEBUG] soft fallback enforce_detection=False succeeded")
                return reps, "opencv_soft"

        except Exception as e:
            last_error = e
            print(f"[FACE DEBUG] soft fallback failed: {repr(e)}")

    print(f"[FACE DEBUG] all detectors failed. last_error={repr(last_error)}")
    raise ValueError("no_face_detected")


def get_analyze_detector_candidates():
    candidates = [ANALYZE_DETECTOR, "opencv"]

    unique = []
    for detector in candidates:
        if detector and detector not in unique:
            unique.append(detector)

    return unique


def _deepface_extract_faces(img: np.ndarray, soft_fallback: bool = True):
    last_error = None

    for detector in get_analyze_detector_candidates():
        try:
            faces = DeepFace.extract_faces(
                img_path=img,
                detector_backend=detector,
                enforce_detection=True,
                align=False,
            )

            if faces and len(faces) > 0:
                return faces, detector

        except Exception as e:
            last_error = e
            print(f"[FACE DEBUG] extract detector={detector} failed: {repr(e)}")

    if soft_fallback:
        try:
            faces = DeepFace.extract_faces(
                img_path=img,
                detector_backend="opencv",
                enforce_detection=False,
                align=False,
            )

            if faces and len(faces) > 0:
                print("[FACE DEBUG] extract soft fallback enforce_detection=False succeeded")
                return faces, "opencv_soft"

        except Exception as e:
            last_error = e
            print(f"[FACE DEBUG] extract soft fallback failed: {repr(e)}")

    print(f"[FACE DEBUG] extract all detectors failed. last_error={repr(last_error)}")
    raise ValueError("no_face_detected")


def validate_face_quality(
    img: np.ndarray,
    facial_area: dict,
    used_detector: str,
    require_full_face: bool = False,
):
    w = int(facial_area.get("w", 0))
    h = int(facial_area.get("h", 0))

    if w <= 0 or h <= 0:
        if used_detector == "opencv_soft" and not require_full_face:
            img_h, img_w = img.shape[:2]
            facial_area = {
                "x": 0,
                "y": 0,
                "w": img_w,
                "h": img_h,
            }
            w = img_w
            h = img_h
        else:
            raise ValueError("no_face_detected")

    if w < MIN_FACE_W or h < MIN_FACE_H:
        raise ValueError("face_too_small")

    face_crop = crop_face_region(img, facial_area, pad_ratio=0.15)
    quality = image_quality_score(face_crop)

    if quality["brightness"] < MIN_BRIGHTNESS:
        raise ValueError("image_too_dark")

    blur_status = "good"

    if quality["sharpness"] < BLUR_HARD_REJECT:
        raise ValueError("image_too_blurry")
    elif quality["sharpness"] < BLUR_WARN:
        blur_status = "borderline"

    visibility = None
    if require_full_face:
        visibility = validate_full_face_visible(img, facial_area)

    return {
        "facial_area": {
            "x": int(facial_area.get("x", 0)),
            "y": int(facial_area.get("y", 0)),
            "w": w,
            "h": h,
        },
        "quality": quality,
        "blur_status": blur_status,
        "visibility": visibility,
    }


def extract_face_quality(img: np.ndarray):
    """
    Fast analyze mode.
    This checks face presence + brightness + blur without calculating ArcFace embedding.
    """
    img = normalize_image_for_deepface(img, ANALYZE_IMAGE_DIMENSION)
    faces, used_detector = _deepface_extract_faces(img, soft_fallback=True)

    if not faces or len(faces) == 0:
        raise ValueError("no_face_detected")

    face_obj = faces[0]
    facial_area = face_obj.get("facial_area", {}) or {}

    quality_data = validate_face_quality(
        img,
        facial_area,
        used_detector,
        require_full_face=False,
    )

    print(
        "[FACE DEBUG] analyze accepted detector=",
        used_detector,
        "face=",
        {
            "w": quality_data["facial_area"]["w"],
            "h": quality_data["facial_area"]["h"],
        },
        "quality=",
        quality_data["quality"],
    )

    return {
        **quality_data,
        "detector": used_detector,
    }


def extract_face_and_embedding(img: np.ndarray, verify_mode: bool = False):
    img = normalize_image_for_deepface(img, MAX_IMAGE_DIMENSION)

    reps, used_detector = _deepface_represent(
        img,
        allow_soft_fallback=not verify_mode,
    )

    if not reps or len(reps) == 0:
        raise ValueError("no_face_detected")

    rep = reps[0]
    facial_area = rep.get("facial_area", {}) or {}

    require_full_face = bool(verify_mode or FACE_OCCLUSION_CHECK_ENROLL)

    quality_data = validate_face_quality(
        img,
        facial_area,
        used_detector,
        require_full_face=require_full_face,
    )

    print(
        "[FACE DEBUG] accepted detector=",
        used_detector,
        "face=",
        {
            "w": quality_data["facial_area"]["w"],
            "h": quality_data["facial_area"]["h"],
        },
        "quality=",
        quality_data["quality"],
        "visibility=",
        quality_data.get("visibility"),
    )

    embedding = np.array(rep["embedding"], dtype=np.float32)

    return {
        "embedding": embedding,
        **quality_data,
        "detector": used_detector,
    }


def extract_fast_verify_embedding(img: np.ndarray):
    """
    Fast strict attendance path:
    - actual face detection required
    - full lower-face visibility required
    - ArcFace embedding on cropped face using detector_backend=skip
    """
    img = normalize_image_for_deepface(img, FAST_VERIFY_IMAGE_DIMENSION)

    faces, used_detector = _deepface_extract_faces(img, soft_fallback=False)

    if not faces or len(faces) == 0:
        raise ValueError("no_face_detected")

    face_obj = faces[0]
    facial_area = face_obj.get("facial_area", {}) or {}

    quality_data = validate_face_quality(
        img,
        facial_area,
        used_detector,
        require_full_face=True,
    )

    face_crop = crop_face_region(img, quality_data["facial_area"], pad_ratio=0.20)

    reps = DeepFace.represent(
        img_path=face_crop,
        model_name=MODEL_NAME,
        detector_backend="skip",
        enforce_detection=False,
    )

    if not reps or len(reps) == 0:
        raise ValueError("no_face_detected")

    embedding = np.array(reps[0]["embedding"], dtype=np.float32)

    print(
        "[FACE DEBUG] fast verify accepted detector=",
        used_detector,
        "quality=",
        quality_data["quality"],
        "visibility=",
        quality_data.get("visibility"),
    )

    return {
        "embedding": embedding,
        **quality_data,
        "detector": used_detector,
    }


def deduplicate_embeddings(samples: list, duplicate_distance_threshold: float = 0.08):
    if not samples:
        return []

    accepted = []

    for sample in samples:
        emb = np.array(sample["embedding"], dtype=np.float32)

        is_duplicate = False
        for kept in accepted:
            kept_emb = np.array(kept["embedding"], dtype=np.float32)
            dist = cosine_distance(emb, kept_emb)

            if dist < duplicate_distance_threshold:
                is_duplicate = True
                break

        if not is_duplicate:
            accepted.append(sample)

    return accepted


@app.on_event("startup")
def warmup():
    dummy = np.zeros((224, 224, 3), dtype=np.uint8)
    try:
        DeepFace.represent(
            img_path=dummy,
            model_name=MODEL_NAME,
            detector_backend="opencv",
            enforce_detection=False,
        )
    except Exception as e:
        print(f"[FACE DEBUG] represent warmup skipped: {repr(e)}")

    try:
        DeepFace.extract_faces(
            img_path=dummy,
            detector_backend="opencv",
            enforce_detection=False,
            align=False,
        )
    except Exception as e:
        print(f"[FACE DEBUG] extract warmup skipped: {repr(e)}")


@app.get("/health")
def health():
    return {
        "ok": True,
        "model": MODEL_NAME,
        "detector": DETECTOR,
        "detector_candidates": get_detector_candidates(),
        "threshold": VERIFY_THRESHOLD,
        "borderline_threshold": BORDERLINE_VERIFY_THRESHOLD,
        "min_face_w": MIN_FACE_W,
        "min_face_h": MIN_FACE_H,
        "min_brightness": MIN_BRIGHTNESS,
        "blur_hard_reject": BLUR_HARD_REJECT,
        "blur_warn": BLUR_WARN,
        "max_image_dimension": MAX_IMAGE_DIMENSION,
        "analyze_image_dimension": ANALYZE_IMAGE_DIMENSION,
        "analyze_detector": ANALYZE_DETECTOR,
        "fast_verify_image_dimension": FAST_VERIFY_IMAGE_DIMENSION,
        "fast_verify_accept_threshold": FAST_VERIFY_ACCEPT_THRESHOLD,
        "fast_verify_borderline_accept_threshold": FAST_VERIFY_BORDERLINE_ACCEPT_THRESHOLD,
        "face_occlusion_check": FACE_OCCLUSION_CHECK,
        "face_occlusion_check_enroll": FACE_OCCLUSION_CHECK_ENROLL,
        "occlusion_strict_mode": OCCLUSION_STRICT_MODE,
        "occlusion_min_lower_edge_density": OCCLUSION_MIN_LOWER_EDGE_DENSITY,
        "occlusion_min_lower_sharpness": OCCLUSION_MIN_LOWER_SHARPNESS,
        "occlusion_min_lower_upper_sharpness_ratio": OCCLUSION_MIN_LOWER_UPPER_SHARPNESS_RATIO,
        "occlusion_min_lower_skin_ratio": OCCLUSION_MIN_LOWER_SKIN_RATIO,
        "occlusion_min_lower_upper_skin_ratio": OCCLUSION_MIN_LOWER_UPPER_SKIN_RATIO,
        "min_enroll_photos": MIN_ENROLL_PHOTOS,
        "max_enroll_photos": MAX_ENROLL_PHOTOS,
        "max_upload_mb": MAX_UPLOAD_MB,
        "analyze_mode": "fast_quality_check",
        "verify_fast_mode": "strict_fast_accept_with_full_face_guard",
    }


@app.post("/analyze")
async def analyze(photo: UploadFile = File(...)):
    try:
        raw = await photo.read()
        validate_upload_size(raw)

        img = read_image(raw)
        if img is None:
            return fail("invalid_image")

        data = await run_in_threadpool(extract_face_quality, img)

        return {
            "ok": True,
            "quality": data["quality"],
            "facial_area": data["facial_area"],
            "blur_status": data["blur_status"],
            "detector": data.get("detector"),
            "mode": "fast_quality_check",
        }

    except Exception as e:
        code = map_error(e)
        print(f"[FACE DEBUG] analyze failed: code={code}, error={repr(e)}")
        return fail(code)


@app.post("/embed")
async def embed(photo: UploadFile = File(...)):
    try:
        raw = await photo.read()
        validate_upload_size(raw)

        img = read_image(raw)
        if img is None:
            return fail("invalid_image")

        data = await run_in_threadpool(extract_face_and_embedding, img, False)

        return {
            "ok": True,
            "embedding": data["embedding"].tolist(),
            "quality": data["quality"],
            "facial_area": data["facial_area"],
            "blur_status": data["blur_status"],
            "detector": data.get("detector"),
            "visibility": data.get("visibility"),
        }

    except Exception as e:
        code = map_error(e)
        print(f"[FACE DEBUG] embed failed: code={code}, error={repr(e)}")
        return fail(code)


@app.post("/enroll-multi")
async def enroll_multi(
    photos: List[UploadFile] = File(...),
    labels: Optional[str] = Form(None),
):
    if not photos or len(photos) < MIN_ENROLL_PHOTOS:
        return fail("minimum_3_photos_required")

    photos = photos[:MAX_ENROLL_PHOTOS]

    parsed_labels = []
    if labels:
        try:
            parsed_labels = json.loads(labels)
        except Exception:
            parsed_labels = []

    accepted = []
    rejected = []

    for i, photo in enumerate(photos):
        label = parsed_labels[i] if i < len(parsed_labels) else f"sample_{i + 1}"

        try:
            raw = await photo.read()
            validate_upload_size(raw)

            img = read_image(raw)
            if img is None:
                rejected.append({"label": label, "reason": "invalid_image"})
                continue

            data = await run_in_threadpool(extract_face_and_embedding, img, False)

            accepted.append({
                "label": label,
                "embedding": data["embedding"].tolist(),
                "quality": data["quality"],
                "facial_area": data["facial_area"],
                "blur_status": data["blur_status"],
                "detector": data.get("detector"),
                "visibility": data.get("visibility"),
            })

        except Exception as e:
            reason = map_error(e)
            print(f"[FACE DEBUG] enroll sample failed: label={label}, reason={reason}, error={repr(e)}")
            rejected.append({
                "label": label,
                "reason": reason,
            })

    accepted = deduplicate_embeddings(accepted)

    if len(accepted) < MIN_ENROLL_PHOTOS:
        return fail(
            "not_enough_good_samples",
            {
                "accepted_count": len(accepted),
                "rejected_count": len(rejected),
                "rejected": rejected,
            },
        )

    return {
        "ok": True,
        "accepted_count": len(accepted),
        "rejected_count": len(rejected),
        "samples": accepted,
        "rejected": rejected,
    }


@app.post("/verify-fast")
async def verify_fast(
    photo: UploadFile = File(...),
    embeddings: str = Form(...),
):
    try:
        raw = await photo.read()
        validate_upload_size(raw)

        img = read_image(raw)
        if img is None:
            return fail("invalid_image", {"mode": "fast", "fallback_required": True})

        try:
            stored_list = json.loads(embeddings)
            stored_embeddings = [np.array(x, dtype=np.float32) for x in stored_list]
        except Exception:
            return fail(
                "invalid_embeddings_payload",
                {"mode": "fast", "fallback_required": True},
            )

        if len(stored_embeddings) == 0:
            return fail("no_stored_embeddings", {"mode": "fast", "fallback_required": True})

        data = await run_in_threadpool(extract_fast_verify_embedding, img)
        live = data["embedding"]

        distances = [cosine_distance(s, live) for s in stored_embeddings]
        distances_sorted = sorted(float(x) for x in distances)

        best_distance = distances_sorted[0]
        blur_status = data["blur_status"]

        effective_threshold = (
            FAST_VERIFY_BORDERLINE_ACCEPT_THRESHOLD
            if blur_status == "borderline"
            else FAST_VERIFY_ACCEPT_THRESHOLD
        )

        match = best_distance <= effective_threshold

        return {
            "ok": True,
            "match": bool(match),
            "mode": "fast",
            "best_distance": float(best_distance),
            "threshold": float(effective_threshold),
            "blur_status": blur_status,
            "quality": data["quality"],
            "detector": data.get("detector"),
            "visibility": data.get("visibility"),
            "fallback_required": not bool(match),
        }

    except Exception as e:
        code = map_error(e)
        print(f"[FACE DEBUG] verify-fast failed: code={code}, error={repr(e)}")

        # For occlusion, do NOT treat it as a normal low-confidence fallback.
        # Backend should return this to user as "remove mask / show full face".
        fallback_required = code != "face_occluded"

        return fail(
            code,
            {
                "mode": "fast",
                "fallback_required": fallback_required,
            },
        )


@app.post("/verify")
async def verify(
    photo: UploadFile = File(...),
    embeddings: str = Form(...),
):
    try:
        raw = await photo.read()
        validate_upload_size(raw)

        img = read_image(raw)
        if img is None:
            return fail("invalid_image")

        try:
            stored_list = json.loads(embeddings)
            stored_embeddings = [np.array(x, dtype=np.float32) for x in stored_list]
        except Exception:
            return fail("invalid_embeddings_payload")

        if len(stored_embeddings) == 0:
            return fail("no_stored_embeddings")

        data = await run_in_threadpool(extract_face_and_embedding, img, True)
        live = data["embedding"]

        distances = [cosine_distance(s, live) for s in stored_embeddings]
        distances_sorted = sorted(float(x) for x in distances)

        best_distance = distances_sorted[0]
        blur_status = data["blur_status"]

        effective_threshold = (
            BORDERLINE_VERIFY_THRESHOLD
            if blur_status == "borderline"
            else VERIFY_THRESHOLD
        )

        match = best_distance <= effective_threshold

        return {
            "ok": True,
            "match": bool(match),
            "mode": "full",
            "best_distance": float(best_distance),
            "threshold": float(effective_threshold),
            "blur_status": blur_status,
            "quality": data["quality"],
            "detector": data.get("detector"),
            "visibility": data.get("visibility"),
        }

    except Exception as e:
        code = map_error(e)
        print(f"[FACE DEBUG] verify failed: code={code}, error={repr(e)}")
        return fail(code)
