import os
import json
import requests
import logging

logging.basicConfig(level=logging.DEBUG)

# Load API keys from environment variables
SERPAPI_KEYS = [
    os.environ.get("SERPAPI_KEY1"),
    os.environ.get("SERPAPI_KEY2"),
    os.environ.get("SERPAPI_KEY3"),
    os.environ.get("SERPAPI_KEY4")
]

# Ensure no key is missing
if not all(SERPAPI_KEYS):
    raise ValueError("One or more SERPAPI_KEY environment variables are missing.")

# Index tracker for round-robin usage
api_key_index = 0

def get_next_api_key():
    global api_key_index
    key = SERPAPI_KEYS[api_key_index]
    api_key_index = (api_key_index + 1) % len(SERPAPI_KEYS)
    return key

def scrape_google_images(query, num_images=50):
    search_url = "https://serpapi.com/search.json"
    api_key = get_next_api_key()

    params = {
        "q": query,
        "tbm": "isch",
        "ijn": 0,
        "api_key": api_key
    }

    try:
        response = requests.get(search_url, params=params, timeout=30)
        response.raise_for_status()
        search_results = response.json()

        image_urls = [result["original"] for result in search_results.get("images_results", [])[:num_images]]
        
        return {
            "status": "success",
            "image_urls": image_urls
        }

    except requests.exceptions.RequestException as e:
        logging.error(f"Request error: {e}")
        return {
            "status": "error",
            "message": f"Request error: {e}"
        }

    except KeyError:
        logging.error("Unexpected response structure. 'images_results' key not found.")
        return {
            "status": "error",
            "message": "Unexpected response structure. 'images_results' key not found."
        }
