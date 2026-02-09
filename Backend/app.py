from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db
from config import Config
from routes.auth import auth_bp
from routes.users import users_bp
from routes.projects import projects_bp
from routes.tasks import tasks_bp
from routes.comments import comments_bp
from routes.system import system_bp
import os

app = Flask(__name__, static_folder=None)  # Отключаем стандартную статику
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": "*"}})

db.init_app(app)
jwt = JWTManager(app)

app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(projects_bp, url_prefix='/api/projects')
app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
app.register_blueprint(comments_bp, url_prefix='/api')
app.register_blueprint(system_bp, url_prefix='/api')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    static_folder = app.config.get('STATIC_FOLDER', '/app/static')
    
    if path == '' or not os.path.exists(os.path.join(static_folder, path)):
        return send_from_directory(static_folder, 'index.html')
    
    return send_from_directory(static_folder, path)

if __name__ == '__main__':
    with app.app_context():
        instance_path = os.path.join(os.path.dirname(__file__), 'instance')
        if not os.path.exists(instance_path):
            os.makedirs(instance_path)
        
        db.create_all()
    
    debug = app.config.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=5000, debug=debug)