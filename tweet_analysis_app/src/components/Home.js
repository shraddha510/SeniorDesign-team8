import React from 'react';
import '../styles/Home.css';
import RequestHelp from './RequestHelp';

const Home = () => {
  return (
    <div className="home-container">
      <div className="image-container">
        <img src="/flood.jpg" alt="Home page flood image" className="home-image" />
        <RequestHelp />
      </div>
    </div>
  );
};

export default Home;