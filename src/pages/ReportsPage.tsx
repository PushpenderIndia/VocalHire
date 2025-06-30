import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Award, Download, Eye, Trash2, Filter, Search, FileText, BarChart3, TrendingUp, Archive, Star, Tag, SortAsc, SortDesc, Grid, List, FolderOpen, Plus } from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
import { generateInterviewPDF, generateInterviewSummaryPDF } from '../utils/pdfGenerator';

interface StoredReport {
  id: string;
  interviewId: string;
  fileName: string;
  generatedDate: Date;
  role: string;
  category: string;
  score: number;
  securityScore: number;
  duration: number;
  difficulty: string;
  tags: string[];
  starred: boolean;
  fileSize: string;
  downloadCount: number;
  lastAccessed: Date;
  pdfBlob?: Blob;
}

const ReportsPage: React.FC = () => {
  const { interviews } = useInterview();
  const [storedReports, setStoredReports] = useState<StoredReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalReports: 0,
    averageScore: 0,
    averageSecurityScore: 0,
    totalDownloads: 0,
    categoryBreakdown: {} as Record<string, number>,
    scoreDistribution: {} as Record<string, number>
  });

  // Load stored reports from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('stored_reports');
    if (stored) {
      const reports = JSON.parse(stored).map((report: any) => ({
        ...report,
        generatedDate: new Date(report.generatedDate),
        lastAccessed: new Date(report.lastAccessed)
      }));
      setStoredReports(reports);
      calculateAnalytics(reports);
    }
  }, []);

  // Save reports to localStorage
  const saveReports = (reports: StoredReport[]) => {
    localStorage.setItem('stored_reports', JSON.stringify(reports));
    setStoredReports(reports);
    calculateAnalytics(reports);
  };

  const calculateAnalytics = (reports: StoredReport[]) => {
    const totalReports = reports.length;
    const averageScore = totalReports > 0 ? Math.round(reports.reduce((sum, r) => sum + r.score, 0) / totalReports) : 0;
    const averageSecurityScore = totalReports > 0 ? Math.round(reports.reduce((sum, r) => sum + r.securityScore, 0) / totalReports) : 0;
    const totalDownloads = reports.reduce((sum, r) => sum + r.downloadCount, 0);
    
    const categoryBreakdown: Record<string, number> = {};
    const scoreDistribution: Record<string, number> = { '0-60': 0, '61-80': 0, '81-100': 0 };
    
    reports.forEach(report => {
      categoryBreakdown[report.category] = (categoryBreakdown[report.category] || 0) + 1;
      
      if (report.score <= 60) scoreDistribution['0-60']++;
      else if (report.score <= 80) scoreDistribution['61-80']++;
      else scoreDistribution['81-100']++;
    });

    setAnalytics({
      totalReports,
      averageScore,
      averageSecurityScore,
      totalDownloads,
      categoryBreakdown,
      scoreDistribution
    });
  };

  const generateAndStoreReport = async (interviewId: string) => {
    const interview = interviews.find(i => i.id === interviewId);
    if (!interview) return;

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

      // Generate PDF and store
      const pdfBlob = await generateInterviewPDF(pdfData, true); // Return blob instead of downloading
      
      const newReport: StoredReport = {
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
        fileSize: `${Math.round((pdfBlob?.size || 0) / 1024)}KB`,
        downloadCount: 0,
        lastAccessed: new Date(),
        pdfBlob
      };

      const updatedReports = [...storedReports, newReport];
      saveReports(updatedReports);
      
      return newReport;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  };

  const downloadReport = async (reportId: string) => {
    const report = storedReports.find(r => r.id === reportId);
    if (!report) return;

    try {
      if (report.pdfBlob) {
        // Download from stored blob
        const url = URL.createObjectURL(report.pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = report.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Regenerate PDF if blob not available
        const interview = interviews.find(i => i.id === report.interviewId);
        if (interview) {
          await generateInterviewPDF({
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
          });
        }
      }

      // Update download count and last accessed
      const updatedReports = storedReports.map(r => 
        r.id === reportId 
          ? { ...r, downloadCount: r.downloadCount + 1, lastAccessed: new Date() }
          : r
      );
      saveReports(updatedReports);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  const deleteReport = (reportId: string) => {
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      const updatedReports = storedReports.filter(r => r.id !== reportId);
      saveReports(updatedReports);
    }
  };

  const toggleStar = (reportId: string) => {
    const updatedReports = storedReports.map(r => 
      r.id === reportId ? { ...r, starred: !r.starred } : r
    );
    saveReports(updatedReports);
  };

  const addTag = (reportId: string, tag: string) => {
    const updatedReports = storedReports.map(r => 
      r.id === reportId ? { ...r, tags: [...r.tags, tag] } : r
    );
    saveReports(updatedReports);
  };

  const removeTag = (reportId: string, tagIndex: number) => {
    const updatedReports = storedReports.map(r => 
      r.id === reportId ? { ...r, tags: r.tags.filter((_, i) => i !== tagIndex) } : r
    );
    saveReports(updatedReports);
  };

  const generateBulkReport = async () => {
    if (selectedReports.length === 0) return;

    setIsGeneratingBulk(true);
    try {
      const selectedInterviews = interviews.filter(i => selectedReports.includes(i.id));
      await generateInterviewSummaryPDF(selectedInterviews.map(interview => ({
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
      })));
      setSelectedReports([]);
    } catch (error) {
      console.error('Error generating bulk report:', error);
      alert('Failed to generate bulk report. Please try again.');
    } finally {
      setIsGeneratingBulk(false);
    }
  };

  const filteredReports = storedReports
    .filter(report => {
      const matchesSearch = report.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || report.category === filterCategory;
      const matchesDifficulty = filterDifficulty === 'all' || report.difficulty === filterDifficulty;
      
      let matchesDate = true;
      if (filterDateRange !== 'all') {
        const now = new Date();
        const reportDate = report.generatedDate;
        switch (filterDateRange) {
          case 'today':
            matchesDate = reportDate.toDateString() === now.toDateString();
            break;
          case 'week':
            matchesDate = (now.getTime() - reportDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
            break;
          case 'month':
            matchesDate = (now.getTime() - reportDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
            break;
        }
      }
      
      return matchesSearch && matchesCategory && matchesDifficulty && matchesDate;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = a.generatedDate.getTime();
          bValue = b.generatedDate.getTime();
          break;
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'role':
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case 'downloads':
          aValue = a.downloadCount;
          bValue = b.downloadCount;
          break;
        default:
          aValue = a.generatedDate.getTime();
          bValue = b.generatedDate.getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const categories = [...new Set(storedReports.map(r => r.category))];
  const difficulties = [...new Set(storedReports.map(r => r.difficulty))];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Archive className="mr-3 text-purple-500" />
              Interview Reports Archive
            </h1>
            <p className="text-gray-400">Manage and analyze all your interview PDF reports</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            {selectedReports.length > 0 && (
              <button
                onClick={generateBulkReport}
                disabled={isGeneratingBulk}
                className="btn-primary inline-flex items-center px-4 py-2 rounded-lg font-medium text-white shadow-lg disabled:opacity-50"
              >
                {isGeneratingBulk ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Bulk Download ({selectedReports.length})
                  </>
                )}
              </button>
            )}
            
            <Link 
              to="/my-interviews"
              className="border border-purple-500 hover:bg-purple-500/20 transition-colors inline-flex items-center px-4 py-2 rounded-lg font-medium text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate New Report
            </Link>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Reports</p>
                <p className="text-2xl font-bold">{analytics.totalReports}</p>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <FileText className="text-purple-400 h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(analytics.averageScore)}`}>
                  {analytics.averageScore}%
                </p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <BarChart3 className="text-blue-400 h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Security Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(analytics.averageSecurityScore)}`}>
                  {analytics.averageSecurityScore}%
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
                <p className="text-gray-400 text-sm">Total Downloads</p>
                <p className="text-2xl font-bold">{analytics.totalDownloads}</p>
              </div>
              <div className="bg-amber-500/20 p-3 rounded-lg">
                <Download className="text-amber-400 h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="glass-effect rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filter & Search Reports</h3>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
              >
                {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reports..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="date">Sort by Date</option>
              <option value="score">Sort by Score</option>
              <option value="role">Sort by Role</option>
              <option value="downloads">Sort by Downloads</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="inline-flex items-center justify-center px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
            >
              {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              <span className="ml-2">{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>

            <div className="flex items-center text-gray-400">
              <FolderOpen className="mr-2 h-5 w-5" />
              <span className="text-sm">{filteredReports.length} reports</span>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Difficulties</option>
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty} className="capitalize">{difficulty}</option>
                ))}
              </select>

              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          )}
        </div>

        {/* Reports Display */}
        {filteredReports.length === 0 ? (
          <div className="glass-effect rounded-xl p-12 text-center">
            <Archive className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Reports Found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterCategory !== 'all' || filterDifficulty !== 'all' || filterDateRange !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Generate your first interview report to see it here.'}
            </p>
            <Link 
              to="/my-interviews"
              className="btn-primary inline-flex items-center px-6 py-3 rounded-lg font-medium text-white shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate Report
            </Link>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredReports.map((report) => (
              <div key={report.id} className={`glass-effect rounded-xl overflow-hidden card-hover ${
                viewMode === 'list' ? 'flex items-center p-4' : 'p-6'
              }`}>
                {viewMode === 'grid' ? (
                  <>
                    {/* Grid View */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedReports.includes(report.interviewId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReports([...selectedReports, report.interviewId]);
                            } else {
                              setSelectedReports(selectedReports.filter(id => id !== report.interviewId));
                            }
                          }}
                          className="rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500"
                        />
                        <FileText className="text-purple-400 h-5 w-5" />
                      </div>
                      <button
                        onClick={() => toggleStar(report.id)}
                        className={`p-1 rounded ${report.starred ? 'text-amber-400' : 'text-gray-400 hover:text-amber-400'}`}
                      >
                        <Star size={16} fill={report.starred ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <h3 className="text-lg font-semibold mb-2 truncate">{report.role}</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {report.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                      {report.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-full">
                          +{report.tags.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-400">
                      <div className="flex justify-between">
                        <span>Generated:</span>
                        <span>{formatDate(report.generatedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Score:</span>
                        <span className={getScoreColor(report.score)}>{report.score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Security:</span>
                        <span className={getScoreColor(report.securityScore)}>{report.securityScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Downloads:</span>
                        <span>{report.downloadCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{report.fileSize}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => downloadReport(report.id)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center"
                      >
                        <Download size={14} className="mr-1" />
                        Download
                      </button>
                      <Link
                        to={`/feedback/${report.interviewId}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center"
                      >
                        <Eye size={14} className="mr-1" />
                        View
                      </Link>
                      <button
                        onClick={() => deleteReport(report.id)}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div className="flex items-center space-x-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.interviewId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReports([...selectedReports, report.interviewId]);
                          } else {
                            setSelectedReports(selectedReports.filter(id => id !== report.interviewId));
                          }
                        }}
                        className="rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500"
                      />
                      
                      <FileText className="text-purple-400 h-6 w-6 flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate">{report.role}</h3>
                        <p className="text-sm text-gray-400">{report.category} • {report.difficulty}</p>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-400">
                        <div className="text-center">
                          <div className={`font-semibold ${getScoreColor(report.score)}`}>{report.score}%</div>
                          <div>Score</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-semibold ${getScoreColor(report.securityScore)}`}>{report.securityScore}%</div>
                          <div>Security</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{report.downloadCount}</div>
                          <div>Downloads</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{formatDate(report.generatedDate)}</div>
                          <div>Generated</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleStar(report.id)}
                          className={`p-2 rounded ${report.starred ? 'text-amber-400' : 'text-gray-400 hover:text-amber-400'}`}
                        >
                          <Star size={16} fill={report.starred ? 'currentColor' : 'none'} />
                        </button>
                        
                        <button
                          onClick={() => downloadReport(report.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center"
                        >
                          <Download size={14} className="mr-1" />
                          Download
                        </button>
                        
                        <Link
                          to={`/feedback/${report.interviewId}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center"
                        >
                          <Eye size={14} className="mr-1" />
                          View
                        </Link>
                        
                        <button
                          onClick={() => deleteReport(report.id)}
                          className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Analytics Charts */}
        {storedReports.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="mr-2 text-blue-400" />
                Reports by Category
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.categoryBreakdown).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-gray-300">{category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(count / analytics.totalReports) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-400 w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Distribution */}
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="mr-2 text-green-400" />
                Score Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.scoreDistribution).map(([range, count]) => (
                  <div key={range} className="flex items-center justify-between">
                    <span className="text-gray-300">{range}%</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            range === '81-100' ? 'bg-green-500' :
                            range === '61-80' ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(count / analytics.totalReports) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-400 w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;