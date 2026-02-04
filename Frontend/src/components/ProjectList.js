import React, { useState, useEffect } from 'react';
import { projectAPI } from '../services/api';
import '../styles/projectlist.css';

function ProjectList({ user, onSelectProject }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');

    useEffect(() => {
        fetchProjects();
    }, [user]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await projectAPI.get_projects();
            setProjects(response.data || []);

        } catch (err) {
            let errorMessage = 'Не удалось загрузить проекты';

            if (err.response) {
                switch (err.response.status) {
                    case 401:
                        errorMessage = 'Ошибка авторизации';
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        break;
                    case 403:
                        errorMessage = 'Доступ запрещен';
                        break;
                    case 422:
                        errorMessage = 'Ошибка валидации данных';
                        break;
                    default:
                        errorMessage = err.response.data?.error || `Ошибка сервера: ${err.response.status}`;
                }
            } else if (err.request) {
                errorMessage = 'Нет ответа от сервера';
            }

            setError(errorMessage);

            if (err.response?.status === 401) {
                setTimeout(() => {
                    if (window.confirm('Сессия истекла. Хотите войти заново?')) {
                        localStorage.clear();
                        window.location.reload();
                    }
                }, 1000);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();

        if (!projectName.trim()) {
            alert('Введите название проекта');
            return;
        }

        try {
            const projectData = {
                name: projectName,
                description: projectDescription,
                color: '#3498db'
            };

            const response = await projectAPI.create_project(projectData);
            setProjects(prev => [response.data, ...prev]);
            setShowCreateModal(false);
            setProjectName('');
            setProjectDescription('');

            alert('Проект успешно создан!');

        } catch (err) {
            let errorMessage = err.response?.data?.error || 'Ошибка создания проекта';

            if (err.response?.data?.details) {
                const details = err.response.data.details;
                if (typeof details === 'object') {
                    errorMessage += '\n' + Object.entries(details)
                        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
                        .join('\n');
                } else {
                    errorMessage += '\n' + details;
                }
            }

            alert(errorMessage);
        }
    };

    const handleDeleteProject = async (projectId, projectName) => {
        if (!window.confirm(`Удалить проект "${projectName}"?`)) {
            return;
        }

        try {
            await projectAPI.delete_project(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
            alert('Проект удален');

        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Не удалось удалить проект';
            alert(errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="project-list-container">
                <div className="loading-screen">
                    <div className="loading-spinner"></div>
                    <p>Загрузка проектов...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="project-list-container">
            <div className="list-header">
                <h1>Мои проекты</h1>
                <div className="user-info">
                    <span className="username">{user?.username}</span>
                    <span className="user-role">({user?.role})</span>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn create-btn"
                >
                    + Новый проект
                </button>
            </div>

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <button
                        onClick={fetchProjects}
                        className="btn retry-btn"
                    >
                        Повторить попытку
                    </button>
                </div>
            )}

            <div className="projects-list">
                {projects.length === 0 ? (
                    <div className="no-projects">
                        {error ? (
                            <div className="error-state">
                                <p>Не удалось загрузить проекты</p>
                                <button
                                    onClick={fetchProjects}
                                    className="btn retry-btn"
                                >
                                    Попробовать снова
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="empty-state">
                                    <p>Проектов пока нет</p>
                                    <p className="hint">Создайте свой первый проект</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="btn create-btn"
                                >
                                    Создать первый проект
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    projects.map(project => (
                        <div key={project.id} className="project-item">
                            <div
                                className="project-info"
                                onClick={() => onSelectProject(project)}
                            >
                                <div className="project-title">
                                    <div
                                        className="color-dot"
                                        style={{ backgroundColor: project.color || '#3498db' }}
                                    />
                                    <h3>{project.name}</h3>
                                    {project.owner === user.id && (
                                        <span className="owner-badge">Ваш проект</span>
                                    )}
                                </div>

                                {project.description && (
                                    <p className="project-desc">{project.description}</p>
                                )}

                                <div className="project-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Создан:</span>
                                        <span className="meta-value">
                                            {project.creation_date
                                                ? new Date(project.creation_date).toLocaleDateString('ru-RU')
                                                : '—'
                                            }
                                        </span>
                                    </div>

                                    <div className="meta-item">
                                        <span className="meta-label">ID:</span>
                                        <span className="meta-value">{project.id}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="project-actions">
                                <button
                                    onClick={() => onSelectProject(project)}
                                    className="btn open-btn"
                                >
                                    Открыть
                                </button>

                                {(project.owner === user.id || user.role === 'admin') && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteProject(project.id, project.name);
                                        }}
                                        className="btn delete-btn"
                                    >
                                        Удалить
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Новый проект</h2>
                            <button
                                className="close-btn"
                                onClick={() => setShowCreateModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleCreateProject}>
                            <div className="form-group">
                                <label>Название проекта *</label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    required
                                    placeholder="Введите название проекта"
                                />
                            </div>

                            <div className="form-group">
                                <label>Описание</label>
                                <textarea
                                    value={projectDescription}
                                    onChange={(e) => setProjectDescription(e.target.value)}
                                    placeholder="Описание проекта (необязательно)"
                                    rows="3"
                                />
                            </div>

                            <div className="modal-buttons">
                                <button type="submit" className="btn primary-btn">
                                    Создать проект
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn secondary-btn"
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProjectList;
