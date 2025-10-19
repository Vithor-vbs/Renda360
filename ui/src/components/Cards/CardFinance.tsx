import React from "react"
import "./CardFinance.css"

export type FinanceCard = {
    id: string
    title: string
    balance: number
    number: string
    brand: "visa" | "mastercard" | "elo" | "amex" | "hipercard"
    color: string
}

type Props = { card: FinanceCard }

const CardFinance: React.FC<Props> = ({ card }) => {
    return (
        <article className="card" style={{ background: card.color }}>
            <header className="header">
                {/* <span className="title">{card.title}</span> */}
                <span className="brand">{card.brand.toUpperCase()}</span>
            </header>

            <div className="balance">
                R$ {card.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>

            <footer>
                <span className="label">Número do Cartão</span>
                <span className="number">{card.number}</span>
            </footer>
        </article>
    )
}

export default CardFinance