import React, { useEffect, useMemo, useRef, useState } from "react";
import "./settingsPage.css";
import UserCard from "../../microFront/userCard/userCard";
import { useAuth } from "@/context/AuthContext";

type InvestorType = "conservador" | "moderado" | "arriscado";
type Interests = { crypto: boolean; renda_fixa: boolean; bolsa: boolean };

type UserSettings = {
  avatar?: string | null;
  income?: string;
  investorType?: InvestorType;
  interests?: Interests;
  disableNotifications?: boolean;
};

const SETTINGS_KEY = "userSettings";

const settingsPage: React.FC = () => {
  const { loggedUser, loading } = useAuth();

  const name = loading ? "" : loggedUser?.username ?? "Usuário";
  const subtitle = loading ? "" : loggedUser?.email ?? "";

  const [avatar, setAvatar] = useState<string | null>(null);
  const [income, setIncome] = useState<string>("");
  const [investorType, setInvestorType] = useState<InvestorType>("moderado");
  const [interests, setInterests] = useState<Interests>({
    crypto: false,
    renda_fixa: false,
    bolsa: false,
  });
  const [disableNotifications, setDisableNotifications] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string>("");

  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed: UserSettings = JSON.parse(raw);
        if (parsed.avatar) setAvatar(parsed.avatar);
        if (parsed.income) setIncome(parsed.income);
        if (parsed.investorType) setInvestorType(parsed.investorType);
        if (parsed.interests) setInterests(parsed.interests);
        if (typeof parsed.disableNotifications === "boolean")
          setDisableNotifications(parsed.disableNotifications);
      }
    } catch {}
  }, []);

  const onPickAvatar = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar((reader.result as string) || null);
    reader.readAsDataURL(file);
  };

  const toggleInterest = (key: keyof Interests) =>
    setInterests((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => {
    const payload: UserSettings = {
      avatar,
      income: income.trim(),
      investorType,
      interests,
      disableNotifications,
    };
    sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    setSavedMsg("Configurações salvas!");
    setTimeout(() => setSavedMsg(""), 2500);
  };

  const userCardProps = useMemo(
    () => ({
      name,
      subtitle,
      ...(avatar ? { avatarUrl: avatar } : {}),
    }),
    [name, subtitle, avatar]
  );

  return (
    <div className="settings-content">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        style={{ display: "none" }}
      />

      <div
        className="settings-card-center settings-profile-click"
        onClick={onPickAvatar}
      >
        <UserCard {...userCardProps} />
      </div>

      <div className="settings-panel">
        <h3>Configurações</h3>

        <div className="form-grid">
          <div className="form-row" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="income">Renda mensal estimada (R$)</label>
            <input
              id="income"
              className="form-input"
              type="number"
              inputMode="decimal"
              step="100"
              placeholder="Ex.: 5000.00"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
            />
          </div>

          <div className="form-row" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="investorType">Tipo de investidor</label>
            <select
              id="investorType"
              className="form-select"
              value={investorType}
              onChange={(e) => setInvestorType(e.target.value as InvestorType)}
            >
              <option value="conservador">Conservador</option>
              <option value="moderado">Moderado</option>
              <option value="arriscado">Arriscado</option>
            </select>
          </div>

          <div className="form-row" style={{ gridColumn: "1 / -1" }}>
            <label>Tipos de investimento de interesse</label>
            <div className="check-row">
              <label className="check-item">
                <input
                  type="checkbox"
                  checked={interests.crypto}
                  onChange={() => toggleInterest("crypto")}
                />
                <span>Crypto</span>
              </label>

              <label className="check-item">
                <input
                  type="checkbox"
                  checked={interests.renda_fixa}
                  onChange={() => toggleInterest("renda_fixa")}
                />
                <span>Renda fixa</span>
              </label>

              <label className="check-item">
                <input
                  type="checkbox"
                  checked={interests.bolsa}
                  onChange={() => toggleInterest("bolsa")}
                />
                <span>Bolsa</span>
              </label>
            </div>
          </div>

          <div className="form-row" style={{ gridColumn: "1 / -1" }}>
            <div className="switch-row">
              <input
                id="disableNotifications"
                type="checkbox"
                checked={disableNotifications}
                onChange={(e) => setDisableNotifications(e.target.checked)}
              />
              <label htmlFor="disableNotifications">Desativar notificações</label>
            </div>
          </div>
        </div>

        <button className="btn-save" onClick={handleSave}>
          Salvar preferências
        </button>
        {savedMsg && <div className="save-msg">{savedMsg}</div>}
      </div>
    </div>
  );
};

export default settingsPage;
