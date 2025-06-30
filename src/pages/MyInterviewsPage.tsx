import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Award, AlertTriangle, Eye, Trash2, Filter, Search, Download, Archive, Shield, Brain } from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
import { generateInterviewPDF } from '../utils/pdfGenerator';

const MyInterviewsPage: React.FC = () => {
  const { interviews } = useInterview();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

  const filteredInterviews = interviews
    .filter(interview => {
      const matchesSearch = interview.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           interview.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || interview.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'score') {
        return (b.score || 0) - (a.score || 0);
      } else if (sortBy === 'role') {
        return a.role.localeCompare(b.role);
      }
      return 0;
    });

  const handleGeneratePDF = async (interviewId: string) => {
    const interview = interviews.find(i => i.id === interviewId);
    if (!interview) return;

    setGeneratingPDF(interviewId);
    try {
      const pdfData = {
        id: interview.id,
        role: interview.role,
        category: interview.category,
        duration: interview.duration,
        difficulty: interview.difficulty,
        date: interview.date,
        score: interview.score || 0,
        securityScore: interview.securityScore || 85,
        questionsAsked: interview.questionsAsked || [],
        dynamicQuestions: interview.dynamicQuestions || [],
        speechText: interview.speechText || '',
        misconduct: interview.misconduct || [],
        plagiarismAlerts: interview.plagiarismAlerts || [],
        responseQuality: interview.responseQuality || [],
        proctoringSummary: interview.proctoringSummary,
        feedback: 'AI feedback would be included here'
      };
      
      await generateInterviewPDF(pdfData);
      
      // Store the report in localStorage for the Reports page
      const storedReports = JSON.parse(localStorage.getItem('stored_reports') || '[]');
      const newReport = {
        id: `report-${Date.now()}`,
        interviewId: interview.id,
        fileName: `VocalHire_Interview_${interview.role.replace(/\s+/g, '_')}_${new Date(interview.date).toISOString().split('T')[0]}.pdf`,
        generatedDate: new Date(),
        role: interview.role,
        category: interview.category,
        score: interview.score || 0,
        securityScore: interview.securityScore || 85,
        duration: interview.duration,
        difficulty: interview.difficulty,
        tags: [interview.category, interview.difficulty, `${interview.score || 0}%`],
        starred: false,
        fileSize: '250KB', // Estimated size
        downloadCount: 1,
        lastAccessed: new Date()
      };
      
      storedReports.push(newReport);
      localStorage.setItem('stored_reports', JSON.stringify(storedReports));
      
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/30 text-green-400 border-green-500/30';
      case 'in-progress':
        return 'bg-blue-900/30 text-blue-400 border-blue-500/30';
      case 'scheduled':
        return 'bg-amber-900/30 text-amber-400 border-amber-500/30';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-500/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Interviews</h1>
            <p className="text-gray-400">Track your interview progress and performance</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Link 
              to="/reports"
              className="border border-purple-500 hover:bg-purple-500/20 transition-colors inline-flex items-center px-4 py-2 rounded-lg font-medium text-white"
            >
              <Archive className="mr-2 h-4 w-4" />
              View Reports Archive
            </Link>
            <Link 
              to="/interview"
              className="btn-primary inline-flex items-center px-6 py-3 rounded-lg font-medium text-white shadow-lg"
            >
              Start New Interview
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="glass-effect rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search interviews..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="scheduled">Scheduled</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="date">Sort by Date</option>
              <option value="score">Sort by Score</option>
              <option value="role">Sort by Role</option>
            </select>

            <div className="flex items-center text-gray-400">
              <Filter className="mr-2 h-5 w-5" />
              <span className="text-sm">{filteredInterviews.length} interviews</span>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Interviews</p>
                <p className="text-2xl font-bold">{interviews.length}</p>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <Calendar className="text-purple-400 h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-2xl font-bold">
                  {interviews.filter(i => i.status === 'completed').length}
                </p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <Award className="text-green-400 h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Score</p>
                <p className="text-2xl font-bold">
                  {interviews.filter(i => i.score).length > 0 
                    ? Math.round(interviews.filter(i => i.score).reduce((acc, i) => acc + (i.score || 0), 0) / interviews.filter(i => i.score).length)
                    : 0}%
                </p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <Award className="text-blue-400 h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Security Score</p>
                <p className="text-2xl font-bold">
                  {interviews.filter(i => i.securityScore).length > 0 
                    ? Math.round(interviews.filter(i => i.securityScore).reduce((acc, i) => acc + (i.securityScore || 0), 0) / interviews.filter(i => i.securityScore).length)
                    : 85}%
                </p>
              </div>
              <div className="bg-amber-500/20 p-3 rounded-lg">
                <Shield className="text-amber-400 h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Interviews List */}
        <div className="space-y-4">
          {filteredInterviews.length === 0 ? (
            <div className="glass-effect rounded-xl p-12 text-center">
              <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No interviews found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start your first interview to see it here.'}
              </p>
              <Link 
                to="/interview"
                className="btn-primary inline-flex items-center px-6 py-3 rounded-lg font-medium text-white shadow-lg"
              >
                Start Interview
              </Link>
            </div>
          ) : (
            filteredInterviews.map((interview) => (
              <div key={interview.id} className="glass-effect rounded-xl p-6 card-hover">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold">{interview.role}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(interview.status)}`}>
                        {interview.status.replace('-', ' ').toUpperCase()}
                      </span>
                      {interview.dynamicQuestions && interview.dynamicQuestions.length > 0 && (
                        <span className="px-2 py-1 rounded-full text-xs bg-purple-900/30 text-purple-400 border border-purple-500/30 flex items-center">
                          <Brain className="mr-1 h-3 w-3" />
                          AI Enhanced
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        {formatDate(interview.date)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {interview.duration} minutes
                      </div>
                      <div className="bg-gray-700 px-2 py-1 rounded text-xs">
                        {interview.category}
                      </div>
                      <div className="bg-gray-700 px-2 py-1 rounded text-xs capitalize">
                        {interview.difficulty}
                      </div>
                      {interview.securityScore && (
                        <div className="flex items-center">
                          <Shield className="mr-1 h-4 w-4" />
                          <span className={getScoreColor(interview.securityScore)}>
                            Security: {interview.securityScore}%
                          </span>
                        </div>
                      )}
                    </div>

                    {interview.score && (
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Award className="mr-1 h-4 w-4 text-gray-400" />
                          <span className={`font-semibold ${getScoreColor(interview.score)}`}>
                            {interview.score}%
                          </span>
                        </div>
                        
                        <div className="flex-1 max-w-xs">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                interview.score >= 80 ? 'bg-green-500' :
                                interview.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${interview.score}%` }}
                            ></div>
                          </div>
                        </div>

                        {interview.plagiarismAlerts && interview.plagiarismAlerts.length > 0 && (
                          <div className="flex items-center text-red-400">
                            <AlertTriangle className="mr-1 h-4 w-4" />
                            <span className="text-sm">{interview.plagiarismAlerts.length} alerts</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    {interview.status === 'completed' && (
                      <>
                        <button
                          onClick={() => handleGeneratePDF(interview.id)}
                          disabled={generatingPDF === interview.id}
                          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {generatingPDF === interview.id ? (
                            <>
                              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Download className="mr-1 h-4 w-4" />
                              Generate PDF
                            </>
                          )}
                        </button>
                        
                        <Link
                          to={`/feedback/${interview.id}`}
                          className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View Feedback
                        </Link>
                      </>
                    )}
                    
                    <button className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyInterviewsPage;