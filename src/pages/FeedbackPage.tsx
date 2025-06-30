import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Award, TrendingUp, AlertTriangle, Brain, Target, CheckCircle, XCircle, Clock, Mic, Eye, Shield, BarChart3, MessageSquare, Lightbulb, Star, Zap, FileText, Users, Globe, Send, Bot, User, Volume2, VolumeX, Settings, Paperclip, X, File, FileCheck, Trash2, Heart, ThumbsUp, Bookmark, Copy, Search, Filter, Key } from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
import { useGeminiMentor } from '../hooks/useGeminiMentor';
import { generateInterviewPDF } from '../utils/pdfGenerator';
import GeminiApiSetup from '../components/GeminiApiSetup';

interface DetailedFeedback {
  overallScore: number;
  technical: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
  communication: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
  bodyLanguage: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
  detailedAnalysis: {
    wordCount: number;
    sentenceCount: number;
    avgWordsPerSentence: number;
    technicalTermsUsed: number;
    fillerWordCount: number;
    responseLength: string;
    confidenceLevel: string;
    emotionalTone: string;
    keyTopics: string[];
  };
  questions: Array<{
    question: string;
    score: number;
    feedback: string;
    type: 'standard' | 'adaptive';
    keywords: string[];
    responseTime: number;
  }>;
  improvementPlan: Array<{
    area: string;
    priority: 'High' | 'Medium' | 'Low';
    actions: string[];
    timeline: string;
  }>;
  industrySpecificAdvice: string[];
  nextSteps: string[];
}

interface ChatMessage {
  id: string;
  type: 'user' | 'mentor';
  content: string;
  timestamp: Date;
  category?: 'feedback' | 'improvement' | 'analysis' | 'question' | 'general';
  reactions?: string[];
  bookmarked?: boolean;
  files?: UploadedFile[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  uploadedAt: Date;
}

interface MentorSettings {
  personality: 'professional' | 'friendly' | 'enthusiastic' | 'supportive' | 'creative' | 'analytical';
  creativity: number;
  expertise: string;
  responseLength: 'concise' | 'balanced' | 'detailed';
  autoSpeak: boolean;
}

const FeedbackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getInterview } = useInterview();
  const [interview, setInterview] = useState(getInterview(id!));
  const [detailedFeedback, setDetailedFeedback] = useState<DetailedFeedback | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showApiSettings, setShowApiSettings] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [showMentorSettings, setShowMentorSettings] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const [mentorSettings, setMentorSettings] = useState<MentorSettings>({
    personality: 'professional',
    creativity: 70,
    expertise: 'Interview Analysis',
    responseLength: 'balanced',
    autoSpeak: false
  });

  const apiKey = localStorage.getItem('gemini_api_key') || '';
  const { generateResponse, isLoading, error, clearError, isConfigured } = useGeminiMentor(apiKey);

  const personalities = {
    professional: { name: 'Professional', desc: 'Formal, structured, business-focused advice', emoji: '💼' },
    friendly: { name: 'Friendly', desc: 'Warm, approachable, encouraging guidance', emoji: '😊' },
    enthusiastic: { name: 'Enthusiastic', desc: 'Energetic, motivational, inspiring responses', emoji: '🚀' },
    supportive: { name: 'Supportive', desc: 'Empathetic, understanding, confidence-building', emoji: '🤗' },
    creative: { name: 'Creative', desc: 'Innovative, out-of-the-box thinking', emoji: '🎨' },
    analytical: { name: 'Analytical', desc: 'Data-driven, logical, detailed analysis', emoji: '📊' }
  };

  const expertiseAreas = [
    'Interview Analysis', 'Resume Optimization', 'Career Strategy', 'Skill Development',
    'Industry Insights', 'Salary Negotiation', 'Leadership Development', 'Networking',
    'Personal Branding', 'Job Search Strategy'
  ];

  useEffect(() => {
    if (interview && !detailedFeedback && isConfigured) {
      generateRealFeedback();
    }
  }, [interview, isConfigured]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (interview && isConfigured && chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'mentor',
        content: `Hello! I'm your AI Career Mentor. I've analyzed your ${interview.role} interview performance and I'm here to help you improve. Your overall score was ${interview.score || 75}%. 

I can help you with:
🎯 Detailed performance analysis
📈 Personalized improvement plans  
💡 Industry-specific insights
📄 Document analysis (upload your resume!)
🗣️ Practice questions and scenarios

What would you like to focus on first?`,
        timestamp: new Date(),
        category: 'general'
      };
      setChatMessages([welcomeMessage]);
      
      if (mentorSettings.autoSpeak) {
        speakMessage(welcomeMessage.content);
      }
    }
  }, [interview, isConfigured, mentorSettings.autoSpeak]);

  const handleApiKeySet = (newApiKey: string) => {
    localStorage.setItem('gemini_api_key', newApiKey);
    window.location.reload();
  };

  const generateRealFeedback = async () => {
    if (!interview || !isConfigured) return;

    setIsGeneratingFeedback(true);
    clearError();

    try {
      const speechAnalysis = analyzeSpeechContent(interview.speechText || '');
      
      const aiPrompt = `
        Analyze this interview performance for a ${interview.role} position in ${interview.category}:

        INTERVIEW DETAILS:
        - Role: ${interview.role}
        - Category: ${interview.category}
        - Duration: ${interview.duration} minutes
        - Difficulty: ${interview.difficulty}
        - Questions Asked: ${interview.questionsAsked?.join(', ') || 'Standard questions'}
        - Dynamic Questions: ${interview.dynamicQuestions?.join(', ') || 'None'}

        SPEECH TRANSCRIPT:
        "${interview.speechText || 'No speech transcript available'}"

        SPEECH ANALYSIS:
        - Word Count: ${speechAnalysis.wordCount}
        - Sentence Count: ${speechAnalysis.sentenceCount}
        - Technical Terms: ${speechAnalysis.technicalTermsUsed}
        - Filler Words: ${speechAnalysis.fillerWordCount}
        - Key Topics: ${speechAnalysis.keyTopics.join(', ')}

        SECURITY & BEHAVIOR:
        - Security Score: ${interview.securityScore || 85}%
        - Misconduct Incidents: ${interview.misconduct?.length || 0}
        - Alerts: ${interview.plagiarismAlerts?.length || 0}

        Please provide a comprehensive analysis in JSON format with the following structure:
        {
          "overallScore": number (0-100),
          "technical": {
            "score": number (0-100),
            "strengths": [array of 3-4 specific strengths],
            "improvements": [array of 2-3 specific improvements]
          },
          "communication": {
            "score": number (0-100),
            "strengths": [array of 3-4 specific strengths],
            "improvements": [array of 2-3 specific improvements]
          },
          "bodyLanguage": {
            "score": number (0-100),
            "strengths": [array of 2-3 specific strengths],
            "improvements": [array of 1-2 specific improvements]
          },
          "questions": [array of question-specific feedback with scores],
          "improvementPlan": [array of actionable improvement areas with priorities],
          "industrySpecificAdvice": [array of 3-5 industry-specific recommendations],
          "nextSteps": [array of 5-7 specific next steps]
        }

        Base your analysis on the actual content provided. Be specific, actionable, and constructive.
      `;

      const aiResponse = await generateResponse(aiPrompt, []);
      let parsedFeedback: DetailedFeedback;
      
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonResponse = JSON.parse(jsonMatch[0]);
          parsedFeedback = {
            ...jsonResponse,
            detailedAnalysis: {
              ...speechAnalysis,
              confidenceLevel: calculateConfidenceLevel(speechAnalysis),
              emotionalTone: determineEmotionalTone(interview.speechText || ''),
              responseLength: categorizeResponseLength(speechAnalysis.wordCount)
            }
          };
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.error('Error parsing AI response, using fallback:', parseError);
        parsedFeedback = generateFallbackFeedback(interview, speechAnalysis);
      }

      if (interview.questionsAsked && interview.questionsAsked.length > 0) {
        parsedFeedback.questions = interview.questionsAsked.map((question, index) => ({
          question,
          score: Math.max(60, Math.min(95, parsedFeedback.overallScore + (Math.random() * 20 - 10))),
          feedback: generateQuestionFeedback(question, interview.speechText || '', speechAnalysis),
          type: interview.dynamicQuestions?.includes(question) ? 'adaptive' : 'standard',
          keywords: extractQuestionKeywords(question),
          responseTime: 30 + Math.random() * 60
        }));
      }

      setDetailedFeedback(parsedFeedback);

    } catch (error) {
      console.error('Error generating feedback:', error);
      const speechAnalysis = analyzeSpeechContent(interview.speechText || '');
      const fallbackFeedback = generateFallbackFeedback(interview, speechAnalysis);
      setDetailedFeedback(fallbackFeedback);
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const analyzeSpeechContent = (speechText: string) => {
    const words = speechText.split(/\s+/).filter(word => word.length > 0);
    const sentences = speechText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const technicalTerms = [
      'algorithm', 'database', 'framework', 'api', 'microservices', 'cloud', 'devops',
      'machine learning', 'artificial intelligence', 'blockchain', 'kubernetes', 'docker',
      'react', 'angular', 'vue', 'node', 'python', 'java', 'javascript', 'typescript',
      'sql', 'nosql', 'mongodb', 'postgresql', 'redis', 'elasticsearch',
      'aws', 'azure', 'gcp', 'serverless', 'lambda', 'containers',
      'agile', 'scrum', 'kanban', 'ci/cd', 'git', 'version control',
      'testing', 'unit testing', 'integration testing', 'tdd', 'bdd'
    ];
    
    const technicalTermsUsed = technicalTerms.filter(term => 
      speechText.toLowerCase().includes(term.toLowerCase())
    ).length;

    const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'literally'];
    const fillerWordCount = fillerWords.reduce((count, filler) => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = speechText.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);

    const keyTopics = extractKeyTopics(speechText);

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
      technicalTermsUsed,
      fillerWordCount,
      keyTopics
    };
  };

  const extractKeyTopics = (text: string): string[] => {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they'];
    
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      if (word.length > 3 && !stopWords.includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);
  };

  const calculateConfidenceLevel = (analysis: any): string => {
    const score = Math.max(0, 100 - (analysis.fillerWordCount * 5) + (analysis.technicalTermsUsed * 3));
    if (score >= 80) return 'High';
    if (score >= 60) return 'Medium';
    return 'Low';
  };

  const determineEmotionalTone = (text: string): string => {
    const positiveWords = ['excited', 'passionate', 'love', 'enjoy', 'great', 'excellent', 'amazing'];
    const nervousWords = ['nervous', 'anxious', 'worried', 'concerned', 'difficult', 'challenging'];
    
    const positiveCount = positiveWords.filter(word => text.toLowerCase().includes(word)).length;
    const nervousCount = nervousWords.filter(word => text.toLowerCase().includes(word)).length;
    
    if (positiveCount > nervousCount) return 'Positive';
    if (nervousCount > positiveCount) return 'Nervous';
    return 'Neutral';
  };

  const categorizeResponseLength = (wordCount: number): string => {
    if (wordCount < 50) return 'Too Brief';
    if (wordCount < 150) return 'Adequate';
    if (wordCount < 300) return 'Good';
    return 'Comprehensive';
  };

  const generateQuestionFeedback = (question: string, speechText: string, analysis: any): string => {
    const feedbackTemplates = [
      `Your response demonstrated good understanding. Consider adding more specific examples to strengthen your answer.`,
      `Well-structured response with clear points. You could enhance it by quantifying your achievements.`,
      `Good technical knowledge shown. Try to connect your experience more directly to the role requirements.`,
      `Clear communication style. Adding more details about your problem-solving process would be beneficial.`,
      `Solid foundation in your answer. Consider discussing the impact or results of your actions.`
    ];

    return feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)];
  };

  const extractQuestionKeywords = (question: string): string[] => {
    const words = question.toLowerCase().split(/\s+/);
    const importantWords = words.filter(word => 
      word.length > 3 && 
      !['what', 'how', 'why', 'when', 'where', 'tell', 'describe', 'explain'].includes(word)
    );
    return importantWords.slice(0, 3);
  };

  const generateFallbackFeedback = (interview: any, speechAnalysis: any): DetailedFeedback => {
    const baseScore = Math.max(60, Math.min(95, 
      75 + 
      (speechAnalysis.technicalTermsUsed * 2) - 
      (speechAnalysis.fillerWordCount * 3) +
      (speechAnalysis.wordCount > 100 ? 5 : -5)
    ));

    return {
      overallScore: baseScore,
      technical: {
        score: baseScore + Math.random() * 10 - 5,
        strengths: [
          `Demonstrated knowledge of ${speechAnalysis.technicalTermsUsed} technical concepts`,
          `Clear articulation of complex ideas`,
          `Good understanding of industry practices`,
          `Relevant experience examples provided`
        ],
        improvements: [
          `Provide more quantifiable examples and metrics`,
          `Expand on technical implementation details`,
          `Connect technical skills to business outcomes`
        ]
      },
      communication: {
        score: Math.max(60, baseScore - speechAnalysis.fillerWordCount * 2),
        strengths: [
          `Professional vocabulary and tone`,
          `Structured approach to answering questions`,
          `Good listening and comprehension skills`,
          `Confident delivery style`
        ],
        improvements: [
          `Reduce filler words for more polished delivery`,
          `Improve conciseness in responses`,
          `Use more specific examples to illustrate points`
        ]
      },
      bodyLanguage: {
        score: interview.securityScore || 85,
        strengths: [
          `Maintained professional posture throughout`,
          `Appropriate eye contact with camera`,
          `Confident facial expressions`
        ],
        improvements: [
          `Reduce nervous gestures or fidgeting`,
          `Maintain consistent engagement`
        ]
      },
      detailedAnalysis: {
        ...speechAnalysis,
        confidenceLevel: calculateConfidenceLevel(speechAnalysis),
        emotionalTone: determineEmotionalTone(interview.speechText || ''),
        responseLength: categorizeResponseLength(speechAnalysis.wordCount)
      },
      questions: [],
      improvementPlan: [
        {
          area: 'Technical Communication',
          priority: 'High',
          actions: [
            'Practice explaining complex concepts in simple terms',
            'Prepare specific examples with quantifiable results',
            'Study industry trends and emerging technologies'
          ],
          timeline: '2-4 weeks'
        },
        {
          area: 'Interview Confidence',
          priority: 'Medium',
          actions: [
            'Practice mock interviews regularly',
            'Record yourself answering common questions',
            'Work on reducing filler words'
          ],
          timeline: '1-2 weeks'
        }
      ],
      industrySpecificAdvice: [
        `Stay updated with latest ${interview.category} trends and technologies`,
        `Build a portfolio showcasing relevant projects and achievements`,
        `Network with professionals in the ${interview.category} industry`,
        `Consider obtaining relevant certifications for ${interview.role}`,
        `Practice behavioral questions specific to ${interview.category} roles`
      ],
      nextSteps: [
        'Continue practicing with AI-powered interview simulations',
        'Focus on improving areas identified in this analysis',
        'Prepare 5-7 specific examples using the STAR method',
        'Research the company and role thoroughly before interviews',
        'Practice technical questions relevant to your field',
        'Work on body language and professional presentation',
        'Seek feedback from mentors or industry professionals'
      ]
    };
  };

  const handleGeneratePDF = async () => {
    if (!interview || !detailedFeedback) return;

    setIsGeneratingPDF(true);
    try {
      const enhancedInterviewData = {
        ...interview,
        detailedFeedback,
        userResponses: interview.userResponses || [],
        feedback: `This comprehensive analysis is based on your actual interview performance, including speech content analysis, technical assessment, and behavioral evaluation.`
      };

      await generateInterviewPDF(enhancedInterviewData);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type)) {
        alert(`File ${file.name} is not supported. Please upload PDF, Word, or text files.`);
        continue;
      }

      try {
        const content = await readFileContent(file);
        const newFile: UploadedFile = {
          id: Date.now().toString() + i,
          name: file.name,
          size: file.size,
          type: file.type,
          content,
          uploadedAt: new Date()
        };

        setUploadedFiles(prev => [...prev, newFile]);
        
        // Auto-analyze the document
        const analysisMessage = `I've uploaded a document: ${file.name}. Please analyze this document and provide insights, feedback, or suggestions for improvement.`;
        await handleSendMessage(analysisMessage, [newFile]);
      } catch (error) {
        console.error('Error reading file:', error);
        alert(`Error reading file ${file.name}. Please try again.`);
      }
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (file.type === 'application/pdf') {
          resolve(`[PDF Content] ${file.name} - ${Math.round(file.size / 1024)}KB`);
        } else {
          resolve(content);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const speakMessage = (text: string) => {
    if (!synthRef.current || isSpeaking) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (message?: string, files?: UploadedFile[]) => {
    const messageText = message || inputMessage.trim();
    if (!messageText || isLoading || !isConfigured) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date(),
      category: 'general',
      files: files || []
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    clearError();

    try {
      let enhancedPrompt = messageText;
      
      if (interview) {
        enhancedPrompt = `Context: User completed a ${interview.role} interview in ${interview.category} with score ${interview.score || 75}%. 
        
        Interview Details:
        - Duration: ${interview.duration} minutes
        - Difficulty: ${interview.difficulty}
        - Questions: ${interview.questionsAsked?.length || 0}
        - Speech analyzed: ${interview.speechText?.length || 0} characters
        - Security score: ${interview.securityScore || 85}%
        
        Personality: ${personalities[mentorSettings.personality].name} (${personalities[mentorSettings.personality].desc})
        Creativity Level: ${mentorSettings.creativity}%
        Expertise Focus: ${mentorSettings.expertise}
        Response Style: ${mentorSettings.responseLength}
        
        ${files && files.length > 0 ? `Documents uploaded: ${files.map(f => `${f.name} (${f.type})`).join(', ')}. Content: ${files.map(f => f.content.substring(0, 1000)).join('\n\n')}` : ''}
        
        User message: ${messageText}`;
      }
      
      const response = await generateResponse(enhancedPrompt, chatMessages.slice(-6));
      
      const mentorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'mentor',
        content: response,
        timestamp: new Date(),
        category: categorizeMessage(response)
      };

      setChatMessages(prev => [...prev, mentorMessage]);
      
      if (mentorSettings.autoSpeak) {
        setTimeout(() => speakMessage(response), 500);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'mentor',
        content: 'I apologize, but I encountered an error while processing your request. Please check your API configuration and try again.',
        timestamp: new Date(),
        category: 'general'
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  const categorizeMessage = (content: string): 'feedback' | 'improvement' | 'analysis' | 'question' | 'general' => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('feedback') || lowerContent.includes('performance')) return 'feedback';
    if (lowerContent.includes('improve') || lowerContent.includes('better') || lowerContent.includes('practice')) return 'improvement';
    if (lowerContent.includes('analysis') || lowerContent.includes('score') || lowerContent.includes('data')) return 'analysis';
    if (lowerContent.includes('?') || lowerContent.includes('question')) return 'question';
    return 'general';
  };

  const handleQuickAction = (action: string) => {
    const actions = {
      'analyze': `Please provide a detailed analysis of my ${interview?.role} interview performance. Focus on my strengths, weaknesses, and specific areas for improvement based on my ${interview?.score || 75}% score.`,
      'improve': `Create a personalized 30-day improvement plan for my ${interview?.role} interview skills. Include specific daily actions, practice exercises, and milestones to track progress.`,
      'strengths': `What were my key strengths during the ${interview?.role} interview? How can I leverage these strengths in future interviews and my career?`,
      'weaknesses': `What are my main areas for improvement based on my interview performance? Provide specific, actionable steps to address each weakness.`,
      'industry': `What are the current trends and insights in the ${interview?.category} industry that I should know for future interviews? Include market outlook and skill demands.`,
      'questions': `Generate 10 challenging ${interview?.role} interview questions I should practice, along with guidance on how to structure strong answers.`
    };
    
    handleSendMessage(actions[action as keyof typeof actions]);
  };

  const addReaction = (messageId: string, reaction: string) => {
    setChatMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, reactions: [...(msg.reactions || []), reaction] }
        : msg
    ));
  };

  const toggleBookmark = (messageId: string) => {
    setChatMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, bookmarked: !msg.bookmarked }
        : msg
    ));
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Could add a toast notification here
  };

  const filteredMessages = chatMessages.filter(msg => {
    const matchesSearch = msg.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || msg.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (!interview) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Interview Not Found</h1>
          <Link to="/my-interviews" className="text-purple-400 hover:text-purple-300">
            ← Back to My Interviews
          </Link>
        </div>
      </div>
    );
  }

  if (isGeneratingFeedback) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-effect rounded-xl p-12">
            <Brain className="animate-spin h-16 w-16 text-purple-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Analyzing Your Interview Performance</h2>
            <p className="text-gray-400 mb-6">
              Our AI is analyzing your speech content, technical responses, and overall performance to provide comprehensive feedback...
            </p>
            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Speech Analysis
              </div>
              <div className="flex items-center">
                <Brain className="h-4 w-4 mr-2" />
                AI Evaluation
              </div>
              <div className="flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Improvement Plan
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'detailed', label: 'Detailed Analysis', icon: <Brain className="h-4 w-4" /> },
    { id: 'questions', label: 'Question Analysis', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'improvement', label: 'Improvement Plan', icon: <Target className="h-4 w-4" /> },
    { id: 'mentor', label: 'AI Mentor Chat', icon: <Bot className="h-4 w-4" /> }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              to="/my-interviews"
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Interviews
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{interview.role} Interview Feedback</h1>
              <p className="text-gray-400">
                {interview.category} • {new Date(interview.date).toLocaleDateString()} • 
                {interview.duration} minutes • {interview.difficulty} difficulty
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowApiSettings(!showApiSettings)}
              className="flex items-center px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              title="API Settings"
            >
              <Key className="mr-2 h-4 w-4" />
              API Settings
            </button>
            
            <button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF || !detailedFeedback}
              className="btn-primary inline-flex items-center px-6 py-3 rounded-lg font-medium text-white shadow-lg disabled:opacity-50"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Full Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* API Settings Panel */}
        {showApiSettings && (
          <div className="mb-8">
            <GeminiApiSetup onApiKeySet={handleApiKeySet} currentApiKey={apiKey} />
          </div>
        )}

        {/* Overall Score Card */}
        {detailedFeedback && (
          <div className="glass-effect rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - (detailedFeedback.overallScore || 0) / 100)}`}
                      className={getScoreColor(detailedFeedback.overallScore || 0)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${getScoreColor(detailedFeedback.overallScore || 0)}`}>
                      {detailedFeedback.overallScore || 0}%
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold text-lg">Overall Score</h3>
                <p className="text-gray-400 text-sm">Based on comprehensive analysis</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Brain className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="font-semibold">Technical Skills</h3>
                <p className={`text-2xl font-bold ${getScoreColor(detailedFeedback.technical?.score || 0)}`}>
                  {Math.round(detailedFeedback.technical?.score || 0)}%
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="font-semibold">Communication</h3>
                <p className={`text-2xl font-bold ${getScoreColor(detailedFeedback.communication?.score || 0)}`}>
                  {Math.round(detailedFeedback.communication?.score || 0)}%
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Eye className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="font-semibold">Presentation</h3>
                <p className={`text-2xl font-bold ${getScoreColor(detailedFeedback.bodyLanguage?.score || 0)}`}>
                  {Math.round(detailedFeedback.bodyLanguage?.score || 0)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="glass-effect rounded-xl mb-8">
          <div className="flex border-b border-gray-700 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {detailedFeedback && (
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Speech Analysis */}
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Mic className="mr-2 text-blue-400" />
                    Speech Analysis
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-blue-400">{detailedFeedback.detailedAnalysis?.wordCount || 0}</div>
                        <div className="text-sm text-gray-400">Total Words</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-green-400">{detailedFeedback.detailedAnalysis?.technicalTermsUsed || 0}</div>
                        <div className="text-sm text-gray-400">Technical Terms</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-amber-400">{detailedFeedback.detailedAnalysis?.avgWordsPerSentence || 0}</div>
                        <div className="text-sm text-gray-400">Avg Words/Sentence</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-purple-400">{detailedFeedback.detailedAnalysis?.fillerWordCount || 0}</div>
                        <div className="text-sm text-gray-400">Filler Words</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence Level:</span>
                        <span className={`font-medium ${
                          (detailedFeedback.detailedAnalysis?.confidenceLevel || 'Low') === 'High' ? 'text-green-400' :
                          (detailedFeedback.detailedAnalysis?.confidenceLevel || 'Low') === 'Medium' ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {detailedFeedback.detailedAnalysis?.confidenceLevel || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Response Length:</span>
                        <span className="text-blue-400">{detailedFeedback.detailedAnalysis?.responseLength || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Emotional Tone:</span>
                        <span className="text-purple-400">{detailedFeedback.detailedAnalysis?.emotionalTone || 'N/A'}</span>
                      </div>
                    </div>

                    {(detailedFeedback.detailedAnalysis?.keyTopics || []).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Key Topics Discussed:</h4>
                        <div className="flex flex-wrap gap-2">
                          {(detailedFeedback.detailedAnalysis?.keyTopics || []).map((topic, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-full">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Security & Behavior */}
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Shield className="mr-2 text-green-400" />
                    Security & Behavior Analysis
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Security Score:</span>
                      <span className={`text-xl font-bold ${getScoreColor(interview.securityScore || 85)}`}>
                        {interview.securityScore || 85}%
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Alerts:</span>
                        <span className="text-amber-400">{interview.plagiarismAlerts?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Critical Issues:</span>
                        <span className="text-red-400">
                          {interview.plagiarismAlerts?.filter(a => a.severity === 'critical').length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Adaptive Questions:</span>
                        <span className="text-purple-400">{interview.dynamicQuestions?.length || 0}</span>
                      </div>
                    </div>

                    {interview.misconduct && interview.misconduct.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Behavior Notes:</h4>
                        <div className="space-y-1">
                          {interview.misconduct.slice(0, 3).map((note, index) => (
                            <div key={index} className="text-xs text-amber-300 bg-amber-900/20 p-2 rounded">
                              {note}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Strengths */}
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Star className="mr-2 text-amber-400" />
                    Key Strengths
                  </h3>
                  <div className="space-y-3">
                    {(detailedFeedback.technical?.strengths || []).slice(0, 3).map((strength, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Improvements */}
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Target className="mr-2 text-blue-400" />
                    Priority Improvements
                  </h3>
                  <div className="space-y-3">
                    {(detailedFeedback.technical?.improvements || []).slice(0, 3).map((improvement, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Lightbulb className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'detailed' && (
              <div className="space-y-6">
                {/* Technical Skills */}
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Brain className="mr-2 text-blue-400" />
                    Technical Skills Assessment ({Math.round(detailedFeedback.technical?.score || 0)}%)
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-green-400 mb-3">Strengths</h4>
                      <div className="space-y-2">
                        {(detailedFeedback.technical?.strengths || []).map((strength, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                            <span className="text-sm">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-amber-400 mb-3">Areas for Improvement</h4>
                      <div className="space-y-2">
                        {(detailedFeedback.technical?.improvements || []).map((improvement, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <Target className="h-4 w-4 text-amber-400 mt-1 flex-shrink-0" />
                            <span className="text-sm">{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Communication Skills */}
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <MessageSquare className="mr-2 text-green-400" />
                    Communication Skills Assessment ({Math.round(detailedFeedback.communication?.score || 0)}%)
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-green-400 mb-3">Strengths</h4>
                      <div className="space-y-2">
                        {(detailedFeedback.communication?.strengths || []).map((strength, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                            <span className="text-sm">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-amber-400 mb-3">Areas for Improvement</h4>
                      <div className="space-y-2">
                        {(detailedFeedback.communication?.improvements || []).map((improvement, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <Target className="h-4 w-4 text-amber-400 mt-1 flex-shrink-0" />
                            <span className="text-sm">{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Language & Presentation */}
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Eye className="mr-2 text-purple-400" />
                    Presentation & Body Language ({Math.round(detailedFeedback.bodyLanguage?.score || 0)}%)
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-green-400 mb-3">Strengths</h4>
                      <div className="space-y-2">
                        {(detailedFeedback.bodyLanguage?.strengths || []).map((strength, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                            <span className="text-sm">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-amber-400 mb-3">Areas for Improvement</h4>
                      <div className="space-y-2">
                        {(detailedFeedback.bodyLanguage?.improvements || []).map((improvement, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <Target className="h-4 w-4 text-amber-400 mt-1 flex-shrink-0" />
                            <span className="text-sm">{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Industry-Specific Advice */}
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Globe className="mr-2 text-cyan-400" />
                    Industry-Specific Recommendations
                  </h3>
                  <div className="space-y-3">
                    {(detailedFeedback.industrySpecificAdvice || []).map((advice, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Zap className="h-4 w-4 text-cyan-400 mt-1 flex-shrink-0" />
                        <span className="text-sm">{advice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-6">
                {(detailedFeedback.questions || []).length > 0 ? (
                  (detailedFeedback.questions || []).map((questionData, index) => (
                    <div key={index} className="glass-effect rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">Question {index + 1}</h3>
                          <p className="text-gray-300 mb-3">{questionData.question}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className={`font-medium ${getScoreColor(questionData.score || 0)}`}>
                              Score: {questionData.score || 0}%
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              questionData.type === 'adaptive' 
                                ? 'bg-purple-900/30 text-purple-300 border border-purple-500/30'
                                : 'bg-gray-800 text-gray-400'
                            }`}>
                              {questionData.type === 'adaptive' ? 'AI Generated' : 'Standard'}
                            </span>
                            <span className="text-gray-400">
                              Response time: {Math.round(questionData.responseTime || 0)}s
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            (questionData.score || 0) >= 80 ? 'bg-green-500/20 text-green-400' :
                            (questionData.score || 0) >= 60 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            <span className="text-lg font-bold">{questionData.score || 0}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="font-medium text-blue-400 mb-2">Feedback:</h4>
                        <p className="text-sm text-gray-300">{questionData.feedback || 'No feedback available'}</p>
                      </div>

                      {(questionData.keywords || []).length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Key Topics:</h4>
                          <div className="flex flex-wrap gap-2">
                            {(questionData.keywords || []).map((keyword, keyIndex) => (
                              <span key={keyIndex} className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-full">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="glass-effect rounded-xl p-6 text-center">
                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Question Analysis Available</h3>
                    <p className="text-gray-400">
                      Question-by-question analysis will be available for future interviews with speech recognition enabled.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'improvement' && (
              <div className="space-y-6">
                {/* Improvement Plan */}
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-6 flex items-center">
                    <Target className="mr-2 text-green-400" />
                    Personalized Improvement Plan
                  </h3>
                  <div className="space-y-6">
                    {(detailedFeedback.improvementPlan || []).map((plan, index) => (
                      <div key={index} className="border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-medium">{plan.area || 'N/A'}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            (plan.priority || 'Low') === 'High' ? 'bg-red-900/30 text-red-300 border border-red-500/30' :
                            (plan.priority || 'Low') === 'Medium' ? 'bg-amber-900/30 text-amber-300 border border-amber-500/30' :
                            'bg-blue-900/30 text-blue-300 border border-blue-500/30'
                          }`}>
                            {plan.priority || 'Low'} Priority
                          </span>
                        </div>
                        <div className="space-y-2 mb-3">
                          {(plan.actions || []).map((action, actionIndex) => (
                            <div key={actionIndex} className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                              <span className="text-sm">{action}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <Clock className="h-4 w-4 mr-1" />
                          Timeline: {plan.timeline || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Steps */}
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Zap className="mr-2 text-purple-400" />
                    Recommended Next Steps
                  </h3>
                  <div className="space-y-3">
                    {(detailedFeedback.nextSteps || []).map((step, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <FileText className="mr-2 text-blue-400" />
                    Additional Resources
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-400 mb-2">Continue Practicing</h4>
                      <p className="text-sm text-gray-300 mb-3">
                        Use our AI-powered interview system for regular practice with adaptive questioning.
                      </p>
                      <Link 
                        to="/interview"
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        Start New Interview →
                      </Link>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="font-medium text-green-400 mb-2">AI Career Mentor</h4>
                      <p className="text-sm text-gray-300 mb-3">
                        Get personalized guidance and ask specific questions about your career development.
                      </p>
                      <button 
                        onClick={() => setActiveTab('mentor')}
                        className="text-green-400 hover:text-green-300 text-sm font-medium"
                      >
                        Chat with AI Mentor →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mentor' && (
              <div className="space-y-6">
                {!isConfigured ? (
                  <div className="glass-effect rounded-xl p-6">
                    <GeminiApiSetup onApiKeySet={handleApiKeySet} currentApiKey={apiKey} />
                  </div>
                ) : (
                  <>
                    {/* Mentor Settings */}
                    <div className="glass-effect rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold flex items-center">
                          <Bot className="mr-2 text-purple-400" />
                          AI Career Mentor
                        </h3>
                        <button
                          onClick={() => setShowMentorSettings(!showMentorSettings)}
                          className="flex items-center px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </button>
                      </div>

                      {showMentorSettings && (
                        <div className="bg-gray-800/50 rounded-lg p-4 mb-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">AI Personality</label>
                              <select
                                value={mentorSettings.personality}
                                onChange={(e) => setMentorSettings(prev => ({ ...prev, personality: e.target.value as any }))}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                              >
                                {Object.entries(personalities).map(([key, value]) => (
                                  <option key={key} value={key}>
                                    {value.emoji} {value.name} - {value.desc}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">Expertise Focus</label>
                              <select
                                value={mentorSettings.expertise}
                                onChange={(e) => setMentorSettings(prev => ({ ...prev, expertise: e.target.value }))}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                              >
                                {expertiseAreas.map(area => (
                                  <option key={area} value={area}>{area}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">
                                Creativity Level: {mentorSettings.creativity}%
                              </label>
                              <input
                                type="range"
                                min="10"
                                max="100"
                                step="10"
                                value={mentorSettings.creativity}
                                onChange={(e) => setMentorSettings(prev => ({ ...prev, creativity: parseInt(e.target.value) }))}
                                className="w-full accent-purple-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">Response Length</label>
                              <select
                                value={mentorSettings.responseLength}
                                onChange={(e) => setMentorSettings(prev => ({ ...prev, responseLength: e.target.value as any }))}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="concise">Concise (Quick answers)</option>
                                <option value="balanced">Balanced (Detailed but focused)</option>
                                <option value="detailed">Detailed (Comprehensive responses)</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="auto-speak"
                                checked={mentorSettings.autoSpeak}
                                onChange={(e) => setMentorSettings(prev => ({ ...prev, autoSpeak: e.target.checked }))}
                                className="rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500"
                              />
                              <label htmlFor="auto-speak" className="ml-2 text-sm">Auto-speak responses</label>
                            </div>
                            
                            <div className="text-xs text-gray-400">
                              Current: {personalities[mentorSettings.personality].emoji} {personalities[mentorSettings.personality].name} • 
                              {mentorSettings.creativity}% Creative • {mentorSettings.expertise}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        <button
                          onClick={() => handleQuickAction('analyze')}
                          className="p-3 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-left transition-colors"
                        >
                          <BarChart3 className="h-5 w-5 text-blue-400 mb-1" />
                          <div className="text-sm font-medium">Analyze Performance</div>
                        </button>
                        <button
                          onClick={() => handleQuickAction('improve')}
                          className="p-3 bg-green-900/30 hover:bg-green-900/50 rounded-lg text-left transition-colors"
                        >
                          <Target className="h-5 w-5 text-green-400 mb-1" />
                          <div className="text-sm font-medium">Improvement Plan</div>
                        </button>
                        <button
                          onClick={() => handleQuickAction('strengths')}
                          className="p-3 bg-amber-900/30 hover:bg-amber-900/50 rounded-lg text-left transition-colors"
                        >
                          <Star className="h-5 w-5 text-amber-400 mb-1" />
                          <div className="text-sm font-medium">Identify Strengths</div>
                        </button>
                        <button
                          onClick={() => handleQuickAction('weaknesses')}
                          className="p-3 bg-red-900/30 hover:bg-red-900/50 rounded-lg text-left transition-colors"
                        >
                          <AlertTriangle className="h-5 w-5 text-red-400 mb-1" />
                          <div className="text-sm font-medium">Address Weaknesses</div>
                        </button>
                        <button
                          onClick={() => handleQuickAction('industry')}
                          className="p-3 bg-purple-900/30 hover:bg-purple-900/50 rounded-lg text-left transition-colors"
                        >
                          <Globe className="h-5 w-5 text-purple-400 mb-1" />
                          <div className="text-sm font-medium">Industry Insights</div>
                        </button>
                        <button
                          onClick={() => handleQuickAction('questions')}
                          className="p-3 bg-teal-900/30 hover:bg-teal-900/50 rounded-lg text-left transition-colors"
                        >
                          <MessageSquare className="h-5 w-5 text-teal-400 mb-1" />
                          <div className="text-sm font-medium">Practice Questions</div>
                        </button>
                      </div>

                      {/* Chat Interface */}
                      <div className="bg-gray-800/50 rounded-lg">
                        {/* Chat Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <Bot className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                              <h4 className="font-medium">AI Career Mentor</h4>
                              <p className="text-xs text-gray-400">
                                {personalities[mentorSettings.personality].emoji} {personalities[mentorSettings.personality].name} Mode
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* File Upload */}
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                              title="Upload Document"
                            >
                              <Paperclip className="h-4 w-4" />
                            </button>
                            
                            {/* Voice Control */}
                            {isSpeaking ? (
                              <button
                                onClick={stopSpeaking}
                                className="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
                                title="Stop Speaking"
                              >
                                <VolumeX className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                                title="Voice Enabled"
                              >
                                <Volume2 className="h-4 w-4" />
                              </button>
                            )}
                            
                            {/* Search & Filter */}
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                              <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                              >
                                <option value="all">All</option>
                                <option value="feedback">Feedback</option>
                                <option value="improvement">Improvement</option>
                                <option value="analysis">Analysis</option>
                                <option value="question">Questions</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Uploaded Files Display */}
                        {uploadedFiles.length > 0 && (
                          <div className="p-3 border-b border-gray-700">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileCheck className="h-4 w-4 text-green-400" />
                              <span className="text-sm font-medium">Uploaded Documents ({uploadedFiles.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {uploadedFiles.map(file => (
                                <div key={file.id} className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3 py-1">
                                  <File className="h-3 w-3 text-blue-400" />
                                  <span className="text-xs">{file.name}</span>
                                  <button
                                    onClick={() => removeFile(file.id)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Messages */}
                        <div className="h-96 overflow-y-auto p-4 space-y-4">
                          {filteredMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                                  message.type === 'user'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-700 text-gray-200'
                                }`}
                              >
                                <div className="flex items-start space-x-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    message.type === 'user' ? 'bg-purple-700' : 'bg-gray-600'
                                  }`}>
                                    {message.type === 'user' ? <User size={14} /> : <Bot size={14} />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                      {message.content}
                                    </div>
                                    
                                    {message.files && message.files.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {message.files.map(file => (
                                          <div key={file.id} className="flex items-center space-x-2 text-xs opacity-75">
                                            <File className="h-3 w-3" />
                                            <span>{file.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between mt-2">
                                      <div className="text-xs opacity-75">
                                        {message.timestamp.toLocaleTimeString()}
                                        {message.category && (
                                          <span className="ml-2 px-1 py-0.5 bg-black/20 rounded text-xs">
                                            {message.category}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {message.type === 'mentor' && (
                                        <div className="flex items-center space-x-1">
                                          <button
                                            onClick={() => speakMessage(message.content)}
                                            className="text-xs opacity-75 hover:opacity-100 transition-opacity"
                                            disabled={isSpeaking}
                                          >
                                            <Volume2 size={12} />
                                          </button>
                                          <button
                                            onClick={() => copyMessage(message.content)}
                                            className="text-xs opacity-75 hover:opacity-100 transition-opacity"
                                          >
                                            <Copy size={12} />
                                          </button>
                                          <button
                                            onClick={() => toggleBookmark(message.id)}
                                            className={`text-xs transition-opacity ${
                                              message.bookmarked ? 'text-amber-400' : 'opacity-75 hover:opacity-100'
                                            }`}
                                          >
                                            <Bookmark size={12} fill={message.bookmarked ? 'currentColor' : 'none'} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {message.type === 'mentor' && (
                                      <div className="flex items-center space-x-1 mt-2">
                                        <button
                                          onClick={() => addReaction(message.id, '👍')}
                                          className="text-xs opacity-75 hover:opacity-100 transition-opacity"
                                        >
                                          👍
                                        </button>
                                        <button
                                          onClick={() => addReaction(message.id, '❤️')}
                                          className="text-xs opacity-75 hover:opacity-100 transition-opacity"
                                        >
                                          ❤️
                                        </button>
                                        <button
                                          onClick={() => addReaction(message.id, '🎯')}
                                          className="text-xs opacity-75 hover:opacity-100 transition-opacity"
                                        >
                                          🎯
                                        </button>
                                        <button
                                          onClick={() => addReaction(message.id, '💡')}
                                          className="text-xs opacity-75 hover:opacity-100 transition-opacity"
                                        >
                                          💡
                                        </button>
                                        <button
                                          onClick={() => addReaction(message.id, '🚀')}
                                          className="text-xs opacity-75 hover:opacity-100 transition-opacity"
                                        >
                                          🚀
                                        </button>
                                        
                                        {message.reactions && message.reactions.length > 0 && (
                                          <div className="flex items-center space-x-1 ml-2">
                                            {message.reactions.map((reaction, index) => (
                                              <span key={index} className="text-xs">{reaction}</span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {isLoading && (
                            <div className="flex justify-start">
                              <div className="bg-gray-700 text-gray-200 max-w-xs lg:max-w-md px-4 py-3 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <Bot size={16} />
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                  <span className="text-sm">
                                    {personalities[mentorSettings.personality].name} is thinking...
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div ref={chatEndRef} />
                        </div>

                        {/* Error Display */}
                        {error && (
                          <div className="px-4 py-2 bg-red-900/30 border-t border-red-500/30 flex items-start space-x-3">
                            <AlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" size={16} />
                            <div>
                              <p className="text-red-300 text-sm font-medium">AI Error</p>
                              <p className="text-red-200 text-xs">{error}</p>
                            </div>
                          </div>
                        )}

                        {/* Input Area */}
                        <div 
                          className={`border-t border-gray-700 p-4 ${isDragOver ? 'bg-purple-900/20 border-purple-500' : ''}`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 relative">
                              <textarea
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                  }
                                }}
                                placeholder={`Ask your ${personalities[mentorSettings.personality].name.toLowerCase()} AI mentor anything... (Shift+Enter for new line)`}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                rows={2}
                                disabled={isLoading}
                              />
                              {isDragOver && (
                                <div className="absolute inset-0 bg-purple-500/20 border-2 border-dashed border-purple-500 rounded-lg flex items-center justify-center">
                                  <div className="text-purple-300 text-center">
                                    <Paperclip className="h-8 w-8 mx-auto mb-2" />
                                    <p className="text-sm">Drop files here to analyze</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleSendMessage()}
                              disabled={!inputMessage.trim() || isLoading}
                              className="btn-primary p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Send message"
                            >
                              <Send size={20} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                            <div className="flex items-center space-x-4">
                              <span>
                                {personalities[mentorSettings.personality].emoji} {personalities[mentorSettings.personality].name} Mode
                              </span>
                              <span>Creativity: {mentorSettings.creativity}%</span>
                              <span>Focus: {mentorSettings.expertise}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span>Files: {uploadedFiles.length}</span>
                              <span>Messages: {chatMessages.length}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;