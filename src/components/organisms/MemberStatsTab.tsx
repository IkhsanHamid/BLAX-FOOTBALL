"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "../atoms/Card";
import { useNotifications } from "./NotificationContainer";
import { Crown, Search, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../atoms/Dialog";
import {
  MemberStatistic,
  MemberStatisticResponse,
  MemberStatisticTabProps,
  MemberStatus,
  SortField,
  SortType,
} from "@/types/report";
import { adminService } from "@/utils/admin";
import * as XLSX from "xlsx";

// ========================================
// MODAL COMPONENT
// ========================================

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberStatistic | null;
}

function HistoryModal({
  isOpen,
  onClose,
  member,
}: HistoryModalProps): JSX.Element | null {
  if (!member) return null;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>History Booking - {member.name}</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            {member.email} • {member.phone}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {member.historyBookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Belum ada history booking</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Jadwal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tanggal Main
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Waktu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipe
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Waktu Booking
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {member.historyBookings.map((booking, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {booking.scheduleName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(booking.scheduleDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {booking.scheduleTime}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {booking.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {booking.bookingType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDateTime(booking.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Total: {member.historyBookings.length} bookings
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function MemberStatisticTab({
  startDate,
  endDate,
}: MemberStatisticTabProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [data, setData] = useState<MemberStatistic[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    limit: 10,
    skip: 0,
    totalPages: 0,
    currentPage: 1,
  });

  // Filter states
  const [sortBy, setSortBy] = useState<SortField>("totalBooking");
  const [sortType, setSortType] = useState<SortType>("desc");
  const [memberStatus, setMemberStatus] = useState<MemberStatus>("all");
  const [searchName, setSearchName] = useState<string>("");
  const [debouncedSearchName, setDebouncedSearchName] = useState<string>("");
  const [limit, setLimit] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Date & isNew filter input states (belum applied)
  const [dateFromInput, setDateFromInput] = useState<string>("");
  const [dateToInput, setDateToInput] = useState<string>("");
  const [isNewInput, setIsNewInput] = useState<boolean>(false);

  // Applied filter states (trigger fetch)
  const [appliedDateFrom, setAppliedDateFrom] = useState<string>("");
  const [appliedDateTo, setAppliedDateTo] = useState<string>("");
  const [appliedIsNew, setAppliedIsNew] = useState<boolean>(false);

  const hasUnappliedChanges =
    dateFromInput !== appliedDateFrom ||
    dateToInput !== appliedDateTo ||
    isNewInput !== appliedIsNew;

  const isFilterActive = appliedDateFrom || appliedDateTo || appliedIsNew;

  // Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<MemberStatistic | null>(
    null,
  );

  const { showError } = useNotifications();

  // ----------------------------------------
  // Helpers
  // ----------------------------------------
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ----------------------------------------
  // Debounce search
  // ----------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchName(searchName);
      if (searchName !== debouncedSearchName) {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchName]);

  // ----------------------------------------
  // Fetch
  // ----------------------------------------
  const fetchMemberStatistics = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * limit;

      const result: MemberStatisticResponse =
        await adminService.memberStatsReport(
          sortBy,
          sortType,
          skip,
          limit,
          debouncedSearchName,
          memberStatus,
          appliedDateFrom || undefined,
          appliedDateTo || undefined,
          appliedIsNew || undefined,
        );

      if (result.status) {
        setData(result.data);
        setMeta(result.meta);
      } else {
        throw new Error(result.message || "Failed to fetch data");
      }
    } catch (error: any) {
      console.error("Error fetching member statistics:", error);
      showError("Error", "Gagal memuat statistik member");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [
    sortBy,
    sortType,
    memberStatus,
    debouncedSearchName,
    limit,
    currentPage,
    appliedDateFrom,
    appliedDateTo,
    appliedIsNew,
  ]);

  useEffect(() => {
    fetchMemberStatistics();
  }, [fetchMemberStatistics]);

  // ----------------------------------------
  // Export EXCEL
  // ----------------------------------------
  const handleExport = useCallback(async (): Promise<void> => {
    setExporting(true);
    try {
      // Step 1: ambil total data
      const countResult: MemberStatisticResponse =
        await adminService.memberStatsReport(
          sortBy,
          sortType,
          0,
          1,
          debouncedSearchName,
          memberStatus,
          appliedDateFrom || undefined,
          appliedDateTo || undefined,
          appliedIsNew || undefined,
        );

      if (!countResult.status)
        throw new Error(countResult.message || "Failed to fetch total");

      const totalData = countResult.meta.total;

      if (totalData === 0) {
        showError("Export", "Tidak ada data untuk diekspor");
        return;
      }

      // Step 2: fetch semua data sesuai total
      const result: MemberStatisticResponse =
        await adminService.memberStatsReport(
          sortBy,
          sortType,
          0,
          totalData,
          debouncedSearchName,
          memberStatus,
          appliedDateFrom || undefined,
          appliedDateTo || undefined,
          appliedIsNew || undefined,
        );

      if (!result.status)
        throw new Error(result.message || "Failed to fetch export data");

      // Step 3: build rows
      const rows = result.data.map((member, index) => ({
        No: index + 1,
        Nama: member.name,
        Email: member.email,
        "No. Telp": member.phone,
        "Status Member": member.isMember ? "Member" : "Non-Member",
        "Total Booking": member.totalBooking,
        "Tanggal Daftar": formatDate(member.createdAt),
      }));

      // Step 4: buat worksheet & workbook
      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Set lebar kolom
      worksheet["!cols"] = [
        { wch: 5 }, // No
        { wch: 30 }, // Nama
        { wch: 35 }, // Email
        { wch: 18 }, // No. Telp
        { wch: 16 }, // Status Member
        { wch: 16 }, // Total Booking
        { wch: 18 }, // Tanggal Daftar
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Member Statistik");

      // Step 5: generate nama file
      const dateLabel =
        appliedDateFrom && appliedDateTo
          ? `_${appliedDateFrom}_sd_${appliedDateTo}`
          : appliedDateFrom
            ? `_dari_${appliedDateFrom}`
            : appliedDateTo
              ? `_sd_${appliedDateTo}`
              : "";

      const isNewLabel = appliedIsNew ? "_member-baru" : "";
      const statusLabel = memberStatus !== "all" ? `_${memberStatus}` : "";
      const fileName = `member-statistik${dateLabel}${isNewLabel}${statusLabel}.xlsx`;

      // Step 6: trigger download
      XLSX.writeFile(workbook, fileName);
    } catch (error: any) {
      console.error("Error exporting member statistics:", error);
      showError("Export", "Gagal mengekspor data");
    } finally {
      setExporting(false);
    }
  }, [
    sortBy,
    sortType,
    memberStatus,
    debouncedSearchName,
    appliedDateFrom,
    appliedDateTo,
    appliedIsNew,
  ]);

  // ----------------------------------------
  // Filter handlers
  // ----------------------------------------
  const handleApplyFilter = (): void => {
    setAppliedDateFrom(dateFromInput);
    setAppliedDateTo(dateToInput);
    setAppliedIsNew(isNewInput);
    setCurrentPage(1);
  };

  const handleResetDateFilter = (): void => {
    setDateFromInput("");
    setDateToInput("");
    setIsNewInput(false);
    setAppliedDateFrom("");
    setAppliedDateTo("");
    setAppliedIsNew(false);
    setCurrentPage(1);
  };

  // ----------------------------------------
  // Modal handlers
  // ----------------------------------------
  const openHistoryModal = (member: MemberStatistic): void => {
    setSelectedMember(member);
    setModalOpen(true);
  };

  const closeHistoryModal = (): void => {
    setModalOpen(false);
    setSelectedMember(null);
  };

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="space-y-6">
      {/* ── Filters ── */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Row 1: Status, Search, Sort */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Member
              </label>
              <select
                value={memberStatus}
                onChange={(e) => {
                  setMemberStatus(e.target.value as MemberStatus);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="member">Member</option>
                <option value="non-member">Non-Member</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cari Nama
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Ketik nama member..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urutkan
              </label>
              <select
                value={`${sortBy}-${sortType}`}
                onChange={(e) => {
                  const [field, type] = e.target.value.split("-");
                  setSortBy(field as SortField);
                  setSortType(type as SortType);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="totalBooking-desc">
                  Booking Terbanyak - Terkecil
                </option>
                <option value="totalBooking-asc">
                  Booking Terkecil - Terbanyak
                </option>
                <option value="createdAt-desc">Terbaru - Terlama</option>
                <option value="createdAt-asc">Terlama - Terbaru</option>
              </select>
            </div>
          </div>

          {/* Row 2: Date range + isNew + tombol */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={dateFromInput}
                  max={dateToInput || undefined}
                  onChange={(e) => setDateFromInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex-1 min-w-[160px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={dateToInput}
                  min={dateFromInput || undefined}
                  onChange={(e) => setDateToInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col justify-end min-w-[140px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Baru
                </label>
                <button
                  type="button"
                  onClick={() => setIsNewInput((prev) => !prev)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    isNewInput
                      ? "bg-green-50 border-green-500 text-green-700"
                      : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isNewInput
                        ? "bg-green-500 border-green-500"
                        : "border-gray-400"
                    }`}
                  >
                    {isNewInput && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 10 10"
                      >
                        <path
                          d="M1.5 5l2.5 2.5 4.5-4.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  Hanya Member Baru
                </button>
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={handleApplyFilter}
                  disabled={!hasUnappliedChanges}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  <Filter className="w-4 h-4" />
                  Terapkan Filter
                </button>

                {isFilterActive && (
                  <button
                    onClick={handleResetDateFilter}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Active filter badges */}
            {isFilterActive && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(appliedDateFrom || appliedDateTo) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full font-medium">
                    <Filter className="w-3 h-3" />
                    {appliedDateFrom && appliedDateTo
                      ? `${appliedDateFrom} — ${appliedDateTo}`
                      : appliedDateFrom
                        ? `Dari ${appliedDateFrom}`
                        : `Sampai ${appliedDateTo}`}
                  </span>
                )}
                {appliedIsNew && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 text-xs rounded-full font-medium">
                    ✦ Member Baru
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Table header + Export button ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {!loading && meta.total > 0 && `${meta.total} member ditemukan`}
        </p>
        <button
          onClick={handleExport}
          disabled={exporting || loading || data.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Mengekspor...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export Excel
            </>
          )}
        </button>
      </div>

      {/* ── Data Table ── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. Telp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Booking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Daftar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      </div>
                      <p className="text-gray-500 mt-2">
                        Memuat data statistik member...
                      </p>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-gray-500">
                        Tidak ada data statistik member
                      </p>
                    </td>
                  </tr>
                ) : (
                  data.map((member, index) => (
                    <tr key={member.email} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {meta.skip + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {member.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.isMember ? (
                          <span className="px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            <Crown className="w-3 h-3 mr-1" />
                            Member
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Non-Member
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openHistoryModal(member)}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {member.totalBooking} bookings
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && data.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Menampilkan {meta.skip + 1} –{" "}
                {Math.min(meta.skip + limit, meta.total)} dari {meta.total}{" "}
                member
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: Math.min(5, meta.totalPages) },
                    (_, i) => {
                      let pageNum: number;
                      if (meta.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= meta.totalPages - 2) {
                        pageNum = meta.totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 border rounded-lg text-sm font-medium ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(meta.totalPages, prev + 1),
                    )
                  }
                  disabled={currentPage === meta.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Modal */}
      <HistoryModal
        isOpen={modalOpen}
        onClose={closeHistoryModal}
        member={selectedMember}
      />
    </div>
  );
}
