import React from "react";
import "./transactionPage.css";

import Transactions from "./Transactions";

const TransactionsPage: React.FC = () => (
  <div className="transactions-page-container">
    <div className="transactions-page-main">
      <Transactions />
    </div>
  </div>
);

export default TransactionsPage;
