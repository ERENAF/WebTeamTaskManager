from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, PasswordField, SelectField, SubmitField, DateTimeField, IntegerField
from wtforms.validators import DataRequired, Email, Length, EqualTo, ValidationError
from datetime import datetime
from models import ProjectRole, TaskPriority, TaskCategory, TaskStatus, Color

def validate_deadline(form, field):
    if field.data and field.data < datetime.now():
        raise ValidationError('Дедлайн не может быть в прошлом')

class RegistrationForm(FlaskForm):
    username = StringField('Имя пользователя', validators=[
        DataRequired(),
        Length(min=3, max=64, message='Имя пользователя должно быть от 3 до 64 символов')
    ])
    email = StringField('Email', validators=[DataRequired(), Email(message='Некорректный email')])
    password = PasswordField('Пароль', validators=[
        DataRequired(),
        Length(min=6, max=256, message="Пароль от 6 до 256 символов")
    ])
    confirm_password = PasswordField('Подтвердите пароль', validators=[
        DataRequired(),
        EqualTo('password', message='Пароли не совпадают')
    ])
    submit = SubmitField('Зарегистрироваться')

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email(message='Некорректный email')])
    password = PasswordField('Пароль', validators=[DataRequired()])
    submit = SubmitField('Войти')

class ProjectForm(FlaskForm):
    name = StringField('Название проекта', validators=[
        DataRequired(),
        Length(max=128, message='Название не должно превышать 128 символов')
    ])
    description = TextAreaField('Описание')
    color = SelectField('Цвет', choices=[
        (Color.BLACK.value, 'Черный'),
        (Color.RED.value, 'Красный'),
        (Color.ORANGE.value, 'Оранжевый'),
        (Color.YELLOW.value, 'Желтый'),
        (Color.GREEN.value, 'Зеленый'),
        (Color.CIAN.value, 'Голубой'),
        (Color.BLUE.value, 'Синий'),
        (Color.VIOLET.value, 'Фиолетовый'),
        (Color.WHITE.value, 'Белый')
    ], default=Color.WHITE.value)
    submit = SubmitField('Создать проект')

class ProjectMemberFrom(FlaskForm):
    user_id = IntegerField('ID пользователя', validators=[DataRequired()])
    role = SelectField('Роль в проекте', choices=[
        (ProjectRole.OWNER.value, 'Владелец'),
        (ProjectRole.EDITOR.value, 'Редактор'),
        (ProjectRole.VIEWER.value, 'Наблюдатель')
    ], default=ProjectRole.VIEWER.value)
    submit = SubmitField('Установить роль')

class TaskForm(FlaskForm):
    title = StringField('Название задачи', validators=[
        DataRequired(),
        Length(max=128, message='Название не должно превышать 128 символов')
    ])
    description = TextAreaField('Описание')
    priority = SelectField('Приоритет', choices=[
        (TaskPriority.NONE.value, 'Без приоритета'),
        (TaskPriority.LOW.value, 'Низкий'),
        (TaskPriority.MEDIUM.value, 'Средний'),
        (TaskPriority.HIGH.value, 'Высокий'),
        (TaskPriority.CRITICAL.value, 'Критический')
    ], default=TaskPriority.NONE.value)
    category = SelectField('Категория', choices=[
        (TaskCategory.NONE.value, 'Без категории'),
        (TaskCategory.BUG.value, 'Ошибка'),
        (TaskCategory.FEATURE.value, 'Функция'),
        (TaskCategory.IMPROVEMENT.value, 'Улучшение'),
        (TaskCategory.DOCUMENTATION.value, 'Документация')
    ], default=TaskCategory.NONE.value)
    status = SelectField('Статус', choices=[
        (TaskStatus.NONE.value, 'Не задан'),
        (TaskStatus.TODO.value, 'К выполнению'),
        (TaskStatus.INPROGRESS.value, 'В работе'),
        (TaskStatus.REVIEW.value, 'На проверке'),
        (TaskStatus.DONE.value, 'Выполнено')
    ], default=TaskStatus.NONE.value)
    deadline_date = DateTimeField('Дедлайн', format='%Y-%m-%d %H:%M', validators=[validate_deadline])
    project_id = IntegerField('ID проекта', validators=[DataRequired()])
    parent_id = IntegerField('ID родительской задачи')
    submit = SubmitField("Добавить задачу")

class TaskFilterForm(FlaskForm):
    project_id = IntegerField('Проект')
    priority = SelectField('Приоритет', choices=[
        ('', 'Все'),
        (TaskPriority.NONE.value, 'Без приоритета'),
        (TaskPriority.LOW.value, 'Низкий'),
        (TaskPriority.MEDIUM.value, 'Средний'),
        (TaskPriority.HIGH.value, 'Высокий'),
        (TaskPriority.CRITICAL.value, 'Критический')
    ])
    category = SelectField('Категория', choices=[
        ('', 'Все'),
        (TaskCategory.NONE.value, 'Без категории'),
        (TaskCategory.BUG.value, 'Ошибка'),
        (TaskCategory.FEATURE.value, 'Функция'),
        (TaskCategory.IMPROVEMENT.value, 'Улучшение'),
        (TaskCategory.DOCUMENTATION.value, 'Документация')
    ])
    status = SelectField('Статус', choices=[
        ('', 'Все'),
        (TaskStatus.NONE.value, 'Не задан'),
        (TaskStatus.TODO.value, 'К выполнению'),
        (TaskStatus.INPROGRESS.value, 'В работе'),
        (TaskStatus.REVIEW.value, 'На проверке'),
        (TaskStatus.DONE.value, 'Выполнено')
    ])
    assignee_id = IntegerField('Исполнитель')
    search = StringField('Поиск')
    submit = SubmitField('Поиск')

class CommentForm(FlaskForm):
    text_comment = TextAreaField('Комментарий', validators=[
        DataRequired(),
        Length(min=1, message='Комментарий не может быть пустым')
    ])
    task_id = IntegerField('ID задачи', validators=[DataRequired()])
    submit = SubmitField("Оставить комментарий")
