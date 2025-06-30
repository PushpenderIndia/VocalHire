import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="glass-effect py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">VocalHire AI</h3>
            <p className="text-gray-400 mb-4">Prepare for interviews with AI-driven practice sessions and get immediate feedback to improve your skills.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/interview" className="text-gray-400 hover:text-white transition-colors">Start Interview</Link></li>
              <li><Link to="/feedback" className="text-gray-400 hover:text-white transition-colors">My Interviews</Link></li>
              <li><Link to="/settings" className="text-gray-400 hover:text-white transition-colors">Settings</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <p className="text-gray-400">Questions or feedback? We'd love to hear from you.</p>
            <a href="mailto:support@vocalhire.com" className="text-purple-400 hover:text-purple-300 transition-colors">support@vocalhire.com</a>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} VocalHire. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;