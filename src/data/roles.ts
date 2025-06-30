export interface RoleCategory {
  name: string;
  roles: string[];
  icon: string;
  color: string;
}

export const roleCategories: RoleCategory[] = [
  {
    name: 'Technology',
    icon: '💻',
    color: 'purple',
    roles: [
      'Software Engineer',
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'DevOps Engineer',
      'Data Scientist',
      'Machine Learning Engineer',
      'Cloud Architect',
      'Cybersecurity Specialist',
      'Mobile App Developer',
      'QA Engineer',
      'Technical Lead',
      'System Administrator',
      'Database Administrator',
      'UI/UX Designer'
    ]
  },
  {
    name: 'Business & Management',
    icon: '📊',
    color: 'blue',
    roles: [
      'Product Manager',
      'Project Manager',
      'Business Analyst',
      'Operations Manager',
      'Strategy Consultant',
      'Business Development Manager',
      'General Manager',
      'CEO/Executive',
      'Team Lead',
      'Scrum Master',
      'Program Manager',
      'Change Management Specialist'
    ]
  },
  {
    name: 'Marketing & Sales',
    icon: '📈',
    color: 'green',
    roles: [
      'Marketing Manager',
      'Digital Marketing Specialist',
      'Content Marketing Manager',
      'Social Media Manager',
      'SEO Specialist',
      'Sales Representative',
      'Sales Manager',
      'Account Manager',
      'Brand Manager',
      'Growth Hacker',
      'Email Marketing Specialist',
      'PPC Specialist'
    ]
  },
  {
    name: 'Finance & Accounting',
    icon: '💰',
    color: 'amber',
    roles: [
      'Financial Analyst',
      'Accountant',
      'Investment Banker',
      'Financial Advisor',
      'Controller',
      'CFO',
      'Auditor',
      'Tax Specialist',
      'Risk Manager',
      'Treasury Analyst',
      'Budget Analyst',
      'Credit Analyst'
    ]
  },
  {
    name: 'Healthcare & Medical',
    icon: '🏥',
    color: 'red',
    roles: [
      'Registered Nurse',
      'Doctor/Physician',
      'Medical Assistant',
      'Healthcare Administrator',
      'Physical Therapist',
      'Pharmacist',
      'Medical Technologist',
      'Healthcare Consultant',
      'Clinical Research Coordinator',
      'Medical Sales Representative'
    ]
  },
  {
    name: 'Education & Training',
    icon: '🎓',
    color: 'indigo',
    roles: [
      'Teacher',
      'Professor',
      'Training Specialist',
      'Instructional Designer',
      'Academic Advisor',
      'Principal/Administrator',
      'Curriculum Developer',
      'Educational Consultant',
      'Corporate Trainer',
      'E-learning Developer'
    ]
  },
  {
    name: 'Human Resources',
    icon: '👥',
    color: 'pink',
    roles: [
      'HR Manager',
      'Recruiter',
      'HR Business Partner',
      'Compensation Analyst',
      'Training & Development Specialist',
      'Employee Relations Specialist',
      'HR Generalist',
      'Talent Acquisition Specialist',
      'Organizational Development Consultant',
      'HR Director'
    ]
  },
  {
    name: 'Legal & Compliance',
    icon: '⚖️',
    color: 'gray',
    roles: [
      'Lawyer/Attorney',
      'Legal Counsel',
      'Paralegal',
      'Compliance Officer',
      'Contract Manager',
      'Legal Assistant',
      'Intellectual Property Lawyer',
      'Corporate Lawyer',
      'Litigation Attorney',
      'Legal Consultant'
    ]
  },
  {
    name: 'Creative & Design',
    icon: '🎨',
    color: 'teal',
    roles: [
      'Graphic Designer',
      'Web Designer',
      'Creative Director',
      'Copywriter',
      'Content Creator',
      'Video Editor',
      'Photographer',
      'Art Director',
      'Brand Designer',
      'Motion Graphics Designer'
    ]
  },
  {
    name: 'Customer Service',
    icon: '🎧',
    color: 'cyan',
    roles: [
      'Customer Service Representative',
      'Customer Success Manager',
      'Support Specialist',
      'Call Center Agent',
      'Technical Support',
      'Customer Experience Manager',
      'Help Desk Technician',
      'Client Relations Manager'
    ]
  },
  {
    name: 'Operations & Logistics',
    icon: '🚚',
    color: 'orange',
    roles: [
      'Operations Manager',
      'Supply Chain Manager',
      'Logistics Coordinator',
      'Warehouse Manager',
      'Process Improvement Specialist',
      'Quality Assurance Manager',
      'Production Manager',
      'Inventory Manager'
    ]
  },
  {
    name: 'Consulting',
    icon: '💼',
    color: 'violet',
    roles: [
      'Management Consultant',
      'Strategy Consultant',
      'IT Consultant',
      'Financial Consultant',
      'HR Consultant',
      'Marketing Consultant',
      'Operations Consultant',
      'Change Management Consultant'
    ]
  }
];

export const getQuestionsForRole = (role: string, difficulty: string): string[] => {
  const baseQuestions = [
    "Tell me about yourself and your background.",
    "Why are you interested in this position?",
    "What are your greatest strengths and weaknesses?",
    "Where do you see yourself in 5 years?",
    "Describe a challenging situation and how you handled it."
  ];

  const roleSpecificQuestions: Record<string, string[]> = {
    'Software Engineer': [
      "Explain the difference between SQL and NoSQL databases.",
      "How do you approach debugging a complex issue?",
      "Describe your experience with version control systems.",
      "What's your preferred programming language and why?",
      "How do you ensure code quality in your projects?",
      "Walk me through your approach to system design.",
      "How do you handle technical debt in your projects?"
    ],
    'Product Manager': [
      "How do you prioritize features in a product roadmap?",
      "Describe your experience with user research and feedback.",
      "How do you work with engineering teams?",
      "What metrics do you use to measure product success?",
      "Tell me about a product launch you managed.",
      "How do you handle conflicting stakeholder requirements?",
      "Describe your approach to competitive analysis."
    ],
    'Marketing Manager': [
      "How do you measure the success of a marketing campaign?",
      "Describe your experience with digital marketing channels.",
      "How do you identify and target your audience?",
      "What's your approach to brand positioning?",
      "Tell me about a successful campaign you've run.",
      "How do you allocate budget across different marketing channels?",
      "Describe your experience with marketing automation tools."
    ],
    'Financial Analyst': [
      "How do you approach financial modeling?",
      "Explain the difference between NPV and IRR.",
      "How do you assess investment opportunities?",
      "Describe your experience with financial reporting.",
      "What financial metrics do you consider most important?",
      "How do you handle discrepancies in financial data?",
      "Describe your experience with risk assessment."
    ],
    'Registered Nurse': [
      "How do you prioritize patient care in a busy environment?",
      "Describe your experience with electronic health records.",
      "How do you handle difficult patients or families?",
      "What's your approach to medication administration safety?",
      "Tell me about a time you advocated for a patient.",
      "How do you stay current with medical best practices?",
      "Describe your experience working in interdisciplinary teams."
    ],
    'Teacher': [
      "How do you adapt your teaching style for different learners?",
      "Describe your classroom management approach.",
      "How do you assess student progress?",
      "What's your experience with educational technology?",
      "Tell me about a challenging student situation you handled.",
      "How do you engage parents in the learning process?",
      "Describe your approach to curriculum development."
    ],
    'HR Manager': [
      "How do you handle employee conflicts?",
      "Describe your approach to talent acquisition.",
      "What's your experience with performance management?",
      "How do you ensure compliance with employment laws?",
      "Tell me about a difficult HR situation you resolved.",
      "How do you measure employee engagement?",
      "Describe your experience with organizational change."
    ]
  };

  const questions = [...baseQuestions];
  if (roleSpecificQuestions[role]) {
    questions.push(...roleSpecificQuestions[role]);
  }

  // Adjust questions based on difficulty
  if (difficulty === 'easy') {
    return questions.slice(0, 5);
  } else if (difficulty === 'medium') {
    return questions.slice(0, 8);
  } else {
    return questions;
  }
};

export const getTrendyQuestionsForRole = (role: string, difficulty: string): string[] => {
  const trendyQuestions2024: Record<string, string[]> = {
    'Software Engineer': [
      "How do you approach AI/ML integration in your development projects?",
      "What's your experience with cloud-native development and microservices?",
      "How do you ensure security in your code, especially with recent cybersecurity concerns?",
      "Describe your experience with DevOps practices and CI/CD pipelines.",
      "How do you handle performance optimization in modern web applications?",
      "What's your approach to working with large language models and AI APIs?",
      "How do you stay updated with rapidly evolving JavaScript frameworks?",
      "Describe your experience with containerization and Kubernetes.",
      "How do you approach accessibility in modern web development?",
      "What's your experience with edge computing and serverless architectures?"
    ],
    'Product Manager': [
      "How do you incorporate AI and machine learning into product strategy?",
      "What's your approach to privacy-first product development?",
      "How do you handle product decisions in a remote-first work environment?",
      "Describe your experience with no-code/low-code platforms.",
      "How do you measure and improve user experience in mobile-first products?",
      "What's your approach to sustainable and ethical product development?",
      "How do you handle product localization for global markets?",
      "Describe your experience with voice interfaces and conversational AI.",
      "How do you approach product security and data protection?",
      "What's your strategy for building products for Gen Z users?"
    ],
    'Marketing Manager': [
      "How has your marketing strategy adapted to iOS privacy changes?",
      "What's your approach to influencer marketing and creator economy?",
      "How do you leverage AI tools for content creation and personalization?",
      "Describe your experience with TikTok and short-form video marketing.",
      "How do you measure ROI in a cookieless future?",
      "What's your approach to sustainable and purpose-driven marketing?",
      "How do you handle marketing in the metaverse and Web3 spaces?",
      "Describe your experience with voice search optimization.",
      "How do you approach community building and social commerce?",
      "What's your strategy for marketing to remote and hybrid workforces?"
    ],
    'Financial Analyst': [
      "How do you analyze cryptocurrency and digital asset investments?",
      "What's your approach to ESG (Environmental, Social, Governance) analysis?",
      "How do you factor inflation and supply chain disruptions into forecasts?",
      "Describe your experience with automated financial reporting tools.",
      "How do you analyze the financial impact of remote work policies?",
      "What's your approach to analyzing subscription and SaaS business models?",
      "How do you assess cybersecurity risks in financial planning?",
      "Describe your experience with real-time financial analytics.",
      "How do you analyze the ROI of AI and automation investments?",
      "What's your approach to analyzing emerging market opportunities?"
    ],
    'Data Scientist': [
      "How do you approach responsible AI and bias mitigation in models?",
      "What's your experience with large language models and prompt engineering?",
      "How do you handle data privacy regulations like GDPR in your work?",
      "Describe your approach to real-time machine learning and streaming data.",
      "How do you explain complex AI models to non-technical stakeholders?",
      "What's your experience with MLOps and model deployment at scale?",
      "How do you approach federated learning and edge AI?",
      "Describe your experience with computer vision and multimodal AI.",
      "How do you handle data quality in the era of big data?",
      "What's your approach to A/B testing with AI-driven features?"
    ],
    'HR Manager': [
      "How do you approach diversity, equity, and inclusion in hiring?",
      "What's your strategy for managing hybrid and remote teams?",
      "How do you handle employee mental health and wellbeing programs?",
      "Describe your approach to skills-based hiring and assessment.",
      "How do you use AI tools for recruitment and candidate screening?",
      "What's your experience with employee experience platforms?",
      "How do you handle the Great Resignation and talent retention?",
      "Describe your approach to continuous learning and reskilling.",
      "How do you measure and improve company culture remotely?",
      "What's your strategy for managing multi-generational workforces?"
    ],
    'Digital Marketing Specialist': [
      "How do you optimize for voice search and smart speakers?",
      "What's your approach to marketing automation and personalization?",
      "How do you leverage user-generated content and social proof?",
      "Describe your experience with programmatic advertising.",
      "How do you approach omnichannel marketing attribution?",
      "What's your strategy for marketing on emerging social platforms?",
      "How do you handle marketing in a privacy-focused world?",
      "Describe your experience with interactive and immersive content.",
      "How do you optimize for Core Web Vitals and page experience?",
      "What's your approach to marketing to voice-first and mobile-first users?"
    ],
    'UX Designer': [
      "How do you design for accessibility and inclusive experiences?",
      "What's your approach to designing for voice and conversational interfaces?",
      "How do you incorporate sustainability into your design decisions?",
      "Describe your experience with design systems and component libraries.",
      "How do you design for emerging technologies like AR/VR?",
      "What's your approach to ethical design and dark patterns?",
      "How do you handle user research in remote and distributed teams?",
      "Describe your experience with motion design and micro-interactions.",
      "How do you design for different cultural contexts and global users?",
      "What's your approach to designing for mental health and wellbeing?"
    ]
  };

  const baseTrendyQuestions = [
    "How has remote work changed your approach to this role?",
    "What's your experience with AI tools in your daily work?",
    "How do you stay updated with industry trends and emerging technologies?",
    "Describe your approach to work-life balance in today's environment.",
    "How do you handle digital transformation in your field?"
  ];

  const questions = [...baseTrendyQuestions];
  if (trendyQuestions2024[role]) {
    questions.push(...trendyQuestions2024[role]);
  }

  // Adjust based on difficulty
  if (difficulty === 'easy') {
    return questions.slice(0, 3);
  } else if (difficulty === 'medium') {
    return questions.slice(0, 5);
  } else {
    return questions.slice(0, 8);
  }
};