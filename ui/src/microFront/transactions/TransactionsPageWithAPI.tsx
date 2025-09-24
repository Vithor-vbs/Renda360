import React from "react";
import "./transactionPage.css";
import TransactionsWithAPI from "./TransactionsWithAPI";

const TransactionsPageWithAPI: React.FC = () => (
  <div className="transactions-page-container">
    <div className="transactions-page-main">
      <TransactionsWithAPI />
    </div>
  </div>
);

export default TransactionsPageWithAPI;
