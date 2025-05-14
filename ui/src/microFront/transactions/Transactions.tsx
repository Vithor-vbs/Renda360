import React, { useState } from 'react';
import './transactions.css';
import { TransactionCard } from './TransactionCard';
import { TransactionGrid } from './TransactionGrid';
import { LineChart, Line } from 'recharts';
import ButtonDate from '../buttonDate/buttonDate';

const cards = [
  { type: 'Cartão de Crédito', value: 'R$ 18.720', subtitle: 'Total gasto no mês', change: '3.4%', positive: true },
  { type: 'Cartão de Débito', value: 'R$ 12.890', subtitle: 'Compras realizadas', change: '1.9%', positive: true },
  { type: 'Pix', value: 'R$ 9.650', subtitle: 'Transferências instantâneas', change: '5.1%', positive: true },
  { type: 'TED', value: 'R$ 4.310', subtitle: 'Transferências bancárias', change: '0.5%', positive: true },
  { type: 'Boleto', value: 'R$ 2.500', subtitle: 'Pagamentos via boleto', change: '2.1%', positive: false },
  { type: 'Dinheiro', value: 'R$ 1.200', subtitle: 'Saques e pagamentos', change: '0.8%', positive: true },
];

const miniData = [
  { value: 100 }, { value: 120 }, { value: 90 }, { value: 140 }, { value: 130 }
];

const Transactions: React.FC = () => {
  const [selected, setSelected] = useState<string>('Cartão de Crédito');

  return (
    <div className="transactions-content">
      <div className='transaction-button'>
        <ButtonDate onRangeChange={(start, end) => {
      }} />
      </div>
      <div className="transactions-card-grid">
        {cards.map((card) => (
          <TransactionCard
            key={card.type}
            title={card.type}
            value={card.value}
            subtitle={card.subtitle}
            change={card.change}
            positive={card.positive}
            selected={selected === card.type}
            onClick={() => setSelected(card.type)}
          />
        ))}
      </div>

      <TransactionGrid filter={selected} />
    </div>
  );
};

export default Transactions;
