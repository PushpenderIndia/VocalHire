import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Cloud } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="glass-effect sticky top-0 z-50 px-4 py-3">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <Cloud className="text-purple-500 h-8 w-8" />
          <span className="text-2xl font-bold text-gradient">VocalHire</span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <NavLinks />
          <Link 
            to="/interview" 
            className="btn-primary px-5 py-2 rounded-full font-medium text-white shadow-lg"
          >
            Start Interview
          </Link>
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden glass-effect mt-2 p-4 rounded-lg">
          <div className="flex flex-col space-y-4">
            <NavLinks />
            <Link 
              to="/interview" 
              className="btn-primary px-5 py-2 rounded-full font-medium text-white text-center shadow-lg"
            >
              Start Interview
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

const NavLinks: React.FC = () => {
  return (
    <>
      <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
      <Link to="/my-interviews" className="text-gray-300 hover:text-white transition-colors">My Interviews</Link>
      <Link to="/reports" className="text-gray-300 hover:text-white transition-colors">Reports Archive</Link>
      <Link to="/mentor" className="text-gray-300 hover:text-white transition-colors">AI Mentor</Link>
      <Link to="/settings" className="text-gray-300 hover:text-white transition-colors">Settings</Link>
    </>
  );
};

export default Navbar;