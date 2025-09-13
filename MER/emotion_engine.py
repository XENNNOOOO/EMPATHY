import os
import cv2
import librosa
import numpy as np
import torch
from deepface import DeepFace
from transformers import ASTForAudioClassification, ASTFeatureExtractor
import warnings
import subprocess
import shutil
import soundfile as sf

warnings.filterwarnings("ignore")

# Check for ffmpeg early
if not shutil.which("ffmpeg"):
    raise RuntimeError(
        "❌ FFMPEG NOT FOUND! Please install ffmpeg:\n"
        "👉 On macOS: brew install ffmpeg\n"
        "👉 Download: https://ffmpeg.org/download.html"
    )


# Simulated ModelScore Fusion Engine
class ModelScore:
    def __init__(self):
        self.weights = {'facial': 0.6, 'vocal': 0.4}
        self.emotion_map = {
            'angry': 'angry',
            'disgust': 'disgusted',
            'fear': 'fearful',
            'happy': 'happy',
            'sad': 'sad',
            'surprise': 'surprised',
            'neutral': 'neutral'
        }

    def fuse(self, facial_pred, vocal_pred):
        facial_emotion = self.emotion_map.get(facial_pred['dominant_emotion'], 'neutral')
        vocal_emotion = vocal_pred['label'].lower().replace('emotion_', '')

        if facial_emotion == vocal_emotion:
            final_emotion = facial_emotion
        else:
            final_emotion = facial_emotion if self.weights['facial'] > self.weights['vocal'] else vocal_emotion

        confidence = (facial_pred['emotion'][facial_pred['dominant_emotion']] * self.weights['facial'] +
                      vocal_pred['score'] * self.weights['vocal'])

        return {
            'final_emotion': final_emotion,
            'confidence': round(confidence, 2),
            'facial': facial_emotion,
            'vocal': vocal_emotion,
            'facial_confidence': facial_pred['emotion'][facial_pred['dominant_emotion']],
            'vocal_confidence': vocal_pred['score'] * 100
        }


# Load audio classifier components
print("🧠 Loading Speech Emotion Recognition model (one-time)...")

try:
    feature_extractor = ASTFeatureExtractor.from_pretrained("MIT/ast-finetuned-audioset-10-10-0.4593")
    model = ASTForAudioClassification.from_pretrained("MIT/ast-finetuned-audioset-10-10-0.4593")
    model.eval()
except Exception as e:
    raise RuntimeError(
        f"❌ Failed to load AST audio classification model.\nReason: {str(e)}"
    )


def extract_audio_from_video(video_path, output_audio_path="temp_audio.wav"):
    try:
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        command = [
            'ffmpeg',
            '-i', video_path,
            '-vn',
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',
            '-y',
            output_audio_path
        ]

        result = subprocess.run(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"FFmpeg error: {result.stderr.strip()}")

        if not os.path.exists(output_audio_path):
            raise Exception("FFmpeg ran but did not produce audio file.")

        return output_audio_path

    except Exception as e:
        raise Exception(f"Audio extraction failed: {str(e)}")


def extract_middle_frame(video_path, output_frame_path="temp_frame.jpg"):
    try:
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        middle_frame_idx = total_frames // 2

        cap.set(cv2.CAP_PROP_POS_FRAMES, middle_frame_idx)
        ret, frame = cap.read()
        cap.release()

        if ret:
            cv2.imwrite(output_frame_path, frame)
            return output_frame_path
        else:
            raise Exception("Failed to read middle frame.")
    except Exception as e:
        raise Exception(f"Frame extraction failed: {str(e)}")


def analyze_facial_expression(image_path):
    try:
        result = DeepFace.analyze(img_path=image_path, actions=['emotion'], enforce_detection=False)
        return result[0]
    except Exception:
        return {'dominant_emotion': 'neutral', 'emotion': {'neutral': 100.0}}


def analyze_speech_emotion(audio_path):
    try:
        # Load audio
        audio, sr = librosa.load(audio_path, sr=16000)

        # Write back to WAV in expected format
        temp_resampled_path = "temp_resampled.wav"
        sf.write(temp_resampled_path, audio, 16000)

        # Extract features
        inputs = feature_extractor(temp_resampled_path, return_tensors="pt", sampling_rate=16000)

        # Run model
        with torch.no_grad():
            outputs = model(**inputs)

        # Softmax probabilities
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        top_prob, top_idx = probs[0].max(dim=-1)
        label = model.config.id2label[top_idx.item()]
        score = top_prob.item()

        os.remove(temp_resampled_path)

        return {"label": label, "score": score}

    except Exception:
        return {'label': 'emotion_neutral', 'score': 1.0}


def cleanup_temp_files(paths):
    for p in paths:
        if os.path.exists(p):
            os.remove(p)


def predict_emotion_from_video(video_path):
    """
    Main function called by GUI.
    Returns dict with results or error message.
    """
    temp_files = []

    try:
        # Extract frame and audio
        frame_path = extract_middle_frame(video_path)
        audio_path = extract_audio_from_video(video_path)
        temp_files.extend([frame_path, audio_path])

        # Analyze
        facial_result = analyze_facial_expression(frame_path)
        vocal_result = analyze_speech_emotion(audio_path)

        # Fuse
        model_score = ModelScore()
        fused_result = model_score.fuse(facial_result, vocal_result)

        # Cleanup
        cleanup_temp_files(temp_files)

        return {
            "success": True,
            "result": fused_result
        }

    except Exception as e:
        cleanup_temp_files(temp_files)
        return {
            "success": False,
            "error": str(e)
        }
