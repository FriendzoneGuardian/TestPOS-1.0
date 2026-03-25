import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tp_django.settings')
django.setup()

from inventory.models import Product, BranchStock, ProductUnit, StockBatch
from sales.models import BundlePromotion
from core.models import Branch

def seed():
    print("Seeding Pokemon Mart special rules...")

    # Get a branch
    branch = Branch.objects.first()
    if not branch:
        print("Error: No branches found. Please run 'python manage.py seed_pos' first.")
        return

    # 1. Create Products
    pk_ball, _ = Product.objects.get_or_create(
        sku='PK-001',
        defaults={'name': 'Poke Ball', 'price': 200.0, 'category': 'Items'}
    )
    lux_ball, _ = Product.objects.get_or_create(
        sku='PK-002',
        defaults={'name': 'Luxury Ball', 'price': 1000.0, 'category': 'Items'}
    )

    # 2. Create Unit (Box of 10)
    ProductUnit.objects.get_or_create(
        product=pk_ball,
        unit_name='Box',
        defaults={'multiplier': 10, 'price': 1800.0}
    )

    # 3. Create Promotion (Buy 10, Get 1 Luxury Ball)
    BundlePromotion.objects.get_or_create(
        trigger_product=pk_ball,
        trigger_quantity=10,
        promo_type='freebie',
        defaults={
            'bonus_product': lux_ball,
            'bonus_qty': 1,
            'is_active': True
        }
    )

    # 4. Stock Up
    bs_pk, _ = BranchStock.objects.get_or_create(branch=branch, product=pk_ball)
    bs_pk.quantity += 100
    bs_pk.save()

    bs_lux, _ = BranchStock.objects.get_or_create(branch=branch, product=lux_ball)
    bs_lux.quantity += 20
    bs_lux.save()

    # 5. Batch Up (for COGS)
    StockBatch.objects.create(
        product=pk_ball,
        branch=branch,
        quantity=100,
        unit_cost=150.0,
        status='good'
    )
    StockBatch.objects.create(
        product=lux_ball,
        branch=branch,
        quantity=20,
        unit_cost=800.0,
        status='good'
    )

    print(f"✅ Pokemon Mart seeded at {branch.name}!")
    print(f"   Poke Ball (x100) + Box Unit created.")
    print(f"   Luxury Ball (x20) created.")
    print(f"   Promo active: Buy 10 Poke Balls -> 1 Free Luxury Ball.")

if __name__ == "__main__":
    seed()
