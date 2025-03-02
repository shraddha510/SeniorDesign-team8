import React from 'react';
import '../styles/Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-title">
          <h1>Tweet Analysis</h1>
        </div>
        <ul>
          <li><a href="#contact">Contact</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#home">Home</a></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;