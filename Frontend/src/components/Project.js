import React, { useState, useEffect } from 'react';
import { projectAPI } from '../services/api';
import TaskList from './TaskList';
import ProjectMembersList from './ProjectMembersList';
import '../styles/project.css';

function Project({ project, user, onBack }) {
    const [userProjectRole, setUserProjectRole] = useState(null);
    const [projectData, setProjectData] = useState(project);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: project.name,
        description: project.description || '',
        color: project.color || '#3498db'
    });

    useEffect(() => {
        const loadUserRole = async () => {
            try {
                if (project.owner === user.id) {
                    setUserProjectRole('Member');
                    return;
                }

                const response = await projectAPI.get_project_members(project.id);
                const members = response.data || [];

                const currentMember = members.find(member => {
                    const memberId = member.user_id || member.id;
                    return memberId === user.id;
                });

                if (currentMember) {
                    const role = currentMember.project_role === 'Member' ? 'Member' : 'Viewer';
                    setUserProjectRole(role);
                } else {
                    setUserProjectRole(null);
                }

            } catch (error) {
                setUserProjectRole(null);
            }
        };

        loadUserRole();
    }, [project, user]);

    const getPermissions = () => {
        if (!userProjectRole) {
            return {
                canEditProject: false,
                canDeleteProject: false,
                canManageMembers: false,
                canCreateTasks: false,
                canEditTasks: false,
                canDeleteTasks: false,
                canView: false,
                role: 'Нет доступа'
            };
        }

        const basePermissions = {
            role: userProjectRole,
            canView: true
        };

        if (userProjectRole === 'Member') {
            return {
                ...basePermissions,
                canEditProject: true,
                canDeleteProject: true,
                canManageMembers: true,
                canCreateTasks: true,
                canEditTasks: true,
                canDeleteTasks: true
            };
        } else {
            return {
                ...basePermissions,
                canEditProject: false,
                canDeleteProject: false,
                canManageMembers: false,
                canCreateTasks: false,
                canEditTasks: false,
                canDeleteTasks: false
            };
        }
    };

    const permissions = getPermissions();

    if (userProjectRole === null) {
        return (
            <div className="project-container">
                <div className="project-header">
                    <button onClick={onBack} className="back-btn">
                        ← Назад к проектам
                    </button>
                </div>
                <div className="access-denied">
                    <h2>Доступ запрещен</h2>
                    <p>Вы не являетесь участником этого проекта.</p>
                    <button onClick={onBack} className="btn btn-primary">
                        Вернуться к списку проектов
                    </button>
                </div>
            </div>
        );
    }

    if (userProjectRole === undefined) {
        return (
            <div className="project-container">
                <div className="project-header">
                    <button onClick={onBack} className="back-btn">
                        ← Назад
                    </button>
                    <h1>{projectData.name}</h1>
                </div>
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <p>Загрузка проекта...</p>
                </div>
            </div>
        );
    }

    const handleUpdateProject = async (e) => {
        e.preventDefault();

        if (!permissions.canEditProject) {
            alert('Только владелец может редактировать проект');
            return;
        }

        try {
            const updateData = {
                name: editForm.name,
                description: editForm.description,
                color: editForm.color
            };

            const response = await projectAPI.update_project(project.id, updateData);
            setProjectData(response.data);
            setShowEditModal(false);
            alert('Проект успешно обновлен!');
        } catch (error) {
            alert(error.response?.data?.error || 'Ошибка обновления проекта');
        }
    };

    const handleDeleteProject = async () => {
        if (!permissions.canDeleteProject) {
            alert('Только владелец может удалить проект');
            return;
        }

        if (!window.confirm(`Удалить проект "${projectData.name}"?`)) {
            return;
        }

        try {
            await projectAPI.delete_project(project.id);
            alert('Проект удален!');
            onBack();
        } catch (error) {
            alert(error.response?.data?.error || 'Ошибка удаления проекта');
        }
    };

    const colorOptions = [
        { value: '#3498db', label: 'Синий' },
        { value: '#2ecc71', label: 'Зеленый' },
        { value: '#e74c3c', label: 'Красный' },
        { value: '#f39c12', label: 'Оранжевый' },
        { value: '#9b59b6', label: 'Фиолетовый' },
        { value: '#1abc9c', label: 'Бирюзовый' }
    ];

    return (
        <div className="project-container">
            <div className="project-header">
                <div className="header-left">
                    <button onClick={onBack} className="back-btn">
                        ← Назад к проектам
                    </button>
                    <div className="project-title">
                        <div
                            className="project-color-badge"
                            style={{ backgroundColor: projectData.color || '#3498db' }}
                        />
                        <h1>{projectData.name}</h1>
                        <span className={`role-badge role-${userProjectRole.toLowerCase()}`}>
                            {userProjectRole === 'Member' ? 'Участник' : 'Наблюдатель'}
                        </span>
                    </div>
                </div>

                <div className="header-actions">
                    {permissions.canEditProject && (
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="btn btn-edit"
                        >
                            Редактировать проект
                        </button>
                    )}

                    {permissions.canDeleteProject && (
                        <button
                            onClick={handleDeleteProject}
                            className="btn btn-danger"
                        >
                            Удалить проект
                        </button>
                    )}
                </div>
            </div>

            {projectData.description && (
                <div className="project-description">
                    <h3>Описание проекта</h3>
                    <p>{projectData.description}</p>
                </div>
            )}
            <div className="project-main-content">
                <div className="project-section">
                    <div className="section-header">
                        <h2>Задачи проекта</h2>
                        {permissions.canCreateTasks && (
                            <span className="section-hint">
                                Вы можете управлять задачами
                            </span>
                        )}
                    </div>

                    <TaskList
                        projectId={project.id}
                        user={user}
                        userProjectRole={userProjectRole}
                        permissions={permissions}
                    />
                </div>

                <div className="project-section">
                    <div className="section-header">
                        <h2>Участники проекта</h2>
                        {permissions.canManageMembers && (
                            <span className="section-hint">
                                Вы можете управлять участниками
                            </span>
                        )}
                    </div>

                    <ProjectMembersList
                        projectId={project.id}
                        user={user}
                        userProjectRole={userProjectRole}
                        permissions={permissions}
                    />
                </div>
            </div>

            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Редактировать проект</h2>
                            <button
                                className="close-btn"
                                onClick={() => setShowEditModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProject}>
                            <div className="form-group">
                                <label>Название проекта *</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                    required
                                    placeholder="Введите название проекта"
                                />
                            </div>

                            <div className="form-group">
                                <label>Описание проекта</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                    placeholder="Описание проекта (необязательно)"
                                    rows="4"
                                />
                            </div>

                            <div className="form-group">
                                <label>Цвет проекта</label>
                                <div className="color-picker">
                                    {colorOptions.map(color => (
                                        <div
                                            key={color.value}
                                            className={`color-option ${editForm.color === color.value ? 'selected' : ''}`}
                                            style={{ backgroundColor: color.value }}
                                            onClick={() => setEditForm({...editForm, color: color.value})}
                                            title={color.label}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">
                                    Сохранить изменения
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowEditModal(false)}
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

export default Project;
