import React, { useState } from 'react';
import '../styles/FirstResponderDashboard.css';
import { useHelpRequests } from '../context/HelpRequestContext';

const FirstResponderDashboard = () => {
  const { helpRequests, updateHelpRequestStatus } = useHelpRequests();
  const [filters, setFilters] = useState({
    status: 'all',
    emergencyType: 'all',
    timeFrame: 'all'
  });

  // Calculate statistics
  const stats = {
    totalRequests: helpRequests.length,
    pending: helpRequests.filter(request => request.status === 'pending').length,
    resolved: helpRequests.filter(request => request.status === 'resolved').length
  };

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
    const matchesEmergencyType = filters.emergencyType === 'all' || request.emergencyType === filters.emergencyType;
    const matchesTimeFrame = getTimeFrameFilter(filters.timeFrame, request.timestamp);
    
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

  return (
    <div className="first-responder-dashboard-container">
      <h1>First Responder Dashboard</h1>
      <p>View and manage emergency assistance requests below.</p>
      
      {/* Add Summary Section */}
      <div className="summary-container">
        <div className="summary-box">
          <div className="summary-item">
            <p className="summary-label">Total Requests</p>
            <p className="summary-value">{stats.totalRequests}</p>
          </div>
          <div className="summary-item">
            <p className="summary-label">Pending Requests</p>
            <p className="summary-value">{stats.pending}</p>
          </div>
          <div className="summary-item">
            <p className="summary-label">Resolved Requests</p>
            <p className="summary-value">{stats.resolved}</p>
          </div>
        </div>
      </div>

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
                    <span className="emergency-icon">{getEmergencyTypeIcon(request.emergencyType)}</span>
                    <h3>{request.emergencyType.charAt(0).toUpperCase() + request.emergencyType.slice(1)} Emergency</h3>
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
                    <p><strong>Contact:</strong> {request.contactInfo}</p>
                    <p><strong>Time Reported:</strong> {new Date(request.timestamp).toLocaleString()}</p>
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