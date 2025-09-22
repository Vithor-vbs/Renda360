import os.path
from datetime import timedelta
from .routes.auth import auth_bp
from .routes.user import user_bp
from .routes.julius import julius_bp
from .routes.statements import statements_bp
from .models import db

from flask import Flask, request, make_response
from flask_jwt_extended import (
    JWTManager
)
from flask_cors import CORS
import os
from dotenv import load_dotenv
from flask_migrate import Migrate

load_dotenv()

app = Flask(__name__)

# CORS configuration - more explicit setup
CORS(app,
     resources={
         r"/*": {
             "origins": [os.getenv('CLIENT_ORIGIN', 'http://localhost:5173')],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Authorization", "Content-Type", "Accept"],
             "expose_headers": ["Authorization"],
             "supports_credentials": True,
             "max_age": 600
         }
     })

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
# Use the migrations directory inside flask_app
migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
migrate = Migrate(app, db, directory=migrations_dir)


# JWT configuration
app.config["JWT_SECRET_KEY"] = os.getenv('JWT_SECRET_KEY')
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)
jwt = JWTManager(app)

# Handle preflight OPTIONS requests


@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin",
                             os.getenv('CLIENT_ORIGIN', 'http://localhost:5173'))
        response.headers.add('Access-Control-Allow-Headers',
                             "Authorization,Content-Type,Accept")
        response.headers.add('Access-Control-Allow-Methods',
                             "GET,PUT,POST,DELETE,OPTIONS")
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response


# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(user_bp, url_prefix='/users')
app.register_blueprint(statements_bp)
app.register_blueprint(julius_bp, url_prefix='/julius')

if __name__ == '__main__':
    app.run(debug=True)
