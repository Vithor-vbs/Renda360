import React, { useState, useEffect } from 'react';
import './transactionGrid.css';
import { FaFilter } from 'react-icons/fa'; // ícone de filtro

interface Props {
  filter: string;
}

type Transaction = {
  date: string;
  description: string;
  amount: string;
  category: string;
  type: string;
};

const MOCK_DATA: Record<string, Transaction[]> = {
  'Cartão de Crédito': [
    { date: '10/05/2024', description: 'Amazon', amount: '-R$ 200,00', category: 'Compras', type: 'Crédito' },
    { date: '09/05/2024', description: 'Netflix', amount: '-R$ 39,90', category: 'Streaming', type: 'Crédito' },
  ],
  'Cartão de Débito': [
    { date: '11/05/2024', description: 'Supermercado', amount: '-R$ 150,00', category: 'Alimentação', type: 'Débito' },
    { date: '10/05/2024', description: 'Farmácia', amount: '-R$ 65,00', category: 'Saúde', type: 'Débito' },
  ],
  Pix: [
    { date: '12/05/2024', description: 'Transferência para João', amount: '-R$ 500,00', category: 'Pessoal', type: 'Pix' },
    { date: '10/05/2024', description: 'Recebido de Maria', amount: '+R$ 1.000,00', category: 'Receita', type: 'Pix' },
  ],
  TED: [
    { date: '08/05/2024', description: 'Aluguel', amount: '-R$ 1.500,00', category: 'Moradia', type: 'TED' },
  ],
  Boleto: [
    { date: '07/05/2024', description: 'Conta de Luz', amount: '-R$ 220,00', category: 'Utilidades', type: 'Boleto' },
  ],
  Dinheiro: [
    { date: '06/05/2024', description: 'Saque 24h', amount: '-R$ 300,00', category: 'Saque', type: 'Dinheiro' },
  ],
  All: [],
};

export const TransactionGrid: React.FC<Props> = ({ filter }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  
  useEffect(() => {
    setSelectedCategory(null); 
    setShowFilter(false);        
  }, [filter]); 
  const fullData = filter === 'All' ? Object.values(MOCK_DATA).flat() : MOCK_DATA[filter] || [];

  const categories = [...new Set(fullData.map(tx => tx.category))];

  const filteredData = selectedCategory
    ? fullData.filter(tx => tx.category === selectedCategory)
    : fullData;

  const getAmountColor = (amount: string) => {
    const colorClass = amount.startsWith('+') ? 'amount-positive' : 'amount-negative';
    console.log(`Valor: ${amount} → Classe aplicada: ${colorClass}`);
    return colorClass;
  };


  const getTypePillClass = (type: string) => `pill pill-${type.toLowerCase()}`;

  const getCategoryPillClass = (category: string) =>
    `pill pill-cat-${category.toLowerCase().replace(/\s/g, '-')}`;

  
  return (
    <div className="transaction-grid">
      <div className="grid-header">
        <h3>Transações - {filter}</h3>
        <div className="filter-icon" onClick={() => setShowFilter(!showFilter)}>
          <FaFilter size={18} title="Filtrar por categoria" />
        </div>
      </div>

      {showFilter && (
        <div className="filter-dropdown">
          {categories.map((cat, idx) => (
            <span
              key={idx}
              className={`pill filter-pill ${getCategoryPillClass(cat)} ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {filteredData.length === 0 ? (
        <p className="no-transactions">Nenhuma transação encontrada.</p>
      ) : (
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((tx, index) => (
              <tr key={index}>
                <td>{tx.date}</td>
                <td>{tx.description}</td>
                <td>
                  <span className={getCategoryPillClass(tx.category)}>{tx.category}</span>
                </td>
                <td>
                  <span className={getTypePillClass(tx.type)}>{tx.type}</span>
                </td>
                <td>
                  <span className={`amount-label ${getAmountColor(tx.amount)}`}>
                    {tx.amount}
                  </span>
                </td>
                <td>
                  <button className="details-button">Detalhes</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
