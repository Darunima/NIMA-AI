"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Newspaper, Rss, ArrowUpRight, Search, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await api.getNews();
        setNews(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const categories = ["all", ...Array.from(new Set(news.flatMap(item => item.categories)))];

  const filteredNews = news.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.categories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white">News Intelligence</h1>
          <p className="text-gray-400 mt-1 font-light">Aggregated global industry updates parsed with AI sentiment scoring.</p>
        </div>
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/10 text-violet-400 text-xs font-semibold rounded-lg">
            <Rss className="h-3.5 w-3.5" />
            5 Feeds Synchronized
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-3 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="Search matching articles..."
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                selectedCategory === cat 
                  ? "bg-violet-600 border-violet-500 text-white" 
                  : "bg-white/5 border-white/5 hover:border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-8 w-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl">
          <p className="text-gray-400">No articles match your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNews.map((item) => (
            <div key={item._id} className="glass-card p-6 rounded-3xl flex flex-col justify-between gap-5 group relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-1.5">
                    {item.categories.map((cat: string) => (
                      <span key={cat} className="px-2 py-0.5 rounded bg-violet-600/10 text-violet-400 border border-violet-500/10 text-[10px] font-semibold uppercase tracking-wider">
                        {cat}
                      </span>
                    ))}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                    item.sentiment.label === "positive" 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : "bg-gray-500/10 border-gray-500/20 text-gray-400"
                  }`}>
                    {item.sentiment.label} ({item.sentiment.score.toFixed(2)})
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 font-light leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-[10px] text-gray-500">Fetched {formatDate(item.publishedAt)}</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  Visit Article <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
