import axios  from "axios";

const API_URL = 'http://localhost:5000/api'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type':'application/json'
    }
});

api.interceptors.request.use((config) =>{
    const token = localStorage.getItem('token');
    if (token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) =>{
        if (error.response && error.response.status == 401){
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

//разработка
export const systemAPI = {
    health : () => api.get(`/health`),
    enums : () => api.get(`/enums`),
    initTestDB : () => api.get(`/init-db`)
};

export const authAPI = {
    register: async (userData) => {
        const response = await api.post(`/register`, userData);
        return response;
    },
    login: async (userData) => {
        const response = await api.post(`/login`, userData);
        return response;
    }
};

export const usersAPI ={
    get_users: () => api.get(`/users`),
    get_user: (id) => api.get(`/users/${id}`)
};

export const projectAPI = {
    get_projects: () => api.get(`/projects`),
    get_project: (id) => api.get(`/projects/${id}`),
    create_project: (projectData) => api.post(`/projects`,projectData),
    update_project: (id,projectData) => api.put(`/projects/${id}`,projectData),
    delete_project: (id) => api.delete(`/projects/${id}`),

    get_project_members : (project_id) => api.get(`/projects/${project_id}/members`),
    add_project_member : (project_id, member_data) => api.post(`/projects/${project_id}/members`,member_data),
    update_project_member_role : (project_id,member_id, data) => api.put(`/projects/${project_id}/members/${member_id}`,data),
    delete_project_member : (project_id,member_id) => api.delete(`/projects/${project_id}/members/${member_id}`)
};

export const taskAPI = {
    get_tasks: () => api.get(`/tasks`),
    create_task: (taskData) => api.post(`/tasks`,taskData),
    get_task: (id) => api.get(`/task/${id}`),
    update_task : (id, taskData) => api.put(`/projects/${id}`,taskData),
    delete_task : (id) => api.delete(`/tasks/${id}`),
    assign_task : (id,data) => api.post(`/tasks/${id}/assignees`,data)
};

export const helperAPI = {
    checkAvailability: async () => {
        try {
            await systemAPI.health();
            return { available: true, message: 'API доступен' };
        } catch (error) {
            return {
                available: false,
                message: 'API недоступен',
                error: error.message
            };
        }
    },

    getEnumsForForms: async () => {
        const response = await systemAPI.enums();
        const data = response.data;

        return {
            priorities: [
                { value: 'None', label: 'Без приоритета' },
                { value: 'Low', label: 'Низкий' },
                { value: 'Medium', label: 'Средний' },
                { value: 'High', label: 'Высокий' },
                { value: 'Critical', label: 'Критический' }
            ],
            categories: [
                { value: 'None', label: 'Без категории' },
                { value: 'Bug', label: 'Ошибка' },
                { value: 'Feature', label: 'Функция' },
                { value: 'Improvement', label: 'Улучшение' },
                { value: 'Documentation', label: 'Документация' }
            ],
            statuses: [
                { value: 'None', label: 'Не задан' },
                { value: 'ToDo', label: 'К выполнению' },
                { value: 'InProgress', label: 'В работе' },
                { value: 'Review', label: 'На проверке' },
                { value: 'Done', label: 'Выполнено' }
            ],
            colors: [
                { value: '#FFFFFF', label: 'Белый' },
                { value: '#000000', label: 'Черный' },
                { value: '#FF0000', label: 'Красный' },
                { value: '#00FF00', label: 'Зеленый' },
                { value: '#0000FF', label: 'Синий' },
                { value: '#FFFF00', label: 'Желтый' },
                { value: '#FFA500', label: 'Оранжевый' },
                { value: '#800080', label: 'Фиолетовый' }
            ],
            userRoles: [
                { value: 'admin', label: 'Администратор' },
                { value: 'client', label: 'Пользователь' }
            ]
        };
    }
};

export default api;
