from flask import Blueprint, jsonify
from models import User
from schemas import users_schema, user_schema

users_bp = Blueprint('users', __name__)

@users_bp.route('', methods=['GET'])
def get_users():
    users = User.query.all()
    return users_schema.dump(users), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404

    return user_schema.dump(user), 200
