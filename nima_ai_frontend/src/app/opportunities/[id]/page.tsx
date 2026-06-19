"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api, mockOpportunities } from "@/lib/api";
import { 
  ArrowLeft, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Bookmark, 
  Sparkles, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OpportunityDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [op, setOp] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        const jobs = await api.getOpportunities();
        const found = jobs.find((j: any) => j._id === id);
        setOp(found || mockOpportunities[0]);
      } catch (err) {
        setOp(mockOpportunities[0]);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunity();
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    // Simulate application pipeline
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setApplied(true);
    setApplying(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!op) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Opportunity not found.</h2>
        <Link href="/opportunities" className="text-violet-400 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to explorer
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Link href="/opportunities" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Opportunity Explorer
      </Link>

      <div className="glass-card p-8 md:p-10 rounded-3xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-violet-600/5 rounded-full blur-3xl" />

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-8 border-b border-white/5">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="px-3 py-1 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs font-semibold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                {op.matchScore}% Semantic Match
              </span>
              <span className="text-xs text-gray-500">Posted on {formatDate(op.createdAt)}</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white">{op.title}</h1>
              <p className="text-lg text-gray-300 font-light mt-1">{op.company}</p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-gray-400 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-violet-400" />
                {op.location.city}, {op.location.country}
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-violet-400" />
                ${(op.salaryRange.min / 1000).toFixed(0)}k - ${(op.salaryRange.max / 1000).toFixed(0)}k {op.salaryRange.currency}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-violet-400" />
                Full-time
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`flex-1 md:flex-none p-3.5 rounded-2xl border flex items-center justify-center transition-all ${
                bookmarked 
                  ? "bg-violet-600/10 border-violet-500/30 text-violet-400" 
                  : "bg-white/5 border-white/10 hover:border-white/20 text-gray-300"
              }`}
            >
              <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-violet-400" : ""}`} />
            </button>
            <button
              onClick={handleApply}
              disabled={applied || applying}
              className={`flex-[3] md:flex-none px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-violet-500/10 transition-all flex items-center justify-center gap-2 ${
                applied 
                  ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 cursor-default" 
                  : "bg-violet-600 hover:bg-violet-700 text-white"
              }`}
            >
              {applying ? (
                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : applied ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Applied
                </>
              ) : (
                "Apply Now"
              )}
            </button>
          </div>
        </div>

        {/* Detailed sections */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white">Description</h3>
            <p className="text-sm text-gray-400 leading-relaxed font-light">
              {op.description}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white">Requirements & Core Skills</h3>
            <div className="flex flex-wrap gap-2">
              {op.requirements.map((req: string) => (
                <span key={req} className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-gray-200 text-sm font-light">
                  {req}
                </span>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-violet-950/20 border border-violet-500/10 flex items-start gap-4">
            <Sparkles className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">AI Analysis Score</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-light">
                This job has a high matching overlap with the core skills on your parsed profile (FastAPI, React, TypeScript). In particular, your profile highlights experiences that align with the requirements of {op.company}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
