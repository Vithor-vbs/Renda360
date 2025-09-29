import React, { useEffect, useMemo, useRef, useState } from "react"
import "./settingsPage.css"
import { useAuth } from "@/context/AuthContext"
import { User, Phone, Mail, Globe } from "lucide-react"

type UserSettings = {
  avatar?: string | null
}

const SETTINGS_KEY = "userSettings"

const SettingsPage: React.FC = () => {
  const { loggedUser, loading } = useAuth()

  const name = loading ? "" : (loggedUser?.username ?? "Usuário")
  const email = loading ? "" : (loggedUser?.email ?? "")

  const [avatar, setAvatar] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [activeTab, setActiveTab] = useState<"perfil" | "config">("perfil")

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SETTINGS_KEY)
      if (raw) {
        const parsed: UserSettings = JSON.parse(raw)
        if (parsed.avatar) setAvatar(parsed.avatar)
      }
    } catch {}
  }, [])

  const onPickAvatar = () => fileRef.current?.click()

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = (reader.result as string) || null
      setAvatar(dataUrl)

      try {
        const current = sessionStorage.getItem(SETTINGS_KEY)
        const parsed = current ? (JSON.parse(current) as UserSettings) : {}
        sessionStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...parsed, avatar: dataUrl }))
      } catch {}
    }
    reader.readAsDataURL(file)
  }

  const initials = useMemo(() => (name?.trim()?.[0] ?? "U").toUpperCase(), [name])

  return (
    <div className="settings-content">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        style={{ display: "none" }}
      />

      {/* CARD DE PERFIL */}
      <section className="profile-card">
        <div
          className="avatar-wrap"
          onClick={onPickAvatar}
          role="button"
          aria-label="Alterar foto do perfil"
        >
          <div
            className="avatar"
            style={avatar ? { backgroundImage: `url(${avatar})` } : undefined}
          >
            {!avatar && <span className="avatar-initial">{initials}</span>}
          </div>
        </div>

        <div className="profile-info">
          <h1 className="profile-name">{name}</h1>
          <p className="profile-email">{email}</p>

          <div className="profile-badges">
            <span className="badge badge--role">Investidor Moderado</span>
          </div>
        </div>
      </section>

      {/* SWITCH PERFIL | CONFIGURAÇÕES */}
      <nav className="tab-switch" role="tablist" aria-label="Seções do perfil">
        <button
          role="tab"
          aria-selected={activeTab === "perfil" ? "true" : "false"}
          className={`tab-btn ${activeTab === "perfil" ? "is-active" : ""}`}
          onClick={() => setActiveTab("perfil")}
        >
          Perfil
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "config" ? "true" : "false"}
          className={`tab-btn ${activeTab === "config" ? "is-active" : ""}`}
          onClick={() => setActiveTab("config")}
        >
          Configurações
        </button>
        <span
          className="tab-indicator"
          style={{
            transform: activeTab === "perfil" ? "translateX(0)" : "translateX(100%)",
          }}
        />
      </nav>

      {/* CONTEÚDO DAS ABAS */}
      <div className="tab-content">
        {activeTab === "perfil" && (
          <section className="info-section">
            <h2 className="info-title">
              <span className="title-icon">
                <User className="w-5 h-5" />
              </span>
              Informações Pessoais
            </h2>

            <div className="info-grid">
              <div className="info-card">
                <span className="info-icon">
                  <User className="w-4 h-4" />
                </span>
                <div>
                  <span className="info-label">Nome Completo</span>
                  <p className="info-value">{name}</p>
                </div>
              </div>

              <div className="info-card">
                <span className="info-icon">
                  <Phone className="w-4 h-4" />
                </span>
                <div>
                  <span className="info-label">Telefone</span>
                  <p className="info-value">+55 (11) 99999-9999</p>
                </div>
              </div>

              <div className="info-card">
                <span className="info-icon">
                  <Mail className="w-4 h-4" />
                </span>
                <div>
                  <span className="info-label">Email</span>
                  <p className="info-value">{email}</p>
                </div>
              </div>

              <div className="info-card">
                <span className="info-icon">
                  <Globe className="w-4 h-4" />
                </span>
                <div>
                  <span className="info-label">Localização</span>
                  <p className="info-value">São Paulo, Brasil</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default SettingsPage
