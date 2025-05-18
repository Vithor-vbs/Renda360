import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { Home } from './microFront/home';
import TransactionsPage from './microFront/transactions/TransactionsPage';
import NotificationPage from './microFront/notification/NotificationPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route path="Home" element={<Home />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="Notification" element={<NotificationPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
