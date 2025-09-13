import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import threading
from MER.emotion_engine import predict_emotion_from_video

class EmotionRecognitionGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("🎭 Multimodal Emotion Recognition")
        self.root.geometry("600x500")
        self.root.resizable(False, False)
        self.root.configure(bg="#f0f4f8")

        # Title
        title_label = tk.Label(
            root,
            text="🎭 Multimodal Emotion Recognition",
            font=("Helvetica", 18, "bold"),
            bg="#f0f4f8",
            fg="#2c3e50"
        )
        title_label.pack(pady=20)

        # Upload Button
        self.upload_button = tk.Button(
            root,
            text="📁 Upload Video File",
            font=("Helvetica", 12),
            bg="#3498db",
            fg="white",
            width=25,
            height=2,
            command=self.upload_video
        )
        self.upload_button.pack(pady=10)

        # File Label
        self.file_label = tk.Label(
            root,
            text="No file selected",
            font=("Helvetica", 10),
            bg="#f0f4f8",
            fg="#7f8c8d",
            wraplength=500
        )
        self.file_label.pack(pady=5)

        # Progress Bar
        self.progress = ttk.Progressbar(root, orient="horizontal", length=400, mode="indeterminate")
        
        # Status Label
        self.status_label = tk.Label(
            root,
            text="",
            font=("Helvetica", 10, "italic"),
            bg="#f0f4f8",
            fg="#e74c3c"
        )
        self.status_label.pack(pady=5)

        # Results Frame
        self.result_frame = tk.Frame(root, bg="#f0f4f8")
        self.result_frame.pack(pady=20, fill="both", expand=True)

        # Result Labels
        self.facial_label = tk.Label(self.result_frame, text="", font=("Helvetica", 11), bg="#f0f4f8", justify="left")
        self.vocal_label = tk.Label(self.result_frame, text="", font=("Helvetica", 11), bg="#f0f4f8", justify="left")
        self.final_label = tk.Label(self.result_frame, text="", font=("Helvetica", 14, "bold"), bg="#f0f4f8", fg="#27ae60")

        self.facial_label.pack(anchor="w", padx=20)
        self.vocal_label.pack(anchor="w", padx=20)
        self.final_label.pack(pady=10)

        # Reset Button (initially hidden)
        self.reset_button = tk.Button(
            root,
            text="↺ Reset",
            font=("Helvetica", 10),
            bg="#e74c3c",
            fg="white",
            width=10,
            command=self.reset_ui
        )

    def upload_video(self):
        file_path = filedialog.askopenfilename(
            title="Select a Video File",
            filetypes=[
                ("Video files", "*.mp4 *.mov *.avi *.mkv"),
                ("All files", "*.*")
            ]
        )
        if not file_path:
            return

        self.file_label.config(text=f"Selected: {os.path.basename(file_path)}", fg="#2c3e50")
        self.status_label.config(text="Processing... please wait.", fg="#e67e22")
        self.progress.pack(pady=10)
        self.progress.start()

        # Disable button during processing
        self.upload_button.config(state="disabled")

        # Run prediction in background thread to avoid freezing GUI
        thread = threading.Thread(target=self.run_prediction, args=(file_path,))
        thread.start()

    def run_prediction(self, video_path):
        result = predict_emotion_from_video(video_path)

        # Update GUI from main thread
        self.root.after(0, self.display_result, result)

    def display_result(self, result):
        self.progress.stop()
        self.progress.pack_forget()

        if result["success"]:
            r = result["result"]
            self.facial_label.config(text=f"🙂 Facial Emotion: {r['facial'].title()} ({r['facial_confidence']:.1f}%)")
            self.vocal_label.config(text=f"🗣️  Vocal Emotion:  {r['vocal'].title()} ({r['vocal_confidence']:.1f}%)")
            self.final_label.config(text=f"🎯 Final Prediction: {r['final_emotion'].upper()} (Confidence: {r['confidence']})")

            # Show reset button
            self.reset_button.pack(pady=10)
        else:
            messagebox.showerror("Error", f"Processing failed:\n{result['error']}")
            self.status_label.config(text="❌ Processing failed. Try another video.", fg="#e74c3c")

        # Re-enable upload
        self.upload_button.config(state="normal")

    def reset_ui(self):
        self.file_label.config(text="No file selected", fg="#7f8c8d")
        self.status_label.config(text="")
        self.facial_label.config(text="")
        self.vocal_label.config(text="")
        self.final_label.config(text="")
        self.reset_button.pack_forget()

if __name__ == "__main__":
    root = tk.Tk()
    app = EmotionRecognitionGUI(root)
    root.mainloop()