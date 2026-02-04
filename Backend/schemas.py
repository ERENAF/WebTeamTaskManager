from marshmallow import Schema, fields, validate, validates, ValidationError
from datetime import datetime
from models import UserRole, ProjectRole, TaskPriority, TaskCategory, TaskStatus, Color

USER_ROLES = [role.value for role in UserRole]
PROJECT_ROLES = [role.value for role in ProjectRole]
TASK_PRIORITIES = [priority.value for priority in TaskPriority]
TASK_CATEGORIES = [category.value for category in TaskCategory]
TASK_STATUSES = [status.value for status in TaskStatus]
COLORS = [color.value for color in Color]

def validate_deadline_not_past(value):
    if value == None:
        raise ValidationError('Отсутствует дедлайн!')
    if value < datetime.now():
        raise ValidationError('Дедлайн не может быть в прошлом!')
    return value

class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    username = fields.Str(required=True, validate=validate.Length(min=3, max=64))
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=6, max=256))
    role = fields.Str(required=True, validate=validate.OneOf(USER_ROLES))
    confirm_password = fields.Str(load_only=True, required=False)

class ProjectSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str(allow_none=True)
    color = fields.Str(allow_none=True)
    owner = fields.Int(allow_none=True)
    creation_date = fields.DateTime(dump_only=True)

class TaskSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(max=128))
    description = fields.Str(allow_none=True)
    priority = fields.Str(validate=validate.OneOf(TASK_PRIORITIES))
    category = fields.Str(validate=validate.OneOf(TASK_CATEGORIES))
    status = fields.Str(validate=validate.OneOf(TASK_STATUSES))
    creation_date = fields.DateTime(dump_only=True)
    deadline_date = fields.DateTime(allow_none=True)
    project_id = fields.Int(required=True)
    parent_id = fields.Int(allow_none=True)
    assignee_ids = fields.List(fields.Int(), load_only=True, required=False)

class CommentSchema(Schema):
    id = fields.Int(dump_only=True)
    text_comment = fields.Str(required=True, validate=validate.Length(min=1))
    creation_date = fields.DateTime(dump_only=True)
    task_id = fields.Int(required=True)
    author_id = fields.Int(dump_only=True)

class ProjectMemberSchema(Schema):
    user_id = fields.Int(required=True)
    role = fields.Str(required=True, validate=validate.OneOf(PROJECT_ROLES))

class TaskAssigneeSchema(Schema):
    user_ids = fields.List(fields.Int(), required=True)

class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class RegistrationSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=64))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6, max=256))
    confirm_password = fields.Str(required=True)
    role = fields.Str(required=True, validate=validate.OneOf(USER_ROLES))

    @validates('confirm_password')
    def validate_passwords(self, value, **kwargs):
        data = kwargs.get('data', {})
        if 'password' in data and value != data['password']:
            raise ValidationError('Пароли не совпадают')

class TaskFilterSchema(Schema):
    project_id = fields.Int(allow_none=True)
    priority = fields.Str(allow_none=True, validate=validate.OneOf(TASK_PRIORITIES))
    category = fields.Str(allow_none=True, validate=validate.OneOf(TASK_CATEGORIES))
    status = fields.Str(allow_none=True, validate=validate.OneOf(TASK_STATUSES))
    assignee_id = fields.Int(allow_none=True)
    search = fields.Str(allow_none=True)


user_schema = UserSchema()
users_schema = UserSchema(many=True)
project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)
task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)
comment_schema = CommentSchema()
comments_schema = CommentSchema(many=True)
login_schema = LoginSchema()
registration_schema = RegistrationSchema()
project_member_schema = ProjectMemberSchema()
task_assignee_schema = TaskAssigneeSchema()
task_filter_schema = TaskFilterSchema()
