const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  token?: string;
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  // Try loading token from localStorage if client side
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("nima_token") || options.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData = "API Error";
    try {
      const parsed = await response.json();
      errorData = parsed.detail || JSON.stringify(parsed);
    } catch {
      errorData = await response.text();
    }
    throw new Error(errorData);
  }

  return response.json() as Promise<T>;
}

// Fallback Mock Data for demo reliability
export const mockOpportunities = [
  {
    _id: "job1",
    title: "Senior AI Engineer",
    company: "NIMA Labs",
    description: "Looking for an expert to develop neural search infrastructure, prompt pipelines, and document parsers.",
    requirements: ["Python", "PyTorch", "FastAPI", "MongoDB", "Vector DBs"],
    salaryRange: { min: 140000, max: 190000, currency: "USD" },
    status: "open",
    createdAt: new Date().toISOString(),
    matchScore: 94,
    location: { city: "San Francisco", country: "USA" }
  },
  {
    _id: "job2",
    title: "Machine Learning Intern",
    company: "FutureFlow AI",
    description: "Undergrad/Grad internship focused on LLM fine-tuning and data ingestion architectures.",
    requirements: ["Python", "Transformers", "NLP", "Scikit-Learn"],
    salaryRange: { min: 60000, max: 90000, currency: "USD" },
    status: "open",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    matchScore: 82,
    location: { city: "Remote", country: "USA" }
  },
  {
    _id: "job3",
    title: "Full-Stack Dev Lead",
    company: "HackerSphere",
    description: "Lead the frontend web interface using Next.js 15, React 19, Tailwind, and WebRTC chats.",
    requirements: ["React", "Next.js", "TypeScript", "TailwindCSS", "Node.js"],
    salaryRange: { min: 130000, max: 165000, currency: "USD" },
    status: "open",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    matchScore: 78,
    location: { city: "New York", country: "USA" }
  }
];

export const mockNews = [
  {
    _id: "news1",
    title: "The Rise of Agentic AI Frameworks in 2026",
    summary: "A detailed breakdown of how agents are transforming enterprise operations by coordinating subagents autonomously.",
    url: "https://example.com/agentic-ai",
    publishedAt: new Date().toISOString(),
    sentiment: { score: 0.92, label: "positive" },
    categories: ["AI", "Tech Trends"]
  },
  {
    _id: "news2",
    title: "MongoDB Atlas Vector Search Benchmark Performance Increases by 40%",
    summary: "MongoDB launches updated vector quantization algorithms reducing latency on high-dimensional embeddings.",
    url: "https://example.com/mongodb-vector",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    sentiment: { score: 0.85, label: "positive" },
    categories: ["Databases", "AI Infrastructure"]
  }
];

export const api = {
  // Authentication
  login: async (credentials: any) => {
    try {
      return await apiRequest<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    } catch {
      // Mock login for frontend execution without active backend
      if (credentials.email && credentials.password) {
        return {
          access_token: "mock-jwt-token-12345",
          token_type: "bearer",
          user: { email: credentials.email, role: credentials.email.includes("admin") ? "admin" : "candidate" }
        };
      }
      throw new Error("Invalid credentials");
    }
  },
  
  // Opportunities
  getOpportunities: async (filters: any = {}) => {
    try {
      return await apiRequest<any[]>("/opportunities", {
        method: "GET",
      });
    } catch {
      return mockOpportunities;
    }
  },
  
  searchOpportunities: async (searchPayload: any) => {
    try {
      return await apiRequest<any[]>("/opportunities/search", {
        method: "POST",
        body: JSON.stringify(searchPayload),
      });
    } catch {
      if (!searchPayload.query) return mockOpportunities;
      return mockOpportunities.filter(
        op => op.title.toLowerCase().includes(searchPayload.query.toLowerCase()) || 
              op.description.toLowerCase().includes(searchPayload.query.toLowerCase())
      );
    }
  },

  // News
  getNews: async () => {
    try {
      return await apiRequest<any[]>("/news", { method: "GET" });
    } catch {
      return mockNews;
    }
  },

  // Bookmarks
  getBookmarks: async () => {
    try {
      return await apiRequest<any[]>("/bookmarks", { method: "GET" });
    } catch {
      return mockOpportunities.slice(0, 1);
    }
  },

  // Profile / Resume Upload
  uploadResume: async (formData: FormData) => {
    try {
      return await apiRequest<any>("/recommendations/parse-resume", {
        method: "POST",
        body: formData,
      });
    } catch {
      return {
        fileName: "resume.pdf",
        status: "parsed",
        skillsExtracted: ["React", "Next.js", "TypeScript", "Node.js", "Python", "FastAPI"],
        text: "Mock Parsed Resume Content for demonstration purposes."
      };
    }
  },

  // Recommendations
  getRecommendedJobs: async () => {
    try {
      return await apiRequest<any[]>("/recommendations/jobs", { method: "GET" });
    } catch {
      return mockOpportunities;
    }
  },

  // Assistant Chat
  chat: async (message: string, history: any[]) => {
    try {
      return await apiRequest<any>("/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ message, history }),
      });
    } catch {
      // Mock Response from NIMA AI
      await new Promise(resolve => setTimeout(resolve, 800));
      let response = "I'm your NIMA AI Assistant. I can help search for opportunities, summarize news, or parse your resume.";
      if (message.toLowerCase().includes("job") || message.toLowerCase().includes("opportunity")) {
        response = `Based on your profile, here are some matches: **Senior AI Engineer at NIMA Labs** (94% match) and **Machine Learning Intern at FutureFlow AI** (82% match). Would you like to review their requirements?`;
      } else if (message.toLowerCase().includes("news") || message.toLowerCase().includes("industry")) {
        response = `Here are the latest updates:\n\n1. **The Rise of Agentic AI Frameworks in 2026** (Highly Positive sentiment)\n2. **MongoDB Atlas Vector Search Performance Improvements**\n\nWhich one would you like me to summarize?`;
      }
      return { response };
    }
  }
};
