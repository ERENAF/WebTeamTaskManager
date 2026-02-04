import React, { useState, useEffect } from 'react';
import { systemAPI, authAPI, refreshAccessToken } from './services/api';
import Login from './components/Login';
import Register from './components/Register';
import ProjectList from './components/ProjectList';
import Project from './components/Project';
import './styles/app.css';

function App() {
    const [user, setUser] = useState(null);
    const [currentPage, setCurrentPage] = useState('login');
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            await systemAPI.health();

            const savedUser = localStorage.getItem('user');
            const savedAccessToken = localStorage.getItem('access_token');
            const savedRefreshToken = localStorage.getItem('refresh_token');

            if (savedUser && savedAccessToken && savedRefreshToken) {
                try {
                    setUser(JSON.parse(savedUser));
                    setCurrentPage('projects');
                } catch (error) {
                    try {
                        await refreshAccessToken();
                        setUser(JSON.parse(savedUser));
                        setCurrentPage('projects');
                    } catch (refreshError) {
                        handleLogout();
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка инициализации:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoginSuccess = (responseData) => {
        const { user, access_token, refresh_token } = responseData;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        setUser(user);
        setCurrentPage('projects');
    };

    const handleLogout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.warn('Ошибка при логауте:', error);
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
            setSelectedProject(null);
            setCurrentPage('login');
        }
    };

    const handleSelectProject = (project) => {
        setSelectedProject(project);
        setCurrentPage('project');
    };

    const handleBackToProjects = () => {
        setSelectedProject(null);
        setCurrentPage('projects');
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <h2>Загрузка...</h2>
            </div>
        );
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-content">
                    <h1 className="logo">Task Manager</h1>

                    {user && (
                        <div className="user-info">
                            <span className="username">
                                {user.username} ({user.role})
                            </span>
                            <button onClick={handleLogout} className="btn logout-btn">
                                Выйти
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="app-main">
                {!user ? (
                    <>
                        {currentPage === 'login' && (
                            <Login
                                onLoginSuccess={handleLoginSuccess}
                                onSwitchToRegister={() => setCurrentPage('register')}
                            />
                        )}
                        {currentPage === 'register' && (
                            <Register
                                onRegisterSuccess={handleLoginSuccess}
                                onSwitchToLogin={() => setCurrentPage('login')}
                            />
                        )}
                    </>
                ) : (
                    <>
                        {currentPage === 'projects' && (
                            <ProjectList
                                user={user}
                                onSelectProject={handleSelectProject}
                            />
                        )}

                        {currentPage === 'project' && selectedProject && (
                            <Project
                                project={selectedProject}
                                user={user}
                                onBack={handleBackToProjects}
                            />
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default App;
