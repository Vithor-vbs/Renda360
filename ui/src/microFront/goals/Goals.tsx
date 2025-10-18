import type React from "react"
import { useState } from "react"
import { Edit2, Plus, Trash2, X, TrendingUp } from "lucide-react"
import "./Goals.css"

type Goal = {
  id: string
  category: string
  amount: number
  months: number
  progress: number
  color: string
}

const CATEGORIES = [
  { name: "Utilidade", color: "#008236" },
  { name: "Alimentação", color: "#6E11B0" },
  { name: "Transporte", color: "#7BF1A8" },
  { name: "Aluguel", color: "#5EF72D" },
  { name: "Lazer", color: "#FF6B6B" },
  { name: "Saúde", color: "#4ECDC4" },
  { name: "Educação", color: "#FFE66D" },
  { name: "Outros", color: "#95E1D3" },
]

export const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([
    { id: "1", category: "Utilidade", amount: 200, months: 3, progress: 70, color: "#008236" },
    { id: "2", category: "Alimentação", amount: 300, months: 2, progress: 80, color: "#6E11B0" },
    { id: "3", category: "Transporte", amount: 150, months: 4, progress: 50, color: "#7BF1A8" },
    { id: "4", category: "Aluguel", amount: 400, months: 1, progress: 85, color: "#5EF72D" },
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newGoal, setNewGoal] = useState({
    category: "",
    amount: "",
    months: "",
  })

  const handleAddGoal = () => {
    if (!newGoal.category || !newGoal.amount || !newGoal.months) return

    const selectedCategory = CATEGORIES.find((c) => c.name === newGoal.category)

    const goal: Goal = {
      id: Date.now().toString(),
      category: newGoal.category,
      amount: Number(newGoal.amount),
      months: Number(newGoal.months),
      progress: 0,
      color: selectedCategory?.color || "#008236",
    }

    setGoals([...goals, goal])
    setNewGoal({ category: "", amount: "", months: "" })
  }

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter((goal) => goal.id !== id))
  }

  return (
    <div className="goals-container-v2">
      <div className="goals-header-v2">
        <div className="goals-header-content">
          <div>
            <h2 className="goals-title-v2">Metas Financeiras</h2>
            <p className="goals-description-v2">Acompanhe o progresso das suas economias</p>
          </div>
        </div>
        <button className="goals-edit-btn-v2" onClick={() => setIsModalOpen(true)}>
          <Edit2 size={16} />
          <span>Gerenciar</span>
        </button>
      </div>

      <div className="goals-grid">
        {goals.map((goal) => {
          const currentAmount = (goal.amount * goal.progress) / 100
          const remaining = goal.amount - currentAmount

          return (
            <div className="goal-card" key={goal.id}>
              <div className="goal-card-header">
                <div className="goal-category-badge" style={{ background: `${goal.color}20`, color: goal.color }}>
                  <div className="goal-category-dot" style={{ background: goal.color }} />
                  {goal.category}
                </div>
                <div className="goal-percentage" style={{ color: goal.color }}>
                  {goal.progress}%
                </div>
              </div>

              <div className="goal-amounts">
                <div className="goal-amount-item">
                  <span className="goal-amount-label">Economizado</span>
                  <span className="goal-amount-value">R$ {currentAmount.toFixed(2)}</span>
                </div>
                <div className="goal-amount-divider" />
                <div className="goal-amount-item">
                  <span className="goal-amount-label">Meta</span>
                  <span className="goal-amount-value">R$ {goal.amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="goal-progress-wrapper">
                <div className="goal-progress-bar">
                  <div
                    className="goal-progress-fill"
                    style={{
                      width: `${goal.progress}%`,
                      background: `linear-gradient(90deg, ${goal.color}80, ${goal.color})`,
                      boxShadow: `0 0 20px ${goal.color}40`,
                    }}
                  >
                    <div className="goal-progress-glow" style={{ background: goal.color }} />
                  </div>
                </div>
              </div>

              <div className="goal-footer">
                <div className="goal-remaining">
                  <TrendingUp size={14} style={{ color: goal.color }} />
                  <span>Faltam R$ {remaining.toFixed(2)}</span>
                </div>
                <div className="goal-timeline">
                  {goal.months} {goal.months === 1 ? "mês" : "meses"}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {isModalOpen && (
        <div className="goals-modal-overlay-v2" onClick={() => setIsModalOpen(false)}>
          <div className="goals-modal-v2" onClick={(e) => e.stopPropagation()}>
            <div className="goals-modal-header-v2">
              <h3>Gerenciar Metas</h3>
              <button className="goals-close-btn-v2" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="goals-modal-content-v2">
              <div className="goals-add-section-v2">
                <h4>Adicionar Nova Meta</h4>
                <div className="goals-form-v2">
                  <div className="goals-form-group-v2">
                    <label>Categoria</label>
                    <select
                      value={newGoal.category}
                      onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                    >
                      <option value="">Selecione uma categoria</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="goals-form-row">
                    <div className="goals-form-group-v2">
                      <label>Valor (R$)</label>
                      <input
                        type="number"
                        placeholder="0,00"
                        value={newGoal.amount}
                        onChange={(e) => setNewGoal({ ...newGoal, amount: e.target.value })}
                      />
                    </div>

                    <div className="goals-form-group-v2">
                      <label>Prazo (meses)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newGoal.months}
                        onChange={(e) => setNewGoal({ ...newGoal, months: e.target.value })}
                      />
                    </div>
                  </div>

                  <button className="goals-add-btn-v2" onClick={handleAddGoal}>
                    <Plus size={18} />
                    Adicionar Meta
                  </button>
                </div>
              </div>

              <div className="goals-list-section-v2">
                <h4>Metas Existentes</h4>
                <div className="goals-list-v2">
                  {goals.map((goal) => (
                    <div className="goals-list-item-v2" key={goal.id}>
                      <div className="goals-list-info-v2">
                        <div className="goals-list-color-v2" style={{ background: goal.color }} />
                        <div>
                          <span className="goals-list-category-v2">{goal.category}</span>
                          <span className="goals-list-details-v2">
                            R$ {goal.amount.toLocaleString("pt-BR")} em {goal.months}{" "}
                            {goal.months === 1 ? "mês" : "meses"} • {goal.progress}% concluído
                          </span>
                        </div>
                      </div>
                      <button className="goals-delete-btn-v2" onClick={() => handleDeleteGoal(goal.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
