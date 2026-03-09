"""
FILE: app/routes/branches.py
PURPOSE: CRUD operations for managing store branches.
DEPENDENCIES: models.py, constants.py
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from app.models import Branch, User, Product, BranchStock

from app.constants import Roles, ShiftStatus, TransactionType
from app import db

branches_bp = Blueprint('branches', __name__, url_prefix='/branches')


@branches_bp.route('/')
@login_required
def index():
    if not current_user.is_manager:
        flash('Access denied.', 'danger')
        return redirect(url_for('dashboard.index'))

    branches = Branch.query.order_by(Branch.name).all()
    return render_template('branches/index.html', branches=branches)


@branches_bp.route('/create', methods=['GET', 'POST'])
@login_required
def create():
    if not current_user.is_admin:
        flash('Only admins can create branches.', 'danger')
        return redirect(url_for('branches.index'))

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        location = request.form.get('location', '').strip()
        if not name:
            flash('Branch name is required.', 'danger')
        elif Branch.query.filter_by(name=name).first():
            flash('A branch with that name already exists.', 'danger')
        else:
            branch = Branch(name=name, location=location)
            db.session.add(branch)
            db.session.commit()
            flash(f'Branch "{name}" created.', 'success')
            return redirect(url_for('branches.index'))

    return render_template('branches/form.html', branch=None)


@branches_bp.route('/<int:branch_id>/edit', methods=['GET', 'POST'])
@login_required
def edit(branch_id):
    if not current_user.is_admin:
        flash('Only admins can edit branches.', 'danger')
        return redirect(url_for('branches.index'))

    branch = db.session.get(Branch, branch_id)
    if not branch:
        flash('Branch not found.', 'danger')
        return redirect(url_for('branches.index'))

    if request.method == 'POST':
        branch.name = request.form.get('name', '').strip()
        branch.location = request.form.get('location', '').strip()
        branch.is_active = 'is_active' in request.form
        db.session.commit()
        flash('Branch updated.', 'success')
        return redirect(url_for('branches.index'))

    return render_template('branches/form.html', branch=branch)


@branches_bp.route('/<int:branch_id>/products')
@login_required
def products(branch_id):
    """Manage products / stock for a specific branch."""
    if not current_user.is_manager:
        flash('Access denied.', 'danger')
        return redirect(url_for('dashboard.index'))

    branch = db.session.get(Branch, branch_id)
    if not branch:
        flash('Branch not found.', 'danger')
        return redirect(url_for('branches.index'))

    stock_items = (
        db.session.query(Product, BranchStock.quantity)
        .outerjoin(BranchStock, (BranchStock.product_id == Product.id) & (BranchStock.branch_id == branch_id))
        .filter(Product.is_active == True)
        .order_by(Product.name)
        .all()
    )
    return render_template('branches/products.html', branch=branch, stock_items=stock_items)


@branches_bp.route('/<int:branch_id>/products/update-stock', methods=['POST'])
@login_required
def update_stock(branch_id):
    if not current_user.is_manager:
        flash('Access denied.', 'danger')
        return redirect(url_for('dashboard.index'))

    product_id = int(request.form.get('product_id', 0))
    quantity = int(request.form.get('quantity', 0))

    stock = BranchStock.query.filter_by(branch_id=branch_id, product_id=product_id).first()
    if stock:
        stock.quantity = quantity
    else:
        stock = BranchStock(branch_id=branch_id, product_id=product_id, quantity=quantity)
        db.session.add(stock)

    db.session.commit()
    flash('Stock updated.', 'success')
    return redirect(url_for('branches.products', branch_id=branch_id))
