"use client";

import React, { useEffect } from "react";
import {
  BarChart3,
  Calendar,
  Users,
  Newspaper,
  Database,
  History,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/helper";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortLabel?: string;
}

interface AdminSidebarProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
  userRole?: string;
}

const navItems: NavItem[] = [
  {
    id: "booking-history",
    label: "Booking History",
    icon: History,
    shortLabel: "History",
  },
  { id: "schedules", label: "Jadwal", icon: Calendar },
  { id: "lineup", label: "Lineup", icon: Shield },
  { id: "users", label: "Pengguna", icon: Users },
  { id: "news", label: "Berita", icon: Newspaper },
  {
    id: "master-data",
    label: "Master Data",
    icon: Database,
    shortLabel: "Master",
  },
  { id: "reports", label: "Laporan", icon: BarChart3 },
];

export default function AdminSidebar({
  selectedTab,
  onTabChange,
  isMobileOpen,
  onMobileToggle,
  userRole,
}: AdminSidebarProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        onMobileToggle();
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileOpen) {
        onMobileToggle();
      }
    };

    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleResize);

    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = "";
    };
  }, [isMobileOpen, onMobileToggle]);

  const handleNavClick = (itemId: string) => {
    onTabChange(itemId);
    if (window.innerWidth < 1024) {
      onMobileToggle();
    }
  };

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter((item) => {
    // Only Owner can access reports
    if (item.id === "reports") {
      return userRole === "Owner";
    }
    return true;
  });

  return (
    <>
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-40",
          "lg:translate-x-0 w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="navigation"
        aria-label="Admin navigation"
        aria-expanded={isMobileOpen}
      >
        <div className="h-full flex flex-col">
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = selectedTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2",
                    isActive
                      ? "bg-sky-50 text-sky-700 font-medium shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isActive ? "text-sky-600" : "text-gray-500"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 animate-fadeIn"
          onClick={onMobileToggle}
          aria-hidden="true"
          role="button"
          tabIndex={-1}
        />
      )}
    </>
  );
}
