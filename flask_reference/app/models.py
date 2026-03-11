from datetime import datetime, timezone
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app import db, login_manager


# ---------------------------------------------------------------------------
# Branch
# ---------------------------------------------------------------------------
class Branch(db.Model):
    __tablename__ = 'branches'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    location = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    users = db.relationship('User', backref='branch', lazy=True)
    orders = db.relationship('Order', backref='branch', lazy=True)
    stock = db.relationship('BranchStock', backref='branch', lazy=True)

    def __repr__(self):
        return f'<Branch {self.name}>'


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='cashier')  # admin | manager | cashier
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    orders = db.relationship('Order', backref='cashier', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_manager(self):
        return self.role in ('admin', 'manager')

    def __repr__(self):
        return f'<User {self.username}>'


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------
class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    sku = db.Column(db.String(50), unique=True, nullable=False)
    price = db.Column(db.Float, nullable=False, default=0.0)
    category = db.Column(db.String(80), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    order_items = db.relationship('OrderItem', backref='product', lazy=True)
    stock = db.relationship('BranchStock', backref='product', lazy=True)

    def __repr__(self):
        return f'<Product {self.name}>'


# ---------------------------------------------------------------------------
# Branch Stock (per-branch inventory)
# ---------------------------------------------------------------------------
class BranchStock(db.Model):
    __tablename__ = 'branch_stock'
    id = db.Column(db.Integer, primary_key=True)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=0)

    __table_args__ = (db.UniqueConstraint('branch_id', 'product_id'),)


# ---------------------------------------------------------------------------
# Customer (for Loans)
# ---------------------------------------------------------------------------
class Customer(db.Model):
    __tablename__ = 'customers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    contact = db.Column(db.String(150), nullable=True)
    outstanding_balance = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    orders = db.relationship('Order', backref='customer', lazy=True)
    payments = db.relationship('LoanPayment', backref='customer', lazy=True)

    def __repr__(self):
        return f'<Customer {self.name}>'


# ---------------------------------------------------------------------------
# Order
# ---------------------------------------------------------------------------
class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    order_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    total_amount = db.Column(db.Float, default=0.0)
    payment_method = db.Column(db.String(20), default='cash')  # cash | loan
    status = db.Column(db.String(20), default='completed')     # completed | voided
    void_reason = db.Column(db.Text, nullable=True)
    voided_at = db.Column(db.DateTime, nullable=True)

    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')

    def recalculate_total(self):
        self.total_amount = sum(
            item.subtotal for item in self.items if item.status == 'active'
        )

    def __repr__(self):
        return f'<Order #{self.id}>'


# ---------------------------------------------------------------------------
# Order Item
# ---------------------------------------------------------------------------
class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    price_at_time = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='active')  # active | voided
    void_reason = db.Column(db.Text, nullable=True)

    @property
    def subtotal(self):
        return self.quantity * self.price_at_time

    def __repr__(self):
        return f'<OrderItem {self.product_id} x{self.quantity}>'


# ---------------------------------------------------------------------------
# Loan Payment
# ---------------------------------------------------------------------------
class LoanPayment(db.Model):
    __tablename__ = 'loan_payments'
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    notes = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f'<LoanPayment ${self.amount}>'
