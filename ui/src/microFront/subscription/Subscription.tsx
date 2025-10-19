"use client"

import { useState, useEffect } from "react"
import { DashboardService } from "../../api/dashboardService"
import { Subscription, SubscriptionsResponse } from "../../api/types"
import "./Subscription.css"

interface SubscriptionWithState extends Subscription {
  isPaid: boolean
  color: string
  isMock?: boolean
}

const getColorForMerchant = (merchant: string): string => {
  const colors: { [key: string]: string } = {
    netflix: "#e50914",
    spotify: "#1db954",
    amazon: "#ff9900",
    disney: "#113ccf",
    youtube: "#ff0000",
    google: "#4285f4",
    apple: "#000000",
    default: "#6366f1",
  }

  const merchantLower = merchant.toLowerCase()
  for (const [key, color] of Object.entries(colors)) {
    if (merchantLower.includes(key)) {
      return color
    }
  }
  return colors.default
}

const mockSubscriptions: Subscription[] = [
  {
    merchant: "Netflix",
    average_amount: 45.90,
    frequency: 3,
    total_months: 3,
    average_day_of_month: 15,
    category: "subscriptions",
    first_charge: "2025-01-15",
    last_charge: "2025-03-15",
    total_spent: 137.70,
    transactions: []
  },
  {
    merchant: "Spotify",
    average_amount: 21.90,
    frequency: 3,
    total_months: 3,
    average_day_of_month: 10,
    category: "subscriptions",
    first_charge: "2025-01-10",
    last_charge: "2025-03-10",
    total_spent: 65.70,
    transactions: []
  },
  {
    merchant: "Amazon Prime",
    average_amount: 14.90,
    frequency: 3,
    total_months: 3,
    average_day_of_month: 20,
    category: "subscriptions",
    first_charge: "2025-01-20",
    last_charge: "2025-03-20",
    total_spent: 44.70,
    transactions: []
  },
  {
    merchant: "Disney+",
    average_amount: 33.90,
    frequency: 2,
    total_months: 2,
    average_day_of_month: 25,
    category: "subscriptions",
    first_charge: "2025-02-25",
    last_charge: "2025-03-25",
    total_spent: 67.80,
    transactions: []
  }
]

export default function SubscriptionComponent() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithState[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response: SubscriptionsResponse = await DashboardService.getRecentSubscriptions()

      const transformedSubscriptions: SubscriptionWithState[] = response.subscriptions.map((sub) => ({
        ...sub,
        isPaid: false,
        color: getColorForMerchant(sub.merchant),
        isMock: false
      }))

      if (transformedSubscriptions.length < 4) {
        const needed = 4 - transformedSubscriptions.length
        const mocksToAdd = mockSubscriptions.slice(0, needed).map(sub => ({
          ...sub,
          isPaid: false,
          color: getColorForMerchant(sub.merchant),
          isMock: true
        }))
        setSubscriptions([...transformedSubscriptions, ...mocksToAdd])
      } else {
        setSubscriptions(transformedSubscriptions)
      }
    } catch (err) {
      console.error("Erro ao carregar assinaturas:", err)
      setError("Não foi possível carregar as assinaturas. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePaid = (merchant: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.merchant === merchant ? { ...sub, isPaid: !sub.isPaid } : sub))
    )
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const totalValue = subscriptions.filter(sub => !sub.isMock).reduce((sum, sub) => sum + sub.average_amount, 0)
  const paidCount = subscriptions.filter((sub) => sub.isPaid && !sub.isMock).length
  const realCount = subscriptions.filter(sub => !sub.isMock).length

  if (loading) {
    return (
      <div className="subscriptions-container">
        <div className="subscriptions-header">
          <div>
            <h2 className="subscriptions-title">Assinaturas</h2>
            <p className="subscriptions-description">Carregando suas assinaturas...</p>
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "40px", color: "#a0a0a0" }}>
          <div className="loading-spinner">Carregando...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="subscriptions-container">
        <div className="subscriptions-header">
          <div>
            <h2 className="subscriptions-title">Assinaturas</h2>
            <p className="subscriptions-description" style={{ color: "#ef4444" }}>
              {error}
            </p>
          </div>
        </div>
        <button
          onClick={loadSubscriptions}
          style={{
            padding: "12px 24px",
            backgroundColor: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <div className="subscriptions-container">
        <div className="subscriptions-header">
          <div>
            <h2 className="subscriptions-title">Assinaturas / Pagamentos Recorrentes</h2>
            <p className="subscriptions-description">Nenhuma assinatura recorrente detectada.</p>
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "40px", color: "#a0a0a0" }}>
          <p>Não encontramos assinaturas recorrentes nos últimos 6 meses.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="subscriptions-container">
      <div className="subscriptions-header">
        <div>
          <h2 className="subscriptions-title">Assinaturas</h2>
          <p className="subscriptions-description">
            {realCount} assinatura{realCount !== 1 ? "s" : ""} recorrente
            {realCount !== 1 ? "s" : ""} detectada{realCount !== 1 ? "s" : ""}.
          </p>
        </div>
        <div className="subscriptions-summary">
          <div className="summary-item">
            <span className="summary-label">Total Mensal</span>
            <span className="summary-value">R$ {formatCurrency(totalValue)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Pagas</span>
            <span className="summary-value">
              {paidCount}/{realCount}
            </span>
          </div>
        </div>
      </div>

      <div className="subscriptions-grid">
        {subscriptions.map((subscription) => (
          <div key={subscription.merchant} className={`subscription-card ${subscription.isPaid ? "paid" : ""} ${subscription.isMock ? "mock" : ""}`}>
            {subscription.isMock && (
              <div className="mock-badge">
                <span>Exemplo</span>
              </div>
            )}
            <div className="subscription-header">
              <div className="subscription-info">
                <div className="subscription-indicator" style={{ backgroundColor: subscription.color }} />
                <h3 className="subscription-name">{subscription.merchant}</h3>
              </div>
              {!subscription.isMock && (
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={subscription.isPaid}
                    onChange={() => handleTogglePaid(subscription.merchant)}
                    className="subscription-checkbox"
                  />
                  <span className="checkbox-custom" style={{ borderColor: subscription.color }}>
                    {subscription.isPaid && (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M1 5L4.5 8.5L11 1.5"
                          stroke={subscription.color}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </label>
              )}
            </div>

            <div className="subscription-details">
              <div className="detail-row">
                <span className="detail-label">Valor Médio</span>
                <span className="detail-value">R$ {formatCurrency(subscription.average_amount)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Próximo Vencimento</span>
                <span className="detail-date">Dia {subscription.average_day_of_month}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Frequência</span>
                <span className="detail-date">{subscription.total_months} meses</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Total Gasto</span>
                <span className="detail-value">R$ {formatCurrency(subscription.total_spent)}</span>
              </div>
            </div>

          {subscription.isPaid && !subscription.isMock && (
            <div className="paid-overlay">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="7" cy="7" r="7" fill={subscription.color} opacity="0.2" />
                <path
                  d="M4 7L6 9L10 5"
                  stroke={subscription.color}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={{ color: subscription.color }}>Pago</span>
            </div>
          )}
          </div>
        ))}
      </div>
    </div>
  )
}