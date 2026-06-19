"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/api";
import { Mail, Lock, User, Sparkles, Loader } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const isRegisterParam = searchParams.get("register") === "true";
  
  const [isRegister, setIsRegister] = useState(isRegisterParam);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.login({ email, password, firstName, lastName, isRegister });
      
      // Store in localStorage
      localStorage.setItem("nima_token", response.access_token);
      localStorage.setItem("nima_user", JSON.stringify(response.user || { email, role: email.includes("admin") ? "admin" : "candidate" }));
      
      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md glass-card p-8 md:p-10 rounded-3xl relative overflow-hidden">
      <div className="absolute -top-12 -right-12 h-32 w-32 bg-violet-600/10 rounded-full blur-2xl" />
      
      <div className="flex flex-col space-y-2 mb-8">
        <h2 className="text-3xl font-extrabold text-white">
          {isRegister ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-sm text-gray-400">
          {isRegister ? "Start discovering semantic opportunities" : "Log in to access your NIMA AI workspace"}
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {isRegister && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400">First Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="John"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400">Last Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 disabled:opacity-50"
        >
          {loading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {isRegister ? "Register" : "Sign In"}
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-400">
        {isRegister ? "Already have an account?" : "New to NIMA AI?"}{" "}
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
        >
          {isRegister ? "Login here" : "Create one now"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-130px)] flex items-center justify-center relative py-12">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />
      
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
