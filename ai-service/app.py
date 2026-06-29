from flask import Flask, request, jsonify
from flask_cors import CORS
from analyzer import GraphologyAnalyzer
import os

app = Flask(__name__)
CORS(app) # Enable CORS for communication with Node.js

# Initialize Analyzer Logic
analyzer = GraphologyAnalyzer()

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "AI Service running", "model": "Graphology-v1"})

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    file = request.files['image']
    
    try:
        # Perform Smart Analysis
        result = analyzer.predict_personality(file)
        
        return jsonify({
            "status": "success",
            "data": result
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
    