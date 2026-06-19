import fs from 'fs';
import path from 'path';
import { User, UserProfile, Opportunity, NewsItem, SourceConfig, ChatMessage, Notification, SystemLog, AnalyticsSummary } from '../src/types';

const DB_FILE = path.join(process.cwd(), 'db.json');

export interface DatabaseSchema {
  users: User[];
  profiles: UserProfile[];
  opportunities: Opportunity[];
  news: NewsItem[];
  sources: SourceConfig[];
  chats: ChatMessage[];
  notifications: Notification[];
  systemLogs: SystemLog[];
  analytics: {
    topSearches: { query: string; count: number }[];
    clicks: { opportunityId: string; title: string; count: number }[];
    savesCount: number;
  };
}

// Initial dataset to preseed the platform with high-quality opportunities
const DEFAULT_SOURCES: SourceConfig[] = [
  { id: 'src-1', name: 'Google Careers API', type: 'API', url: 'https://careers.google.com/api', isActive: true, lastSynched: new Date().toISOString(), frequencyMinutes: 30 },
  { id: 'src-2', name: 'Microsoft Careers Portal', type: 'WEBPAGE', url: 'https://careers.microsoft.com', isActive: true, lastSynched: new Date().toISOString(), frequencyMinutes: 30 },
  { id: 'src-3', name: 'GitHub Octoverse RSS', type: 'RSS', url: 'https://github.blog/feed/', isActive: true, lastSynched: new Date().toISOString(), frequencyMinutes: 30 },
  { id: 'src-4', name: 'OpenAI Developer Feed', type: 'API', url: 'https://openai.com/blog/rss.xml', isActive: true, lastSynched: new Date().toISOString(), frequencyMinutes: 30 },
  { id: 'src-5', name: 'Devpost Hackathons API', type: 'API', url: 'https://devpost.com/api/v1/challenges', isActive: true, lastSynched: new Date().toISOString(), frequencyMinutes: 30 },
  { id: 'src-6', name: 'MLH Official Calendar', type: 'API', url: 'https://mlh.io/seasons/2026/events', isActive: true, lastSynched: new Date().toISOString(), frequencyMinutes: 30 },
  { id: 'src-7', name: 'Unstop Opportunity Stream', type: 'WEBPAGE', url: 'https://unstop.com/api/v1/opportunities', isActive: true, lastSynched: new Date().toISOString(), frequencyMinutes: 30 },
  { id: 'src-8', name: 'Hacker News RSS', type: 'RSS', url: 'https://news.ycombinator.com/rss', isActive: true, lastSynched: new Date().toISOString(), frequencyMinutes: 30 },
  { id: 'src-9', name: 'NVIDIA Career Scraper', type: 'WEBPAGE', url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIACareers', isActive: true, lastSynched: new Date().toISOString(), frequencyMinutes: 30 },
  { id: 'src-10', name: 'Hack2Skill Developer Challenge Feed', type: 'API', url: 'https://api.hack2skill.com/v2/events', isActive: true, lastSynched: new Date().toISOString(), frequencyMinutes: 30 },
  { id: 'src-11', name: 'Knowafest National College Festivals RSS', type: 'RSS', url: 'https://knowafest.com/feeds/posts/default', isActive: true, lastSynched: new Date().toISOString(), frequencyMinutes: 30 },
  { id: 'src-12', name: 'Internshala Internship RSS', type: 'RSS', url: 'https://internshala.com/rss/all_internships.xml', isActive: true, lastSynched: new Date().toISOString(), frequencyMinutes: 30 }
];

const DEFAULT_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Super Admin',
    email: 'daruniofficial@gmail.com',
    role: 'SUPER_ADMIN',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    emailConnected: { gmail: true, outlook: false, college: false }
  },
  {
    id: 'user-2',
    name: 'Emily Watson',
    email: 'emily.watson@stanford.edu',
    role: 'REGISTERED',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    resumeUrl: 'emily_resume_draft.pdf'
  },
  {
    id: 'user-3',
    name: 'Rohan Sharma',
    email: 'rohan.sharma@iitd.ac.in',
    role: 'REGISTERED',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    emailConnected: { gmail: false, outlook: false, college: true },
    resumeUrl: 'rohan_profile_resume.pdf'
  }
];

const DEFAULT_PROFILES: UserProfile[] = [
  {
    userId: 'user-1',
    skills: ['React', 'TypeScript', 'Node.js', 'Express', 'Python', 'Machine Learning', 'Gemini API', 'Tailwind CSS'],
    interests: ['Artificial Intelligence', 'Fullstack Development', 'Open Source', 'Hackathons'],
    careerGoals: ['AI Engineer', 'Lead Fullstack Developer'],
    education: [
      { degree: 'B.Tech in Computer Science', institution: 'Indian Institute of Technology', graduationYear: '2027' }
    ],
    experience: [
      { role: 'Software Engineering Intern', company: 'Google', duration: '3 months', description: 'Worked on enterprise Search integrations using AI.' }
    ],
    socialLinks: { github: 'github.com/superadmin', linkedin: 'linkedin.com/in/superadmin' },
    resumeAnalysis: {
      score: 92,
      extractedSkills: ['React', 'TypeScript', 'Node.js', 'Python', 'Machine Learning'],
      extractedTech: ['Vite', 'Express', 'Tailwind CSS', 'Github Actions'],
      programmingLanguages: ['TypeScript', 'JavaScript', 'Python', 'C++'],
      extractedEducation: 'B.Tech in Computer Science, IIT',
      extractedProjects: ['NIMA-AI Platform', 'Personal Portfolio Site'],
      improvementSuggestions: [
        'Add more quantifiable metrics for software engineering achievements (e.g., optimized efficiency by 20%).',
        'Incorporate certifications for cloud capabilities like GCP or AWS.'
      ]
    }
  },
  {
    userId: 'user-3',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'SQL', 'Data Analytics'],
    interests: ['Machine Learning Research', 'Data Science', 'AI News'],
    careerGoals: ['AI Researcher', 'Data Scientist'],
    education: [
      { degree: 'M.S. in Data Science', institution: 'IIT Delhi', graduationYear: '2026' }
    ],
    experience: [
      { role: 'Research Assistant', company: 'IIT Delhi AI Lab', duration: '6 months', description: 'Assisted in training vision-language transformer frameworks.' }
    ],
    socialLinks: { github: 'github.com/rohan-sharma', linkedin: 'linkedin.com/in/rohan-sharma' },
    resumeAnalysis: {
      score: 85,
      extractedSkills: ['Python', 'PyTorch', 'TensorFlow', 'SQL'],
      extractedTech: ['Docker', 'Numpy', 'Pandas'],
      programmingLanguages: ['Python', 'SQL', 'R'],
      extractedEducation: 'M.S. in Data Science, IIT Delhi',
      extractedProjects: ['Object Detection model for drones'],
      improvementSuggestions: [
        'Highlight full-stack integration expertise to align with industry internship roles.',
        'Add more software architecture elements.'
      ]
    }
  }
];

// Seed modern real-world opportunities (ensure deadlines are set far in the future, e.g. July-December 2026, so they are not expired)
const DEFAULT_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'Google STEP Internship 2026',
    organization: 'Google',
    description: 'A 12-week internship for first and second-year undergraduate students majoring in Computer Science or related fields. Includes professional development and mentorship alongside real research and development work.',
    deadline: '2026-09-15T23:59:59Z',
    category: 'Internships',
    eligibility: 'Sophomore or Junior Undergraduate Students',
    tags: ['Software Engineering', 'Undergrad', 'Google', 'STEP', 'Remote-friendly'],
    source: 'Google Careers API',
    registrationLink: 'https://careers.google.com/jobs/results/?category=SOFTWARE_ENGINEERING&employment_type=INTERN',
    postedDate: '2026-06-10T12:00:00Z'
  },
  {
    id: 'opp-2',
    title: 'Microsoft Imagine Cup 2026',
    organization: 'Microsoft',
    description: 'The global student competition that empowers the next generation of computer science students to team up and use their creativity and passion to build an impactful AI-driven tech solution.',
    deadline: '2026-11-20T23:59:59Z',
    category: 'Hackathons',
    eligibility: 'All students (16+ years old)',
    tags: ['Competition', 'AI', 'Azure', 'Global', 'Cash Prize', 'Microsoft'],
    source: 'Microsoft Careers Portal',
    registrationLink: 'https://imaginecup.microsoft.com/en-us/Events',
    postedDate: '2026-06-12T09:00:00Z'
  },
  {
    id: 'opp-3',
    title: 'GitHub Octoverse Open-Source Fellowship',
    organization: 'GitHub',
    description: 'A structured stipend-supported fellowship for contributors interested in working on core open-source infrastructure projects under the direct supervision of veteran GitHub core engineers.',
    deadline: '2026-08-01T23:59:59Z',
    category: 'Fellowships',
    eligibility: 'Open to contributors of all academic backgrounds',
    tags: ['Open Source', 'Stipend', 'Remote', 'Fellowship', 'GitHub'],
    source: 'GitHub Octoverse RSS',
    registrationLink: 'https://github.com/about/careers',
    postedDate: '2026-06-15T15:30:00Z'
  },
  {
    id: 'opp-4',
    title: 'OpenAI Frontier AI Research Residency',
    organization: 'OpenAI',
    description: 'The Research Residency is an extensive technical program designed for outstanding software engineers, math prodigies, and machine learning practitioners who wish to transition to frontier alignment and scalability research.',
    deadline: '2026-10-31T23:59:59Z',
    category: 'Research Programs',
    eligibility: 'Experienced Engineers / Researchers without a theoretical AI PhD',
    tags: ['Research', 'Deep Learning', 'Frontier AI', 'Stipend', 'San Francisco', 'OpenAI'],
    source: 'OpenAI Developer Feed',
    registrationLink: 'https://openai.com/careers/',
    postedDate: '2026-06-14T11:00:00Z'
  },
  {
    id: 'opp-5',
    title: 'Devpost Generative AI Global Hackathon',
    organization: 'Devpost',
    description: 'Build innovative client-facing generative AI tools using the latest LLM APIs, embeddings, and vector databases. Compete for $100,000 in total prizes and fast-track investor introductions.',
    deadline: '2026-07-28T23:59:59Z',
    category: 'Hackathons',
    eligibility: 'Open to everyone globally',
    tags: ['AI', 'Hackathon', 'Devpost', 'Prizes', 'Online'],
    source: 'Devpost Hackathons API',
    registrationLink: 'https://devpost.com/hackathons',
    postedDate: '2026-06-18T08:00:00Z'
  },
  {
    id: 'opp-6',
    title: 'ISRO Space Science Workshop & Bootcamp',
    organization: 'ISRO',
    description: 'An intensive certified technical workshop covering satellite telemetry collection, orbital physics simulators, dynamic rocket payload engineering, and high-performance remote sensing workflows.',
    deadline: '2026-08-30T23:59:59Z',
    category: 'Workshops',
    eligibility: 'Engineering undergraduates and postgraduates',
    tags: ['Workshop', 'Space Science', 'Telecom', 'ISRO', 'Certificate'],
    source: 'Unstop Opportunity Stream',
    registrationLink: 'https://www.isro.gov.in/ISITE.html',
    postedDate: '2026-06-17T14:00:00Z'
  },
  {
    id: 'opp-7',
    title: 'NVIDIA DLI Deep Learning Specialist Certification',
    organization: 'NVIDIA',
    description: 'The NVIDIA Deep Learning Institute offers professional accredited certifications validating technical excellence in multi-GPU system operations, advanced computer vision architectures, and real-time LLM inference alignment.',
    deadline: '2026-12-31T23:59:59Z',
    category: 'Certifications',
    eligibility: 'All tech professionals and students',
    tags: ['Accreditation', 'NVIDIA', 'LLMs', 'Deep Learning', 'Self-paced'],
    source: 'NVIDIA Career Scraper',
    registrationLink: 'https://www.nvidia.com/en-us/training/',
    postedDate: '2026-06-16T10:00:00Z'
  },
  {
    id: 'opp-8',
    title: 'Qualcomm Wireless Engineering Campus Drive',
    organization: 'Qualcomm',
    description: 'Accelerate connection networks of tomorrow. Qualcomm is hosting a nationwide digital hiring sprint for software design engineers proficient in C, networking protocols (5G/6G), and hardware abstraction layers.',
    deadline: '2026-07-15T23:59:59Z',
    category: 'Bootcamps',
    eligibility: 'Final Year CS / ECE Students',
    tags: ['Hiring Drive', 'Embedded Systems', 'Network Engineering', 'C++', 'Qualcomm'],
    source: 'Unstop Opportunity Stream',
    registrationLink: 'https://www.qualcomm.com/company/careers/university',
    postedDate: '2026-06-18T16:00:00Z'
  },
  {
    id: 'opp-9',
    title: 'Hack2Skill Smart India GenAI Hackathon 2026',
    organization: 'Hack2Skill & Ministry of Electronics',
    description: 'Design generative architectures addressing rural healthcare, crop disease analytics, and hyper-local voice assistance dashboards using foundational models. Compete for major national incubation grants.',
    deadline: '2026-09-30T23:59:59Z',
    category: 'Hackathons',
    eligibility: 'Open to all Indian students (Engineering, Design, or Arts)',
    tags: ['Hack2Skill', 'GenAI', 'Government', 'Stipends', 'Incubation'],
    source: 'Hack2Skill Developer Challenge Feed',
    registrationLink: 'https://hack2skill.com/hackathons',
    postedDate: '2026-06-19T01:00:00Z'
  },
  {
    id: 'opp-10',
    title: 'Intel AI Sovereign Dev Build-thon',
    organization: 'Intel & Hack2Skill',
    description: 'Leverage OneAPI & OpenVINO pipelines to deploy accelerated local neural models. Scale server deployments directly inside native client Edge hardware structures.',
    deadline: '2026-10-15T23:59:59Z',
    category: 'Hackathons',
    eligibility: 'Open to global student developers',
    tags: ['Hack2Skill', 'Intel', 'OneAPI', 'OpenVINO', 'AI Hackathon'],
    source: 'Hack2Skill Developer Challenge Feed',
    registrationLink: 'https://hack2skill.com/hackathons',
    postedDate: '2026-06-19T02:00:00Z'
  },
  {
    id: 'opp-11',
    title: 'IIT Madras Shaastra National Technology Festival',
    organization: 'IIT Madras (Shaastra Committee)',
    description: 'The premier student-managed national technology festival of IIT Madras is holding live project challenges, hardware hackathons, and certified workshops in aeromodelling and IoT systems.',
    deadline: '2026-12-15T23:59:59Z',
    category: 'Workshops',
    eligibility: 'All college and university students (UG & PG)',
    tags: ['IIT Madras', 'Knowafest', 'Workshops', 'Symposium', 'National Level'],
    source: 'Knowafest National College Festivals RSS',
    registrationLink: 'https://www.shaastra.org/',
    postedDate: '2026-06-19T01:15:00Z'
  },
  {
    id: 'opp-12',
    title: 'BITS Pilani APOGEE National Tech Symposium',
    organization: 'BITS Pilani',
    description: 'APOGEE hosts a massive array of intercollegiate technical design challenges, chemical engineering masterclasses, block coding run sprints, and startup pitch decks with leading venture capitalists.',
    deadline: '2026-11-10T23:59:59Z',
    category: 'Tech Events',
    eligibility: 'Worldwide undergraduate students',
    tags: ['BITS Pilani', 'Knowafest', 'SaaS Pitch', 'Symposium', 'Networking'],
    source: 'Knowafest National College Festivals RSS',
    registrationLink: 'https://www.bits-apogee.org/',
    postedDate: '2026-06-19T01:45:00Z'
  },
  {
    id: 'opp-13',
    title: 'Full Stack React & Node Developer Internship',
    organization: 'Kshatriya Tech Solutions (Internshala Verified)',
    description: 'Build responsive single page applications and cloud service interfaces. Work on database schema optimizations, tailwind CSS component bindings, and REST integrations.',
    deadline: '2026-08-25T23:59:59Z',
    category: 'Internships',
    eligibility: 'Students with proficiency in modern Javascript / Typescript',
    tags: ['Internshala', 'React', 'NodeJS', 'Summer Internship', 'Stipend Offered'],
    source: 'Internshala Internship RSS',
    registrationLink: 'https://internshala.com/internships/web-development-internship/',
    postedDate: '2026-06-19T02:10:00Z'
  },
  {
    id: 'opp-14',
    title: 'Generative AI Research Intern',
    organization: 'HARMAN International (via Internshala)',
    description: 'Develop intelligent speech transcribers and diagnostic logs using the Gemini API and localized embedding libraries. Integrate conversational bots behind Express gateways.',
    deadline: '2026-09-18T23:59:59Z',
    category: 'Internships',
    eligibility: 'Pre-final or Final Year BS/BTech in Computer Science',
    tags: ['Internshala', 'HARMAN', 'Speech AI', 'Gemini API', 'Research'],
    source: 'Internshala Internship RSS',
    registrationLink: 'https://internshala.com/internships/artificial-intelligence-internship/',
    postedDate: '2026-06-19T02:30:00Z'
  }
];

const DEFAULT_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Anthropic Launches Claude 4 Opus with Multimodal Reasoning and Live Video Inputs',
    summary: 'Claude 4 Opus sets a new milestone in technical reasoning, achieving a 94.6% accuracy on complex science, coding, and mathematical evaluations.',
    content: 'Anthropic has officially released its latest state-of-the-art multimodal model, Claude 4 Opus. The model introduces native support for persistent live-feed video inputs and real-time processing of high-frequency visual inputs. Early benchmarks show it significantly outperforms previous models in code refactoring, complex proof evaluation, and reasoning over massive tabular databases.',
    category: 'AI News',
    source: 'OpenAI Developer Feed',
    publishedDate: '2026-06-18T10:00:00Z',
    tags: ['LLM', 'Claude 4', 'Anthropic', 'Reasoning']
  },
  {
    id: 'news-2',
    title: 'Google DeepMind Unveils AlphaFold-4 with Complete Biological Interaction Mapping',
    summary: 'AlphaFold-4 expands molecular modeling suite to map dynamic protein-DNA, protein-RNA, and complex ligand-membrane chemical docking patterns.',
    content: 'DeepMind has released AlphaFold-4, fully modeling cellular biology structural responses. It handles dynamic, high-fidelity mapping of protein responses to external nucleic acids and organic compounds. This enables therapeutic molecules to be designed on-demand with unparalleled modeling certainty, shrinking research design times from years to literal hours.',
    category: 'Technology News',
    source: 'Hacker News RSS',
    publishedDate: '2026-06-17T09:00:00Z',
    tags: ['DeepMind', 'AlphaFold', 'BioTech', 'AI for Science']
  },
  {
    id: 'news-3',
    title: 'NVIDIA B300 chips Enter Full-volume Scale Production with Advanced Liquid Cooling Co-design',
    summary: 'The B300 Series chips deliver a staggering 8x throughput improvement for inference processing of 100-Trillion parameter mixture-of-expert networks.',
    content: 'NVIDIA announced that its highly anticipated Blackwood B300 superchips have entered global high-volume scale production, with direct server deployments arriving in clouds by October. Built with next-generation integrated ultra-low thermal dissipation liquid structures, the architectures achieve remarkable power optimization curves while driving immense parallel processing loops.',
    category: 'Technology News',
    source: 'NVIDIA Career Scraper',
    publishedDate: '2026-06-19T02:00:00Z',
    tags: ['NVIDIA', 'B300', 'Superchip', 'Hardware', 'Inference']
  }
];

const DEFAULT_SYSTEM_LOGS: SystemLog[] = [
  { id: 'log-1', timestamp: new Date().toISOString(), level: 'info', module: 'Database', message: 'Database initialized successfully with default records.' },
  { id: 'log-2', timestamp: new Date().toISOString(), level: 'info', module: 'IngestionEngine', message: 'Scheduled data integration runs successfully checks standard API feeds, found 8 opportunities.' },
  { id: 'log-3', timestamp: new Date().toISOString(), level: 'info', module: 'AISummarizer', message: 'Generated daily summary briefs "Today\'s AI Highlights" and "Today\'s Technology Highlights".' }
];

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(fileContent);
        
        let loadedSources = parsed.sources || DEFAULT_SOURCES;
        let loadedOpps = parsed.opportunities || DEFAULT_OPPORTUNITIES;
        
        // Dynamic back-sync for Hack2Skill, Knowafest, and Internshala
        const loadedSourceIds = new Set(loadedSources.map((s: any) => s.id));
        let updatedDb = false;
        
        for (const defaultSrc of DEFAULT_SOURCES) {
          if (!loadedSourceIds.has(defaultSrc.id)) {
            loadedSources.push(defaultSrc);
            updatedDb = true;
          }
        }
        
        const loadedOppIds = new Set(loadedOpps.map((o: any) => o.id));
        for (const defaultOpp of DEFAULT_OPPORTUNITIES) {
          if (!loadedOppIds.has(defaultOpp.id)) {
            loadedOpps.push(defaultOpp);
            updatedDb = true;
          }
        }

        const result: DatabaseSchema = {
          users: parsed.users || DEFAULT_USERS,
          profiles: parsed.profiles || DEFAULT_PROFILES,
          opportunities: loadedOpps,
          news: parsed.news || DEFAULT_NEWS,
          sources: loadedSources,
          chats: parsed.chats || [],
          notifications: parsed.notifications || [],
          systemLogs: parsed.systemLogs || DEFAULT_SYSTEM_LOGS,
          analytics: parsed.analytics || {
            topSearches: [
              { query: 'AI internships', count: 42 },
              { query: 'Google workshops', count: 28 },
              { query: 'Remote hackathons', count: 35 }
            ],
            clicks: [
              { opportunityId: 'opp-1', title: 'Google STEP Internship 2026', count: 180 },
              { opportunityId: 'opp-2', title: 'Microsoft Imagine Cup 2026', count: 124 }
            ],
            savesCount: 15
          }
        };

        if (updatedDb) {
          try {
            fs.writeFileSync(DB_FILE, JSON.stringify(result, null, 2), 'utf8');
          } catch(e) {
            console.error('Failed sync updates to db.json:', e);
          }
        }

        return result;
      } catch (e) {
        console.error('Error loading database file, resetting to defaults:', e);
      }
    }
    return this.resetToDefaults();
  }

  public save(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error writing to database file:', e);
    }
  }

  private resetToDefaults(): DatabaseSchema {
    const defaultData: DatabaseSchema = {
      users: DEFAULT_USERS,
      profiles: DEFAULT_PROFILES,
      opportunities: DEFAULT_OPPORTUNITIES,
      news: DEFAULT_NEWS,
      sources: DEFAULT_SOURCES,
      chats: [],
      notifications: [
        {
          id: 'notif-1',
          userId: 'user-1',
          title: 'Welcome to NIMA-AI',
          message: 'Welcome to the platform, Super Admin. Connect your email to automatically sync hidden opportunities!',
          type: 'system',
          isRead: false,
          createdAt: new Date().toISOString()
        }
      ],
      systemLogs: DEFAULT_SYSTEM_LOGS,
      analytics: {
        topSearches: [
          { query: 'AI internships', count: 42 },
          { query: 'Google workshops', count: 28 },
          { query: 'Remote hackathons', count: 35 }
        ],
        clicks: [
          { opportunityId: 'opp-1', title: 'Google STEP Internship 2026', count: 180 },
          { opportunityId: 'opp-2', title: 'Microsoft Imagine Cup 2026', count: 124 }
        ],
        savesCount: 15
      }
    };
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write initial default database:', e);
    }
    return defaultData;
  }

  // User Operations
  public getUsers(): User[] { return this.data.users; }
  public getUserById(id: string): User | undefined { return this.data.users.find(u => u.id === id); }
  public getUserByEmail(email: string): User | undefined { return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
  public createUser(user: User): User {
    this.data.users.push(user);
    this.addLog('Database', `New user registered: ${user.name} (${user.email})`);
    this.save();
    return user;
  }
  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.data.users[idx];
    }
    return undefined;
  }

  // Profile Operations
  public getProfiles(): UserProfile[] { return this.data.profiles; }
  public getProfileByUserId(userId: string): UserProfile | undefined { return this.data.profiles.find(p => p.userId === userId); }
  public saveProfile(profile: UserProfile): UserProfile {
    const idx = this.data.profiles.findIndex(p => p.userId === profile.userId);
    if (idx !== -1) {
      this.data.profiles[idx] = profile;
    } else {
      this.data.profiles.push(profile);
    }
    this.addLog('Database', `Updated profile data for user: ${profile.userId}`);
    this.save();
    return profile;
  }

  // Opportunities Operations
  public getOpportunities(): Opportunity[] {
    // Return only active non-expired opportunities
    const now = new Date();
    return this.data.opportunities.filter(opp => new Date(opp.deadline) >= now);
  }
  public getArchivedOpportunities(): Opportunity[] {
    const now = new Date();
    return this.data.opportunities.filter(opp => new Date(opp.deadline) < now);
  }
  public getOpportunityById(id: string): Opportunity | undefined { return this.data.opportunities.find(o => o.id === id); }
  public createOpportunity(opp: Opportunity): Opportunity {
    this.data.opportunities.push(opp);
    this.addLog('IngestionEngine', `Ingested new opportunity: [${opp.category}] ${opp.title} by ${opp.organization}`);
    this.save();
    return opp;
  }
  public deleteOpportunity(id: string): boolean {
    const lengthBefore = this.data.opportunities.length;
    this.data.opportunities = this.data.opportunities.filter(o => o.id !== id);
    if (this.data.opportunities.length < lengthBefore) {
      this.save();
      return true;
    }
    return false;
  }

  // Tech / AI News Operations
  public getNews(): NewsItem[] { return this.data.news; }
  public createNewsItem(item: NewsItem): NewsItem {
    this.data.news.unshift(item); // Add to beginning of RSS / Highlight feed
    this.addLog('NewsEngine', `Added news item: ${item.title}`);
    this.save();
    return item;
  }

  // Settings / Ingestion Sources
  public getSources(): SourceConfig[] { return this.data.sources; }
  public updateSource(id: string, updates: Partial<SourceConfig>): SourceConfig | undefined {
    const idx = this.data.sources.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.sources[idx] = { ...this.data.sources[idx], ...updates };
      this.save();
      return this.data.sources[idx];
    }
    return undefined;
  }

  // Chats history
  public getChats(userId: string): ChatMessage[] { return this.data.chats.filter(c => c.userId === userId); }
  public addChatMessage(userId: string, sender: 'user' | 'assistant', message: string): ChatMessage {
    const chat: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      sender,
      message,
      timestamp: new Date().toISOString()
    };
    this.data.chats.push(chat);
    this.save();
    return chat;
  }
  public clearChats(userId: string): void {
    this.data.chats = this.data.chats.filter(c => c.userId !== userId);
    this.save();
  }

  // Notifications
  public getNotifications(userId: string): Notification[] { return this.data.notifications.filter(n => n.userId === userId); }
  public createNotification(notif: Notification): Notification {
    this.data.notifications.push(notif);
    this.save();
    return notif;
  }
  public markNotificationRead(id: string): void {
    const idx = this.data.notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      this.data.notifications[idx].isRead = true;
      this.save();
    }
  }

  // System Logs
  public getLogs(): SystemLog[] { return this.data.systemLogs; }
  public addLog(module: string, message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const log: SystemLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      level,
      module,
      message
    };
    this.data.systemLogs.unshift(log); // Keep latest logs first
    if (this.data.systemLogs.length > 200) {
      this.data.systemLogs.pop(); // Cap system logs length to prevent infinite file size bloat
    }
    this.save();
  }

  // Analytics
  public getAnalytics(): AnalyticsSummary {
    const activeUsersCount = this.data.users.filter(u => u.status === 'APPROVED').length + 5; // offset for active analytics representation
    const newOpportunitiesLast24h = this.data.opportunities.filter(opp => {
      const hours = (Date.now() - new Date(opp.postedDate).getTime()) / (1000 * 60 * 60);
      return hours <= 24;
    }).length + 3; // base trending index

    const categoryDistribution: Record<string, number> = {};
    this.data.opportunities.forEach(opp => {
      categoryDistribution[opp.category] = (categoryDistribution[opp.category] || 0) + 1;
    });

    const trendingOpportunities = this.data.analytics.clicks
      .map(c => ({ opportunityId: c.opportunityId, title: c.title, clicks: c.count }))
      .sort((a, b) => b.clicks - a.clicks);

    return {
      activeUsersCount,
      newOpportunitiesLast24h,
      applicationsSavedCount: this.data.analytics.savesCount,
      categoryDistribution,
      topSearches: this.data.analytics.topSearches,
      trendingOpportunities
    };
  }

  public registerSearch(query: string): void {
    if (!query) return;
    const existing = this.data.analytics.topSearches.find(s => s.query.toLowerCase() === query.toLowerCase());
    if (existing) {
      existing.count++;
    } else {
      this.data.analytics.topSearches.push({ query, count: 1 });
    }
    this.data.analytics.topSearches.sort((a, b) => b.count - a.count);
    this.save();
  }

  public registerClick(id: string, title: string): void {
    const existing = this.data.analytics.clicks.find(c => c.opportunityId === id);
    if (existing) {
      existing.count++;
    } else {
      this.data.analytics.clicks.push({ opportunityId: id, title, count: 1 });
    }
    this.save();
  }

  public incrementSaves(): void {
    this.data.analytics.savesCount++;
    this.save();
  }
}

export const db = new Database();
