import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Interview {
  id: string;
  role: string;
  category: string;
  duration: number;
  difficulty: string;
  date: string;
  status: 'completed' | 'in-progress' | 'scheduled';
  score?: number;
  feedback?: any;
  questionsAsked?: string[];
  dynamicQuestions?: string[];
  speechText?: string;
  misconduct?: string[];
  plagiarismAlerts?: any[];
  securityScore?: number;
  responseQuality?: number[];
  audioAnalysis?: any;
  videoRecording?: string;
  proctoringSummary?: {
    totalAlerts: number;
    criticalAlerts: number;
    securityScore: number;
    adaptiveQuestionsUsed: number;
  };
}

interface InterviewContextType {
  interviews: Interview[];
  addInterview: (interview: Omit<Interview, 'id'>) => string;
  updateInterview: (id: string, updates: Partial<Interview>) => void;
  getInterview: (id: string) => Interview | undefined;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};

export const InterviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [interviews, setInterviews] = useState<Interview[]>([
    {
      id: 'sample-1',
      role: 'Software Engineer',
      category: 'Technology',
      duration: 30,
      difficulty: 'medium',
      date: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed',
      score: 85,
      securityScore: 92,
      questionsAsked: [
        'Tell me about yourself and your background.',
        'Why are you interested in this position?',
        'Explain the difference between SQL and NoSQL databases.',
        'How do you approach debugging a complex issue?',
        'How do you approach AI/ML integration in your development projects?'
      ],
      dynamicQuestions: [
        'How do you approach AI/ML integration in your development projects?'
      ],
      speechText: 'I am a passionate software engineer with 3 years of experience in full-stack development. I have worked extensively with React, Node.js, and various databases. I am particularly interested in this position because it aligns with my career goals and offers opportunities to work on challenging projects.',
      misconduct: [],
      plagiarismAlerts: [],
      responseQuality: [78, 82, 85, 88, 90],
      proctoringSummary: {
        totalAlerts: 0,
        criticalAlerts: 0,
        securityScore: 92,
        adaptiveQuestionsUsed: 1
      }
    },
    {
      id: 'sample-2',
      role: 'Marketing Manager',
      category: 'Marketing',
      duration: 25,
      difficulty: 'hard',
      date: new Date(Date.now() - 172800000).toISOString(),
      status: 'completed',
      score: 78,
      securityScore: 76,
      questionsAsked: [
        'Tell me about yourself and your background.',
        'How do you measure the success of a marketing campaign?',
        'Describe your experience with digital marketing channels.',
        'What\'s your approach to brand positioning?',
        'How has your marketing strategy adapted to iOS privacy changes?'
      ],
      dynamicQuestions: [
        'How has your marketing strategy adapted to iOS privacy changes?'
      ],
      speechText: 'I have over 5 years of experience in digital marketing, specializing in content marketing and social media strategy. I have successfully managed campaigns that increased brand awareness by 40% and generated significant ROI for my previous companies.',
      misconduct: ['Brief look away from screen at 4:23'],
      plagiarismAlerts: [
        {
          id: '1',
          type: 'tab-switch',
          message: 'Brief look away from screen detected',
          timestamp: new Date(Date.now() - 172800000 + 263000),
          severity: 'medium'
        }
      ],
      responseQuality: [72, 75, 78, 80, 82],
      proctoringSummary: {
        totalAlerts: 1,
        criticalAlerts: 0,
        securityScore: 76,
        adaptiveQuestionsUsed: 1
      }
    }
  ]);

  const addInterview = (interview: Omit<Interview, 'id'>): string => {
    const id = uuidv4();
    const newInterview = { ...interview, id };
    setInterviews(prev => [...prev, newInterview]);
    return id;
  };

  const updateInterview = (id: string, updates: Partial<Interview>) => {
    setInterviews(prev => 
      prev.map(interview => 
        interview.id === id ? { ...interview, ...updates } : interview
      )
    );
  };

  const getInterview = (id: string): Interview | undefined => {
    return interviews.find(interview => interview.id === id);
  };

  return (
    <InterviewContext.Provider value={{
      interviews,
      addInterview,
      updateInterview,
      getInterview
    }}>
      {children}
    </InterviewContext.Provider>
  );
};