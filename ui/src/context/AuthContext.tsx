import { createContext, useContext, useState, useEffect } from "react";
import axios from "../api/axios";

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  loggedUser: string | null;
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggedUser, setLoggedUser] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        const fetchLoggedUser = await axios.get("/protected", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIsAuthenticated(true);
        setLoggedUser(fetchLoggedUser.data.logged_in_as);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
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
