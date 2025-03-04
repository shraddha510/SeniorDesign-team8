import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RequestHelp.css';

const RequestHelp = () => {
  const navigate = useNavigate();

  const handleRequestHelp = () => {
    navigate('/help-request');
  };

  return (
    <div className="request-help-container">
      <div className="request-help-content">
        <h2>Do you need assistance after a disaster?</h2>
        <p>Click here to submit a help request, as well as learn more about resources to help you recover.</p>
        <button className="request-help-button" onClick={handleRequestHelp}>
          Apply Now
        </button>
      </div>
    </div>
  );
};

export default RequestHelp;
