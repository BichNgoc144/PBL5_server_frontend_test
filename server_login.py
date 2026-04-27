from flask import Flask, request, jsonify, make_response
import numpy as np
import cv2
from datetime import datetime, time
import cloudinary
import cloudinary.uploader
import mysql.connector
import os
import traceback
from ultralytics import YOLO
from flask_cors import CORS
import requests
import threading
import time as time_lib
import re
import json

# 🔐 AUTH
import bcrypt
import jwt
from functools import wraps

app = Flask(__name__)
CORS(app)

SECRET_KEY = "mysecretkey123"

# ==========================================
# 1. LOAD MODEL YOLO
# ==========================================
model = YOLO("best.pt")

# ==========================================
# 2. Cloudinary
# ==========================================
cloudinary.config(
    cloud_name="dn71wgng3",
    api_key="125962815347642",
    api_secret="xh-MHpbbqyyFyEQsUMPlBWRBK7s"
)

# ==========================================
# 3. MySQL
# ==========================================
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="pbl5",
        charset="utf8mb4"
    )

# ==========================================
# 🔐 4. TOKEN MIDDLEWARE
# ==========================================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            try:
                token = request.headers["Authorization"].split(" ")[1]
            except:
                return jsonify({"error": "Invalid token format"}), 401

        if not token:
            return jsonify({"error": "Token missing"}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            kwargs["current_user_id"] = data["user_id"]
        except:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)
    return decorated


# ==========================================
# 👤 PROFILE ROUTES
# ==========================================
@app.route("/profile", methods=["GET"])
@token_required
def get_profile(current_user_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT u.username, u.email,
                   ud.full_name, ud.bio, ud.avatar_url, ud.total_score
            FROM users u
            LEFT JOIN user_details ud ON u.id = ud.user_id
            WHERE u.id = %s
        """, (current_user_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "User not found"}), 404
        return jsonify(row)
    finally:
        cursor.close()
        db.close()

@app.route("/profile", methods=["PATCH"])
@token_required
def update_profile(current_user_id):
    data = request.json
    full_name = data.get("full_name", "").strip()
    bio = data.get("bio", "").strip()

    if not full_name:
        return jsonify({"error": "Họ tên không được để trống"}), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            UPDATE user_details 
            SET full_name = %s, bio = %s 
            WHERE user_id = %s
        """, (full_name, bio, current_user_id))
        db.commit()

        cursor.execute("""
            SELECT u.username, u.email, 
                   ud.full_name, ud.bio, ud.avatar_url, ud.total_score
            FROM users u
            LEFT JOIN user_details ud ON u.id = ud.user_id
            WHERE u.id = %s
        """, (current_user_id,))
        updated_profile = cursor.fetchone()
        
        return jsonify(updated_profile)
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Lỗi hệ thống khi cập nhật hồ sơ"}), 500
    finally:
        cursor.close()
        db.close()

@app.route("/profile/avatar", methods=["POST"])
@token_required
def upload_avatar(current_user_id):
    if "avatar" not in request.files:
        return jsonify({"error": "Không tìm thấy file ảnh"}), 400

    file = request.files["avatar"]
    if file.filename == '':
        return jsonify({"error": "Chưa chọn file"}), 400

    db = get_db_connection()
    cursor = db.cursor()
    try:
        cloud = cloudinary.uploader.upload(file)
        avatar_url = cloud["secure_url"]

        cursor.execute("""
            UPDATE user_details 
            SET avatar_url = %s 
            WHERE user_id = %s
        """, (avatar_url, current_user_id))
        db.commit()

        return jsonify({"avatar_url": avatar_url})
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Lỗi hệ thống khi upload ảnh"}), 500
    finally:
        cursor.close()
        db.close()


# ==========================================
# 📊 PROFILE STATS
# ==========================================
@app.route("/profile/stats", methods=["GET"])
@token_required
def get_profile_stats(current_user_id):
    """
    Trả về thống kê cá nhân:
      - total_quizzes   : số lần làm quiz
      - total_questions : tổng câu hỏi đã trả lời
      - total_correct   : tổng câu trả lời đúng
      - accuracy_pct    : tỉ lệ đúng (%)
      - total_score     : tổng điểm tích lũy
      - best_score      : điểm cao nhất 1 lần làm quiz
      - ai_detections   : số lần AI nhận diện (history)
    """
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Quiz sessions
        cursor.execute("""
            SELECT 
                COUNT(*)              AS total_quizzes,
                COALESCE(SUM(total_questions), 0) AS total_questions,
                COALESCE(SUM(correct_count), 0)   AS total_correct,
                COALESCE(MAX(gained_score), 0)    AS best_score
            FROM quiz_sessions
            WHERE user_id = %s
        """, (current_user_id,))
        quiz_row = cursor.fetchone()

        # Total score from user_details
        cursor.execute("""
            SELECT COALESCE(total_score, 0) AS total_score
            FROM user_details WHERE user_id = %s
        """, (current_user_id,))
        score_row = cursor.fetchone()

        # AI detections from history (không phân biệt user nếu chưa có user_id trong history)
        # Nếu bảng history có cột user_id thì thêm WHERE user_id = %s
        cursor.execute("SELECT COUNT(*) AS cnt FROM history")
        det_row = cursor.fetchone()

        total_q  = int(quiz_row["total_questions"]) if quiz_row else 0
        total_c  = int(quiz_row["total_correct"])   if quiz_row else 0
        accuracy = round((total_c / total_q * 100), 1) if total_q > 0 else 0.0

        return jsonify({
            "total_quizzes":   int(quiz_row["total_quizzes"]) if quiz_row else 0,
            "total_questions": total_q,
            "total_correct":   total_c,
            "accuracy_pct":    accuracy,
            "total_score":     int(score_row["total_score"]) if score_row else 0,
            "best_score":      int(quiz_row["best_score"])   if quiz_row else 0,
            "ai_detections":   int(det_row["cnt"])           if det_row  else 0,
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Lỗi khi lấy thống kê"}), 500
    finally:
        cursor.close()
        db.close()


# ==========================================
# 📤 PROFILE EXPORT
# ==========================================
@app.route("/profile/export", methods=["GET"])
@token_required
def export_profile(current_user_id):
    """Xuất toàn bộ dữ liệu cá nhân ra JSON."""
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Profile
        cursor.execute("""
            SELECT u.username, u.email, u.created_at,
                   ud.full_name, ud.bio, ud.avatar_url, ud.total_score
            FROM users u
            LEFT JOIN user_details ud ON u.id = ud.user_id
            WHERE u.id = %s
        """, (current_user_id,))
        profile = cursor.fetchone()
        if not profile:
            return jsonify({"error": "User not found"}), 404

        # Stringify datetime
        for k, v in profile.items():
            if hasattr(v, "isoformat"):
                profile[k] = v.isoformat()

        # Quiz history (nếu có bảng quiz_sessions)
        quiz_sessions = []
        try:
            cursor.execute("""
                SELECT id, total_questions, correct_count, gained_score, created_at
                FROM quiz_sessions WHERE user_id = %s ORDER BY created_at DESC
            """, (current_user_id,))
            for row in cursor.fetchall():
                if hasattr(row.get("created_at"), "isoformat"):
                    row["created_at"] = row["created_at"].isoformat()
                quiz_sessions.append(row)
        except Exception:
            pass  # Bảng quiz_sessions chưa tồn tại

        export_data = {
            "exported_at": datetime.utcnow().isoformat() + "Z",
            "profile": profile,
            "quiz_sessions": quiz_sessions,
        }

        response = make_response(json.dumps(export_data, ensure_ascii=False, indent=2))
        response.headers["Content-Type"] = "application/json; charset=utf-8"
        response.headers["Content-Disposition"] = (
            f'attachment; filename="profile_{profile["username"]}_{datetime.now().strftime("%Y%m%d")}.json"'
        )
        return response

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Lỗi khi xuất dữ liệu"}), 500
    finally:
        cursor.close()
        db.close()


# ==========================================
# 🎮 QUIZ ROUTES
# ==========================================
@app.route("/quiz/generate", methods=["GET"])
@token_required
def quiz_generate(current_user_id):
    limit = request.args.get("limit", 5, type=int)
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, ai_label AS question_en, name_vn
            FROM dictionary
            ORDER BY RAND()
            LIMIT %s
        """, (limit,))
        words = cursor.fetchall()

        if not words:
            return jsonify({"error": "Dictionary is empty"}), 404

        cursor.execute("SELECT id, name_vn FROM dictionary")
        all_words = cursor.fetchall()

        import random
        questions = []
        for w in words:
            correct = {"id": w["id"], "text_vn": w["name_vn"]}
            wrongs = random.sample(
                [x for x in all_words if x["id"] != w["id"]],
                min(3, len(all_words) - 1)
            )
            options = [correct] + [{"id": x["id"], "text_vn": x["name_vn"]} for x in wrongs]
            random.shuffle(options)
            questions.append({
                "dict_id":     w["id"],
                "question_en": w["question_en"],
                "correct_id":  w["id"],
                "options":     options
            })
        return jsonify(questions)
    finally:
        cursor.close()
        db.close()

@app.route("/quiz/submit", methods=["POST"])
@token_required
def quiz_submit(current_user_id):
    data = request.json
    answers = data.get("answers", [])

    if not answers:
        return jsonify({"error": "No answers provided"}), 400

    correct_count  = sum(1 for a in answers if a.get("is_correct"))
    total_count    = len(answers)
    gained_score   = correct_count * 10

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            UPDATE user_details
            SET total_score = total_score + %s
            WHERE user_id = %s
        """, (gained_score, current_user_id))
        db.commit()

        # Lưu session quiz (tạo bảng nếu chưa có)
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS quiz_sessions (
                    id               INT AUTO_INCREMENT PRIMARY KEY,
                    user_id          INT NOT NULL,
                    total_questions  INT NOT NULL,
                    correct_count    INT NOT NULL,
                    gained_score     INT NOT NULL,
                    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
            cursor.execute("""
                INSERT INTO quiz_sessions (user_id, total_questions, correct_count, gained_score)
                VALUES (%s, %s, %s, %s)
            """, (current_user_id, total_count, correct_count, gained_score))
            db.commit()
        except Exception:
            pass  # Không fail nếu lưu session lỗi

        cursor.execute("""
            SELECT total_score FROM user_details WHERE user_id = %s
        """, (current_user_id,))
        row = cursor.fetchone()
        return jsonify({
            "gained_score": gained_score,
            "total_score":  row["total_score"] if row else gained_score,
            "correct":      correct_count,
            "total":        total_count
        })
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Lỗi hệ thống"}), 500
    finally:
        cursor.close()
        db.close()

# ==========================================
# 🔐 AUTH ROUTES
# ==========================================
@app.route("/register", methods=["POST"])
def register():
    data = request.json

    username = data.get("username", "").strip()
    email    = data.get("email", "").strip()
    password = data.get("password", "")
    full_name = data.get("full_name", username).strip()
    bio       = data.get("bio", "").strip()

    if not username or not email or not password:
        return jsonify({"error": "Vui lòng điền đầy đủ thông tin"}), 400

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"error": "Định dạng email không hợp lệ"}), 400

    if len(password) < 6:
        return jsonify({"error": "Mật khẩu phải có ít nhất 6 ký tự"}), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
        if cursor.fetchone():
            return jsonify({"error": "Tên đăng nhập hoặc email đã tồn tại"}), 409

        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute(
            "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
            (username, email, hashed)
        )
        user_id = cursor.lastrowid

        cursor.execute(
            "INSERT INTO user_details (user_id, full_name, bio, total_score) VALUES (%s, %s, %s, %s)",
            (user_id, full_name, bio, 0)
        )

        db.commit()
        return jsonify({"message": "Đăng ký thành công"}), 201

    except Exception as e:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Lỗi hệ thống"}), 500
    finally:
        cursor.close()
        db.close()

@app.route("/login", methods=["POST"])
def login():
    data = request.json

    username = data.get("username")
    password = data.get("password")

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()

    cursor.close()
    db.close()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if bcrypt.checkpw(password.encode(), user["password"].encode()):
        token = jwt.encode(
            {"user_id": user["id"]},
            SECRET_KEY,
            algorithm="HS256"
        )
        return jsonify({
            "message": "Login success",
            "token": token
        })
    else:
        return jsonify({"error": "Wrong password"}), 401

# ==========================================
# 🤖 AI PREDICT
# ==========================================
def predict_image(img):
    """
    Trả về (label, confidence_pct) hoặc (None, 0) nếu không nhận diện được.
    confidence_pct: 0–100 (float).
    """
    results = model(img)
    if not results:
        return None, 0.0

    r = results[0]

    # Classification model
    if hasattr(r, 'probs') and r.probs is not None:
        cls_id     = int(r.probs.top1)
        confidence = float(r.probs.top1conf) * 100  # → %
        return model.names[cls_id], confidence

    # Detection model
    if r.boxes is not None and len(r.boxes) > 0:
        confs   = r.boxes.conf
        max_idx = confs.argmax()
        cls_id  = int(r.boxes.cls[max_idx])
        confidence = float(confs[max_idx]) * 100      # → %
        return model.names[cls_id], confidence

    return None, 0.0

# ==========================================
# 🔊 Gửi NodeMCU
# ==========================================
# Nếu confidence AI < ngưỡng này (%), gửi audio_id = 200 về NodeMCU
AI_ACCURACY_THRESHOLD = 50.0
NODEMCU_FALLBACK_ID   = 200

def send_to_ip(dict_id, is_dangerous, confidence=100.0):
    url = "http://192.168.1.236/play"

    # ── Nếu độ chính xác AI thấp → gửi id đặc biệt để MCU bỏ qua / thông báo ──
    if confidence < AI_ACCURACY_THRESHOLD:
        payload = {
            "audio_id": NODEMCU_FALLBACK_ID,
            "led":      "0"
        }
        print(f"[AI LOW CONF] confidence={confidence:.1f}% < {AI_ACCURACY_THRESHOLD}% "
              f"→ gửi audio_id={NODEMCU_FALLBACK_ID}")
    else:
        payload = {
            "audio_id": int(dict_id),
            "led":      "1" if int(is_dangerous) == 1 else "0"
        }

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(url, json=payload, timeout=5)
            if response.status_code == 200:
                print(f"[THÀNH CÔNG] Đã gửi NodeMCU lần {attempt + 1}: {payload}")
                return
            else:
                print(f"[CẢNH BÁO] NodeMCU trả về mã lỗi: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"[ĐỢI] Lần thử {attempt + 1}/{max_retries} thất bại. NodeMCU đang bận...")

        time_lib.sleep(1.5)

    print("[THẤT BẠI] Đã thử 3 lần nhưng NodeMCU không phản hồi.")

# ==========================================
# 📜 HISTORY
# ==========================================
@app.route("/history", methods=["GET"])
@token_required
def get_history(current_user_id):
    conn   = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            h.id,
            d.ai_label,
            d.name_vn,
            d.is_dangerous,
            h.image_url,
            h.created_at
        FROM history h
        LEFT JOIN dictionary d ON h.dict_id = d.id
        ORDER BY h.created_at DESC
    """)

    rows   = cursor.fetchall()
    result = []
    for row in rows:
        result.append({
            "id":          row["id"],
            "objectEn":    row["ai_label"],
            "objectVi":    row["name_vn"],
            "isDangerous": bool(row["is_dangerous"]) if row["is_dangerous"] is not None else False,
            "imageUrl":    row["image_url"],
            "createdAt":   str(row["created_at"])
        })

    cursor.close()
    conn.close()
    return jsonify(result)

# ==========================================
# 📚 DICTIONARY
# ==========================================
@app.route("/dictionary", methods=["GET"])
def get_dictionary():
    db     = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id, ai_label, name_vn, is_dangerous FROM dictionary")
    rows   = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(rows)

# ==========================================
# 📸 UPLOAD (ESP32)
# ==========================================
@app.route("/upload", methods=["POST"])
def upload():
    db       = None
    filepath = None
    print("Received /upload request")

    try:
        if "image" in request.files:
            img_bytes = request.files["image"].read()
        elif request.data:
            img_bytes = request.data
        else:
            return jsonify({"error": "No image data"}), 400

        npimg = np.frombuffer(img_bytes, np.uint8)
        img   = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        # ── Lấy kết quả AI kèm confidence ──
        ai_label, confidence = predict_image(img)

        if not ai_label:
            return jsonify({"error": "No detect"}), 400

        db     = get_db_connection()
        cursor = db.cursor()

        cursor.execute(
            "SELECT id, is_dangerous FROM dictionary WHERE ai_label = %s",
            (ai_label.strip(),)
        )
        row = cursor.fetchone()

        if not row:
            return jsonify({"error": "Label not found"}), 404

        dict_id, is_dangerous = row

        # ── Gửi NodeMCU (truyền confidence để kiểm tra ngưỡng) ──
        threading.Thread(
            target=send_to_ip,
            args=(dict_id, is_dangerous, confidence),
            daemon=True
        ).start()

        os.makedirs("images", exist_ok=True)
        filename = f"cap_{datetime.now().strftime('%H%M%S')}.jpg"
        filepath = os.path.join("images", filename)
        cv2.imwrite(filepath, img)

        cloud     = cloudinary.uploader.upload(filepath)
        image_url = cloud["secure_url"]

        cursor.execute(
            "INSERT INTO history (dict_id, image_url) VALUES (%s, %s)",
            (dict_id, image_url)
        )
        db.commit()

        return jsonify({
            "label":      ai_label,
            "dict_id":    dict_id,
            "image_url":  image_url,
            "confidence": round(confidence, 2),  # % trả về client
            "low_confidence": confidence < AI_ACCURACY_THRESHOLD
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    finally:
        if db and db.is_connected():
            cursor.close()
            db.close()
        if filepath and os.path.exists(filepath):
            os.remove(filepath)

# ==========================================
# 🚀 RUN
# ==========================================
if __name__ == "__main__":
    @app.route("/", methods=["GET"])
    def home():
        return jsonify({"status": "Server 5000 is running"})

    app.run(host="0.0.0.0", port=5000, debug=True)