import React, { useEffect, useState } from "react"
import "./ProfileTab.css"
import { User, Phone, Mail, Globe, CreditCard, Shield, Bell, HelpCircle } from "lucide-react"
import CardFinance, { FinanceCard } from "@/components/Cards/CardFinance"

// Tipos de dados vindos da API (ou do contexto)
export type UserProfile = {
  fullName: string
  phone: string
  email: string
  location: string
}

// exporta o tipo de props pra ser reconhecido fora
export type ProfileTabProps = {
  userData: UserProfile | null
  userCards: FinanceCard[] | null
}

const ProfileTab: React.FC<ProfileTabProps> = ({ userData, userCards }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [cards, setCards] = useState<FinanceCard[]>([])

  // simulação: ao integrar, isso virá via fetch/axios ou useAuth()
  useEffect(() => {
    if (userData) setProfile(userData)
    if (userCards) setCards(userCards)
  }, [userData, userCards])

  if (!profile) {
    return <p style={{ textAlign: "center", color: "#aaa" }}>Carregando informações...</p>
  }

  return (
    <>
      {/* === CARD 1: INFORMAÇÕES PESSOAIS + MEUS CARTÕES === */}
      <section className="info-section">
        <h2 className="info-title">
          <span className="title-icon"><User /></span>
          Informações Pessoais
        </h2>

        <div className="info-grid">
          <div className="info-card">
            <User className="info-icon" />
            <div>
              <span className="info-label">Nome Completo</span>
              <p className="info-value">{profile.fullName}</p>
            </div>
          </div>

          <div className="info-card">
            <Phone className="info-icon" />
            <div>
              <span className="info-label">Telefone</span>
              <p className="info-value">{profile.phone}</p>
            </div>
          </div>

          <div className="info-card">
            <Mail className="info-icon" />
            <div>
              <span className="info-label">Email</span>
              <p className="info-value">{profile.email}</p>
            </div>
          </div>

          <div className="info-card">
            <Globe className="info-icon" />
            <div>
              <span className="info-label">Localização</span>
              <p className="info-value">{profile.location}</p>
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* === MEUS CARTÕES === */}
        <h2
          className="info-title"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span className="title-icon"><CreditCard /></span>
            Meus Cartões
          </div>
        </h2>

        {cards.length > 0 ? (
          <div className="cards-grid">
            {cards.map((c) => (
              <CardFinance key={c.id} card={c} />
            ))}
          </div>
        ) : (
          <p style={{ color: "#9ca3af", fontSize: ".9rem" }}>Nenhum cartão cadastrado.</p>
        )}
      </section>

      {/* === CARD 2: CONFIGURAÇÕES GERAIS === */}
      <section className="info-section">
        <h2 className="info-title">
          <span className="title-icon"><Shield /></span>
          Configurações Gerais
        </h2>

        <div className="feature-grid">
          {[
            { icon: <Shield size={22} />, title: "Segurança", desc: "Gerencie suas configurações de segurança" },
            { icon: <Bell size={22} />, title: "Notificações", desc: "Configure suas preferências" },
            { icon: <HelpCircle size={22} />, title: "Suporte", desc: "Obtenha ajuda quando precisar" }
          ].map((f, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-sub">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default ProfileTab
