import logging
import os
from flask import Flask
from dotenv import load_dotenv

load_dotenv()


def create_app():
    app = Flask(__name__)

    # Configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY') or 'dev_key',
        SQLALCHEMY_DATABASE_URI=os.environ.get(
            'DATABASE_URL') or 'sqlite:///app.db',
        SQLALCHEMY_TRACK_MODIFICATIONS=False
    )

    # Initialize extensions
    from .models import db
    db.init_app(app)

    # Create vectorstore directory
    os.makedirs("vectorstores", exist_ok=True)

    # Register blueprints
    from .routes.statements import statements_bp
    from .routes.julius import julius_bp

    app.register_blueprint(statements_bp, url_prefix='/api/statements')
    app.register_blueprint(julius_bp, url_prefix='/api/julius')

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    )

    return app
