import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    
    const handleFirstResponderView = () => {
      navigate('/first-responder');
    };
    
    const handleHomeNavigation = () => {
      navigate('/');
    };
    const handleAnalyticsNavigation = () => {
      navigate('/analytics');
    };
    
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo" onClick={handleHomeNavigation} style={{ cursor: 'pointer' }}>Tweet Analysis</div>
        <div className="nav-right">
          <ul className="nav-links">
            <li><a href="/" onClick={(e) => { e.preventDefault(); handleHomeNavigation(); }}>Home</a></li>
            <li><a href="/analytics" onClick={(e) => {handleAnalyticsNavigation(); }}>Analytics</a></li>
          </ul>
          <div className="nav-buttons">
            <button className="request responder-btn" onClick={handleFirstResponderView}>
              First Responder Dashboard
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
