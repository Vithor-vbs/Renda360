import React, { useRef, useState } from "react";

interface AuthDialogProps {
  isRegisterPage?: boolean;
  onSubmit: (fields: Record<string, string>) => void;
  onFocusEffect?: (active: boolean) => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({
  isRegisterPage = false,
  onSubmit,

  onFocusEffect,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const focusCount = useRef(0);

  const handleFocus = () => {
    focusCount.current += 1;
    onFocusEffect?.(true);
  };

  const handleBlur = () => {
    focusCount.current -= 1;
    if (focusCount.current <= 0) {
      onFocusEffect?.(false);
      focusCount.current = 0;
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setName(e.target.value);
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEmail(e.target.value);
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPassword(e.target.value);
  const handleRepeatPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setRepeatPassword(e.target.value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);

    if (isRegisterPage && password !== repeatPassword) {
      // Block submit if passwords don't match
      return;
    }

    if (isRegisterPage) {
      onSubmit({
        name,
        email,
        password,
        repeatPassword,
      });
    } else {
      onSubmit({
        email,
        password,
      });
    }
  };

  return (
    <div className="form-container">
      <h1
        className="text-2xl font-bold mb-2"
        style={{
          borderBottom: "1px solid #1ea896",
          display: "inline-block",
          paddingBottom: "30px",
        }}
      >
        {isRegisterPage
          ? "Crie sua conta financeira em segundos."
          : "Acesse seu painel financeiro com um clique."}
      </h1>
      <form className="form" onSubmit={handleSubmit}>
        {isRegisterPage && (
          <div className="form-group">
            <label htmlFor="name">Nome</label>
            <input
              name="name"
              id="name"
              type="text"
              value={name}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleNameChange}
              required
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            required
            name="email"
            id="email"
            type="text"
            value={email}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleEmailChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handlePasswordChange}
            required
          />
        </div>
        {isRegisterPage && (
          <div className="form-group">
            <label htmlFor="repeatPassword">Repita a senha</label>
            <input
              id="repeatPassword"
              name="repeatPassword"
              type="password"
              value={repeatPassword}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleRepeatPasswordChange}
              required
            />
            {wasSubmitted && password !== repeatPassword && (
              <span
                style={{
                  color: "#e53935",
                  fontSize: "0.85em",
                  marginTop: 4,
                  display: "block",
                }}
              >
                As senhas não coincidem.
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-10">
          <button type="submit" className="form-submit-btn">
            {isRegisterPage ? "Registre-se" : "Entrar"}
          </button>
          {!isRegisterPage && (
            <a
              className="flex flex-col text-[#1ea896] text-sm"
              href="/register"
            >
              <span>Não possui conta?</span>
              <span>Registre-se!</span>
            </a>
          )}
        </div>
      </form>
    </div>
  );
};
