import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/FirstResponderDashboard.css';
import { useHelpRequests } from '../context/HelpRequestContext';

const FirstResponderDashboard = () => {
  const navigate = useNavigate();
  const { helpRequests, updateHelpRequestStatus, loading, error } = useHelpRequests();
  const [filters, setFilters] = useState({
    status: 'all',
    emergencyType: 'all',
    timeFrame: 'all'
  });

  // Check authentication on component mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('firstResponderAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/first-responder-login');
    }
  }, [navigate]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const getTimeFrameFilter = (timeFrame, timestamp) => {
    const requestDate = new Date(timestamp);
    const now = new Date();
    const hoursDiff = (now - requestDate) / (1000 * 60 * 60);
    
    switch(timeFrame) {
      case 'last24':
        return hoursDiff <= 24;
      case 'last48':
        return hoursDiff <= 48;
      case 'last7days':
        return hoursDiff <= 168; // 7 days * 24 hours
      case 'older':
        return hoursDiff > 168;
      default:
        return true; // 'all' case
    }
  };

  const filteredRequests = helpRequests.filter(request => {
    const matchesStatus = filters.status === 'all' || request.status === filters.status;
    const matchesEmergencyType = filters.emergencyType === 'all' || request.emergency_type === filters.emergencyType;
    const matchesTimeFrame = getTimeFrameFilter(filters.timeFrame, request.created_at);
    
    return matchesStatus && matchesEmergencyType && matchesTimeFrame;
  });

  const getStatusDropdownClass = (status) => {
    switch(status) {
      case 'pending':
        return 'status-dropdown status-pending';
      case 'in-progress':
        return 'status-dropdown status-in-progress';
      case 'resolved':
        return 'status-dropdown status-resolved';
      default:
        return 'status-dropdown';
    }
  };

  const getEmergencyTypeIcon = (type) => {
    switch(type) {
      case 'flood':
        return '🌊';
      case 'fire':
        return '🔥';
      case 'earthquake':
        return '🏚️';
      case 'hurricane':
        return '🌀';
      case 'tornado':
        return '🌪️';
      default:
        return '⚠️';
    }
  };

  const getConfidenceScoreBadge = (score) => {
    let badgeClass = 'confidence-badge';
    
    switch(score) {
      case 'Low':
        badgeClass += ' confidence-low';
        break;
      case 'Medium':
        badgeClass += ' confidence-medium';
        break;
      case 'High':
        badgeClass += ' confidence-high';
        break;
      default:
        badgeClass += ' confidence-unknown';
    }
    
    return (
      <span className={badgeClass}>
        {score || 'Unknown'} Confidence
      </span>
    );
  };

  if (loading) {
    return (
      <div className="first-responder-dashboard-container">
        <h1>First Responder Dashboard</h1>
        <div className="loading-indicator">Loading help requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="first-responder-dashboard-container">
        <h1>First Responder Dashboard</h1>
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="first-responder-dashboard-container">
      <div className="dashboard-header">
        <h1>First Responder Dashboard</h1>
      </div>
      <p>View and manage emergency assistance requests below.</p>
      
      <div className="dashboard-content">
        <div className="filter-panel">
          <div className="filter-controls">
            <div className="filter-group">
              <label>Status:</label>
              <select 
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Disaster Type:</label>
              <select 
                name="emergencyType"
                value={filters.emergencyType}
                onChange={handleFilterChange}
              >
                <option value="all">All Types</option>
                <option value="flood">Flood</option>
                <option value="fire">Fire</option>
                <option value="earthquake">Earthquake</option>
                <option value="hurricane">Hurricane</option>
                <option value="tornado">Tornado</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Time Frame:</label>
              <select 
                name="timeFrame"
                value={filters.timeFrame}
                onChange={handleFilterChange}
              >
                <option value="all">All Time</option>
                <option value="last24">Last 24 Hours</option>
                <option value="last48">Last 48 Hours</option>
                <option value="last7days">Last 7 Days</option>
                <option value="older">Older Than 7 Days</option>
              </select>
            </div>
          </div>
          
          <div className="filter-summary">
            <p>
              Showing {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'} 
              {filters.status !== 'all' && ` with status "${filters.status}"`}
              {filters.emergencyType !== 'all' && ` of type "${filters.emergencyType}"`}
              {filters.timeFrame !== 'all' && ` from ${filters.timeFrame.replace('last', 'last ').replace('last7days', 'last 7 days')}`}
            </p>
          </div>
        </div>

        <div className="main-content">
          {filteredRequests.length === 0 ? (
            <div className="no-requests-message">
              <p>No help requests match your current filters.</p>
            </div>
          ) : (
            <div className="help-requests-list">
              {filteredRequests.map(request => (
                <div key={request.id} className="help-request-card">
                  <div className="request-header">
                    <span className="emergency-icon">{getEmergencyTypeIcon(request.emergency_type)}</span>
                    <h3>
                      {request.emergency_type === 'other' && request.other_emergency_details
                        ? request.other_emergency_details.charAt(0).toUpperCase() + request.other_emergency_details.slice(1)
                        : request.emergency_type.charAt(0).toUpperCase() + request.emergency_type.slice(1)} Emergency
                    </h3>
                    {getConfidenceScoreBadge(request.confidence_score)}
                    <select 
                      className={getStatusDropdownClass(request.status)}
                      value={request.status}
                      onChange={(e) => updateHelpRequestStatus(request.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  
                  <div className="request-details">
                    <p><strong>Name:</strong> {request.name}</p>
                    <p><strong>Location:</strong> {request.location}</p>
                    <p><strong>Contact:</strong> {request.contact_info}</p>
                    <p><strong>Time Reported:</strong> {new Date(request.created_at).toLocaleString()}</p>
                    <p><strong>Description:</strong> {request.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirstResponderDashboard; 