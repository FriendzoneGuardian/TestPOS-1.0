"""
FILE: app/routes/auth.py
PURPOSE: Handles user authentication, login, logout, password hashing, and theme preferences.
DEPENDENCIES: models.py, constants.py
"""
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from app.models import User

from app.constants import Roles, ShiftStatus, TransactionType
from app import db

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password) and user.is_active:
            login_user(user)
            next_page = request.args.get('next')
            flash('Logged in successfully.', 'success')
            response = redirect(next_page or url_for('dashboard.index'))
            response.set_cookie('theme_preference', user.theme_preference, max_age=31536000)
            return response
        else:
            flash('Invalid username or password.', 'danger')

    return render_template('auth/login.html')


@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('auth.login'))


@auth_bp.route('/settings/theme', methods=['POST'])
@login_required
def settings_theme():
    """Save the user's theme preference."""
    data = request.get_json()
    if not data or 'theme' not in data:
        return jsonify(success=False, message='No theme provided'), 400
        
    theme = data.get('theme')
    if theme not in ['dawn', 'dusk', 'midnight']:
        return jsonify(success=False, message='Invalid theme preference'), 400
        
    current_user.theme_preference = theme
    db.session.commit()
    
    return jsonify(success=True)
