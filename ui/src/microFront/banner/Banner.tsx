import React from 'react';
import './Banner.css';
import logo from '../../assets/renda360logo.png';
import { IconButton } from '../iconButton/IconButton';
import settingsIcon from '../../assets/settings.svg';
import homeIcon from '../../assets/home.svg';

const Banner: React.FC = () => {
  return (
    <div className="banner-container">
      <div className="banner-left">
        <img className="banner-image" src={logo} alt="Renda360" />
        <h1 className="banner-title">Renda360</h1>
      </div>

      <div className="banner-buttons">
        <IconButton
          className="home-button"
          src={homeIcon}
          alt="Home"
          onClick={() => {}}
        />
        <IconButton
          className="settings-button"
          src={settingsIcon}
          alt="Configurações"
          onClick={() => {}}
        />
      </div>
    </div>
  );
};

export default Banner;