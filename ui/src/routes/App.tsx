import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import HomeWithAPI from "../microFront/home/HomeWithAPI";
import TransactionsPageWithAPI from "../microFront/transactions/TransactionsPageWithAPI";
import NotificationPage from "../microFront/notification/NotificationPage";
import ExtractFilePage from "../microFront/extractorFile/ExtractFilePage";
import LoginPage from "../microFront/Auth/Login/LoginPage";
import RegisterPage from "../microFront/Auth/Register/RegisterPage";
import ProtectedRoute from "./ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import { JuliusProvider } from "@/context/JuliusContext";
import { NotificationProvider } from "@/context/NotificationService";
import SettingsPage from "@/microFront/settings/settingsPage";

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <JuliusProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/home" element={<HomeWithAPI />} />
                  <Route
                    path="/transactions"
                    element={<TransactionsPageWithAPI />}
                  />
                  <Route path="/notification" element={<NotificationPage />} />
                  <Route path="/extractor" element={<ExtractFilePage />} />
                  <Route path="/settingsPage" element={<SettingsPage />} />
                </Route>
              </Route>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </JuliusProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
