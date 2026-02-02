import React, { useState, useEffect } from 'react';
import { projectAPI } from '../services/api';
import '../styles/projectlist.css';
import ProjectMembersList from './ProjectMembersList';

function ProjectList({ user }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('create');
    const [editingProject, setEditingProject] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#FFFFFF'
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await projectAPI.get_projects();
            setProjects(response.data || []);
        } catch (err) {
            console.error('Ошибка загрузки проектов:', err);
            setError('Не удалось загрузить проекты');
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleColorSelect = (color) => {
        setFormData(prev => ({
            ...prev,
            color: color
        }));
    };

    const handleCreateClick = () => {
        setFormData({
            name: '',
            description: '',
            color: '#FFFFFF'
        });
        setModalType('create');
        setShowModal(true);
    };

    const handleEditClick = (project) => {
        setFormData({
            name: project.name,
            description: project.description || '',
            color: project.color || '#FFFFFF'
        });
        setEditingProject(project);
        setModalType('edit');
        setShowModal(true);
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();

        try {
            const response = await projectAPI.create_project(formData);

            setProjects(prev => [response.data, ...prev]);

            setShowModal(false);
            setFormData({ name: '', description: '', color: '#FFFFFF' });

            alert('Проект успешно создан!');

        } catch (err) {
            console.error('Ошибка создания проекта:', err);
            alert(err.response?.data?.error || 'Ошибка создания проекта');
        }
    };

    const handleUpdateProject = async (e) => {
        e.preventDefault();

        if (!editingProject) return;

        try {
            const response = await projectAPI.update_project(
                editingProject.id,
                formData
            );

            setProjects(prev => prev.map(project =>
                project.id === editingProject.id ? response.data : project
            ));

            setShowModal(false);
            setEditingProject(null);

            alert('Проект успешно обновлен!');

        } catch (err) {
            console.error('Ошибка обновления проекта:', err);
            alert(err.response?.data?.error || 'Ошибка обновления проекта');
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот проект?')) {
            return;
        }

        try {
            await projectAPI.delete_project(projectId);

            setProjects(prev => prev.filter(project => project.id !== projectId));

            alert('Проект успешно удален!');

        } catch (err) {
            console.error('Ошибка удаления проекта:', err);
            alert(err.response?.data?.error || 'Ошибка удаления проекта');
        }
    };

    const colorOptions = [
        { value: '#FFFFFF', label: 'Белый' },
        { value: '#000000', label: 'Черный' },
        { value: '#FF0000', label: 'Красный' },
        { value: '#00FF00', label: 'Зеленый' },
        { value: '#0000FF', label: 'Синий' },
        { value: '#FFFF00', label: 'Желтый' },
        { value: '#FFA500', label: 'Оранжевый' },
        { value: '#800080', label: 'Фиолетовый' },
        { value: '#00FFFF', label: 'Бирюзовый' }
    ];

    if (loading && projects.length === 0) {
        return (
            <div className="loading">
                Загрузка проектов...
            </div>
        );
    }

    return (
        <div className="projects-container">
            {/* Заголовок и кнопка создания */}
            <div className="projects-header">
                <h1 className="projects-title">Мои проекты</h1>
                <button
                    onClick={handleCreateClick}
                    className="btn btn-primary"
                >
                    + Создать проект
                </button>
            </div>

            {/* Сообщение об ошибке */}
            {error && (
                <div className="login-error" style={{ marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            {/* Сетка проектов */}
            {projects.length > 0 ? (
                <div className="projects-grid">
                    {projects.map(project => (
                        <div
                            key={project.id}
                            className="project-card"
                            style={{ borderLeftColor: project.color || '#3498db' }}
                        >
                            <div className="project-header">
                                <div>
                                    <h3 className="project-name">{project.name}</h3>
                                    <div
                                        className="project-color"
                                        style={{ backgroundColor: project.color || '#FFFFFF' }}
                                        title="Цвет проекта"
                                    />
                                </div>
                                <div className="project-actions">
                                    <button
                                        onClick={() => handleEditClick(project)}
                                        className="btn btn-secondary"
                                    >
                                        Редактировать
                                    </button>
                                    {user.role === 'admin' && (
                                        <button
                                            onClick={() => handleDeleteProject(project.id)}
                                            className="btn btn-danger"
                                        >
                                            Удалить
                                        </button>
                                    )}
                                </div>
                            </div>

                            {project.description && (
                                <p className="project-description">
                                    {project.description}
                                </p>
                            )}

                            <div className="project-meta">
                                <span className="project-owner">
                                    Владелец: {project.owner || 'Не указан'}
                                </span>
                                <span>
                                    Задач: {project.tasks_count || 0}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-projects">
                    <p>У вас еще нет проектов. Создайте первый проект!</p>
                </div>
            )}

            {/* Модальное окно создания/редактирования */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {modalType === 'create' ? 'Создать проект' : 'Редактировать проект'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="close-btn"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={modalType === 'create' ? handleCreateProject : handleUpdateProject}>
                            <div className="form-group">
                                <label>Название проекта:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                    placeholder="Введите название проекта"
                                />
                            </div>

                            <div className="form-group">
                                <label>Описание (необязательно):</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Введите описание проекта"
                                    rows="3"
                                />
                            </div>
                            <ProjectMembersList
                                projectId={project.id}
                                user={user}
                            />
                            <div className="form-group">
                                <label>Цвет проекта:</label>
                                <div className="color-picker">
                                    {colorOptions.map(color => (
                                        <div
                                            key={color.value}
                                            className={`color-option ${formData.color === color.value ? 'selected' : ''}`}
                                            style={{ backgroundColor: color.value }}
                                            onClick={() => handleColorSelect(color.value)}
                                            title={color.label}
                                        />
                                    ))}
                                </div>
                                <small>Выбран: {colorOptions.find(c => c.value === formData.color)?.label}</small>
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    {modalType === 'create' ? 'Создать' : 'Сохранить'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary"
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
