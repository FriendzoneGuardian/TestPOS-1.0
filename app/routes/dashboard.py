from flask import Blueprint, render_template, jsonify
from flask_login import login_required, current_user
from app.models import Order, OrderItem, Customer, Product, Branch
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

    return render_template('dashboard/index.html',
                           daily_sales=daily_sales,
                           total_orders=total_orders,
                           void_count=void_count,
                           active_loans=active_loans,
                           top_products=top_products,
                           recent_orders=recent_orders,
                           branches=branches)


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
