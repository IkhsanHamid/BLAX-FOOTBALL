"use client";

import React, { useEffect, useState } from "react";
import {
  History,
  Calendar,
  CheckSquare,
  Shield,
  Users,
  Newspaper,
  Image,
  Clock,
  Database,
  Trophy,
  Wallet,
  Undo2,
  BarChart3,
  Zap,
  UserPlus,
  Swords,
  ClipboardCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
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
  onCollapsedChange?: (collapsed: boolean) => void;
}

const navItems: NavItem[] = [
  {
    id: "booking-history",
    label: "Booking History",
    icon: History,
    shortLabel: "History",
  },
  {
    id: "schedules",
    label: "Jadwal",
    icon: Calendar,
    children: [
      { id: "schedules", label: "Kelola Jadwal", icon: Calendar },
      { id: "schedule-matches", label: "Jadwal Match", icon: Swords },
    ],
  },
  {
    id: "schedule-verification",
    label: "Verifikasi Jadwal",
    icon: CheckSquare,
  },
  {
    id: "lineup",
    label: "Lineup",
    icon: Shield,
    children: [
      { id: "lineup", label: "Kelola Lineup", icon: Shield },
      { id: "lineup-kehadiran", label: "Kehadiran (BETA)", icon: ClipboardCheck },
    ],
  },
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
  {
    id: "event",
    label: "Event",
    icon: Trophy,
    children: [
      { id: "event-kelola", label: "Kelola Event", icon: Trophy },
      { id: "event-team", label: "Kelola Team", icon: Shield },
      { id: "event-bracket", label: "Bracket & Score", icon: Swords },
    ],
  },
  { id: "deposit", label: "Deposit", icon: Wallet },
  { id: "refund", label: "Refund", icon: Undo2 },
  {
    id: "akses-cepat",
    label: "Akses Cepat",
    icon: Zap,
    shortLabel: "Cepat",
    children: [
      { id: "membership-access", label: "Akses Membership", icon: UserPlus },
    ],
  },
  { id: "reports", label: "Laporan", icon: BarChart3 },
];

const RESTRICTED = [
  "users",
  "news",
  "reschedule",
  "master-data",
  "deposit",
];

export default function AdminSidebar({
  selectedTab,
  onTabChange,
  isMobileOpen,
  onMobileToggle,
  userRole,
  onCollapsedChange,
}: AdminSidebarProps) {
  const isMagnifico = userRole === "Admin-magnifico";
  const isRedAlert = userRole === "Admin-red-alert";
  const isOTS = userRole === "Admin-OTS";
  const isAyo = userRole === "Admin-Ayo";
  const isNewsOnly = userRole === "Admin-news";
  const isSubAdmin = userRole === "Sub-Admin";
  const isSubAdmin1 = userRole === "Sub-Admin-1";
  const isCoAdmin = userRole === "Co-Admin";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    () => {
      const eventChildIds = ["event-kelola", "event-team", "event-bracket"];
      const aksesCepatIds = ["membership-access"];
      const lineupChildIds = ["lineup", "lineup-kehadiran"];
      const scheduleChildIds = ["schedules", "schedule-matches"];
      return {
        event: eventChildIds.includes(selectedTab),
        "akses-cepat": aksesCepatIds.includes(selectedTab),
        lineup: lineupChildIds.includes(selectedTab),
        schedules: scheduleChildIds.includes(selectedTab),
      };
    },
  );

  useEffect(() => {
    const eventChildIds = ["event-kelola", "event-team", "event-bracket"];
    const aksesCepatIds = ["membership-access"];
    const lineupChildIds = ["lineup", "lineup-kehadiran"];
    const scheduleChildIds = ["schedules", "schedule-matches"];
    if (eventChildIds.includes(selectedTab)) {
      setExpandedItems((prev) => ({ ...prev, event: true }));
    }
    if (aksesCepatIds.includes(selectedTab)) {
      setExpandedItems((prev) => ({ ...prev, "akses-cepat": true }));
    }
    if (lineupChildIds.includes(selectedTab)) {
      setExpandedItems((prev) => ({ ...prev, lineup: true }));
    }
    if (scheduleChildIds.includes(selectedTab)) {
      setExpandedItems((prev) => ({ ...prev, schedules: true }));
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

  const handleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    onCollapsedChange?.(next);
    // Collapse semua expanded item saat sidebar diciutkan
    if (next) setExpandedItems({});
  };

  const handleNavClick = (itemId: string) => {
    onTabChange(itemId);
    if (window.innerWidth < 1024) onMobileToggle();
  };

  const toggleExpand = (itemId: string) => {
    // Jika collapsed, expand dulu sidebar-nya
    if (isCollapsed) {
      setIsCollapsed(false);
      onCollapsedChange?.(false);
      setExpandedItems({ [itemId]: true });
      return;
    }
    setExpandedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const filteredNavItems = (() => {
    let items = navItems;
    if (isSubAdmin) {
      items = navItems.filter((item) =>
        item.id === "lineup" || item.id === "schedules",
      ).map((item) => {
        if (item.id === "schedules" && item.children) {
          return {
            ...item,
            children: item.children.filter((c) => c.id === "schedule-matches"),
          };
        }
        return item;
      });
      return items;
    }
    if (isSubAdmin1) {
      const subAdmin1Ids = [
        "booking-history",
        "lineup",
        "reschedule",
        "event",
        "refund",
      ];
      return navItems.filter((item) => subAdmin1Ids.includes(item.id)).map((item) => {
        if (item.id === "lineup" && item.children) {
          return {
            ...item,
            children: item.children.filter((c) => c.id !== "lineup-kehadiran"),
          };
        }
        return item;
      });
    }
    if (isCoAdmin) {
      const coAdminIds = [
        "booking-history",
        "schedules",
        "schedule-verification",
        "lineup",
        "gallery",
        "event",
        "reports",
      ];
      return navItems.filter((item) => coAdminIds.includes(item.id));
    }
    return items.filter((item) => {
    if (isNewsOnly) return item.id === "news";
    if (item.id === "reports")
      return (
        userRole === "Owner" ||
        userRole === "Admin-magnifico" ||
        userRole === "Admin-red-alert" ||
        userRole === "Admin-OTS" ||
        userRole === "Admin-Ayo" ||
        userRole === "Co-Admin"
      );
    if (item.id === "refund")
      return userRole === "Admin" || userRole === "Owner";
    if (item.id === "akses-cepat")
      return userRole === "Admin" || userRole === "Owner";
    if (
      (isMagnifico || isRedAlert || isOTS || isAyo) &&
      RESTRICTED.includes(item.id)
    )
      return false;
    return true;
  }).map((item) => {
    // Kehadiran (BETA) — kecuali Admin-news
    if (item.id === "lineup" && item.children && userRole === "Admin-news") {
      return {
        ...item,
        children: item.children.filter((c) => c.id !== "lineup-kehadiran"),
      };
    }
    return item;
  });
  })();

  const isChildActive = (item: NavItem) =>
    item.children?.some((c) => c.id === selectedTab) ?? false;

  const sidebarWidth = isCollapsed ? "w-16" : "w-64";

  return (
    <>
      {/* Desktop sidebar — fixed, tidak ikut scroll */}
      <aside
        className={`hidden lg:flex fixed top-16 left-0 h-[calc(100vh-4rem)] flex-col bg-white border-r border-gray-200 z-40 transition-all duration-300 ease-in-out ${sidebarWidth} overflow-hidden`}
      >
        {/* Collapse toggle button */}
        <div
          className={`flex items-center h-12 border-b border-gray-100 px-3 flex-shrink-0 ${isCollapsed ? "justify-center" : "justify-end"}`}
        >
          <button
            onClick={handleCollapse}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5 px-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = selectedTab === item.id;
            const hasChildren = !!item.children?.length;
            const isExpanded = expandedItems[item.id];
            const childActive = isChildActive(item);

            if (hasChildren) {
              return (
                <div key={item.id}>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center px-2 py-2.5 rounded-lg text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isCollapsed ? "justify-center" : "justify-between"
                    } ${
                      childActive
                        ? "bg-sky-50 text-sky-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div
                      className={`flex items-center ${isCollapsed ? "" : "space-x-3"}`}
                    >
                      <Icon
                        className={`h-5 w-5 flex-shrink-0 ${childActive ? "text-sky-600" : "text-gray-500"}`}
                      />
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>
                    {!isCollapsed &&
                      (isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      ))}
                  </button>

                  {!isCollapsed && isExpanded && (
                    <div className="mt-0.5 ml-4 pl-3 border-l-2 border-gray-100 space-y-0.5">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildSelected = selectedTab === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleNavClick(child.id)}
                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm ${
                              isChildSelected
                                ? "bg-sky-50 text-sky-700 font-medium shadow-sm"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                            aria-current={isChildSelected ? "page" : undefined}
                          >
                            <ChildIcon
                              className={`h-4 w-4 flex-shrink-0 ${isChildSelected ? "text-sky-600" : "text-gray-400"}`}
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

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center px-2 py-2.5 rounded-lg text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isCollapsed ? "justify-center" : "space-x-3"
                } ${
                  isActive
                    ? "bg-sky-50 text-sky-700 font-medium shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-sky-600" : "text-gray-500"}`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile sidebar — slide in dari kiri */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-40 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col overflow-hidden">
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 pt-20">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = selectedTab === item.id;
              const hasChildren = !!item.children?.length;
              const isExpanded = expandedItems[item.id];
              const childActive = isChildActive(item);

              if (hasChildren) {
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        childActive
                          ? "bg-sky-50 text-sky-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon
                          className={`h-5 w-5 flex-shrink-0 ${childActive ? "text-sky-600" : "text-gray-500"}`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="mt-1 ml-4 pl-4 border-l-2 border-gray-100 space-y-1">
                        {item.children!.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildSelected = selectedTab === child.id;
                          return (
                            <button
                              key={child.id}
                              onClick={() => handleNavClick(child.id)}
                              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left text-sm ${
                                isChildSelected
                                  ? "bg-sky-50 text-sky-700 font-medium"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              <ChildIcon
                                className={`h-4 w-4 flex-shrink-0 ${isChildSelected ? "text-sky-600" : "text-gray-400"}`}
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

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    isActive
                      ? "bg-sky-50 text-sky-700 font-medium shadow-sm"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-sky-600" : "text-gray-500"}`}
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
        />
      )}
    </>
  );
}
