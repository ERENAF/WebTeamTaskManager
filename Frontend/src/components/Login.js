import React, { useState } from 'react';
import { authAPI } from '../services/api';
import '../styles/login.css';

function Login({ onLoginSuccess, onSwitchToRegister, enums }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login({ email, password });

            onLoginSuccess(response.data);

        } catch (err) {
            if (err.response) {
                setError(err.response.data.error || 'Ошибка входа');
            } else if (err.request) {
                setError('Нет ответа от сервера. Проверьте подключение.');
            } else {
                setError('Произошла ошибка: ' + err.message);
            }
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2 className="login-title">Вход в систему</h2>

            {/* Сообщение об ошибке */}
            {error && (
                <div className="login-error">
                    {error}
                </div>
            )}

            {/* Форма входа */}
            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="form-input"
                        placeholder="Введите ваш email"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Пароль:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="form-input"
                        placeholder="Введите пароль"
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    className="login-btn"
                    disabled={loading}
                >
                    {loading ? 'Вход...' : 'Войти'}
                </button>
            </form>

            {/* Ссылка на регистрацию */}
            <div className="register-link">
                Нет аккаунта?{' '}
                <button
                    onClick={onSwitchToRegister}
                    type="button"
                    disabled={loading}
                >
                    Зарегистрироваться
                </button>
            </div>
        </div>
    );
}

export default Login;
