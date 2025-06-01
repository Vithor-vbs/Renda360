import React, { useState } from "react";
import { StyledWrapper } from "../StyledAuth";
import { AuthDialog } from "../AuthDialog";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "../../../api/axios";
import { useNotification } from "@/context/NotificationService";

const LoginPage = () => {
  const [isActiveEffect, setIsActiveEffect] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { notifyError } = useNotification();

  const handleSubmit = async (fields: Record<string, string>) => {
    try {
      const response = await axios.post("/login", {
        email: fields.email,
        password: fields.password,
      });

      const { access_token, refresh_token } = response.data;
      const success = await login(access_token, refresh_token);
      if (!success) {
        notifyError("Login falhou, tokens não recebidos");
        console.error("Login failed, tokens not received");
        return;
      }
      console.log("Login response:", response.data);
      navigate("/home", { state: { registrationSuccess: true } });
    } catch (err) {
      notifyError("Erro ao fazer login, verifique suas credenciais");
      console.error("Login error:", err);
    }
  };

  return (
    <StyledWrapper $activeEffect={isActiveEffect}>
      <section className="flex flex-col items-center justify-center min-h-screen bg-background parent-container">
        <AuthDialog onSubmit={handleSubmit} onFocusEffect={setIsActiveEffect} />
      </section>
    </StyledWrapper>
  );
};

export default LoginPage;
