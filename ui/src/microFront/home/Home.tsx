import React from 'react';
import './Home.css';
import { Banner } from '../banner';
import { SidebarColumn } from '../sidebar/SidebarColumn';

const Home: React.FC = () => (
  <div className="home-container">
    <Banner />
    <div className="home-main">
      <SidebarColumn />
      {/* aqui virá o conteúdo principal à direita */}
    </div>
  </div>
);

export default Home;
