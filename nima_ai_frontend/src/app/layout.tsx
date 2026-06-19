import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "NIMA AI - Career Discovery Platform",
  description: "AI-Powered Career Intelligence, Job Engine, and Resume Parser Engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col bg-[#08080C] text-gray-100">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 w-full p-6 md:p-10 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
