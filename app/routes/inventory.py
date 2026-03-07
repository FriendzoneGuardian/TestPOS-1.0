from flask import Blueprint, render_template, request, flash, redirect, url_for, abort
from flask_login import login_required, current_user
from app.models import Product, BranchStock, Branch, StockAuditLog
from app.routes.users import roles_required
from app import db
import logging

inventory_bp = Blueprint('inventory', __name__, url_prefix='/inventory')

# ---------------------------------------------------------------------------
# Dashboard: View Inventory
# ---------------------------------------------------------------------------
@inventory_bp.route('/')
@login_required
@roles_required('admin', 'manager', 'accounting')
def index():
    products = Product.query.order_by(Product.name).all()
    
    if current_user.role in ['admin', 'accounting']:
        branches = Branch.query.filter_by(is_active=True).all()
    else:
        # manager only sees their own branch
        branches = [Branch.query.get(current_user.branch_id)] if current_user.branch_id else []

    # get all branch stocks for these branches
    branch_ids = [b.id for b in branches]
    stocks = BranchStock.query.filter(BranchStock.branch_id.in_(branch_ids)).all() if branch_ids else []
    
    # We want to format the data so the template can easily render it.
    # We will pass products, branches, and a nested dictionary for fast lookup: stock_dict[product_id][branch_id]
    stock_dict = {}
    for s in stocks:
        if s.product_id not in stock_dict:
            stock_dict[s.product_id] = {}
        stock_dict[s.product_id][s.branch_id] = s

    return render_template('inventory/index.html', products=products, branches=branches, stock_dict=stock_dict)

# ---------------------------------------------------------------------------
# API: Create Product
# ---------------------------------------------------------------------------
@inventory_bp.route('/product/create', methods=['POST'])
@login_required
@roles_required('admin')
def create_product():
    name = request.form.get('name')
    sku = request.form.get('sku')
    price = request.form.get('price')
    category = request.form.get('category')
    low_stock_threshold = request.form.get('low_stock_threshold', 10, type=int)

    if not name or not sku or price is None:
        flash('Missing required product fields.', 'error')
        return redirect(url_for('inventory.index'))

    existing = Product.query.filter_by(sku=sku).first()
    if existing:
        flash(f'SKU "{sku}" already exists.', 'error')
        return redirect(url_for('inventory.index'))

    try:
        new_prod = Product(
            name=name,
            sku=sku,
            price=float(price),
            category=category,
            low_stock_threshold=low_stock_threshold
        )
        db.session.add(new_prod)
        db.session.flush() # flush to get the new product id

        # Automatically seed BranchStock for all active branches to 0
        branches = Branch.query.filter_by(is_active=True).all()
        for branch in branches:
            new_stock = BranchStock(branch_id=branch.id, product_id=new_prod.id, quantity=0)
            db.session.add(new_stock)

        db.session.commit()
        flash(f'Product "{name}" added successfully.', 'success')
    except Exception as e:
        db.session.rollback()
        logging.getLogger('app').error(f"Error creating product: {e}")
        flash('Could not create product.', 'error')

    return redirect(url_for('inventory.index'))

# ---------------------------------------------------------------------------
# API: Update Product
# ---------------------------------------------------------------------------
@inventory_bp.route('/product/<int:id>/update', methods=['POST'])
@login_required
@roles_required('admin')
def update_product(id):
    product = Product.query.get_or_404(id)
    name = request.form.get('name')
    sku = request.form.get('sku')
    price = request.form.get('price')
    category = request.form.get('category')
    low_stock_threshold = request.form.get('low_stock_threshold', type=int)
    is_active = request.form.get('is_active') == 'on'

    if name: product.name = name
    if sku:
        if sku != product.sku and Product.query.filter_by(sku=sku).first():
            flash(f'SKU "{sku}" already in use.', 'error')
            return redirect(url_for('inventory.index'))
        product.sku = sku
    
    if price is not None:
        product.price = float(price)
    
    product.category = category
    if low_stock_threshold is not None:
        product.low_stock_threshold = low_stock_threshold
        
    product.is_active = is_active
    
    db.session.commit()
    flash(f'Product "{product.name}" updated.', 'success')
    return redirect(url_for('inventory.index'))

# ---------------------------------------------------------------------------
# API: Receive Stock
# ---------------------------------------------------------------------------
@inventory_bp.route('/stock/<int:product_id>/receive', methods=['POST'])
@login_required
@roles_required('admin', 'manager')
def receive_stock(product_id):
    product = Product.query.get_or_404(product_id)
    branch_id = request.form.get('branch_id', type=int)
    quantity = request.form.get('quantity', 0, type=int)

    if quantity <= 0:
        flash('Quantity must be greater than 0.', 'error')
        return redirect(url_for('inventory.index'))

    # Security: Managers can only receive stock for their own branch
    if current_user.role == 'manager':
        if branch_id != current_user.branch_id:
            abort(403)
            
    stock = BranchStock.query.filter_by(product_id=product.id, branch_id=branch_id).first()
    if not stock:
        # Just in case the branch stock wasn't seeded
        stock = BranchStock(product_id=product.id, branch_id=branch_id, quantity=0)
        db.session.add(stock)

    old_qty = stock.quantity
    stock.quantity += quantity
    
    # Paper trail: log the receipt
    reason = request.form.get('reason', '') or f"Received {quantity} units."
    audit_log = StockAuditLog(
        user_id=current_user.id,
        product_id=product.id,
        branch_id=branch_id,
        old_qty=old_qty,
        new_qty=stock.quantity,
        reason=reason,
        action_type='receive'
    )
    db.session.add(audit_log)

    db.session.commit()
    
    branch = Branch.query.get(branch_id)
    flash(f'Received {quantity}x "{product.name}" for {branch.name}.', 'success')
    return redirect(url_for('inventory.index'))

# ---------------------------------------------------------------------------
# API: Adjust/Audit Stock (Set Exact Quantity)
# ---------------------------------------------------------------------------
@inventory_bp.route('/stock/<int:product_id>/adjust', methods=['POST'])
@login_required
@roles_required('admin', 'manager')
def adjust_stock(product_id):
    product = Product.query.get_or_404(product_id)
    branch_id = request.form.get('branch_id', type=int)
    quantity = request.form.get('quantity', type=int)

    if quantity is None or quantity < 0:
        flash('Quantity cannot be negative or empty.', 'error')
        return redirect(url_for('inventory.index'))

    # Security: Managers can only adjust stock for their own branch
    if current_user.role == 'manager':
        if branch_id != current_user.branch_id:
            abort(403)
            
    stock = BranchStock.query.filter_by(product_id=product.id, branch_id=branch_id).first()
    if not stock:
        # Just in case the branch stock wasn't seeded
        stock = BranchStock(product_id=product.id, branch_id=branch_id, quantity=0)
        db.session.add(stock)

    old_qty = stock.quantity
    stock.quantity = quantity
    
    # Paper trail: log the manual adjustment
    reason = request.form.get('reason', '') or f"Manual adjustment from {old_qty} to {quantity}."
    audit_log = StockAuditLog(
        user_id=current_user.id,
        product_id=product.id,
        branch_id=branch_id,
        old_qty=old_qty,
        new_qty=stock.quantity,
        reason=reason,
        action_type='adjust'
    )
    db.session.add(audit_log)

    db.session.commit()
    
    branch = Branch.query.get(branch_id)
    flash(f'Adjusted {branch.name} stock of "{product.name}" to {quantity}x.', 'success')
    return redirect(url_for('inventory.index'))

# ---------------------------------------------------------------------------
# View: Stock Audit Logs
# ---------------------------------------------------------------------------
@inventory_bp.route('/audit-logs')
@login_required
@roles_required('admin', 'accounting')
def audit_logs():
    # Only show the latest 200 to prevent massive page load initially
    logs = StockAuditLog.query.order_by(StockAuditLog.timestamp.desc()).limit(200).all()
    return render_template('inventory/audit_logs.html', logs=logs)

