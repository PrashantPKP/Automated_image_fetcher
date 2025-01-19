from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import os
import logging
import requests
from io import BytesIO
from zipfile import ZipFile
from bs4 import BeautifulSoup  # For web scraping

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

@app.route('/scrape-website', methods=['POST'])
def scrape_website():
    try:
        data = request.get_json()
        website_url = data.get("website_url")
        max_images = int(data.get("max_images", 50))  # Default to 50 images

        if not website_url:
            return jsonify({"status": "error", "message": "No website URL provided."}), 400

        # Fetch the website content
        response = requests.get(website_url)
        response.raise_for_status()

        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract all image URLs
        image_urls = []
        for img in soup.find_all('img', src=True):
            img_url = img['src']
            if not img_url.startswith(('http://', 'https://')):
                # Handle relative URLs
                img_url = requests.compat.urljoin(website_url, img_url)
            image_urls.append(img_url)

            # Stop if we've reached the maximum number of images
            if len(image_urls) >= max_images:
                break

        return jsonify({
            "status": "success",
            "image_urls": image_urls
        })

    except Exception as e:
        app.logger.error(f"Error in /scrape-website endpoint: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/download', methods=['POST'])
def download_images():
    try:
        data = request.get_json()
        image_urls = data.get("image_urls")
        query = data.get("query")

        if not image_urls or not query:
            return jsonify({"status": "error", "message": "No image URLs or query provided."}), 400

        # Create a zip file in memory
        zip_buffer = BytesIO()
        with ZipFile(zip_buffer, 'w') as zip_file:
            for i, url in enumerate(image_urls):
                try:
                    response = requests.get(url, timeout=10)
                    response.raise_for_status()
                    image_data = response.content
                    zip_file.writestr(f"{query}_{i+1}.jpg", image_data)
                except requests.exceptions.RequestException as e:
                    app.logger.error(f"Failed to download image {url}: {e}")

        zip_buffer.seek(0)
        return send_file(zip_buffer, mimetype='application/zip', as_attachment=True, download_name=f"{query}_images.zip")

    except Exception as e:
        app.logger.error(f"Error in /download endpoint: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)