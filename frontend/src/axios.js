// Axios instance for API requests
import axios from 'axios';

const instance = axios.create({
    // Base URL for the API, from environment variable or local fallback
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    timeout: 60000, // Request timeout
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Send cookies with requests
});

// Add JWT token to every outgoing request
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Global error handling for responses
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error("Unauthorized request. Redirecting to login...");
            // Handle unauthorized actions, e.g., redirect to login page
        }
        return Promise.reject(error);
    }
);

export default instance;