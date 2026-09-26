import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "ARENA - AI Workforce",
  description: "Enterprise multi-agent orchestration and evaluation platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-black text-[#ededed] selection:bg-white/20">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
