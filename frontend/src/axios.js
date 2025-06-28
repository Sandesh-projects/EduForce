// frontend/src/axios.js
import axios from 'axios';

// Create an Axios instance
const instance = axios.create({
  // EXPLICITLY using your Render backend URL here to ensure connection
  // baseURL:'http://localhost:5000',
  baseURL: 'https://eduforce.onrender.com', // Your deployed Render backend URL
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
    // Log 401 Unauthorized errors, but don't redirect here.
    // Redirection/re-authentication should be handled by your AuthContext or specific components.
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized request detected (Axios Interceptor).");
      // You might want to trigger a logout/redirect here, but it's often better
      // to handle it higher up in your AuthContext or specific route guards.
    }
    return Promise.reject(error);
  }
);

export default instance;
