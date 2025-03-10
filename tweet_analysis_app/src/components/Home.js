import React from 'react';
import '../styles/Home.css';
import RequestHelp from './RequestHelp';

const Home = () => {
  return (
    <div className="home-container">
      <div className="overlay"></div> 
      <div className="content-container">
        <div className="info-section">
          <h1>Get Real-Time Disaster Tracking & Assistance</h1>
          <p>Stay informed, stay safe. Get live updates and immediate support when disasters strike.</p>
        </div>
        <RequestHelp />
      </div>
    </div>
  );
};

export default Home;
