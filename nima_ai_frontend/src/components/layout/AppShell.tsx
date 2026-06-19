"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/useAuth";

const PUBLIC_ROUTES = ["/", "/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const ready = useAuth();

  if (!isPublic && !ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#08080C]">
        <div className="h-8 w-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 w-full p-6 md:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  );
}
