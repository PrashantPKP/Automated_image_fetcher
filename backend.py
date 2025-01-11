import json
import requests

with open("config.json") as config_file:
    config = json.load(config_file)
api_key = config["SERPAPI_KEY"]

def scrape_google_images(query, num_images=50):
    search_url = "https://serpapi.com/search.json"
    params = {
        "q": query,
        "tbm": "isch",
        "ijn": 0,
        "api_key": api_key
    }

    try:
        response = requests.get(search_url, params=params, timeout=10)
        response.raise_for_status()
        search_results = response.json()

        image_urls = [result["original"] for result in search_results.get("images_results", [])[:num_images]]
        
        return {
            "status": "success",
            "image_urls": image_urls
        }

    except requests.exceptions.RequestException as e:
        return {
            "status": "error",
            "message": f"Request error: {e}"
        }

    except KeyError:
        return {
            "status": "error",
            "message": "Unexpected response structure. 'images_results' key not found."
        }
