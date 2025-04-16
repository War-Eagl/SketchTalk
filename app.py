import os
import logging
import time
import json
import uuid
from datetime import datetime
from pathlib import Path
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "talksketch-secret-key")
CORS(app)

# Create upload directories if they don't exist
UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(exist_ok=True)

# Routes
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/condition1")
def condition1():
    return render_template("condition1.html")

@app.route("/condition2")
def condition2():
    return render_template("condition2.html")

@app.route("/condition3")
def condition3():
    return render_template("condition3.html")

@app.route("/start_session", methods=["POST"])
def start_session():
    """Start a new session with timestamp as folder name"""
    session_id = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}"
    session_folder = UPLOAD_FOLDER / session_id
    session_folder.mkdir(exist_ok=True)
    
    # Create subfolders for sketches and audio
    (session_folder / "sketches").mkdir(exist_ok=True)
    (session_folder / "audio").mkdir(exist_ok=True)
    
    logger.debug(f"Created new session: {session_id}")
    return jsonify({"session_id": session_id})

@app.route("/save_sketch", methods=["POST"])
def save_sketch():
    """Save sketch as SVG file"""
    data = request.json
    session_id = data.get("session_id")
    svg_data = data.get("svg_data")
    sketch_index = data.get("sketch_index", int(time.time()))
    
    if not session_id or not svg_data:
        return jsonify({"error": "Missing required data"}), 400
    
    session_folder = UPLOAD_FOLDER / session_id / "sketches"
    if not session_folder.exists():
        session_folder.mkdir(parents=True, exist_ok=True)
    
    filename = f"sketch_{sketch_index}.svg"
    file_path = session_folder / filename
    
    try:
        with open(file_path, "w") as f:
            f.write(svg_data)
        logger.debug(f"Saved sketch to {file_path}")
        return jsonify({"success": True, "filename": filename})
    except Exception as e:
        logger.error(f"Error saving sketch: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/save_audio_chunk", methods=["POST"])
def save_audio_chunk():
    """Save audio chunk to session folder"""
    if "audio" not in request.files:
        return jsonify({"error": "No audio file in request"}), 400
    
    audio_file = request.files["audio"]
    session_id = request.form.get("session_id")
    chunk_number = request.form.get("chunk_number", "0")
    
    if not session_id:
        return jsonify({"error": "Missing session ID"}), 400
    
    session_folder = UPLOAD_FOLDER / session_id / "audio"
    if not session_folder.exists():
        session_folder.mkdir(parents=True, exist_ok=True)
    
    filename = f"audio_chunk_{chunk_number}.webm"
    file_path = session_folder / filename
    
    try:
        audio_file.save(file_path)
        logger.debug(f"Saved audio chunk to {file_path}")
        return jsonify({"success": True, "filename": filename})
    except Exception as e:
        logger.error(f"Error saving audio chunk: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/end_session", methods=["POST"])
def end_session():
    """End a session and finalize any processing"""
    data = request.json
    session_id = data.get("session_id")
    
    if not session_id:
        return jsonify({"error": "Missing session ID"}), 400
    
    # Here you would add any final processing for the session
    logger.debug(f"Ended session: {session_id}")
    return jsonify({"success": True})

@app.route("/download_sketch/<session_id>/<filename>")
def download_sketch(session_id, filename):
    """Download a specific sketch from a session"""
    file_path = UPLOAD_FOLDER / session_id / "sketches" / secure_filename(filename)
    if not file_path.exists():
        return jsonify({"error": "File not found"}), 404
    
    return send_file(file_path, as_attachment=True)
