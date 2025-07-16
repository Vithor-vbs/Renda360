from datetime import timedelta
from .routes.auth import auth_bp
from .routes.user import user_bp
from .routes.julius import julius_bp
from .routes.statements import statements_bp
from .models import db

from flask import Flask
from flask_jwt_extended import (
    JWTManager
)
from flask_cors import CORS
import os
from dotenv import load_dotenv
from flask_migrate import Migrate

load_dotenv()

app = Flask(__name__)
CORS(app,
     supports_credentials=True,
     origins=[os.getenv('CLIENT_ORIGIN')],
     expose_headers=["Authorization"],
     allow_headers=["Authorization", "Content-Type"],
     methods=["GET", "POST", "PUT", "DELETE"]
     )

# Database configuration
app.config['SQLALCHEMY_ECHO'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"postgresql://{os.getenv('POSTGRES_USER')}:"
    f"{os.getenv('POSTGRES_PASSWORD')}@"
    f"localhost:5432/"
    f"{os.getenv('POSTGRES_DB')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate = Migrate(app, db)


# JWT configuration
app.config["JWT_SECRET_KEY"] = os.getenv('JWT_SECRET_KEY')
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)
jwt = JWTManager(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(user_bp, url_prefix='/users')
app.register_blueprint(statements_bp)
app.register_blueprint(julius_bp, url_prefix='/julius')

if __name__ == '__main__':
    app.run(debug=True)
