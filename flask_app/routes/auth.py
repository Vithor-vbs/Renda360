from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, User, Card

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
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

    # ATTENTION - Creating defult card for the new user, because we don't have API to get card info :P
    # --> Maybe implement a card API later to add more than one card per user
    default_card = Card(
        user_id=new_user.id,
        number="0000 0000 0000 1515",
        expiration_date="12/30",
        card_type="credito",
        available_limit=0.0,
        used_limit=0.0,
        brand="Mastercard",
        name="CARTÃO DA NACLARA",
    )
    db.session.add(default_card)
    db.session.commit()
    print(f"Default card created with id: {default_card.id}")

    return jsonify({"msg": "User created"}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if user and check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        return jsonify({
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 200

    return jsonify({"msg": "Invalid credentials"}), 401


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_token = create_access_token(identity=str(current_user_id))
    return jsonify({"access_token": new_token}), 200


@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()
    return jsonify(logged_user_id=current_user_id), 200
