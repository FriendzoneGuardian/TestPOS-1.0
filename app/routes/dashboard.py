"""
FILE: app/routes/dashboard.py
PURPOSE: Renders the main dashboard, charts, Vault UI, and handles API endpoints for ApexCharts.
DEPENDENCIES: models.py, constants.py
"""
from flask import Blueprint, render_template, jsonify, redirect, url_for
from flask_login import login_required, current_user
from app.models import Order, OrderItem, Customer, Product, Branch, Shift, VoidLog, StockAuditLog

from app.constants import Roles, ShiftStatus, TransactionType
from app import db
from sqlalchemy import func
from datetime import datetime, timezone, timedelta

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/')
@login_required
def index():
    branch_id = current_user.branch_id
    today = datetime.now(timezone.utc).date()
    start_of_day = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)

    # -------------------------------------------------------------
    # 0. AUDITOR DASHBOARD (Role: 'accounting')
    # -------------------------------------------------------------
    if current_user.role == Roles.ACCOUNTING:
        active_loans = db.session.query(func.coalesce(func.sum(Customer.outstanding_balance), 0)).scalar()
        
        thirty_days_ago = start_of_day - timedelta(days=30)
        void_volume = db.session.query(func.coalesce(func.sum(VoidLog.amount_refunded), 0)).filter(
            VoidLog.timestamp >= thirty_days_ago
        ).scalar()
        
        recent_shifts = Shift.query.filter(
            Shift.status == ShiftStatus.CLOSED
        ).order_by(Shift.end_time.desc()).limit(10).all()
        
        suspicious_adjustments = StockAuditLog.query.filter(
            StockAuditLog.action_type == 'adjust',
            StockAuditLog.new_qty < StockAuditLog.old_qty
        ).order_by(StockAuditLog.timestamp.desc()).limit(10).all()
        
        return render_template('dashboard/auditor.html',
                               active_loans=active_loans,
                               void_volume=void_volume,
                               recent_shifts=recent_shifts,
                               suspicious_adjustments=suspicious_adjustments)

    # -------------------------------------------------------------
    # 1. ADMIN / MANAGER / CASHIER DASHBOARD
    # -------------------------------------------------------------
    # Summary stats
    if current_user.is_admin:
        daily_sales = db.session.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
            Order.order_date >= start_of_day, Order.status == 'completed'
        ).scalar()
        total_orders = Order.query.filter(Order.order_date >= start_of_day).count()
        void_count = Order.query.filter(Order.status == 'voided', Order.voided_at >= start_of_day).count()
    else:
        daily_sales = db.session.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
            Order.order_date >= start_of_day, Order.status == 'completed', Order.branch_id == branch_id
        ).scalar()
        total_orders = Order.query.filter(Order.order_date >= start_of_day, Order.branch_id == branch_id).count()
        void_count = Order.query.filter(
            Order.status == 'voided', Order.voided_at >= start_of_day, Order.branch_id == branch_id
        ).count()

    active_loans = db.session.query(func.coalesce(func.sum(Customer.outstanding_balance), 0)).scalar()

    # Top products (last 7 days)
    week_ago = start_of_day - timedelta(days=7)
    top_products_query = (
        db.session.query(Product.name, func.sum(OrderItem.quantity).label('qty'))
        .join(OrderItem, Product.id == OrderItem.product_id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(Order.order_date >= week_ago, Order.status == 'completed', OrderItem.status == 'active')
    )
    if not current_user.is_admin:
        top_products_query = top_products_query.filter(Order.branch_id == branch_id)
    top_products = top_products_query.group_by(Product.name).order_by(func.sum(OrderItem.quantity).desc()).limit(5).all()

    # Recent orders
    recent_query = Order.query.order_by(Order.order_date.desc())
    if not current_user.is_admin:
        recent_query = recent_query.filter_by(branch_id=branch_id)
    recent_orders = recent_query.limit(10).all()

    branches = Branch.query.filter_by(is_active=True).all()

    # Low stock alerts query
    from app.models import BranchStock

    low_stock_alerts = (
        db.session.query(Product, BranchStock, Branch)
        .join(BranchStock, Product.id == BranchStock.product_id)
        .join(Branch, BranchStock.branch_id == Branch.id)
        .filter(BranchStock.quantity <= Product.low_stock_threshold)
    )
    if not current_user.is_admin and current_user.role != Roles.ACCOUNTING:
        low_stock_alerts = low_stock_alerts.filter(BranchStock.branch_id == branch_id)
    low_stock_alerts = low_stock_alerts.order_by(BranchStock.quantity.asc()).all()

    return render_template('dashboard/index.html',
                           daily_sales=daily_sales,
                           total_orders=total_orders,
                           void_count=void_count,
                           active_loans=active_loans,
                           top_products=top_products,
                           recent_orders=recent_orders,
                           branches=branches,
                           low_stock_alerts=low_stock_alerts)


@dashboard_bp.route('/api/chart-data')
@login_required
def chart_data():
    """Return last-7-days sales data for chart rendering."""
    today = datetime.now(timezone.utc).date()
    branch_id = current_user.branch_id
    labels = []
    values = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        q = db.session.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
            Order.order_date >= start, Order.order_date < end, Order.status == 'completed'
        )
        if not current_user.is_admin:
            q = q.filter(Order.branch_id == branch_id)
        labels.append(day.strftime('%b %d'))
        values.append(float(q.scalar()))
    return jsonify(labels=labels, values=values)


@dashboard_bp.route('/vault')
@login_required
def vault():
    """Branch Vault dashboard — Admins and Auditors only."""
    if current_user.role not in ['admin', 'accounting']:
        return redirect(url_for('dashboard.index'))

    from app.models import BranchVault, VaultTransaction
    vaults = BranchVault.query.join(Branch).all()
    transactions = VaultTransaction.query.order_by(VaultTransaction.timestamp.desc()).limit(50).all()

    return render_template('dashboard/vault.html', vaults=vaults, transactions=transactions)
