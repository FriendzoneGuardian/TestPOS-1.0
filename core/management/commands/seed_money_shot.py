import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Branch
from inventory.models import Product, BranchStock
from sales.models import Customer, BranchVault
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with original "TheMoneyShot" Alpha data'

    def handle(self, *args, **options):
        self.stdout.write('Clearing existing data...')
        Customer.objects.all().delete()
        BranchStock.objects.all().delete()
        Product.objects.all().delete()
        User.objects.all().delete()
        Branch.objects.all().delete()

        with transaction.atomic():
            # --- Branches ---
            b1 = Branch.objects.create(name='Main Branch', location='Downtown, 123 Main St')
            b2 = Branch.objects.create(name='Uptown Branch', location='Uptown, 456 Oak Ave')

            # --- Vaults ---
            BranchVault.objects.create(branch=b1, balance=5000.0)
            BranchVault.objects.create(branch=b2, balance=2500.0)

            # --- Users ---
            admin = User.objects.create_superuser(username='admin', branch=b1)
            admin.set_password('admin123')
            admin.role = 'admin'
            admin.save()

            mgr = User.objects.create_user(username='manager', branch=b1)
            mgr.set_password('manager123')
            mgr.role = 'manager'
            mgr.save()

            cashier1 = User.objects.create_user(username='cashier1', branch=b1)
            cashier1.set_password('cashier123')
            cashier1.role = 'cashier'
            cashier1.save()

            cashier2 = User.objects.create_user(username='cashier2', branch=b2)
            cashier2.set_password('cashier123')
            cashier2.role = 'cashier'
            cashier2.save()

            auditor = User.objects.create_user(username='auditor', branch=b1)
            auditor.set_password('auditor123')
            auditor.role = 'accounting'
            auditor.save()

            # --- Products ---
            products_data = [
                ('Coffee (Regular)', 'BEV-001', 3.50, 'Beverages'),
                ('Coffee (Large)', 'BEV-002', 4.50, 'Beverages'),
                ('Iced Tea', 'BEV-003', 2.75, 'Beverages'),
                ('Bottled Water', 'BEV-004', 1.00, 'Beverages'),
                ('Sandwich (Ham)', 'FOOD-001', 6.50, 'Food'),
                ('Sandwich (Chicken)', 'FOOD-002', 7.00, 'Food'),
                ('Burger (Classic)', 'FOOD-003', 8.50, 'Food'),
                ('Fries (Regular)', 'FOOD-004', 3.00, 'Food'),
                ('Salad (Caesar)', 'FOOD-005', 5.50, 'Food'),
                ('Muffin (Blueberry)', 'SNACK-001', 2.50, 'Snacks'),
                ('Donut (Glazed)', 'SNACK-002', 1.75, 'Snacks'),
                ('Chips (Assorted)', 'SNACK-003', 1.50, 'Snacks'),
            ]

            product_objs = []
            for name, sku, price, cat in products_data:
                p = Product.objects.create(name=name, sku=sku, price=price, category=cat)
                product_objs.append(p)

            # --- Branch Stock ---
            for p in product_objs:
                BranchStock.objects.create(branch=b1, product=p, quantity=50)
                BranchStock.objects.create(branch=b2, product=p, quantity=30)

            # --- Customers ---
            Customer.objects.create(name='Juan dela Cruz', contact='09171234567')
            Customer.objects.create(name='Maria Santos', contact='09189876543')

        self.stdout.write(self.style.SUCCESS('Successfully re-seeded "TheMoneyShot" Alpha data!'))
