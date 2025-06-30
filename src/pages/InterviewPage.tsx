import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Camera, Settings, AlertCircle, Monitor, ClipboardCheck } from 'lucide-react';
import InterviewSetup from '../components/interview/InterviewSetup';
import VideoInterface from '../components/interview/VideoInterface';
import { useInterview } from '../context/InterviewContext';

const InterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { addInterview, updateInterview } = useInterview();
  const [step, setStep] = useState<'setup' | 'interview'>('setup');
  const [currentInterviewId, setCurrentInterviewId] = useState<string>('');
  const [interviewSettings, setInterviewSettings] = useState({
    role: '',
    category: '',
    duration: 15,
    difficulty: 'medium',
    cameraEnabled: true,
    microphoneEnabled: true
  });
  
  const handleStartInterview = (settings: typeof interviewSettings) => {
    setInterviewSettings(settings);
    
    // Create interview record
    const interviewId = addInterview({
      role: settings.role,
      category: settings.category,
      duration: settings.duration,
      difficulty: settings.difficulty,
      date: new Date().toISOString(),
      status: 'in-progress'
    });
    
    setCurrentInterviewId(interviewId);
    setStep('interview');
  };
  
  const handleEndInterview = (interviewId: string, interviewData: any) => {
    // Update interview status with collected data
    updateInterview(currentInterviewId, {
      status: 'completed',
      score: Math.floor(Math.random() * 40) + 60, // Random score between 60-100 for demo
      questionsAsked: interviewData.questionsAsked,
      speechText: interviewData.speechText,
      misconduct: interviewData.misconduct,
      videoRecording: interviewData.videoRecording
    });
    
    navigate(`/feedback/${currentInterviewId}`);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {step === 'setup' ? (
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Interview Setup</h1>
          
          <div className="glass-effect rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="text-purple-500" />
              <h2 className="text-xl font-semibold">Configure Your Interview</h2>
            </div>
            
            <InterviewSetup onStart={handleStartInterview} />
          </div>
          
          <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="text-amber-500" />
              <h2 className="text-xl font-semibold">Before You Begin</h2>
            </div>
            
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <Camera className="text-blue-400 mr-2 h-5 w-5 mt-1 flex-shrink-0" />
                <span>Ensure your camera is working and positioned correctly.</span>
              </li>
              <li className="flex items-start">
                <Mic className="text-green-400 mr-2 h-5 w-5 mt-1 flex-shrink-0" />
                <span>Check that your microphone is functioning and can clearly capture your voice.</span>
              </li>
              <li className="flex items-start">
                <Monitor className="text-purple-400 mr-2 h-5 w-5 mt-1 flex-shrink-0" />
                <span>Find a quiet space with good lighting and a professional background.</span>
              </li>
              <li className="flex items-start">
                <ClipboardCheck className="text-teal-400 mr-2 h-5 w-5 mt-1 flex-shrink-0" />
                <span>Have a copy of your resume or relevant materials nearby for reference.</span>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <VideoInterface 
          settings={interviewSettings}
          onEnd={handleEndInterview}
        />
      )}
    </div>
  );
};

export default InterviewPage;