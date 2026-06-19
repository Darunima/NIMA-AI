"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Briefcase, Bell, MessageSquare, LogOut, Menu, User } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("nima_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("nima_token");
    localStorage.removeItem("nima_user");
    window.location.href = "/";
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 w-full border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
          N
        </div>
        <span className="text-xl font-extrabold text-white tracking-tight">
          NIMA <span className="text-violet-400 font-medium">AI</span>
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {user ? (
          <>
            <Link href="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/opportunities" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Opportunities</Link>
            <Link href="/news" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">News Feed</Link>
            <Link href="/chat" className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              <MessageSquare className="h-4 w-4 text-violet-400" />
              AI Chat
            </Link>
            {user.role === "admin" && (
              <Link href="/admin" className="text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors">Admin</Link>
            )}
          </>
        ) : (
          <>
            <Link href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</Link>
            <Link href="#technology" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Tech Stack</Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <Link href="/profile" className="h-8 w-8 rounded-full bg-violet-950 border border-violet-500/20 flex items-center justify-center text-violet-300 hover:border-violet-400 transition-colors">
              <User className="h-4 w-4" />
            </Link>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 transition-colors">
              Log in
            </Link>
            <Link href="/login?register=true" className="text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-violet-500/10">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
