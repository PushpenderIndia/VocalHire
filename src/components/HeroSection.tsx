import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 opacity-60"></div>
      
      <div className="container mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-8 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Prepare for Interviews with{' '}
              <span className="text-gradient">AI-Driven</span> Practice Sessions
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Tackle authentic interview questions & receive immediate feedback to improve your skills
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                to="/interview" 
                className="btn-primary inline-flex items-center justify-center px-8 py-4 rounded-full font-medium text-white text-lg shadow-lg"
              >
                Start an Interview <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                to="/settings" 
                className="inline-flex items-center justify-center px-8 py-4 rounded-full font-medium text-white text-lg border border-purple-500 hover:bg-purple-500/20 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
          
          <div className="md:w-1/2 relative">
            <div className="glass-effect rounded-2xl p-4 shadow-xl">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                <img 
                  src="https://images.pexels.com/photos/5699469/pexels-photo-5699469.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                  alt="AI Interview Session" 
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center shadow-lg">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5V19L19 12L8 5Z" fill="white"/>
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="glass-effect rounded-lg p-3">
                  <h3 className="font-semibold text-sm text-gray-300">AI Interviewer</h3>
                  <p className="text-xs text-gray-400">Realistic questions adapted to your level</p>
                </div>
                <div className="glass-effect rounded-lg p-3">
                  <h3 className="font-semibold text-sm text-gray-300">You</h3>
                  <p className="text-xs text-gray-400">Video and audio response recording</p>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;