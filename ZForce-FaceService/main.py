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







from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import numpy as np
import cv2
import json
from deepface import DeepFace

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = "ArcFace"
DETECTOR = "retinaface"

VERIFY_THRESHOLD = 0.42
BORDERLINE_VERIFY_THRESHOLD = 0.40

MIN_FACE_W = 100
MIN_FACE_H = 100
MIN_BRIGHTNESS = 45

BLUR_HARD_REJECT = 25.0
BLUR_WARN = 40.0

# Performance / payload safety
MAX_IMAGE_DIMENSION = 1280
MAX_ENROLL_PHOTOS = 5
MIN_ENROLL_PHOTOS = 3

def read_image(file_bytes: bytes):
    arr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img

def resize_for_processing(img: np.ndarray, max_dim: int = MAX_IMAGE_DIMENSION):
    if img is None or img.size == 0:
        return img

    h, w = img.shape[:2]
    longest = max(h, w)

    if longest <= max_dim:
        return img

    scale = max_dim / float(longest)
    new_w = int(w * scale)
    new_h = int(h * scale)

    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
    a = a.astype(np.float32)
    b = b.astype(np.float32)
    denom = (np.linalg.norm(a) * np.linalg.norm(b)) + 1e-8
    return 1.0 - float(np.dot(a, b) / denom)

def clamp(v: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, v))

def crop_face_region(img: np.ndarray, facial_area: dict, pad_ratio: float = 0.20):
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

def extract_face_and_embedding(img: np.ndarray):
    img = resize_for_processing(img)

    reps = DeepFace.represent(
        img_path=img,
        model_name=MODEL_NAME,
        detector_backend=DETECTOR,
        enforce_detection=True,
    )

    if not reps or len(reps) == 0:
        raise ValueError("no_face_detected")

    rep = reps[0]
    facial_area = rep.get("facial_area", {}) or {}

    w = int(facial_area.get("w", 0))
    h = int(facial_area.get("h", 0))

    if w < MIN_FACE_W or h < MIN_FACE_H:
        raise ValueError("face_too_small")

    face_crop = crop_face_region(img, facial_area, pad_ratio=0.20)
    quality = image_quality_score(face_crop)

    if quality["brightness"] < MIN_BRIGHTNESS:
        raise ValueError("image_too_dark")

    blur_status = "good"
    if quality["sharpness"] < BLUR_HARD_REJECT:
        raise ValueError("image_too_blurry")
    elif quality["sharpness"] < BLUR_WARN:
        blur_status = "borderline"

    embedding = np.array(rep["embedding"], dtype=np.float32)

    return {
        "embedding": embedding,
        "facial_area": {
            "x": int(facial_area.get("x", 0)),
            "y": int(facial_area.get("y", 0)),
            "w": w,
            "h": h,
        },
        "quality": quality,
        "blur_status": blur_status,
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
            detector_backend=DETECTOR,
            enforce_detection=False,
        )
    except Exception:
        pass

@app.get("/health")
def health():
    return {
        "ok": True,
        "model": MODEL_NAME,
        "detector": DETECTOR,
        "threshold": VERIFY_THRESHOLD,
        "borderline_threshold": BORDERLINE_VERIFY_THRESHOLD,
        "min_face_w": MIN_FACE_W,
        "min_face_h": MIN_FACE_H,
        "min_brightness": MIN_BRIGHTNESS,
        "blur_hard_reject": BLUR_HARD_REJECT,
        "blur_warn": BLUR_WARN,
        "max_image_dimension": MAX_IMAGE_DIMENSION,
        "min_enroll_photos": MIN_ENROLL_PHOTOS,
        "max_enroll_photos": MAX_ENROLL_PHOTOS,
    }

@app.post("/analyze")
async def analyze(photo: UploadFile = File(...)):
    img = read_image(await photo.read())
    if img is None:
        return {"ok": False, "error": "invalid_image"}

    try:
        data = extract_face_and_embedding(img)
        return {
            "ok": True,
            "quality": data["quality"],
            "facial_area": data["facial_area"],
            "blur_status": data["blur_status"],
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/embed")
async def embed(photo: UploadFile = File(...)):
    img = read_image(await photo.read())
    if img is None:
        return {"ok": False, "error": "invalid_image"}

    try:
        data = extract_face_and_embedding(img)
        return {
            "ok": True,
            "embedding": data["embedding"].tolist(),
            "quality": data["quality"],
            "facial_area": data["facial_area"],
            "blur_status": data["blur_status"],
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/enroll-multi")
async def enroll_multi(
    photos: List[UploadFile] = File(...),
    labels: Optional[str] = Form(None),
):
    if not photos or len(photos) < MIN_ENROLL_PHOTOS:
        return {"ok": False, "error": "minimum_3_photos_required"}

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
        try:
            raw = await photo.read()
            img = read_image(raw)
            label = parsed_labels[i] if i < len(parsed_labels) else f"sample_{i+1}"

            if img is None:
                rejected.append({"label": label, "reason": "invalid_image"})
                continue

            data = extract_face_and_embedding(img)
            accepted.append({
                "label": label,
                "embedding": data["embedding"].tolist(),
                "quality": data["quality"],
                "facial_area": data["facial_area"],
                "blur_status": data["blur_status"],
            })
        except Exception as e:
            label = parsed_labels[i] if i < len(parsed_labels) else f"sample_{i+1}"
            rejected.append({
                "label": label,
                "reason": str(e),
            })

    accepted = deduplicate_embeddings(accepted)

    if len(accepted) < MIN_ENROLL_PHOTOS:
        return {
            "ok": False,
            "error": "not_enough_good_samples",
            "accepted_count": len(accepted),
            "rejected_count": len(rejected),
            "rejected": rejected,
        }

    return {
        "ok": True,
        "accepted_count": len(accepted),
        "rejected_count": len(rejected),
        "samples": accepted,
        "rejected": rejected,
    }

@app.post("/verify")
async def verify(
    photo: UploadFile = File(...),
    embeddings: str = Form(...),
):
    img = read_image(await photo.read())
    if img is None:
        return {"ok": False, "error": "invalid_image"}

    try:
        stored_list = json.loads(embeddings)
        stored_embeddings = [np.array(x, dtype=np.float32) for x in stored_list]

        if len(stored_embeddings) == 0:
            return {"ok": False, "error": "no_stored_embeddings"}

        data = extract_face_and_embedding(img)
        live = data["embedding"]

        distances = [cosine_distance(s, live) for s in stored_embeddings]
        distances_sorted = sorted(float(x) for x in distances)

        best_distance = distances_sorted[0]
        avg_top2 = float(np.mean(distances_sorted[:2])) if len(distances_sorted) >= 2 else best_distance
        blur_status = data["blur_status"]

        effective_threshold = BORDERLINE_VERIFY_THRESHOLD if blur_status == "borderline" else VERIFY_THRESHOLD
        match = best_distance <= effective_threshold

        return {
            "ok": True,
            "match": match,
            "best_distance": float(best_distance),
            "avg_top2_distance": float(avg_top2),
            "threshold": float(effective_threshold),
            "quality": data["quality"],
            "facial_area": data["facial_area"],
            "blur_status": blur_status,
            "all_distances": distances_sorted,
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}