"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Briefcase, 
  Newspaper, 
  Bookmark, 
  UserCircle, 
  MessageSquare, 
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("nima_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Opportunities", href: "/opportunities", icon: Briefcase },
    { name: "News Intelligence", href: "/news", icon: Newspaper },
    { name: "Saved Bookmarks", href: "/bookmarks", icon: Bookmark },
    { name: "NIMA Assistant", href: "/chat", icon: MessageSquare },
    { name: "Candidate Profile", href: "/profile", icon: UserCircle },
  ];

  if (user?.role === "admin") {
    navItems.push({ name: "Scraper Control", href: "/admin", icon: Settings });
  }

  // Do not show sidebar on landing page or login page
  if (pathname === "/" || pathname === "/login") return null;

  return (
    <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-md hidden md:flex flex-col p-6 space-y-8 min-h-[calc(100vh-73px)]">
      <div className="flex flex-col space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-violet-600/10 text-violet-400 border-l-2 border-violet-500" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-violet-400" : "text-gray-400")} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-violet-950/20 to-fuchsia-950/20 border border-violet-500/10 flex flex-col gap-2">
        <div className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Storage Status</div>
        <div className="text-sm font-bold text-white">MongoDB Atlas</div>
        <div className="text-[11px] text-gray-400">11 Active Collections Configured.</div>
      </div>
    </aside>
  );
}
