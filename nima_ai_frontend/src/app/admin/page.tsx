"use client";

import { useEffect, useState } from "react";
import { 
  Settings, 
  Play, 
  Plus, 
  RotateCw, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdminPage() {
  const [sources, setSources] = useState<any[]>([
    { _id: "s1", name: "YC HackerNews Jobs", type: "rss", url: "https://news.ycombinator.com/jobsrss", status: "active", lastPolledAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { _id: "s2", name: "TechCrunch Startups", type: "rss", url: "https://techcrunch.com/feed/", status: "active", lastPolledAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    { _id: "s3", name: "WeWorkRemote Feed", type: "api", url: "https://weworkremotely.com/categories/remote-programming-jobs.rss", status: "active", lastPolledAt: new Date(Date.now() - 120 * 60 * 1000).toISOString() }
  ]);
  const [logs, setLogs] = useState<string[]>([
    "[17:10:02] [INFO] APScheduler triggered aggregator poll.",
    "[17:10:05] [INFO] Parsing YC HackerNews Jobs RSS xml stream...",
    "[17:10:09] [SUCCESS] RSS Collector parsed 12 opportunities successfully.",
    "[17:10:10] [INFO] Running deduplication service on 12 parsed items.",
    "[17:10:12] [SUCCESS] Deduplication service merged 2 duplicates. Saved 10 new opportunities in MongoDB.",
  ]);
  
  // Scraper Engine settings
  const [engine, setEngine] = useState("playwright");
  const [retryCount, setRetryCount] = useState(3);
  const [rotatingProxies, setRotatingProxies] = useState(true);

  // New source form
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceType, setNewSourceType] = useState("rss");
  const [newSourceUrl, setNewSourceUrl] = useState("");

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName || !newSourceUrl) return;

    const newSource = {
      _id: `s${Date.now()}`,
      name: newSourceName,
      type: newSourceType,
      url: newSourceUrl,
      status: "active",
      lastPolledAt: new Date().toISOString()
    };

    setSources([...sources, newSource]);
    setNewSourceName("");
    setNewSourceUrl("");
    
    setLogs(prev => [...prev, `[17:15:00] [INFO] Registered new Source: ${newSourceName} (${newSourceType})`]);
  };

  const triggerSync = (id: string, name: string) => {
    setLogs(prev => [
      ...prev,
      `[17:16:01] [INFO] Force polling triggered for: ${name}`,
      `[17:16:03] [INFO] Playwright browser instance booted. Scraping ${name}...`,
      `[17:16:07] [SUCCESS] Crawled and parsed. Ingestion flow complete.`
    ]);
    
    setSources(sources.map(s => s._id === id ? { ...s, lastPolledAt: new Date().toISOString() } : s));
  };

  const handleDelete = (id: string, name: string) => {
    setSources(sources.filter(s => s._id !== id));
    setLogs(prev => [...prev, `[17:17:00] [WARN] Deleted Source registry: ${name}`]);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-white">Scraper & Ingestion Control</h1>
        <p className="text-gray-400 mt-1 font-light">Monitor scraper selectors, register news feed RSS channels, and trigger sync workers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Source Registry */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center justify-between">
              Source Registry Config
              <span className="text-xs bg-violet-600/10 border border-violet-500/20 text-violet-400 px-2.5 py-1 rounded-lg">
                {sources.length} Channels Active
              </span>
            </h3>

            <div className="divide-y divide-white/5 space-y-4">
              {sources.map((src) => (
                <div key={src._id} className="pt-4 first:pt-0 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{src.name}</span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-white/5 text-gray-400">
                        {src.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 font-light truncate max-w-sm sm:max-w-md">
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {src.url}
                    </div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-violet-400" />
                      Last synced: {formatDate(src.lastPolledAt)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerSync(src._id, src.name)}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-colors flex items-center gap-1"
                    >
                      <Play className="h-3 w-3 fill-white" />
                      Sync
                    </button>
                    <button
                      onClick={() => handleDelete(src._id, src.name)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-rose-950/20 border border-white/5 hover:border-rose-500/30 text-gray-400 hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add source configuration */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-violet-400" />
              Register New Channel Source
            </h3>

            <form onSubmit={handleAddSource} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                required
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="YC HackerNews Jobs"
              />
              <select
                value={newSourceType}
                onChange={(e) => setNewSourceType(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="rss">RSS Channel</option>
                <option value="xml">XML Document</option>
                <option value="atom">Atom Feed</option>
                <option value="api">API Endpoint</option>
              </select>
              <input
                type="url"
                required
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="https://example.com/feed.xml"
              />
              <button
                type="submit"
                className="sm:col-span-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-violet-500/10"
              >
                Register Source
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Settings & Live Sync log */}
        <div className="space-y-6">
          {/* Scraping Settings */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="h-4.5 w-4.5 text-violet-400" />
              Scraper Configs
            </h3>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-gray-400">Headless Engine Fallback</label>
                <select
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="playwright">Playwright Scraper (Primary)</option>
                  <option value="selenium">Selenium (Fallback)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-400">Request Max Retries</label>
                <input
                  type="number"
                  value={retryCount}
                  onChange={(e) => setRetryCount(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Rotating Proxies (Fiddler/Tor)</span>
                <input
                  type="checkbox"
                  checked={rotatingProxies}
                  onChange={(e) => setRotatingProxies(e.target.checked)}
                  className="accent-violet-600 h-4 w-4 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Sync Ingestion Log console */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              Live Ingestion Log
              <RotateCw className="h-4 w-4 text-violet-400 animate-spin" />
            </h3>
            <div className="bg-black/60 rounded-2xl p-4 h-64 overflow-y-auto font-mono text-[10px] text-violet-300 space-y-2 border border-white/5 scrollbar-thin">
              {logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
