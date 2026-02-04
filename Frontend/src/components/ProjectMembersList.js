import React, { useState, useEffect } from 'react';
import { projectAPI, usersAPI } from '../services/api';
import '../styles/projectmemberslist.css';

function ProjectMembersList({ projectId, user, userProjectRole, permissions }) {
    const [members, setMembers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMemberForm, setNewMemberForm] = useState({
        user_id: '',
        role: 'Viewer'
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                const membersResponse = await projectAPI.get_project_members(projectId);
                const members = membersResponse.data || [];
                setMembers(members);

                const usersResponse = await usersAPI.get_users();
                setAllUsers(usersResponse.data || []);

            } catch (error) {
                alert('Не удалось загрузить участников проекта');
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            loadData();
        }
    }, [projectId]);

    const getAvailableUsers = () => {
        const memberIds = members.map(member => member.user_id || member.id);
        return allUsers.filter(userItem =>
            !memberIds.includes(userItem.id)
        );
    };

    const handleAddMember = async (e) => {
        e.preventDefault();

        if (!permissions.canManageMembers) {
            alert('Только участники проекта могут добавлять участников');
            return;
        }

        try {
            const memberData = {
                user_id: parseInt(newMemberForm.user_id),
                role: newMemberForm.role
            };

            await projectAPI.add_project_member(projectId, memberData);

            const membersResponse = await projectAPI.get_project_members(projectId);
            setMembers(membersResponse.data || []);

            setShowAddModal(false);
            setNewMemberForm({ user_id: '', role: 'Viewer' });

            alert('Участник успешно добавлен!');

        } catch (error) {
            alert(error.response?.data?.error || 'Ошибка добавления участника');
        }
    };

    const handleRemoveMember = async (memberId, memberName) => {
        if (!permissions.canManageMembers) {
            alert('Только участники могут удалять участников');
            return;
        }

        const member = members.find(m => (m.user_id || m.id) === memberId);
        if (member && member.project_role === 'Member') {
            alert('Нельзя удалить владельца проекта');
            return;
        }

        if (memberId === user.id) {
            const confirmLeave = window.confirm('Вы уверены, что хотите покинуть проект?');
            if (!confirmLeave) return;
        } else {
            const confirmDelete = window.confirm(`Удалить участника "${memberName}" из проекта?`);
            if (!confirmDelete) return;
        }

        try {
            await projectAPI.delete_project_member(projectId, memberId);

            const updatedMembers = members.filter(m => (m.user_id || m.id) !== memberId);
            setMembers(updatedMembers);

            if (memberId === user.id) {
                alert('Вы покинули проект!');
                window.location.reload();
            } else {
                alert('Участник удален из проекта!');
            }

        } catch (error) {
            alert(error.response?.data?.error || 'Ошибка удаления участника');
        }
    };

    const roleOptions = [
        { value: 'Viewer', label: 'Наблюдатель', description: 'Может только просматривать проект и задачи' },
        { value: 'Member', label: 'Участник', description: 'Полный доступ ко всем функциям проекта' }
    ];

    const availableUsers = getAvailableUsers();

    if (loading) {
        return (
            <div className="members-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка участников...</p>
            </div>
        );
    }

    return (
        <div className="project-members-container">
            <div className="members-header">
                <h3>Участники проекта ({members.length})</h3>

                {permissions.canManageMembers && (
                    <div className="header-actions">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary"
                            disabled={availableUsers.length === 0}
                        >
                            Добавить участника
                        </button>
                    </div>
                )}
            </div>

            <div className="members-table-container">
                {members.length === 0 ? (
                    <div className="no-members">
                        <p>В проекте пока нет участников</p>
                        {permissions.canManageMembers && (
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
                                <th>Роль в проекте</th>
                                <th>Email</th>
                                {permissions.canManageMembers && <th>Действия</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((member, index) => {
                                const memberId = member.user_id || member.id;
                                const memberRole = member.project_role || member.role;
                                const isOwner = memberRole === 'Member';
                                const isCurrentUser = memberId === user.id;

                                return (
                                    <tr key={`member-${memberId}-${index}`}>
                                        <td>
                                            <div className="member-info">
                                                <div className="member-avatar">
                                                    {member.username?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div className="member-details">
                                                    <div className="member-name">
                                                        {member.username || 'Неизвестный'}
                                                        {isOwner && <span className="owner-badge">Участник</span>}
                                                        {isCurrentUser && <span className="current-user-badge">(Вы)</span>}
                                                    </div>
                                                    <div className="member-id">ID: {memberId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge role-${memberRole.toLowerCase()}`}>
                                                {isOwner ? 'Участник' : 'Наблюдатель'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="member-email">
                                                {member.email || '—'}
                                            </span>
                                        </td>
                                        {permissions.canManageMembers && (
                                            <td>
                                                <div className="member-actions">
                                                    {!isOwner && (
                                                        <button
                                                            onClick={() => handleRemoveMember(memberId, member.username)}
                                                            className="btn btn-danger"
                                                        >
                                                            {isCurrentUser ? 'Покинуть' : 'Удалить'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {permissions.canManageMembers && (
                <div className="available-users-info">
                    <p>
                        <strong>Доступно для добавления:</strong> {availableUsers.length} пользователей
                    </p>
                </div>
            )}

            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Добавить участника в проект</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowAddModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleAddMember}>
                            <div className="form-group">
                                <label>Выберите пользователя</label>
                                <select
                                    value={newMemberForm.user_id}
                                    onChange={(e) => setNewMemberForm({...newMemberForm, user_id: e.target.value})}
                                    required
                                >
                                    <option value="">Выберите пользователя...</option>
                                    {availableUsers.map(userItem => (
                                        <option key={userItem.id} value={userItem.id}>
                                            {userItem.username} ({userItem.email})
                                        </option>
                                    ))}
                                </select>
                                {availableUsers.length === 0 && (
                                    <small className="form-hint error">
                                        Нет доступных пользователей для добавления
                                    </small>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Роль в проекте</label>
                                <div className="role-options">
                                    {roleOptions.map(option => (
                                        <label key={option.value} className="role-option">
                                            <input
                                                type="radio"
                                                name="role"
                                                value={option.value}
                                                checked={newMemberForm.role === option.value}
                                                onChange={(e) => setNewMemberForm({...newMemberForm, role: e.target.value})}
                                            />
                                            <div className="role-content">
                                                <div className="role-title">{option.label}</div>
                                                <div className="role-description">{option.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={availableUsers.length === 0}
                                >
                                    Добавить участника
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddModal(false)}
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

export default ProjectMembersList;
