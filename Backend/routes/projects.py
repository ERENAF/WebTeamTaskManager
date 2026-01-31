from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Project, User, project_users
from schemas import project_schema, projects_schema, project_member_schema
from sqlalchemy import text

projects_bp = Blueprint('projects', __name__)

def get_current_user_role_in_project(project_id, user_id):
    project = Project.query.get(project_id)
    if not project:
        return None

    if project.owner == user_id:
        return 'Owner'

    stmt = text("""
        SELECT role FROM project_users
        WHERE project_id = :project_id AND user_id = :user_id
    """)
    result = db.session.execute(stmt, {
        'project_id': project_id,
        'user_id': user_id
    }).fetchone()

    return result[0] if result else None

@projects_bp.route('', methods=['GET'])
@jwt_required()
def get_projects():
    current_user_id = get_jwt_identity()

    user_projects = Project.query.filter(
        (Project.owner == current_user_id) |
        (Project.members.any(id=current_user_id))
    ).all()

    return projects_schema.dump(user_projects), 200

@projects_bp.route('', methods=['POST'])
@jwt_required()
def create_project():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        data['owner'] = current_user_id

        validated_data = project_schema.load(data)
        project = Project(**validated_data)
        db.session.add(project)
        db.session.commit()

        return project_schema.dump(project), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@projects_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    current_user_id = get_jwt_identity()

    role = get_current_user_role_in_project(project_id, current_user_id)
    if not role:
        return jsonify({"error": "Нет доступа к проекту"}), 403

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Проект не найден"}), 404

    return project_schema.dump(project), 200

@projects_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    try:
        current_user_id = get_jwt_identity()

        role = get_current_user_role_in_project(project_id, current_user_id)
        if role not in ['Owner', 'EDITOR']:
            return jsonify({"error": "Требуются права Owner или EDITOR"}), 403

        project = Project.query.get(project_id)
        if not project:
            return jsonify({"error": "Проект не найден"}), 404

        data = request.get_json()
        validated_data = project_schema.load(data, partial=True)

        for key, value in validated_data.items():
            setattr(project, key, value)

        db.session.commit()
        return project_schema.dump(project), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    current_user_id = get_jwt_identity()

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Проект не найден"}), 404

    if project.owner != current_user_id:
        return jsonify({"error": "Только владелец может удалить проект"}), 403

    db.session.delete(project)
    db.session.commit()

    return jsonify({"message": "Проект удален"}), 200

@projects_bp.route('/<int:project_id>/members', methods=['GET'])
@jwt_required()
def get_project_members(project_id):
    current_user_id = get_jwt_identity()

    role = get_current_user_role_in_project(project_id, current_user_id)
    if not role:
        return jsonify({"error": "Нет доступа к проекту"}), 403

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Проект не найден"}), 404

    stmt = text("""
        SELECT u.id, u.username, u.email, u.role as user_role, pu.role as project_role
        FROM project_users pu
        JOIN "user" u ON pu.user_id = u.id
        WHERE pu.project_id = :project_id
    """)
    results = db.session.execute(stmt, {'project_id': project_id}).fetchall()

    members = []
    for row in results:
        members.append({
            'id': row[0],
            'username': row[1],
            'email': row[2],
            'user_role': row[3],
            'project_role': row[4]
        })

    if project.owner:
        owner = User.query.get(project.owner)
        if owner and not any(m['id'] == owner.id for m in members):
            members.append({
                'id': owner.id,
                'username': owner.username,
                'email': owner.email,
                'user_role': owner.role,
                'project_role': 'Owner'
            })

    return jsonify(members), 200

@projects_bp.route('/<int:project_id>/members', methods=['POST'])
@jwt_required()
def add_project_member(project_id):
    try:
        current_user_id = get_jwt_identity()

        role = get_current_user_role_in_project(project_id, current_user_id)
        if role not in ['Owner', 'EDITOR']:
            return jsonify({"error": "Требуются права Owner или EDITOR"}), 403

        project = Project.query.get(project_id)
        if not project:
            return jsonify({"error": "Проект не найден"}), 404

        data = request.get_json()
        validated_data = project_member_schema.load(data)

        user = User.query.get(validated_data['user_id'])
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        stmt = text("""
            SELECT 1 FROM project_users
            WHERE project_id = :project_id AND user_id = :user_id
        """)
        existing = db.session.execute(stmt, {
            'project_id': project_id,
            'user_id': validated_data['user_id']
        }).fetchone()

        if existing:
            return jsonify({"error": "Пользователь уже участник проекта"}), 409

        stmt = text("""
            INSERT INTO project_users (project_id, user_id, role)
            VALUES (:project_id, :user_id, :role)
        """)
        db.session.execute(stmt, {
            'project_id': project_id,
            'user_id': validated_data['user_id'],
            'role': validated_data['role']
        })

        db.session.commit()
        return jsonify({"message": "Участник добавлен"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@projects_bp.route('/<int:project_id>/members/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_project_member(project_id, user_id):
    try:
        current_user_id = get_jwt_identity()

        role = get_current_user_role_in_project(project_id, current_user_id)
        if role not in ['Owner', 'EDITOR']:
            return jsonify({"error": "Требуются права Owner или EDITOR"}), 403

        project = Project.query.get(project_id)
        if not project:
            return jsonify({"error": "Проект не найден"}), 404

        if project.owner == user_id:
            return jsonify({"error": "Нельзя удалить владельца проекта"}), 403

        if user_id == current_user_id and role != 'Owner':
            return jsonify({"error": "Вы не можете удалить сами себя"}), 403

        stmt = text("""
            DELETE FROM project_users
            WHERE project_id = :project_id AND user_id = :user_id
        """)
        result = db.session.execute(stmt, {
            'project_id': project_id,
            'user_id': user_id
        })

        db.session.commit()

        if result.rowcount == 0:
            return jsonify({"error": "Пользователь не найден в проекте"}), 404

        return jsonify({"message": "Участник удален из проекта"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400
