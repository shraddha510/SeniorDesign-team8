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
    otherEmergencyDetails: '',
    description: '',
  });

  const [errors, setErrors] = useState({
    contactInfo: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const validateContactInfo = (contactInfo) => {
    // Check for format like "555-123-4567"
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    return phoneRegex.test(contactInfo);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
      // Clear otherEmergencyDetails if emergencyType is changed from 'other'
      ...(name === 'emergencyType' && value !== 'other' && { otherEmergencyDetails: '' }),
    }));

    // Clear contactInfo error when user types
    if (name === 'contactInfo') {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate contact info
    const contactValid = validateContactInfo(formData.contactInfo);
    
    // If validation fails, set errors and prevent form submission
    if (!contactValid || (formData.emergencyType === 'other' && !formData.otherEmergencyDetails)) {
      setErrors({
        contactInfo: contactValid ? '' : 'Please enter phone in format: 555-123-4567'
      });
       if (formData.emergencyType === 'other' && !formData.otherEmergencyDetails) {
         alert('Please specify the type of emergency when selecting "Other".');
       }
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      
      // Add the help request to the context (now it's async)
      const result = await addHelpRequest(formData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit help request');
      }
      
      // Show success message and redirect
      alert(`Your help request has been submitted with ${result.confidenceScore} confidence score. Emergency services have been notified.`);
      navigate('/');
      
    } catch (error) {
      console.error('Error submitting help request:', error);
      setSubmitError(error.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="help-request-form-container">
      <h1>Emergency Assistance Request</h1>
      <p>Please fill out this form with your information and details about your emergency situation.</p>
      
      {submitError && (
        <div className="submission-error">
          <p>{submitError}</p>
        </div>
      )}
      
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
            disabled={submitting}
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
            placeholder="Street Address, City, Region/State, Postal Code, Country"
            disabled={submitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="contactInfo">Contact Information (Phone)</label> 
          <input
            type="tel"
            id="contactInfo"
            name="contactInfo"
            value={formData.contactInfo}
            onChange={handleChange}
            required
            placeholder="555-123-4567"
            className={errors.contactInfo ? 'input-error' : ''}
            disabled={submitting}
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
            disabled={submitting}
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

        {formData.emergencyType === 'other' && (
          <div className="form-group">
            <label htmlFor="otherEmergencyDetails">Please specify emergency</label>
            <input
              type="text"
              id="otherEmergencyDetails"
              name="otherEmergencyDetails"
              value={formData.otherEmergencyDetails}
              onChange={handleChange}
              required
              placeholder="Describe the type of emergency"
              disabled={submitting}
            />
          </div>
        )}
        
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
            disabled={submitting}
          ></textarea>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button" 
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HelpRequestForm; 