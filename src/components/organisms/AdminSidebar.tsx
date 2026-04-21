"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Calendar,
  Users,
  Newspaper,
  Database,
  History,
  Shield,
  Image,
  Clock,
  Trophy,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortLabel?: string;
  children?: NavItem[];
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
  { id: "users", label: "Member", icon: Users },
  { id: "news", label: "Berita", icon: Newspaper },
  { id: "gallery", label: "Galeri", icon: Image },
  { id: "reschedule", label: "Reschedule", icon: Clock },
  {
    id: "master-data",
    label: "Master Data",
    icon: Database,
    shortLabel: "Master",
  },
  // ─── Event tab dengan child ───────────────────────────────────────────────
  {
    id: "event",
    label: "Event",
    icon: Trophy,
    children: [
      {
        id: "event-kelola",
        label: "Kelola Event",
        icon: Trophy,
      },
      // Tambah child lain di sini jika diperlukan, contoh:
      { id: "event-team", label: "Kelola Team", icon: Shield },
    ],
  },
  // ─────────────────────────────────────────────────────────────────────────
  { id: "reports", label: "Laporan", icon: BarChart3 },
];

// Items that Admin-magnifico cannot access
const MAGNIFICO_RESTRICTED = [
  "users",
  "news",
  "reschedule",
  "master-data",
  "event-kelola",
  "event",
  "event-team",
];

export default function AdminSidebar({
  selectedTab,
  onTabChange,
  isMobileOpen,
  onMobileToggle,
  userRole,
}: AdminSidebarProps) {
  const isMagnifico = userRole === "Admin-magnifico";

  // Track which parent menus are expanded
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    () => {
      // Auto-expand "event" group if a child is currently active
      const eventChildIds = ["event-kelola"];
      return { event: eventChildIds.includes(selectedTab) };
    },
  );

  // Sync expansion when selectedTab changes externally
  useEffect(() => {
    const eventChildIds = ["event-kelola"];
    if (eventChildIds.includes(selectedTab)) {
      setExpandedItems((prev) => ({ ...prev, event: true }));
    }
  }, [selectedTab]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) onMobileToggle();
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileOpen) onMobileToggle();
    };

    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleResize);

    document.body.style.overflow = isMobileOpen ? "hidden" : "";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = "";
    };
  }, [isMobileOpen, onMobileToggle]);

  const handleNavClick = (itemId: string) => {
    onTabChange(itemId);
    if (window.innerWidth < 1024) onMobileToggle();
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const filteredNavItems = navItems.filter((item) => {
    if (item.id === "reports")
      return userRole === "Owner" || userRole === "Admin-magnifico";
    if (isMagnifico && MAGNIFICO_RESTRICTED.includes(item.id)) return false;
    return true;
  });

  // Check if any child of an item is active
  const isChildActive = (item: NavItem) =>
    item.children?.some((c) => c.id === selectedTab) ?? false;

  return (
    <>
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-40 lg:translate-x-0 w-64 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="navigation"
        aria-label="Admin navigation"
        aria-expanded={isMobileOpen}
      >
        <div className="h-full flex flex-col overflow-hidden">
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 pt-20 lg:pt-4">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = selectedTab === item.id;
              const hasChildren = !!item.children?.length;
              const isExpanded = expandedItems[item.id];
              const childActive = isChildActive(item);

              // ── Parent with children ──────────────────────────────────────
              if (hasChildren) {
                return (
                  <div key={item.id}>
                    {/* Parent button */}
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                        childActive
                          ? "bg-sky-50 text-sky-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon
                          className={`h-5 w-5 flex-shrink-0 ${
                            childActive ? "text-sky-600" : "text-gray-500"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                    </button>

                    {/* Children */}
                    {isExpanded && (
                      <div className="mt-1 ml-4 pl-4 border-l-2 border-gray-100 space-y-1">
                        {item.children!.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildSelected = selectedTab === child.id;
                          return (
                            <button
                              key={child.id}
                              onClick={() => handleNavClick(child.id)}
                              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 text-sm ${
                                isChildSelected
                                  ? "bg-sky-50 text-sky-700 font-medium shadow-sm"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                              aria-current={
                                isChildSelected ? "page" : undefined
                              }
                            >
                              <ChildIcon
                                className={`h-4 w-4 flex-shrink-0 ${
                                  isChildSelected
                                    ? "text-sky-600"
                                    : "text-gray-400"
                                }`}
                              />
                              <span className="truncate">{child.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // ── Regular item ─────────────────────────────────────────────
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                    isActive
                      ? "bg-sky-50 text-sky-700 font-medium shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      isActive ? "text-sky-600" : "text-gray-500"
                    }`}
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
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onMobileToggle}
          aria-hidden="true"
          role="button"
          tabIndex={-1}
        />
      )}
    </>
  );
}
