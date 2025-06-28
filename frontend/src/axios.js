// frontend/src/axios.js
import axios from 'axios';

// Create an Axios instance
const instance = axios.create({
  // HARDCODED: Base URL is now your deployed Render backend URL
  baseURL: 'https://eduforce.onrender.com',
  timeout: 60000, // Request timeout in milliseconds (e.g., 60 seconds for large PDF uploads)
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies if your backend uses them (though JWT is often stateless)
});

// Request interceptor to attach the JWT token to every outgoing request
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Get token from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Attach token as Bearer
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling (optional but good practice)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error codes globally, e.g., redirect to login on 401
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized request. Redirecting to login...");
      // For now, just a console log. You might want to reload or navigate.
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;