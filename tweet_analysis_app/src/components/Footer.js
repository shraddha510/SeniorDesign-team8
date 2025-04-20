import React from 'react';

const footerStyle = {
  backgroundColor: '#f8f9fa', // Light gray background
  padding: '1rem 0', // Vertical padding
  marginTop: 'auto', // Push footer to the bottom
  textAlign: 'center', // Center text
  borderTop: '1px solid #e7e7e7', // Subtle top border
  fontSize: '0.9rem', // Slightly smaller font
  color: '#6c757d' // Muted text color
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={footerStyle}>
      <p>&copy; {currentYear} BlueSky Disaster Analysis. All rights reserved.</p>
      {/* Add more footer content here if needed, like links */}
    </footer>
  );
};

export default Footer; 