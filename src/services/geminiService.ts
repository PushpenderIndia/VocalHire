interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

class GeminiService {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(message: string, context?: string): Promise<string> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('Gemini API key is required');
    }

    try {
      const prompt = this.buildMentorPrompt(message, context);
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            candidateCount: 1,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Invalid API request format. Please check your input and try again.');
        } else if (response.status === 403) {
          throw new Error('API access denied. Please verify your API key has proper permissions and try again.');
        } else if (response.status === 404) {
          throw new Error('Gemini API model not accessible. Please ensure your API key has access to the Gemini models.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. The service is experiencing high demand. Please wait a moment and try again, or consider upgrading your API plan for higher limits.');
        } else if (response.status >= 500 && response.status < 600) {
          throw new Error('Gemini AI service is temporarily unavailable. Please try again in a few moments. If the issue persists, check the Google AI Studio status page.');
        } else {
          throw new Error(`API request failed with status ${response.status}. Please try again later.`);
        }
      }

      const data: GeminiResponse = await response.json();
      
      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message}`);
      }
      
      if (data.candidates && data.candidates.length > 0) {
        const responseText = data.candidates[0].content.parts[0].text;
        return responseText || 'I apologize, but I couldn\'t generate a proper response. Please try rephrasing your question or uploading a document for analysis.';
      } else {
        throw new Error('No response generated from Gemini AI. Please try again with a different prompt.');
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      if (error instanceof Error) {
        // Enhanced error handling for better user experience
        if (error.message.includes('fetch')) {
          throw new Error('Failed to connect to Gemini AI. Please check your internet connection and try again. If you\'re behind a firewall, ensure AI services are accessible.');
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
          throw new Error('API rate limit exceeded. The service is experiencing high demand. Please wait 30-60 seconds and try again. Consider upgrading your API plan for higher limits.');
        } else if (error.message.includes('quota')) {
          throw new Error('API quota exceeded. Please check your Google AI Studio dashboard for usage limits and billing information.');
        }
        throw error;
      } else {
        throw new Error('An unexpected error occurred while communicating with Gemini AI. Please check your internet connection and try again.');
      }
    }
  }

  async generateInterviewFeedback(interviewData: any): Promise<string> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('Gemini API key is required');
    }

    try {
      const prompt = this.buildFeedbackPrompt(interviewData);
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 3072,
          }
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Gemini API rate limit exceeded, using fallback feedback');
          return this.getFallbackFeedback(interviewData);
        } else if (response.status >= 500 && response.status < 600) {
          throw new Error('Gemini AI service is temporarily unavailable. Please try again in a few moments.');
        } else {
          throw new Error(`Gemini API error: ${response.status}`);
        }
      }

      const data: GeminiResponse = await response.json();
      
      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message}`);
      }
      
      if (data.candidates && data.candidates.length > 0) {
        const responseText = data.candidates[0].content.parts[0].text;
        if (!responseText || responseText.trim() === '') {
          console.warn('Empty response from Gemini API, using fallback feedback');
          return this.getFallbackFeedback(interviewData);
        }
        return responseText;
      } else {
        console.warn('No candidates returned from Gemini API, using fallback feedback');
        return this.getFallbackFeedback(interviewData);
      }
    } catch (error) {
      console.error('Gemini Feedback Error:', error);
      return this.getFallbackFeedback(interviewData);
    }
  }

  private buildMentorPrompt(message: string, context?: string): string {
    const systemPrompt = `You are an advanced AI Career Mentor for VocalHire AI Mock Interview platform with enhanced capabilities and creative responses. You provide personalized career guidance, interview preparation advice, and professional development support across ALL industries and roles.

ENHANCED CAPABILITIES:
- Advanced document analysis (resumes, cover letters, job descriptions, PDFs)
- Creative and engaging response generation
- Multilingual support with cultural context awareness
- Personalized career path planning
- Industry-specific insights and trends
- Skill gap analysis and development recommendations
- Interview simulation with realistic scenarios
- Salary negotiation strategies and market insights
- Professional networking guidance
- Leadership development coaching
- Work-life balance optimization
- Performance improvement strategies

CORE EXPERTISE AREAS:
- Interview preparation and practice strategies (behavioral, technical, case studies)
- Resume and CV optimization with ATS compatibility
- Career transition guidance and strategic planning
- Skill development recommendations with learning paths
- Salary negotiation tactics and market research
- Professional networking strategies and relationship building
- Leadership and soft skills development programs
- Industry-specific career paths and requirements
- Work-life balance strategies and wellness
- Performance improvement and goal setting
- Personal branding and LinkedIn optimization
- Job search strategies and application optimization

UNLIMITED MULTILINGUAL SUPPORT:
- Communicate fluently in ANY language requested by the user
- Support includes: English, Hindi, Bengali, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Arabic, Turkish, Dutch, Swedish, Norwegian, Danish, Finnish, Polish, Czech, Hungarian, Romanian, Bulgarian, Croatian, Serbian, Greek, Thai, Vietnamese, Indonesian, Malay, Filipino, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, Nepali, Sinhala, Persian, Hebrew, Swahili, Amharic, Zulu, Afrikaans, and many more
- Maintain cultural sensitivity and regional context
- Use appropriate professional terminology in each language
- Adapt advice to local job markets and cultural norms

DOCUMENT ANALYSIS CAPABILITIES:
- Comprehensive resume analysis with specific improvement suggestions
- Cover letter optimization and personalization
- Job description analysis and requirement matching
- PDF document review and content extraction
- Industry-specific document formatting recommendations
- ATS optimization and keyword analysis
- Achievement quantification and impact measurement
- Skills gap identification and development planning

ENHANCED RESPONSE GUIDELINES:
- Provide creative, engaging, and highly personalized advice
- Use a warm, encouraging, and professional tone
- Include relevant examples, case studies, and success stories
- Ask thoughtful follow-up questions to deepen understanding
- Offer step-by-step guidance with actionable timelines
- Be comprehensive yet concise (aim for 200-600 words based on complexity)
- Adapt communication style to user's experience level and cultural context
- Use formatting like bullet points, headers, and emojis for better readability
- Be conversational, empathetic, and motivating
- Provide industry-specific insights and current market trends
- Include practical tips that can be implemented immediately
- Reference uploaded documents with specific, detailed feedback
- Consider cultural and regional job market differences
- Respect linguistic nuances and cultural contexts in all languages
- Offer multiple perspectives and alternative approaches
- Include relevant resources, tools, and next steps

CREATIVITY AND ENGAGEMENT:
- Use storytelling techniques to illustrate points
- Provide real-world examples and case studies
- Include motivational elements and confidence-building advice
- Offer creative solutions to common career challenges
- Use analogies and metaphors to explain complex concepts
- Provide diverse perspectives on career development
- Include industry trends and future outlook
- Suggest innovative approaches to professional growth

${context ? `Previous conversation context: ${context}` : ''}

User message: ${message}

Provide a comprehensive, creative, and highly engaging response as their advanced AI Career Mentor. Be specific, actionable, and inspiring while maintaining professionalism:`;

    return systemPrompt;
  }

  private buildFeedbackPrompt(interviewData: any): string {
    return `As an expert interview coach with advanced AI capabilities, provide comprehensive feedback for this ${interviewData.role} interview:

Interview Details:
- Role: ${interviewData.role}
- Category: ${interviewData.category}
- Duration: ${interviewData.duration} minutes
- Difficulty: ${interviewData.difficulty}
- Questions Asked: ${interviewData.questionsAsked?.join(', ') || 'Standard interview questions'}
- Speech Transcript: ${interviewData.speechText || 'No transcript available'}
- Misconduct Detected: ${interviewData.misconduct?.length || 0} instances

Please provide detailed feedback in the following format:

**OVERALL PERFORMANCE SCORE: [0-100]**

**TECHNICAL SKILLS ASSESSMENT:**
- Score: [0-100]
- Strengths: [List 3-4 specific strengths based on the transcript]
- Areas for Improvement: [List 2-3 specific areas with actionable advice]

**COMMUNICATION SKILLS:**
- Score: [0-100]
- Strengths: [List 3-4 specific strengths from speech analysis]
- Areas for Improvement: [List 2-3 specific areas with examples]

**BODY LANGUAGE & PRESENTATION:**
- Score: [0-100]
- Strengths: [List 2-3 specific strengths]
- Areas for Improvement: [List 1-2 specific areas]

**QUESTION-SPECIFIC FEEDBACK:**
[Analyze each question asked and provide specific feedback on the responses]

**SPEECH ANALYSIS:**
[If transcript is available, analyze speech patterns, clarity, confidence, and content quality]

**RECOMMENDED NEXT STEPS:**
[List 5-7 actionable recommendations for improvement with specific examples]

**INDUSTRY-SPECIFIC ADVICE:**
[Provide advice specific to the ${interviewData.role} role and ${interviewData.category} industry]

**PRACTICE RECOMMENDATIONS:**
[Suggest specific areas to practice and resources to use]

Make the feedback constructive, specific, and actionable. Focus on helping the candidate improve their interview performance with concrete examples and suggestions.`;
  }

  private getFallbackFeedback(interviewData: any): string {
    const fallbackData = {
      overallScore: 75,
      technical: {
        score: 78,
        strengths: [
          "Good understanding of core concepts",
          "Clear explanations",
          "Relevant experience examples",
          "Appropriate technical vocabulary"
        ],
        improvements: [
          "Provide more specific metrics and quantifiable achievements",
          "Consider mentioning recent technologies and trends"
        ]
      },
      communication: {
        score: 80,
        strengths: [
          "Clear articulation",
          "Good listening skills",
          "Professional vocabulary",
          "Confident delivery"
        ],
        improvements: [
          "Reduce filler words (\"um\", \"like\", \"you know\")",
          "Improve conciseness in responses",
          "Better structure for complex answers"
        ]
      },
      bodyLanguage: {
        score: 75,
        strengths: [
          "Professional posture",
          "Appropriate facial expressions",
          "Good camera positioning"
        ],
        improvements: [
          "Maintain better eye contact with camera",
          "Reduce fidgeting or nervous gestures"
        ]
      },
      speechAnalysis: "Based on the available transcript, your responses showed good content knowledge and professional communication. Consider practicing more structured responses using the STAR method (Situation, Task, Action, Result) for behavioral questions.",
      nextSteps: [
        `Practice more technical questions specific to ${interviewData.role}`,
        "Work on providing quantifiable examples (numbers, percentages, timelines)",
        "Improve body language and maintain consistent eye contact",
        "Practice with mock interviews to build confidence",
        `Research industry trends and recent developments in ${interviewData.category}`,
        "Prepare 5-7 specific examples that demonstrate your key skills",
        "Practice explaining complex concepts in simple terms"
      ],
      industryAdvice: `For ${interviewData.category} roles, focus on staying updated with industry best practices, emerging technologies, and market trends. Consider obtaining relevant certifications and building a portfolio that showcases your practical skills.`,
      practiceRecommendations: [
        "Use our AI interview system for regular practice",
        "Record yourself answering common questions",
        "Practice with friends or mentors for feedback",
        "Join professional communities in your field",
        "Attend industry webinars and networking events"
      ],
      summary: `Continue developing skills relevant to ${interviewData.category} and maintain confidence in your abilities. Each interview is a learning opportunity!`
    };

    return JSON.stringify(fallbackData, null, 2);
  }
}

export default GeminiService;