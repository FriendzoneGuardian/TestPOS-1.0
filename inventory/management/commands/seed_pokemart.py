import hashlib
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from inventory.models import Product, BranchStock
from core.models import Branch

class Command(BaseCommand):
    help = 'Seeds the database with Poke Mart items (Post-Game/8 Badges)'

    def handle(self, *args, **kwargs):
        items = [
            # Balls
            ('Poke Ball', 'BALL-001', 200.0, 'Balls'),
            ('Great Ball', 'BALL-002', 600.0, 'Balls'),
            ('Ultra Ball', 'BALL-003', 1200.0, 'Balls'),
            # Potions
            ('Potion', 'POT-001', 300.0, 'Potions'),
            ('Super Potion', 'POT-002', 700.0, 'Potions'),
            ('Hyper Potion', 'POT-003', 1200.0, 'Potions'),
            ('Max Potion', 'POT-004', 2500.0, 'Potions'),
            ('Full Restore', 'POT-005', 3000.0, 'Potions'),
            # Heals
            ('Antidote', 'HEAL-001', 100.0, 'Status Heals'),
            ('Parlyz Heal', 'HEAL-002', 200.0, 'Status Heals'),
            ('Awakening', 'HEAL-003', 250.0, 'Status Heals'),
            ('Burn Heal', 'HEAL-004', 250.0, 'Status Heals'),
            ('Ice Heal', 'HEAL-005', 250.0, 'Status Heals'),
            ('Full Heal', 'HEAL-006', 600.0, 'Status Heals'),
            ('Revive', 'HEAL-007', 1500.0, 'Status Heals'),
            # Utility
            ('Repel', 'UTIL-001', 350.0, 'Utility'),
            ('Super Repel', 'UTIL-002', 500.0, 'Utility'),
            ('Max Repel', 'UTIL-003', 700.0, 'Utility'),
            ('Escape Rope', 'UTIL-004', 550.0, 'Utility'),
        ]

        branches = Branch.objects.all()
        if not branches.exists():
            self.stdout.write(self.style.ERROR('No branches found. Run seed_pos first.'))
            return

        for name, sku, price, category in items:
            # Generate a 12-char hash for the image linking
            img_hash = hashlib.sha256(name.encode()).hexdigest()[:12]
            
            product, created = Product.objects.update_or_create(
                sku=sku,
                defaults={
                    'name': name,
                    'price': price,
                    'category': category,
                    'image_hash': img_hash,
                    'is_active': True
                }
            )
            
            action = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f'{action} {name} (Hash: {img_hash})'))

            # Ensure all branches have this item in stock
            for branch in branches:
                BranchStock.objects.get_or_create(
                    branch=branch,
                    product=product,
                    defaults={'quantity': 99} # Realistic 8-badge stock
                )

        self.stdout.write(self.style.SUCCESS('Poke Mart Seeding Complete!'))
