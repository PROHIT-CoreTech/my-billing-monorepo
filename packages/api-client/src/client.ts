import axios from 'axios';

const getInitialBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }
  return 'http://localhost:5001/api';
};

export const apiClient = axios.create({
  baseURL: getInitialBaseUrl(),
  timeout: 120000, // 120 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to update the base URL dynamically at runtime (useful for mobile settings or environment switches)
export const setApiBaseUrl = (url: string) => {
  apiClient.defaults.baseURL = url;
};

// Global active request tracking
let activeRequests = 0;

const startRequest = () => {
  activeRequests++;
  if (activeRequests === 1 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('apiClient:loading', { detail: true }));
  }
};

const endRequest = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('apiClient:loading', { detail: false }));
  }
};

// Request interceptor (e.g. for injecting Auth tokens if added in the future)
apiClient.interceptors.request.use(
  (config) => {
    startRequest();
    return config;
  },
  (error) => {
    endRequest();
    return Promise.reject(error);
  }
);

// Response interceptor (to clear loading state when requests finish or fail)
apiClient.interceptors.response.use(
  (response) => {
    endRequest();
    return response;
  },
  (error) => {
    endRequest();
    return Promise.reject(error);
  }
);
