import React from 'react';
import './Home.css';
import { Banner } from '../banner';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <div className="home-background" />
      <div className="home-content">
        <Banner />
        <h2 className="home-title">Bem-vindo à Home</h2>
        <p className="home-description">Este é o micro frontend da Home.</p>
      </div>
    </div>
  );
};

export default Home;