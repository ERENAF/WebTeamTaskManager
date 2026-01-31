from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Comment, Task, Project
from schemas import comment_schema, comments_schema
from sqlalchemy import text

comments_bp = Blueprint('comments', __name__)

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

def check_task_access(task_id, user_id):
    task = Task.query.get(task_id)
    if not task:
        return None, None  # task, role

    role = get_current_user_role_in_project(task.project_id, user_id)
    if role:
        return task, role

    if any(user.id == user_id for user in task.assignees):
        return task, 'Assignee'

    return None, None

@comments_bp.route('/tasks/<int:task_id>/comments', methods=['GET'])
@jwt_required()
def get_comments(task_id):
    current_user_id = get_jwt_identity()

    task, role = check_task_access(task_id, current_user_id)
    if not task:
        return jsonify({"error": "Нет доступа к этой задаче"}), 403

    comments = Comment.query.filter_by(task_id=task_id).order_by(Comment.creation_date.desc()).all()
    return comments_schema.dump(comments), 200

@comments_bp.route('/tasks/<int:task_id>/comments', methods=['POST'])
@jwt_required()
def create_comment(task_id):
    try:
        current_user_id = get_jwt_identity()

        task, role = check_task_access(task_id, current_user_id)
        if not task:
            return jsonify({"error": "Нет доступа к этой задаче"}), 403

        data = request.get_json()
        data['task_id'] = task_id
        data['author_id'] = current_user_id

        validated_data = comment_schema.load(data)

        comment = Comment(**validated_data)
        db.session.add(comment)
        db.session.commit()

        return comment_schema.dump(comment), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@comments_bp.route('/comments/<int:comment_id>', methods=['PUT'])
@jwt_required()
def update_comment(comment_id):
    try:
        current_user_id = get_jwt_identity()

        comment = Comment.query.get(comment_id)
        if not comment:
            return jsonify({"error": "Комментарий не найден"}), 404

        if comment.author_id != current_user_id:
            return jsonify({"error": "Вы не автор этого комментария"}), 403

        data = request.get_json()
        validated_data = comment_schema.load(data, partial=True)

        comment.text_comment = validated_data.get('text_comment', comment.text_comment)

        db.session.commit()
        return comment_schema.dump(comment), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@comments_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    try:
        current_user_id = get_jwt_identity()

        comment = Comment.query.get(comment_id)
        if not comment:
            return jsonify({"error": "Комментарий не найден"}), 404

        task = Task.query.get(comment.task_id)
        if not task:
            return jsonify({"error": "Задача не найдена"}), 404


        can_delete = False

        if comment.author_id == current_user_id:
            can_delete = True

        else:
            role = get_current_user_role_in_project(task.project_id, current_user_id)
            if role in ['Owner', 'EDITOR']:
                can_delete = True

        if not can_delete:
            return jsonify({"error": "Нет прав для удаления комментария"}), 403

        db.session.delete(comment)
        db.session.commit()

        return jsonify({"message": "Комментарий удален"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400
