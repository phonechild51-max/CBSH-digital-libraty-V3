"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  FileText,
  ClipboardList,
  Megaphone,
  User,
  Upload,
  FolderOpen,
  PenSquare,
  ListChecks,
  BookOpen,
  Download,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/lib/constants";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  section?: string;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, section: "OVERVIEW" },
    { label: "Approve Users", href: "/admin/approve-users", icon: UserCheck, section: "MANAGEMENT" },
    { label: "View Materials", href: "/admin/materials", icon: FileText },
    { label: "View Quizzes", href: "/admin/quizzes", icon: ClipboardList },
    { label: "Announcements", href: "/admin/announcements", icon: Megaphone, section: "SYSTEM" },
    { label: "My Profile", href: "/admin/profile", icon: User },
  ],
  teacher: [
    { label: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard, section: "OVERVIEW" },
    { label: "Upload Material", href: "/teacher/upload", icon: Upload, section: "CONTENT" },
    { label: "My Materials", href: "/teacher/materials", icon: FolderOpen },
    { label: "Create Quiz", href: "/teacher/create-quiz", icon: PenSquare },
    { label: "My Quizzes", href: "/teacher/quizzes", icon: ListChecks },
    { label: "My Profile", href: "/teacher/profile", icon: User, section: "SYSTEM" },
  ],
  student: [
    { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard, section: "OVERVIEW" },
    { label: "Browse Materials", href: "/student/materials", icon: BookOpen, section: "LEARNING" },
    { label: "Downloads & Bookmarks", href: "/student/downloads", icon: Download },
    { label: "Available Quizzes", href: "/student/quizzes", icon: GraduationCap },
    { label: "My Profile", href: "/student/profile", icon: User, section: "SYSTEM" },
  ],
};

interface SidebarProps {
  role: UserRole;
  pendingCount?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ role, pendingCount = 0, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const items = NAV_ITEMS[role] || [];

  // Inject pending count badge on Approve Users
  const navItems = items.map((item) => {
    if (item.label === "Approve Users" && pendingCount > 0) {
      return { ...item, badge: pendingCount };
    }
    return item;
  });

  const sidebarWidth = collapsed && !isMobile ? "72px" : "260px";

  // Group items by section
  let lastSection = "";

  const sidebarContent = (
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: "var(--color-bg-sidebar)",
        borderRight: "1px solid var(--color-border-divider)",
        width: isMobile ? "280px" : sidebarWidth,
        transition: "width 0.2s ease",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 h-16">
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden bg-white flex items-center justify-center p-0.5"
              style={{
                border: "1px solid var(--color-accent-amber)",
              }}
            >
              <Image src="/logo.jpg" alt="CBSH Logo" width={36} height={36} className="w-full h-full object-contain" />
            </div>
            <div>
              <span
                className="text-sm font-bold block"
                style={{ color: "var(--color-accent-amber)", fontFamily: "var(--font-display)" }}
              >
                CBSH Library
              </span>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Digital Library
              </span>
            </div>
          </div>
        )}
        {collapsed && !isMobile && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto overflow-hidden bg-white p-0.5"
            style={{
              border: "1px solid var(--color-accent-amber)",
            }}
          >
            <Image src="/logo.jpg" alt="CBSH Logo" width={36} height={36} className="w-full h-full object-contain" />
          </div>
        )}
        {isMobile && (
          <button 
            onClick={onClose} 
            className="p-1" 
            style={{ color: "var(--color-text-secondary)" }}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;

          return (
            <div key={item.href}>
              {showSection && (!collapsed || isMobile) && (
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mt-5 mb-2 px-3"
                  style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}
                >
                  {item.section}
                </p>
              )}
              {showSection && collapsed && !isMobile && (
                <div className="my-3 mx-3">
                  <div className="h-px" style={{ backgroundColor: "var(--color-border-divider)" }} />
                </div>
              )}

              {collapsed && !isMobile ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={() => isMobile && onClose()}
                      className="flex items-center justify-center p-3 rounded-xl mb-1 transition-all duration-150 relative"
                      style={{
                        backgroundColor: isActive ? "var(--color-accent-amber-glow)" : "transparent",
                        borderLeft: isActive ? "3px solid var(--color-accent-amber)" : "3px solid transparent",
                      }}
                    >
                      <item.icon
                        size={20}
                        style={{
                          color: isActive ? "var(--color-accent-amber)" : "var(--color-text-secondary)",
                        }}
                      />
                      {item.badge && item.badge > 0 && (
                        <span
                          className="absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                          style={{ backgroundColor: "var(--color-danger)", color: "#fff" }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => isMobile && onClose()}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-150"
                  style={{
                    backgroundColor: isActive ? "var(--color-accent-amber-glow)" : "transparent",
                    borderLeft: isActive ? "3px solid var(--color-accent-amber)" : "3px solid transparent",
                  }}
                >
                  <item.icon
                    size={20}
                    style={{
                      color: isActive ? "var(--color-accent-amber)" : "var(--color-text-secondary)",
                    }}
                  />
                  <span
                    className="text-sm font-medium flex-1"
                    style={{
                      color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                    }}
                  >
                    {item.label}
                  </span>
                  {item.badge && item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full px-1.5"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse Toggle — Desktop only */}
      {!isMobile && (
        <div className="px-3 py-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl transition-colors duration-150"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-card)",
              color: "var(--color-text-secondary)",
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      )}


    </div>
  );

  // Mobile Drawer
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
        )}
        {/* Drawer */}
        <div
          className="fixed inset-y-0 left-0 z-50 transition-transform duration-300"
          style={{
            transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          }}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop
  return <aside className="hidden lg:block flex-shrink-0">{sidebarContent}</aside>;
}
