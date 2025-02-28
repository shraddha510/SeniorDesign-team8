import React from 'react';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="image-container">
        <img src="/flood.jpg" alt="Home page flood image" className="home-image" />
        <div className="image-text">
          <h1>Welcome to the Tweet Analysis App</h1>
        </div>
      </div>
    </div>
  );
};

export default Home;