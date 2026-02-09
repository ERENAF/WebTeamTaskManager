import os
from datetime import timedelta

class Config:
    # Определяем режим
    FLASK_ENV = os.getenv('FLASK_ENV', 'production')
    
    # Путь к базе данных
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    INSTANCE_PATH = os.getenv('INSTANCE_PATH', os.path.join(BASE_DIR, 'instance'))
    
    # Создаем папку instance если ее нет
    if not os.path.exists(INSTANCE_PATH):
        os.makedirs(INSTANCE_PATH)
    
    # URL базы данных
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 
        f'sqlite:///{os.path.join(INSTANCE_PATH, "prod.db")}')
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    WTF_CSRF_ENABLED = False

    # JWT конфигурация
    JWT_SECRET_KEY = os.getenv('SECRET_KEY', 'your-super-secret-jwt-key-123')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    JWT_IDENTITY_CLAIM = 'sub'
    JWT_ALGORITHM = 'HS256'
    
    # Путь к статике фронтенда
    STATIC_FOLDER = os.getenv('STATIC_FOLDER', '/app/static')