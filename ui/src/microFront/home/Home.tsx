import React from 'react'
import './Home.css'
import { Banner } from '../banner'
import { SidebarColumn } from '../sidebar/SidebarColumn'
import { MainBoard } from '../mainboard/Mainboard'
import { SidebarChat } from '../sidebarchat/SidebarChat'

const Home: React.FC = () => (
  <div className="home-container">
    <div className="home-main">
      <MainBoard />
      <SidebarChat />
    </div>
  </div>
)

export default Home
