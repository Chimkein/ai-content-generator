"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme-provider";
import {
  House,
  PlusCircle,
  ClockCounterClockwise,
  ChartBar,
  GearSix,
  PencilLine,
  List,
  X,
  SignOut,
  Sun,
  Moon,
  Desktop,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/app", label: "Dashboard", icon: House },
  { href: "/app/create", label: "Create", icon: PlusCircle },
  { href: "/app/history", label: "History", icon: ClockCounterClockwise },
  { href: "/app/analytics", label: "Analytics", icon: ChartBar },
  { href: "/app/settings", label: "Settings", icon: GearSix },
];

interface AppSidebarProps {
  user: User | null;
}

const themeOptions = [
  { value: "light" as const, icon: Sun },
  { value: "system" as const, icon: Desktop },
  { value: "dark" as const, icon: Moon },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials =
    user?.user_metadata?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() ?? "?";

  const navLinks = (onClick?: () => void) =>
    navItems.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          pathname === item.href
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <item.icon className="h-4 w-4" weight={pathname === item.href ? "fill" : "regular"} />
        {item.label}
      </Link>
    ));

  const themeToggle = (
    <div className="flex items-center gap-0.5 rounded-md bg-muted p-1">
      {themeOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={cn(
            "flex items-center justify-center rounded-sm p-1.5 transition-colors",
            theme === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <opt.icon className="h-3.5 w-3.5" weight={theme === opt.value ? "fill" : "regular"} />
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b bg-background/90 backdrop-blur-sm px-4 h-14 md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PencilLine className="h-3.5 w-3.5" weight="fill" />
          </div>
          <span className="font-heading text-sm font-semibold tracking-tight">AI Content Gen</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <List className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile nav drawer */}
      <nav
        className={cn(
          "fixed top-14 left-0 right-0 z-30 border-b bg-background p-4 md:hidden transition-all",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <div className="flex flex-col gap-1">
          {navLinks(() => setMobileOpen(false))}
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            {themeToggle}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <SignOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-sidebar">
        <div className="flex items-center gap-2.5 px-4 h-14 border-b">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PencilLine className="h-3.5 w-3.5" weight="fill" />
          </div>
          <span className="font-heading text-sm font-semibold tracking-tight">AI Content Gen</span>
        </div>
        <nav className="flex-1 flex flex-col gap-0.5 p-3">{navLinks()}</nav>
        <div className="px-3 pb-2">{themeToggle}</div>
        <div className="border-t p-3">
          <div className="flex items-center gap-3 px-1">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-heading">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.user_metadata?.full_name ?? "User"}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <SignOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Spacer for mobile top bar */}
      <div className="h-14 md:hidden" />
    </>
  );
}
