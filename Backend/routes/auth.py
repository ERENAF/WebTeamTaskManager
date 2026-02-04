from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
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

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return jsonify({
            "message": "Регистрация успешна",
            "user": user_schema.dump(user),
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 201

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

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return jsonify({
            "message": "Вход успешен",
            "user": user_schema.dump(user),
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    try:
        current_user_id = get_jwt_identity()

        user = User.query.get(int(current_user_id))
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 401

        new_access_token = create_access_token(identity=str(user.id))

        return jsonify({
            "message": "Токен обновлен",
            "access_token": new_access_token
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400
