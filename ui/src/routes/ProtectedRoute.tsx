import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  console.log("ProtectedRoute isAuthenticated:", isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
