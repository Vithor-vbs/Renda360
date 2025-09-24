import { User } from "./types";
import api from "./axios";

export class UserService {
  /**
   * Get user profile by ID
   */
  static async getUserById(userId: number): Promise<User> {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }

  /**
   * Update user profile
   */
  static async updateUser(
    userId: number,
    userData: Partial<User>
  ): Promise<User> {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  }

  /**
   * Update user password
   */
  static async updatePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await api.put(`/users/${userId}/password`, {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  /**
   * Delete user account
   */
  static async deleteUser(userId: number): Promise<void> {
    await api.delete(`/users/${userId}`);
  }

  /**
   * Get user preferences/settings
   */
  static async getUserPreferences(userId: number): Promise<{
    notifications: boolean;
    email_alerts: boolean;
    theme: "light" | "dark" | "auto";
    language: string;
    currency: string;
  }> {
    const response = await api.get(`/users/${userId}/preferences`);
    return response.data;
  }

  /**
   * Update user preferences/settings
   */
  static async updateUserPreferences(
    userId: number,
    preferences: {
      notifications?: boolean;
      email_alerts?: boolean;
      theme?: "light" | "dark" | "auto";
      language?: string;
      currency?: string;
    }
  ): Promise<void> {
    await api.put(`/users/${userId}/preferences`, preferences);
  }
}
