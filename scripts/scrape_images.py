import os
import sqlite3
import requests
from bs4 import BeautifulSoup
import time

def scrape_bulbapedia_images():
    db_path = 'db.sqlite3'
    target_dir = 'static/assets/items'

    # Ensure target directory exists
    os.makedirs(target_dir, exist_ok=True)

    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name, image_hash FROM inventory_product WHERE image_hash IS NOT NULL AND image_hash != '';")
    items = cursor.fetchall()

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    for name, image_hash in items:
        file_path = os.path.join(target_dir, f"{image_hash}.png")
        if os.path.exists(file_path):
            print(f"Skipping {name} (already exists)")
            continue

        print(f"Searching for {name} on Bulbapedia...")

        # Format name for Bulbapedia URL (e.g., Poke Ball -> Poké_Ball)
        # Bulbapedia uses accented 'e' for Poke Ball, Poke Toy, etc.
        search_name = name.replace("Poke Ball", "Poké_Ball").replace(" ", "_")
        url = f"https://bulbapedia.bulbagarden.net/wiki/{search_name}"

        try:
            response = requests.get(url, headers=headers)
            if response.status_code != 200:
                print(f"  [!] Failed to load page for {name} (HTTP {response.status_code})")
                continue

            soup = BeautifulSoup(response.content, 'html.parser')

            # Find the main infobox image
            # Usually it's in a table with class 'roundy' and an image link
            img_tag = None

            # Bulbapedia item pages usually have an image in the top right infobox
            # The image often contains 'Dream' or 'Sprite' or just the item name
            images = soup.select('table.roundy img')
            for img in images:
                src = img.get('src', '')
                if 'Dream' in src or 'Sprite' in src or 'Artwork' in src or 'BDSP' in src or 'SV' in src:
                    if src.startswith('//'):
                        src = 'https:' + src
                    img_tag = src
                    break

            # Fallback: just get the first reasonable sized image in the infobox
            if not img_tag and images:
                src = images[0].get('src', '')
                if src.startswith('//'):
                    src = 'https:' + src
                img_tag = src

            if img_tag:
                print(f"  Downloading image for {name}...")
                img_data = requests.get(img_tag, headers=headers).content
                with open(file_path, 'wb') as f:
                    f.write(img_data)
                print(f"  [OK] Saved {name} -> {image_hash}.png")
            else:
                print(f"  [!] Could not find image tag for {name}")

        except Exception as e:
            print(f"  [X] Error scraping {name}: {e}")

        # Be a gentle maid, don't hammer the server
        time.sleep(1)

    conn.close()
    print("Scraping complete!")

if __name__ == "__main__":
    scrape_bulbapedia_images()
