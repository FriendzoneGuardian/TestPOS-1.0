"""
FILE: app/routes/loans.py
PURPOSE: Manages Customer accounts, loan/credit tracking, and loan payment logging.
DEPENDENCIES: models.py, constants.py
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from app.models import Customer, LoanPayment, Order

from app.constants import Roles, ShiftStatus, TransactionType
from app import db

loans_bp = Blueprint('loans', __name__, url_prefix='/loans')


@loans_bp.route('/')
@login_required
def index():
    customers = Customer.query.order_by(Customer.name).all()
    return render_template('loans/index.html', customers=customers)


@loans_bp.route('/customer/<int:customer_id>')
@login_required
def customer_detail(customer_id):
    customer = db.session.get(Customer, customer_id)
    if not customer:
        flash('Customer not found.', 'danger')
        return redirect(url_for('loans.index'))

    loan_orders = Order.query.filter_by(customer_id=customer_id, payment_method='loan', status='completed').order_by(Order.order_date.desc()).all()
    payments = LoanPayment.query.filter_by(customer_id=customer_id).order_by(LoanPayment.payment_date.desc()).all()
    return render_template('loans/detail.html', customer=customer, loan_orders=loan_orders, payments=payments)


@loans_bp.route('/customer/create', methods=['GET', 'POST'])
@login_required
def create_customer():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        contact = request.form.get('contact', '').strip()
        if not name:
            flash('Customer name is required.', 'danger')
        else:
            customer = Customer(name=name, contact=contact)
            db.session.add(customer)
            db.session.commit()
            flash(f'Customer "{name}" added.', 'success')
            return redirect(url_for('loans.index'))

    return render_template('loans/customer_form.html', customer=None)


@loans_bp.route('/payment/<int:customer_id>', methods=['POST'])
@login_required
def make_payment(customer_id):
    customer = db.session.get(Customer, customer_id)
    if not customer:
        flash('Customer not found.', 'danger')
        return redirect(url_for('loans.index'))

    amount = float(request.form.get('amount', 0))
    notes = request.form.get('notes', '').strip()

    if amount <= 0:
        flash('Payment amount must be positive.', 'danger')
        return redirect(url_for('loans.customer_detail', customer_id=customer_id))

    if amount > customer.outstanding_balance:
        amount = customer.outstanding_balance  # Cap at balance

    payment = LoanPayment(customer_id=customer_id, amount=amount, notes=notes)
    customer.outstanding_balance -= amount
    db.session.add(payment)
    db.session.commit()
    flash(f'Payment of ${amount:.2f} recorded.', 'success')
    return redirect(url_for('loans.customer_detail', customer_id=customer_id))
