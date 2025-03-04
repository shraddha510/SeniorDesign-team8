import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';



const Navbar = () => {

    const navigate = useNavigate();
  
    const handleRequestHelp = () => {
      navigate('/help-request');
    };
    
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo">Tweet Analysis</div>
        <div className="nav-right">
          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#analytics">Analytics</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          <div className="nav-buttons">
            <button className="request" onClick={handleRequestHelp}>
          Request Help
        </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
