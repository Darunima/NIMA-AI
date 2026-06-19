"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  User, 
  FileText, 
  Upload, 
  Check, 
  Sparkles, 
  Mail, 
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Loader
} from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  
  // Resume upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  
  // Email Integration states
  const [googleConnected, setGoogleConnected] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [connectingOutlook, setConnectingOutlook] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("nima_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await api.uploadResume(formData);
      setParsedData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const connectService = async (service: "google" | "microsoft") => {
    if (service === "google") {
      setConnectingGoogle(true);
      await new Promise(resolve => setTimeout(resolve, 1200));
      setGoogleConnected(true);
      setConnectingGoogle(false);
    } else {
      setConnectingOutlook(true);
      await new Promise(resolve => setTimeout(resolve, 1200));
      setOutlookConnected(true);
      setConnectingOutlook(false);
    }
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold text-white">Profile & Integrations</h1>
        <p className="text-gray-400 mt-1 font-light">Manage your parsed credentials, skills, and email connection portals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left side: User details & OAuth connectors */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-16 w-16 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-full flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-bold text-white">Candidate Workspace</h3>
                <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
              </div>
            </div>
            
            <div className="border-t border-white/5 pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Authorization status</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Valid
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Account Type</span>
                <span className="text-white capitalize">{user?.role}</span>
              </div>
            </div>
          </div>

          {/* Email Intelligence Integration */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Mail className="h-4.5 w-4.5 text-violet-400" />
              Email Sync portals
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed font-light">
              Connect accounts to pull internships, hackathons, and sitemap drives directly into your matches.
            </p>

            <div className="space-y-2">
              {/* Google */}
              <button
                onClick={() => connectService("google")}
                disabled={googleConnected || connectingGoogle}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                  googleConnected 
                    ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-white/5 border-white/10 hover:border-white/20 text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  {googleConnected ? <Check className="h-4 w-4" /> : null}
                  Google Sync
                </span>
                {connectingGoogle ? (
                  <Loader className="h-4 w-4 animate-spin text-gray-400" />
                ) : googleConnected ? (
                  "Connected"
                ) : (
                  <span className="text-[10px] text-violet-400 underline">Connect</span>
                )}
              </button>

              {/* Outlook */}
              <button
                onClick={() => connectService("microsoft")}
                disabled={outlookConnected || connectingOutlook}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                  outlookConnected 
                    ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-white/5 border-white/10 hover:border-white/20 text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  {outlookConnected ? <Check className="h-4 w-4" /> : null}
                  Outlook Sync
                </span>
                {connectingOutlook ? (
                  <Loader className="h-4 w-4 animate-spin text-gray-400" />
                ) : outlookConnected ? (
                  "Connected"
                ) : (
                  <span className="text-[10px] text-violet-400 underline">Connect</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right side: Resume Parser & AI Skills */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-400" />
              AI Resume Parser Engine
            </h3>
            <p className="text-sm text-gray-400 font-light leading-relaxed">
              Upload your resume in PDF/DOCX format. NIMA AI parses skills, education, and career achievements to calculate eligibility mapping.
            </p>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-black/20 hover:bg-black/30 transition-colors relative cursor-pointer group">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="h-10 w-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-semibold text-white block">
                    {file ? file.name : "Select Resume File"}
                  </span>
                  <span className="text-xs text-gray-500 block mt-0.5">
                    Supports PDF, DOCX (Max 5MB)
                  </span>
                </div>
              </div>

              {file && (
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-violet-500/10 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Parsing Resume...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Extract Details
                    </>
                  )}
                </button>
              )}
            </form>

            {parsedData && (
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle className="h-4.5 w-4.5" /> Resume Parsed Successfully
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">File Analyzed</div>
                  <div className="text-sm font-bold text-white">{parsedData.fileName}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-gray-500">Extracted Skills ({parsedData.skillsExtracted.length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedData.skillsExtracted.map((skill: string) => (
                      <span key={skill} className="px-2.5 py-1 rounded bg-violet-600/15 text-violet-400 text-xs font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
