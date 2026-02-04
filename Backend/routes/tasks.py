from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Task, User, Project
from schemas import task_schema, tasks_schema, task_assignee_schema, task_filter_schema
from sqlalchemy import text

tasks_bp = Blueprint('tasks', __name__)

def get_current_user_role_in_project(project_id, user_id):
    project = Project.query.get(project_id)
    if not project:
        return None

    if project.owner == user_id:
        return 'Member'

    stmt = text("""
        SELECT role FROM project_users
        WHERE project_id = :project_id AND user_id = :user_id
    """)
    result = db.session.execute(stmt, {
        'project_id': project_id,
        'user_id': user_id
    }).fetchone()

    return result[0] if result else None

def check_task_access(task_id, user_id):
    task = Task.query.get(task_id)
    if not task:
        return None, None

    role = get_current_user_role_in_project(task.project_id, user_id)
    if role:
        return task, role

    if any(user.id == user_id for user in task.assignees):
        return task, 'Assignee'

    return None, None

@tasks_bp.route('', methods=['GET'])
@jwt_required()
def get_tasks():
    try:
        current_user_id = int(get_jwt_identity())
        filters = task_filter_schema.load(request.args)

        query = Task.query.join(Project).filter(
            (Project.owner == current_user_id) |
            (Project.members.any(id=current_user_id))
        )

        if filters.get('project_id'):
            role = get_current_user_role_in_project(filters['project_id'], current_user_id)
            if not role:
                return jsonify({"error": "Нет доступа к этому проекту"}), 403
            query = query.filter(Task.project_id == filters['project_id'])

        if filters.get('priority'):
            query = query.filter_by(priority=filters['priority'])
        if filters.get('category'):
            query = query.filter_by(category=filters['category'])
        if filters.get('status'):
            query = query.filter_by(status=filters['status'])
        if filters.get('assignee_id'):
            query = query.filter(Task.assignees.any(id=filters['assignee_id']))
        if filters.get('search'):
            search = f"%{filters['search']}%"
            query = query.filter(Task.title.ilike(search) | Task.description.ilike(search))

        tasks = query.all()
        return tasks_schema.dump(tasks), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@tasks_bp.route('', methods=['POST'])
@jwt_required()
def create_task():
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()

        project_id = data.get('project_id')
        if not project_id:
            return jsonify({"error": "Не указан project_id"}), 400

        role = get_current_user_role_in_project(project_id, current_user_id)
        if role != 'Member':
            return jsonify({"error": "Требуются права Member для создания задач"}), 403

        validated_data = task_schema.load(data)

        task_data = {k: v for k, v in validated_data.items() if k != 'assignee_ids'}
        task = Task(**task_data)
        db.session.add(task)
        db.session.flush()

        if 'assignee_ids' in validated_data:
            assignee_ids = validated_data['assignee_ids']

            for user_id in assignee_ids:
                user = User.query.get(user_id)
                if user:
                    task.assignees.append(user)
        db.session.commit()

        return task_schema.dump(task), 201

    except Exception as e:
        db.session.rollback()

        if hasattr(e, 'messages'):
            return jsonify({"error": "Ошибка валидации", "details": e.messages}), 400

        return jsonify({"error": str(e)}), 400

@tasks_bp.route('/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    current_user_id = int(get_jwt_identity())

    task, role = check_task_access(task_id, current_user_id)
    if not task:
        return jsonify({"error": "Нет доступа к этой задаче"}), 403

    return task_schema.dump(task), 200

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    try:
        current_user_id = int(get_jwt_identity())

        task, role = check_task_access(task_id, current_user_id)
        if not task:
            return jsonify({"error": "Нет доступа к этой задаче"}), 403

        if role == 'VIEWER':
            return jsonify({"error": "Наблюдатель не может изменять задачи"}), 403

        data = request.get_json()
        validated_data = task_schema.load(data, partial=True)

        for key, value in validated_data.items():
            if key != 'assignee_ids':
                setattr(task, key, value)

        if 'assignee_ids' in validated_data:
            if role != 'Member':
                return jsonify({"error": "Только Member может менять исполнителей"}), 403


            task.assignees = []

            for user_id in validated_data['assignee_ids']:
                user = User.query.get(user_id)
                if user:
                    task.assignees.append(user)

        db.session.commit()
        return task_schema.dump(task), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    current_user_id = int(get_jwt_identity())

    task, role = check_task_access(task_id, current_user_id)
    if not task:
        return jsonify({"error": "Нет доступа к этой задаче"}), 403

    if role != 'Member':
        return jsonify({"error": "Требуются права Member для удаления задач"}), 403

    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Задача удалена"}), 200

@tasks_bp.route('/<int:task_id>/assignees', methods=['POST'])
@jwt_required()
def assign_task(task_id):
    try:
        current_user_id = int(get_jwt_identity())

        task, role = check_task_access(task_id, current_user_id)
        if not task:
            return jsonify({"error": "Нет доступа к этой задаче"}), 403

        if role != 'Member':
            return jsonify({"error": "Требуются права Member для назначения исполнителей"}), 403

        data = request.get_json()
        validated_data = task_assignee_schema.load(data)

        task.assignees = []
        for user_id in validated_data['user_ids']:
            user = User.query.get(user_id)
            if user:
                task.assignees.append(user)

        db.session.commit()
        return jsonify({"message": "Исполнители назначены"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400
