"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { AuthService } from "@/utils/auth";
import Button from "@/components/atoms/Button";
import AdminSidebar from "@/components/organisms/AdminSidebar";
import ReportsTab from "@/components/organisms/ReportsTab";
import ScheduleTab from "@/components/organisms/ScheduleTabComponent";
import LineupManagement from "@/components/organisms/LineupManagement";
import UsersTab from "@/components/organisms/UserTabComponent";
import NewsTab from "@/components/organisms/NewsTabComponent";
import MasterDataTab from "@/components/organisms/MasterDataTab";
import BookingHistoryTab from "@/components/organisms/BookingHistoryTab";

// Constants
const DEFAULT_TAB = "booking-history";
const ADMIN_ROLE = "Admin";
const OWNER_ROLE = "Owner";

// Tab configuration
const TAB_COMPONENTS = {
  reports: ReportsTab,
  schedules: ScheduleTab,
  lineup: LineupManagement,
  users: UsersTab,
  news: NewsTab,
  "master-data": MasterDataTab,
  "booking-history": BookingHistoryTab,
} as const;

type TabKey = keyof typeof TAB_COMPONENTS;

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { showError, showSuccess } = useNotifications();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TabKey>(DEFAULT_TAB);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Check admin access
  const checkAdminAccess = useCallback(async () => {
    try {
      const adminStatus = await AuthService.getSession();

      if (user?.role !== ADMIN_ROLE && !adminStatus?.isAdmin) {
        showError("Access Denied", "You don't have admin privileges");
        router.push("/b/auth/login");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin access:", error);
      showError("Error", "Failed to verify admin access");
      router.push("/b/auth/login");
    } finally {
      setLoading(false);
    }
  }, [user, router, showError]);

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user, checkAdminAccess]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    await signOut();
    AuthService.clearSession();
    showSuccess("You have been successfully logged out");
    router.push("/b/auth/login");
  }, [signOut, showSuccess, router]);

  // Toggle mobile sidebar
  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  // Handle tab change with role validation
  const handleTabChange = useCallback(
    (tab: string) => {
      // Validate if tab is valid
      if (!(tab in TAB_COMPONENTS)) {
        setSelectedTab(DEFAULT_TAB);
        return;
      }

      const validTab = tab as TabKey;

      // Only Owner can access Reports
      if (validTab === "reports" && user?.role !== OWNER_ROLE) {
        setSelectedTab(DEFAULT_TAB);
        showError("Access Denied", "Only Owner can access Reports");
        return;
      }

      setSelectedTab(validTab);
      setIsMobileSidebarOpen(false); // Close mobile sidebar on tab change
    },
    [user?.role, showError]
  );

  // Render tab content
  const renderTabContent = useMemo(() => {
    const TabComponent = TAB_COMPONENTS[selectedTab];

    if (!TabComponent) {
      return <BookingHistoryTab />;
    }

    // Special props for ScheduleTab
    if (selectedTab === "schedules") {
      return <TabComponent showError={showError} showSuccess={showSuccess} />;
    }

    return (
      <TabComponent
        showError={function (title: string, message: string): void {
          throw new Error("Function not implemented.");
        }}
        showSuccess={function (message: string): void {
          throw new Error("Function not implemented.");
        }}
      />
    );
  }, [selectedTab, showError, showSuccess]);

  // Loading state
  const isLoading = authLoading || loading;
  const shouldRedirect = !user || !isAdmin;

  if (isLoading || shouldRedirect) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {isLoading ? "Verifying access..." : "Redirecting..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section */}
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleMobileSidebar}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
                aria-label={isMobileSidebarOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileSidebarOpen}
              >
                <svg
                  className="h-6 w-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      isMobileSidebarOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                Dashboard Admin
              </h1>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>

              <Button size="sm" variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
          isMobileOpen={isMobileSidebarOpen}
          onMobileToggle={toggleMobileSidebar}
          userRole={user?.role}
        />

        <main className="flex-1 overflow-y-auto lg:ml-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="animate-fadeIn">{renderTabContent}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
