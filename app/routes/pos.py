from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from app.models import Product, Order, OrderItem, BranchStock, Customer
from app import db
from datetime import datetime, timezone

pos_bp = Blueprint('pos', __name__, url_prefix='/pos')


@pos_bp.before_request
def restrict_accounting():
    """Globally block the accounting role from accessing POS features."""
    if current_user.is_authenticated and current_user.role == 'accounting':
        if request.endpoint == 'pos.terminal':
            flash('Auditors cannot access the POS terminal.', 'error')
            return redirect(url_for('dashboard.index'))
        return jsonify(success=False, message='Auditors cannot perform POS transactions.'), 403


@pos_bp.route('/')
@login_required
def terminal():
    """The POS terminal page."""
    if current_user.role != 'cashier':
        flash('Only Cashiers are authorized to punch the POS terminal.', 'error')
        return redirect(url_for('dashboard.index'))
        
    products = Product.query.filter_by(is_active=True).order_by(Product.category, Product.name).all()
    customers = Customer.query.order_by(Customer.name).all()
    
    stocks = BranchStock.query.filter_by(branch_id=current_user.branch_id).all()
    stock_dict = {s.product_id: s.quantity for s in stocks}

    return render_template('pos/terminal.html', products=products, customers=customers, stock_dict=stock_dict)


@pos_bp.route('/checkout', methods=['POST'])
@login_required
def checkout():
    """Process a sale."""
    if current_user.role != 'cashier':
        return jsonify(success=False, message='Only Cashiers can process a checkout.'), 403
        
    data = request.get_json()
    if not data or not data.get('items'):
        return jsonify(success=False, message='Cart is empty.'), 400

    payment_method = data.get('payment_method', 'cash')
    customer_id = data.get('customer_id') or None

    if payment_method == 'loan' and not customer_id:
        return jsonify(success=False, message='Select a customer for loan transactions.'), 400

    order = Order(
        user_id=current_user.id,
        branch_id=current_user.branch_id,
        customer_id=int(customer_id) if customer_id else None,
        payment_method=payment_method,
        status='completed',
    )
    db.session.add(order)

    total = 0.0
    total_qty = 0
    for item in data['items']:
        product = db.session.get(Product, int(item['product_id']))
        if not product:
            db.session.rollback()
            return jsonify(success=False, message=f'Product not found.'), 400
        
        qty = int(item['quantity'])
        if qty <= 0:
            db.session.rollback()
            return jsonify(success=False, message=f'Invalid quantity for {product.name}.'), 400
            
        total_qty += qty
        if total_qty > 1000:
            db.session.rollback()
            return jsonify(success=False, message='Order exceeds maximum item limit (1000).'), 400

        stock = BranchStock.query.filter_by(
            branch_id=current_user.branch_id, product_id=product.id
        ).first()
        
        if not stock or stock.quantity < qty:
            db.session.rollback()
            return jsonify(success=False, message=f'Insufficient stock for {product.name}.'), 400

        oi = OrderItem(
            order=order,
            product_id=product.id,
            quantity=qty,
            price_at_time=product.price,
        )
        db.session.add(oi)
        total += product.price * qty

        # Decrease branch stock
        stock.quantity -= qty

    if total > 50000.00:
        db.session.rollback()
        return jsonify(success=False, message='Order exceeds maximum transaction total ($50,000.00).'), 400

    order.total_amount = total

    # If loan, add to customer outstanding balance
    if payment_method == 'loan' and customer_id:
        customer = db.session.get(Customer, int(customer_id))
        if customer:
            customer.outstanding_balance += total

    db.session.commit()
    return jsonify(success=True, order_id=order.id, total=total)


@pos_bp.route('/void-item', methods=['POST'])
@login_required
def void_item():
    """Void a single item from an order (pre- or post-checkout)."""
    data = request.get_json()
    item_id = data.get('item_id')
    reason = data.get('reason', '')

    oi = db.session.get(OrderItem, int(item_id))
    if not oi:
        return jsonify(success=False, message='Item not found.'), 404

    if oi.status == 'voided':
        return jsonify(success=False, message='Item is already voided.'), 400

    oi.status = 'voided'
    oi.void_reason = reason

    # Recalculate order total
    order = oi.order
    order.recalculate_total()

    # Return stock
    stock = BranchStock.query.filter_by(branch_id=order.branch_id, product_id=oi.product_id).first()
    if stock:
        stock.quantity += oi.quantity

    db.session.commit()
    return jsonify(success=True, new_total=order.total_amount)


@pos_bp.route('/void-order', methods=['POST'])
@login_required
def void_order():
    """Void an entire order (manager+ only)."""
    if not current_user.is_manager:
        return jsonify(success=False, message='Only managers can void orders.'), 403

    data = request.get_json()
    order_id = data.get('order_id')
    reason = data.get('reason', '')

    order = db.session.get(Order, int(order_id))
    if not order:
        return jsonify(success=False, message='Order not found.'), 404

    order.status = 'voided'
    order.void_reason = reason
    order.voided_at = datetime.now(timezone.utc)

    # Return stock for all active items
    for item in order.items:
        if item.status == 'active':
            item.status = 'voided'
            item.void_reason = reason
            stock = BranchStock.query.filter_by(branch_id=order.branch_id, product_id=item.product_id).first()
            if stock:
                stock.quantity += item.quantity

    # If loan, reverse balance
    if order.payment_method == 'loan' and order.customer_id:
        customer = db.session.get(Customer, order.customer_id)
        if customer:
            customer.outstanding_balance -= order.total_amount

    order.total_amount = 0
    db.session.commit()
    return jsonify(success=True)
