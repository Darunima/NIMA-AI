"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Send, Sparkles, MessageSquare, Loader } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am NIMA AI, your autonomous career assistant. Ask me questions about job recommendations, active sitemap sources, or resumes!"
    }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setSending(true);

    try {
      // Build history payload
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const result = await api.chat(userMessage, history);
      
      setMessages(prev => [...prev, { role: "assistant", content: result.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: "Error communicating with AI model. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-extrabold text-white">NIMA Assistant</h1>
        <p className="text-gray-400 mt-1 font-light">Interact with your resume parser context, matching jobs, and news summaries.</p>
      </div>

      <div className="flex-1 glass-panel border border-white/5 rounded-3xl p-6 flex flex-col justify-between overflow-hidden">
        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3.5 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                m.role === "user" 
                  ? "bg-violet-600 text-white" 
                  : "bg-violet-950 text-violet-300 border border-violet-500/20"
              }`}>
                {m.role === "user" ? "U" : "AI"}
              </div>

              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-violet-600 text-white font-medium rounded-tr-none"
                  : "bg-white/5 border border-white/5 text-gray-200 rounded-tl-none font-light"
              }`}>
                {/* Basic rendering of newlines for formatted responses */}
                {m.content.split("\n").map((line, i) => (
                  <p key={i} className={line ? "mb-2 last:mb-0" : "h-2"}>{line}</p>
                ))}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex items-start gap-3.5 max-w-[85%]">
              <div className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center bg-violet-950 text-violet-300 border border-violet-500/20">
                AI
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-gray-400 rounded-tl-none text-sm flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin text-violet-400" />
                Thinking...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Form Input */}
        <form onSubmit={handleSend} className="flex gap-3 pt-4 border-t border-white/5 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="Ask about recommendations or query sitemaps..."
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="p-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl shadow-lg shadow-violet-500/10 transition-all disabled:opacity-50 disabled:bg-violet-600 shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
