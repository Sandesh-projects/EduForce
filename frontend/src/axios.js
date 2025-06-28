// frontend/src/axios.js
import axios from 'axios';

// Create an Axios instance
const instance = axios.create({
  // Use VITE_API_BASE_URL from environment variables for deployment.
  // Fallback to 'http://localhost:5000' for local development.
  // baseURL:'http://localhost:5000',
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to attach the JWT token to every outgoing request
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

// Response interceptor for global error handling
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized request. Redirecting to login...");
    }
    return Promise.reject(error);
  }
);

export default instance;