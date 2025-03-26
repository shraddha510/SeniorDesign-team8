import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HelpRequestForm.css';
import { useHelpRequests } from '../context/HelpRequestContext';

const HelpRequestForm = () => {
  const navigate = useNavigate();
  const { addHelpRequest } = useHelpRequests();
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contactInfo: '',
    emergencyType: '',
    description: '',
  });

  const [errors, setErrors] = useState({
    location: '',
    contactInfo: ''
  });

  const validateLocation = (location) => {
    // Check for format like "123 Main St, Springfield, IL"
    const locationRegex = /^[\w\s\d\-\.,]+,\s[\w\s\d\-\.]+,\s[A-Z]{2}$/;
    return locationRegex.test(location);
  };

  const validateContactInfo = (contactInfo) => {
    // Check for format like "555-123-4567"
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    return phoneRegex.test(contactInfo);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear errors when user types
    if (name === 'location' || name === 'contactInfo') {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate location and contact info
    const locationValid = validateLocation(formData.location);
    const contactValid = validateContactInfo(formData.contactInfo);
    
    // If validation fails, set errors and prevent form submission
    if (!locationValid || !contactValid) {
      setErrors({
        location: locationValid ? '' : 'Please enter location in format: 123 Main St, Springfield, IL',
        contactInfo: contactValid ? '' : 'Please enter phone in format: 555-123-4567'
      });
      return;
    }
    
    // Add the help request to the context
    addHelpRequest(formData);
    
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
            placeholder="123 Main St, Springfield, IL"
            className={errors.location ? 'input-error' : ''}
          />
          {errors.location && <div className="error-message">{errors.location}</div>}
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
            placeholder="555-123-4567"
            className={errors.contactInfo ? 'input-error' : ''}
          />
          {errors.contactInfo && <div className="error-message">{errors.contactInfo}</div>}
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
            <option value="flood">Flood 🌊</option>
            <option value="fire">Fire 🔥</option>
            <option value="earthquake">Earthquake 🏚️</option>
            <option value="hurricane">Hurricane 🌀</option>
            <option value="tornado">Tornado 🌪️</option>
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