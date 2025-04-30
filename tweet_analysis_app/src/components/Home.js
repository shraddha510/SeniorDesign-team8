import React from 'react';
import '../styles/Home.css';
import RequestHelp from './RequestHelp';

const Home = () => {
  return (
    <div className="home-container">
      <div className="overlay"></div>
      <div className="content-wrapper">
        <div className="content-container">
          <div className="info-section">
            <h1>Get Updated Disaster Tracking & Assistance</h1>
            <p>Stay informed, stay safe. Get live updates and immediate support when disasters strike.</p>
          </div>
          <RequestHelp />
        </div>
      </div>
    </div>
  );
};

export default Home;
