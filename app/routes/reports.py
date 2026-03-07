from flask import Blueprint, render_template, request, Response, redirect, url_for
from flask_login import login_required, current_user
from app.models import Order, OrderItem, Product, Branch
from app import db
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
import csv
import io

reports_bp = Blueprint('reports', __name__, url_prefix='/reports')


@reports_bp.route('/')
@login_required
def index():
    if not current_user.is_manager:
        return redirect(url_for('dashboard.index'))

    branches = Branch.query.filter_by(is_active=True).all()
    return render_template('reports/index.html', branches=branches)


@reports_bp.route('/sales')
@login_required
def sales():
    if not current_user.is_manager:
        return redirect(url_for('dashboard.index'))

    branch_id = request.args.get('branch_id', type=int)
    period = request.args.get('period', 'daily')
    today = datetime.now(timezone.utc).date()

    if period == 'weekly':
        start_date = today - timedelta(days=7)
    elif period == 'monthly':
        start_date = today - timedelta(days=30)
    else:
        start_date = today

    start_dt = datetime(start_date.year, start_date.month, start_date.day, tzinfo=timezone.utc)

    query = Order.query.filter(Order.order_date >= start_dt, Order.status == 'completed')
    if branch_id:
        query = query.filter(Order.branch_id == branch_id)
    elif not current_user.is_admin:
        query = query.filter(Order.branch_id == current_user.branch_id)

    orders = query.order_by(Order.order_date.desc()).all()
    total = sum(o.total_amount for o in orders)

    branches = Branch.query.filter_by(is_active=True).all()
    return render_template('reports/sales.html', orders=orders, total=total,
                           branches=branches, selected_branch=branch_id, period=period)


@reports_bp.route('/voids')
@login_required
def voids():
    if not current_user.is_manager:
        return redirect(url_for('dashboard.index'))

    query = Order.query.filter(Order.status == 'voided')
    if not current_user.is_admin:
        query = query.filter(Order.branch_id == current_user.branch_id)

    voided_orders = query.order_by(Order.voided_at.desc()).all()

    voided_items = (
        db.session.query(OrderItem, Product.name, Order.id)
        .join(Product, OrderItem.product_id == Product.id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(OrderItem.status == 'voided')
    )
    if not current_user.is_admin:
        voided_items = voided_items.filter(Order.branch_id == current_user.branch_id)
    voided_items = voided_items.order_by(OrderItem.id.desc()).all()

    return render_template('reports/voids.html', voided_orders=voided_orders, voided_items=voided_items)


@reports_bp.route('/export-csv')
@login_required
def export_csv():
    if not current_user.is_manager:
        return redirect(url_for('dashboard.index'))

    branch_id = request.args.get('branch_id', type=int)
    query = Order.query.filter(Order.status == 'completed')
    if branch_id:
        query = query.filter(Order.branch_id == branch_id)
    elif not current_user.is_admin:
        query = query.filter(Order.branch_id == current_user.branch_id)

    orders = query.order_by(Order.order_date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Order ID', 'Date', 'Branch', 'Cashier', 'Payment', 'Total'])
    for o in orders:
        writer.writerow([
            o.id,
            o.order_date.strftime('%Y-%m-%d %H:%M'),
            o.branch.name if o.branch else '',
            o.cashier.username if o.cashier else '',
            o.payment_method,
            f'{o.total_amount:.2f}',
        ])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=sales_report.csv'}
    )


@reports_bp.route('/periodic')
@login_required
def periodic():
    """Periodic audit report (Z-Report) — Daily to Annual."""
    if current_user.role not in ['admin', 'manager', 'accounting']:
        return redirect(url_for('dashboard.index'))

    from app.models import BranchStock, StockAuditLog, VoidLog, VaultTransaction, BranchVault
    from calendar import monthrange

    periods = {
        'daily': 'Daily (End of Day)',
        'weekly': 'Weekly (7 Days)',
        'semimonthly': 'Semi-Monthly (15 Days)',
        'monthly': 'Monthly (30 Days)',
        'quarterly': 'Quarterly (90 Days)',
        'annually': 'Annually (365 Days)',
    }

    selected_period = request.args.get('period', 'daily')
    selected_branch = request.args.get('branch_id', type=int)
    today = datetime.now(timezone.utc).date()
    end_date = today

    day_map = {'daily': 1, 'weekly': 7, 'semimonthly': 15, 'monthly': 30, 'quarterly': 90, 'annually': 365}
    delta_days = day_map.get(selected_period, 1)
    start_date = today - timedelta(days=delta_days)

    start_dt = datetime(start_date.year, start_date.month, start_date.day, tzinfo=timezone.utc)
    end_dt = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59, tzinfo=timezone.utc)

    # ---- Financials ----
    sales_q = Order.query.filter(Order.order_date >= start_dt, Order.order_date <= end_dt, Order.status == 'completed')
    if selected_branch:
        sales_q = sales_q.filter(Order.branch_id == selected_branch)
    elif not current_user.is_admin and current_user.role != 'accounting':
        sales_q = sales_q.filter(Order.branch_id == current_user.branch_id)
    completed_orders = sales_q.all()
    total_sales = sum(o.total_amount for o in completed_orders)
    order_count = len(completed_orders)

    # ---- Naughty List (Voids) ----
    void_q = db.session.query(func.coalesce(func.sum(VoidLog.amount_refunded), 0), func.count(VoidLog.id)).filter(
        VoidLog.timestamp >= start_dt, VoidLog.timestamp <= end_dt)
    void_result = void_q.first()
    void_total = float(void_result[0])
    void_count = void_result[1]

    # ---- Vault Deposits ----
    vt_q = db.session.query(
        func.coalesce(func.sum(VaultTransaction.amount), 0),
        func.count(VaultTransaction.id)
    ).filter(
        VaultTransaction.transaction_type == 'Deposit',
        VaultTransaction.timestamp >= start_dt,
        VaultTransaction.timestamp <= end_dt
    )
    vt_result = vt_q.first()
    vault_deposits = float(vt_result[0])
    vault_deposit_count = vt_result[1]

    # ---- Loans ----
    loan_q = Order.query.filter(
        Order.order_date >= start_dt, Order.order_date <= end_dt,
        Order.status == 'completed', Order.payment_method == 'loan'
    )
    if selected_branch:
        loan_q = loan_q.filter(Order.branch_id == selected_branch)
    loan_orders = loan_q.all()
    loan_total = sum(o.total_amount for o in loan_orders)
    loan_count = len(loan_orders)

    # ---- Top Products (The Stash) ----
    top_q = (
        db.session.query(
            Product.name,
            func.sum(OrderItem.quantity).label('qty_sold'),
            func.sum(OrderItem.quantity * OrderItem.price_at_time).label('revenue')
        )
        .join(OrderItem, Product.id == OrderItem.product_id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(Order.order_date >= start_dt, Order.order_date <= end_dt, Order.status == 'completed', OrderItem.status == 'active')
    )
    if selected_branch:
        top_q = top_q.filter(Order.branch_id == selected_branch)
    top_products_raw = top_q.group_by(Product.name).order_by(func.sum(OrderItem.quantity).desc()).limit(20).all()
    top_products = [{'name': r[0], 'qty_sold': r[1], 'revenue': float(r[2])} for r in top_products_raw]

    # ---- Low Stock Warnings ----
    low_q = BranchStock.query.join(Product).filter(BranchStock.quantity <= Product.low_stock_threshold)
    if selected_branch:
        low_q = low_q.filter(BranchStock.branch_id == selected_branch)
    low_stock_items = low_q.all()

    # ---- Stock Adjustments ----
    adj_q = StockAuditLog.query.filter(StockAuditLog.timestamp >= start_dt, StockAuditLog.timestamp <= end_dt)
    if selected_branch:
        adj_q = adj_q.filter(StockAuditLog.branch_id == selected_branch)
    stock_adjustments = adj_q.order_by(StockAuditLog.timestamp.desc()).limit(20).all()

    branches = Branch.query.filter_by(is_active=True).all()

    return render_template('reports/periodic.html',
                           periods=periods,
                           selected_period=selected_period,
                           selected_branch=selected_branch,
                           period_label=periods.get(selected_period, 'Daily'),
                           start_date=start_date,
                           end_date=end_date,
                           total_sales=total_sales,
                           order_count=order_count,
                           void_total=void_total,
                           void_count=void_count,
                           vault_deposits=vault_deposits,
                           vault_deposit_count=vault_deposit_count,
                           loan_total=loan_total,
                           loan_count=loan_count,
                           top_products=top_products,
                           low_stock_items=low_stock_items,
                           stock_adjustments=stock_adjustments,
                           branches=branches)
