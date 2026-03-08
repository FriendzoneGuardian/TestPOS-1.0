"""
FILE: app/routes/pos.py
PURPOSE: Core POS Terminal logic: checkout, voiding items, and opening/closing shifts (with vault tracking).
DEPENDENCIES: models.py, constants.py
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from app.models import Product, Order, OrderItem, BranchStock, Customer, Shift, VoidLog, BranchVault, VaultTransaction

from app.constants import Roles, ShiftStatus, TransactionType
from app import db
from datetime import datetime, timezone
from sqlalchemy import func

pos_bp = Blueprint('pos', __name__, url_prefix='/pos')


@pos_bp.before_request
def restrict_accounting():
    """Globally block the accounting role from accessing POS features."""
    if current_user.is_authenticated and current_user.role == Roles.ACCOUNTING:
        if request.endpoint == 'pos.terminal':
            flash('Auditors cannot access the POS terminal.', 'error')
            return redirect(url_for('dashboard.index'))
        return jsonify(success=False, message='Auditors cannot perform POS transactions.'), 403


@pos_bp.route('/')
@login_required
def terminal():
    """The POS terminal page."""
    if current_user.role != Roles.CASHIER:
        flash('Only Cashiers are authorized to punch the POS terminal.', 'error')
        return redirect(url_for('dashboard.index'))
        
    products = Product.query.filter_by(is_active=True).order_by(Product.category, Product.name).all()
    customers = Customer.query.order_by(Customer.name).all()
    
    stocks = BranchStock.query.filter_by(branch_id=current_user.branch_id).all()
    stock_dict = {s.product_id: s.quantity for s in stocks}
    
    categories = sorted(list(set(p.category for p in products if p.category)))

    active_shift = Shift.query.filter_by(user_id=current_user.id, status=ShiftStatus.OPEN).first()

    # Check if a shift was just closed (for lockout overlay)
    shift_just_closed = not active_shift and Shift.query.filter_by(
        user_id=current_user.id, status=ShiftStatus.CLOSED
    ).order_by(Shift.end_time.desc()).first() is not None

    return render_template('pos/terminal.html', products=products, customers=customers, stock_dict=stock_dict, categories=categories, active_shift=active_shift, shift_just_closed=shift_just_closed)


@pos_bp.route('/checkout', methods=['POST'])
@login_required
def checkout():
    """Process a sale."""
    if current_user.role != Roles.CASHIER:
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


@pos_bp.route('/shift/open', methods=['POST'])
@login_required
def open_shift():
    """Declare starting cash and open a shift."""
    if current_user.role != Roles.CASHIER:
        return redirect(url_for('dashboard.index'))
    starting_cash = request.form.get('starting_cash', 0.0, type=float)
    
    existing = Shift.query.filter_by(user_id=current_user.id, status=ShiftStatus.OPEN).first()
    if existing:
        flash('You already have an open shift.', 'error')
        return redirect(url_for('pos.terminal'))

    # --- Vault Withdrawal ---
    vault = BranchVault.query.filter_by(branch_id=current_user.branch_id).first()
    if vault:
        if vault.balance < starting_cash:
            flash(f'Insufficient vault funds. Vault balance: ₱{vault.balance:,.2f}', 'error')
            return redirect(url_for('pos.terminal'))
        vault.balance -= starting_cash
        vault.last_updated = datetime.now(timezone.utc)
        vt = VaultTransaction(
            vault_id=vault.id,
            user_id=current_user.id,
            amount=starting_cash,
            transaction_type=TransactionType.WITHDRAWAL,
            reason=f'Shift opening float for {current_user.username}'
        )
        db.session.add(vt)

    shift = Shift(
        user_id=current_user.id,
        branch_id=current_user.branch_id,
        starting_cash=starting_cash,
        status=ShiftStatus.OPEN
    )
    db.session.add(shift)
    db.session.commit()
    flash('Shift started successfully. Till is open.', 'success')
    return redirect(url_for('pos.terminal'))

@pos_bp.route('/shift/close', methods=['POST'])
@login_required
def close_shift():
    """Declare ending cash and close a shift."""
    if current_user.role != Roles.CASHIER:
        return redirect(url_for('dashboard.index'))
        
    shift = Shift.query.filter_by(user_id=current_user.id, status=ShiftStatus.OPEN).first()
    if not shift:
        flash('No active shift found.', 'error')
        return redirect(url_for('pos.terminal'))
        
    ending_cash = request.form.get('ending_cash', 0.0, type=float)
    
    # Calculate Expected Cash
    orders = Order.query.filter_by(
        user_id=current_user.id, 
        payment_method='cash', 
        status='completed'
    ).filter(Order.order_date >= shift.start_time).all()
    
    cash_sales = sum(o.total_amount for o in orders)
    
    shift.expected_cash = shift.starting_cash + cash_sales
    shift.ending_cash = ending_cash
    shift.end_time = datetime.now(timezone.utc)
    shift.status = 'closed'

    # --- Vault Deposit (Safe Drop) ---
    vault = BranchVault.query.filter_by(branch_id=current_user.branch_id).first()
    if vault:
        vault.balance += ending_cash
        vault.last_updated = datetime.now(timezone.utc)
        vt = VaultTransaction(
            vault_id=vault.id,
            user_id=current_user.id,
            amount=ending_cash,
            transaction_type=TransactionType.DEPOSIT,
            reason=f'Shift closing safe drop by {current_user.username}'
        )
        db.session.add(vt)
    
    db.session.commit()
    
    diff = shift.ending_cash - shift.expected_cash
    if diff == 0:
        flash(f'Shift closed perfectly. Great job!', 'success')
    elif diff > 0:
        flash(f'Shift closed. You are OVER by ₱{diff:.2f}.', 'warning')
    else:
        flash(f'Shift closed. You are SHORT by ₱{abs(diff):.2f}.', 'error')
        
    return redirect(url_for('pos.terminal'))


@pos_bp.route('/shift/x-report', methods=['GET'])
@login_required
def x_report():
    """Return partial X-Report data for the current cashier's active shift."""
    if current_user.role != Roles.CASHIER:
        return jsonify(success=False), 403

    shift = Shift.query.filter_by(user_id=current_user.id, status=ShiftStatus.OPEN).first()
    if not shift:
        return jsonify(success=False, message='No active shift.'), 404

    # Cash sales during this shift
    cash_orders = Order.query.filter_by(
        user_id=current_user.id, payment_method='cash', status='completed'
    ).filter(Order.order_date >= shift.start_time).all()
    cash_sales = sum(o.total_amount for o in cash_orders)

    # All completed orders (cash + loan)
    all_orders = Order.query.filter_by(
        user_id=current_user.id, status='completed'
    ).filter(Order.order_date >= shift.start_time).all()
    total_sales = sum(o.total_amount for o in all_orders)
    order_count = len(all_orders)

    # Voided items during shift
    void_count = VoidLog.query.join(Order).filter(
        Order.user_id == current_user.id,
        VoidLog.timestamp >= shift.start_time
    ).count()
    void_amount = db.session.query(func.coalesce(func.sum(VoidLog.amount_refunded), 0)).join(Order).filter(
        Order.user_id == current_user.id,
        VoidLog.timestamp >= shift.start_time
    ).scalar()

    expected_cash = shift.starting_cash + cash_sales

    return jsonify(
        success=True,
        starting_cash=shift.starting_cash,
        cash_sales=cash_sales,
        total_sales=total_sales,
        order_count=order_count,
        void_count=void_count,
        void_amount=float(void_amount),
        expected_cash=expected_cash,
        shift_start=shift.start_time.strftime('%Y-%m-%d %H:%M:%S')
    )


@pos_bp.route('/void-item', methods=['POST'])
@login_required
def void_item():
    """Void a single item from an order (Admins/Managers only)."""
    if current_user.role not in ['admin', 'manager']:
        return jsonify(success=False, message='Only Admins and Managers can void items.'), 403

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

    # Audit logging
    refund_amount = oi.quantity * oi.price_at_time
    v_log = VoidLog(
        order_id=oi.order_id,
        order_item_id=oi.id,
        voided_by_user_id=current_user.id,
        reason=reason,
        amount_refunded=refund_amount
    )
    db.session.add(v_log)

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
    """Void an entire order (Manager+ only)."""
    if current_user.role not in ['admin', 'manager']:
        return jsonify(success=False, message='Only Admin/Managers can void orders.'), 403

    data = request.get_json()
    order_id = data.get('order_id')
    reason = data.get('reason', '')

    order = db.session.get(Order, int(order_id))
    if not order:
        return jsonify(success=False, message='Order not found.'), 404

    if order.status == 'voided':
        return jsonify(success=False, message='Order is already voided.'), 400

    order.status = 'voided'
    order.void_reason = reason
    order.voided_at = datetime.now(timezone.utc)

    # Audit logging for total order
    v_log = VoidLog(
        order_id=order.id,
        order_item_id=None,
        voided_by_user_id=current_user.id,
        reason=reason,
        amount_refunded=order.total_amount
    )
    db.session.add(v_log)

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
