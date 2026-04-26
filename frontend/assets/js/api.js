/**
 * api.js - Axios wrapper with JWT and error handling
 */

// We assume axios is included via CDN in the HTML files
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor for API Key / JWT
api.interceptors.request.use(config => {
    const token = localStorage.getItem('nod_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Response interceptor for global error handling
api.interceptors.response.use(response => {
    // Standardize response to return data directly if it's axios response
    return response.data ? response.data : response;
}, error => {
    if (error.response && error.response.status === 401) {
        // Handle unauthorized (e.g., redirect to login)
        console.warn('Unauthorized access, redirecting to login...');
        localStorage.removeItem('nod_token');
        
        // Prevent infinite redirect loops if we are already on login page
        if (!window.location.pathname.endsWith('login.html')) {
            window.location.href = '/pages/login.html';
        }
    }
    return Promise.reject(error);
});

window.api = api;
