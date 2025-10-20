import React, { useEffect, useMemo, useRef, useState } from "react"
import "./settingsPage.css"
import { useAuth } from "@/context/AuthContext"
import ProfileTab, { UserProfile } from "./ProfileTab"
import { ConfigTab } from "./ConfigTab"
import { FinanceCard } from "@/components/Cards/CardFinance"

type UserSettings = { avatar?: string | null }

const SETTINGS_KEY = "userSettings"

const SettingsPage: React.FC = () => {
  const { loggedUser, loading } = useAuth()

  const [avatar, setAvatar] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [activeTab, setActiveTab] = useState<"perfil" | "config">("perfil")

  const name = loading ? "" : (loggedUser?.username ?? "Usuário")
  const email = loading ? "" : (loggedUser?.email ?? "")

  const [userData] = useState<UserProfile>({
    fullName: name,
    phone: "+55 (11) 99999-9999",
    email: email,
    location: "São Paulo, Brasil"
  })

  const [userCards] = useState<FinanceCard[]>([
    {
      id: "1",
      title: "Cartão Principal",
      balance: 26968,
      number: "** ** ** 3765",
      brand: "visa",
      color: "linear-gradient(135deg, #10b981, #0ea5e9)"
    },
    {
      id: "2",
      title: "Cartão Reserva",
      balance: 12450,
      number: "** ** ** 8902",
      brand: "mastercard",
      color: "linear-gradient(135deg, #6366f1, #3b82f6)"
    }
  ])

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
      const dataUrl = reader.result as string
      setAvatar(dataUrl)
      sessionStorage.setItem(SETTINGS_KEY, JSON.stringify({ avatar: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const initials = useMemo(() => (name?.trim()?.[0] ?? "U").toUpperCase(), [name])

  return (
    <div className="settings-content">
      <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />

      <section className="profile-card">
        <div className="avatar-wrap" onClick={onPickAvatar} role="button">
          <div className="avatar" style={avatar ? { backgroundImage: `url(${avatar})` } : undefined}>
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

      <nav className="tab-switch" role="tablist">
        <button className={`tab-btn ${activeTab === "perfil" ? "is-active" : ""}`} onClick={() => setActiveTab("perfil")}>
          Perfil
        </button>
        <button className={`tab-btn ${activeTab === "config" ? "is-active" : ""}`} onClick={() => setActiveTab("config")}>
          Configurações
        </button>
        <span
          className="tab-indicator"
          style={{ transform: activeTab === "perfil" ? "translateX(0)" : "translateX(100%)" }}
        />
      </nav>

      <div className="tab-content">
        {activeTab === "perfil" && <ProfileTab userData={userData} userCards={userCards} />}
        {activeTab === "config" && <ConfigTab />}
      </div>
    </div>
  )
}

export default SettingsPage
