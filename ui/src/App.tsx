import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { Home } from './microFront/home';
import TransactionsPage from './microFront/transactions/TransactionsPage';
import NotificationPage from './microFront/notification/NotificationPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route element={<AppLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/notification" element={<NotificationPage />} />
      </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
