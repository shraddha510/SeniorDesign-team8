import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RequestHelp.css';

const RequestHelp = () => {
  const navigate = useNavigate();

  const handleRequestHelp = () => {
    // Navigate to the help request form page
    navigate('/help-request');
  };

  return (
    <div className="request-help-container">
      <div className="request-help-content">
        <h2>Do you need assistance after a disaster?</h2>
        <p>Click here to submit a help request.</p>
        <button 
          className="request-help-button" 
          onClick={handleRequestHelp}
        >
          REQUEST HELP
        </button>
      </div>
    </div>
  );
};

export default RequestHelp; 