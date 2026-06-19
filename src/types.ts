export type UserRole = 'GUEST' | 'REGISTERED' | 'ADMIN' | 'SUPER_ADMIN';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: ApprovalStatus;
  createdAt: string;
  resumeUrl?: string;
  emailConnected?: {
    gmail?: boolean;
    outlook?: boolean;
    college?: boolean;
  };
}

export interface UserProfile {
  userId: string;
  skills: string[];
  interests: string[];
  careerGoals: string[];
  education: {
    degree: string;
    institution: string;
    graduationYear: string;
  }[];
  experience: {
    role: string;
    company: string;
    duration: string;
    description: string;
  }[];
  socialLinks: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  resumeAnalysis?: {
    score: number;
    extractedSkills: string[];
    extractedTech: string[];
    programmingLanguages: string[];
    extractedEducation: string;
    extractedProjects: string[];
    improvementSuggestions: string[];
  };
}

export type OpportunityCategory = 
  | 'Internships'
  | 'Hackathons'
  | 'Workshops'
  | 'Bootcamps'
  | 'Certifications'
  | 'Tech Events'
  | 'Research Programs'
  | 'Fellowships'
  | 'AI News'
  | 'Technology News';

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  description: string;
  deadline: string;
  category: OpportunityCategory;
  eligibility: string;
  tags: string[];
  source: string;
  registrationLink: string;
  registration_link?: string;
  postedDate: string;
  status?: string;
  is_duplicate?: boolean;
  relevanceScore?: number;
  relevance_score?: number;
  matchPercentage?: number;
  priorityScore?: number;
  created_at?: string;
  updated_at?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'AI News' | 'Technology News';
  source: string;
  publishedDate: string;
  tags: string[];
}

export interface SourceConfig {
  id: string;
  name: string;
  type: 'API' | 'RSS' | 'WEBPAGE';
  url: string;
  isActive: boolean;
  lastSynched: string;
  frequencyMinutes: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  sender: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'opportunity' | 'news' | 'approval' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  module: string;
  message: string;
}

export interface AnalyticsSummary {
  activeUsersCount: number;
  newOpportunitiesLast24h: number;
  applicationsSavedCount: number;
  categoryDistribution: Record<string, number>;
  topSearches: { query: string; count: number }[];
  trendingOpportunities: { opportunityId: string; title: string; clicks: number }[];
}
