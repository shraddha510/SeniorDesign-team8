import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HelpRequestForm.css';

const HelpRequestForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contactInfo: '',
    emergencyType: '',
    description: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log('Form submitted:', formData);
    
    // Show success message and redirect
    alert('Your help request has been submitted. Emergency services have been notified.');
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="help-request-form-container">
      <h1>Emergency Assistance Request</h1>
      <p>Please fill out this form with your information and details about your emergency situation.</p>
      
      <form onSubmit={handleSubmit} className="help-request-form">
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="location">Current Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            placeholder="Address, city, or coordinates"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="contactInfo">Contact Information</label>
          <input
            type="text"
            id="contactInfo"
            name="contactInfo"
            value={formData.contactInfo}
            onChange={handleChange}
            required
            placeholder="Phone number or email"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="emergencyType">Type of Emergency</label>
          <select
            id="emergencyType"
            name="emergencyType"
            value={formData.emergencyType}
            onChange={handleChange}
            required
          >
            <option value="">Select emergency type</option>
            <option value="flood">Flood</option>
            <option value="fire">Fire</option>
            <option value="earthquake">Earthquake</option>
            <option value="hurricane">Hurricane</option>
            <option value="tornado">Tornado</option>
            <option value="medical">Medical Emergency</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description of Situation</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="5"
            placeholder="Please describe your emergency situation and any specific needs..."
          ></textarea>
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className="submit-button">
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
};

export default HelpRequestForm; 