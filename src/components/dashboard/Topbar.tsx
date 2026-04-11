"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationPanel } from "./NotificationPanel";
import {
  Sun,
  Moon,
  Bell,
  Menu,
  LogOut,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
  supabaseUserId?: string;
  role?: string;
}

export function Topbar({ title, onMenuClick, supabaseUserId, role }: TopbarProps) {
  const { theme, toggle } = useTheme();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { notifications, unreadCount, markAllRead } = useNotifications(supabaseUserId);
  const [showNotifications, setShowNotifications] = useState(false);

  const displayName = user?.firstName || user?.fullName || "User";
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";
  const profileHref = role ? `/${role}/profile` : "#";

  return (
    <header
      className="h-16 flex items-center justify-between px-4 lg:px-6 relative"
      style={{
        backgroundColor: "var(--color-bg-app)",
        borderBottom: "1px solid var(--color-border-divider)",
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>
        <h1
          className="text-lg font-semibold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text-heading)",
          }}
        >
          {title}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
          style={{
            color: "var(--color-accent-amber)",
            backgroundColor: "transparent",
          }}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg relative transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ backgroundColor: "var(--color-danger)", color: "#fff" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={markAllRead}
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-card)]">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: "var(--color-accent-amber-glow)",
                  color: "var(--color-accent-amber)",
                  border: "1px solid var(--color-accent-amber)",
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 p-2"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-card)",
            }}
          >
            <div className="px-2 py-2 mb-1">
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                {displayName}
              </p>
              {roleLabel && (
                <Badge
                  className="text-[10px] px-1.5 py-0 font-medium mt-1"
                  style={{
                    backgroundColor: "var(--color-accent-amber-subtle)",
                    color: "var(--color-accent-amber)",
                    border: "1px solid var(--color-accent-amber)",
                  }}
                >
                  {roleLabel}
                </Badge>
              )}
            </div>
            <DropdownMenuSeparator style={{ backgroundColor: "var(--color-border-divider)" }} />
            <DropdownMenuItem
              asChild
              className="cursor-pointer rounded-lg"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <Link href={profileHref} className="flex items-center gap-2">
                <User size={16} />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="cursor-pointer rounded-lg"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <button onClick={toggle} className="flex items-center gap-2 w-full">
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                Theme: {theme === "dark" ? "Dark" : "Light"}
              </button>
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ backgroundColor: "var(--color-border-divider)" }} />
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              style={{ color: "var(--color-danger)" }}
              onClick={() => signOut()}
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
