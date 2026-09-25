import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "ARENA - AI Workforce Operating System",
  description: "Autonomous multi-agent orchestration & LLM evaluation platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#08090d] text-[#f4f4f6] selection:bg-blue-500/20 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
