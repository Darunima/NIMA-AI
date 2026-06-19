import Link from "next/link";
import { ArrowRight, Brain, Zap, Sparkles, Database, Mail, ShieldAlert } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-[calc(100vh-130px)] flex flex-col items-center justify-center py-12">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="text-center max-w-4xl px-4 flex flex-col items-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-950/30 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          Autonomous Career Intelligence
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-3xl leading-tight">
          Find your next leap with <span className="text-gradient">NIMA AI</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl font-light leading-relaxed">
          Aggregating opportunities, scraping global tech databases, sync&apos;ing email notifications, and matching candidates through advanced vector intelligence.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link 
            href="/login" 
            className="group flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25 transition-all text-base"
          >
            Launch Engine
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            href="/login?register=true" 
            className="flex items-center justify-center border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-base w-full sm:w-auto"
          >
            Create Free Account
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-24 px-4">
        <div className="glass-card p-8 rounded-3xl flex flex-col gap-4">
          <div className="h-12 w-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Brain className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Semantic AI Matcher</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Upload your resume to calculate a vector match score across millions of active job listings instantly.
          </p>
        </div>

        <div className="glass-card p-8 rounded-3xl flex flex-col gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Aggregator Scheduler</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Crawls RSS, Atom, custom XML feeds, API registries, and sitemaps continuously.
          </p>
        </div>

        <div className="glass-card p-8 rounded-3xl flex flex-col gap-4">
          <div className="h-12 w-12 rounded-2xl bg-fuchsia-600/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
            <Mail className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white">EmailSync Syncing</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Parse Gmail and Outlook notifications dynamically to extract hackathons and campus drives.
          </p>
        </div>
      </div>

      {/* Technologies Section */}
      <div id="technology" className="mt-24 text-center max-w-5xl px-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6">Engine Architecture Stack</h3>
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 opacity-60">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-500" />
            <span className="font-bold text-white">MongoDB Atlas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-red-500">Redis Cache</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-teal-400">FastAPI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-400">Next.js 15</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-yellow-400">OpenAI LLM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
