"""Flask backend for TumorNet authentication and MRI prediction."""

import base64
import sqlite3
import traceback
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from uuid import uuid4

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Allow the React development server to call this Flask API.
CORS(app)

# Keep the SQLite file beside this app.py file.
BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "tumornet.db"
UPLOAD_FOLDER = BASE_DIR / "uploads"
MODEL_PATH = BASE_DIR / "models" / "model.h5"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "bmp", "webp"}
CLASS_LABELS = ["pituitary", "glioma", "notumor", "meningioma"]

TUMOR_INFO = {
    "glioma": {
        "display_name": "Glioma",
        "status": "Tumor Detected",
        "description": "Glioma is a tumor of the brain or spinal cord support cells. Its grade and location affect symptoms and treatment, so specialist review is recommended.",
        "growth_rate": "Can vary from low to high",
        "common_in": "Adults",
        "treatment_options": "Surgery, radiation therapy, chemotherapy",
    },
    "meningioma": {
        "display_name": "Meningioma",
        "status": "Tumor Detected",
        "description": "Meningioma forms in the protective layers around the brain and spinal cord. Many grow slowly, but larger tumors can press on nearby tissue and need medical review.",
        "growth_rate": "Usually slow-growing",
        "common_in": "Adults, more common in older age groups",
        "treatment_options": "Monitoring, surgery, radiation therapy",
    },
    "pituitary": {
        "display_name": "Pituitary Tumor",
        "status": "Tumor Detected",
        "description": "A pituitary tumor occurs near the hormone-controlling gland at the base of the brain. It may affect vision or hormone balance and should be evaluated clinically.",
        "growth_rate": "Often slow-growing",
        "common_in": "Adults",
        "treatment_options": "Medication, surgery, radiation therapy",
    },
    "notumor": {
        "display_name": "No Tumor",
        "status": "No Tumor Pattern Detected",
        "description": "No supported tumor pattern was detected by the AI model. This result is not a final diagnosis and should be reviewed by a clinician if symptoms are present.",
        "growth_rate": "Not applicable",
        "common_in": "Not applicable",
        "treatment_options": "Clinical review if symptoms are present",
    },
}

MODEL_INFO = {
    "name": "VGG16 Transfer Learning",
    "version": "Brain Model v1",
    "framework": "TensorFlow/Keras",
    "input_size": "128x128 MRI",
    "type": "Four-class brain MRI classification",
}

UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)


def get_database():
    """Open a database connection that returns rows like dictionaries."""
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def create_users_table():
    """Create the users table once when the backend starts."""
    with get_database() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            )
            """
        )
        connection.commit()


def create_reports_table():
    """Create the reports table for saved user PDF reports."""
    with get_database() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                detected_type TEXT NOT NULL,
                analysis_date TEXT NOT NULL,
                pdf_data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )
        connection.commit()


def allowed_file(filename):
    """Return true when the uploaded file extension is supported."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@lru_cache(maxsize=1)
def load_prediction_model():
    """Load the trained VGG16 model once and reuse it for predictions."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

    import tensorflow as tf

    from model_loader import build_model

    tf.keras.mixed_precision.set_global_policy("float32")
    model = build_model()
    model.load_weights(str(MODEL_PATH))
    print(f"[MODEL] Loaded trained model from: {MODEL_PATH}", flush=True)
    return model


def predict_tumor(image_path):
    """Preprocess an MRI image and return model prediction details."""
    import numpy as np
    from tensorflow.keras.preprocessing.image import img_to_array, load_img

    image_size = 128
    model = load_prediction_model()
    image = load_img(str(image_path), target_size=(image_size, image_size))
    image_array = img_to_array(image) / 255.0
    image_array = np.expand_dims(image_array, axis=0)

    predictions = model.predict(image_array, verbose=0)[0]
    predicted_index = int(np.argmax(predictions))
    predicted_label = CLASS_LABELS[predicted_index]
    confidence = float(predictions[predicted_index])
    probabilities = {
        CLASS_LABELS[index]: float(probability * 100)
        for index, probability in enumerate(predictions)
    }

    return {
        "predicted_label": predicted_label,
        "display_label": TUMOR_INFO[predicted_label]["display_name"],
        "status": TUMOR_INFO[predicted_label]["status"],
        "confidence": confidence,
        "confidence_percent": confidence * 100,
        "probabilities": probabilities,
        "info": TUMOR_INFO[predicted_label],
        "model_info": MODEL_INFO,
    }


@app.post("/register")
def register():
    """Validate and save a new user account."""
    data = request.get_json(silent=True) or {}
    full_name = str(data.get("full_name", "")).strip()
    username = str(data.get("username", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not all((full_name, username, email, password)):
        return jsonify(success=False, message="All fields are required"), 400

    with get_database() as connection:
        existing_username = connection.execute(
            "SELECT id FROM users WHERE LOWER(username) = LOWER(?)", (username,)
        ).fetchone()
        if existing_username:
            return jsonify(success=False, message="Username already exists"), 409

        existing_email = connection.execute(
            "SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (email,)
        ).fetchone()
        if existing_email:
            return jsonify(success=False, message="Email already exists"), 409

        connection.execute(
            """
            INSERT INTO users (full_name, username, email, password)
            VALUES (?, ?, ?, ?)
            """,
            (full_name, username, email, password),
        )
        connection.commit()

    print(f"[REGISTER] Account created for username: {username}", flush=True)
    return jsonify(success=True, message="Account created successfully"), 201


@app.post("/login")
def login():
    """Log in using either a username or an email address."""
    data = request.get_json(silent=True) or {}
    identifier = str(data.get("emailOrUsername", "")).strip()
    password = str(data.get("password", ""))

    if not identifier or not password:
        return jsonify(
            success=False, message="Email/username and password are required"
        ), 400

    with get_database() as connection:
        user = connection.execute(
            """
            SELECT id, full_name, username, email
            FROM users
            WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?))
              AND password = ?
            """,
            (identifier, identifier, password),
        ).fetchone()

    if not user:
        print(f"[LOGIN FAILED] Invalid credentials for: {identifier}", flush=True)
        return jsonify(
            success=False, message="Invalid username/email or password"
        ), 401

    print(f"[LOGIN] Successful login for username: {user['username']}", flush=True)
    return jsonify(
        success=True,
        user={
            "id": user["id"],
            "full_name": user["full_name"],
            "username": user["username"],
            "email": user["email"],
        },
    )


@app.get("/health")
def health():
    """Small endpoint used to confirm that the backend is running."""
    return jsonify(success=True, message="TumorNet backend is running")


@app.get("/api/users/<int:user_id>")
def get_user(user_id):
    """Return one user's saved profile details."""
    with get_database() as connection:
        user = connection.execute(
            "SELECT id, full_name, username, email FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

    if not user:
        return jsonify(success=False, message="User not found"), 404

    return jsonify(
        success=True,
        user={
            "id": user["id"],
            "full_name": user["full_name"],
            "username": user["username"],
            "email": user["email"],
        },
    )


@app.put("/api/users/<int:user_id>")
def update_user(user_id):
    """Update simple profile details and keep username/email unique."""
    data = request.get_json(silent=True) or {}
    full_name = str(data.get("full_name", "")).strip()
    username = str(data.get("username", "")).strip()
    email = str(data.get("email", "")).strip().lower()

    if not all((full_name, username, email)):
        return jsonify(success=False, message="Full name, username, and email are required"), 400

    with get_database() as connection:
        existing_user = connection.execute(
            "SELECT id FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        if not existing_user:
            return jsonify(success=False, message="User not found"), 404

        username_taken = connection.execute(
            "SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?",
            (username, user_id),
        ).fetchone()
        if username_taken:
            return jsonify(success=False, message="Username already exists"), 409

        email_taken = connection.execute(
            "SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?",
            (email, user_id),
        ).fetchone()
        if email_taken:
            return jsonify(success=False, message="Email already exists"), 409

        connection.execute(
            """
            UPDATE users
            SET full_name = ?, username = ?, email = ?
            WHERE id = ?
            """,
            (full_name, username, email, user_id),
        )
        connection.commit()

    print(f"[PROFILE] Updated user id: {user_id}", flush=True)
    return jsonify(
        success=True,
        message="Profile updated successfully",
        user={
            "id": user_id,
            "full_name": full_name,
            "username": username,
            "email": email,
        },
    )


@app.post("/api/predict")
def api_predict():
    """Accept an MRI image and return the real trained-model prediction."""
    if "file" not in request.files:
        return jsonify(success=False, message="No file uploaded"), 400

    file = request.files["file"]
    if not file or file.filename == "":
        return jsonify(success=False, message="No file selected"), 400

    if not allowed_file(file.filename):
        return jsonify(
            success=False,
            message="Unsupported file type. Upload JPG, JPEG, PNG, BMP, or WEBP.",
        ), 400

    safe_name = secure_filename(file.filename)
    extension = Path(safe_name).suffix.lower()
    filename = f"{Path(safe_name).stem or 'scan'}_{uuid4().hex[:12]}{extension}"
    filepath = UPLOAD_FOLDER / filename

    try:
        file.save(filepath)
        result = predict_tumor(filepath)
    except Exception as error:
        print(f"[PREDICT FAILED] {error}", flush=True)
        traceback.print_exc()
        filepath.unlink(missing_ok=True)
        return jsonify(success=False, message=f"Prediction failed: {error}"), 500

    print(
        f"[PREDICT] {filename} => {result['display_label']} "
        f"({result['confidence_percent']:.2f}%)",
        flush=True,
    )
    return jsonify(success=True, image_url=f"/uploads/{filename}", **result)


@app.get("/api/users/<int:user_id>/reports")
def get_user_reports(user_id):
    """Return all saved PDF reports for the logged-in user."""
    with get_database() as connection:
        reports = connection.execute(
            """
            SELECT id, title, detected_type, analysis_date, pdf_data, created_at
            FROM reports
            WHERE user_id = ?
            ORDER BY datetime(created_at) DESC
            """,
            (user_id,),
        ).fetchall()

    return jsonify(
        success=True,
        reports=[
            {
                "id": report["id"],
                "title": report["title"],
                "detected_type": report["detected_type"],
                "analysis_date": report["analysis_date"],
                "pdf_data": report["pdf_data"],
                "created_at": report["created_at"],
            }
            for report in reports
        ],
    )


@app.post("/api/users/<int:user_id>/reports")
def save_user_report(user_id):
    """Save one generated PDF report against a user account."""
    if request.files.get("pdf_file"):
        title = str(request.form.get("title", "")).strip()
        detected_type = str(request.form.get("detected_type", "")).strip()
        analysis_date = str(request.form.get("analysis_date", "")).strip()
        pdf_file = request.files["pdf_file"]
        pdf_bytes = pdf_file.read()
        pdf_data = "data:application/pdf;base64," + base64.b64encode(pdf_bytes).decode("ascii")
    else:
        data = request.get_json(silent=True) or {}
        title = str(data.get("title", "")).strip()
        detected_type = str(data.get("detected_type", "")).strip()
        analysis_date = str(data.get("analysis_date", "")).strip()
        pdf_data = str(data.get("pdf_data", "")).strip()

    if not all((title, detected_type, analysis_date, pdf_data)):
        return jsonify(success=False, message="Report title, date, type, and PDF data are required"), 400

    created_at = datetime.now().isoformat(timespec="seconds")

    with get_database() as connection:
        user = connection.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            return jsonify(success=False, message="User not found"), 404

        cursor = connection.execute(
            """
            INSERT INTO reports (user_id, title, detected_type, analysis_date, pdf_data, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user_id, title, detected_type, analysis_date, pdf_data, created_at),
        )
        connection.commit()

    report_id = cursor.lastrowid
    print(f"[REPORT] Saved report {report_id} for user {user_id}: {title}", flush=True)
    return jsonify(
        success=True,
        message="Report saved successfully",
        report={
            "id": report_id,
            "title": title,
            "detected_type": detected_type,
            "analysis_date": analysis_date,
            "pdf_data": pdf_data,
            "created_at": created_at,
        },
    )


@app.delete("/api/users/<int:user_id>/reports/<int:report_id>")
def delete_user_report(user_id, report_id):
    """Delete one saved report from the user's account."""
    with get_database() as connection:
        report = connection.execute(
            "SELECT id FROM reports WHERE id = ? AND user_id = ?",
            (report_id, user_id),
        ).fetchone()
        if not report:
            return jsonify(success=False, message="Report not found"), 404

        connection.execute(
            "DELETE FROM reports WHERE id = ? AND user_id = ?",
            (report_id, user_id),
        )
        connection.commit()

    print(f"[REPORT] Deleted report {report_id} for user {user_id}", flush=True)
    return jsonify(success=True, message="Report deleted successfully")


if __name__ == "__main__":
    create_users_table()
    create_reports_table()
    print(f"[DATABASE] Using SQLite database: {DATABASE_PATH}", flush=True)
    app.run(host="127.0.0.1", port=5050, debug=False, use_reloader=False)

