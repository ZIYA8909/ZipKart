"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  Search, Bell, Sun, Moon, Monitor, ChevronDown,
  ShoppingBag, LogOut, Building2
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { ROLE_COLORS } from "@/lib/constants";

type Theme = "light" | "dark" | "system";

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [theme, setTheme] = useState<Theme>("system");
  const [notifCount] = useState(3);
  
  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isAdmin = session?.user && (session.user as any).role === "ADMIN";

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) || "system";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setActiveDropdown(null);
    setProfileOpen(false);
  }, [pathname]);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") root.classList.add("dark");
    else if (t === "light") root.classList.remove("dark");
    else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  };

  const cycleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  const isActive = (href: string) => {
    if (href === "/overview") return pathname === "/overview";
    return pathname.startsWith(href);
  };

  const analyticsLinks = [
    { label: "Sales Analytics", href: "/analytics/sales" },
    { label: "Revenue Analytics", href: "/analytics/revenue" },
    { label: "User Engagement", href: "/analytics/users" },
    { label: "Product Performance", href: "/analytics/products" },
    { label: "Regional Analysis", href: "/analytics/regional" },
    { label: "Marketing Campaigns", href: "/analytics/marketing" },
  ];

  const workspaceLinks = [
    { label: "Reports", href: "/reports" },
    { label: "Data Import", href: "/data" },
    { label: "Activity Timeline", href: "/activity" },
    { label: "Notifications", href: "/notifications" },
  ];

  const adminLinks = [
    { label: "User Management", href: "/admin/users" },
    { label: "Audit Logs", href: "/admin/activity" },
    { label: "Settings", href: "/admin/settings" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-card/85 backdrop-blur-md px-6 shadow-sm">
      {/* Left section: Logo */}
      <div className="flex items-center gap-6">
        <Link href="/overview" className="flex items-center gap-2 mr-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-brand shadow-md shadow-primary/20">
            <ShoppingBag className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="flex-col leading-none hidden sm:flex">
            <span className="text-sm font-extrabold tracking-tight block">ZipKart</span>
            <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">Marketplace Analytics</span>
          </div>
        </Link>

        {/* Center section: Horizontal Navigation links */}
        <nav ref={dropdownRef} className="hidden md:flex items-center gap-1">
          <Link
            href="/overview"
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition-all hover:bg-accent",
              isActive("/overview") ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Dashboard
          </Link>

          {/* Analytics dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "analytics" ? null : "analytics")}
              className={cn(
                "flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all hover:bg-accent",
                pathname.startsWith("/analytics") ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Analytics
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>
            {activeDropdown === "analytics" && (
              <div 
                className="absolute left-0 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg animate-in z-50"
                style={{ backgroundColor: "hsl(var(--card))" }}
              >
                {analyticsLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "block rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-foreground",
                      isActive(link.href) ? "text-primary bg-primary/5" : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Workspace dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "workspace" ? null : "workspace")}
              className={cn(
                "flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all hover:bg-accent",
                ["/reports", "/data", "/activity", "/notifications"].some(p => pathname.startsWith(p))
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Workspace
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>
            {activeDropdown === "workspace" && (
              <div 
                className="absolute left-0 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg animate-in z-50"
                style={{ backgroundColor: "hsl(var(--card))" }}
              >
                {workspaceLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "block rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-foreground",
                      isActive(link.href) ? "text-primary bg-primary/5" : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Admin dropdown (Admin only) */}
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === "admin" ? null : "admin")}
                className={cn(
                  "flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all hover:bg-accent",
                  pathname.startsWith("/admin") ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Admin
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
              {activeDropdown === "admin" && (
                <div 
                  className="absolute left-0 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg animate-in z-50"
                  style={{ backgroundColor: "hsl(var(--card))" }}
                >
                  {adminLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "block rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-foreground",
                        isActive(link.href) ? "text-primary bg-primary/5" : "text-muted-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Search trigger */}
        <button
          onClick={() => {
            const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
            document.dispatchEvent(event);
          }}
          className="hidden md:flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="ml-2 rounded bg-background border border-border px-1.5 py-0.5 text-[9px] font-medium">⌘K</kbd>
        </button>

        {/* Theme cycle button */}
        <button
          onClick={cycleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="h-4 w-4" />
        </button>

        {/* Notification bell */}
        <Link
          href="/notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Bell className="h-4 w-4" />
          {notifCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white leading-none">
              {notifCount}
            </span>
          )}
        </Link>

        {/* Divider line */}
        <div className="h-6 w-px bg-border/80 hidden sm:block" />

        {/* User profile dropdown */}
        {session?.user && (
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background p-0.5 transition-all"
            >
              <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary text-white text-xs font-bold shadow-sm">
                {getInitials(session.user.name || "")}
              </div>
            </button>

            {profileOpen && (
              <div 
                className="absolute right-0 mt-2.5 w-56 rounded-lg border border-border bg-card p-1 shadow-lg animate-in z-50"
                style={{ backgroundColor: "hsl(var(--card))" }}
              >
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-xs font-semibold truncate text-foreground">{session.user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{session.user.email}</p>
                  
                  {/* Role indicator */}
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className={cn(
                      "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase",
                      ROLE_COLORS[(session.user as any).role as keyof typeof ROLE_COLORS] || ROLE_COLORS.VIEWER
                    )}>
                      {(session.user as any).role || "Viewer"}
                    </span>
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold bg-muted text-muted-foreground border border-border">
                      ZipKart Ltd
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
