from flask import Blueprint, request, jsonify
from models import db, User
from schemas import registration_schema, login_schema, user_schema

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        validated_data = registration_schema.load(data)

        existing_user = User.query.filter_by(email=validated_data['email']).first()
        if existing_user:
            return jsonify({"error": "Email уже используется"}), 409

        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            role=validated_data['role']
        )
        user.set_password(validated_data['password'])

        db.session.add(user)
        db.session.commit()

        return user_schema.dump(user), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        validated_data = login_schema.load(data)

        user = User.query.filter_by(email=validated_data['email']).first()

        if not user or not user.check_password(validated_data['password']):
            return jsonify({"error": "Неверный email или пароль"}), 401

        return user_schema.dump(user), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400
