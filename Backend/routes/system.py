from flask import Blueprint, jsonify
from models import db, User, Project, Task, Comment
from models import UserRole, ProjectRole, TaskPriority, TaskCategory, TaskStatus, Color
from datetime import datetime
import random

system_bp = Blueprint('system', __name__)

@system_bp.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "service": "Task Manager API"
    }), 200

@system_bp.route('/enums', methods=['GET'])
def get_enums():
    return jsonify({
        "user_roles": [{"value": r.value, "label": r.value.capitalize()} for r in UserRole],
        "project_roles": [{"value": r.value, "label": r.value} for r in ProjectRole],
        "task_priorities": [{"value": p.value, "label": p.value} for p in TaskPriority],
        "task_categories": [{"value": c.value, "label": c.value} for c in TaskCategory],
        "task_statuses": [{"value": s.value, "label": s.value} for s in TaskStatus],
        "colors": [{"value": c.value, "label": c.name.lower()} for c in Color]
    }), 200

@system_bp.route('/init-db', methods=['POST'])
def init_db():
    try:
        db.drop_all()
        db.create_all()

        users = [
            User(username='admin', email='admin@example.com', role=UserRole.ADMIN.value),
            User(username='user1', email='user1@example.com', role=UserRole.CLIENT.value),
            User(username='user2', email='user2@example.com', role=UserRole.CLIENT.value),
        ]

        for user in users:
            user.set_password('password123')
            db.session.add(user)

        db.session.commit()

        projects = [
            Project(name='Проект1', description='ОписаниеПроекта1',
                   color=Color.BLUE.value, owner=1),
            Project(name='Проект2', description='ОписаниеПроекта2',
                   color=Color.GREEN.value, owner=2),
            Project(name='Проект3', description='ОписаниеПроекта3',
                   color=Color.ORANGE.value, owner=1),
        ]

        for project in projects:
            db.session.add(project)

        db.session.commit()


        tasks_data = [

            {'title': 'Задание1', 'desc': 'ОписаниеЗадание1',
             'priority': 'High', 'category': 'Feature', 'status': 'Done', 'project_id': 1, 'assignees': [1, 2]},
            {'title': 'Задание2', 'desc': 'ОписаниеЗадание2',
             'priority': 'High', 'category': 'Feature', 'status': 'Done', 'project_id': 1, 'assignees': [1]},
            {'title': 'Задание3', 'desc': 'ОписаниеЗадание3',
             'priority': 'Critical', 'category': 'Bug', 'status': 'InProgress', 'project_id': 1, 'assignees': [2]},
            {'title': 'Задание4', 'desc': 'ОписаниеЗадание4',
             'priority': 'Medium', 'category': 'Improvement', 'status': 'ToDo', 'project_id': 1, 'assignees': [3]},


            {'title': 'Задание5', 'desc': 'ОписаниеЗадание5',
             'priority': 'Medium', 'category': 'Feature', 'status': 'InProgress', 'project_id': 2, 'assignees': [2]},
            {'title': 'Задание6', 'desc': 'ОписаниеЗадание6',
             'priority': 'Low', 'category': 'Documentation', 'status': 'Done', 'project_id': 2, 'assignees': [1]},

            {'title': 'Задание7', 'desc': 'ОписаниеЗадание7',
             'priority': 'Low', 'category': 'Documentation', 'status': 'ToDo', 'project_id': 3, 'assignees': [1, 3]},
        ]

        for task_data in tasks_data:
            task = Task(
                title=task_data['title'],
                description=task_data['desc'],
                priority=task_data['priority'],
                category=task_data['category'],
                status=task_data['status'],
                project_id=task_data['project_id'],
                creation_date=datetime.now(),
                deadline_date=datetime.now().replace(day=datetime.now().day + random.randint(5, 30))
            )
            db.session.add(task)
            db.session.flush()

            for user_id in task_data['assignees']:
                user = User.query.get(user_id)
                if user:
                    task.assignees.append(user)

        db.session.commit()

        comments = [
            {'text': 'Коммент1', 'task_id': 1, 'author_id': 1},
            {'text': 'Коммент2', 'task_id': 1, 'author_id': 2},
            {'text': 'Коммент3', 'task_id': 2, 'author_id': 3},
            {'text': 'Коммент4', 'task_id': 3, 'author_id': 1},
        ]

        for comment_data in comments:
            comment = Comment(
                text_comment=comment_data['text'],
                task_id=comment_data['task_id'],
                author_id=comment_data['author_id'],
                creation_date=datetime.now()
            )
            db.session.add(comment)

        db.session.commit()

        return jsonify({
            "message": "База данных инициализирована",
            "users": len(users),
            "projects": len(projects),
            "tasks": len(tasks_data),
            "comments": len(comments)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
