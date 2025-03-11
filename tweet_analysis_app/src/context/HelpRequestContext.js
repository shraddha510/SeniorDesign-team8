import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const HelpRequestContext = createContext();

// Create a provider component
export const HelpRequestProvider = ({ children }) => {
  // Initialize state with any saved requests from localStorage
  const [helpRequests, setHelpRequests] = useState(() => {
    const savedRequests = localStorage.getItem('helpRequests');
    return savedRequests ? JSON.parse(savedRequests) : [
      // Default sample data if no saved requests exist
      {
        id: 1,
        name: 'John Doe',
        location: '123 Main St, Springfield, IL',
        contactInfo: '555-123-4567',
        emergencyType: 'flood',
        description: 'Water is rising in my neighborhood. Need evacuation assistance.',
        timestamp: '2023-04-15T14:30:00',
        status: 'pending'
      }
    ];
  });

  // Save to localStorage whenever helpRequests changes
  useEffect(() => {
    localStorage.setItem('helpRequests', JSON.stringify(helpRequests));
  }, [helpRequests]);

  // Add a new help request
  const addHelpRequest = (request) => {
    const newRequest = {
      ...request,
      id: Date.now(), // Use timestamp as a simple unique ID
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    setHelpRequests([...helpRequests, newRequest]);
  };

  // Update a help request status
  const updateHelpRequestStatus = (id, newStatus) => {
    setHelpRequests(
      helpRequests.map(request => 
        request.id === id ? { ...request, status: newStatus } : request
      )
    );
  };

  // Filter help requests
  const filterHelpRequests = (emergencyType, status) => {
    return helpRequests.filter(request => {
      const matchesEmergencyType = emergencyType === 'all' || request.emergencyType === emergencyType;
      const matchesStatus = status === 'all' || request.status === status;
      return matchesEmergencyType && matchesStatus;
    });
  };

  return (
    <HelpRequestContext.Provider 
      value={{ 
        helpRequests, 
        addHelpRequest, 
        updateHelpRequestStatus,
        filterHelpRequests
      }}
    >
      {children}
    </HelpRequestContext.Provider>
  );
};

// Custom hook to use the help request context
export const useHelpRequests = () => {
  const context = useContext(HelpRequestContext);
  if (!context) {
    throw new Error('useHelpRequests must be used within a HelpRequestProvider');
  }
  return context;
}; 