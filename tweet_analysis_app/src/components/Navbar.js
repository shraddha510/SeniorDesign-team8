import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    
    useEffect(() => {
        // Check authentication status on component mount
        const authStatus = localStorage.getItem('firstResponderAuthenticated') === 'true';
        const storedUsername = localStorage.getItem('firstResponderUsername');
        setIsAuthenticated(authStatus);
        setUsername(storedUsername);
    }, []);
    
    const handleFirstResponderView = () => {
        if (isAuthenticated) {
            navigate('/first-responder');
        } else {
            navigate('/first-responder-login');
        }
    };
    
    const handleHomeNavigation = () => {
        navigate('/');
    };
    
    const handleAnalyticsNavigation = () => {
        navigate('/analytics');
    };

    const handleLogout = () => {
        localStorage.removeItem('firstResponderAuthenticated');
        localStorage.removeItem('firstResponderUsername');
        setIsAuthenticated(false);
        setUsername('');
        navigate('/');
    };
    
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="logo" onClick={handleHomeNavigation} style={{ cursor: 'pointer' }}>Tweet Analysis</div>
                <div className="nav-right">
                    <ul className="nav-links">
                        <li><a href="/" onClick={(e) => { e.preventDefault(); handleHomeNavigation(); }}>Home</a></li>
                        <li><a href="/analytics" onClick={(e) => { handleAnalyticsNavigation(); }}>Analytics</a></li>
                    </ul>
                    <div className="nav-buttons">
                        {location.pathname === '/first-responder' ? (
                            <button className="request responder-btn" onClick={handleLogout}>
                                Logout
                            </button>
                        ) : (
                            <button className="request responder-btn" onClick={handleFirstResponderView}>
                                First Responder Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
