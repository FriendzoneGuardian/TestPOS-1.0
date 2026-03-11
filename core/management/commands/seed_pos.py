import sys
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Branch
from inventory.models import Product, BranchStock
from sales.models import Customer

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with demo data: 2 branches, users, products, customers.'

    def handle(self, *args, **options):
        # Avoid duplicates
        if User.objects.filter(username='admin').exists():
            self.stdout.write(self.style.WARNING("Database already seeded. Skipping."))
            return

        self.stdout.write(self.style.NOTICE("Seeding database..."))

        # --- Branches ---
        b1 = Branch.objects.create(name='Main Branch', location='Downtown, 123 Main St')
        b2 = Branch.objects.create(name='Uptown Branch', location='Uptown, 456 Oak Ave')

        # --- Users ---
        # admin is superuser
        admin = User.objects.create_superuser(username='admin', email='admin@example.com', password='admin123', role='admin', branch=b1)
        mgr = User.objects.create_user(username='manager', password='manager123', role='manager', branch=b1)
        cashier1 = User.objects.create_user(username='cashier1', password='cashier123', role='cashier', branch=b1)
        cashier2 = User.objects.create_user(username='cashier2', password='cashier123', role='cashier', branch=b2)

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

        self.stdout.write(self.style.SUCCESS("✅ Database seeded successfully!"))
        self.stdout.write("   Branches: Main Branch, Uptown Branch")
        self.stdout.write("   Users: admin/admin123, manager/manager123, cashier1/cashier123, cashier2/cashier123")
        self.stdout.write(f"   Products: {len(product_objs)} items")
        self.stdout.write("   Customers: 2 (for loans)")
