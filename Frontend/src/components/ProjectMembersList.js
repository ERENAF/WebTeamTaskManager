import React, { useState, useEffect } from 'react';
import { projectAPI, usersAPI } from '../services/api';
import '../styles/projectmemberslist.css';

function ProjectMembersList({ projectId, user }) {
    // Состояния
    const [members, setMembers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Модальное окно для добавления участника
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Данные формы
    const [newMemberData, setNewMemberData] = useState({
        user_id: '',
        role: 'VIEWER'
    });

    const [editingMember, setEditingMember] = useState(null);

    // Роли в проекте
    const projectRoles = [
        { value: 'VIEWER', label: 'Наблюдатель', description: 'Только просмотр' },
        { value: 'EDITOR', label: 'Редактор', description: 'Может создавать и редактировать задачи' },
        { value: 'OWNER', label: 'Владелец', description: 'Полный доступ' }
    ];

    // Загрузка данных
    useEffect(() => {
        if (projectId) {
            fetchData();
        }
    }, [projectId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');

            // Загружаем всех пользователей
            const usersResponse = await usersAPI.get_users();
            setAllUsers(usersResponse.data || []);

            // Загружаем участников проекта
            await fetchProjectMembers();

        } catch (err) {
            console.error('Ошибка загрузки данных:', err);
            setError('Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    // Загрузка участников проекта
    const fetchProjectMembers = async () => {
        try {
            const response = await projectAPI.get_project_members(projectId);
            setMembers(response.data || []);
        } catch (err) {
            console.error('Ошибка загрузки участников:', err);
            setError('Не удалось загрузить участников');
            setMembers([]);
        }
    };

    // Обработчик добавления участника
    const handleAddMember = async (e) => {
        e.preventDefault();

        try {
            await projectAPI.add_project_member(projectId, newMemberData);

            // Обновляем список
            await fetchProjectMembers();

            // Закрываем модальное окно и сбрасываем форму
            setShowAddModal(false);
            setNewMemberData({ user_id: '', role: 'VIEWER' });

            alert('Участник успешно добавлен!');

        } catch (err) {
            console.error('Ошибка добавления участника:', err);
            alert(err.response?.data?.error || 'Ошибка добавления участника');
        }
    };

    // Обработчик изменения роли
    const handleUpdateRole = async (memberId, newRole) => {
        try {
            await projectAPI.update_project_member_role(projectId, memberId, { role: newRole });

            // Обновляем локально
            setMembers(prev => prev.map(member =>
                member.user_id === memberId ? { ...member, role: newRole } : member
            ));

            alert('Роль обновлена!');

        } catch (err) {
            console.error('Ошибка обновления роли:', err);
            alert('Не удалось обновить роль');
        }
    };

    // Обработчик удаления участника
    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Удалить участника из проекта?')) {
            return;
        }

        try {
            await projectAPI.delete_project_member(projectId, memberId);

            // Удаляем локально
            setMembers(prev => prev.filter(member => member.user_id !== memberId));

            alert('Участник удален из проекта!');

        } catch (err) {
            console.error('Ошибка удаления участника:', err);
            alert('Не удалось удалить участника');
        }
    };

    // Открытие модального окна редактирования
    const handleEditClick = (member) => {
        setEditingMember(member);
        setShowEditModal(true);
    };

    // Сохранение изменений
    const handleSaveEdit = async () => {
        if (!editingMember) return;

        try {
            await projectAPI.update_project_member_role(
                projectId,
                editingMember.user_id,
                { role: editingMember.role }
            );

            // Обновляем локально
            setMembers(prev => prev.map(member =>
                member.user_id === editingMember.user_id ? editingMember : member
            ));

            setShowEditModal(false);
            setEditingMember(null);

            alert('Изменения сохранены!');

        } catch (err) {
            console.error('Ошибка сохранения:', err);
            alert('Не удалось сохранить изменения');
        }
    };

    // Проверка прав доступа
    const canManageMembers = () => {
        // В реальном приложении проверяем роль пользователя в проекте
        return user.role === 'admin' || members.some(m => m.user_id === user.id && m.role === 'OWNER');
    };

    // Пользователи, которых можно добавить
    const availableUsers = allUsers.filter(user =>
        !members.some(member => member.user_id === user.id)
    );

    if (loading) {
        return <div className="loading">Загрузка участников...</div>;
    }

    return (
        <div className="project-members-container">
            {/* Заголовок и кнопка */}
            <div className="members-header">
                <h2>Участники проекта ({members.length})</h2>
                {canManageMembers() && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary"
                        disabled={availableUsers.length === 0}
                    >
                        + Добавить участника
                    </button>
                )}
            </div>

            {/* Сообщение об ошибке */}
            {error && (
                <div className="error-message">{error}</div>
            )}

            {/* Список участников */}
            <div className="members-list">
                {members.length === 0 ? (
                    <div className="no-members">
                        <p>В проекте пока нет участников</p>
                        {canManageMembers() && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn btn-primary"
                            >
                                Добавить первого участника
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="members-table">
                        <thead>
                            <tr>
                                <th>Пользователь</th>
                                <th>Роль</th>
                                <th>Email</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(member => (
                                <tr key={member.user_id}>
                                    <td>
                                        <div className="member-info">
                                            <div className="member-avatar">
                                                {member.username?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="member-name">{member.username}</div>
                                                <div className="member-role-label">
                                                    {projectRoles.find(r => r.value === member.role)?.label}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {canManageMembers() && member.role !== 'OWNER' ? (
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                                                className="role-select"
                                            >
                                                {projectRoles.map(role => (
                                                    <option key={role.value} value={role.value}>
                                                        {role.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="role-display">
                                                {projectRoles.find(r => r.value === member.role)?.label}
                                            </span>
                                        )}
                                    </td>
                                    <td>{member.email}</td>
                                    <td>
                                        {canManageMembers() && member.role !== 'OWNER' && (
                                            <button
                                                onClick={() => handleRemoveMember(member.user_id)}
                                                className="btn btn-danger btn-sm"
                                            >
                                                Удалить
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Модальное окно добавления участника */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Добавить участника</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="close-btn"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleAddMember}>
                            <div className="form-group">
                                <label>Пользователь:</label>
                                <select
                                    value={newMemberData.user_id}
                                    onChange={(e) => setNewMemberData(prev => ({
                                        ...prev,
                                        user_id: e.target.value
                                    }))}
                                    required
                                    className="form-select"
                                >
                                    <option value="">Выберите пользователя</option>
                                    {availableUsers.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.username} ({user.email})
                                        </option>
                                    ))}
                                </select>
                                <small className="hint">
                                    Доступно: {availableUsers.length} пользователей
                                </small>
                            </div>

                            <div className="form-group">
                                <label>Роль в проекте:</label>
                                <select
                                    value={newMemberData.role}
                                    onChange={(e) => setNewMemberData(prev => ({
                                        ...prev,
                                        role: e.target.value
                                    }))}
                                    className="form-select"
                                >
                                    {projectRoles.map(role => (
                                        <option key={role.value} value={role.value}>
                                            {role.label} - {role.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary">
                                    Добавить
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модальное окно редактирования роли */}
            {showEditModal && editingMember && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Изменение роли участника</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="close-btn"
                            >
                                ×
                            </button>
                        </div>

                        <div className="edit-form">
                            <div className="member-info-large">
                                <div className="member-avatar large">
                                    {editingMember.username?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4>{editingMember.username}</h4>
                                    <p>{editingMember.email}</p>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Роль в проекте:</label>
                                <div className="role-options">
                                    {projectRoles.map(role => (
                                        <label key={role.value} className="role-option">
                                            <input
                                                type="radio"
                                                name="role"
                                                value={role.value}
                                                checked={editingMember.role === role.value}
                                                onChange={(e) => setEditingMember(prev => ({
                                                    ...prev,
                                                    role: e.target.value
                                                }))}
                                            />
                                            <div className="role-content">
                                                <div className="role-title">{role.label}</div>
                                                <div className="role-description">{role.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button onClick={handleSaveEdit} className="btn btn-primary">
                                    Сохранить
                                </button>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProjectMembersList;
