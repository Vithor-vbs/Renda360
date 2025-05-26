import axios from "axios";
import { useAuth } from "../context/AuthContext";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Check if response exists
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken } = useAuth();
      const success = await refreshToken();
      if (success) {
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);
export default api;
