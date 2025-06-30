import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Shield, FileCheck, BarChart3, ArrowRight, Play, Star, Users, Award, Zap, Brain, Target, TrendingUp, CheckCircle, Sparkles, Globe, Clock } from 'lucide-react';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: <Brain className="w-12 h-12 text-purple-500" />,
      title: 'AI-Powered Interviews',
      description: 'Experience realistic interviews with our advanced AI that adapts questions based on your responses and provides intelligent follow-ups.',
      gradient: 'from-purple-500 to-blue-500'
    },
    {
      icon: <Shield className="w-12 h-12 text-emerald-500" />,
      title: 'Advanced Security System',
      description: 'Our platform monitors for misconduct during interviews with real-time proctoring, ensuring fair and accurate assessment.',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: <Target className="w-12 h-12 text-amber-500" />,
      title: 'Adaptive Questioning',
      description: 'Dynamic AI generates personalized follow-up questions based on your responses, creating a truly interactive experience.',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-rose-500" />,
      title: 'Comprehensive Analytics',
      description: 'Receive detailed analysis of your performance with actionable improvement tips and industry-specific feedback.',
      gradient: 'from-rose-500 to-pink-500'
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      image: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
      quote: "VocalHire AI helped me land my dream job! The adaptive questioning felt so real, and the feedback was incredibly detailed.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Product Manager at Microsoft",
      image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
      quote: "The AI interviewer asked follow-up questions I never expected. It prepared me for the real thing perfectly.",
      rating: 5
    },
    {
      name: "Priya Sharma",
      role: "Data Scientist at Meta",
      image: "https://images.pexels.com/photos/3756681/pexels-photo-3756681.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
      quote: "The security features and real-time analysis made me feel like I was in an actual interview. Highly recommend!",
      rating: 5
    }
  ];

  const stats = [
    { number: "50K+", label: "Interviews Completed", icon: <Users className="w-6 h-6" /> },
    { number: "95%", label: "Success Rate", icon: <Award className="w-6 h-6" /> },
    { number: "2,500+", label: "Interview Questions", icon: <FileCheck className="w-6 h-6" /> },
    { number: "24/7", label: "AI Availability", icon: <Clock className="w-6 h-6" /> }
  ];

  const industries = [
    { name: "Technology", icon: "💻", count: "500+ roles" },
    { name: "Healthcare", icon: "🏥", count: "200+ roles" },
    { name: "Finance", icon: "💰", count: "300+ roles" },
    { name: "Marketing", icon: "📈", count: "250+ roles" },
    { name: "Education", icon: "🎓", count: "150+ roles" },
    { name: "Consulting", icon: "💼", count: "180+ roles" }
  ];

  return (
    <div className="overflow-hidden">
      {/* Enhanced Hero Section */}
      <section className="relative py-20 px-4 min-h-screen flex items-center">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/30 to-blue-900/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 bg-purple-900/30 border border-purple-500/30 rounded-full px-4 py-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">AI-Powered Interview Platform</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Master Your Next
                <span className="block text-gradient">Interview</span>
                <span className="block text-4xl md:text-5xl lg:text-6xl">with AI</span>
              </h1>
              
              <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                Experience realistic interview simulations with adaptive AI questioning, real-time feedback, and comprehensive performance analytics.
              </p>
              
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                <Link 
                  to="/interview" 
                  className="btn-primary inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-white text-lg shadow-2xl group"
                >
                  Start Free Interview 
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/mentor" 
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-white text-lg border-2 border-purple-500 hover:bg-purple-500/20 transition-all group"
                >
                  <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Try AI Mentor
                </Link>

                <a
        href="https://bolt.new"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 z-20"
      >
        <img
          src="https://raw.githubusercontent.com/kickiniteasy/bolt-hackathon-badge/refs/heads/main/src/public/bolt-badge/white_circle_360x360/white_circle_360x360.png"
          alt="Built with Bolt.new"
          className="w-12 h-12 md:w-16 md:h-16 transition-transform hover:scale-110"
        />
      </a>
              </div>
              
              <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    <img className="w-8 h-8 rounded-full border-2 border-gray-800" src="https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" alt="User" />
                    <img className="w-8 h-8 rounded-full border-2 border-gray-800" src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" alt="User" />
                    <img className="w-8 h-8 rounded-full border-2 border-gray-800" src="https://images.pexels.com/photos/3756681/pexels-photo-3756681.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" alt="User" />
                  </div>
                  <span className="text-sm text-gray-400">50,000+ users</span>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                  <span className="text-sm text-gray-400 ml-2">4.9/5 rating</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10">
                <div className="glass-effect rounded-3xl p-6 shadow-2xl">
                  <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900 to-blue-900 relative">
                    <img 
                      src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                      alt="Professional Job Interview Session" 
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl group cursor-pointer hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                    
                    {/* Floating elements */}
                    <div className="absolute top-4 left-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-sm font-medium">
                      ● Live AI Interview
                    </div>
                    <div className="absolute bottom-4 right-4 bg-purple-500/90 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Real-time Analysis
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="glass-effect rounded-xl p-4 text-center">
                      <Brain className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <h3 className="font-semibold text-sm text-gray-300">AI Interviewer</h3>
                      <p className="text-xs text-gray-400">Adaptive questioning</p>
                    </div>
                    <div className="glass-effect rounded-xl p-4 text-center">
                      <Shield className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <h3 className="font-semibold text-sm text-gray-300">Secure Platform</h3>
                      <p className="text-xs text-gray-400">Advanced proctoring</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 mb-4 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-purple-900/30 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Powered by Advanced AI</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose <span className="text-gradient">VocalHire AI</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our cutting-edge AI technology provides the most realistic and comprehensive interview preparation experience available.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="glass-effect rounded-2xl p-8 card-hover group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative z-10">
                  <div className="mb-6">{feature.icon}</div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-white transition-colors">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 px-4 bg-gray-900/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-gradient">Every Industry</span> Covered
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From tech startups to Fortune 500 companies, we have interview questions for every field.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {industries.map((industry, index) => (
              <div key={index} className="glass-effect rounded-xl p-6 text-center card-hover group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{industry.icon}</div>
                <h3 className="font-semibold mb-2 group-hover:text-purple-400 transition-colors">{industry.name}</h3>
                <p className="text-sm text-gray-400">{industry.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Get started in minutes with our intuitive AI-powered interview platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Choose Your Role",
                description: "Select from 2,500+ interview questions across various industries and difficulty levels.",
                image: "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1"
              },
              {
                step: "2", 
                title: "AI Interview Session",
                description: "Engage with our advanced AI interviewer that adapts questions based on your responses.",
                image: "https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1"
              },
              {
                step: "3",
                title: "Detailed Feedback",
                description: "Receive comprehensive analysis with actionable insights to improve your performance.",
                image: "https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1"
              }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-300">
                    <img 
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
                    <span className="text-xl font-bold text-white">{item.step}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-400 transition-colors">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              to="/interview" 
              className="btn-primary inline-flex items-center px-8 py-4 rounded-full font-semibold text-white text-lg shadow-2xl group"
            >
              Start Your Journey 
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Success <span className="text-gradient">Stories</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Join thousands of professionals who landed their dream jobs with VocalHire AI.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="glass-effect rounded-2xl p-8 card-hover">
                <div className="flex items-center mb-6">
                  <img 
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-300 italic leading-relaxed">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-effect rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center space-x-2 bg-purple-900/30 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
                <Globe className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">Join the AI Revolution</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Ace Your Next Interview?</h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Experience the future of interview preparation with our AI-powered platform. Get personalized feedback, adaptive questioning, and comprehensive analytics.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Link 
                  to="/interview" 
                  className="btn-primary inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-white text-lg shadow-2xl group"
                >
                  Start Free Interview
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/mentor" 
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-white text-lg border-2 border-purple-500 hover:bg-purple-500/20 transition-all"
                >
                  Try AI Mentor
                </Link>
              </div>
              
              <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Instant feedback</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>2,500+ questions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;