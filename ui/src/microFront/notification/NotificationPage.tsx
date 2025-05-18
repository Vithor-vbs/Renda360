import React from 'react';
import './notificationPage.css';
import { Banner } from '../banner';
import { SidebarColumn } from '../sidebar/SidebarColumn';
import { MainBoard } from '../mainboard/Mainboard';
import Notification from './Notification';

const NotificationPage: React.FC = () => (
  <div className="notification-page-container">
    <div className="notification-page-main">
        <Notification />
    </div>
  </div>
);

export default NotificationPage;