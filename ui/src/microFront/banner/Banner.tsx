import React from 'react';
import './Banner.css';
import logo from '../../assets/renda360logo.png';
import accountIcon from '../../assets/account.png';
import { IconButton } from '../iconButton/IconButton';
import settingsIcon from '../../assets/settings.svg';
import notificationIcon from '../../assets/notification.svg';

const Banner: React.FC = () => {
  return (
    <div className="banner-container">
      <div className="banner-left">
        <img className="banner-image" src={logo} alt="Renda360" />
        <h1 className="banner-title">Renda 360</h1>
      </div>

      <div className="banner-buttons">
        <IconButton
          className="notification-button"
          src={notificationIcon}
          alt="notification"
          onClick={() => {}}
        />
        <IconButton
          className="settings-button"
          src={settingsIcon}
          alt="Configurações"
          onClick={() => {}}
        />
        <img className="account-image" src={accountIcon} alt="Renda360" />
      </div>
    </div>
  );
};

export default Banner;