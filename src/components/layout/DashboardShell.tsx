"use client";

import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/layout/CommandPalette";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <CommandPalette />
        <main className="pt-14 min-h-screen">
          <div className="p-6 h-full max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
