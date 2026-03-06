"""Seed the database with demo data: 2 branches, users, products, customers."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models import Branch, User, Product, BranchStock, Customer

app = create_app()

with app.app_context():
    # Avoid duplicates
    if User.query.first():
        print("Database already seeded. Skipping.")
        sys.exit(0)

    # --- Branches ---
    b1 = Branch(name='Main Branch', location='Downtown, 123 Main St')
    b2 = Branch(name='Uptown Branch', location='Uptown, 456 Oak Ave')
    db.session.add_all([b1, b2])
    db.session.flush()

    # --- Users ---
    admin = User(username='admin', role='admin', branch_id=b1.id)
    admin.set_password('admin123')

    mgr = User(username='manager', role='manager', branch_id=b1.id)
    mgr.set_password('manager123')

    cashier1 = User(username='cashier1', role='cashier', branch_id=b1.id)
    cashier1.set_password('cashier123')

    cashier2 = User(username='cashier2', role='cashier', branch_id=b2.id)
    cashier2.set_password('cashier123')

    auditor = User(username='auditor1', role='accounting', branch_id=None)
    auditor.set_password('audit123')

    db.session.add_all([admin, mgr, cashier1, cashier2, auditor])

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
        p = Product(name=name, sku=sku, price=price, category=cat)
        db.session.add(p)
        product_objs.append(p)

    db.session.flush()

    # --- Branch Stock ---
    for p in product_objs:
        db.session.add(BranchStock(branch_id=b1.id, product_id=p.id, quantity=50))
        db.session.add(BranchStock(branch_id=b2.id, product_id=p.id, quantity=30))

    # --- Customers ---
    c1 = Customer(name='Juan dela Cruz', contact='09171234567')
    c2 = Customer(name='Maria Santos', contact='09189876543')
    db.session.add_all([c1, c2])

    db.session.commit()
    print("✅ Database seeded successfully!")
    print("   Branches: Main Branch, Uptown Branch")
    print("   Users: admin/admin123, manager/manager123, cashier1/cashier123, cashier2/cashier123, auditor1/audit123")
    print("   Products: 12 items")
    print("   Customers: 2 (for loans)")
