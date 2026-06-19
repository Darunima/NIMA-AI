import AppShell from "@/components/layout/AppShell";
import "@/styles/globals.css";

export const metadata = {
  title: "NIMA AI",
  description: "Autonomous Career Intelligence Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col bg-[#08080C] text-gray-100">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
