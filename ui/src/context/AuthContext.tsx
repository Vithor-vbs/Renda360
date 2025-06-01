import { createContext, useContext, useState, useEffect } from "react";
import axios from "../api/axios";

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  loggedUser: User | null;
  login: (access_token: string, refresh_token: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  loggedUser: null,
  login: async () => false,
  logout: () => {},
  refreshToken: async () => false,
});

interface User {
  id: string;
  username: string;
  email: string;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggedUser, setLoggedUser] = useState<User | null>(null);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      console.log("Token being sent to /protected:", token);
      // Get user id from /protected
      const fetchLoggedUser = await axios.get("/protected", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userId = fetchLoggedUser.data.logged_user_id;
      // Fetch full user object
      const userResponse = await axios.get(`/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setIsAuthenticated(true);
      setLoggedUser(userResponse.data);
    } catch (error) {
      setIsAuthenticated(false);
      setLoggedUser(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (access_token: string, refresh_token: string) => {
    try {
      console.log("Attempting to log in with tokens:", {
        access_token,
        refresh_token,
      });

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      setIsAuthenticated(true);
      await checkAuth();
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsAuthenticated(false);
    setLoggedUser(null);
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      const response = await axios.post(
        "refresh",
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );
      localStorage.setItem("access_token", response.data.access_token);
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        refreshToken,
        loading,
        loggedUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
