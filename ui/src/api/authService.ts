import api from "./axios";
import { User, AuthResponse } from "./types";

export class AuthService {
  static async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post("/login", { email, password });

    // Store tokens
    if (response.data.access_token) {
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);
    }

    return response.data;
  }

  static async register(
    username: string,
    email: string,
    password: string
  ): Promise<AuthResponse> {
    const response = await api.post("/register", { username, email, password });

    // Store tokens
    if (response.data.access_token) {
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);
    }

    return response.data;
  }

  static async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) return false;

      const response = await api.post(
        "/refresh",
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );

      if (response.data.access_token) {
        localStorage.setItem("access_token", response.data.access_token);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }

  static async getProfile(): Promise<User> {
    const response = await api.get("/protected");
    return response.data;
  }

  static logout(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  static isAuthenticated(): boolean {
    return !!localStorage.getItem("access_token");
  }

  static getToken(): string | null {
    return localStorage.getItem("access_token");
  }
}
