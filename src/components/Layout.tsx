import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { createSpaceDots } from '../utils/animations';

const Layout: React.FC = () => {
  useEffect(() => {
    // Create space-like background with small dots
    createSpaceDots();
    
    // Add title
    document.title = 'VocalHire AI Mock Interview';
  }, []);

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;