import React, { useState, useEffect } from 'react';
import { taskAPI, projectAPI } from '../services/api';
import '../styles/tasklist.css';

function TaskList({ projectId, user, userProjectRole, permissions }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [projectMembers, setProjectMembers] = useState([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [filters, setFilters] = useState({
        priority: '',
        category: '',
        status: '',
        search: ''
    });

    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        category: 'Feature',
        status: 'ToDo',
        deadline_date: '',
        assignee_ids: []
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                const membersResponse = await projectAPI.get_project_members(projectId);
                const members = membersResponse.data || [];
                setProjectMembers(members);

                const taskParams = { project_id: projectId };
                const tasksResponse = await taskAPI.get_tasks(taskParams);
                setTasks(tasksResponse.data || []);

            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
                alert('Не удалось загрузить данные');
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            loadData();
        }
    }, [projectId]);

    const resetTaskForm = () => {
        setTaskForm({
            title: '',
            description: '',
            priority: 'Medium',
            category: 'Feature',
            status: 'ToDo',
            deadline_date: '',
            assignee_ids: []
        });
        setEditingTask(null);
    };

    const openTaskForm = (task = null) => {
        if (!permissions.canCreateTasks && !permissions.canEditTasks) {
            alert('У вас нет прав для управления задачами');
            return;
        }

        if (task) {
            setTaskForm({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'Medium',
                category: task.category || 'Feature',
                status: task.status || 'ToDo',
                deadline_date: task.deadline_date ? task.deadline_date.split('T')[0] : '',
                assignee_ids: task.assignees ? task.assignees.map(a => a.id) : []
            });
            setEditingTask(task);
        } else {
            resetTaskForm();
        }
        setShowTaskModal(true);
    };

    const handleSaveTask = async (e) => {
        e.preventDefault();

        if (!taskForm.title.trim()) {
            alert('Введите название задачи');
            return;
        }

        try {
            const taskData = {
                title: taskForm.title,
                description: taskForm.description,
                priority: taskForm.priority,
                category: taskForm.category,
                status: taskForm.status,
                project_id: parseInt(projectId)
            };

            if (taskForm.deadline_date) {
                taskData.deadline_date = new Date(taskForm.deadline_date).toISOString();
            }

            if (userProjectRole === 'Owner' && taskForm.assignee_ids.length > 0) {
                const validAssigneeIds = taskForm.assignee_ids.filter(assigneeId =>
                    projectMembers.some(member => (member.user_id || member.id) === assigneeId)
                );

                if (validAssigneeIds.length !== taskForm.assignee_ids.length) {
                    alert('Некоторые выбранные исполнители не являются участниками проекта');
                    return;
                }

                taskData.assignee_ids = validAssigneeIds;
            }

            let response;

            if (editingTask) {
                response = await taskAPI.update_task(editingTask.id, taskData);
                setTasks(prev => prev.map(t => t.id === editingTask.id ? response.data : t));
                alert('Задача обновлена!');
            } else {
                response = await taskAPI.create_task(taskData);
                setTasks(prev => [response.data, ...prev]);
                alert('Задача создана!');
            }

            setShowTaskModal(false);
            resetTaskForm();

        } catch (error) {
            console.error('Ошибка сохранения задачи:', error);
            alert(error.response?.data?.error || 'Ошибка сохранения задачи');
        }
    };

    const handleDeleteTask = async (taskId, taskTitle) => {
        if (!permissions.canDeleteTasks) {
            alert('Только владелец может удалять задачи');
            return;
        }

        if (!window.confirm(`Удалить задачу "${taskTitle}"?`)) {
            return;
        }

        try {
            await taskAPI.delete_task(taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            alert('Задача удалена!');
        } catch (error) {
            console.error('Ошибка удаления задачи:', error);
            alert(error.response?.data?.error || 'Ошибка удаления задачи');
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()) &&
            !(task.description && task.description.toLowerCase().includes(filters.search.toLowerCase()))) {
            return false;
        }

        if (filters.priority && task.priority !== filters.priority) {
            return false;
        }

        if (filters.category && task.category !== filters.category) {
            return false;
        }

        if (filters.status && task.status !== filters.status) {
            return false;
        }

        return true;
    });

    const priorityOptions = [
        { value: '', label: 'Все приоритеты' },
        { value: 'Low', label: 'Низкий' },
        { value: 'Medium', label: 'Средний' },
        { value: 'High', label: 'Высокий' },
        { value: 'Critical', label: 'Критический' }
    ];

    const categoryOptions = [
        { value: '', label: 'Все категории' },
        { value: 'Bug', label: 'Ошибка' },
        { value: 'Feature', label: 'Функция' },
        { value: 'Improvement', label: 'Улучшение' },
        { value: 'Documentation', label: 'Документация' }
    ];

    const statusOptions = [
        { value: '', label: 'Все статусы' },
        { value: 'ToDo', label: 'К выполнению' },
        { value: 'InProgress', label: 'В работе' },
        { value: 'Review', label: 'На проверке' },
        { value: 'Done', label: 'Выполнено' }
    ];

    const getAssigneeNames = (task) => {
        if (!task.assignees || task.assignees.length === 0) {
            return 'Не назначен';
        }
        return task.assignees.map(a => a.username).join(', ');
    };

    if (loading) {
        return (
            <div className="task-list-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка задач...</p>
            </div>
        );
    }

    return (
        <div className="task-list-container">
            <div className="task-controls">
                <div className="controls-left">
                    {permissions.canCreateTasks && (
                        <button
                            onClick={() => openTaskForm()}
                            className="btn btn-primary"
                        >
                            ➕ Новая задача
                        </button>
                    )}

                    <div className="tasks-count">
                        Задач: {filteredTasks.length} из {tasks.length}
                    </div>
                </div>

                <div className="controls-right">
                    <input
                        type="text"
                        placeholder="Поиск задач..."
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                        className="search-input"
                    />

                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters({...filters, priority: e.target.value})}
                        className="filter-select"
                    >
                        {priorityOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({...filters, category: e.target.value})}
                        className="filter-select"
                    >
                        {categoryOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="filter-select"
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => setFilters({
                            priority: '',
                            category: '',
                            status: '',
                            search: ''
                        })}
                        className="btn btn-secondary"
                    >
                        Сбросить фильтры
                    </button>
                </div>
            </div>

            <div className="tasks-grid">
                {filteredTasks.length === 0 ? (
                    <div className="no-tasks">
                        {tasks.length === 0 ? (
                            <>
                                <p>В этом проекте пока нет задач</p>
                                {permissions.canCreateTasks && (
                                    <button
                                        onClick={() => openTaskForm()}
                                        className="btn btn-primary"
                                    >
                                        Создать первую задачу
                                    </button>
                                )}
                            </>
                        ) : (
                            <p>Задачи не найдены по текущим фильтрам</p>
                        )}
                    </div>
                ) : (
                    filteredTasks.map(task => (
                        <div key={task.id} className="task-card">
                            <div className="task-header">
                                <h3 className="task-title">{task.title}</h3>
                                <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                                    {task.priority}
                                </span>
                            </div>

                            {task.description && (
                                <p className="task-description">{task.description}</p>
                            )}

                            <div className="task-meta">
                                <div className="meta-item">
                                    <span className="meta-label">Категория:</span>
                                    <span className="meta-value">{task.category}</span>
                                </div>

                                <div className="meta-item">
                                    <span className="meta-label">Статус:</span>
                                    <span className={`status-badge status-${task.status.toLowerCase()}`}>
                                        {task.status}
                                    </span>
                                </div>

                                <div className="meta-item">
                                    <span className="meta-label">Ответственный:</span>
                                    <span className="meta-value">{getAssigneeNames(task)}</span>
                                </div>

                                {task.deadline_date && (
                                    <div className="meta-item">
                                        <span className="meta-label">Дедлайн:</span>
                                        <span className={`meta-value ${new Date(task.deadline_date) < new Date() ? 'deadline-overdue' : ''}`}>
                                            {new Date(task.deadline_date).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="task-actions">
                                {permissions.canEditTasks && (
                                    <button
                                        onClick={() => openTaskForm(task)}
                                        className="btn btn-edit"
                                    >
                                        ✏️ Редактировать
                                    </button>
                                )}

                                {permissions.canDeleteTasks && (
                                    <button
                                        onClick={() => handleDeleteTask(task.id, task.title)}
                                        className="btn btn-danger"
                                    >
                                        🗑️ Удалить
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showTaskModal && (
                <div className="modal-overlay" onClick={() => { setShowTaskModal(false); resetTaskForm(); }}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingTask ? 'Редактировать задачу' : 'Новая задача'}</h2>
                            <button
                                className="close-btn"
                                onClick={() => { setShowTaskModal(false); resetTaskForm(); }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSaveTask}>
                            <div className="form-group">
                                <label htmlFor="task-title">Название задачи *</label>
                                <input
                                    type="text"
                                    id="task-title"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                                    required
                                    placeholder="Введите название задачи"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="task-description">Описание задачи</label>
                                <textarea
                                    id="task-description"
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                                    placeholder="Описание задачи (необязательно)"
                                    rows="4"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="task-priority">Приоритет</label>
                                    <select
                                        id="task-priority"
                                        value={taskForm.priority}
                                        onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                                    >
                                        <option value="Low">Низкий</option>
                                        <option value="Medium">Средний</option>
                                        <option value="High">Высокий</option>
                                        <option value="Critical">Критический</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="task-category">Категория</label>
                                    <select
                                        id="task-category"
                                        value={taskForm.category}
                                        onChange={(e) => setTaskForm({...taskForm, category: e.target.value})}
                                    >
                                        <option value="Bug">Ошибка</option>
                                        <option value="Feature">Функция</option>
                                        <option value="Improvement">Улучшение</option>
                                        <option value="Documentation">Документация</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="task-status">Статус</label>
                                    <select
                                        id="task-status"
                                        value={taskForm.status}
                                        onChange={(e) => setTaskForm({...taskForm, status: e.target.value})}
                                    >
                                        <option value="ToDo">К выполнению</option>
                                        <option value="InProgress">В работе</option>
                                        <option value="Review">На проверке</option>
                                        <option value="Done">Выполнено</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="task-deadline">Дедлайн</label>
                                    <input
                                        type="date"
                                        id="task-deadline"
                                        value={taskForm.deadline_date}
                                        onChange={(e) => setTaskForm({...taskForm, deadline_date: e.target.value})}
                                    />
                                </div>
                            </div>

                            {userProjectRole === 'Owner' && projectMembers.length > 0 && (
                                <div className="form-group">
                                    <label>Ответственные (только участники проекта)</label>
                                    <div className="assignees-selector">
                                        {projectMembers.map(member => {
                                            const memberId = member.user_id || member.id;
                                            const memberName = member.username || `Пользователь #${memberId}`;
                                            const memberRole = member.project_role || member.role;

                                            return (
                                                <label key={memberId} className="assignee-option">
                                                    <input
                                                        type="checkbox"
                                                        checked={taskForm.assignee_ids.includes(memberId)}
                                                        onChange={(e) => {
                                                            const newAssigneeIds = e.target.checked
                                                                ? [...taskForm.assignee_ids, memberId]
                                                                : taskForm.assignee_ids.filter(id => id !== memberId);
                                                            setTaskForm({...taskForm, assignee_ids: newAssigneeIds});
                                                        }}
                                                    />
                                                    <span className="assignee-info">
                                                        <span className="assignee-name">{memberName}</span>
                                                        <span className="assignee-role">
                                                            ({memberRole === 'Owner' ? '👑 Владелец' : '👁️ Наблюдатель'})
                                                        </span>
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <small className="form-hint">
                                        Выбрано ответственных: {taskForm.assignee_ids.length}
                                    </small>
                                </div>
                            )}

                            {userProjectRole === 'Owner' && projectMembers.length === 0 && (
                                <div className="alert alert-warning">
                                    <p>⚠️ В проекте нет участников. Сначала добавьте участников, чтобы назначить ответственных.</p>
                                </div>
                            )}

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">
                                    {editingTask ? 'Сохранить изменения' : 'Создать задачу'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => { setShowTaskModal(false); resetTaskForm(); }}
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

export default TaskList;
