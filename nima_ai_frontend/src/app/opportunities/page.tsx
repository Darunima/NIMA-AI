"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Search, Filter, Briefcase, MapPin, DollarSign, Sparkles } from "lucide-react";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [status, setStatus] = useState("all");
  const [location, setLocation] = useState("all");
  const [minSalary, setMinSalary] = useState(0);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await api.getOpportunities();
      setOpportunities(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.searchOpportunities({ query: searchQuery });
      setOpportunities(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Basic client-side filtering matching the search/filter requirement
  const filteredOpportunities = opportunities.filter((op) => {
    if (status !== "all" && op.status !== status) return false;
    if (location !== "all" && location === "remote" && op.location.city.toLowerCase() !== "remote") return false;
    if (location !== "all" && location === "onsite" && op.location.city.toLowerCase() === "remote") return false;
    if (minSalary > 0 && op.salaryRange.min < minSalary) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-white">Opportunity Explorer</h1>
        <p className="text-gray-400 mt-1 font-light">Search and filter active matches with vector weight ranking.</p>
      </div>

      {/* Search Header */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="Search by job title, description, keywords, or company..."
          />
        </div>
        <button
          type="submit"
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 rounded-2xl transition-colors text-sm shrink-0"
        >
          Search
        </button>
      </form>

      {/* Filtering Row */}
      <div className="flex flex-wrap gap-4 items-center bg-white/5 border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <Filter className="h-4 w-4 text-violet-400" />
          Filters:
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-black/50 border border-white/10 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Location</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-black/50 border border-white/10 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Locations</option>
            <option value="remote">Remote Only</option>
            <option value="onsite">On-Site Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Min Salary</label>
          <select
            value={minSalary}
            onChange={(e) => setMinSalary(Number(e.target.value))}
            className="bg-black/50 border border-white/10 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500"
          >
            <option value={0}>Any Salary</option>
            <option value={80000}>$80k+</option>
            <option value={120000}>$120k+</option>
            <option value={150000}>$150k+</option>
          </select>
        </div>

        <button 
          onClick={() => {
            setSearchQuery("");
            setStatus("all");
            setLocation("all");
            setMinSalary(0);
            fetchJobs();
          }}
          className="text-xs text-gray-400 hover:text-white transition-colors ml-auto underline"
        >
          Reset Filters
        </button>
      </div>

      {/* Grid of Results */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-8 w-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl">
          <p className="text-gray-400">No opportunities found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOpportunities.map((op) => (
            <div key={op._id} className="glass-card p-6 rounded-3xl flex flex-col justify-between gap-6 group relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 px-3 py-1 rounded-xl text-xs font-semibold">
                    <Sparkles className="h-3.5 w-3.5" />
                    {op.matchScore}% Match
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-400 uppercase font-semibold">
                    {op.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white group-hover:text-violet-400 transition-colors leading-tight">
                    {op.title}
                  </h3>
                  <p className="text-sm text-gray-400 font-light">{op.company}</p>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-gray-400 font-light">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-violet-400" />
                    {op.location.city}, {op.location.country}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-violet-400" />
                    ${(op.salaryRange.min / 1000).toFixed(0)}k - ${(op.salaryRange.max / 1000).toFixed(0)}k
                  </div>
                </div>

                <p className="text-sm text-gray-400 font-light line-clamp-3">
                  {op.description}
                </p>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {op.requirements.map((req: string) => (
                  <span key={req} className="px-2 py-0.5 rounded bg-white/5 text-gray-300 text-xs font-light">
                    {req}
                  </span>
                ))}
              </div>

              <Link
                href={`/opportunities/${op._id}`}
                className="w-full flex items-center justify-center bg-white/5 hover:bg-violet-600 border border-white/10 hover:border-violet-500 text-white font-semibold py-3 rounded-xl transition-all text-sm mt-4"
              >
                Inspect Requirements
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
