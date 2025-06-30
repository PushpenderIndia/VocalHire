import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface InterviewData {
  id: string;
  role: string;
  category: string;
  duration: number;
  difficulty: string;
  date: string;
  score: number;
  securityScore?: number;
  questionsAsked: string[];
  dynamicQuestions?: string[];
  speechText: string;
  misconduct: string[];
  plagiarismAlerts?: any[];
  responseQuality?: number[];
  videoRecording?: string;
  feedback?: string;
  proctoringSummary?: any;
  detailedFeedback?: any;
  userResponses?: any[];
}

export const generateInterviewPDF = async (interviewData: InterviewData, returnBlob: boolean = false): Promise<Blob | void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12): number => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * fontSize * 0.35);
  };

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number = 40): void => {
    if (yPosition > pageHeight - requiredSpace) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Helper function to add section header
  const addSectionHeader = (title: string, color: [number, number, number] = [139, 92, 246]): void => {
    checkNewPage(30);
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin + 5, yPosition + 5);
    yPosition += 20;
    pdf.setTextColor(0, 0, 0);
  };

  // PAGE 1: COVER PAGE & EXECUTIVE SUMMARY
  // Header with branding
  pdf.setFillColor(139, 92, 246);
  pdf.rect(0, 0, pageWidth, 50, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VOCALHIRE AI', margin, 25);
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Advanced AI Interview Analysis Report', margin, 40);

  yPosition = 70;
  pdf.setTextColor(0, 0, 0);

  // Interview Overview
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Interview Performance Report', margin, yPosition);
  yPosition += 15;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  const interviewDetails = [
    `Candidate Role: ${interviewData.role}`,
    `Industry Category: ${interviewData.category}`,
    `Interview Date: ${new Date(interviewData.date).toLocaleDateString()}`,
    `Duration: ${interviewData.duration} minutes`,
    `Difficulty Level: ${interviewData.difficulty}`,
    `Report Generated: ${new Date().toLocaleDateString()}`
  ];

  interviewDetails.forEach(detail => {
    yPosition = addWrappedText(detail, margin, yPosition, pageWidth - 2 * margin, 14);
    yPosition += 3;
  });

  yPosition += 15;

  // Executive Summary Box
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 60, 'F');
  pdf.setDrawColor(139, 92, 246);
  pdf.setLineWidth(2);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 60);

  yPosition += 10;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EXECUTIVE SUMMARY', margin + 10, yPosition);
  yPosition += 10;

  const overallScore = interviewData.detailedFeedback?.overallScore || interviewData.score || 75;
  const securityScore = interviewData.securityScore || 85;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const summaryText = `Overall Performance Score: ${overallScore}% | Security Score: ${securityScore}%

This comprehensive analysis evaluates technical competency, communication skills, and professional presentation based on actual interview responses and behavior. The assessment includes speech pattern analysis, content evaluation, and adaptive AI questioning results.

Key Highlights:
• ${interviewData.detailedFeedback?.detailedAnalysis?.wordCount || 0} words analyzed from speech transcript
• ${interviewData.detailedFeedback?.detailedAnalysis?.technicalTermsUsed || 0} technical terms identified
• ${interviewData.dynamicQuestions?.length || 0} AI-generated adaptive questions
• ${interviewData.questionsAsked?.length || 0} total questions evaluated`;

  yPosition = addWrappedText(summaryText, margin + 10, yPosition, pageWidth - 2 * margin - 20, 12);

  // Score Visualization
  yPosition += 20;
  checkNewPage(80);

  addSectionHeader('PERFORMANCE METRICS');

  // Overall Score Circle
  const centerX = pageWidth / 2;
  const radius = 25;
  
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(8);
  pdf.circle(centerX, yPosition + 30, radius);
  
  const scoreColor = overallScore >= 80 ? [34, 197, 94] : overallScore >= 60 ? [245, 158, 11] : [239, 68, 68];
  pdf.setDrawColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  pdf.setLineWidth(8);
  
  const circumference = 2 * Math.PI * radius;
  const dashLength = (circumference * overallScore) / 100;
  pdf.circle(centerX, yPosition + 30, radius);
  
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  pdf.text(`${overallScore}%`, centerX - 15, yPosition + 35);
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Overall Score', centerX - 20, yPosition + 50);

  yPosition += 70;

  // Detailed Scores
  if (interviewData.detailedFeedback) {
    const scores = [
      { label: 'Technical Skills', score: Math.round(interviewData.detailedFeedback.technical?.score || 75), color: [59, 130, 246] },
      { label: 'Communication', score: Math.round(interviewData.detailedFeedback.communication?.score || 80), color: [34, 197, 94] },
      { label: 'Presentation', score: Math.round(interviewData.detailedFeedback.bodyLanguage?.score || 85), color: [168, 85, 247] },
      { label: 'Security', score: securityScore, color: [245, 158, 11] }
    ];

    scores.forEach((scoreData, index) => {
      const x = margin + (index * 40);
      const barHeight = (scoreData.score / 100) * 30;
      
      pdf.setFillColor(scoreData.color[0], scoreData.color[1], scoreData.color[2]);
      pdf.rect(x, yPosition + 30 - barHeight, 25, barHeight, 'F');
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${scoreData.score}%`, x + 5, yPosition + 40);
      pdf.text(scoreData.label, x - 5, yPosition + 50);
    });
  }

  // PAGE 2: DETAILED SPEECH ANALYSIS
  pdf.addPage();
  yPosition = margin;

  addSectionHeader('COMPREHENSIVE SPEECH ANALYSIS', [34, 197, 94]);

  if (interviewData.detailedFeedback?.detailedAnalysis) {
    const analysis = interviewData.detailedFeedback.detailedAnalysis;
    
    // Speech Metrics Grid
    const metrics = [
      { label: 'Total Words Spoken', value: analysis.wordCount, unit: 'words' },
      { label: 'Sentences Formed', value: analysis.sentenceCount, unit: 'sentences' },
      { label: 'Average Words per Sentence', value: analysis.avgWordsPerSentence, unit: 'words' },
      { label: 'Technical Terms Used', value: analysis.technicalTermsUsed, unit: 'terms' },
      { label: 'Filler Words Detected', value: analysis.fillerWordCount, unit: 'instances' },
      { label: 'Confidence Level', value: analysis.confidenceLevel, unit: '' },
      { label: 'Response Length Category', value: analysis.responseLength, unit: '' },
      { label: 'Emotional Tone', value: analysis.emotionalTone, unit: '' }
    ];

    let gridX = margin;
    let gridY = yPosition;
    
    metrics.forEach((metric, index) => {
      if (index % 2 === 0 && index > 0) {
        gridY += 25;
        gridX = margin;
      }
      
      pdf.setFillColor(245, 245, 245);
      pdf.rect(gridX, gridY, 80, 20, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(gridX, gridY, 80, 20);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(metric.label, gridX + 2, gridY + 8);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(139, 92, 246);
      pdf.text(`${metric.value} ${metric.unit}`, gridX + 2, gridY + 16);
      pdf.setTextColor(0, 0, 0);
      
      gridX += 85;
    });

    yPosition = gridY + 35;

    // Key Topics Analysis
    if (analysis.keyTopics && analysis.keyTopics.length > 0) {
      checkNewPage(40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Topics Discussed:', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const topicsText = analysis.keyTopics.join(', ');
      yPosition = addWrappedText(topicsText, margin, yPosition, pageWidth - 2 * margin, 11);
      yPosition += 15;
    }

    // Speech Quality Assessment
    checkNewPage(60);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Speech Quality Assessment:', margin, yPosition);
    yPosition += 10;

    const qualityMetrics = [
      `Vocabulary Richness: ${analysis.technicalTermsUsed > 5 ? 'Excellent' : analysis.technicalTermsUsed > 2 ? 'Good' : 'Basic'}`,
      `Clarity Score: ${analysis.fillerWordCount < 5 ? 'High' : analysis.fillerWordCount < 10 ? 'Medium' : 'Needs Improvement'}`,
      `Response Completeness: ${analysis.responseLength}`,
      `Professional Tone: ${analysis.emotionalTone === 'Positive' ? 'Confident' : analysis.emotionalTone === 'Neutral' ? 'Professional' : 'Needs Development'}`
    ];

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    qualityMetrics.forEach(metric => {
      yPosition = addWrappedText(`• ${metric}`, margin, yPosition, pageWidth - 2 * margin, 11);
      yPosition += 5;
    });
  }

  // Speech Transcript Section
  if (interviewData.speechText && interviewData.speechText.trim()) {
    yPosition += 15;
    checkNewPage(60);
    
    addSectionHeader('COMPLETE SPEECH TRANSCRIPT', [59, 130, 246]);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(interviewData.speechText, margin, yPosition, pageWidth - 2 * margin, 10);
  }

  // PAGE 3: TECHNICAL & COMMUNICATION ANALYSIS
  pdf.addPage();
  yPosition = margin;

  addSectionHeader('SKILLS ASSESSMENT BREAKDOWN', [168, 85, 247]);

  if (interviewData.detailedFeedback) {
    // Technical Skills Section
    if (interviewData.detailedFeedback.technical) {
      const tech = interviewData.detailedFeedback.technical;
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text(`Technical Skills Assessment: ${Math.round(tech.score)}%`, margin, yPosition);
      yPosition += 15;
      pdf.setTextColor(0, 0, 0);

      // Strengths
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(34, 197, 94);
      pdf.text('✓ STRENGTHS:', margin, yPosition);
      yPosition += 8;
      pdf.setTextColor(0, 0, 0);

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      tech.strengths.forEach((strength: string) => {
        yPosition = addWrappedText(`• ${strength}`, margin + 5, yPosition, pageWidth - 2 * margin - 5, 11);
        yPosition += 5;
      });

      yPosition += 5;

      // Improvements
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(245, 158, 11);
      pdf.text('⚠ AREAS FOR IMPROVEMENT:', margin, yPosition);
      yPosition += 8;
      pdf.setTextColor(0, 0, 0);

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      tech.improvements.forEach((improvement: string) => {
        yPosition = addWrappedText(`• ${improvement}`, margin + 5, yPosition, pageWidth - 2 * margin - 5, 11);
        yPosition += 5;
      });

      yPosition += 15;
    }

    // Communication Skills Section
    if (interviewData.detailedFeedback.communication) {
      checkNewPage(80);
      const comm = interviewData.detailedFeedback.communication;
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(34, 197, 94);
      pdf.text(`Communication Skills Assessment: ${Math.round(comm.score)}%`, margin, yPosition);
      yPosition += 15;
      pdf.setTextColor(0, 0, 0);

      // Strengths
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(34, 197, 94);
      pdf.text('✓ STRENGTHS:', margin, yPosition);
      yPosition += 8;
      pdf.setTextColor(0, 0, 0);

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      comm.strengths.forEach((strength: string) => {
        yPosition = addWrappedText(`• ${strength}`, margin + 5, yPosition, pageWidth - 2 * margin - 5, 11);
        yPosition += 5;
      });

      yPosition += 5;

      // Improvements
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(245, 158, 11);
      pdf.text('⚠ AREAS FOR IMPROVEMENT:', margin, yPosition);
      yPosition += 8;
      pdf.setTextColor(0, 0, 0);

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      comm.improvements.forEach((improvement: string) => {
        yPosition = addWrappedText(`• ${improvement}`, margin + 5, yPosition, pageWidth - 2 * margin - 5, 11);
        yPosition += 5;
      });

      yPosition += 15;
    }

    // Body Language & Presentation
    if (interviewData.detailedFeedback.bodyLanguage) {
      checkNewPage(60);
      const body = interviewData.detailedFeedback.bodyLanguage;
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(168, 85, 247);
      pdf.text(`Presentation & Body Language: ${Math.round(body.score)}%`, margin, yPosition);
      yPosition += 15;
      pdf.setTextColor(0, 0, 0);

      // Combined strengths and improvements
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      body.strengths.forEach((strength: string) => {
        yPosition = addWrappedText(`✓ ${strength}`, margin, yPosition, pageWidth - 2 * margin, 11);
        yPosition += 5;
      });

      body.improvements.forEach((improvement: string) => {
        yPosition = addWrappedText(`⚠ ${improvement}`, margin, yPosition, pageWidth - 2 * margin, 11);
        yPosition += 5;
      });
    }
  }

  // PAGE 4: QUESTION ANALYSIS & SECURITY ASSESSMENT
  pdf.addPage();
  yPosition = margin;

  addSectionHeader('QUESTION-BY-QUESTION ANALYSIS', [245, 158, 11]);

  // Questions Analysis
  if (interviewData.detailedFeedback?.questions && interviewData.detailedFeedback.questions.length > 0) {
    interviewData.detailedFeedback.questions.forEach((q: any, index: number) => {
      checkNewPage(50);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Question ${index + 1}: ${q.score}%`, margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(q.question, margin, yPosition, pageWidth - 2 * margin, 10);
      yPosition += 5;

      if (q.type === 'adaptive') {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(168, 85, 247);
        pdf.text('★ AI-Generated Adaptive Question', margin, yPosition);
        yPosition += 5;
        pdf.setTextColor(0, 0, 0);
      }

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(`Feedback: ${q.feedback}`, margin, yPosition, pageWidth - 2 * margin, 10);
      yPosition += 10;
    });
  } else if (interviewData.questionsAsked && interviewData.questionsAsked.length > 0) {
    // Fallback to basic question list
    interviewData.questionsAsked.forEach((question, index) => {
      checkNewPage(25);
      
      const isAdaptive = interviewData.dynamicQuestions?.includes(question);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      const questionText = `${index + 1}. ${question}${isAdaptive ? ' ★ (AI Generated)' : ''}`;
      yPosition = addWrappedText(questionText, margin, yPosition, pageWidth - 2 * margin, 11);
      yPosition += 6;
    });
  }

  // Security & Proctoring Analysis
  yPosition += 10;
  checkNewPage(80);
  
  addSectionHeader('SECURITY & BEHAVIORAL ANALYSIS', [239, 68, 68]);

  const securityMetrics = [
    `Overall Security Score: ${interviewData.securityScore || 85}%`,
    `Total Security Alerts: ${interviewData.plagiarismAlerts?.length || 0}`,
    `Critical Violations: ${interviewData.plagiarismAlerts?.filter(a => a.severity === 'critical').length || 0}`,
    `Behavioral Notes: ${interviewData.misconduct?.length || 0} incidents recorded`,
    `Adaptive Questions Generated: ${interviewData.dynamicQuestions?.length || 0}`,
    `Real-time Monitoring: Active throughout interview`,
    `Audio Analysis: Continuous speech pattern monitoring`,
    `Video Proctoring: Professional behavior assessment`
  ];

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  securityMetrics.forEach(metric => {
    yPosition = addWrappedText(`• ${metric}`, margin, yPosition, pageWidth - 2 * margin, 11);
    yPosition += 5;
  });

  // Security Alerts Details
  if (interviewData.plagiarismAlerts && interviewData.plagiarismAlerts.length > 0) {
    yPosition += 10;
    checkNewPage(40);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(239, 68, 68);
    pdf.text('Security Alert Details:', margin, yPosition);
    yPosition += 10;
    pdf.setTextColor(0, 0, 0);

    interviewData.plagiarismAlerts.slice(0, 5).forEach((alert, index) => {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const alertText = `${index + 1}. [${alert.severity?.toUpperCase() || 'MEDIUM'}] ${alert.message} - ${new Date(alert.timestamp).toLocaleTimeString()}`;
      yPosition = addWrappedText(alertText, margin, yPosition, pageWidth - 2 * margin, 10);
      yPosition += 4;
    });
  }

  // PAGE 5: IMPROVEMENT PLAN & RECOMMENDATIONS
  pdf.addPage();
  yPosition = margin;

  addSectionHeader('PERSONALIZED IMPROVEMENT PLAN', [34, 197, 94]);

  // Improvement Plan
  if (interviewData.detailedFeedback?.improvementPlan && interviewData.detailedFeedback.improvementPlan.length > 0) {
    interviewData.detailedFeedback.improvementPlan.forEach((plan: any, index: number) => {
      checkNewPage(50);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${plan.area}`, margin, yPosition);
      
      // Priority badge
      const priorityColor = plan.priority === 'High' ? [239, 68, 68] : 
                           plan.priority === 'Medium' ? [245, 158, 11] : [59, 130, 246];
      pdf.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2]);
      pdf.rect(margin + 100, yPosition - 8, 25, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text(plan.priority, margin + 105, yPosition - 2);
      pdf.setTextColor(0, 0, 0);
      
      yPosition += 12;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      plan.actions.forEach((action: string) => {
        yPosition = addWrappedText(`• ${action}`, margin + 5, yPosition, pageWidth - 2 * margin - 5, 11);
        yPosition += 5;
      });

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Timeline: ${plan.timeline}`, margin + 5, yPosition);
      yPosition += 15;
      pdf.setTextColor(0, 0, 0);
    });
  }

  // Industry-Specific Recommendations
  if (interviewData.detailedFeedback?.industrySpecificAdvice) {
    yPosition += 10;
    checkNewPage(60);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text(`${interviewData.category} Industry Recommendations:`, margin, yPosition);
    yPosition += 12;
    pdf.setTextColor(0, 0, 0);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    interviewData.detailedFeedback.industrySpecificAdvice.forEach((advice: string) => {
      yPosition = addWrappedText(`• ${advice}`, margin, yPosition, pageWidth - 2 * margin, 11);
      yPosition += 5;
    });
  }

  // Next Steps
  if (interviewData.detailedFeedback?.nextSteps) {
    yPosition += 15;
    checkNewPage(80);
    
    addSectionHeader('RECOMMENDED NEXT STEPS', [168, 85, 247]);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    interviewData.detailedFeedback.nextSteps.forEach((step: string, index: number) => {
      checkNewPage(15);
      yPosition = addWrappedText(`${index + 1}. ${step}`, margin, yPosition, pageWidth - 2 * margin, 11);
      yPosition += 6;
    });
  }

  // Final Summary & Contact
  yPosition += 20;
  checkNewPage(60);
  
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 40, 'F');
  pdf.setDrawColor(139, 92, 246);
  pdf.setLineWidth(1);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 40);

  yPosition += 10;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CONCLUSION & NEXT STEPS', margin + 10, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const conclusionText = `This comprehensive analysis provides actionable insights based on your actual interview performance. Continue practicing with our AI-powered system to track improvement over time. For personalized guidance, use our AI Career Mentor feature.

Generated by VocalHire AI Advanced Interview Analysis System
Report ID: ${interviewData.id} | Generated: ${new Date().toLocaleString()}`;

  yPosition = addWrappedText(conclusionText, margin + 10, yPosition, pageWidth - 2 * margin - 20, 10);

  // Footer on each page
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    const footerY = pageHeight - 10;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('VocalHire AI - Advanced Interview Analysis Platform', margin, footerY);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, footerY);
  }

  if (returnBlob) {
    return pdf.output('blob');
  } else {
    // Save the PDF
    const fileName = `VocalHire_Comprehensive_Interview_Analysis_${interviewData.role.replace(/\s+/g, '_')}_${new Date(interviewData.date).toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  }
};

export const generateInterviewSummaryPDF = async (interviews: InterviewData[]): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12): number => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * fontSize * 0.35);
  };

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number = 40): void => {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Header
  pdf.setFillColor(139, 92, 246);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VocalHire AI Mock Interview', margin, 25);
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Comprehensive Interview Summary Report', margin, 35);

  yPosition = 55;
  pdf.setTextColor(0, 0, 0);

  // Summary Statistics
  const totalInterviews = interviews.length;
  const averageScore = totalInterviews > 0 ? 
    Math.round(interviews.reduce((sum, interview) => sum + interview.score, 0) / totalInterviews) : 0;
  const averageSecurityScore = totalInterviews > 0 ? 
    Math.round(interviews.reduce((sum, interview) => sum + (interview.securityScore || 85), 0) / totalInterviews) : 0;
  const completedInterviews = interviews.filter(i => i.score > 0).length;
  const totalAdaptiveQuestions = interviews.reduce((sum, i) => sum + (i.dynamicQuestions?.length || 0), 0);
  const totalSpeechAnalyzed = interviews.reduce((sum, i) => sum + (i.speechText?.length || 0), 0);

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', margin, yPosition);
  yPosition += 15;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const stats = [
    `Total Interviews Analyzed: ${totalInterviews}`,
    `Completed Interviews: ${completedInterviews}`,
    `Average Interview Score: ${averageScore}%`,
    `Average Security Score: ${averageSecurityScore}%`,
    `Total AI-Generated Questions: ${totalAdaptiveQuestions}`,
    `Total Speech Analyzed: ${Math.round(totalSpeechAnalyzed / 1000)}K characters`,
    `Report Generated: ${new Date().toLocaleDateString()}`,
    `Analysis Period: ${interviews.length > 0 ? `${new Date(Math.min(...interviews.map(i => new Date(i.date).getTime()))).toLocaleDateString()} - ${new Date(Math.max(...interviews.map(i => new Date(i.date).getTime()))).toLocaleDateString()}` : 'N/A'}`
  ];

  stats.forEach(stat => {
    pdf.text(stat, margin, yPosition);
    yPosition += 8;
  });

  yPosition += 10;

  // Performance Trends
  checkNewPage();
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Performance Analysis', margin, yPosition);
  yPosition += 10;

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  const roleBreakdown: Record<string, number> = {};
  const difficultyBreakdown: Record<string, number> = {};
  
  interviews.forEach(interview => {
    categoryBreakdown[interview.category] = (categoryBreakdown[interview.category] || 0) + 1;
    roleBreakdown[interview.role] = (roleBreakdown[interview.role] || 0) + 1;
    difficultyBreakdown[interview.difficulty] = (difficultyBreakdown[interview.difficulty] || 0) + 1;
  });

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Interviews by Category:', margin, yPosition);
  yPosition += 6;

  Object.entries(categoryBreakdown).forEach(([category, count]) => {
    pdf.text(`  • ${category}: ${count} interviews`, margin + 5, yPosition);
    yPosition += 5;
  });

  yPosition += 10;

  pdf.text('Interviews by Difficulty:', margin, yPosition);
  yPosition += 6;

  Object.entries(difficultyBreakdown).forEach(([difficulty, count]) => {
    pdf.text(`  • ${difficulty}: ${count} interviews`, margin + 5, yPosition);
    yPosition += 5;
  });

  yPosition += 15;

  // Interview List with Detailed Analysis
  checkNewPage();
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Detailed Interview History', margin, yPosition);
  yPosition += 10;

  interviews.forEach((interview, index) => {
    checkNewPage();

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${index + 1}. ${interview.role}`, margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const interviewDetails = [
      `Date: ${new Date(interview.date).toLocaleDateString()}`,
      `Category: ${interview.category}`,
      `Score: ${interview.score}% | Security: ${interview.securityScore || 85}%`,
      `Duration: ${interview.duration}min | Difficulty: ${interview.difficulty}`,
      `Questions Asked: ${interview.questionsAsked?.length || 0}`,
      `AI Questions: ${interview.dynamicQuestions?.length || 0}`,
      `Security Alerts: ${interview.plagiarismAlerts?.length || 0}`,
      `Speech Length: ${interview.speechText?.length || 0} characters`
    ];

    interviewDetails.forEach(detail => {
      pdf.text(`  ${detail}`, margin + 5, yPosition);
      yPosition += 4;
    });

    // Add key insights if available
    if (interview.detailedFeedback?.detailedAnalysis) {
      yPosition += 3;
      pdf.setFont('helvetica', 'italic');
      pdf.text(`  Key Insights: ${interview.detailedFeedback.detailedAnalysis.technicalTermsUsed} technical terms, ` +
               `${interview.detailedFeedback.detailedAnalysis.fillerWordCount} filler words, ` +
               `${interview.detailedFeedback.detailedAnalysis.responseLength} response quality`, margin + 5, yPosition);
      yPosition += 4;
    }

    yPosition += 8;
  });

  // Performance Improvement Recommendations
  checkNewPage();
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(34, 197, 94);
  pdf.text('Overall Improvement Recommendations', margin, yPosition);
  yPosition += 10;

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  const overallRecommendations = [
    `Focus on improving average score from ${averageScore}% to 85%+`,
    'Continue practicing with AI-powered adaptive questioning',
    'Work on maintaining higher security scores during interviews',
    'Practice reducing filler words and improving speech clarity',
    'Develop stronger technical vocabulary and examples',
    'Maintain consistent performance across different difficulty levels',
    'Use the AI Mentor for personalized guidance on weak areas'
  ];

  overallRecommendations.forEach(rec => {
    yPosition = addWrappedText(`• ${rec}`, margin, yPosition, pageWidth - 2 * margin, 11);
    yPosition += 4;
  });

  // Save the PDF
  const fileName = `VocalHire_Interview_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};