"use client";

import React, { useState, useEffect } from "react";
import { Calendar, CreditCard, RefreshCw, Filter, Users } from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent } from "../atoms/Card";
import { useNotifications } from "./NotificationContainer";
import ScheduleReportTab from "./ScheduleReportTab";
import { masterDataService } from "@/utils/masterData";
import MembershipReportTab from "./MembershipTabReport";
import MemberStatisticTab from "./MemberStatsTab";

interface Venue {
  id: string;
  name: string;
  address?: string;
}

type TabType = "schedules" | "membership" | "member-statistic";

interface ReportsTabProps {
  userRole?: string;
}

export default function ReportsTab({ userRole }: ReportsTabProps): JSX.Element {
  const isMagnifico = userRole === "Admin-magnifico";

  const [activeTab, setActiveTab] = useState<TabType>("schedules");
  const [loading, setLoading] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<string>("7d");
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [appliedVenueId, setAppliedVenueId] = useState<string>("");
  const [loadingVenues, setLoadingVenues] = useState<boolean>(false);

  const getDefaultDates = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      startDate: sevenDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  };

  const defaults = getDefaultDates();

  // ── Draft state: apa yang user ubah di input, belum di-apply ──────────────
  const [draftStartDate, setDraftStartDate] = useState<string>(
    defaults.startDate,
  );
  const [draftEndDate, setDraftEndDate] = useState<string>(defaults.endDate);

  // ── Applied state: yang benar-benar dikirim ke child / API ───────────────
  const [appliedStartDate, setAppliedStartDate] = useState<string>(
    defaults.startDate,
  );
  const [appliedEndDate, setAppliedEndDate] = useState<string>(
    defaults.endDate,
  );

  const { showError } = useNotifications();

  const fetchVenues = async (): Promise<void> => {
    setLoadingVenues(true);
    try {
      const venuesData = await masterDataService.getVenues();
      setVenues(venuesData || []);
    } catch (error: any) {
      showError("Error", "Gagal memuat daftar venue");
    } finally {
      setLoadingVenues(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    if (isMagnifico) setActiveTab("schedules");
  }, [isMagnifico]);

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

      // Update draft saja, belum apply
      setDraftStartDate(newStartDate.toISOString().split("T")[0]);
      setDraftEndDate(today.toISOString().split("T")[0]);
    }
  };

  // ── Terapkan filter: baru di sini applied dates & refreshKey diupdate ─────
  const handleApplyFilter = (): void => {
    if (!draftStartDate || !draftEndDate) {
      showError("Error", "Tanggal mulai dan selesai wajib diisi");
      return;
    }
    if (draftStartDate > draftEndDate) {
      showError(
        "Error",
        "Tanggal mulai tidak boleh lebih dari tanggal selesai",
      );
      return;
    }

    setAppliedStartDate(draftStartDate);
    setAppliedEndDate(draftEndDate);
    setAppliedVenueId(selectedVenueId);

    setLoading(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setLoading(false), 500);
  };

  // Cek apakah ada perubahan yang belum di-apply
  const hasUnappliedChanges =
    draftStartDate !== appliedStartDate ||
    draftEndDate !== appliedEndDate ||
    selectedVenueId !== appliedVenueId;

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
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("schedules")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "schedules"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Laporan Jadwal</span>
            </div>
          </button>

          {!isMagnifico && (
            <>
              <button
                onClick={() => setActiveTab("membership")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "membership"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>History Membership</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("member-statistic")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "member-statistic"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Statistik Member</span>
                </div>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Filters */}
      {activeTab !== "member-statistic" && (
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
                  value={draftStartDate}
                  onChange={(e) => {
                    setDraftStartDate(e.target.value);
                    setDateRange("custom");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={draftEndDate}
                  onChange={(e) => {
                    setDraftEndDate(e.target.value);
                    setDateRange("custom");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

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

              {activeTab === "membership" && <div />}

              <div className="flex items-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleApplyFilter}
                  disabled={loading || !draftStartDate || !draftEndDate}
                  className={`w-full flex items-center justify-center transition-all ${
                    hasUnappliedChanges
                      ? "ring-2 ring-offset-1 ring-blue-400"
                      : ""
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {loading ? "Memfilter..." : "Terapkan Filter"}
                  {hasUnappliedChanges && !loading && (
                    <span className="ml-2 w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                  )}
                </Button>
              </div>
            </div>

            {/* Info tanggal yang sedang aktif */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium">Filter aktif:</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-mono">
                {appliedStartDate} → {appliedEndDate}
              </span>
              {appliedVenueId && activeTab === "schedules" && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                  {venues.find((v) => v.id === appliedVenueId)?.name ??
                    appliedVenueId}
                </span>
              )}
              {hasUnappliedChanges && (
                <span className="text-amber-600 font-medium">
                  ⚠ Ada perubahan yang belum diterapkan
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content — pakai applied dates, bukan draft */}
      {activeTab === "schedules" ? (
        <ScheduleReportTab
          key={`schedule-${refreshKey}`}
          startDate={appliedStartDate}
          endDate={appliedEndDate}
          venueId={appliedVenueId}
        />
      ) : activeTab === "membership" ? (
        <MembershipReportTab
          key={`membership-${refreshKey}`}
          startDate={appliedStartDate}
          endDate={appliedEndDate}
        />
      ) : (
        <MemberStatisticTab
          key={`member-statistic-${refreshKey}`}
          startDate={appliedStartDate}
          endDate={appliedEndDate}
        />
      )}
    </div>
  );
}
