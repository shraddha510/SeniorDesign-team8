import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import '../styles/Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <Navbar />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout; 