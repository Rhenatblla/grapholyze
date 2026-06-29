import cv2
import numpy as np
from PIL import Image

class GraphologyAnalyzer:
    def __init__(self):
        # Traits database (Simple Rule-Based Mapping)
        self.traits_map = {
            "high_pressure": {"trait": "Vitalitas Tinggi", "desc": "Anda memiliki energi fisik dan emosional yang kuat."},
            "light_pressure": {"trait": "Sensitif", "desc": "Anda peka dan mungkin menghindari konflik."},
            "slant_right": {"trait": "Ekstrovert & Emosional", "desc": "Anda ekspresif dan berorientasi pada masa depan."},
            "slant_left": {"trait": "Introvert & Memendam", "desc": "Anda cenderung menarik diri dan berhati-hati."},
            "slant_vertical": {"trait": "Logis & Praktis", "desc": "Anda mengendalikan emosi dengan rasio."},
            "ascending": {"trait": "Optimis", "desc": "Anda memiliki harapan tinggi dan semangat positif."},
            "descending": {"trait": "Pesimis/Lelah", "desc": "Anda mungkin sedang merasa lelah atau kurang termotivasi."}
        }

    def process_image(self, image_stream):
        # Convert uploaded file to OpenCV format
        file_bytes = np.frombuffer(image_stream.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        # Preprocessing: Grayscale & Threshold
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
        
        return thresh

    def analyze_baseline(self, thresh):
        # Deteksi Baseline (Naik/Turun/Lurus)
        # Simplifikasi: Cari bounding box dari semua pixel tulisan
        coords = cv2.findNonZero(thresh)
        if coords is None:
            return "straight"
            
        # Fit line (Simple Linear Regression)
        [vx, vy, x, y] = cv2.fitLine(coords, cv2.DIST_L2, 0, 0.01, 0.01)
        slope = vy / vx if vx != 0 else 0
        
        if slope < -0.1: return "ascending" # Koordinat y terbalik di image
        if slope > 0.1: return "descending"
        return "straight"

    def analyze_pressure(self, thresh):
        # Deteksi Tekanan (Ketebalan Garis)
        # Hitung rasio pixel hitam vs putih di area tulisan
        total_pixels = thresh.size
        black_pixels = cv2.countNonZero(thresh)
        density = black_pixels / total_pixels
        
        if density > 0.15: return "high_pressure"
        return "light_pressure"

    def analyze_slant(self, thresh):
        # Deteksi Kemiringan
        # Menggunakan transformasi Affine untuk mencari kemiringan terbaik (Advanced)
        # Versi Simple: Simulasi logic
        return "slant_right" # Placeholder untuk demonstrasi logic kompleks

    def predict_personality(self, image_stream):
        # 1. Processing
        thresh = self.process_image(image_stream)
        
        # 2. Feature Extraction
        baseline = self.analyze_baseline(thresh)
        pressure = self.analyze_pressure(thresh)
        slant = self.analyze_slant(thresh)
        
        # 3. Rule-Based Classification (Expert System)
        traits_found = []
        
        # Mapping features to traits
        if baseline in self.traits_map: traits_found.append(self.traits_map[baseline])
        if pressure in self.traits_map: traits_found.append(self.traits_map[pressure])
        if slant in self.traits_map: traits_found.append(self.traits_map[slant])
        
        # Determine dominat personality type based on combination
        main_type = "Realis"
        if baseline == "ascending" and slant == "slant_right":
            main_type = "Optimist Leader"
        elif baseline == "descending" or slant == "slant_left":
            main_type = "Introvert Thinker"
            
        return {
            "type": main_type,
            "confidence": 88, # Simulasi confidence score
            "traits": {
                "baseline": baseline,
                "pressure": pressure,
                "slant": slant
            },
            "description": f"Berdasarkan analisis grafologi: {traits_found[0]['desc']} {traits_found[1]['desc']}"
        }
