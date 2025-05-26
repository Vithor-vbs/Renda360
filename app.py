import time
from flask import Flask, jsonify, request
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import os
from dotenv import load_dotenv
from models import db, User
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
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600
jwt = JWTManager(app)

# Routes


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email already exists"}), 400

    new_user = User(
        username=data['username'],
        email=data['email'],
        password=generate_password_hash(data['password'])
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "User created"}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if user and check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=user.username)
        refresh_token = create_refresh_token(identity=user.username)
        return jsonify({
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 200

    return jsonify({"msg": "Invalid credentials"}), 401


@app.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    new_token = create_access_token(identity=current_user)
    return jsonify({"access_token": new_token}), 200


@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200


if __name__ == '__main__':
    app.run(debug=True)
