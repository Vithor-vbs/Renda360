import React from 'react';
import './transactionPage.css';
import { Banner } from '../banner';
import { SidebarColumn } from '../sidebar/SidebarColumn';
import { MainBoard } from '../mainboard/Mainboard'
import Transactions from './Transactions'; 


const TransactionsPage: React.FC = () => (
  <div className="transactions-page-container">
    <div className="transactions-page-main">
        <Transactions />
    </div>
  </div>
);

export default TransactionsPage;
