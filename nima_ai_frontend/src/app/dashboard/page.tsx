"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { 
  Sparkles, 
  Briefcase, 
  Newspaper, 
  ArrowUpRight, 
  CheckCircle,
  AlertCircle,
  FileText
} from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("nima_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const loadData = async () => {
      try {
        const [opsData, newsData] = await Promise.all([
          api.getOpportunities(),
          api.getNews()
        ]);
        setOpportunities(opsData);
        setNews(newsData);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="h-8 w-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Loading workspace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white">NIMA Workspace</h1>
          <p className="text-gray-400 mt-1 font-light">Autonomous matching, syncing, and feed ingestion dashboard.</p>
        </div>
        
        <Link 
          href="/chat"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium px-5 py-3 rounded-2xl shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 transition-all text-sm"
        >
          <Sparkles className="h-4 w-4" />
          Talk to NIMA AI
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Indexed Vacancies</span>
            <div className="text-3xl font-extrabold text-white">{opportunities.length}</div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">News Intelligence</span>
            <div className="text-3xl font-extrabold text-white">{news.length}</div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Newspaper className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Integration</span>
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">Active</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <FileText className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Matches & Opportunities */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Recommended Matches</h2>
            <Link href="/opportunities" className="text-sm text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 transition-colors">
              Explore All <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {opportunities.map((op) => (
              <div key={op._id} className="glass-card p-6 rounded-3xl flex flex-col md:flex-row justify-between gap-4 relative overflow-hidden group">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="px-2.5 py-0.5 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
                      {op.matchScore}% Match
                    </span>
                    <span className="text-xs text-gray-500">• {op.location.city}, {op.location.country}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">{op.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 font-light">{op.company}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {op.requirements.slice(0, 4).map((req: string) => (
                      <span key={req} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-gray-300 text-xs">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col justify-between md:justify-end items-end gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Estimated Salary</div>
                    <div className="text-sm font-extrabold text-white">
                      ${(op.salaryRange.min / 1000).toFixed(0)}k - ${(op.salaryRange.max / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <Link
                    href={`/opportunities/${op._id}`}
                    className="px-4 py-2 text-xs font-semibold bg-white/5 hover:bg-violet-600 border border-white/10 hover:border-violet-500 rounded-xl transition-all"
                  >
                    View Opportunity
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Ingested News intelligence */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Latest News Intel</h2>
            <Link href="/news" className="text-sm text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 transition-colors">
              Read Feed <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {news.map((item) => (
              <div key={item._id} className="glass-card p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider">
                      {item.categories[0]}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                      item.sentiment.label === "positive" 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-gray-500/10 border-gray-500/20 text-gray-400"
                    }`}>
                      {item.sentiment.label}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2 leading-snug line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1.5 font-light line-clamp-3">
                    {item.summary}
                  </p>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 mt-2 self-start transition-colors"
                >
                  Source Link <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
