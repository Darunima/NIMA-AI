"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Bookmark, MapPin, DollarSign, ArrowUpRight, Trash2 } from "lucide-react";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const data = await api.getBookmarks();
        setBookmarks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  const handleRemove = (id: string) => {
    setBookmarks(bookmarks.filter((b) => b._id !== id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-white">Saved Bookmarks</h1>
        <p className="text-gray-400 mt-1 font-light">Your curated list of matching vacancies and intelligence feeds.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-8 w-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl">
          <Bookmark className="h-10 w-10 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 font-light">No bookmarks saved yet. Browse opportunities to save them.</p>
          <Link 
            href="/opportunities" 
            className="inline-block mt-4 text-sm text-violet-400 hover:text-violet-300 font-semibold underline"
          >
            Go to Explorer
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((op) => (
            <div key={op._id} className="glass-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="px-2.5 py-0.5 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
                    {op.matchScore}% Match
                  </span>
                  <span className="text-xs text-gray-500">• {op.location.city}, {op.location.country}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors leading-tight">
                    {op.title}
                  </h3>
                  <p className="text-sm text-gray-400 font-light mt-0.5">{op.company}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {op.requirements.map((req: string) => (
                    <span key={req} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-gray-300 text-xs font-light">
                      {req}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto shrink-0 justify-between md:justify-end">
                <div className="text-left md:text-right">
                  <div className="text-xs text-gray-500">Est. Salary</div>
                  <div className="text-sm font-extrabold text-white">
                    ${(op.salaryRange.min / 1000).toFixed(0)}k - ${(op.salaryRange.max / 1000).toFixed(0)}k
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/opportunities/${op._id}`}
                    className="p-3 bg-white/5 hover:bg-violet-600 border border-white/10 hover:border-violet-500 text-white rounded-xl transition-all"
                    title="View details"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleRemove(op._id)}
                    className="p-3 bg-white/5 hover:bg-rose-950/20 border border-white/10 hover:border-rose-500/30 text-gray-400 hover:text-rose-400 rounded-xl transition-all"
                    title="Remove bookmark"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
