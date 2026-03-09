"""
FILE: app/__init__.py
PURPOSE: Flask application factory and blueprint registration.
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect
from config import Config

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()
csrf = CSRFProtect()

login_manager.login_view = 'auth.login'
login_manager.login_message_category = 'info'


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.pos import pos_bp
    from app.routes.branches import branches_bp
    from app.routes.reports import reports_bp
    from app.routes.loans import loans_bp
    from app.routes.users import users_bp
    from app.routes.inventory import inventory_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(pos_bp)
    app.register_blueprint(branches_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(loans_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(inventory_bp)

    @app.context_processor
    def inject_global_vars():
        return dict(currency_symbol=app.config.get('CURRENCY_SYMBOL', '₱'))

    @app.template_filter('currency')
    def format_currency(value):
        symbol = app.config.get('CURRENCY_SYMBOL', '₱')
        try:
            return f"{symbol}{float(value):,.2f}"
        except (ValueError, TypeError):
            return f"{symbol}0.00"

    # Create tables on first request context
    with app.app_context():
        from app import models  # noqa: F401
        db.create_all()

    return app
