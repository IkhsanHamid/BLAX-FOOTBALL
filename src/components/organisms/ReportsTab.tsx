"use client";

import React, { useState, useEffect } from "react";
import { Calendar, CreditCard, RefreshCw, Filter } from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent } from "../atoms/Card";
import { useNotifications } from "./NotificationContainer";
import ScheduleReportTab from "./ScheduleReportTab";
import { masterDataService } from "@/utils/masterData";
import MembershipReportTab from "./MembershipTabReport";

// ========================================
// TYPE DEFINITIONS
// ========================================

interface Venue {
  id: string;
  name: string;
  address?: string;
}

type TabType = "schedules" | "membership";

// ========================================
// MAIN REPORTS TAB COMPONENT
// ========================================

export default function ReportsTab(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>("schedules");
  const [loading, setLoading] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<string>("7d");
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Venue filter states (for schedules tab)
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [loadingVenues, setLoadingVenues] = useState<boolean>(false);

  // Get default date range (last 7 days)
  const getDefaultDates = (): { startDate: string; endDate: string } => {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      startDate: sevenDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  };

  const [startDate, setStartDate] = useState<string>(
    getDefaultDates().startDate,
  );
  const [endDate, setEndDate] = useState<string>(getDefaultDates().endDate);

  const { showError } = useNotifications();

  // Fetch venues for filter
  const fetchVenues = async (): Promise<void> => {
    setLoadingVenues(true);
    try {
      const venuesData = await masterDataService.getVenues();
      setVenues(venuesData || []);
    } catch (error: any) {
      console.error("Error fetching venues:", error);
      showError("Error", "Gagal memuat daftar venue");
    } finally {
      setLoadingVenues(false);
    }
  };

  // Initial load - fetch venues
  useEffect(() => {
    fetchVenues();
  }, []);

  const handleDateRangeChange = (range: string): void => {
    setDateRange(range);

    if (range !== "custom") {
      const today = new Date();
      let newStartDate: Date;

      switch (range) {
        case "7d":
          newStartDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          newStartDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          newStartDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          newStartDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      setStartDate(newStartDate.toISOString().split("T")[0]);
      setEndDate(today.toISOString().split("T")[0]);
    }
  };

  const handleRefresh = (): void => {
    setLoading(true);
    // Increment refresh key to force child component remount
    setRefreshKey((prev) => prev + 1);
    // Reset loading after short delay
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laporan</h2>
          <p className="text-gray-600 mt-1">
            Analisis performa dan statistik platform booking
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("schedules")}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === "schedules"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Laporan Jadwal</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("membership")}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === "membership"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>History Membership</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="pt-4 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rentang Tanggal
              </label>
              <select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">7 hari terakhir</option>
                <option value="30d">30 hari terakhir</option>
                <option value="90d">90 hari terakhir</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Venue Filter - Only show for Schedules tab */}
            {activeTab === "schedules" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Venue
                </label>
                <select
                  value={selectedVenueId}
                  onChange={(e) => setSelectedVenueId(e.target.value)}
                  disabled={loadingVenues}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Venue</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Empty div for spacing when venue filter is hidden */}
            {activeTab === "membership" && <div></div>}

            <div className="flex items-end">
              <Button
                variant="primary"
                size="md"
                onClick={handleRefresh}
                disabled={loading || !startDate || !endDate}
                className="w-full flex items-center justify-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                {loading ? "Memfilter..." : "Terapkan Filter"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === "schedules" ? (
        <ScheduleReportTab
          key={`schedule-${refreshKey}`}
          startDate={startDate}
          endDate={endDate}
          venueId={selectedVenueId}
        />
      ) : (
        <MembershipReportTab
          key={`membership-${refreshKey}`}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
}
