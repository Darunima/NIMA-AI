import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { db } from './server/db';
import { User, UserProfile, Opportunity, NewsItem } from './src/types';
import { GoogleGenAI, Type } from '@google/genai';
import { triggerUniversalSystemCrawl, scanUserConnectedEmails } from './server/engine';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Initialize GoogleGenAI client lazily & safely to prevent startup crashes if key is missing
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.error('Failed to initialize GoogleGenAI client:', e);
    }
  }
  return aiClient;
}

app.use(express.json({ limit: '10mb' }));

// Simulated Active Session State (normally cookie/session; using a header or query parameter user-id for simple SPA alignment)
const getCurrentUser = (req: express.Request): User | undefined => {
  const userId = req.headers['x-user-id'] as string || 'user-1'; // default to Super Admin for dev ease, allow dynamic selection
  return db.getUserById(userId);
};

// ==========================================
// 1. AUTHENTICATION & USER MANAGEMENT ENDPOINTS
// ==========================================

// Get current logged-in user session
app.get('/api/auth/session', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const profile = db.getProfileByUserId(user.id);
  res.json({ user, profile });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required.' });
  }

  const existingUser = db.getUserByEmail(email);
  if (!existingUser) {
    // If not exists, check if Super Admin email is specified
    const isSuperAdmin = email.toLowerCase() === 'daruniofficial@gmail.com';
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: isSuperAdmin ? 'Super Admin' : email.split('@')[0],
      email: email.toLowerCase(),
      role: isSuperAdmin ? 'SUPER_ADMIN' : 'REGISTERED',
      status: isSuperAdmin ? 'APPROVED' : 'PENDING',
      createdAt: new Date().toISOString()
    };
    db.createUser(newUser);
    
    // Auto provision blank profile
    const blankProfile: UserProfile = {
      userId: newUser.id,
      skills: [],
      interests: [],
      careerGoals: [],
      education: [],
      experience: [],
      socialLinks: {}
    };
    db.saveProfile(blankProfile);

    // Create a personalized notification
    db.createNotification({
      id: `notif-${Date.now()}`,
      userId: newUser.id,
      title: 'Welcome to NIMA-AI!',
      message: isSuperAdmin 
        ? 'Super Admin permissions automatically assigned. Access the admin panel above to review pending registrations.'
        : 'Your registration is submitted. An Administrator will review your account soon.',
      type: 'system',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return res.json({ user: newUser, profile: blankProfile });
  }

  const profile = db.getProfileByUserId(existingUser.id) || {
    userId: existingUser.id,
    skills: [],
    interests: [],
    careerGoals: [],
    education: [],
    experience: [],
    socialLinks: {}
  };
  
  res.json({ user: existingUser, profile });
});

// Register user with simulated resume upload
app.post('/api/auth/register', (req, res) => {
  const { name, email, skills, interests, resumeText, fileName } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const isSuperAdmin = email.toLowerCase() === 'daruniofficial@gmail.com';
  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    role: isSuperAdmin ? 'SUPER_ADMIN' : 'REGISTERED',
    status: isSuperAdmin ? 'APPROVED' : 'PENDING',
    createdAt: new Date().toISOString(),
    resumeUrl: fileName || (resumeText ? 'uploaded_resume.txt' : undefined)
  };

  db.createUser(newUser);

  // Parse skill lines or array input
  const splitSkills = Array.isArray(skills) 
    ? skills 
    : (skills ? String(skills).split(',').map(s => s.trim()).filter(Boolean) : []);
  const splitInterests = Array.isArray(interests) 
    ? interests 
    : (interests ? String(interests).split(',').map(s => s.trim()).filter(Boolean) : []);

  const newProfile: UserProfile = {
    userId: newUser.id,
    skills: splitSkills,
    interests: splitInterests,
    careerGoals: [],
    education: [],
    experience: [],
    socialLinks: {}
  };

  // If resume content is provided, trigger automated parser
  if (resumeText) {
    newProfile.resumeAnalysis = parseResumeLocally(resumeText);
    // Combine mock extraction with existing skills
    newProfile.skills = Array.from(new Set([...newProfile.skills, ...newProfile.resumeAnalysis.extractedSkills]));
  }

  db.saveProfile(newProfile);

  db.createNotification({
    id: `notif-${Date.now()}`,
    userId: newUser.id,
    title: 'Account Registered Successfully',
    message: isSuperAdmin 
      ? 'Access approved automatically. Welcome back Admin!' 
      : 'Review in progress. Approved accounts receive comprehensive matching features immediately.',
    type: 'approval',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  // Notify actual super_admin users about pending approval
  db.getUsers().forEach(u => {
    if (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN') {
      db.createNotification({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
        userId: u.id,
        title: 'New Pending Registration',
        message: `${newUser.name} is waiting approval. Resume attached: ${newUser.resumeUrl || 'None'}`,
        type: 'approval',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  });

  res.json({ user: newUser, profile: newProfile });
});

// Update Profile Details
app.put('/api/profile', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { skills, interests, careerGoals, education, experience, socialLinks } = req.body;
  const existingProfile = db.getProfileByUserId(user.id) || {
    userId: user.id,
    skills: [],
    interests: [],
    careerGoals: [],
    education: [],
    experience: [],
    socialLinks: {}
  };

  const updatedProfile: UserProfile = {
    ...existingProfile,
    skills: skills || existingProfile.skills,
    interests: interests || existingProfile.interests,
    careerGoals: careerGoals || existingProfile.careerGoals,
    education: education || existingProfile.education,
    experience: experience || existingProfile.experience,
    socialLinks: socialLinks || existingProfile.socialLinks
  };

  db.saveProfile(updatedProfile);
  res.json({ success: true, profile: updatedProfile });
});

// Admin endpoint: List all users
app.get('/api/admin/users', (req, res) => {
  const user = getCurrentUser(req);
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Forbidden: Requires Admin privilege.' });
  }
  const users = db.getUsers();
  const profiles = db.getProfiles();
  res.json({ users, profiles });
});

// Admin endpoint: Approve/Reject a registered user
app.post('/api/admin/users/:id/status', (req, res) => {
  const adminUser = getCurrentUser(req);
  if (!adminUser || (adminUser.role !== 'SUPER_ADMIN' && adminUser.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const targetUserId = req.params.id;
  const { status } = req.body; // 'APPROVED' or 'REJECTED'

  if (status !== 'APPROVED' && status !== 'REJECTED') {
    return res.status(400).json({ error: 'Invalid selection field' });
  }

  const success = db.updateUser(targetUserId, { status });
  if (!success) {
    return res.status(404).json({ error: 'Target user record not found' });
  }

  // Create real-time dashboard notification trigger
  db.createNotification({
    id: `notif-${Date.now()}`,
    userId: targetUserId,
    title: status === 'APPROVED' ? 'Access Request Approved!' : 'Access Request Update',
    message: status === 'APPROVED'
      ? 'Congratulations! Your profile is verified. Unlock deep recommendations, synchronization pipelines, and AI helper agents!'
      : 'Your enrollment could not be validated at this time. Please contact details support if this is an issue.',
    type: 'approval',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  db.addLog('Administration', `User ${success.name} registration set to: ${status} by ${adminUser.name}`);
  res.json({ success: true, user: success });
});

// ==========================================
// 2. OPPORTUNITIES INFRASTRUCTURE & ENGINE
// ==========================================

// Get list of opportunities (active only, or archived filter)
app.get('/api/opportunities', (req, res) => {
  const user = getCurrentUser(req);
  const { category, search, sort, includeArchived } = req.query;

  let opportunities = includeArchived === 'true' 
    ? [...db.getOpportunities(), ...db.getArchivedOpportunities()]
    : db.getOpportunities();

  // Sort criteria logic
  if (category) {
    opportunities = opportunities.filter(opp => opp.category.toLowerCase() === String(category).toLowerCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    db.registerSearch(q);
    opportunities = opportunities.filter(opp => 
      opp.title.toLowerCase().includes(q) ||
      opp.organization.toLowerCase().includes(q) ||
      opp.description.toLowerCase().includes(q) ||
      opp.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Recommendation engine matching weights if logged in
  if (user && user.status === 'APPROVED') {
    const profile = db.getProfileByUserId(user.id);
    if (profile) {
      opportunities = opportunities.map(opp => {
        const { matchPercent, relevance, priority } = calculateOpportunityMatch(opp, profile);
        return {
          ...opp,
          matchPercentage: matchPercent,
          relevanceScore: relevance,
          priorityScore: priority
        };
      });
    }
  }

  // Sorting
  if (sort === 'deadline') {
    opportunities.sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  } else if (sort === 'relevant' && user && user.status === 'APPROVED') {
    opportunities.sort((a,b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
  } else {
    // default upcoming / newly posted
    opportunities.sort((a,b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
  }

  res.json({ opportunities });
});

// Get detailed opportunity
app.get('/api/opportunities/:id', (req, res) => {
  const opp = db.getOpportunityById(req.params.id);
  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }
  // Register active click counts
  db.registerClick(opp.id, opp.title);
  res.json({ opportunity: opp });
});

// Save bookmark toggle
app.post('/api/opportunities/:id/save', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  db.incrementSaves();
  db.createNotification({
    id: `notif-${Date.now()}`,
    userId: user.id,
    title: 'Opportunity Bookmarked',
    message: `You bookmarked: ${req.body.title || 'selected item'}. Deadlines are monitored in your dashboard.`,
    type: 'opportunity',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true });
});

// Add opportunity manually
app.post('/api/opportunities', (req, res) => {
  const user = getCurrentUser(req);
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { title, organization, description, deadline, category, eligibility, tags, registrationLink } = req.body;
  
  if (!title || !organization || !deadline || !category) {
    return res.status(400).json({ error: 'Missing mandatory variables' });
  }

  const newOpp: Opportunity = {
    id: `opp-${Date.now()}`,
    title,
    organization,
    description,
    deadline: new Date(deadline).toISOString(),
    category,
    eligibility: eligibility || 'Open to all background developers',
    tags: Array.isArray(tags) ? tags : String(tags).split(',').map(s=>s.trim()).filter(Boolean),
    source: 'Manual Custom Ingestion',
    registrationLink: registrationLink || 'https://google.com',
    postedDate: new Date().toISOString()
  };

  db.createOpportunity(newOpp);
  res.json({ success: true, opportunity: newOpp });
});

// Delete/Archive opportunity
app.delete('/api/opportunities/:id', (req, res) => {
  const user = getCurrentUser(req);
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const deleted = db.deleteOpportunity(req.params.id);
  res.json({ success: deleted });
});

// ==========================================
// 3. DAILY AUTOMATIC INGESTION PIPELINE & DISCOVERY LINKS
// ==========================================

// Daily summaries newsletter extraction
app.get('/api/news', (req, res) => {
  res.json({ news: db.getNews() });
});

// Admin trigger manual crawl sync
app.post('/api/admin/ingest', async (req, res) => {
  const user = getCurrentUser(req);
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.addLog('IngestionEngine', 'Triggering scalable Universal Ingestion Engine manually...');
  try {
    const results = await triggerUniversalSystemCrawl();
    
    // Add custom dynamic AI News brief summary
    let summaryAI = "Today's highlights cover outstanding entry-level software development internship doors unlocking at leading tech companies, alongside active community buildathons.";
    const ai = getAIClient();
    if (ai) {
      try {
        const resp = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: "Summarize recent software engineering opportunities, active student hackathons, and certifications. Keep it short (2 sentences)."
        });
        if (resp.text) {
          summaryAI = resp.text.trim();
        }
      } catch (newsErr) {
        db.addLog('AI NewsEngine', 'Heuristics deployed to compile AI News summary.', 'warn');
      }
    }

    const generatedNews: NewsItem = {
      id: `news-${Date.now()}`,
      title: 'Universal Collection Engine Sync Complete',
      summary: `Discovered and ingested new active opportunities across multiple live channels including Google, GitHub, and Internshala.`,
      content: summaryAI,
      category: 'AI News',
      source: 'Tech Ingest Pipeline',
      publishedDate: new Date().toISOString(),
      tags: ['System Sync', 'Crawl Inbound', 'Tech Opportunities']
    };

    db.createNewsItem(generatedNews);

    // Notify all active users of the new intake
    const users = db.getUsers();
    users.forEach(u => {
      db.createNotification({
        id: `notif-ingest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: u.id,
        title: 'New Opportunities Discovered!',
        message: `Synced ${results.rssIngested} RSS and ${results.webIngested} Web openings. Apply directly on your dashboard!`,
        type: 'news',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    });

    res.json({
      success: true,
      addedFeatures: {
        rssCollected: results.rssIngested,
        webCollected: results.webIngested
      },
      newsItem: generatedNews
    });
  } catch (err: any) {
    db.addLog('IngestionEngine', `Manual ingestion failed: ${err.message || err}`, 'error');
    res.status(500).json({ error: 'Sync failed', message: err.message });
  }
});

// Get sources
app.get('/api/admin/sources', (req, res) => {
  res.json({ sources: db.getSources() });
});

// Toggle source availability status
app.put('/api/admin/sources/:id', (req, res) => {
  const user = getCurrentUser(req);
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { isActive } = req.body;
  const updated = db.updateSource(req.params.id, { isActive });
  res.json({ success: true, source: updated });
});

// ==========================================
// 4. SMART EMAIL SYNCHRONIZATION CONNECTOR
// ==========================================
app.post('/api/email/sync', async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { channel } = req.body; // 'gmail', 'outlook', or 'college'
  if (!channel) return res.status(400).json({ error: 'Missing account type' });

  // Mark channel connected
  const connections = user.emailConnected || {};
  connections[channel as 'gmail' | 'outlook' | 'college'] = true;
  db.updateUser(user.id, { emailConnected: connections });

  db.addLog('EmailSync', `Initiating live privacy-centric parsing on connected channel: ${channel.toUpperCase()}`);

  try {
    const synccount = await scanUserConnectedEmails(user.id);
    res.json({ success: true, discoveredCount: synccount });
  } catch (err: any) {
    db.addLog('EmailSync', `Live mailbox parsing failed: ${err.message || err}`, 'error');
    res.status(500).json({ error: 'Mail synchronizer fails' });
  }
});

// ==========================================
// 5. RESUME DISCOVERY PARSER & AI ANALYSIS
// ==========================================
app.post('/api/resume/analyze', async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { resumeText } = req.body;
  if (!resumeText) {
    return res.status(400).json({ error: 'Resume transcript text is required.' });
  }

  db.addLog('ResumeAnalyzer', `Initiating parsing model for uploaded resume files: ${user.name}`);

  let resumeAnalysis = parseResumeLocally(resumeText);
  
  const ai = getAIClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Analyze this student resume text. Extract technical skills, programming languages, education, and projects. Grade the quality out of 100. Provide 3 highly constructive bullet point feedback tips to double their interview success. 
        Return ONLY valid JSON with this exact key-value outline:
        {
          "score": 88,
          "extractedSkills": ["React", "TypeScript", "Node.js"],
          "extractedTech": ["Docker", "Vite", "Express"],
          "programmingLanguages": ["JavaScript", "Python"],
          "extractedEducation": "B.S. Computer Science",
          "extractedProjects": ["AI chatbot application"],
          "improvementSuggestions": ["Tip 1", "Tip 2", "Tip 3"]
        }
        Resume Text:
        ${resumeText}`
      });

      if (response.text) {
        const cleanJSON = response.text.substring(
          response.text.indexOf('{'),
          response.text.lastIndexOf('}') + 1
        );
        resumeAnalysis = JSON.parse(cleanJSON);
      }
    } catch(e) {
      console.warn('Fallback to local analyzer due to OpenAI/Gemini credential defaults.');
    }
  }

  // Update high fidelity structured student profile
  const profile = db.getProfileByUserId(user.id) || {
    userId: user.id,
    skills: [],
    interests: [],
    careerGoals: [],
    education: [],
    experience: [],
    socialLinks: {}
  };

  profile.skills = Array.from(new Set([...profile.skills, ...resumeAnalysis.extractedSkills, ...resumeAnalysis.extractedTech]));
  profile.resumeAnalysis = resumeAnalysis;
  
  // If resume text lists specific school information, add it
  if (resumeAnalysis.extractedEducation && profile.education.length === 0) {
    profile.education.push({
      degree: resumeAnalysis.extractedEducation,
      institution: 'Extracted from Resume transcript',
      graduationYear: '2027'
    });
  }

  db.saveProfile(profile);

  db.createNotification({
    id: `notif-${Date.now()}`,
    userId: user.id,
    title: 'AI Resume Analysis Complete',
    message: `Resume scored at: ${resumeAnalysis.score}/100. Auto-discovered ${resumeAnalysis.extractedSkills.length} tech skills and loaded matching benchmarks!`,
    type: 'system',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, profile, resumeAnalysis });
});

// ==========================================
// 6. AI CONVERSATIONAL CHATBOT CONTEXT
// ==========================================
app.post('/api/ai/chat', async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Query prompt cannot be empty' });

  // Store user prompt in DB
  db.addChatMessage(user.id, 'user', message);

  const profile = db.getProfileByUserId(user.id);
  const activeOpportunities = db.getOpportunities();

  // Synthesize rich system context guidelines
  let systemInstructions = `You are "NIMA-AI", our state-of-the-art Opportunity Intelligence assistant helping young students and early career professionals.
  We curate active internships, bootcamps, masterclasses, and news to bypass checking multiple channels.
  The current time is 2026-06-19.

  Here is details profile context of the user speaking with you:
  Name: ${user.name}
  Role: ${user.role} (Access level: ${user.status})
  Skills: ${profile ? profile.skills.join(', ') : 'None uploaded'}
  Interests: ${profile ? profile.interests.join(', ') : 'None configured'}
  Education: ${profile ? JSON.stringify(profile.education) : 'No school listed'}
  
  Available non-expired database opportunities we can recommend:
  ${JSON.stringify(activeOpportunities.map(o => ({ id: o.id, title: o.title, org: o.organization, cat: o.category, link: o.registrationLink, deadline: o.deadline })))}
  
  If the user asks to recommend or find internships, review their interests/skills, look at the active database above, point out matches by name, and explain why they align! Keep answers structured, highly human, humble, and elegantly brief. Avoid raw JSON or system flags. Bullet points preferred. Use markdown formatting.`;

  let responseText = `Hi ${user.name}! Based on our active systems database, I can recommend:
  - **Google STEP Internship 2026** (SOPHOMORE level) focusing on Software engineering foundations.
  - **Microsoft Imagine Cup** to form team alignment.
  
  Would you like me to analyze your custom resume attachment to increase your target fit score?`;

  const ai = getAIClient();
  if (ai) {
    try {
      // Fetch chatbot messages
      const chatHistory = db.getChats(user.id);
      const sdkContents = chatHistory.slice(-8).map(m => {
        return {
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.message }]
        };
      });

      const resp = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          { role: 'user', parts: [{ text: systemInstructions }] },
          ...sdkContents,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          temperature: 0.7,
        }
      });
      if (resp.text) {
        responseText = resp.text;
      }
    } catch (e) {
      console.error('Gemini chatbot fallback initialized:', e);
      // Construct fallback context response directly
      if (message.toLowerCase().includes('intern')) {
        responseText = `Based on your profile skills (${profile?.skills.join(', ') || 'General SDE'}), the **Google STEP Internship** or **JP Morgan Program** is a brilliant 95% match for you. Feel free to click apply!`;
      } else if (message.toLowerCase().includes('news') || message.toLowerCase().includes('today')) {
        const latestNews = db.getNews()[0];
        responseText = latestNews 
          ? `Here is the top technology update today: **${latestNews.title}**. ${latestNews.summary}`
          : "Today's dynamic technology highlights emphasize steady cloud acceleration networks of 5G models.";
      }
    }
  } else {
    // Elegant hardcoded responses mapped for rich client flow if API key is missing
    if (message.toLowerCase().includes('intern')) {
      const matched = activeOpportunities.filter(o => o.category === 'Internships');
      responseText = `I searched our live intelligence tables. Here are the top internships that match your profile:\n\n` + 
        matched.map(m => ` - **${m.title}** at **${m.organization}**: Ends on ${new Date(m.deadline).toLocaleDateString()}. Tags: ${m.tags.slice(0,3).join(', ')}`).join('\n') + 
        `\n\nClick the "Apply" buttons on the landing cards to open direct application forms!`;
    } else if (message.toLowerCase().includes('hackathon')) {
      const matched = activeOpportunities.filter(o => o.category === 'Hackathons');
      responseText = `Here are active competitive hackathons in our directory:\n\n` +
        matched.map(m => ` - **${m.title}** hosted by **${m.organization}** (Ends: ${new Date(m.deadline).toLocaleDateString()})`).join('\n') +
        `\n\nWould you like to analyze these against your specific team skills?`;
    } else if (message.toLowerCase().includes('resume') || message.toLowerCase().includes('suggest')) {
      responseText = `Based on your analyzed resume (Score: ${profile?.resumeAnalysis?.score || 85}/100), you have standout skills in React and Python. \n\n**To stand out more:**\n1. Project-ize your machine learning models with live interface hosts.\n2. Add metrics like performance optimizations. Let me know if you want me to outline a template.`;
    }
  }

  // Save Assistant answer in database
  db.addChatMessage(user.id, 'assistant', responseText);
  res.json({ text: responseText });
});

app.get('/api/ai/chat/history', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ chats: db.getChats(user.id) });
});

app.delete('/api/ai/chat', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  db.clearChats(user.id);
  res.json({ success: true });
});

// ==========================================
// 7. SYSTEM PERFORMANCE / METRICS / NOTIFICATIONS
// ==========================================

// Get Notifications
app.get('/api/notifications', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ notifications: db.getNotifications(user.id) });
});

// Mark Read notification
app.post('/api/notifications/:id/read', (req, res) => {
  db.markNotificationRead(req.params.id);
  res.json({ success: true });
});

// Get Analytics Summary Metrics & Log lists for Super Admin Dashboard UI
app.get('/api/admin/analytics', (req, res) => {
  const user = getCurrentUser(req);
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  res.json({
    analytics: db.getAnalytics(),
    logs: db.getLogs().slice(0, 50)
  });
});

// ==========================================
// STATIC ASSET SERVING & WILDCARD FALLBACK
// ==========================================
app.use(express.static(path.join(process.cwd(), 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// Background Scheduled Job: Continuous real-time collection updates run every 30 minutes
setInterval(async () => {
  db.addLog('Scheduler', 'Automatic 30-minute background sync started.');
  try {
    const results = await triggerUniversalSystemCrawl();
    db.addLog('Scheduler', `Automatic 30-minute sync completed successfully. RSS: ${results.rssIngested}, Web: ${results.webIngested}`);
  } catch (err: any) {
    db.addLog('Scheduler', `Automatic background sync error: ${err.message || err}`, 'error');
  }
}, 30 * 60 * 1000);

// Start listening — auto-retry next port if busy
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server successfully started. Listening on http://0.0.0.0:${PORT}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    const next = PORT + 1;
    console.warn(`Port ${PORT} in use, retrying on ${next}...`);
    server.close();
    app.listen(next, '0.0.0.0', () => {
      console.log(`Server started on fallback port http://0.0.0.0:${next}`);
      console.warn(`Update vite.config.ts proxy target to http://localhost:${next}`);
    });
  } else {
    throw err;
  }
});

// ==========================================
// LOCAL HELPERS & HEURISTIC ENGINE IMPLEMENTATIONS
// ==========================================

function parseResumeLocally(text: string) {
  const lowercase = text.toLowerCase();
  const skillsList = ['React', 'TypeScript', 'Node.js', 'Python', 'Machine Learning', 'Java', 'Next.js', 'Excel', 'Docker', 'AWS', 'TensorFlow', 'PostgreSQL', 'C++'];
  const matchedSkills = skillsList.filter(s => lowercase.includes(s.toLowerCase()));
  
  const techList = ['Vite', 'Express', 'Tailwind', 'Git', 'Webpack', 'Framer Motion', 'MongoDB', 'Redux', 'Pandas', 'Numpy'];
  const matchedTech = techList.filter(t => lowercase.includes(t.toLowerCase()));

  const progLanguages = ['Python', 'TypeScript', 'JavaScript', 'Java', 'C++', 'SQL', 'C#', 'Go', 'R'];
  const matchedProg = progLanguages.filter(p => lowercase.includes(p.toLowerCase()));

  let deducedEdu = 'Undergraduate Technical Major';
  if (lowercase.includes('stanford')) deducedEdu = 'Computer Science, Stanford University';
  else if (lowercase.includes('mit')) deducedEdu = 'Electrical Engineering, MIT';
  else if (lowercase.includes('iit')) deducedEdu = 'Computer Science & Engineering, IIT';
  else if (lowercase.includes('college') || lowercase.includes('university')) deducedEdu = 'B.S. in Software Engineering';

  // Calculate high fidelity mock score
  const scoreBase = 70 + Math.min(25, (matchedSkills.length * 3) + (matchedTech.length * 2));

  return {
    score: Math.min(98, scoreBase),
    extractedSkills: matchedSkills.length > 0 ? matchedSkills : ['React', 'TypeScript', 'Python'],
    extractedTech: matchedTech.length > 0 ? matchedTech : ['Tailwind CSS', 'Git'],
    programmingLanguages: matchedProg.length > 0 ? matchedProg : ['TypeScript', 'Python'],
    extractedEducation: deducedEdu,
    extractedProjects: ['Personal Development Platform Sandbox', 'High Frequency Sensor Monitor API'],
    improvementSuggestions: [
      'Quantify impact bounds on professional lines (e.g., "sped build configurations up 35% using ESBuild bundles").',
      'Deploy open sources links or host projects directly on portfolio headers so admins can double click review links instantly.',
      'Highlight expertise with cloud hosting platforms like Google Cloud Run or AWS deployments.'
    ]
  };
}

function calculateOpportunityMatch(opp: Opportunity, profile: UserProfile) {
  let matchScore = 50; // base floor
  
  // match by matching tags & categories
  const matches = opp.tags.filter(tag => 
    profile.skills.some(skill => skill.toLowerCase() === tag.toLowerCase()) ||
    profile.interests.some(interest => interest.toLowerCase() === tag.toLowerCase())
  );
  
  matchScore += matches.length * 10;
  
  // slight modifier for category matching user career goals or interests
  const catShortMatch = profile.interests.some(interest => opp.title.toLowerCase().includes(interest.toLowerCase()) || opp.description.toLowerCase().includes(interest.toLowerCase()));
  if (catShortMatch) matchScore += 15;

  const matchPercent = Math.min(99, Math.max(65, matchScore));
  const relevance = matchPercent / 100;
  
  // check deadline proximity to influence priority scoring
  const daysLeft = (new Date(opp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  const priority = +(relevance * 10 - (daysLeft < 7 ? 0.5 : 0)).toFixed(2);

  return {
    matchPercent,
    relevance,
    priority
  };
}
