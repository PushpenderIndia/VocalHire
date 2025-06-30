import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Brain, MessageCircle, User, Bot, Loader, Settings, Globe, Languages, AlertCircle, Wifi, WifiOff, Upload, FileText, X, Copy, Heart, Bookmark, Smile, ThumbsUp, Star, Zap, Target, Lightbulb, TrendingUp, Award, CheckCircle, Play, Pause, RotateCcw, Sparkles, Palette, Clock, BarChart3 } from 'lucide-react';
import { useGeminiMentor } from '../hooks/useGeminiMentor';
import GeminiApiSetup from '../components/GeminiApiSetup';

interface Message {
  id: string;
  type: 'user' | 'mentor';
  content: string;
  timestamp: Date;
  language?: string;
  bookmarked?: boolean;
  reaction?: string;
  documentAnalysis?: boolean;
}

interface VoiceSettings {
  enabled: boolean;
  autoSpeak: boolean;
  language: string;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

interface AISettings {
  creativity: number;
  personality: string;
  responseLength: string;
  expertiseArea: string;
}

interface UploadedDocument {
  name: string;
  type: string;
  size: number;
  content: string;
  uploadDate: Date;
}

const MentorPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'mentor',
      content: '🌟 Hello! I\'m your enhanced AI Career Mentor with advanced capabilities! I can help you with:\n\n📄 **Document Analysis** - Upload resumes, cover letters, or any career documents\n🎯 **Personalized Guidance** - Tailored advice based on your goals\n🗣️ **Multilingual Support** - Communicate in 25+ languages\n💼 **Interview Preparation** - Practice with realistic scenarios\n📊 **Career Planning** - Strategic development roadmaps\n\nHow can I assist you today? Feel free to upload a document or ask me anything!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    const saved = localStorage.getItem('voice_settings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      autoSpeak: true,
      language: 'en-US',
      voice: '',
      rate: 1,
      pitch: 1,
      volume: 0.8
    };
  });

  const [aiSettings, setAISettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem('ai_settings');
    return saved ? JSON.parse(saved) : {
      creativity: 0.8,
      personality: 'professional',
      responseLength: 'balanced',
      expertiseArea: 'general'
    };
  });

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Auto-set the provided API key
  const providedApiKey = 'AIzaSyBoWA_MmKc79fBQRBhGUJJtlIs9FwyXMrI';
  useEffect(() => {
    if (!localStorage.getItem('gemini_api_key')) {
      localStorage.setItem('gemini_api_key', providedApiKey);
    }
  }, []);

  const apiKey = localStorage.getItem('gemini_api_key') || providedApiKey;
  const { generateResponse, isLoading, error, clearError, isConfigured } = useGeminiMentor(apiKey);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced language options with better voice mapping
  const languages = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸', voiceNames: ['Microsoft Zira', 'Google US English', 'Alex', 'Samantha'] },
    { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧', voiceNames: ['Microsoft Hazel', 'Google UK English Female', 'Daniel', 'Kate'] },
    { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸', voiceNames: ['Microsoft Helena', 'Google español', 'Monica', 'Paulina'] },
    { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽', voiceNames: ['Microsoft Sabina', 'Google español de Estados Unidos', 'Juan', 'Angelica'] },
    { code: 'fr-FR', name: 'French', flag: '🇫🇷', voiceNames: ['Microsoft Hortense', 'Google français', 'Thomas', 'Amelie'] },
    { code: 'de-DE', name: 'German', flag: '🇩🇪', voiceNames: ['Microsoft Hedda', 'Google Deutsch', 'Anna', 'Petra'] },
    { code: 'it-IT', name: 'Italian', flag: '🇮🇹', voiceNames: ['Microsoft Elsa', 'Google italiano', 'Luca', 'Alice'] },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷', voiceNames: ['Microsoft Maria', 'Google português do Brasil', 'Luciana', 'Felipe'] },
    { code: 'pt-PT', name: 'Portuguese (Portugal)', flag: '🇵🇹', voiceNames: ['Microsoft Helia', 'Google português', 'Catarina', 'Joana'] },
    { code: 'ru-RU', name: 'Russian', flag: '🇷🇺', voiceNames: ['Microsoft Irina', 'Google русский', 'Yuri', 'Milena'] },
    { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳', voiceNames: ['Microsoft Huihui', 'Google 普通话（中国大陆）', 'Ting-Ting', 'Sin-ji'] },
    { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '🇹🇼', voiceNames: ['Microsoft Hanhan', 'Google 國語（臺灣）', 'Mei-Jia', 'Ya-Ling'] },
    { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵', voiceNames: ['Microsoft Haruka', 'Google 日本語', 'Kyoko', 'Otoya'] },
    { code: 'ko-KR', name: 'Korean', flag: '🇰🇷', voiceNames: ['Microsoft Heami', 'Google 한국의', 'Yuna', 'Sora'] },
    { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦', voiceNames: ['Microsoft Naayf', 'Google العربية', 'Maged', 'Tarik'] },
    { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳', voiceNames: ['Microsoft Kalpana', 'Google हिन्दी', 'Lekha', 'Kalpana'] },
    { code: 'bn-IN', name: 'Bengali', flag: '🇮🇳', voiceNames: ['Google বাংলা', 'Lekha Bengali'] },
    { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳', voiceNames: ['Google தமிழ்', 'Lekha Tamil'] },
    { code: 'te-IN', name: 'Telugu', flag: '🇮🇳', voiceNames: ['Google తెలుగు', 'Lekha Telugu'] },
    { code: 'mr-IN', name: 'Marathi', flag: '🇮🇳', voiceNames: ['Google मराठी', 'Lekha Marathi'] },
    { code: 'gu-IN', name: 'Gujarati', flag: '🇮🇳', voiceNames: ['Google ગુજરાતી', 'Lekha Gujarati'] },
    { code: 'kn-IN', name: 'Kannada', flag: '🇮🇳', voiceNames: ['Google ಕನ್ನಡ', 'Lekha Kannada'] },
    { code: 'ml-IN', name: 'Malayalam', flag: '🇮🇳', voiceNames: ['Google മലയാളം', 'Lekha Malayalam'] },
    { code: 'pa-IN', name: 'Punjabi', flag: '🇮🇳', voiceNames: ['Google ਪੰਜਾਬੀ', 'Lekha Punjabi'] },
    { code: 'ur-PK', name: 'Urdu', flag: '🇵🇰', voiceNames: ['Google اردو', 'Lekha Urdu'] }
  ];

  const personalities = [
    { id: 'professional', name: 'Professional', icon: '💼', description: 'Formal, structured, business-focused' },
    { id: 'friendly', name: 'Friendly', icon: '😊', description: 'Warm, approachable, encouraging' },
    { id: 'enthusiastic', name: 'Enthusiastic', icon: '🚀', description: 'Energetic, motivating, inspiring' },
    { id: 'supportive', name: 'Supportive', icon: '🤝', description: 'Empathetic, understanding, nurturing' },
    { id: 'creative', name: 'Creative', icon: '🎨', description: 'Innovative, out-of-the-box thinking' },
    { id: 'analytical', name: 'Analytical', icon: '📊', description: 'Data-driven, logical, systematic' }
  ];

  const expertiseAreas = [
    { id: 'general', name: 'General Career Guidance', icon: '🎯' },
    { id: 'tech', name: 'Technology & Engineering', icon: '💻' },
    { id: 'business', name: 'Business & Management', icon: '📈' },
    { id: 'creative', name: 'Creative & Design', icon: '🎨' },
    { id: 'healthcare', name: 'Healthcare & Medical', icon: '🏥' },
    { id: 'finance', name: 'Finance & Banking', icon: '💰' },
    { id: 'education', name: 'Education & Training', icon: '🎓' },
    { id: 'marketing', name: 'Marketing & Sales', icon: '📢' },
    { id: 'legal', name: 'Legal & Compliance', icon: '⚖️' },
    { id: 'consulting', name: 'Consulting & Strategy', icon: '💼' }
  ];

  // Initialize speech synthesis and recognition
  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || [];
        setAvailableVoices(voices);
        
        const currentLang = languages.find(lang => lang.code === selectedLanguage);
        if (currentLang && !voiceSettings.voice) {
          const bestVoice = findBestVoiceForLanguage(voices, selectedLanguage, currentLang.voiceNames);
          if (bestVoice) {
            setVoiceSettings(prev => ({ ...prev, voice: bestVoice.name }));
          }
        }
      };

      loadVoices();
      synthRef.current.onvoiceschanged = loadVoices;
      
      if (synthRef.current.getVoices().length > 0) {
        loadVoices();
      }
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      
      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = selectedLanguage;

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setCurrentTranscript('');
          setSpeechError(null);
        };

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setInputMessage(finalTranscript);
            setCurrentTranscript('');
          } else {
            setCurrentTranscript(interimTranscript);
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          setCurrentTranscript('');
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          setCurrentTranscript('');
          
          let errorMessage = '';
          switch (event.error) {
            case 'network':
              errorMessage = 'Speech recognition failed due to a network issue. Please check your internet connection and try again.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone access was denied. Please allow microphone permissions and try again.';
              break;
            case 'no-speech':
              errorMessage = 'No speech was detected. Please try speaking again.';
              break;
            case 'audio-capture':
              errorMessage = 'Audio capture failed. Please check your microphone and try again.';
              break;
            case 'service-not-allowed':
              errorMessage = 'Speech recognition service is not available. Please try again later.';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}. Please try again.`;
          }
          
          setSpeechError(errorMessage);
          setTimeout(() => setSpeechError(null), 5000);
        };

        setSpeechSupported(true);
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        setSpeechSupported(false);
      }
    }
  }, [selectedLanguage]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('voice_settings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  useEffect(() => {
    localStorage.setItem('ai_settings', JSON.stringify(aiSettings));
  }, [aiSettings]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Find best voice for language
  const findBestVoiceForLanguage = (voices: SpeechSynthesisVoice[], langCode: string, preferredNames: string[]): SpeechSynthesisVoice | null => {
    const langPrefix = langCode.split('-')[0];
    
    for (const preferredName of preferredNames) {
      const voice = voices.find(v => 
        v.name.includes(preferredName) && 
        (v.lang === langCode || v.lang.startsWith(langPrefix))
      );
      if (voice) return voice;
    }
    
    const exactMatch = voices.find(v => v.lang === langCode);
    if (exactMatch) return exactMatch;
    
    const prefixMatch = voices.find(v => v.lang.startsWith(langPrefix));
    if (prefixMatch) return prefixMatch;
    
    const nameMatch = voices.find(v => 
      v.name.toLowerCase().includes(langPrefix) || 
      v.lang.toLowerCase().includes(langPrefix)
    );
    
    return nameMatch || null;
  };

  const handleApiKeySet = (newApiKey: string) => {
    localStorage.setItem('gemini_api_key', newApiKey);
    window.location.reload();
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setSpeechError(null);
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setSpeechError('Failed to start speech recognition. Please try again.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const speakMessage = (text: string, language?: string) => {
    if (!synthRef.current || !voiceSettings.enabled) return;

    synthRef.current.cancel();
    if (currentUtteranceRef.current) {
      currentUtteranceRef.current = null;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtteranceRef.current = utterance;
    
    const targetLang = language || voiceSettings.language;
    const currentLangData = languages.find(l => l.code === targetLang);
    
    let selectedVoice = null;
    
    if (voiceSettings.voice) {
      selectedVoice = availableVoices.find(v => v.name === voiceSettings.voice);
    }
    
    if (!selectedVoice && currentLangData) {
      selectedVoice = findBestVoiceForLanguage(availableVoices, targetLang, currentLangData.voiceNames);
    }
    
    if (!selectedVoice) {
      const langPrefix = targetLang.split('-')[0];
      selectedVoice = availableVoices.find(v => 
        v.lang === targetLang || 
        v.lang.startsWith(langPrefix)
      );
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = targetLang;
    }
    
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };
    
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, Word document, or text file');
      return;
    }

    try {
      let content = '';
      
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        content = await file.text();
      } else if (file.type === 'application/pdf') {
        // For PDF files, we'll extract text content
        const arrayBuffer = await file.arrayBuffer();
        // Note: In a real implementation, you'd use a PDF parsing library
        content = `[PDF Document: ${file.name}] - Content extraction would be implemented here with a PDF parsing library.`;
      } else {
        // For Word documents
        content = `[Word Document: ${file.name}] - Content extraction would be implemented here with a document parsing library.`;
      }

      const newDocument: UploadedDocument = {
        name: file.name,
        type: file.type,
        size: file.size,
        content,
        uploadDate: new Date()
      };

      setUploadedDocuments(prev => [...prev, newDocument]);

      // Auto-analyze the document
      const analysisMessage = `📄 **Document Uploaded: ${file.name}**\n\nI've received your document and I'm ready to analyze it! Please let me know what specific feedback you'd like:\n\n• **Resume Review** - Comprehensive analysis with improvement suggestions\n• **Cover Letter Optimization** - Personalization and impact enhancement\n• **Job Description Matching** - Skills alignment and gap analysis\n• **ATS Optimization** - Keyword and formatting recommendations\n• **General Feedback** - Overall document assessment\n\nWhat would you like me to focus on?`;

      const documentMessage: Message = {
        id: Date.now().toString(),
        type: 'mentor',
        content: analysisMessage,
        timestamp: new Date(),
        language: selectedLanguage,
        documentAnalysis: true
      };

      setMessages(prev => [...prev, documentMessage]);

      if (voiceSettings.enabled && voiceSettings.autoSpeak) {
        setTimeout(() => speakMessage(analysisMessage, selectedLanguage), 500);
      }

    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    }
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !isConfigured) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      language: selectedLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    clearError();
    setIsTyping(true);

    try {
      const languageName = getLanguageName(selectedLanguage);
      const personalityPrompt = getPersonalityPrompt();
      const expertisePrompt = getExpertisePrompt();
      const creativityPrompt = getCreativityPrompt();
      const lengthPrompt = getLengthPrompt();
      
      let enhancedPrompt = `${personalityPrompt} ${expertisePrompt} ${creativityPrompt} ${lengthPrompt}

Please respond in ${languageName} language with the specified personality and expertise focus.`;

      // Add document context if available
      if (uploadedDocuments.length > 0) {
        const latestDoc = uploadedDocuments[uploadedDocuments.length - 1];
        enhancedPrompt += `\n\nDocument Context: The user has uploaded "${latestDoc.name}" (${latestDoc.type}). Content preview: ${latestDoc.content.substring(0, 500)}...`;
      }

      enhancedPrompt += `\n\nUser message: ${userMessage.content}`;
      
      const response = await generateResponse(enhancedPrompt, messages.slice(-6));
      
      setIsTyping(false);
      
      const mentorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'mentor',
        content: response,
        timestamp: new Date(),
        language: selectedLanguage
      };

      setMessages(prev => [...prev, mentorMessage]);
      
      if (voiceSettings.enabled && voiceSettings.autoSpeak) {
        setTimeout(() => speakMessage(response, selectedLanguage), 500);
      }
    } catch (error) {
      setIsTyping(false);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'mentor',
        content: '⚠️ I apologize, but I encountered an error while processing your request. This might be due to:\n\n• **API Rate Limits** - Please wait a moment and try again\n• **Network Issues** - Check your internet connection\n• **Service Overload** - The AI service might be busy\n\nPlease try again in a few moments. If the issue persists, you can:\n• Refresh the page\n• Check your API key configuration\n• Try a simpler question first',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const getPersonalityPrompt = () => {
    const personality = personalities.find(p => p.id === aiSettings.personality);
    return `Adopt a ${personality?.name.toLowerCase()} personality: ${personality?.description}.`;
  };

  const getExpertisePrompt = () => {
    const expertise = expertiseAreas.find(e => e.id === aiSettings.expertiseArea);
    return `Focus your expertise on ${expertise?.name.toLowerCase()} with specialized knowledge in this area.`;
  };

  const getCreativityPrompt = () => {
    const creativity = aiSettings.creativity;
    if (creativity >= 0.8) return 'Be highly creative, innovative, and think outside the box with unique perspectives.';
    if (creativity >= 0.5) return 'Balance creativity with practicality, offering both conventional and innovative solutions.';
    return 'Focus on practical, proven approaches with structured, conventional advice.';
  };

  const getLengthPrompt = () => {
    switch (aiSettings.responseLength) {
      case 'concise': return 'Keep responses concise and to the point (100-200 words).';
      case 'detailed': return 'Provide comprehensive, detailed responses with examples (400-600 words).';
      default: return 'Provide balanced responses with good detail (200-400 words).';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || code;
  };

  const getLanguageFlag = (code: string) => {
    return languages.find(lang => lang.code === code)?.flag || '🌐';
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // You could add a toast notification here
  };

  const toggleBookmark = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, bookmarked: !msg.bookmarked } : msg
    ));
  };

  const addReaction = (messageId: string, reaction: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, reaction } : msg
    ));
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  if (!isConfigured) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center justify-center">
              <Brain className="mr-3 text-purple-500" />
              Enhanced AI Career Mentor
            </h1>
            <p className="text-gray-400">
              Advanced AI-powered career guidance with document analysis, multilingual support, and personalized coaching.
            </p>
          </div>
          
          <GeminiApiSetup onApiKeySet={handleApiKeySet} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Brain className="mr-3 text-purple-500" />
              Enhanced AI Career Mentor
            </h1>
            <p className="text-gray-400 flex items-center mt-2">
              <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
              Advanced AI with document analysis, multilingual support & personalized guidance
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-3 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none min-w-[200px]"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            </div>

            {/* Settings Buttons */}
            <button
              onClick={() => setShowAISettings(!showAISettings)}
              className={`p-2 rounded-lg transition-colors ${
                showAISettings ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
              title="AI Settings"
            >
              <Palette size={20} />
            </button>

            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className={`p-2 rounded-lg transition-colors ${
                voiceSettings.enabled ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
              title="Voice Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="glass-effect rounded-lg p-3 mb-6 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>AI Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <Palette className="h-4 w-4 text-purple-400" />
              <span>{personalities.find(p => p.id === aiSettings.personality)?.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <span>Creativity: {Math.round(aiSettings.creativity * 100)}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-400" />
              <span>{expertiseAreas.find(e => e.id === aiSettings.expertiseArea)?.name}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <Languages size={14} />
            <span>{getLanguageName(selectedLanguage)}</span>
          </div>
        </div>

        {/* AI Settings Panel */}
        {showAISettings && (
          <div className="glass-effect rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Palette className="mr-2 text-purple-400" />
              AI Personality & Behavior Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Creativity Level */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Creativity Level: {Math.round(aiSettings.creativity * 100)}%
                </label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1" 
                  step="0.1"
                  value={aiSettings.creativity}
                  onChange={(e) => setAISettings(prev => ({ ...prev, creativity: parseFloat(e.target.value) }))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Conservative</span>
                  <span>Balanced</span>
                  <span>Innovative</span>
                </div>
              </div>

              {/* Response Length */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Response Length
                </label>
                <select
                  value={aiSettings.responseLength}
                  onChange={(e) => setAISettings(prev => ({ ...prev, responseLength: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="concise">Concise (100-200 words)</option>
                  <option value="balanced">Balanced (200-400 words)</option>
                  <option value="detailed">Detailed (400-600 words)</option>
                </select>
              </div>

              {/* Personality */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  AI Personality
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {personalities.map(personality => (
                    <button
                      key={personality.id}
                      onClick={() => setAISettings(prev => ({ ...prev, personality: personality.id }))}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        aiSettings.personality === personality.id
                          ? 'border-purple-500 bg-purple-900/30 text-white'
                          : 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{personality.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{personality.name}</div>
                          <div className="text-xs opacity-75">{personality.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expertise Area */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Expertise Focus
                </label>
                <select
                  value={aiSettings.expertiseArea}
                  onChange={(e) => setAISettings(prev => ({ ...prev, expertiseArea: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {expertiseAreas.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.icon} {area.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Voice Settings Panel */}
        {showVoiceSettings && (
          <div className="glass-effect rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Volume2 className="mr-2 text-blue-400" />
              Enhanced Voice Settings for {getLanguageName(selectedLanguage)}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Voice Response
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={voiceSettings.enabled}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm">Enable voice responses</span>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={voiceSettings.autoSpeak}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, autoSpeak: e.target.checked }))}
                      className="rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500"
                      disabled={!voiceSettings.enabled}
                    />
                    <span className="ml-2 text-sm">Auto-speak new messages</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Voice Selection
                </label>
                <select
                  value={voiceSettings.voice}
                  onChange={(e) => setVoiceSettings(prev => ({ ...prev, voice: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={!voiceSettings.enabled}
                >
                  <option value="">Auto-select best voice</option>
                  {availableVoices.filter(voice => 
                    voice.lang === selectedLanguage || 
                    voice.lang.startsWith(selectedLanguage.split('-')[0])
                  ).map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Speech Rate: {voiceSettings.rate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSettings.rate}
                  onChange={(e) => setVoiceSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                  className="w-full accent-purple-500"
                  disabled={!voiceSettings.enabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Volume: {Math.round(voiceSettings.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.volume}
                  onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                  className="w-full accent-purple-500"
                  disabled={!voiceSettings.enabled}
                />
              </div>
            </div>

            {voiceSettings.enabled && (
              <div className="mt-4 flex items-center space-x-4">
                <button
                  onClick={() => speakMessage(`Hello! I'm speaking in ${getLanguageName(selectedLanguage)} with enhanced voice capabilities.`, selectedLanguage)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  disabled={isSpeaking}
                >
                  {isSpeaking ? 'Speaking...' : `Test Voice`}
                </button>
                
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Stop Speaking
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Document Upload Area */}
        <div 
          className={`glass-effect rounded-xl p-6 mb-6 border-2 border-dashed transition-all ${
            isDragOver ? 'border-purple-500 bg-purple-900/20' : 'border-gray-600'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Document Analysis</h3>
            <p className="text-gray-400 mb-4">
              Drag & drop your resume, cover letter, or any career document for AI analysis
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary px-6 py-2 rounded-lg font-medium text-white"
              >
                Choose File
              </button>
              <span className="text-sm text-gray-400 self-center">
                PDF, Word, Text files (max 10MB)
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.csv"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Uploaded Documents */}
          {uploadedDocuments.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h4 className="font-medium mb-3">Uploaded Documents:</h4>
              <div className="space-y-2">
                {uploadedDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-400" />
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-sm text-gray-400">
                          {(doc.size / 1024).toFixed(1)} KB • {doc.uploadDate.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDocument(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Speech Error Display */}
        {speechError && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-lg flex items-start space-x-3">
            <WifiOff className="text-red-400 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h4 className="text-red-300 font-medium mb-1">Speech Recognition Error</h4>
              <p className="text-red-200 text-sm">{speechError}</p>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="glass-effect rounded-xl overflow-hidden">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg relative group ${
                    message.type === 'user'
                      ? 'bg-purple-600 text-white'
                      : message.documentAnalysis
                      ? 'bg-blue-900/30 border border-blue-500/30 text-gray-200'
                      : 'bg-gray-800 text-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' ? 'bg-purple-700' : 'bg-gray-700'
                    }`}>
                      {message.type === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className="flex-1">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs opacity-75">
                          {message.timestamp.toLocaleTimeString()}
                          {message.language && (
                            <span className="ml-2">
                              {getLanguageFlag(message.language)} {getLanguageName(message.language)}
                            </span>
                          )}
                        </div>
                        
                        {/* Message Actions */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyMessage(message.content)}
                            className="text-xs opacity-75 hover:opacity-100 transition-opacity p-1"
                            title="Copy message"
                          >
                            <Copy size={12} />
                          </button>
                          
                          <button
                            onClick={() => toggleBookmark(message.id)}
                            className={`text-xs p-1 transition-colors ${
                              message.bookmarked ? 'text-amber-400' : 'opacity-75 hover:opacity-100'
                            }`}
                            title="Bookmark message"
                          >
                            <Bookmark size={12} fill={message.bookmarked ? 'currentColor' : 'none'} />
                          </button>
                          
                          {message.type === 'mentor' && voiceSettings.enabled && (
                            <button
                              onClick={() => speakMessage(message.content, message.language)}
                              className="text-xs opacity-75 hover:opacity-100 transition-opacity p-1"
                              disabled={isSpeaking}
                              title="Speak message"
                            >
                              {isSpeaking ? <Pause size={12} /> : <Play size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Reaction Buttons */}
                      {message.type === 'mentor' && (
                        <div className="flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {['👍', '❤️', '🎯', '💡', '🚀'].map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => addReaction(message.id, emoji)}
                              className={`text-xs p-1 rounded hover:bg-gray-700 transition-colors ${
                                message.reaction === emoji ? 'bg-gray-600' : ''
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-200 max-w-xs lg:max-w-md px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot size={16} />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm">AI is thinking creatively...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="px-6 py-2 bg-red-900/30 border-t border-red-500/30 flex items-start space-x-3">
              <AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <p className="text-red-300 text-sm font-medium">API Error</p>
                <p className="text-red-200 text-xs">{error}</p>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center space-x-3">
              {/* Voice Input */}
              {speechSupported && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`p-3 rounded-lg transition-colors ${
                    isListening 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : speechError
                      ? 'bg-red-800 text-red-200'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                  title={
                    speechError 
                      ? 'Speech recognition error - click to retry'
                      : isListening 
                      ? 'Stop listening' 
                      : 'Start voice input'
                  }
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}

              {/* Voice Output Control */}
              {voiceSettings.enabled && (
                <button
                  onClick={isSpeaking ? stopSpeaking : () => {}}
                  className={`p-3 rounded-lg transition-colors ${
                    isSpeaking 
                      ? 'bg-blue-600 text-white animate-pulse' 
                      : 'bg-gray-800 text-gray-400'
                  }`}
                  title={isSpeaking ? 'Stop speaking' : 'Voice output enabled'}
                >
                  {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              )}

              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Ask me anything in ${getLanguageName(selectedLanguage)}... (Press Enter to send, Shift+Enter for new line)`}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={1}
                  disabled={isLoading || isTyping}
                />
                {currentTranscript && (
                  <div className="absolute bottom-full left-0 right-0 bg-blue-900/30 border border-blue-500/30 rounded-t-lg px-4 py-2">
                    <div className="text-blue-300 text-sm">
                      Listening in {getLanguageName(selectedLanguage)}: <span className="italic">{currentTranscript}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading || isTyping}
                className="btn-primary p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send message"
              >
                <Send size={20} />
              </button>
            </div>

            {/* Enhanced Status Bar */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  {getLanguageFlag(selectedLanguage)}
                  <span>Speaking in {getLanguageName(selectedLanguage)}</span>
                </span>
                {speechSupported && (
                  <span className={`flex items-center space-x-1 ${isListening ? 'text-red-400' : speechError ? 'text-red-400' : ''}`}>
                    🎤 
                    <span>{isListening ? 'Listening...' : speechError ? 'Voice error' : 'Voice ready'}</span>
                  </span>
                )}
                {voiceSettings.enabled && (
                  <span className={`flex items-center space-x-1 ${isSpeaking ? 'text-blue-400' : ''}`}>
                    🔊 
                    <span>{isSpeaking ? 'Speaking...' : voiceSettings.autoSpeak ? 'Auto-speak on' : 'Voice enabled'}</span>
                  </span>
                )}
                {uploadedDocuments.length > 0 && (
                  <span className="flex items-center space-x-1 text-green-400">
                    📄 
                    <span>{uploadedDocuments.length} document{uploadedDocuments.length > 1 ? 's' : ''} ready</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Languages size={14} className="inline" />
                <span>{languages.length}+ Languages • Enhanced AI • Document Analysis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setInputMessage('Can you help me optimize my resume for ATS systems and provide specific improvement suggestions?')}
            className="glass-effect rounded-lg p-4 text-left hover:bg-gray-800/50 transition-colors group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <FileText className="h-6 w-6 text-blue-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold">Resume Optimization</h3>
            </div>
            <p className="text-sm text-gray-400">Get ATS-friendly resume analysis and improvement tips</p>
          </button>
          
          <button
            onClick={() => setInputMessage('I need help preparing for a technical interview. Can you create a practice scenario and provide feedback?')}
            className="glass-effect rounded-lg p-4 text-left hover:bg-gray-800/50 transition-colors group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Target className="h-6 w-6 text-green-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold">Interview Practice</h3>
            </div>
            <p className="text-sm text-gray-400">Practice with realistic interview scenarios and get feedback</p>
          </button>
          
          <button
            onClick={() => setInputMessage('Can you analyze my career path and suggest strategic next steps for professional growth?')}
            className="glass-effect rounded-lg p-4 text-left hover:bg-gray-800/50 transition-colors group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="h-6 w-6 text-purple-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold">Career Strategy</h3>
            </div>
            <p className="text-sm text-gray-400">Get personalized career development and growth planning</p>
          </button>
          
          <button
            onClick={() => setInputMessage('Help me research salary ranges and prepare negotiation strategies for my role and location.')}
            className="glass-effect rounded-lg p-4 text-left hover:bg-gray-800/50 transition-colors group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Award className="h-6 w-6 text-amber-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold">Salary Negotiation</h3>
            </div>
            <p className="text-sm text-gray-400">Research market rates and develop negotiation strategies</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorPage;