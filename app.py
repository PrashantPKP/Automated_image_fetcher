from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import os
import logging
from backend import scrape_google_images

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.route('/search', methods=['POST'])
def search_images():
    try:
        data = request.get_json()
        query = data.get("query")
        quantity = int(data.get("quantity", 10))

        if not query:
            return jsonify({"status": "error", "message": "No search query provided."}), 400

        results = scrape_google_images(query, num_images=quantity)
        return jsonify(results)

    except Exception as e:
        app.logger.error(f"Error in /search endpoint: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
