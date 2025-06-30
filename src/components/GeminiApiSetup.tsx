import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface GeminiApiSetupProps {
  onApiKeySet: (apiKey: string) => void;
  currentApiKey?: string;
}

const GeminiApiSetup: React.FC<GeminiApiSetupProps> = ({ onApiKeySet, currentApiKey }) => {
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Auto-set the provided API key on component mount
  useEffect(() => {
    const providedApiKey = 'AIzaSyBoWA_MmKc79fBQRBhGUJJtlIs9FwyXMrI';
    if (!currentApiKey && !localStorage.getItem('gemini_api_key')) {
      setApiKey(providedApiKey);
      localStorage.setItem('gemini_api_key', providedApiKey);
      onApiKeySet(providedApiKey);
    }
  }, [currentApiKey, onApiKeySet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsValidating(true);
    
    // Simple validation - check if it looks like a valid API key
    const trimmedKey = apiKey.trim();
    if (trimmedKey.length < 20 || !trimmedKey.startsWith('AIza')) {
      alert('Please enter a valid Gemini API key. It should start with "AIza" and be at least 20 characters long.');
      setIsValidating(false);
      return;
    }

    try {
      onApiKeySet(trimmedKey);
    } catch (error) {
      console.error('Error setting API key:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleUseProvidedKey = () => {
    const providedApiKey = 'AIzaSyBoWA_MmKc79fBQRBhGUJJtlIs9FwyXMrI';
    setApiKey(providedApiKey);
    localStorage.setItem('gemini_api_key', providedApiKey);
    onApiKeySet(providedApiKey);
  };

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <Key className="text-purple-500" />
        <h2 className="text-xl font-semibold">Gemini AI Configuration</h2>
        {(currentApiKey || localStorage.getItem('gemini_api_key')) && (
          <CheckCircle className="text-green-400 h-5 w-5" />
        )}
      </div>

      {!(currentApiKey || localStorage.getItem('gemini_api_key')) && (
        <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="text-amber-400 h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-300">API Key Required</h3>
              <p className="text-sm text-amber-200 mt-1">
                To enable AI-powered mentoring and feedback, please use the provided API key or enter your own.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Setup Option */}
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-green-300">Quick Setup Available</h3>
            <p className="text-sm text-green-200 mt-1">
              Use the pre-configured Gemini API key for instant access to all AI features.
            </p>
          </div>
          <button
            onClick={handleUseProvidedKey}
            className="btn-primary px-4 py-2 rounded-lg font-medium text-white"
          >
            Use Provided Key
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Gemini API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key (starts with AIza...)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isValidating}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              disabled={isValidating}
            >
              {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Your API key should start with "AIza" and be at least 20 characters long.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <a
            href="https://makersuite.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 text-sm flex items-center transition-colors"
          >
            <ExternalLink className="mr-1 h-4 w-4" />
            Get Your Own API Key
          </a>
          
          <button
            type="submit"
            disabled={!apiKey.trim() || isValidating}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              apiKey.trim() && !isValidating
                ? 'btn-primary text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isValidating ? 'Validating...' : (currentApiKey || localStorage.getItem('gemini_api_key')) ? 'Update Key' : 'Set API Key'}
          </button>
        </div>
      </form>

      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h4 className="text-sm font-medium text-blue-300 mb-2">Enhanced AI Features Available:</h4>
        <ul className="text-xs text-blue-200 space-y-1">
          <li>✨ Creative and engaging responses with adjustable personality</li>
          <li>📄 Advanced document analysis (PDF, Word, Text files)</li>
          <li>🗣️ Multilingual support with native voice synthesis</li>
          <li>🎯 Personalized career guidance and interview preparation</li>
          <li>📊 Resume optimization with ATS compatibility analysis</li>
          <li>🌍 Cultural context awareness for global job markets</li>
        </ul>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>🔒 Your API key is stored locally in your browser and never shared. It's only used to communicate with Google's Gemini AI service.</p>
      </div>
    </div>
  );
};

export default GeminiApiSetup;