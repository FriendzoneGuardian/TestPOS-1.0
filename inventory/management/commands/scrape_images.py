import os
import time
import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from inventory.models import Product

class Command(BaseCommand):
    help = 'Scrapes Bulbapedia for missing item images based on inventory database'

    def handle(self, *args, **options):
        target_dir = 'static/assets/items'

        # Ensure target directory exists
        os.makedirs(target_dir, exist_ok=True)

        # Query products with image hashes
        products = Product.objects.exclude(image_hash__isnull=True).exclude(image_hash='')

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        self.stdout.write(self.style.SUCCESS(f"Found {products.count()} products with image hashes."))

        for product in products:
            name = product.name
            image_hash = product.image_hash
            file_path = os.path.join(target_dir, f"{image_hash}.png")

            if os.path.exists(file_path):
                self.stdout.write(f"Skipping {name} (already exists)")
                continue

            self.stdout.write(f"Searching for {name} on Bulbapedia...")

            # Format name for Bulbapedia URL (e.g., Poke Ball -> Poké_Ball)
            # Bulbapedia uses accented 'e' for Poke Ball, Poke Toy, etc.
            search_name = name.replace("Poke Ball", "Poké_Ball").replace(" ", "_")
            url = f"https://bulbapedia.bulbagarden.net/wiki/{search_name}"

            try:
                response = requests.get(url, headers=headers)
                if response.status_code != 200:
                    self.stdout.write(self.style.WARNING(f"  [!] Failed to load page for {name} (HTTP {response.status_code})"))
                    continue

                soup = BeautifulSoup(response.content, 'html.parser')

                # Find the main infobox image
                img_tag = None

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
                    self.stdout.write(f"  Downloading image for {name}...")
                    img_data = requests.get(img_tag, headers=headers).content
                    with open(file_path, 'wb') as f:
                        f.write(img_data)
                    self.stdout.write(self.style.SUCCESS(f"  [OK] Saved {name} -> {image_hash}.png"))
                else:
                    self.stdout.write(self.style.ERROR(f"  [!] Could not find image tag for {name}"))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  [X] Error scraping {name}: {e}"))

            # Be a gentle maid, don't hammer the server
            time.sleep(1)

        self.stdout.write(self.style.SUCCESS("Scraping complete!"))
