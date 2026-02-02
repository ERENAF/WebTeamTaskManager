import React, { useState, useEffect } from 'react';
import { taskAPI, projectAPI } from '../services/api';
import '../styles/tasklist.css';

function TaskList({ user }) {
    // Состояния
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Фильтры
    const [filters, setFilters] = useState({
        project_id: '',
        priority: '',
        category: '',
        assignee_id: '',
        search: ''
    });

    // Сортировка
    const [sortBy, setSortBy] = useState('creation_date');
    const [sortOrder, setSortOrder] = useState('desc');

    // Модальное окно
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('create');
    const [editingTask, setEditingTask] = useState(null);

    // Данные формы
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        category: 'Feature',
        status: 'ToDo',
        deadline_date: '',
        project_id: '',
        parent_id: null,
        assignee_ids: []
    });

    // Загрузка данных
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Загружаем проекты
            const projectsResponse = await projectAPI.get_projects();
            setProjects(projectsResponse.data || []);

            // Загружаем задачи
            await fetchTasks();

        } catch (err) {
            console.error('Ошибка загрузки данных:', err);
        } finally {
            setLoading(false);
        }
    };

    // Загрузка задач с фильтрами и сортировкой
    const fetchTasks = async () => {
        try {
            // Параметры запроса
            const params = {};

            // Фильтры
            if (filters.project_id) params.project_id = filters.project_id;
            if (filters.priority) params.priority = filters.priority;
            if (filters.category) params.category = filters.category;
            if (filters.assignee_id) params.assignee_id = filters.assignee_id;
            if (filters.search) params.search = filters.search;

            // Сортировка
            params.sort = sortBy;
            params.order = sortOrder;

            const response = await taskAPI.get_tasks(params);
            setTasks(response.data || []);

        } catch (err) {
            console.error('Ошибка загрузки задач:', err);
        }
    };

    // Обработчики фильтров
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSortChange = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Форма
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Открытие модалки
    const handleCreateClick = () => {
        setFormData({
            title: '',
            description: '',
            priority: 'Medium',
            category: 'Feature',
            status: 'ToDo',
            deadline_date: '',
            project_id: projects[0]?.id || '',
            parent_id: null,
            assignee_ids: []
        });
        setModalType('create');
        setShowModal(true);
    };

    const handleEditClick = (task) => {
        setFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            category: task.category,
            status: task.status,
            deadline_date: task.deadline_date ? task.deadline_date.split('T')[0] : '',
            project_id: task.project_id,
            parent_id: task.parent_id || null,
            assignee_ids: task.assignees ? task.assignees.map(a => a.id) : []
        });
        setEditingTask(task);
        setModalType('edit');
        setShowModal(true);
    };

    // Создание/редактирование
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let response;

            if (modalType === 'create') {
                response = await taskAPI.create_task(formData);
                setTasks(prev => [response.data, ...prev]);
                alert('Задача создана!');
            } else {
                response = await taskAPI.update_task(editingTask.id, formData);
                setTasks(prev => prev.map(t => t.id === editingTask.id ? response.data : t));
                alert('Задача обновлена!');
            }

            setShowModal(false);

        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка сохранения');
        }
    };

    // Удаление (только Owner/Editor)
    const handleDelete = async (taskId) => {
        if (!window.confirm('Удалить задачу?')) return;

        try {
            await taskAPI.delete_task(taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            alert('Задача удалена!');
        } catch (err) {
            alert('Ошибка удаления');
        }
    };

    // Проверка прав доступа
    const canEditTask = (task) => {
        // В реальном приложении проверяем права через API
        return user.role === 'admin' || user.id === task.created_by;
    };

    // Фильтрация и сортировка задач
    const filteredAndSortedTasks = tasks
        .filter(task => {
            // Применяем фильтры
            if (filters.project_id && task.project_id != filters.project_id) return false;
            if (filters.priority && task.priority !== filters.priority) return false;
            if (filters.category && task.category !== filters.category) return false;
            if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            // Применяем сортировку
            const aValue = a[sortBy];
            const bValue = b[sortBy];

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    // Приоритеты
    const priorities = [
        { value: 'Low', label: 'Низкий', color: '#27ae60' },
        { value: 'Medium', label: 'Средний', color: '#f39c12' },
        { value: 'High', label: 'Высокий', color: '#e67e22' },
        { value: 'Critical', label: 'Критический', color: '#e74c3c' }
    ];

    // Категории
    const categories = [
        { value: 'Bug', label: 'Ошибка', icon: '🐛' },
        { value: 'Feature', label: 'Функция', icon: '✨' },
        { value: 'Improvement', label: 'Улучшение', icon: '⚡' },
        { value: 'Documentation', label: 'Документация', icon: '📖' }
    ];

    // Статусы
    const statuses = [
        { value: 'ToDo', label: 'К выполнению', color: '#e74c3c' },
        { value: 'InProgress', label: 'В работе', color: '#3498db' },
        { value: 'Review', label: 'На проверке', color: '#f39c12' },
        { value: 'Done', label: 'Выполнено', color: '#27ae60' }
    ];

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    return (
        <div className="tasks-container">
            {/* Заголовок */}
            <div className="tasks-header">
                <h1>Задачи ({filteredAndSortedTasks.length})</h1>
                {canEditTask({}) && (
                    <button onClick={handleCreateClick} className="btn btn-primary">
                        + Создать задачу
                    </button>
                )}
            </div>

            {/* Фильтры и сортировка */}
            <div className="filters-section">
                <h3>Фильтры</h3>

                <div className="filters-grid">
                    <div className="filter-group">
                        <label>Проект:</label>
                        <select name="project_id" value={filters.project_id} onChange={handleFilterChange}>
                            <option value="">Все проекты</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Приоритет:</label>
                        <select name="priority" value={filters.priority} onChange={handleFilterChange}>
                            <option value="">Все</option>
                            {priorities.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Категория:</label>
                        <select name="category" value={filters.category} onChange={handleFilterChange}>
                            <option value="">Все</option>
                            {categories.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Поиск:</label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Название или описание"
                        />
                    </div>
                </div>

                <div className="filter-actions">
                    <button onClick={fetchTasks} className="btn btn-primary">
                        Применить
                    </button>
                    <button onClick={() => setFilters({
                        project_id: '', priority: '', category: '', search: ''
                    })} className="btn btn-secondary">
                        Сбросить
                    </button>
                </div>
            </div>

            {/* Сортировка */}
            <div className="sort-section">
                <h4>Сортировка:</h4>
                <div className="sort-buttons">
                    <button
                        onClick={() => handleSortChange('title')}
                        className={`btn ${sortBy === 'title' ? 'active' : ''}`}
                    >
                        По названию {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => handleSortChange('priority')}
                        className={`btn ${sortBy === 'priority' ? 'active' : ''}`}
                    >
                        По приоритету {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => handleSortChange('deadline_date')}
                        className={`btn ${sortBy === 'deadline_date' ? 'active' : ''}`}
                    >
                        По дедлайну {sortBy === 'deadline_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => handleSortChange('creation_date')}
                        className={`btn ${sortBy === 'creation_date' ? 'active' : ''}`}
                    >
                        По дате {sortBy === 'creation_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                </div>
            </div>

            {/* Список задач */}
            <div className="tasks-list">
                {filteredAndSortedTasks.length === 0 ? (
                    <div className="no-tasks">Задачи не найдены</div>
                ) : (
                    filteredAndSortedTasks.map(task => (
                        <div key={task.id} className="task-card">
                            {/* Заголовок с приоритетом */}
                            <div className="task-header">
                                <div className="task-title-section">
                                    <h3>{task.title}</h3>
                                    {task.parent_id && <span className="subtask-badge">Подзадача</span>}
                                </div>
                                <span
                                    className="priority-badge"
                                    style={{
                                        backgroundColor: priorities.find(p => p.value === task.priority)?.color || '#ccc'
                                    }}
                                >
                                    {priorities.find(p => p.value === task.priority)?.label || task.priority}
                                </span>
                            </div>

                            {/* Категория и статус */}
                            <div className="task-meta">
                                <span className="task-category">
                                    {categories.find(c => c.value === task.category)?.icon}
                                    {categories.find(c => c.value === task.category)?.label || task.category}
                                </span>
                                <span
                                    className="task-status"
                                    style={{
                                        backgroundColor: statuses.find(s => s.value === task.status)?.color || '#ccc',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px'
                                    }}
                                >
                                    {statuses.find(s => s.value === task.status)?.label || task.status}
                                </span>
                            </div>

                            {/* Описание */}
                            {task.description && (
                                <p className="task-description">{task.description}</p>
                            )}

                            {/* Детали */}
                            <div className="task-details">
                                <div className="detail">
                                    <strong>Проект:</strong>
                                    {projects.find(p => p.id === task.project_id)?.name || task.project_id}
                                </div>
                                <div className="detail">
                                    <strong>Создана:</strong>
                                    {new Date(task.creation_date).toLocaleDateString()}
                                </div>
                                {task.deadline_date && (
                                    <div className="detail">
                                        <strong>Дедлайн:</strong>
                                        <span className={new Date(task.deadline_date) < new Date() ? 'overdue' : ''}>
                                            {new Date(task.deadline_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                {task.assignees && task.assignees.length > 0 && (
                                    <div className="detail">
                                        <strong>Исполнители:</strong>
                                        {task.assignees.map(a => a.username).join(', ')}
                                    </div>
                                )}
                            </div>

                            {/* Действия */}
                            <div className="task-actions">
                                <button
                                    onClick={() => handleEditClick(task)}
                                    disabled={!canEditTask(task)}
                                    className="btn btn-secondary"
                                >
                                    Редактировать
                                </button>

                                <button
                                    onClick={() => handleDelete(task.id)}
                                    disabled={!canEditTask(task)}
                                    className="btn btn-danger"
                                >
                                    Удалить
                                </button>

                                <button className="btn">
                                    Комментарии ({task.comments_count || 0})
                                </button>

                                <button className="btn">
                                    Подзадачи ({task.subtasks_count || 0})
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Модальное окно */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>{modalType === 'create' ? 'Создать задачу' : 'Редактировать задачу'}</h2>

                        <form onSubmit={handleSubmit}>
                            {/* Основные поля */}
                            <div className="form-group">
                                <label>Название *</label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Описание</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Приоритет</label>
                                    <select name="priority" value={formData.priority} onChange={handleInputChange}>
                                        {priorities.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Категория</label>
                                    <select name="category" value={formData.category} onChange={handleInputChange}>
                                        {categories.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Статус</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange}>
                                        {statuses.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Проект *</label>
                                    <select
                                        name="project_id"
                                        value={formData.project_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Выберите проект</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Дедлайн</label>
                                    <input
                                        type="date"
                                        name="deadline_date"
                                        value={formData.deadline_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            {/* Родительская задача (для подзадач) */}
                            {modalType === 'create' && (
                                <div className="form-group">
                                    <label>Родительская задача (для подзадачи)</label>
                                    <select
                                        name="parent_id"
                                        value={formData.parent_id || ''}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Нет (основная задача)</option>
                                        {tasks
                                            .filter(t => !t.parent_id) // Только родительские задачи
                                            .map(t => (
                                                <option key={t.id} value={t.id}>{t.title}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary">
                                    Сохранить
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

export default TaskList;
