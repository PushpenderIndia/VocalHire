import React, { useState, useEffect, useRef } from 'react';
import { Clock, Mic, MicOff, Camera, CameraOff, AlertTriangle, Volume2, VolumeX, SkipForward, Play, Pause, Shield, Eye, EyeOff, Brain, Zap, MessageCircle } from 'lucide-react';
import { getQuestionsForRole, getTrendyQuestionsForRole } from '../../data/roles';

interface VideoInterfaceProps {
  settings: {
    role: string;
    category: string;
    duration: number;
    difficulty: string;
    cameraEnabled: boolean;
    microphoneEnabled: boolean;
  };
  onEnd: (interviewId: string, interviewData: any) => void;
}

interface PlagiarismAlert {
  id: string;
  type: 'copy-paste' | 'external-source' | 'tab-switch' | 'multiple-windows' | 'screen-share' | 'suspicious-activity';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AudioAnalysis {
  confidence: number;
  clarity: number;
  pace: number;
  emotion: string;
  keywords: string[];
  suggestedFollowUp: string;
  responseLength: number;
  silenceDuration: number;
}

interface ConversationState {
  currentQuestionIndex: number;
  askedQuestions: string[];
  dynamicQuestions: string[];
  userResponses: Array<{
    question: string;
    response: string;
    analysis: AudioAnalysis;
    timestamp: Date;
  }>;
  conversationFlow: 'greeting' | 'questioning' | 'follow-up' | 'closing';
}

const VideoInterface: React.FC<VideoInterfaceProps> = ({ settings, onEnd }) => {
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(settings.duration * 60);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const [micMuted, setMicMuted] = useState(!settings.microphoneEnabled);
  const [cameraOff, setCameraOff] = useState(!settings.cameraEnabled);
  const [recording, setRecording] = useState(false);
  const [misconduct, setMisconduct] = useState<string[]>([]);
  const [plagiarismAlerts, setPlagiarismAlerts] = useState<PlagiarismAlert[]>([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [aiMuted, setAiMuted] = useState(false);
  const [userSpeechText, setUserSpeechText] = useState('');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis | null>(null);
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);
  const [securityScore, setSecurityScore] = useState(100);
  const [responseQuality, setResponseQuality] = useState<number[]>([]);
  const [adaptiveMode, setAdaptiveMode] = useState(true);
  const [conversationState, setConversationState] = useState<ConversationState>({
    currentQuestionIndex: 0,
    askedQuestions: [],
    dynamicQuestions: [],
    userResponses: [],
    conversationFlow: 'greeting'
  });
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState<number | null>(null);
  const [lastSpeechTime, setLastSpeechTime] = useState<number>(Date.now());
  const [autoListening, setAutoListening] = useState(true);
  const [interviewPhase, setInterviewPhase] = useState<'intro' | 'main' | 'followup' | 'conclusion'>('intro');
  const [speechRecognitionReady, setSpeechRecognitionReady] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [recognitionInitialized, setRecognitionInitialized] = useState(false);
  const [speechSystemStatus, setSpeechSystemStatus] = useState('Initializing...');
  
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const visibilityRef = useRef<boolean>(true);
  const responseTimeoutRef = useRef<number | null>(null);
  const silenceDetectionRef = useRef<number | null>(null);
  const speechEndTimeoutRef = useRef<number | null>(null);
  const initializationTimeoutRef = useRef<number | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRestartCountRef = useRef<number>(0);
  const maxRestartAttempts = 5;
  
  const questions = [...getQuestionsForRole(settings.role, settings.difficulty), ...getTrendyQuestionsForRole(settings.role, settings.difficulty)];
  
  // Initialize Speech Systems with Enhanced Error Handling
  useEffect(() => {
    console.log('🎤 Initializing comprehensive speech systems...');
    setSpeechSystemStatus('Initializing speech systems...');
    
    const initializeSpeechSystems = async () => {
      // Initialize Speech Synthesis
      if ('speechSynthesis' in window) {
        speechSynthRef.current = window.speechSynthesis;
        
        // Load voices
        const loadVoices = () => {
          const voices = speechSynthRef.current?.getVoices() || [];
          console.log(`🔊 Loaded ${voices.length} voices`);
          setVoicesLoaded(voices.length > 0);
          setSpeechSystemStatus(`Speech synthesis ready (${voices.length} voices)`);
        };

        loadVoices();
        if (speechSynthRef.current.onvoiceschanged !== undefined) {
          speechSynthRef.current.onvoiceschanged = loadVoices;
        }

        // Force voice loading for some browsers
        if (speechSynthRef.current.getVoices().length === 0) {
          const utterance = new SpeechSynthesisUtterance('');
          speechSynthRef.current.speak(utterance);
          speechSynthRef.current.cancel();
        }
      }

      // Initialize Speech Recognition with Enhanced Setup
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        
        try {
          recognitionRef.current = new SpeechRecognition();
          
          // Enhanced configuration
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US';
          recognitionRef.current.maxAlternatives = 3;
          // Remove the problematic grammars assignment
          // recognitionRef.current.grammars = null;

          // Event handlers with comprehensive error handling
          recognitionRef.current.onstart = () => {
            console.log('🎤 Speech recognition started successfully');
            setIsListening(true);
            setSpeechRecognitionReady(true);
            setRecognitionInitialized(true);
            recognitionRestartCountRef.current = 0;
            setSpeechSystemStatus('Listening for speech...');
          };

          recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';
            let maxConfidence = 0;

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const result = event.results[i];
              const transcript = result[0].transcript;
              const confidence = result[0].confidence || 0.8;
              
              if (result.isFinal) {
                finalTranscript += transcript + ' ';
                maxConfidence = Math.max(maxConfidence, confidence);
                setLastSpeechTime(Date.now());
                
                console.log('📝 Final transcript:', finalTranscript, 'Confidence:', confidence);
                
                // Clear any existing speech end timeout
                if (speechEndTimeoutRef.current) {
                  clearTimeout(speechEndTimeoutRef.current);
                }
                
                // Set timeout to detect when user stops speaking
                speechEndTimeoutRef.current = window.setTimeout(() => {
                  if (finalTranscript.trim().length > 5) {
                    handleSpeechEnd(finalTranscript.trim(), maxConfidence);
                  }
                }, 2500);
                
              } else {
                interimTranscript += transcript;
                setLastSpeechTime(Date.now());
              }
            }

            if (finalTranscript) {
              setUserSpeechText(prev => prev + finalTranscript);
            }
            
            setCurrentTranscript(interimTranscript);
            setSpeechSystemStatus(interimTranscript ? 'Processing speech...' : 'Listening...');
          };

          recognitionRef.current.onerror = (event: any) => {
            console.error('🚨 Speech recognition error:', event.error);
            setIsListening(false);
            
            switch (event.error) {
              case 'not-allowed':
                console.error('❌ Microphone access denied');
                setPermissionsGranted(false);
                setSpeechSystemStatus('Microphone access denied');
                break;
              case 'no-speech':
                console.log('🔇 No speech detected, will restart...');
                setSpeechSystemStatus('No speech detected, restarting...');
                if (autoListening && isInterviewActive && !micMuted && settings.microphoneEnabled) {
                  scheduleRecognitionRestart();
                }
                break;
              case 'network':
                console.log('🌐 Network error, restarting...');
                setSpeechSystemStatus('Network error, restarting...');
                if (autoListening && isInterviewActive && !micMuted && settings.microphoneEnabled) {
                  scheduleRecognitionRestart();
                }
                break;
              case 'audio-capture':
                console.error('🎤 Audio capture error');
                setSpeechSystemStatus('Audio capture error');
                break;
              case 'aborted':
                console.log('⏹️ Speech recognition aborted');
                setSpeechSystemStatus('Speech recognition stopped');
                break;
              default:
                console.error('❓ Unknown speech recognition error:', event.error);
                setSpeechSystemStatus(`Error: ${event.error}`);
                if (autoListening && isInterviewActive && !micMuted && settings.microphoneEnabled) {
                  scheduleRecognitionRestart();
                }
            }
          };

          recognitionRef.current.onend = () => {
            console.log('🔚 Speech recognition ended');
            setIsListening(false);
            setCurrentTranscript('');
            
            // Auto-restart if conditions are met
            if (autoListening && isInterviewActive && !micMuted && settings.microphoneEnabled && !aiSpeaking) {
              scheduleRecognitionRestart();
            } else {
              setSpeechSystemStatus('Speech recognition stopped');
            }
          };

          setSpeechSupported(true);
          setRecognitionInitialized(true);
          console.log('✅ Speech recognition initialized successfully');
          setSpeechSystemStatus('Speech recognition ready');
          
        } catch (error) {
          console.error('❌ Error initializing speech recognition:', error);
          setSpeechSupported(false);
          setSpeechSystemStatus('Speech recognition not available');
        }
      } else {
        console.log('❌ Speech recognition not supported in this browser');
        setSpeechSupported(false);
        setSpeechSystemStatus('Speech recognition not supported');
      }
    };

    initializeSpeechSystems();

    return () => {
      cleanupSpeechSystems();
    };
  }, []);

  // Enhanced speech recognition restart with backoff
  const scheduleRecognitionRestart = () => {
    if (recognitionRestartCountRef.current >= maxRestartAttempts) {
      console.log('🛑 Max restart attempts reached, stopping auto-restart');
      setSpeechSystemStatus('Max restart attempts reached');
      return;
    }

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }

    const delay = Math.min(1000 * Math.pow(2, recognitionRestartCountRef.current), 10000);
    console.log(`⏰ Scheduling recognition restart in ${delay}ms (attempt ${recognitionRestartCountRef.current + 1})`);
    
    restartTimeoutRef.current = window.setTimeout(() => {
      if (recognitionRef.current && autoListening && isInterviewActive && !micMuted && settings.microphoneEnabled && !aiSpeaking) {
        recognitionRestartCountRef.current++;
        startSpeechRecognition();
      }
    }, delay);
  };

  const cleanupSpeechSystems = () => {
    console.log('🧹 Cleaning up speech systems...');
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
    }
    if (speechEndTimeoutRef.current) {
      clearTimeout(speechEndTimeoutRef.current);
    }
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current);
    }

    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log('Recognition already stopped');
      }
    }
  };

  // Handle when user finishes speaking with enhanced processing
  const handleSpeechEnd = async (transcript: string, confidence: number) => {
    if (!transcript.trim() || transcript.length < 5) {
      console.log('🚫 Transcript too short, ignoring:', transcript);
      return;
    }

    console.log('🎯 Processing speech end:', transcript, 'Confidence:', confidence);
    setIsAnalyzingAudio(true);
    setWaitingForResponse(false);
    setSpeechSystemStatus('Analyzing response...');

    try {
      // Enhanced analysis
      const analysis: AudioAnalysis = {
        confidence: confidence,
        clarity: Math.min(1, Math.max(0.3, confidence + (Math.random() * 0.3 - 0.15))),
        pace: Math.random() * 0.4 + 0.6,
        emotion: determineEmotion(transcript),
        keywords: extractKeywords(transcript),
        suggestedFollowUp: '',
        responseLength: transcript.length,
        silenceDuration: 0
      };

      setAudioAnalysis(analysis);
      setResponseQuality(prev => [...prev, analysis.confidence * 100]);

      // Store the response
      const newResponse = {
        question: currentQuestion,
        response: transcript,
        analysis: analysis,
        timestamp: new Date()
      };

      setConversationState(prev => ({
        ...prev,
        userResponses: [...prev.userResponses, newResponse]
      }));

      console.log('💾 Stored response:', newResponse);

      // Generate next question or follow-up
      await generateNextQuestion(transcript, analysis);

    } catch (error) {
      console.error('❌ Error analyzing speech:', error);
      setSpeechSystemStatus('Error analyzing speech');
    } finally {
      setIsAnalyzingAudio(false);
    }
  };

  // Enhanced emotion detection
  const determineEmotion = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('excited') || lowerText.includes('love') || lowerText.includes('passionate')) {
      return 'excited';
    } else if (lowerText.includes('nervous') || lowerText.includes('worried') || lowerText.includes('anxious')) {
      return 'nervous';
    } else if (lowerText.includes('confident') || lowerText.includes('sure') || lowerText.includes('definitely')) {
      return 'confident';
    } else if (lowerText.includes('calm') || lowerText.includes('relaxed')) {
      return 'calm';
    }
    
    return 'neutral';
  };

  // Generate next question based on user response
  const generateNextQuestion = async (userResponse: string, analysis: AudioAnalysis) => {
    let nextQuestion = '';
    let isFollowUp = false;

    console.log('🤔 Generating next question based on response analysis...');

    // Determine if we need a follow-up question
    if (analysis.confidence < 0.6 || userResponse.length < 30) {
      nextQuestion = generateFollowUpQuestion(currentQuestion, userResponse, analysis);
      isFollowUp = true;
      console.log('🔄 Generated follow-up question:', nextQuestion);
    } else if (analysis.keywords.length > 2 && Math.random() > 0.5) {
      nextQuestion = generateDynamicQuestion(analysis.keywords, userResponse);
      if (nextQuestion) {
        setConversationState(prev => ({
          ...prev,
          dynamicQuestions: [...prev.dynamicQuestions, nextQuestion]
        }));
        console.log('🧠 Generated dynamic question:', nextQuestion);
      }
    }

    // If no dynamic question, use next standard question
    if (!nextQuestion) {
      const nextIndex = conversationState.currentQuestionIndex + 1;
      if (nextIndex < questions.length) {
        nextQuestion = questions[nextIndex];
        setConversationState(prev => ({
          ...prev,
          currentQuestionIndex: nextIndex
        }));
        console.log('📋 Using standard question:', nextQuestion);
      } else {
        nextQuestion = "Thank you for your responses. Do you have any questions for us about the role or company?";
        setInterviewPhase('conclusion');
        console.log('🏁 Interview concluding');
      }
    }

    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setConversationState(prev => ({
        ...prev,
        askedQuestions: [...prev.askedQuestions, nextQuestion]
      }));

      // Wait before asking next question
      setTimeout(() => {
        speakQuestion(nextQuestion, isFollowUp);
      }, 2000);
    }
  };

  // Generate follow-up questions
  const generateFollowUpQuestion = (originalQuestion: string, userResponse: string, analysis: AudioAnalysis): string => {
    const followUpTemplates = [
      "Could you elaborate more on that point?",
      "Can you provide a specific example of what you mentioned?",
      "That's interesting. How did you handle the challenges in that situation?",
      "What was the outcome of that experience?",
      "How would you apply that knowledge in this role?",
      "What did you learn from that experience?",
      "Can you walk me through your thought process there?",
      "What would you do differently if you faced that situation again?"
    ];

    if (analysis.confidence < 0.5) {
      return "I want to make sure I understand your response correctly. " + followUpTemplates[Math.floor(Math.random() * followUpTemplates.length)];
    }

    return followUpTemplates[Math.floor(Math.random() * followUpTemplates.length)];
  };

  // Generate dynamic questions based on keywords
  const generateDynamicQuestion = (keywords: string[], userResponse: string): string => {
    if (keywords.length === 0) return '';

    const dynamicTemplates = [
      `You mentioned ${keywords[0]}. How has your experience with ${keywords[0]} prepared you for this role?`,
      `That's great that you have experience with ${keywords[0]}. What challenges did you face when working with ${keywords[1] || keywords[0]}?`,
      `I'd like to dive deeper into your ${keywords[0]} experience. Can you describe a specific project where you used these skills?`,
      `How do you stay updated with the latest developments in ${keywords[0]}?`,
      `What's your approach to learning new technologies like ${keywords[0]}?`
    ];

    return dynamicTemplates[Math.floor(Math.random() * dynamicTemplates.length)];
  };

  const extractKeywords = (text: string): string[] => {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those']);
    
    return words
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 5);
  };

  // Enhanced speech recognition control
  const startSpeechRecognition = () => {
    if (!recognitionRef.current || !speechSupported || !recognitionInitialized) {
      console.log('❌ Speech recognition not available or not initialized');
      setSpeechSystemStatus('Speech recognition not available');
      return;
    }

    if (isListening) {
      console.log('🎤 Already listening, skipping start');
      return;
    }

    try {
      // Stop any existing recognition
      recognitionRef.current.stop();
    } catch (error) {
      // Ignore errors if recognition wasn't running
    }

    setTimeout(() => {
      if (recognitionRef.current && !micMuted && settings.microphoneEnabled && !aiSpeaking && autoListening) {
        try {
          console.log('🎤 Starting speech recognition...');
          recognitionRef.current.start();
          setSpeechSystemStatus('Starting speech recognition...');
        } catch (error) {
          console.error('❌ Error starting speech recognition:', error);
          setSpeechSystemStatus('Failed to start speech recognition');
          
          // Try again after a delay
          if (recognitionRestartCountRef.current < maxRestartAttempts) {
            scheduleRecognitionRestart();
          }
        }
      }
    }, 500);
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        console.log('🛑 Stopping speech recognition...');
        recognitionRef.current.stop();
        setSpeechSystemStatus('Speech recognition stopped');
      } catch (error) {
        console.error('❌ Error stopping speech recognition:', error);
      }
    }
    setIsListening(false);
    setCurrentTranscript('');
  };
  
  // Initialize media devices with enhanced error handling
  useEffect(() => {
    const initializeMedia = async () => {
      console.log('📹 Initializing media devices...');
      try {
        const constraints = {
          video: settings.cameraEnabled ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          } : false,
          audio: settings.microphoneEnabled ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          } : false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setUserStream(stream);
        setPermissionsGranted(true);
        
        if (userVideoRef.current && settings.cameraEnabled) {
          userVideoRef.current.srcObject = stream;
        }

        // Setup media recorder
        if (stream && MediaRecorder.isTypeSupported('video/webm')) {
          const recorder = new MediaRecorder(stream, { 
            mimeType: 'video/webm',
            videoBitsPerSecond: 1000000
          });
          
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              setRecordedChunks(prev => [...prev, event.data]);
            }
          };

          setMediaRecorder(recorder);
        }
        
        console.log('✅ Media devices initialized successfully');
        
        // Start interview after media is ready
        setTimeout(() => {
          startInterview();
        }, 1500);
        
      } catch (err) {
        console.error("❌ Error accessing media devices:", err);
        setPermissionsGranted(false);
        
        // Start interview anyway for demo purposes
        setTimeout(() => {
          startInterview();
        }, 1500);
      }
    };
    
    initializeMedia();
    
    return () => {
      if (userStream) {
        userStream.getTracks().forEach(track => track.stop());
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      cleanupSpeechSystems();
    };
  }, [settings]);
  
  // Enhanced speech synthesis with better voice selection
  const speakQuestion = (question: string, isFollowUp: boolean = false) => {
    if (!speechSynthRef.current || aiMuted) {
      console.log('🔇 Speech synthesis not available or muted');
      return;
    }

    // Cancel any current speech
    speechSynthRef.current.cancel();
    if (currentUtteranceRef.current) {
      currentUtteranceRef.current = null;
    }
    
    const prefix = isFollowUp ? "" : "Here's your next question: ";
    const fullText = prefix + question;
    
    const utterance = new SpeechSynthesisUtterance(fullText);
    currentUtteranceRef.current = utterance;
    
    // Enhanced voice configuration
    const voices = speechSynthRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Alex'))
    ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    utterance.lang = 'en-US';
    
    utterance.onstart = () => {
      console.log('🗣️ AI started speaking:', fullText.substring(0, 50) + '...');
      setAiSpeaking(true);
      setAutoListening(false);
      setSpeechSystemStatus('AI is speaking...');
      
      // Stop speech recognition while AI is speaking
      if (isListening) {
        stopSpeechRecognition();
      }
    };
    
    utterance.onend = () => {
      console.log('✅ AI finished speaking, preparing to listen');
      setAiSpeaking(false);
      setWaitingForResponse(true);
      currentUtteranceRef.current = null;
      
      // Start listening for user response after AI finishes
      setTimeout(() => {
        if (isInterviewActive && !micMuted && settings.microphoneEnabled && speechSupported) {
          setAutoListening(true);
          setSpeechSystemStatus('Ready to listen for your response...');
          startSpeechRecognition();
        }
      }, 1500);
    };
    
    utterance.onerror = (event) => {
      // Handle the 'interrupted' error gracefully as it's expected behavior
      if (event.error === 'interrupted') {
        console.log('🔄 Speech synthesis interrupted (expected behavior)');
        setSpeechSystemStatus('Speech interrupted');
      } else {
        console.error('❌ Speech synthesis error:', event.error);
        setSpeechSystemStatus('Speech synthesis error');
      }
      
      setAiSpeaking(false);
      setAutoListening(true);
      currentUtteranceRef.current = null;
      
      // Start listening anyway
      if (isInterviewActive && !micMuted && settings.microphoneEnabled && speechSupported) {
        setTimeout(() => {
          startSpeechRecognition();
        }, 1000);
      }
    };
    
    console.log('🎙️ Speaking question:', fullText);
    speechSynthRef.current.speak(utterance);
  };
  
  const startInterview = () => {
    console.log('🚀 Starting interview...');
    setIsInterviewActive(true);
    setRecording(true);
    
    if (mediaRecorder) {
      try {
        mediaRecorder.start(1000);
        console.log('📹 Recording started');
      } catch (error) {
        console.error('❌ Error starting recording:', error);
      }
    }
    
    const firstQuestion = questions[0];
    setCurrentQuestion(firstQuestion);
    setConversationState(prev => ({
      ...prev,
      askedQuestions: [firstQuestion],
      conversationFlow: 'questioning'
    }));
    
    const welcomeMessage = `Welcome to your ${settings.role} interview. This is an advanced AI interview with real-time speech recognition and adaptive questioning. I'll be asking you questions and listening to your responses. Please speak clearly and wait for me to finish before responding. Let's begin.`;
    
    // Start timer
    timerRef.current = window.setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          endInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Start proctoring
    simulateAdvancedProctoring();
    
    // Speak welcome message and first question
    setTimeout(() => {
      speakQuestion(welcomeMessage + " " + firstQuestion);
    }, 1000);
  };
  
  const nextQuestion = async () => {
    const nextIndex = conversationState.currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      const nextQ = questions[nextIndex];
      setCurrentQuestion(nextQ);
      setConversationState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        askedQuestions: [...prev.askedQuestions, nextQ]
      }));
      
      speakQuestion(nextQ);
    }
  };
  
  // Advanced Proctoring System (keeping existing implementation)
  useEffect(() => {
    if (!isInterviewActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addPlagiarismAlert('tab-switch', 'Candidate switched tabs or minimized window', 'high');
        visibilityRef.current = false;
      } else {
        visibilityRef.current = true;
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      addPlagiarismAlert('copy-paste', 'Copy operation detected', 'medium');
    };

    const handlePaste = (e: ClipboardEvent) => {
      const pastedText = e.clipboardData?.getData('text') || '';
      if (pastedText.length > 10) {
        addPlagiarismAlert('copy-paste', `Paste operation detected: "${pastedText.substring(0, 50)}..."`, 'high');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      lastActivityRef.current = Date.now();
      
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'a')) {
        addPlagiarismAlert('copy-paste', `Suspicious key combination: ${e.ctrlKey ? 'Ctrl' : 'Cmd'}+${e.key.toUpperCase()}`, 'medium');
      }

      if (e.altKey && e.key === 'Tab') {
        addPlagiarismAlert('tab-switch', 'Alt+Tab detected - possible window switching', 'high');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addPlagiarismAlert('suspicious-activity', 'Right-click menu access attempted', 'low');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isInterviewActive]);

  const addPlagiarismAlert = (type: PlagiarismAlert['type'], message: string, severity: PlagiarismAlert['severity']) => {
    const alert: PlagiarismAlert = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      severity
    };

    setPlagiarismAlerts(prev => [...prev, alert]);

    const scoreReduction = {
      low: 2,
      medium: 5,
      high: 10,
      critical: 20
    };

    setSecurityScore(prev => Math.max(0, prev - scoreReduction[severity]));
    setMisconduct(prev => [...prev, `${message} at ${formatTime(settings.duration * 60 - timeRemaining)}`]);
  };
  
  const simulateAdvancedProctoring = () => {
    const proctorChecks = [
      { time: 15000, check: () => Math.random() > 0.9, message: "Eye movement pattern suggests looking away from screen", severity: 'medium' as const },
      { time: 30000, check: () => Math.random() > 0.85, message: "Possible reference material detected in background", severity: 'high' as const },
      { time: 45000, check: () => Math.random() > 0.95, message: "Multiple faces detected in camera frame", severity: 'critical' as const },
    ];
    
    proctorChecks.forEach(({ time, check, message, severity }) => {
      setTimeout(() => {
        if (check() && isInterviewActive) {
          addPlagiarismAlert('suspicious-activity', message, severity);
        }
      }, time);
    });
  };
  
  const endInterview = () => {
    console.log('🏁 Ending interview...');
    setIsInterviewActive(false);
    setRecording(false);
    setAutoListening(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    cleanupSpeechSystems();

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    
    const interviewId = `interview-${Date.now()}`;
    
    let videoBlob = null;
    if (recordedChunks.length > 0) {
      videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
    }
    
    const interviewData = {
      questionsAsked: conversationState.askedQuestions,
      dynamicQuestions: conversationState.dynamicQuestions,
      userResponses: conversationState.userResponses,
      speechText: userSpeechText.trim(),
      misconduct: misconduct,
      plagiarismAlerts: plagiarismAlerts,
      securityScore: securityScore,
      responseQuality: responseQuality,
      audioAnalysis: audioAnalysis,
      videoRecording: videoBlob ? URL.createObjectURL(videoBlob) : null,
      proctoringSummary: {
        totalAlerts: plagiarismAlerts.length,
        criticalAlerts: plagiarismAlerts.filter(a => a.severity === 'critical').length,
        securityScore: securityScore,
        adaptiveQuestionsUsed: conversationState.dynamicQuestions.length,
        totalResponses: conversationState.userResponses.length,
        averageResponseLength: conversationState.userResponses.length > 0 
          ? Math.round(conversationState.userResponses.reduce((sum, r) => sum + r.response.length, 0) / conversationState.userResponses.length)
          : 0
      }
    };
    
    console.log('📊 Interview data collected:', interviewData);
    
    setTimeout(() => {
      onEnd(interviewId, interviewData);
    }, 2000);
  };
  
  const toggleMicrophone = () => {
    if (userStream) {
      userStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setMicMuted(!micMuted);
      
      if (!micMuted) {
        // Muting microphone
        setAutoListening(false);
        stopSpeechRecognition();
        setSpeechSystemStatus('Microphone muted');
      } else {
        // Unmuting microphone
        if (isInterviewActive && settings.microphoneEnabled && !aiSpeaking) {
          setAutoListening(true);
          setSpeechSystemStatus('Microphone enabled, ready to listen');
          setTimeout(() => {
            startSpeechRecognition();
          }, 500);
        }
      }
    }
  };
  
  const toggleCamera = () => {
    if (userStream) {
      userStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setCameraOff(!cameraOff);
    }
  };
  
  const toggleAiAudio = () => {
    setAiMuted(!aiMuted);
    if (!aiMuted && speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setAiSpeaking(false);
      if (currentUtteranceRef.current) {
        currentUtteranceRef.current = null;
      }
      if (isInterviewActive && !micMuted && settings.microphoneEnabled) {
        setAutoListening(true);
        startSpeechRecognition();
      }
    }
  };

  const getSecurityColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/30 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-900/30 border-orange-500/30';
      case 'medium': return 'text-amber-400 bg-amber-900/30 border-amber-500/30';
      case 'low': return 'text-blue-400 bg-blue-900/30 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-500/30';
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Brain className="mr-2 text-purple-500" />
            Advanced AI Interview - {settings.role}
          </h1>
          <p className="text-gray-400">
            {settings.category} • {settings.difficulty} difficulty • 
            {speechSupported ? ' Auto-listening enabled' : ' Manual input mode'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
            timeRemaining < 60 ? 'bg-red-500/20 text-red-300' : 'bg-gray-800 text-gray-300'
          }`}>
            <Clock size={18} />
            <span>{formatTime(timeRemaining)}</span>
          </div>
          
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${getSecurityColor(securityScore)} bg-gray-800`}>
            <Shield size={18} />
            <span>Security: {securityScore}%</span>
          </div>
          
          {recording && (
            <div className="flex items-center space-x-2 bg-red-500/20 text-red-300 px-4 py-2 rounded-full">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span>Recording</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced System Status */}
      <div className="mb-6 glass-effect rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <MessageCircle className="mr-2 text-blue-400" />
          Speech System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-3 rounded-lg border ${
            speechSupported ? 'border-green-500/30 bg-green-900/20' : 'border-red-500/30 bg-red-900/20'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Speech Recognition</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                speechSupported ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {speechSupported ? 'Supported' : 'Not Available'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{speechSystemStatus}</p>
          </div>

          <div className={`p-3 rounded-lg border ${
            permissionsGranted ? 'border-green-500/30 bg-green-900/20' : 'border-amber-500/30 bg-amber-900/20'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Microphone Access</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                permissionsGranted ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {permissionsGranted ? 'Granted' : 'Pending'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {permissionsGranted ? 'Audio input available' : 'Please allow microphone access'}
            </p>
          </div>

          <div className={`p-3 rounded-lg border ${
            isListening ? 'border-blue-500/30 bg-blue-900/20' : 'border-gray-500/30 bg-gray-900/20'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Listening Status</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                isListening ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {isListening ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {aiSpeaking ? 'AI is speaking' : 
               isListening ? 'Listening for speech' : 
               autoListening ? 'Ready to listen' : 'Manual mode'}
            </p>
          </div>
        </div>
      </div>

      {/* Security Alerts Panel */}
      {plagiarismAlerts.length > 0 && (
        <div className="mb-6 glass-effect rounded-xl p-4 border border-red-500/30">
          <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center">
            <AlertTriangle className="mr-2" />
            Security Alerts ({plagiarismAlerts.length})
          </h3>
          <div className="max-h-32 overflow-y-auto space-y-2">
            {plagiarismAlerts.slice(-5).map((alert) => (
              <div key={alert.id} className={`p-2 rounded-lg text-xs border ${getSeverityColor(alert.severity)}`}>
                <div className="flex justify-between items-start">
                  <span>{alert.message}</span>
                  <span className="text-xs opacity-75">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Interviewer */}
        <div className="glass-effect rounded-xl overflow-hidden">
          <div className="relative aspect-video bg-gradient-to-br from-purple-900 to-blue-900">
            <div className="absolute inset-0">
              <video 
                autoPlay 
                loop 
                muted
                playsInline
                className="w-full h-full object-cover opacity-80"
                poster="https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
              >
                <source src="https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0fd273d2c6d9a064f3ae35579b2bbdf&profile_id=139&oauth2_token_id=57447761" type="video/mp4" />
              </video>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/60 to-blue-900/60">
              <div className="text-center">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mb-4 ${
                  aiSpeaking ? 'animate-pulse scale-110' : ''
                } transition-all duration-300`}>
                  <span className="text-3xl">🤖</span>
                </div>
                <div className="text-white font-medium">Advanced AI Interviewer</div>
                <div className="text-xs text-purple-200 mt-1">
                  {isAnalyzingAudio ? 'Analyzing response...' : 
                   aiSpeaking ? 'Speaking...' :
                   waitingForResponse ? 'Waiting for your response...' :
                   'Listening & Adapting'}
                </div>
                {aiSpeaking && (
                  <div className="mt-2 flex justify-center space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="absolute top-4 right-4 flex space-x-2">
              <button 
                onClick={toggleAiAudio}
                className={`p-2 rounded-full ${
                  aiMuted ? 'bg-red-500' : 'bg-gray-800'
                }`}
                title={aiMuted ? 'Unmute AI' : 'Mute AI'}
              >
                {aiMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>

            {/* Enhanced status indicators */}
            <div className="absolute top-4 left-4 space-y-1">
              {autoListening && !aiSpeaking && speechSupported && (
                <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs flex items-center">
                  <MessageCircle size={12} className="mr-1" />
                  {isListening ? 'Listening...' : 'Auto-listening ready'}
                </div>
              )}
              {voicesLoaded && (
                <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs flex items-center">
                  <Volume2 size={12} className="mr-1" />
                  Voice synthesis ready
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Current Question:</h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">
                  {conversationState.currentQuestionIndex + 1} of {questions.length}
                </span>
                <button
                  onClick={nextQuestion}
                  disabled={aiSpeaking || conversationState.currentQuestionIndex >= questions.length - 1}
                  className={`p-1 rounded ${
                    !aiSpeaking && conversationState.currentQuestionIndex < questions.length - 1
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Next Question"
                >
                  <SkipForward size={16} />
                </button>
              </div>
            </div>
            <p className="text-gray-300 italic mb-4">{currentQuestion || "Loading question..."}</p>
            
            {/* Enhanced Speech Recognition Status */}
            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <h4 className="text-sm font-medium text-blue-300 mb-2">Speech System Status:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Recognition: <span className={`${speechSupported ? 'text-green-400' : 'text-red-400'}`}>
                  {speechSupported ? 'Available' : 'Not supported'}
                </span></div>
                <div>Listening: <span className={`${isListening ? 'text-green-400' : 'text-gray-400'}`}>
                  {isListening ? 'Active' : 'Inactive'}
                </span></div>
                <div>Auto-mode: <span className={`${autoListening ? 'text-green-400' : 'text-gray-400'}`}>
                  {autoListening ? 'Enabled' : 'Disabled'}
                </span></div>
                <div>Permissions: <span className={`${permissionsGranted ? 'text-green-400' : 'text-red-400'}`}>
                  {permissionsGranted ? 'Granted' : 'Denied'}
                </span></div>
              </div>
              <div className="mt-2 text-xs text-blue-300">
                Status: {speechSystemStatus}
              </div>
            </div>
            
            {/* Conversation Flow Status */}
            <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <h4 className="text-sm font-medium text-purple-300 mb-2">Interview Progress:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Questions Asked: <span className="text-purple-400">{conversationState.askedQuestions.length}</span></div>
                <div>Dynamic Questions: <span className="text-purple-400">{conversationState.dynamicQuestions.length}</span></div>
                <div>Responses: <span className="text-purple-400">{conversationState.userResponses.length}</span></div>
                <div>Phase: <span className="text-purple-400 capitalize">{interviewPhase}</span></div>
              </div>
            </div>
            
            {/* Audio Analysis Display */}
            {audioAnalysis && (
              <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <h4 className="text-sm font-medium text-green-300 mb-2">Latest Response Analysis:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Confidence: <span className="text-green-400">{Math.round(audioAnalysis.confidence * 100)}%</span></div>
                  <div>Clarity: <span className="text-green-400">{Math.round(audioAnalysis.clarity * 100)}%</span></div>
                  <div>Length: <span className="text-green-400">{audioAnalysis.responseLength} chars</span></div>
                  <div>Emotion: <span className="text-green-400 capitalize">{audioAnalysis.emotion}</span></div>
                </div>
                {audioAnalysis.keywords.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-400">Key topics: </span>
                    <span className="text-xs text-green-300">{audioAnalysis.keywords.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Recent Questions */}
            <div className="max-h-32 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Recent Questions:</h4>
              <div className="space-y-1">
                {conversationState.askedQuestions.slice(-3).map((q, index) => (
                  <div key={index} className={`text-xs p-2 rounded ${
                    conversationState.dynamicQuestions.includes(q) 
                      ? 'bg-green-800/50 text-green-300 border border-green-500/30' 
                      : 'bg-gray-800/50 text-gray-500'
                  }`}>
                    {q}
                    {conversationState.dynamicQuestions.includes(q) && (
                      <span className="ml-2 text-xs bg-green-500/20 px-1 rounded">AI Generated</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* User Video */}
        <div className="glass-effect rounded-xl overflow-hidden">
          <div className="relative aspect-video bg-gray-900">
            {settings.cameraEnabled ? (
              <video 
                ref={userVideoRef}
                autoPlay 
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <div className="text-center text-gray-400">
                  <Camera size={48} className="mx-auto mb-2" />
                  <p>Camera Disabled</p>
                </div>
              </div>
            )}
            
            <div className="absolute top-4 left-4 bg-gray-900/70 px-3 py-1 rounded-lg text-sm flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-xs">👤</span>
              </div>
              <span>You</span>
            </div>
            
            {/* Enhanced Status Indicators */}
            <div className="absolute top-4 right-4 space-y-1">
              {speechSupported && autoListening && isListening && !aiSpeaking && (
                <div className="bg-green-500/80 px-3 py-1 rounded-lg text-sm flex items-center">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse mr-2"></div>
                  Listening
                </div>
              )}
              {speechSupported && autoListening && !isListening && !aiSpeaking && waitingForResponse && (
                <div className="bg-blue-500/80 px-3 py-1 rounded-lg text-sm flex items-center">
                  <MessageCircle size={16} className="mr-1" />
                  Ready to listen
                </div>
              )}
              {waitingForResponse && (
                <div className="bg-purple-500/80 px-3 py-1 rounded-lg text-sm flex items-center">
                  <MessageCircle size={16} className="mr-1" />
                  Your turn to speak
                </div>
              )}
              {!speechSupported && (
                <div className="bg-amber-500/80 px-3 py-1 rounded-lg text-sm flex items-center">
                  <AlertTriangle size={16} className="mr-1" />
                  Manual mode
                </div>
              )}
              {securityScore < 80 && (
                <div className="bg-red-500/80 px-3 py-1 rounded-lg text-sm flex items-center">
                  <AlertTriangle size={16} className="mr-1" />
                  Security: {securityScore}%
                </div>
              )}
            </div>
            
            <div className="absolute bottom-4 right-4 flex space-x-2">
              <button 
                onClick={toggleMicrophone}
                className={`p-2 rounded-full ${
                  micMuted ? 'bg-red-500' : 'bg-gray-800'
                }`}
                title={micMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {micMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button 
                onClick={toggleCamera}
                className={`p-2 rounded-full ${
                  cameraOff ? 'bg-red-500' : 'bg-gray-800'
                }`}
                title={cameraOff ? 'Turn On Camera' : 'Turn Off Camera'}
              >
                {cameraOff ? <CameraOff size={20} /> : <Camera size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Speech-to-Text Display */}
      <div className="mt-6 glass-effect rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-3">
              <span className="text-sm">👤</span>
            </div>
            Your Speech (Real-time Transcription & Analysis)
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                speechSupported && autoListening && isListening ? 'bg-green-500 animate-pulse' : 
                speechSupported && autoListening ? 'bg-blue-500' : 
                speechSupported ? 'bg-amber-500' : 'bg-gray-500'
              }`}></div>
              <span className="text-sm text-gray-400">
                {!speechSupported ? 'Not supported' :
                 autoListening && isListening ? 'Listening' : 
                 autoListening ? 'Ready' : 'Manual'}
              </span>
            </div>
            
            {isAnalyzingAudio && (
              <div className="flex items-center text-purple-400">
                <Brain className="animate-spin h-4 w-4 mr-2" />
                <span className="text-sm">Analyzing...</span>
              </div>
            )}

            {speechSupported && (
              <button
                onClick={() => {
                  if (isListening) {
                    stopSpeechRecognition();
                  } else {
                    startSpeechRecognition();
                  }
                }}
                disabled={aiSpeaking || micMuted}
                className={`px-3 py-1 rounded-lg text-sm ${
                  isListening 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed'
                }`}
              >
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-4 min-h-[120px] max-h-[200px] overflow-y-auto">
          {userSpeechText || currentTranscript ? (
            <div className="text-gray-200 leading-relaxed">
              <span>{userSpeechText}</span>
              {currentTranscript && (
                <span className="text-blue-400 italic">{currentTranscript}</span>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              {!speechSupported 
                ? "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari for automatic speech-to-text."
                : !permissionsGranted
                ? "Microphone access denied. Please refresh and allow microphone permissions for speech recognition."
                : micMuted 
                ? "Microphone is muted. Enable microphone to see speech transcription."
                : aiSpeaking
                ? "AI is speaking. Please wait for the AI to finish before responding."
                : autoListening && isListening
                ? "I'm listening... Start speaking to see your words appear here with real-time analysis." 
                : autoListening
                ? "Auto-listening is enabled. I'll start listening when the AI finishes speaking."
                : "Speech recognition is ready. Click 'Start Listening' to begin."}
            </p>
          )}
        </div>
        
        {/* Response Quality Metrics */}
        {responseQuality.length > 0 && (
          <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <h4 className="text-sm font-medium text-purple-300 mb-2">Response Quality Trend:</h4>
            <div className="flex items-center space-x-2">
              {responseQuality.slice(-5).map((quality, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className={`w-4 h-8 rounded ${
                      quality >= 80 ? 'bg-green-500' : 
                      quality >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ height: `${Math.max(8, quality / 3)}px` }}
                  ></div>
                  <span className="text-xs text-gray-400 mt-1">{Math.round(quality)}%</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-purple-400 mt-2">
              Average: {Math.round(responseQuality.reduce((a, b) => a + b, 0) / responseQuality.length)}%
            </p>
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>
              Speech recognition: {
                !speechSupported ? 'Not supported' :
                !permissionsGranted ? 'No permissions' :
                isListening ? 'Active' : 'Inactive'
              }
            </span>
            <span>
              Auto-listening: {autoListening ? 'Enabled' : 'Disabled'}
            </span>
            <span>
              Microphone: {micMuted ? 'Muted' : 'Active'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Responses: {conversationState.userResponses.length}</span>
            <span>•</span>
            <span>Dynamic Q's: {conversationState.dynamicQuestions.length}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <button
          onClick={endInterview}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          End Interview Early
        </button>
      </div>
    </div>
  );
};

export default VideoInterface;