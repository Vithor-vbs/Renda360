import React, { useState } from "react"
import "./ConfigTab.css"
import {
  CreditCard,
  DollarSign,
  Edit2,
  Trash2,
  PlusCircle,
  TrendingUp,
  Target,
  DollarSign as Dollar,
  Bell,
  Smartphone,
  AlertTriangle,
  Settings
} from "lucide-react"
import { AddCardModal } from "@/components/Cards/AddCardModal"

export const ConfigTab: React.FC = () => {
    const [cards, setCards] = useState([
        { id: "1", title: "Cartão Principal", number: "**** **** **** 3765", color: "#10b981" },
        { id: "2", title: "Cartão Reserva", number: "**** **** **** 8902", color: "#3b82f6" }
    ])

    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleSaveCard = (newCard: any) => {
        const formattedCard = {
            id: (cards.length + 1).toString(),
            title: newCard.name || "Novo Cartão",
            number: newCard.number ? newCard.number.replace(/\s(?=\d{4})/g, " ") : "** ** ** 0000",
            color: newCard.number.startsWith("5") ? "#3b82f6" : "#10b981"
        }
        setCards([...cards, formattedCard])
    }

    const handleDelete = (id: string) => {
        setCards(cards.filter(c => c.id !== id))
    }

    // === CONFIG FINANCEIRA ===
    const [financeConfig, setFinanceConfig] = useState({
        renda: "5000,00",
        tipoInvestidor: "Moderado",
        interesses: {
            crypto: true,
            rendaFixa: false,
            bolsa: true
        }
    })

    const toggleInterest = (key: keyof typeof financeConfig.interesses) => {
        setFinanceConfig(prev => ({
            ...prev,
            interesses: { ...prev.interesses, [key]: !prev.interesses[key] }
        }))
    }

    return (
        <>
            {/* === GERENCIAR CARTÕES === */}
            <section className="config-section">
                <h2 className="config-title">
                    <span className="config-icon"><CreditCard /></span>
                    Gerenciar Cartões
                </h2>

                <div className="card-list">
                    {cards.map((card) => (
                        <div className="card-item" key={card.id}>
                            <div className="card-color" style={{ background: card.color }} />
                            <div className="card-info">
                                <strong>{card.title}</strong>
                                <p>{card.number}</p>
                            </div>
                            <div className="card-actions">
                                <button className="btn-edit"><Edit2 size={16} /></button>
                                <button className="btn-delete" onClick={() => handleDelete(card.id)}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}

                    <button className="btn-add" onClick={() => setIsModalOpen(true)}>
                        <PlusCircle size={18} />
                        Adicionar Novo Cartão
                    </button>
                </div>
            </section>

            {/* === CONFIGURAÇÕES FINANCEIRAS === */}
            <section className="config-section financeiro">
                <h2 className="config-title">
                    <span className="config-icon"><DollarSign /></span>
                    Configurações Financeiras
                </h2>

                <div className="finance-container">
                    {/* ESQUERDA */}
                    <div className="finance-inputs">
                        <div className="finance-field field-income">   {/* <= add */}
                            <label>Renda mensal estimada (R$)</label>
                            <input type="text" value={financeConfig.renda} readOnly />
                        </div>

                        <div className="finance-field field-investor"> {/* <= add */}
                            <label>Tipo de investidor</label>
                            <select
                                value={financeConfig.tipoInvestidor}
                                onChange={(e) =>
                                    setFinanceConfig({ ...financeConfig, tipoInvestidor: e.target.value })
                                }
                            >
                                <option>Conservador</option>
                                <option>Moderado</option>
                                <option>Agressivo</option>
                            </select>
                        </div>
                    </div>
                    <div className="finance-interests">
                        <label>Tipos de investimento de interesse</label>

                        <div
                            className={`interest-item ${financeConfig.interesses.crypto ? "active" : ""}`}
                            onClick={() => toggleInterest("crypto")}
                        >
                            <TrendingUp size={18} />
                            <p>Crypto</p>
                            <div className={`switch ${financeConfig.interesses.crypto ? "on" : ""}`} />
                        </div>

                        <div
                            className={`interest-item ${financeConfig.interesses.rendaFixa ? "active" : ""}`}
                            onClick={() => toggleInterest("rendaFixa")}
                        >
                            <Target size={18} />
                            <p>Renda Fixa</p>
                            <div className={`switch ${financeConfig.interesses.rendaFixa ? "on" : ""}`} />
                        </div>

                        <div
                            className={`interest-item ${financeConfig.interesses.bolsa ? "active" : ""}`}
                            onClick={() => toggleInterest("bolsa")}
                        >
                            <Dollar size={18} />
                            <p>Bolsa</p>
                            <div className={`switch ${financeConfig.interesses.bolsa ? "on" : ""}`} />
                        </div>
                    </div>
                </div>
            </section>
            {/* === NOTIFICAÇÕES GERAIS === */}
            <section className="config-section">
                <h2 className="config-title">
                    <span className="config-icon"><Bell /></span>
                    Notificações Gerais
                </h2>

                <div className="notification-grid">
                    <div className="notification-item">
                        <div className="notif-left">
                            <Smartphone size={18} />
                            <div>
                                <strong>Notificação Geral</strong>
                                <p>Ativar ou desativar todas as notificações</p>
                            </div>
                        </div>
                        <div className="switch on"></div>
                    </div>

                    <div className="notification-item">
                        <div className="notif-left">
                            <Target size={18} />
                            <div>
                                <strong>Notificação de Metas</strong>
                                <p>Receba alertas sobre metas e progresso financeiro</p>
                            </div>
                        </div>
                        <div className="switch on"></div>
                    </div>

                    <div className="notification-item">
                        <div className="notif-left">
                            <AlertTriangle size={18} />
                            <div>
                                <strong>Notificação de Alertas</strong>
                                <p>Receba avisos sobre movimentações importantes</p>
                            </div>
                        </div>
                        <div className="switch"></div>
                    </div>

                    <div className="notification-item">
                        <div className="notif-left">
                            <Settings size={18} />
                            <div>
                                <strong>Notificações do Sistema</strong>
                                <p>Fique informado sobre atualizações e manutenções</p>
                            </div>
                        </div>
                        <div className="switch on"></div>
                    </div>
                </div>
            </section>


            <AddCardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveCard}
            />
        </>
    )
}
