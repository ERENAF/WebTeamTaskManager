import React, { useState, useEffect } from 'react';
import { systemAPI, helperAPI } from './services/api';
import Login from './components/Login';
import Register from './components/Register';
import ProjectList from './components/ProjectList';
import TaskList from './components/TaskList';
import './styles/app.css';

function App() {
    const [user, setUser] = useState(null);
    const [currentPage, setCurrentPage] = useState('login');
    const [apiStatus, setApiStatus] = useState('checking');
    const [loading, setLoading] = useState(true);
    const [enums, setEnums] = useState(null);

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            const apiCheck = await helperAPI.checkAvailability();
            setApiStatus(apiCheck.available ? 'online' : 'offline');

            const enumsData = await helperAPI.getEnumsForForms();
            setEnums(enumsData);

            const savedUser = localStorage.getItem('user');
            const savedToken = localStorage.getItem('token');

            if (savedUser && savedToken) {
                setUser(JSON.parse(savedUser));
                setCurrentPage('projects');
            }
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            setApiStatus('offline');
        } finally {
            setLoading(false);
        }
    };

    const handleLoginSuccess = (responseData) => {
        const { user, token } = responseData;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        setUser(user);
        setCurrentPage('projects');
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setCurrentPage('login');
    };

    // Инициализация тестовой БД (только для разработки)
    const handleInitTestDB = async () => {
        if (!window.confirm('Создать тестовые данные? Текущие данные будут удалены.')) {
            return;
        }

        try {
            await systemAPI.initTestDB();
            alert('Тестовые данные созданы!');
            handleLogout();
        } catch (error) {
            alert('Ошибка: ' + (error.response?.data?.error || error.message));
        }
    };

    if (loading) {
        return (
            <div className="container text-center mt-3">
                <h2>Загрузка</h2>
            </div>
        );
    }

    return (
        <div className="app-container">
            {/* Шапка */}
            <header className="app-header">
                <div className="container header-content">
                    <div className="logo">Task Manager</div>

                    <div className="user-info">
                        <div className={`api-status ${apiStatus}`}>
                            {apiStatus === 'online' ? 'Онлайн' : 'Офлайн'}
                        </div>

                        {user && (
                            <>
                                <span className="username">
                                    {user.username}
                                    {user.role === 'admin' && ' (Админ)'}
                                </span>
                                <button onClick={handleLogout} className="btn btn-outline">
                                    Выйти
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Навигация */}
            <nav className="app-nav">
                <div className="container">
                    <ul className="nav-links">
                        {!user ? (
                            <>
                                <li>
                                    <button
                                        className={`nav-link ${currentPage === 'login' ? 'active' : ''}`}
                                        onClick={() => setCurrentPage('login')}
                                    >
                                        Вход
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={`nav-link ${currentPage === 'register' ? 'active' : ''}`}
                                        onClick={() => setCurrentPage('register')}
                                    >
                                        Регистрация
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <button
                                        className={`nav-link ${currentPage === 'projects' ? 'active' : ''}`}
                                        onClick={() => setCurrentPage('projects')}
                                    >
                                        Проекты
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={`nav-link ${currentPage === 'tasks' ? 'active' : ''}`}
                                        onClick={() => setCurrentPage('tasks')}
                                    >
                                        Задачи
                                    </button>
                                </li>

                                {/* Кнопка для админа */}
                                {user.role === 'admin' && (
                                    <li>
                                        <button
                                            onClick={handleInitTestDB}
                                            className="nav-link btn-warning"
                                        >
                                            Инициализировать БД
                                        </button>
                                    </li>
                                )}
                            </>
                        )}
                    </ul>
                </div>
            </nav>

            {/* Основное содержимое */}
            <main className="app-main">
                <div className="container">
                    {!user ? (
                        // Страницы для неавторизованных
                        <>
                            {currentPage === 'login' && (
                                <Login
                                    onLoginSuccess={handleLoginSuccess}
                                    onSwitchToRegister={() => setCurrentPage('register')}
                                    enums={enums}
                                />
                            )}
                            {currentPage === 'register' && (
                                <Register
                                    onRegisterSuccess={handleLoginSuccess}
                                    onSwitchToLogin={() => setCurrentPage('login')}
                                    enums={enums}
                                />
                            )}
                        </>
                    ) : (
                        // Страницы для авторизованных
                        <>
                            {currentPage === 'projects' && <ProjectList user={user} />}
                            {currentPage === 'tasks' && <TaskList user={user} />}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
