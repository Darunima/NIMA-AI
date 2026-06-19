import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, Trophy, BookOpen, Terminal, Award, Calendar, Search, 
  MessageSquare, Cpu, Layers, Settings, Activity, ChevronRight, User, 
  Plus, Trash, Check, X, Bell, FileText, Sparkles, RefreshCw, 
  Sliders, Globe, Mail, ArrowUpRight, Lock, Moon, Sun, ShieldAlert,
  SlidersHorizontal, CheckCircle2, AlertTriangle, Send, LogOut, Loader2
} from 'lucide-react';
import { 
  User as UserType, 
  UserProfile, 
  Opportunity, 
  NewsItem, 
  SourceConfig, 
  ChatMessage, 
  Notification, 
  SystemLog, 
  AnalyticsSummary, 
  OpportunityCategory 
} from './types';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Authentication & session state — persisted in localStorage to survive re-renders
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    try { const s = localStorage.getItem('nima_user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try { const s = localStorage.getItem('nima_profile'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [authEmail, setAuthEmail] = useState('');
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    skills: '',
    interests: '',
    resumeText: '',
    fileName: ''
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Active View Tab State
  const [activeTab, setActiveTab] = useState<'explore' | 'dashboard' | 'chat' | 'admin' | 'news'>(() => {
    try { return (localStorage.getItem('nima_tab') as any) || 'explore'; } catch { return 'explore'; }
  });
  const setActiveTabPersisted = (tab: 'explore' | 'dashboard' | 'chat' | 'admin' | 'news') => {
    localStorage.setItem('nima_tab', tab);
    setActiveTab(tab);
  };

  // Ingestion opportunities lists & search filter metrics
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<'upcoming' | 'deadline' | 'relevant'>('upcoming');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('All');
  
  // Custom Resume uploads states
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [manualResumePaste, setManualResumePaste] = useState('');
  const [resumeUploadTab, setResumeUploadTab] = useState<'paste' | 'file'>('paste');
  const resumeFileRef = useRef<HTMLInputElement>(null);

  // AI Conversational Assitant states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  // Admin and crawlers management states
  const [adminUsers, setAdminUsers] = useState<UserType[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<UserProfile[]>([]);
  const [crawlerSources, setCrawlerSources] = useState<SourceConfig[]>([]);
  const [analytics, setAnalytics] = useState<Partial<AnalyticsSummary>>({});
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [isSyncingCrawlers, setIsSyncingCrawlers] = useState(false);

  // Notifications states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Email Syncing trigger variables
  const [isSyncingEmail, setIsSyncingEmail] = useState<Record<string, boolean>>({});

  // Form states for manually feeding opportunities
  const [showAddOppModal, setShowAddOppModal] = useState(false);
  const [newOppData, setNewOppData] = useState({
    title: '',
    organization: '',
    description: '',
    deadline: '',
    category: 'Internships' as OpportunityCategory,
    eligibility: '',
    tags: '',
    registrationLink: ''
  });

  // Ref scroll parameters for chat container
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Custom User Header Session Identifier
  const getSessionHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'x-user-id': currentUser ? currentUser.id : 'user-1'
    };
  };

  // 1. Core Fetch logic — only re-run when currentUser.id changes, not on every render
  const currentUserId = currentUser?.id ?? null;
  useEffect(() => {
    fetchOpportunities();
    fetchNews();
    fetchSources();
    if (currentUser) {
      fetchNotifications();
      fetchChatHistory();
      if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
        fetchAdminDashboardData();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  useEffect(() => {
    // Scroll chats
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/admin/sources');
      const data = await response.json();
      if (data.sources) {
        setCrawlerSources(data.sources);
      }
    } catch (e) {
      console.error('Failed to view synced feeds:', e);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const catParam = selectedCategoryFilter !== 'All' ? `category=${encodeURIComponent(selectedCategoryFilter)}` : '';
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const sortParam = `&sort=${selectedSort}`;
      const url = `/api/opportunities?${catParam}${searchParam}${sortParam}`;
      
      const response = await fetch(url, {
        headers: currentUser ? getSessionHeaders() : { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.opportunities) {
        setOpportunities(data.opportunities);
      }
    } catch (e) {
      console.error('Failed to load opportunities:', e);
    }
  };

  // Quick helper to search automatically as user types
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOpportunities();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCategoryFilter, selectedSort]);

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news');
      const data = await response.json();
      if (data.news) {
        setNews(data.news);
      }
    } catch (e) {
      console.error('Failed to view news briefs:', e);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/notifications', { headers: getSessionHeaders() });
      const data = await response.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadNotificationsCount(data.notifications.filter((n: Notification) => !n.isRead).length);
      }
    } catch (e) {
      console.error('Error fetching system updates:', e);
    }
  };

  const fetchChatHistory = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/ai/chat/history', { headers: getSessionHeaders() });
      const data = await response.json();
      if (data.chats) {
        setChatMessages(data.chats);
      }
    } catch (e) {
      console.error('Failed loading chatbot state:', e);
    }
  };

  const fetchAdminDashboardData = async () => {
    try {
      const analyticsRes = await fetch('/api/admin/analytics', { headers: getSessionHeaders() });
      const analyticsData = await analyticsRes.json();
      if (analyticsData.analytics) {
        setAnalytics(analyticsData.analytics);
      }
      if (analyticsData.logs) {
        setSystemLogs(analyticsData.logs);
      }

      const usersRes = await fetch('/api/admin/users', { headers: getSessionHeaders() });
      const usersData = await usersRes.json();
      if (usersData.users) {
        setAdminUsers(usersData.users);
        setAdminProfiles(usersData.profiles);
      }

      const sourcesRes = await fetch('/api/admin/sources', { headers: getSessionHeaders() });
      const sourcesData = await sourcesRes.json();
      if (sourcesData.sources) {
        setCrawlerSources(sourcesData.sources);
      }
    } catch (e) {
      console.error('Failed loading admin telemetry blocks:', e);
    }
  };

  // 2. Auth Flow Trigger Actions
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail })
      });
      const data = await response.json();
      if (data.user) {
        setCurrentUser(data.user);
        setUserProfile(data.profile);
        setShowAuthModal(false);
      }
    } catch (e) {
      console.error('Authentication process failed:', e);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.email || !registerForm.name) return;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      if (data.user) {
        setCurrentUser(data.user);
        setUserProfile(data.profile);
        setShowAuthModal(false);
        setRegisterForm({ name: '', email: '', skills: '', interests: '', resumeText: '', fileName: '' });
      }
    } catch (e) {
      console.error('Failed registering new account:', e);
    }
  };

  // Persist session to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) localStorage.setItem('nima_user', JSON.stringify(currentUser));
    else localStorage.removeItem('nima_user');
  }, [currentUser]);

  useEffect(() => {
    if (userProfile) localStorage.setItem('nima_profile', JSON.stringify(userProfile));
    else localStorage.removeItem('nima_profile');
  }, [userProfile]);

  const handleLogout = () => {
    setCurrentUser(null);
    setUserProfile(null);
    setChatMessages([]);
    localStorage.removeItem('nima_user');
    localStorage.removeItem('nima_profile');
    localStorage.removeItem('nima_tab');
    setActiveTab('explore');
  };

  // 3. Admin Workflow handlers
  const handleToggleUserStatus = async (targetUserId: string, nextStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/admin/users/${targetUserId}/status`, {
        method: 'POST',
        headers: getSessionHeaders(),
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.ok) {
        fetchAdminDashboardData();
        fetchOpportunities();
      }
    } catch (e) {
      console.error('Error toggle status:', e);
    }
  };

  const handleSyncCrawlersNow = async () => {
    setIsSyncingCrawlers(true);
    try {
      const response = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers: getSessionHeaders()
      });
      if (response.ok) {
        await fetchOpportunities();
        await fetchNews();
        await fetchAdminDashboardData();
      }
    } catch (e) {
      console.error('Sync process error:', e);
    } finally {
      setIsSyncingCrawlers(false);
    }
  };

  const handleToggleSourceActive = async (sourceId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/sources/${sourceId}`, {
        method: 'PUT',
        headers: getSessionHeaders(),
        body: JSON.stringify({ isActive: !currentActive })
      });
      if (response.ok) {
        fetchAdminDashboardData();
      }
    } catch (e) {
      console.error('Source config save error:', e);
    }
  };

  const handleAddCustomOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: getSessionHeaders(),
        body: JSON.stringify(newOppData)
      });
      if (response.ok) {
        setShowAddOppModal(false);
        setNewOppData({
          title: '',
          organization: '',
          description: '',
          deadline: '',
          category: 'Internships',
          eligibility: '',
          tags: '',
          registrationLink: ''
        });
        fetchOpportunities();
        fetchAdminDashboardData();
      }
    } catch (e) {
      console.error('Submission of opportunity error:', e);
    }
  };

  const handleDeleteOpportunity = async (id: string) => {
    if (!window.confirm('Delete this from opportunities directory?')) return;
    try {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'DELETE',
        headers: getSessionHeaders()
      });
      if (response.ok) {
        fetchOpportunities();
        fetchAdminDashboardData();
      }
    } catch (e) {
      console.error('Error removing opportunity:', e);
    }
  };

  // 4. Student Workflow Triggers
  const handleBookmarkToggle = async (opp: Opportunity) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    // Simple state indicator
    try {
      const response = await fetch(`/api/opportunities/${opp.id}/save`, {
        method: 'POST',
        headers: getSessionHeaders(),
        body: JSON.stringify({ title: opp.title })
      });
      if (response.ok) {
        fetchNotifications();
        alert(`Successfully bookmarked: ${opp.title}. You can track deadline alerts in your Personal Dashboard.`);
      }
    } catch (e) {
      console.error('Failed saving bookmark toggle:', e);
    }
  };

  const handleApplyClick = (opp: Opportunity) => {
    const rawUrl = (opp.registrationLink || opp.registration_link || '').trim();
    const searchFallback = `https://www.google.com/search?q=${encodeURIComponent(opp.title + ' ' + opp.organization + ' apply')}`;

    let targetUrl = searchFallback;
    if (rawUrl) {
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
        targetUrl = rawUrl;
      } else {
        targetUrl = `https://${rawUrl}`;
      }
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    fetch(`/api/opportunities/${opp.id}`, { headers: currentUser ? getSessionHeaders() : undefined }).catch(() => {});
  };

  // 5. Resume analyzer — accepts text or file
  const handleAnalyzeResumeOnline = async (textOverride?: string) => {
    if (!currentUser) { setShowAuthModal(true); return; }
    const resumeText = textOverride ?? manualResumePaste;
    if (!resumeText.trim()) {
      alert('Please paste resume text or upload a file first.');
      return;
    }
    setIsAnalyzingResume(true);
    try {
      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: getSessionHeaders(),
        body: JSON.stringify({ resumeText })
      });
      const data = await response.json();
      if (data.profile) {
        setUserProfile(data.profile);
        setManualResumePaste('');
        fetchOpportunities();
      }
    } catch (e) {
      console.error('Error analyzing resume:', e);
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  const handleResumeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setManualResumePaste(text);
      handleAnalyzeResumeOnline(text);
    };
    reader.readAsText(file);
  };

  // 6. Conversational AI Chat Helper Agent
  const handleSendChatPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentPrompt.trim()) return;
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const userMessage = currentPrompt;
    setCurrentPrompt('');
    setIsChatSending(true);

    // optimistic local push
    setChatMessages(prev => [
      ...prev, 
      { id: `user-temp-${Date.now()}`, userId: currentUser.id, sender: 'user', message: userMessage, timestamp: new Date().toISOString() }
    ]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: getSessionHeaders(),
        body: JSON.stringify({ message: userMessage })
      });
      const data = await response.json();
      if (data.text) {
        fetchChatHistory();
      }
    } catch (e) {
      console.error('Assistant response generation error:', e);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleClearChatHistory = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'DELETE',
        headers: getSessionHeaders()
      });
      if (response.ok) {
        setChatMessages([]);
      }
    } catch (e) {
      console.error('Failing clearing chatbot chat log:', e);
    }
  };

  const handleMarkNoticeRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: getSessionHeaders()
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error('Notification click mark read error:', e);
    }
  };

  const triggerEmailSyncSimulation = async (channel: 'gmail' | 'outlook' | 'college') => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setIsSyncingEmail(prev => ({ ...prev, [channel]: true }));
    try {
      const response = await fetch('/api/email/sync', {
        method: 'POST',
        headers: getSessionHeaders(),
        body: JSON.stringify({ channel })
      });
      if (response.ok) {
        const data = await response.json();
        alert(`OAuth verification passed! Synchronizing your custom personal feed with ${data.discoveredCount} non-expired hidden opportunities.`);
        // Reload opportunity list & session notifications update
        fetchOpportunities();
        fetchNotifications();
        // Fetch session
        const sessRes = await fetch('/api/auth/session', { headers: getSessionHeaders() });
        const sessData = await sessRes.json();
        if (sessData.user) {
          setCurrentUser(sessData.user);
        }
      }
    } catch (e) {
      console.error('Inbox connection error:', e);
    } finally {
      setIsSyncingEmail(prev => ({ ...prev, [channel]: false }));
    }
  };

  // Categories helper arrays
  const CATEGORIES = [
    { name: 'Internships', emoji: '💼', color: 'from-blue-500 to-indigo-600', description: 'Curated roles for student developers' },
    { name: 'Hackathons', emoji: '🏆', color: 'from-purple-500 to-pink-600', description: 'Realtime design code challenges' },
    { name: 'Workshops', emoji: '🎓', color: 'from-emerald-500 to-teal-600', description: 'Live expert masterclasses' },
    { name: 'Bootcamps', emoji: '🚀', color: 'from-orange-500 to-red-600', description: 'Immersive coding bootcamps' },
    { name: 'Certifications', emoji: '📜', color: 'from-violet-500 to-fuchsia-600', description: 'Industry technical validations' },
    { name: 'Tech Events', emoji: '💻', color: 'from-cyan-500 to-blue-600', description: 'Conferences & company career streams' },
    { name: 'Research Programs', emoji: '🔬', color: 'from-rose-500 to-pink-600', description: 'National and global scientific grants' },
    { name: 'Fellowships', emoji: '🌍', color: 'from-yellow-500 to-amber-600', description: 'Open-source stipend contributors' },
    { name: 'AI News', emoji: '🤖', color: 'from-purple-600 to-indigo-700', description: 'Daily model and align report developments' },
    { name: 'Technology News', emoji: '📰', color: 'from-neutral-600 to-neutral-800', description: 'General hardware and SaaS breakthroughs' }
  ];

  return (
    <div id="ai-container" className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* HEADER SECTION */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${isDarkMode ? 'bg-slate-950/80 border-slate-800/80' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setActiveTab('explore'); setSelectedCategoryFilter('All'); }}>
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
              <Cpu className="h-6 w-6 stroke-[2]" id="app-logo-icon" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">NIMA-AI</span>
              <span className="block text-[9.5px] uppercase tracking-widest text-indigo-400/90 font-bold font-mono">Opportunity Intelligence</span>
            </div>
          </div>

          {/* Core navigation tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button 
              onClick={() => { setActiveTab('explore'); setSelectedCategoryFilter('All'); }}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'explore' ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'}`}
              id="nav-tab-explore"
            >
              Explore Feed
            </button>
            
            {currentUser && (
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'}`}
                id="nav-tab-dashboard"
              >
                Personal Dashboard
              </button>
            )}

            <button 
              onClick={() => setActiveTab('news')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'news' ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'}`}
              id="nav-tab-news"
            >
              Tech Ingestion AI News
            </button>

            <button 
              onClick={() => setActiveTab('chat')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${activeTab === 'chat' ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'}`}
              id="nav-tab-chat"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Chatbot</span>
            </button>

            {currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
              <button 
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1 text-pink-400/90 hover:bg-pink-500/5 ${activeTab === 'admin' ? 'bg-pink-500/10 text-pink-400 font-bold' : ''}`}
                id="nav-tab-admin"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Admin Console</span>
              </button>
            )}
          </nav>

          {/* Action Header right elements (Session login, status, dark mode trigger, notifications dropdown) */}
          <div className="flex items-center space-x-3">
            
            {/* Dark Mode toggle button */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`p-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 text-yellow-500 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-black'}`}
              title="Toggle theme mode"
              id="btn-toggle-theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notifications Alert Dropdown */}
            {currentUser && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className={`p-2 rounded-lg border relative transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}
                  id="btn-notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-pink-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold animate-pulse">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {showNotificationsDropdown && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl overflow-hidden shadow-2xl border z-50 transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
                    <div className="p-3 border-b flex items-center justify-between bg-slate-950/45">
                      <span className="font-semibold text-xs tracking-wide uppercase">System Updates ({unreadNotificationsCount} unread)</span>
                      <button onClick={() => setShowNotificationsDropdown(false)} className="text-slate-400 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">No recent announcements</div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={() => { handleMarkNoticeRead(notif.id); }}
                            className={`p-3 text-xs leading-relaxed transition-colors cursor-pointer ${notif.isRead ? 'opacity-60 hover:opacity-100' : 'bg-indigo-600/5 font-semibold hover:bg-indigo-600/10'}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="capitalize text-indigo-400 font-bold block">{notif.type} notice</span>
                              {!notif.isRead && <span className="h-1.5 w-1.5 rounded-full bg-pink-500 inline-block"></span>}
                            </div>
                            <h4 className="text-slate-200 font-medium">{notif.title}</h4>
                            <p className="text-slate-400 text-[11px] mt-0.5">{notif.message}</p>
                            <span className="text-[9px] text-slate-500 font-mono mt-1 block">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Session profile action button */}
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <div 
                  className="hidden xl:flex flex-col items-end cursor-pointer" 
                  onClick={() => { if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') { setActiveTab('admin'); } else { setActiveTab('dashboard'); } }}
                >
                  <span className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                    <span>{currentUser.name}</span>
                    {currentUser.role === 'SUPER_ADMIN' && <span className="px-1 text-[8px] bg-pink-500 rounded text-white uppercase font-mono tracking-widest leading-3 font-semibold ml-1">Super Admin</span>}
                  </span>
                  <span className="text-[10px] text-slate-400">{currentUser.email}</span>
                </div>
                
                <button 
                  onClick={handleLogout}
                  className={`p-2 rounded-lg border transition-colors flex items-center space-x-1 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-black'}`}
                  title="Logout"
                  id="btn-logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setIsRegistering(false); setShowAuthModal(true); }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
                id="btn-signin-header"
              >
                Sign In / Sign Up
              </button>
            )}
          </div>
        </div>
      </header>

      {/* COMPREHENSIVE SUB NAVIGATION ON MOBILE (TABS ONLY) */}
      <div className="md:hidden flex px-4 border-b border-slate-800 h-11 space-x-1 items-center overflow-x-auto bg-slate-950/50">
        <button 
          onClick={() => { setActiveTab('explore'); setSelectedCategoryFilter('All'); }}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${activeTab === 'explore' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
        >
          Explore
        </button>
        {currentUser && (
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
          >
            Dashboard
          </button>
        )}
        <button 
          onClick={() => setActiveTab('news')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${activeTab === 'news' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
        >
          AI Highlights
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${activeTab === 'chat' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
        >
          AI Chat Bot
        </button>
        {currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
          <button 
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap bg-pink-500/10 text-pink-400 ${activeTab === 'admin' ? 'bg-pink-500 text-white' : ''}`}
          >
            Admin Console
          </button>
        )}
      </div>

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW 1: LANDING & EXPLORE FEED */}
        {activeTab === 'explore' && (
          <div>
            
            {/* HERO SECTION DESIGN */}
            {searchQuery === '' && selectedCategoryFilter === 'All' && (
              <div className="relative rounded-3xl overflow-hidden mb-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/10 shadow-3xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)] pointer-events-none"></div>
                <div className="absolute top-0 right-0 p-8 text-slate-500/20 pointer-events-none font-mono text-[9px] uppercase hidden lg:block tracking-widest leading-relaxed">
                  SYSTEM STATUS: LIVE CRAWL PORTALS SYNCED<br />
                  NODE_ID: NIMA_AI_PRODUCTION<br />
                  LAST_INGEST: 2026-06-19
                </div>
                
                <div className="max-w-4xl px-8 py-14 sm:py-16 md:px-12 text-left relative z-10">
                  <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-6 animate-pulse">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Next-Gen Opportunity Intelligence Stream</span>
                  </div>
                  
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-5">
                    Your Gateway to Top <span className="bg-gradient-to-r from-indigo-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">Tech Milestones</span>
                  </h1>
                  
                  <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-light mb-8 leading-relaxed">
                    Say goodbye to monitoring 50+ portals. NIMA-AI aggregates internships, hackathons, open-source fellowships, and AI newsletters into a single intelligence platform. Sync your inbox to map opportunities instantly.
                  </p>

                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    {!currentUser ? (
                      <button 
                        onClick={() => { setIsRegistering(true); setShowAuthModal(true); }}
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all text-center"
                      >
                        Register with Resume to Start Match %
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setActiveTab('dashboard'); }}
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all text-center flex items-center justify-center space-x-2"
                      >
                        <User className="h-4 w-4" />
                        <span>Go to My Personalized Workspace</span>
                      </button>
                    )}
                    <button 
                      onClick={() => { setActiveTab('chat'); }}
                      className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-sm border border-slate-700/80 transition-all text-center flex items-center justify-center space-x-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Ask AI Assistant Anything</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PLATFORM STATISTICS ROW */}
            {searchQuery === '' && selectedCategoryFilter === 'All' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14" id="stat-grid-row">
                <div className={`p-5 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Curated Connections</span>
                    <Layers className="h-4 w-4 text-indigo-400" />
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight">21+ Sources</h3>
                  <p className="text-slate-400 text-xs mt-1">Synced with Google, Microsoft, OpenAI, HARMAN, Devpost, MLH, and more</p>
                </div>

                <div className={`p-5 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Active Streams</span>
                    <Activity className="h-4 w-4 text-emerald-400" />
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight">24/7 Crawler</h3>
                  <p className="text-slate-400 text-xs mt-1">Deduplicates, tags, and syncs RSS newsletters every 30 minutes</p>
                </div>

                <div className={`p-5 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-widest font-mono">AI Matching Agent</span>
                    <Cpu className="h-4 w-4 text-purple-400" />
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight">Resume Matcher</h3>
                  <p className="text-slate-400 text-xs mt-1">Autodiscovers skills from transcripts and ranks positions instantly by % match</p>
                </div>

                <div className={`p-5 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest font-mono">Verification Rate</span>
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight">Approved Only</h3>
                  <p className="text-slate-400 text-xs mt-1">Guarantees zero tech spam or stale expired links in the feed</p>
                </div>
              </div>
            )}

            {/* SEPARATED CATEGORY GRID */}
            {searchQuery === '' && selectedCategoryFilter === 'All' && (
              <div className="mb-14">
                <div className="flex items-baseline justify-between mb-6">
                  <h2 className="text-2xl font-black tracking-tight" id="header-categories">Browse Core Platforms & Fields</h2>
                  <span className="text-xs text-indigo-400 font-bold font-mono">10 Curated Directories Available</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {CATEGORIES.map(cat => (
                    <div 
                      key={cat.name}
                      onClick={() => { setSelectedCategoryFilter(cat.name); }}
                      className={`group p-5 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.02] hover:-translate-y-1 ${isDarkMode ? 'bg-slate-900/50 border-slate-800 hover:border-indigo-500/30 hover:bg-slate-900' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}
                    >
                      <div className="h-10 w-10 rounded-xl bg-slate-950 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                        {cat.emoji}
                      </div>
                      <h3 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">{cat.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-1 lines-clamp-2 leading-relaxed">{cat.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MAIN CORE FEED CONTAINER WITH DISCOVERY CONTROLS */}
            <div className="border-t border-slate-800/40 pt-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-8">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Discovery Intelligence Feed</h2>
                  <p className="text-slate-400 text-sm mt-1">Real-time indexed student roles, hackathons, and certifications</p>
                </div>

                {/* SEARCH AND CAPABILITY SELECTS BAR */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 max-w-xl w-full">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search Google, Remote, AI, SDE..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500/50' : 'bg-slate-100 border-slate-200 text-slate-900 focus:border-indigo-600/50'}`}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <select 
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value as any)}
                    className={`px-3 py-2.5 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-indigo-500/40 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}
                  >
                    <option value="upcoming">Sort: Recently Posted</option>
                    <option value="deadline">Sort: Closest Deadline First</option>
                    {currentUser && <option value="relevant">Sort: Best Match Percentage</option>}
                  </select>
                </div>
              </div>

              {/* HORIZONTAL CATEGORY CHIPS SCROLLER */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-4 mb-8 border-b border-slate-800/40">
                <button 
                  onClick={() => setSelectedCategoryFilter('All')} 
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${selectedCategoryFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
                >
                  🌐 Show All Opportunities
                </button>
                {CATEGORIES.map(c => (
                  <button 
                    key={c.name} 
                    onClick={() => setSelectedCategoryFilter(c.name)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center space-x-1.5 border transition-all ${selectedCategoryFilter === c.name ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900'}`}
                  >
                    <span>{c.emoji}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>

              {/* RENDER LISTINGS CARDS & CONNECTED FEEDS STATUS CENTER SPLIT */}
              {(() => {
                const filteredOpportunities = opportunities.filter(opp => {
                  if (selectedSourceFilter === 'All') return true;
                  return opp.source === selectedSourceFilter;
                });

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    {/* LEFT CONTAINER: INDEXED LISTINGS */}
                    <div className="lg:col-span-3">
                      {filteredOpportunities.length === 0 ? (
                        <div className={`p-12 rounded-3xl border text-center ${isDarkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <AlertTriangle className="h-8 w-8 text-indigo-400 mx-auto mb-3" />
                          <h3 className="text-lg font-bold">No Match found in current Stream</h3>
                          <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">Adjust registration keywords or trigger the administrator crawl ingest on the header to scrape live portals.</p>
                          {selectedSourceFilter !== 'All' && (
                            <button 
                              onClick={() => setSelectedSourceFilter('All')}
                              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all active:scale-95 shadow-md"
                            >
                              Show All Channels & Feeds
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="opportunities-listing-grid">
                          {filteredOpportunities.map(opp => (
                            <div 
                              key={opp.id} 
                              className={`p-6 rounded-2xl border flex flex-col justify-between transition-all hover:border-indigo-500/20 hover:scale-[1.01] ${isDarkMode ? 'bg-slate-900/45 border-slate-800/90' : 'bg-white border-slate-200 shadow-sm'}`}
                            >
                              <div>
                                {/* Upper Card Metadata */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-mono tracking-wider font-bold bg-slate-850 border border-slate-700/80 text-indigo-400">
                                      {opp.category}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono font-bold">via {opp.source.replace(' Feed', '').replace(' RSS', '')}</span>
                                  </div>

                                  {/* Match % Badge Ring - Premium Feature */}
                                  {currentUser ? (
                                    currentUser.status === 'APPROVED' ? (
                                      opp.matchPercentage && (
                                        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold animate-pulse">
                                          <Sparkles className="h-3 w-3" />
                                          <span>{opp.matchPercentage}% Match</span>
                                        </div>
                                      )
                                    ) : (
                                      <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-pink-500/15 border border-pink-500/20 text-pink-400 text-xs font-bold" title="Review is in progress">
                                        <Lock className="h-2.5 w-2.5" />
                                        <span>Pending Approval</span>
                                      </div>
                                    )
                                  ) : (
                                    <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 text-xs font-bold" title="Unlock tracking alignment">
                                      <Lock className="h-2.5 w-2.5" />
                                      <span>Login to view fit</span>
                                    </div>
                                  )}
                                </div>

                                {/* Title & Org */}
                                <h3 className="text-xl font-bold tracking-tight text-white mb-1 leading-tight group-hover:text-indigo-400">{opp.title}</h3>
                                <p className="text-indigo-400 font-bold text-sm mb-4">{opp.organization}</p>
                                
                                {/* Summary description */}
                                <p className={`text-xs leading-relaxed mb-4 line-clamp-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{opp.description}</p>
                                
                                {/* Eligibility line */}
                                <div className="mb-4 bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-lg text-[11px] leading-relaxed flex items-start space-x-1.5 text-slate-400">
                                  <Award className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
                                  <span><strong>Eligibility:</strong> {opp.eligibility}</span>
                                </div>

                                {/* Tags list */}
                                <div className="flex flex-wrap gap-1.5 mb-6">
                                  {opp.tags.map(tag => (
                                    <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Bottom row actions (deadline indicators, edit logs, bookmark triggers & direct application launch) */}
                              <div className="border-t border-slate-800/60 pt-4 flex items-center justify-between">
                                <div className="flex items-center space-x-1 text-slate-400 text-xs">
                                  <Calendar className="h-3.5 w-3.5 text-pink-500" />
                                  <span>Deadline: {new Date(opp.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={() => handleBookmarkToggle(opp)}
                                    className={`p-2 rounded-xl border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}
                                    title="Save to dashboard"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                  
                                  <button 
                                    onClick={() => handleApplyClick(opp)}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1 transition-all"
                                  >
                                    <span>Apply</span>
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                  </button>

                                  {currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
                                    <button 
                                      onClick={() => handleDeleteOpportunity(opp.id)}
                                      className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500 hover:text-white transition-all ml-1"
                                      title="Delete opportunity"
                                    >
                                      <Trash className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RIGHT CONTAINER: INTERACTIVE CONNECTIONS & SYNCHRONIZED FEEDS */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800/80 shadow-2xl' : 'bg-white border-slate-200 shadow-lg'}`}>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-850 mb-4">
                          <div className="flex items-center space-x-2">
                            <Layers className="h-4 w-4 text-indigo-400 shrink-0" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Intelligence Channels</h3>
                          </div>
                          {selectedSourceFilter !== 'All' && (
                            <button 
                              onClick={() => setSelectedSourceFilter('All')} 
                              className="text-[9.5px] text-indigo-400 hover:text-indigo-300 font-bold font-mono transition-colors"
                            >
                              Show All
                            </button>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                          Click on any synchronized connector pipeline below to filter listings instantly to that channel's direct crawl updates:
                        </p>

                        <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                          {/* All Sources Card */}
                          <div 
                            onClick={() => setSelectedSourceFilter('All')}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between group ${selectedSourceFilter === 'All' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-950/40 hover:bg-slate-900/40 border-slate-850'}`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <Globe className="h-3.5 w-3.5 text-indigo-400" />
                              <span className="text-xs font-bold text-slate-200">All Connected Streams</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[9.5px] bg-slate-800 text-indigo-300 font-bold font-mono">
                              {opportunities.length}
                            </span>
                          </div>

                          {/* Dynamic Crawler Sources list */}
                          {crawlerSources.map(src => {
                            const count = opportunities.filter(o => o.source === src.name).length;
                            const isSelected = selectedSourceFilter === src.name;
                            const isNewSource = ['Hack2Skill', 'Knowafest', 'Internshala'].some(keyword => src.name.includes(keyword));

                            return (
                              <div 
                                key={src.id}
                                onClick={() => { if (src.isActive) setSelectedSourceFilter(src.name); }}
                                className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col space-y-1.5 group ${!src.isActive ? 'opacity-40 cursor-not-allowed' : ''} ${isSelected ? 'bg-indigo-600/15 border-indigo-500' : 'bg-slate-950/40 hover:bg-slate-900/40 border-slate-850'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 truncate max-w-[85%]">
                                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${src.isActive ? 'bg-emerald-500 shadow-sm shadow-emerald-400' : 'bg-red-500'}`}></span>
                                    <span className="text-[11px] font-bold text-slate-200 truncate group-hover:text-indigo-400 transition-colors leading-none" title={src.name}>
                                      {src.name}
                                    </span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold font-mono ${count > 0 ? 'bg-slate-800 text-slate-300' : 'bg-slate-900 text-slate-600'}`}>
                                    {count}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[9px] text-slate-500">
                                  <span className="font-mono uppercase tracking-widest">{src.type} sync</span>
                                  {isNewSource && (
                                    <span className="px-1 py-0.1 text-[8px] bg-indigo-500/20 text-indigo-400 rounded uppercase font-extrabold tracking-widest leading-3 font-mono">New</span>
                                  )}
                                  <span className="truncate max-w-[60%]">
                                    {new Date(src.lastSynched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Manual Refresh Actions Widget */}
                      <button 
                        onClick={handleSyncCrawlersNow}
                        disabled={isSyncingCrawlers}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 ${isSyncingCrawlers ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-indigo-500/10 hover:border-indigo-500/20 active:scale-95'}`}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${isSyncingCrawlers ? 'animate-spin' : ''}`} />
                        <span>{isSyncingCrawlers ? 'Syncing Opportunity Pipes...' : 'Sync Connected Crawlers Now'}</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* PLATFORM TESTIMONIALS SECTION */}
            {searchQuery === '' && selectedCategoryFilter === 'All' && (
              <div className="mt-16 pt-12 border-t border-slate-800/60">
                <div className="text-center max-w-xl mx-auto mb-10">
                  <h2 className="text-2xl font-black">Success Stories across top Tech</h2>
                  <p className="text-xs text-slate-400 mt-1">NIMA-AI is trusted by students striving to launch careers at FAANG and beyond</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/30 border-slate-800/80' : 'bg-white'}`}>
                    <p className="text-xs text-slate-300 italic">"I synced my college mailbox, and NIMA-AI immediately flagged a Google hackathon deadline. Our team won first place and received direct preplacement interview loops!"</p>
                    <div className="mt-4 flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs">A</div>
                      <div>
                        <h4 className="text-xs font-bold">Arun Devaraj</h4>
                        <span className="text-[10px] text-slate-400 block">SDE Apprentice - Stanford University</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/30 border-slate-800/80' : 'bg-white'}`}>
                    <p className="text-xs text-slate-300 italic">"The AI Resume Analyzer is outstanding. It suggested adding quantifiable metrics and accurately parsed my computer vision experience, boosting my match to 96%!"</p>
                    <div className="mt-4 flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs font-bold text-xs">M</div>
                      <div>
                        <h4 className="text-xs font-bold">Meera Nair</h4>
                        <span className="text-[10px] text-slate-400 block">AI Researcher - IIT Delhi</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/30 border-slate-800/80' : 'bg-white'}`}>
                    <p className="text-xs text-slate-300 italic">"Instead of checking Unstop, Internshala, and Devpost daily, NIMA handles everything in an automated digest. It is easily the best tech tracker out there!"</p>
                    <div className="mt-4 flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs">P</div>
                      <div>
                        <h4 className="text-xs font-bold">Pranav Garg</h4>
                        <span className="text-[10px] text-slate-400 block">Full Stack Fellow - Unstop Creator</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: AI-NEWS HIGHLIGHTS & TECHNOLOGY NEWS ITEMS */}
        {activeTab === 'news' && (
          <div>
            <div className="text-left max-w-2xl mb-8">
              <h2 className="text-3xl font-black tracking-tight flex items-center space-x-2">
                <Globe className="h-8 w-8 text-indigo-400" />
                <span>Today\'s Ingestion Highlights</span>
              </h2>
              <p className="text-slate-400 text-sm mt-1">Structured AI summaries of models, breakthroughs, and enterprise campus updates scraped in real-time.</p>
            </div>

            {/* Newsletter Grid sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Daily summarizer banners */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/40 via-purple-950/20 to-slate-900 border border-indigo-500/20 shadow-xl">
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                    <span className="text-indigo-400 font-mono text-xs uppercase font-extrabold tracking-widest block">Today\'s AI Highlights</span>
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-white">Multimodal Alignment & Frontier Networks</h3>
                  <p className="text-xs leading-relaxed text-slate-300 mb-4">
                    Large language models continue scaling rapidly. DeepMind and Anthropic releases confirm 95%+ success bounds on multi-variable mathematics, structural DNA docking patterns, and live, interactive video processing streams. These advances are quickly finding deep system optimizations inside enterprise server pipelines.
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">Last updated today via automatic AI summarizer engine</span>
                </div>

                <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-900/30 to-slate-900 border border-emerald-500/10 shadow-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Terminal className="h-4.5 w-4.5 text-emerald-400" />
                    <span className="text-emerald-400 font-mono text-xs uppercase font-extrabold tracking-widest block">Today\'s Technology Highlights</span>
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-white">GPU Semiconductor Scale Production & Liquid Cooling</h3>
                  <p className="text-xs leading-relaxed text-slate-300 mb-4">
                    NVIDIA Blackwood B300 infrastructure enters mass shipment. Scaled cloud computing arrays are adopting co-designed thermal liquid heat exchange configurations, allowing massive AI model inference operations to operate on high efficiency bounds. SDE requirements are highly aligning with high-throughput cloud cluster architectures.
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">Synced from NVIDIA developer portal</span>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <h3 className="text-lg font-bold mb-4">Scraped Industry Updates</h3>
                  <div className="space-y-4">
                    {news.map(item => (
                      <div key={item.id} className="p-5 rounded-xl border border-slate-800 bg-slate-900/20">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.category === 'AI News' ? 'bg-purple-500/10 text-purple-400' : 'bg-neutral-800 text-neutral-300'}`}>
                            {item.category}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(item.publishedDate).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-base font-bold text-white mb-1.5">{item.title}</h4>
                        <p className="text-xs text-slate-300 mb-3">{item.summary}</p>
                        <p className="text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/40">{item.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar: active ingestion crawl sources configured */}
              <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/20 h-fit">
                <h3 className="font-bold text-sm tracking-wide uppercase text-indigo-400 mb-4">Active Discovery Connectors</h3>
                <div className="space-y-3.5">
                  {CATEGORIES.slice(0, 8).map(cat => (
                    <div key={cat.name} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/30 border border-slate-800/50">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{cat.emoji}</span>
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">{cat.name}</span>
                          <span className="text-[9.5px] text-slate-500">Scheduled checks 30m</span>
                        </div>
                      </div>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Operational"></span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 text-left font-mono">Status: Connected (21 feeds)</span>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 3: PERSONAL DASHBOARD WORKSPACE OR SUBMISSION PROFILE MAP */}
        {activeTab === 'dashboard' && currentUser && (
          <div>
            
            {/* Upper Grid Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 mb-8 border-b border-slate-800">
              <div>
                <h2 className="text-3.5xl font-black tracking-tight" id="dash-welcome">My Career Workspace</h2>
                <p className="text-slate-400 text-sm mt-1">Analyze customized matches, track synced mail outputs, and configure OAuth linkages</p>
              </div>

              {currentUser.status === 'PENDING' && (
                <div className="mt-4 md:mt-0 flex items-center space-x-2.5 px-4 mb-2 py-3 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl max-w-md">
                  <ShieldAlert className="h-5 w-5 shrink-0" />
                  <p className="text-xs leading-relaxed">
                    <strong>Enrollment review in progress.</strong> Registered resume is synced for authentication. Approved status unlocks comprehensive match engines and custom filters.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left hand side: Skills profiling / Auto Resume Analyzer Card */}
              <div className="space-y-6">
                
                {/* Score Tracker visualization if parsed */}
                {userProfile?.resumeAnalysis ? (
                  <div className="p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-tr from-slate-900 via-indigo-950/20 to-slate-900">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm tracking-wide uppercase text-indigo-400">AI Resume & ATS Score</h3>
                      <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
                    </div>

                    {/* ATS Score ring */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className={`h-16 w-16 rounded-full border-4 flex items-center justify-center bg-slate-950 ${
                        userProfile.resumeAnalysis.score >= 85 ? 'border-emerald-500' :
                        userProfile.resumeAnalysis.score >= 65 ? 'border-yellow-500' : 'border-red-500'
                      }`}>
                        <span className="text-xl font-black text-white">{userProfile.resumeAnalysis.score}</span>
                      </div>
                      <div>
                        <span className={`text-xs block font-bold ${
                          userProfile.resumeAnalysis.score >= 85 ? 'text-emerald-400' :
                          userProfile.resumeAnalysis.score >= 65 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {userProfile.resumeAnalysis.score >= 85 ? 'ATS: Strong Pass ✓' :
                           userProfile.resumeAnalysis.score >= 65 ? 'ATS: Moderate — Improve' : 'ATS: Needs Work'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">out of 100 • AI parsed</span>
                      </div>
                    </div>

                    {/* ATS breakdown bars */}
                    <div className="space-y-2 mb-4">
                      {[
                        { label: 'Keyword Match', val: Math.min(100, userProfile.resumeAnalysis.extractedSkills.length * 8 + 30) },
                        { label: 'Tech Stack Depth', val: Math.min(100, userProfile.resumeAnalysis.extractedTech.length * 10 + 20) },
                        { label: 'Languages', val: Math.min(100, userProfile.resumeAnalysis.programmingLanguages.length * 15 + 25) },
                        { label: 'Projects', val: Math.min(100, userProfile.resumeAnalysis.extractedProjects.length * 20 + 40) },
                      ].map(({ label, val }) => (
                        <div key={label}>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>{label}</span><span className="font-bold text-slate-300">{val}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                val >= 80 ? 'bg-emerald-500' : val >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${val}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                      <strong>Education:</strong> {userProfile.resumeAnalysis.extractedEducation}
                    </p>

                    <h4 className="text-xs font-bold text-indigo-400 mb-2">ATS Improvement Tips:</h4>
                    <div className="space-y-2">
                      {userProfile.resumeAnalysis.improvementSuggestions.map((s, idx) => (
                        <div key={idx} className="flex items-start space-x-2 p-2 rounded-lg bg-slate-950/50 border border-slate-800 text-[10.5px] leading-relaxed text-slate-300">
                          <Check className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm tracking-wide uppercase text-slate-400">AI Resume & ATS Analyzer</h3>
                      <Sparkles className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Upload your resume below to get your ATS score, keyword gaps, and improvement tips.
                    </p>
                  </div>
                )}

                {/* Resume upload card — file + paste tabs */}
                <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase">Upload / Analyze Resume</h3>
                    <FileText className="h-4 w-4 text-indigo-400" />
                  </div>

                  {/* Tab switcher */}
                  <div className="flex space-x-1 mb-3 bg-slate-950/50 p-1 rounded-lg">
                    <button
                      onClick={() => setResumeUploadTab('file')}
                      className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                        resumeUploadTab === 'file' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📎 Upload File
                    </button>
                    <button
                      onClick={() => setResumeUploadTab('paste')}
                      className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                        resumeUploadTab === 'paste' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📋 Paste Text
                    </button>
                  </div>

                  {resumeUploadTab === 'file' ? (
                    <div>
                      <div
                        onClick={() => resumeFileRef.current?.click()}
                        className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors"
                      >
                        <FileText className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">Click to upload <span className="text-indigo-400 font-bold">.txt / .pdf (text-based)</span></p>
                        <p className="text-[10px] text-slate-500 mt-1">Resume text is extracted and analyzed for ATS score</p>
                      </div>
                      <input
                        ref={resumeFileRef}
                        type="file"
                        accept=".txt,.text,.md,.pdf"
                        className="hidden"
                        onChange={handleResumeFileUpload}
                      />
                      {isAnalyzingResume && (
                        <div className="mt-3 flex items-center justify-center space-x-2 text-indigo-400 text-xs">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Analyzing resume & computing ATS score...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <textarea
                        rows={6}
                        placeholder="Paste your resume text here..."
                        value={manualResumePaste}
                        onChange={(e) => setManualResumePaste(e.target.value)}
                        className="w-full text-xs text-slate-300 bg-slate-950/60 rounded-xl p-3 border border-slate-800 outline-none focus:border-indigo-500/50 leading-relaxed"
                      />
                      <button
                        disabled={isAnalyzingResume || !manualResumePaste.trim()}
                        onClick={() => handleAnalyzeResumeOnline()}
                        className="w-full mt-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                      >
                        {isAnalyzingResume ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Computing ATS Score...</span></>
                        ) : (
                          <><Sparkles className="h-3.5 w-3.5" /><span>Analyze Resume & Get ATS Score</span></>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Secure Auth Sync Accounts panel */}
                <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-slate-200 tracking-wider uppercase">Sync Inbox Connector</h3>
                    <Mail className="h-4 w-4 text-indigo-400" />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Securely verify Google Gmail, Outlook, or College directories using OAuth authentication scopes. Scan for incoming hiring drives or hackathon invitations.
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800 h-12">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-red-400" />
                        <span className="text-xs font-semibold">Google Gmail API</span>
                      </div>
                      {currentUser.emailConnected?.gmail ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Connected</span>
                        </span>
                      ) : (
                        <button 
                          onClick={() => triggerEmailSyncSimulation('gmail')}
                          disabled={isSyncingEmail['gmail']}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-705 text-[10px] font-bold text-slate-200 transition-all"
                        >
                          {isSyncingEmail['gmail'] ? 'Verifying...' : 'Connect'}
                        </button>
                      )}
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800 h-12">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-blue-400" />
                        <span className="text-xs font-semibold">Microsoft Outlook</span>
                      </div>
                      {currentUser.emailConnected?.outlook ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Connected</span>
                        </span>
                      ) : (
                        <button 
                          onClick={() => triggerEmailSyncSimulation('outlook')}
                          disabled={isSyncingEmail['outlook']}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-705 text-[10px] font-bold text-slate-200 transition-all"
                        >
                          {isSyncingEmail['outlook'] ? 'Verifying...' : 'Connect'}
                        </button>
                      )}
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800 h-12">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-semibold">College Mailbox</span>
                      </div>
                      {currentUser.emailConnected?.college ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Connected</span>
                        </span>
                      ) : (
                        <button 
                          onClick={() => triggerEmailSyncSimulation('college')}
                          disabled={isSyncingEmail['college']}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-705 text-[10px] font-bold text-slate-200 transition-all"
                        >
                          {isSyncingEmail['college'] ? 'Verifying...' : 'Connect'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Center & Right sections: Custom recommendations matches lists */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* User Extracted Skills Badges list */}
                <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/10">
                  <h3 className="font-bold text-slate-200 text-sm mb-3">Extracted Skills Directory</h3>
                  {userProfile?.skills && userProfile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userProfile.skills.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No profile skills configured. Submit resume transcript to extract skills.</p>
                  )}
                </div>

                {/* Premium personalized recommended listings feed */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Highly Aligned Recommendations</h3>
                  {currentUser.status !== 'APPROVED' ? (
                    <div className="p-10 rounded-3xl border border-dashed border-slate-800 text-center bg-slate-950/40">
                      <Lock className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                      <h4 className="font-bold">Recommendation engine waiting verification</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Admin verification process takes usually under 12 hours. Review of registered resumes are automatically alerted to super admins.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {opportunities
                        .filter(o => o.matchPercentage && o.matchPercentage >= 75)
                        .sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))
                        .map(opp => (
                          <div 
                            key={opp.id} 
                            onClick={() => handleApplyClick(opp)}
                            className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 flex items-center justify-between cursor-pointer hover:border-indigo-500/20 transition-all group"
                          >
                            <div>
                              <div className="flex items-center space-x-2 mb-1.5">
                                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-[9px] uppercase font-mono text-indigo-400 font-bold">{opp.category}</span>
                                <span className="text-[10px] text-slate-400">{opp.organization}</span>
                              </div>
                              <h4 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight">{opp.title}</h4>
                              <p className="text-[11px] text-slate-400 mt-1">Deadline: {new Date(opp.deadline).toLocaleDateString()}</p>
                            </div>

                            <div className="flex flex-col items-end shrink-0">
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-black mb-1">
                                {opp.matchPercentage}% Match
                              </span>
                              <span className="text-[9.5px] uppercase tracking-wider text-slate-500 font-mono">Priority: High</span>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* VIEW 4: AI CHATBOT CONVERSATIONAL INTERACTIVE CANVAS */}
        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto">
            
            {/* Header chat block */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight flex items-center space-x-2">
                  <Sparkles className="h-6 w-6 text-indigo-400" />
                  <span>AI Agent Assistant Workspace</span>
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">Assembled with access to current opportunity directories and profile skills context.</p>
              </div>

              {currentUser && (
                <button 
                  onClick={handleClearChatHistory}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 hover:border-pink-500/30 text-slate-400 hover:text-pink-400 font-bold text-xs transition-colors"
                >
                  Clear History
                </button>
              )}
            </div>

            {/* Chat list elements */}
            <div className={`rounded-3xl border border-slate-800 overflow-hidden flex flex-col h-[520px] ${isDarkMode ? 'bg-slate-900/20' : 'bg-white'}`}>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto p-6">
                    <Sparkles className="h-10 w-10 text-indigo-400 animate-pulse mb-3" />
                    <h3 className="font-bold">NIMA-AI is listening</h3>
                    <p className="text-slate-400 text-xs mt-1">Ask questions like "Show AI internships", "Recommend hackathons for React developers", or "How can I improve my resume fit score?"</p>
                    
                    {/* Fast Prompt chips */}
                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                      <button 
                        onClick={() => { setCurrentPrompt('Show AI internships.'); }}
                        className="px-3 py-1.5 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-indigo-500/30 text-[10.5px]"
                      >
                        💼 AI Internships
                      </button>
                      <button 
                        onClick={() => { setCurrentPrompt('Recommend hackathons matching my resume.'); }}
                        className="px-3 py-1.5 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-indigo-500/30 text-[10.5px]"
                      >
                        🏆 Matches for React
                      </button>
                      <button 
                        onClick={() => { setCurrentPrompt('What is the latest AI news today?'); }}
                        className="px-3 py-1.5 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-indigo-500/30 text-[10.5px]"
                      >
                        🤖 Summarize today's news
                      </button>
                    </div>
                  </div>
                ) : (
                  chatMessages.map(m => (
                    <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-4 rounded-2xl max-w-lg text-xs leading-relaxed ${m.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-950/60 border border-slate-800 text-slate-100 rounded-tl-none'}`}>
                        <span className="block font-mono text-[9px] uppercase tracking-wider mb-1 font-bold opacity-60">
                          {m.sender === 'user' ? 'You' : 'NIMA-AI Assistant'}
                        </span>
                        <div className="whitespace-pre-wrap">{m.message}</div>
                        <span className="block text-[8px] opacity-40 text-right mt-2 font-mono">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Send panel */}
              <form onSubmit={handleSendChatPrompt} className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center space-x-2">
                <input 
                  type="text"
                  placeholder={currentUser ? "Type your prompt (e.g., recommend internships based on my resume)..." : "Please login first to interact with the helper agent..."}
                  disabled={!currentUser || isChatSending}
                  value={currentPrompt}
                  onChange={(e) => setCurrentPrompt(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-indigo-500/40 text-slate-100"
                />
                <button 
                  type="submit"
                  disabled={!currentUser || !currentPrompt.trim() || isChatSending}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all"
                >
                  {isChatSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>

            </div>
          </div>
        )}

        {/* VIEW 5: ADMIN & CRAWLERS CONTROL PANEL (SUPER ADMIN & ADMIN ONLY) */}
        {activeTab === 'admin' && currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
          <div className="space-y-10">
            
            {/* Top metrics dashboard header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-white flex items-center space-x-2">
                  <Sliders className="h-7 w-7 text-pink-400" />
                  <span>Administrative Control Deck</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1">Review active student enrollments, trigger scheduler scrapers, and manage database keys.</p>
              </div>

              <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                <button 
                  onClick={() => setShowAddOppModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1 transition-all"
                  id="btn-add-opportunity"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Feed Custom Opportunity</span>
                </button>

                <button 
                  disabled={isSyncingCrawlers}
                  onClick={handleSyncCrawlersNow}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-705 text-slate-200 hover:text-white border border-slate-700/80 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all"
                  id="btn-crawl-now"
                >
                  {isSyncingCrawlers ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  <span>Trigger Ingest Engine Now</span>
                </button>
              </div>
            </div>

            {/* Ingestion sources dashboard grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Box A: Student approval pipeline */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Users List Table */}
                <div className={`rounded-2xl border border-slate-800 overflow-hidden ${isDarkMode ? 'bg-slate-900/10' : 'bg-white'}`}>
                  <div className="p-4 bg-slate-950/40 border-b border-slate-800">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">Student Enrollment Approvals</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-250">
                      <thead className="bg-slate-950/65 font-bold uppercase tracking-wider text-[10px] text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-4">Name / Contact</th>
                          <th className="p-4">Resume Hook</th>
                          <th className="p-4">Verification Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {adminUsers.filter(u => u.role !== 'SUPER_ADMIN').map(user => {
                          const userProf = adminProfiles.find(p => p.userId === user.id);
                          return (
                            <tr key={user.id} className="hover:bg-slate-950/20">
                              <td className="p-4">
                                <span className="font-bold text-white block">{user.name}</span>
                                <span className="text-[10px] text-slate-400">{user.email}</span>
                              </td>
                              <td className="p-4 font-mono text-[10px] text-slate-300">
                                {user.resumeUrl ? (
                                  <div className="flex flex-col">
                                    <span className="flex items-center space-x-1 text-indigo-400 font-bold">
                                      <FileText className="h-3 w-3 shrink-0" />
                                      <span>{user.resumeUrl}</span>
                                    </span>
                                    {userProf?.resumeAnalysis && (
                                      <span className="text-[9px] text-slate-500 text-left mt-0.5 ml-4">Checked (Score: {userProf.resumeAnalysis.score})</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-500">None uploaded</span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${user.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400' : user.status === 'PENDING' ? 'bg-pink-500/15 text-pink-400 font-bold animate-pulse' : 'bg-neutral-800 text-neutral-300'}`}>
                                  {user.status}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-1">
                                {user.status === 'PENDING' && (
                                  <>
                                    <button 
                                      onClick={() => handleToggleUserStatus(user.id, 'APPROVED')}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded"
                                    >
                                      Approve
                                    </button>
                                    <button 
                                      onClick={() => handleToggleUserStatus(user.id, 'REJECTED')}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold text-[10px] rounded"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                {user.status === 'APPROVED' && (
                                  <button 
                                    onClick={() => handleToggleUserStatus(user.id, 'REJECTED')}
                                    className="px-2 py-1 bg-slate-850 hover:bg-slate-800 text-pink-400 text-[10px] font-bold rounded"
                                  >
                                    Revoke
                                  </button>
                                )}
                                {user.status === 'REJECTED' && (
                                  <button 
                                    onClick={() => handleToggleUserStatus(user.id, 'APPROVED')}
                                    className="px-2 py-1 bg-slate-850 hover:bg-slate-800 text-emerald-400 text-[10px] font-bold rounded"
                                  >
                                    Re-approve
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* DB System logs stream logs */}
                <div className={`rounded-xl border border-slate-800 overflow-hidden ${isDarkMode ? 'bg-slate-900/10' : 'bg-white'}`}>
                  <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-300">Live Telemetry & Crawler Logs</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-mono leading-relaxed font-bold">SYSTEM ACTIVE</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto p-4 space-y-1.5 font-mono text-[10px] text-slate-300">
                    {systemLogs.length === 0 ? (
                      <span className="text-slate-500 italic">No telemetry reports generated</span>
                    ) : (
                      systemLogs.map(log => (
                        <div key={log.id} className={`p-1.5 rounded leading-relaxed border ${log.level === 'error' ? 'bg-pink-500/5 border-pink-500/10 text-pink-400' : 'bg-slate-950/30 border-slate-850'}`}>
                          <span className="text-slate-500 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                          <span className="text-indigo-400 font-bold mr-1">{log.module}:</span>
                          <span>{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Box B: Configured Crawling portals (toggle checks states) */}
              <div className="space-y-6">
                
                {/* Active connectors crawler status lists */}
                <div className={`p-6 rounded-2xl border border-slate-800 bg-slate-900/10`}>
                  <h3 className="font-bold text-xs tracking-wider uppercase text-pink-400 mb-4 flex items-center space-x-1">
                    <Activity className="h-4 w-4" />
                    <span>Scheduled Portal Crawlers</span>
                  </h3>

                  <div className="space-y-3">
                    {crawlerSources.map(source => (
                      <div key={source.id} className="p-3 border border-slate-800/85 bg-slate-950/40 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white blockleading-tight">{source.name}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">Syncs each {source.frequencyMinutes}m ({source.type})</span>
                        </div>

                        <div className="flex items-center space-x-2.5">
                          <span className="text-[9px] text-slate-400 font-mono italic">
                            {source.isActive ? 'Polling' : 'Suspended'}
                          </span>
                          <input 
                            type="checkbox"
                            checked={source.isActive}
                            onChange={() => handleToggleSourceActive(source.id, source.isActive)}
                            className="rounded h-4 w-4 text-indigo-600 focus:ring-opacity-40 cursor-pointer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System DB stats schema playground */}
                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20">
                  <h3 className="font-bold text-xs tracking-wider uppercase text-indigo-400 mb-2">MongoDB Mongoose Schema Blueprint</h3>
                  <p className="text-[11px] text-slate-450 leading-relaxed mb-4">
                    The MongoDB schemas are designed using Mongoose validators mapping. Under production environment, we deploy these definitions directly to high-avail Atlas clusters.
                  </p>
                  
                  <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-805 text-[9.5px] font-mono text-slate-350 overflow-x-auto select-all max-h-48 scrollbar-thin">
                    <pre>{`const OpportunitySchema = new Schema({
  title: { type: String, required: true },
  organization: { type: String, required: true },
  description: { type: String, required: true },
  deadline: { type: Date, required: true },
  category: { type: String, enum: [
    'Internships', 'Hackathons', 'Workshops', 
    'Bootcamps', 'Certifications', 'Tech Events'
  ]},
  tags: [{ type: String }],
  source: { type: String, default: 'Crawler' },
  registrationLink: { type: String, required: true }
});`}</pre>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </main>

      {/* FOOTER SECTION */}
      <footer className={`border-t py-12 mt-16 text-center text-xs transition-colors ${isDarkMode ? 'bg-slate-950 border-slate-900 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Cpu className="h-5 w-5 text-indigo-400" />
            <span className="font-bold text-slate-300">NIMA-AI Platform Inc.</span>
          </div>
          <p className="max-w-xl mx-auto leading-relaxed">
            NIMA Opportunity Intelligence aggregates official developer blogs, RSS digests, and student portals into a single unified SaaS viewport inside Google AI Studio Cloud.
          </p>
          <div className="font-mono text-[9px] text-slate-600 tracking-wider">
            BUILD_VERSION: v1.0.8-PROD // DEPLOY_STAMP: 2026-06-19T03:41:00-07:00
          </div>
        </div>
      </footer>

      {/* DIALOG A: SIGN IN / SIGN UP MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="p-6 border-b border-slate-850 flex items-center justify-between">
              <span className="font-bold text-sm tracking-wide uppercase">{isRegistering ? 'Create Student Enrollment' : 'Sign In to My Account'}</span>
              <button onClick={() => setShowAuthModal(false)} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            {isRegistering ? (
              // REGISTER QUESTIONNAIRE
              <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="Arun Devaraj"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl px-3 py-2.5 border border-slate-800 focus:border-indigo-505 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email (daruniofficial@gmail.com triggers Super Admin)</label>
                  <input 
                    type="email"
                    required
                    placeholder="student@college.edu"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl px-3 py-2.5 border border-slate-800 focus:border-indigo-505 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Primary Tech Skills (separated by comma)</label>
                  <input 
                    type="text"
                    placeholder="React, TypeScript, Python, PyTorch..."
                    value={registerForm.skills}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, skills: e.target.value }))}
                    className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl px-3 py-2.5 border border-slate-800 focus:border-indigo-505 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Interests / Fields</label>
                  <input 
                    type="text"
                    placeholder="Fullstack Development, Machine Learning, Open Source..."
                    value={registerForm.interests}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, interests: e.target.value }))}
                    className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl px-3 py-2.5 border border-slate-800 focus:border-indigo-505 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Paste Resume Text transcript (AI Auto Extraction)</label>
                  <textarea 
                    rows={4}
                    placeholder="Paste resume transcript lines..."
                    value={registerForm.resumeText}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, resumeText: e.target.value, fileName: 'uploaded_resume.txt' }))}
                    className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl p-3 border border-slate-800 focus:border-indigo-505 outline-none leading-relaxed"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span 
                    onClick={() => setIsRegistering(false)}
                    className="text-xs text-slate-400 hover:text-indigo-400 font-semibold cursor-pointer"
                  >
                    Already have account? Sign In
                  </span>
                  
                  <button 
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-lg shadow-indigo-500/15"
                  >
                    Register Account
                  </button>
                </div>
              </form>
            ) : (
              // SIGN IN WITH EMAIL
              <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Registered Email Address</label>
                  <input 
                    type="email"
                    required
                    placeholder="student@college.edu or daruniofficial@gmail.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl px-4 py-3 border border-slate-800 focus:border-indigo-505 outline-none"
                  />
                  <span className="block text-[9.5px] text-slate-500 mt-2 font-mono">
                    💡 daruniofficial@gmail.com triggers automated SUPER-ADMIN access permissions!
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-850 flex items-center justify-between">
                  <span 
                    onClick={() => setIsRegistering(true)}
                    className="text-xs text-slate-400 hover:text-indigo-400 font-semibold cursor-pointer"
                  >
                    Create a new enrollment? Sign Up
                  </span>
                  
                  <button 
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-lg shadow-indigo-500/15"
                  >
                    Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DIALOG B: ADMIN FEED OPPORTUNITY FORM */}
      {showAddOppModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl overflow-hidden tracking-normal border bg-slate-900 border-slate-800 text-white">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <span className="font-extrabold text-sm uppercase">Custom Opportunity Generation Feed</span>
              <button onClick={() => setShowAddOppModal(false)} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleAddCustomOpportunity} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Company / Organization Name</label>
                <input 
                  type="text" required placeholder="Google Cloud, Intel, HARMAN"
                  value={newOppData.organization}
                  onChange={(e) => setNewOppData(prev => ({ ...prev, organization: e.target.value }))}
                  className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl px-3 py-2 border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Position / Project Title</label>
                <input 
                  type="text" required placeholder="Software Developer apprentice, AI Engineer Intern"
                  value={newOppData.title}
                  onChange={(e) => setNewOppData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl px-3 py-2 border border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Opportunity Category</label>
                  <select 
                    value={newOppData.category}
                    onChange={(e) => setNewOppData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl px-3 py-2 border border-slate-800"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Closing Deadline Date</label>
                  <input 
                    type="date" required
                    value={newOppData.deadline}
                    onChange={(e) => setNewOppData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl px-3 py-2 border border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Academic Eligibility Bounds</label>
                <input 
                  type="text" placeholder="Grad years 2026/2027 or relevant CS degrees"
                  value={newOppData.eligibility}
                  onChange={(e) => setNewOppData(prev => ({ ...prev, eligibility: e.target.value }))}
                  className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl px-3 py-2 border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Tags (comma separated)</label>
                <input 
                  type="text" placeholder="SDE, Remote, Python, Cloud"
                  value={newOppData.tags}
                  onChange={(e) => setNewOppData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl px-3 py-2 border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Direct Registration/Apply Link</label>
                <input 
                  type="url" placeholder="https://careers.google.com/..."
                  value={newOppData.registrationLink}
                  onChange={(e) => setNewOppData(prev => ({ ...prev, registrationLink: e.target.value }))}
                  className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl px-3 py-2 border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Full Description</label>
                <textarea 
                  rows={4}
                  placeholder="Insert program instructions, required credentials and background skills..."
                  value={newOppData.description}
                  onChange={(e) => setNewOppData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full text-xs text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 text-right">
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg"
                >
                  Confirm Opportunity Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
