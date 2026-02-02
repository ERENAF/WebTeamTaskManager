import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import '../styles/register.css';

function Register({ onRegisterSuccess, onSwitchToLogin, enums }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'client'
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordMatch, setPasswordMatch] = useState(true);

    useEffect(() => {
        if (formData.password && formData.confirmPassword) {
            setPasswordMatch(formData.password === formData.confirmPassword);
        }
    }, [formData.password, formData.confirmPassword]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!passwordMatch) {
            setError('Пароли не совпадают');
            return;
        }

        if (formData.password.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            return;
        }

        setLoading(true);

        try {
            const userData = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                confirm_password: formData.confirmPassword,
                role: formData.role
            };

            const response = await authAPI.register(userData);

            onRegisterSuccess(response.data);

        } catch (err) {
            if (err.response) {
                setError(err.response.data.error || 'Ошибка регистрации');
            } else if (err.request) {
                setError('Нет ответа от сервера. Проверьте подключение.');
            } else {
                setError('Произошла ошибка: ' + err.message);
            }
            console.error('Register error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <h2 className="register-title">Регистрация</h2>

            {/* Сообщение об ошибке */}
            {error && (
                <div className="login-error">
                    {error}
                </div>
            )}

            {/* Форма регистрации */}
            <form onSubmit={handleSubmit} className="register-form">
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="username">Имя пользователя:</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            minLength="3"
                            maxLength="64"
                            className="form-input"
                            placeholder="Введите имя"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="role">Роль:</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="form-select"
                            disabled={loading}
                        >
                            {enums?.userRoles?.map(role => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            )) || (
                                <>
                                    <option value="client">Пользователь</option>
                                    <option value="admin">Администратор</option>
                                </>
                            )}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="form-input"
                        placeholder="Введите ваш email"
                        disabled={loading}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="password">Пароль:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength="6"
                            className="form-input"
                            placeholder="Введите пароль"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Подтвердите пароль:</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="form-input"
                            placeholder="Повторите пароль"
                            disabled={loading}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="register-btn"
                    disabled={loading || !passwordMatch}
                >
                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
            </form>

            {/* Ссылка на вход */}
            <div className="login-link">
                Уже есть аккаунт?{' '}
                <button
                    onClick={onSwitchToLogin}
                    type="button"
                    disabled={loading}
                >
                    Войти
                </button>
            </div>
        </div>
    );
}

export default Register;
