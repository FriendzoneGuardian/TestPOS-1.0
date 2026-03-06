from flask import Blueprint, render_template, request, flash, redirect, url_for, abort
from flask_login import login_required, current_user
from app.models import User, Branch
from app import db
from functools import wraps

users_bp = Blueprint('users', __name__, url_prefix='/users')

# ---------------------------------------------------------------------------
# Decorator for Role-Based Access Control
# ---------------------------------------------------------------------------
def roles_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated or current_user.role not in roles:
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ---------------------------------------------------------------------------
# Dashboard: View Users
# ---------------------------------------------------------------------------
@users_bp.route('/')
@login_required
@roles_required('admin', 'manager', 'accounting')
def index():
    # Admin and Accounting see all users. Managers see only users in their branch
    if current_user.role in ['admin', 'accounting']:
        users = User.query.all()
    else:
        users = User.query.filter_by(branch_id=current_user.branch_id).all()
        
    branches = Branch.query.filter_by(is_active=True).all()
    return render_template('users/index.html', users=users, branches=branches)

# ---------------------------------------------------------------------------
# API: Create User
# ---------------------------------------------------------------------------
@users_bp.route('/create', methods=['POST'])
@login_required
@roles_required('admin', 'manager')
def create():
    username = request.form.get('username')
    password = request.form.get('password')
    role = request.form.get('role')
    branch_id = request.form.get('branch_id')

    if not username or not password or not role:
        flash('Missing required fields.', 'error')
        return redirect(url_for('users.index'))

    # Security: Managers can only create Cashiers for their own branch
    if current_user.role == 'manager':
        if role != 'cashier':
            flash('Managers can only create cashier accounts.', 'error')
            return redirect(url_for('users.index'))
        branch_id = current_user.branch_id
        
    # Check if username already exists
    existing = User.query.filter_by(username=username).first()
    if existing:
        flash('Username already exists.', 'error')
        return redirect(url_for('users.index'))
        
    # Cast branch_id appropriately or handle None
    if branch_id and str(branch_id).isdigit():
        branch_id = int(branch_id)
    else:
        branch_id = None
        
    new_user = User(
        username=username,
        role=role,
        branch_id=branch_id
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    
    flash(f"User '{username}' created successfully.", 'success')
    return redirect(url_for('users.index'))

# ---------------------------------------------------------------------------
# API: Update User
# ---------------------------------------------------------------------------
@users_bp.route('/<int:id>/update', methods=['POST'])
@login_required
@roles_required('admin', 'manager')
def update(id):
    user = User.query.get_or_404(id)
    
    # Security: Managers can only update cashiers in their own branch
    if current_user.role == 'manager':
        if user.role != 'cashier' or user.branch_id != current_user.branch_id:
            abort(403)
            
    username = request.form.get('username')
    role = request.form.get('role')
    branch_id = request.form.get('branch_id')
    password = request.form.get('password')
    
    if username:
        # Check collision only if changing username
        if username != user.username and User.query.filter_by(username=username).first():
            flash('Username already exists.', 'error')
            return redirect(url_for('users.index'))
        user.username = username
        
    # Only Admin can alter role and branch_id
    if current_user.role == 'admin':
        if role:
            user.role = role
        if branch_id and str(branch_id).isdigit():
            user.branch_id = int(branch_id)
        elif branch_id == '':
            user.branch_id = None
            
    if password:
        user.set_password(password)
        
    db.session.commit()
    flash(f"User '{user.username}' updated successfully.", 'success')
    return redirect(url_for('users.index'))

# ---------------------------------------------------------------------------
# API: Toggle Status (Disable/Enable Soft-Delete)
# ---------------------------------------------------------------------------
@users_bp.route('/<int:id>/toggle-status', methods=['POST'])
@login_required
@roles_required('admin', 'manager')
def toggle_status(id):
    user = User.query.get_or_404(id)
    
    if user.id == current_user.id:
        flash("You cannot disable your own account.", "error")
        return redirect(url_for('users.index'))
        
    # Security: Managers can only disable cashiers in their own branch
    if current_user.role == 'manager':
        if user.role != 'cashier' or user.branch_id != current_user.branch_id:
            abort(403)
            
    user.is_active = not user.is_active
    db.session.commit()
    
    status_text = "enabled" if user.is_active else "disabled"
    flash(f"User '{user.username}' has been {status_text}.", 'success')
    return redirect(url_for('users.index'))
