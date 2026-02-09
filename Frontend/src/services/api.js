import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh_token');

            if (!refreshToken) {
                logoutUser();
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${API_URL}/refresh`, {}, {
                    headers: {
                        'Authorization': `Bearer ${refreshToken}`
                    }
                });

                const newAccessToken = response.data.access_token;
                localStorage.setItem('access_token', newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                processQueue(null, newAccessToken);
                return api(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);
                logoutUser();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        if (error.response && error.response.status === 401) {
            logoutUser();
        }

        return Promise.reject(error);
    }
);

// Функция для выхода пользователя
const logoutUser = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    if (window.location.pathname !== '/') {
        window.location.href = '/';
    }
};

const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    try {
        const response = await axios.post(`${API_URL}/refresh`, {}, {
            headers: {
                'Authorization': `Bearer ${refreshToken}`
            }
        });

        const newAccessToken = response.data.access_token;
        localStorage.setItem('access_token', newAccessToken);

        return newAccessToken;
    } catch (error) {
        logoutUser();
        throw error;
    }
};

export const systemAPI = {
    health: () => api.get('/health'),
    enums: () => api.get('/enums'),
    initTestDB: () => api.post('/init-db'),
    dbStats: () => api.get('/db-stats')
};

export const authAPI = {
    register: (userData) => api.post('/register', userData),
    login: (userData) => api.post('/login', userData),
    refresh: () => api.post('/refresh'),
    logout: () => api.post('/logout'),
    verify: () => api.get('/auth/verify')
};

export const usersAPI = {
    get_users: () => api.get('/users'),
    get_user: (id) => api.get(`/users/${id}`)
};

export const projectAPI = {
    get_projects: () => api.get('/projects'),
    get_project: (id) => api.get(`/projects/${id}`),
    create_project: (projectData) => api.post('/projects', projectData),
    update_project: (id, projectData) => api.put(`/projects/${id}`, projectData),
    delete_project: (id) => api.delete(`/projects/${id}`),

    get_project_members: (project_id) => api.get(`/projects/${project_id}/members`),
    add_project_member: (project_id, member_data) => api.post(`/projects/${project_id}/members`, member_data),
    update_project_member_role: (project_id, member_id, data) => api.put(`/projects/${project_id}/members/${member_id}`, data),
    delete_project_member: (project_id, member_id) => api.delete(`/projects/${project_id}/members/${member_id}`)
};

export const taskAPI = {
    get_tasks: (params = {}) => {
        const cleanParams = {};
        Object.keys(params).forEach(key => {
            if (params[key] !== '' && params[key] != null) {
                cleanParams[key] = params[key];
            }
        });
        return api.get('/tasks', { params: cleanParams });
    },
    get_task: (id) => api.get(`/tasks/${id}`),
    create_task: (taskData) => api.post('/tasks', taskData),
    update_task: (id, taskData) => api.put(`/tasks/${id}`, taskData),
    delete_task: (id) => api.delete(`/tasks/${id}`),
    assign_task: (id, data) => api.post(`/tasks/${id}/assignees`, data)
};

export { refreshAccessToken, logoutUser };

export default api;
