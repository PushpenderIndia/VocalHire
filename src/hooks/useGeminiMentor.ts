import { useState, useCallback, useMemo } from 'react';
import GeminiService from '../services/geminiService';

interface Message {
  id: string;
  type: 'user' | 'mentor';
  content: string;
  timestamp: Date;
  category?: string;
}

export const useGeminiMentor = (apiKey?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const geminiService = useMemo(() => {
    return apiKey && apiKey.trim() ? new GeminiService(apiKey) : null;
  }, [apiKey]);

  const generateResponse = useCallback(async (
    userMessage: string, 
    conversationHistory: Message[] = []
  ): Promise<string> => {
    if (!geminiService) {
      throw new Error('Gemini API key not provided. Please configure your API key first.');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build context from recent conversation
      const recentMessages = conversationHistory.slice(-6); // Last 6 messages for context
      const context = recentMessages
        .filter(msg => msg.type === 'user' || msg.type === 'mentor')
        .map(msg => `${msg.type === 'user' ? 'User' : 'Mentor'}: ${msg.content}`)
        .join('\n');

      const response = await geminiService.generateResponse(userMessage, context);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate response';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [geminiService]);

  const generateInterviewFeedback = useCallback(async (interviewData: any): Promise<string> => {
    if (!geminiService) {
      throw new Error('Gemini API key not provided. Please configure your API key first.');
    }

    setIsLoading(true);
    setError(null);

    try {
      const feedback = await geminiService.generateInterviewFeedback(interviewData);
      return feedback;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate feedback';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [geminiService]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generateResponse,
    generateInterviewFeedback,
    isLoading,
    error,
    clearError,
    isConfigured: !!geminiService
  };
};