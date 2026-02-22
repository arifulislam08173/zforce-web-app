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
# THRESHOLD = 0.75  # lower = stricter

# def read_image(file_bytes: bytes):
#     arr = np.frombuffer(file_bytes, np.uint8)
#     img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
#     return img

# @app.get("/health")
# def health():
#     return {"ok": True, "model": MODEL_NAME, "detector": DETECTOR}

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
#     except:
#         return {"ok": False, "error": "no_face_detected"}

# @app.post("/verify")
# async def verify(photo: UploadFile = File(...), embedding: str = Form(...)):
#     img = read_image(await photo.read())
#     if img is None:
#         return {"ok": False, "error": "invalid_image"}

#     try:
#         stored_list = json.loads(embedding)  # ✅ safe
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
#     except:
#         return {"ok": False, "error": "no_face_detected"}






from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import json
from deepface import DeepFace

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MODEL_NAME = "Facenet512"
DETECTOR = "opencv"
THRESHOLD = 0.75  # lower=stricter

def read_image(file_bytes: bytes):
    arr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img

@app.on_event("startup")
def warmup():
    # warm-up: create a dummy image and run represent once
    dummy = np.zeros((224, 224, 3), dtype=np.uint8)
    try:
        DeepFace.represent(img_path=dummy, model_name=MODEL_NAME, detector_backend=DETECTOR, enforce_detection=False)
    except:
        pass

@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_NAME, "detector": DETECTOR, "threshold": THRESHOLD}

@app.post("/embed")
async def embed(photo: UploadFile = File(...)):
    img = read_image(await photo.read())
    if img is None:
        return {"ok": False, "error": "invalid_image"}
    try:
        reps = DeepFace.represent(
            img_path=img,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR,
            enforce_detection=True
        )
        return {"ok": True, "embedding": reps[0]["embedding"]}
    except Exception as e:
        return {"ok": False, "error": "no_face_detected"}

@app.post("/verify")
async def verify(photo: UploadFile = File(...), embedding: str = Form(...)):
    img = read_image(await photo.read())
    if img is None:
        return {"ok": False, "error": "invalid_image"}

    try:
        stored_list = json.loads(embedding)
        stored = np.array(stored_list, dtype=np.float32)

        reps = DeepFace.represent(
            img_path=img,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR,
            enforce_detection=True
        )
        curr = np.array(reps[0]["embedding"], dtype=np.float32)

        denom = (np.linalg.norm(stored) * np.linalg.norm(curr)) + 1e-8
        dist = 1.0 - float(np.dot(stored, curr) / denom)  # cosine distance

        return {"ok": True, "match": dist <= THRESHOLD, "distance": dist, "threshold": THRESHOLD}
    except Exception as e:
        return {"ok": False, "error": "no_face_detected"}

