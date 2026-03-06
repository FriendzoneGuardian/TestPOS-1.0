from flask import Blueprint, render_template, request, Response
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
