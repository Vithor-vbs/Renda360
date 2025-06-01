import React, { useState } from "react";
import { StyledWrapper } from "../StyledAuth";
import { AuthDialog } from "../AuthDialog";
import axios from "../../../api/axios";
import { useNavigate } from "react-router-dom";
import { useNotification } from "@/context/NotificationService";

const RegisterPage = () => {
  const [isActiveEffect, setIsActiveEffect] = useState(false);
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();

  const handleSubmit = async (fields: Record<string, string>) => {
    if (fields.password !== fields.repeatPassword) {
      notifyError("Passwords don't match");
      return;
    }
    try {
      await axios.post("/register", {
        username: fields.name,
        email: fields.email,
        password: fields.password,
      });

      // redirect to login after successful registration
      notifySuccess(
        "Registro realizado com sucesso! Faça login para continuar."
      );
      navigate("/login", { state: { registrationSuccess: true } });
    } catch (err) {
      notifyError("Erro ao registrar, verifique os dados fornecidos");
      console.error("Registration error:", err);
    }
  };

  return (
    <StyledWrapper $activeEffect={isActiveEffect}>
      <section className="flex flex-col items-center justify-center min-h-screen bg-background parent-container">
        <AuthDialog
          isRegisterPage
          onSubmit={handleSubmit}
          onFocusEffect={setIsActiveEffect}
        />
      </section>
    </StyledWrapper>
  );
};

export default RegisterPage;
