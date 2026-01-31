from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from enum import Enum

class UserRole(Enum):
    ADMIN = "admin"
    CLIENT = "client"

class ProjectRole(Enum):
    OWNER = "Owner"
    EDITOR = "EDITOR"
    VIEWER = "Viewer"

class TaskPriority(Enum):
    NONE = "None"
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class TaskCategory(Enum):
    NONE = "None"
    BUG = "Bug"
    FEATURE = "Feature"
    IMPROVEMENT = "Improvement"
    DOCUMENTATION = "Documentation"

class TaskStatus(Enum):
    NONE = "None"
    TODO = "ToDo"
    INPROGRESS = "InProgress"
    REVIEW = "Review"
    DONE = "Done"

class Color(Enum):
    BLACK = "#000000"
    RED = "#FF0000"
    ORANGE = "#FFA500"
    YELLOW = "#FFFF00"
    GREEN = "#00FF00"
    CIAN = "#00FFFF"
    BLUE = "#0000FF"
    VIOLET = "#800080"
    WHITE = "#FFFFFF"

db = SQLAlchemy()

task_assigneess = db.Table('task_assignees',
    db.Column('task_id', db.Integer, db.ForeignKey('task.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True)
)

project_members = db.Table('project_users',
    db.Column('project_id', db.Integer, db.ForeignKey('project.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('role', db.String(32), nullable=False, default=ProjectRole.VIEWER.value)
)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(128), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default=UserRole.CLIENT.value)

    comments = db.relationship('Comment', backref='author', lazy=True)
    tasks = db.relationship('Task', secondary=task_assigneess, backref=db.backref('assignees', lazy=True))
    projects = db.relationship('Project', secondary=project_members, backref=db.backref('members', lazy=True))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text)
    color = db.Column(db.String(7), default=Color.WHITE.value)
    owner = db.Column(db.Integer, db.ForeignKey('user.id'))
    creation_date = db.Column(db.DateTime, default=datetime.utcnow)

    tasks = db.relationship('Task', backref='project', lazy=True, cascade='all, delete-orphan')

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(db.String(32), nullable=False, default=TaskPriority.NONE.value)
    category = db.Column(db.String(32), nullable=False, default=TaskCategory.NONE.value)
    status = db.Column(db.String(32), nullable=False, default=TaskStatus.NONE.value)
    creation_date = db.Column(db.DateTime, default=datetime.utcnow)
    deadline_date = db.Column(db.DateTime)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('task.id'))

    subtasks = db.relationship('Task', backref=db.backref('parent', remote_side=[id]), lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='task', lazy=True, cascade='all, delete-orphan')

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text_comment = db.Column(db.Text, nullable=False)
    creation_date = db.Column(db.DateTime, default=datetime.utcnow)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
