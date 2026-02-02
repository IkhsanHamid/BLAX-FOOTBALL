"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent } from "../atoms/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../atoms/Table";
import Badge from "../atoms/Badge";
import { useNotifications } from "./NotificationContainer";
import { formatCurrency, formatDate, getDateRange } from "@/lib/helper";
import BookingHistoryDetail from "./BookingHistoryDetail";
import { BookingHistory } from "@/types/admin";
import { adminService } from "@/utils/admin";

interface BookingHistoryResponse {
  status: boolean;
  statusCode: number;
  message: string;
  skip: number;
  limit: number;
  data: BookingHistory[];
  summary: {
    totalBooking: number;
    totalConfirm: number;
    totalPending: number;
    totalFailed: number;
  };
}

export interface ListSchedule {
  id: string;
  name: string;
  date: string;
  time: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Skeleton components
const TableSkeleton = () => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          {[
            "Booking ID",
            "Customer",
            "Schedule",
            "Type",
            "Amount",
            "Status",
            "Booked At",
            "Pay At",
          ].map((h) => (
            <TableHead key={h} className="font-semibold text-gray-900">
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: 8 }).map((_, j) => (
              <TableCell key={j}>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i} className="border-gray-200">
        <CardContent className="p-6">
          <div className="pt-4 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function BookingHistoryTab() {
  const [bookings, setBookings] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [scheduleFilter, setScheduleFilter] = useState("");
  const [schedules, setSchedules] = useState<ListSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    failed: 0,
  });

  const itemsPerPage = 5;
  const { showSuccess, showError } = useNotifications();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Prevent multiple simultaneous API calls
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(false);

  // Fetch active schedules
  const fetchSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      const response = await adminService.listScheduleActive();
      if (response) {
        setSchedules(response);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      showError("Error", "Failed to load schedules");
    } finally {
      setLoadingSchedules(false);
    }
  }, [showError]);

  // Single unified fetch function
  const fetchData = useCallback(async () => {
    // Prevent duplicate calls
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const { startDate, endDate } = getDateRange(dateFilter);
      const skip = (currentPage - 1) * itemsPerPage;

      const response = (await adminService.historyRecentBooking(
        startDate,
        endDate,
        statusFilter || undefined,
        debouncedSearchTerm || undefined,
        skip,
        itemsPerPage,
        scheduleFilter || undefined,
      )) as unknown as BookingHistoryResponse;

      if (response.status && response.data) {
        setBookings(response.data);
        setTotalCount(response.summary.totalBooking);
        setStats({
          total: response.summary.totalBooking,
          confirmed: response.summary.totalConfirm,
          pending: response.summary.totalPending,
          failed: response.summary.totalFailed,
        });
      } else {
        setBookings([]);
        setTotalCount(0);
        setStats({ total: 0, confirmed: 0, pending: 0, failed: 0 });
      }
    } catch (error) {
      console.error("Error fetching booking history:", error);
      showError("Error", "Failed to load booking history");
      setBookings([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [
    debouncedSearchTerm,
    statusFilter,
    dateFilter,
    scheduleFilter,
    currentPage,
    itemsPerPage,
    showError,
  ]);

  // Single effect to handle all data fetching
  useEffect(() => {
    // Skip first render, only fetch after component is mounted
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    fetchData();
  }, [fetchData]);

  // Initial load only
  useEffect(() => {
    fetchData();
    fetchSchedules();
  }, []); // Empty dependency - runs once on mount

  // Reset to first page when filters change
  useEffect(() => {
    if (mountedRef.current) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, statusFilter, dateFilter, scheduleFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    await fetchSchedules();
    setRefreshing(false);
    showSuccess("Booking history refreshed successfully");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDateFilter("all");
    setScheduleFilter("");
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SUCCESS: "bg-green-100 text-green-800 border-green-200",
      PAID: "bg-green-100 text-green-800 border-green-200",
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      FAILED: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, JSX.Element> = {
      SUCCESS: <CheckCircle className="w-3 h-3" />,
      PAID: <CheckCircle className="w-3 h-3" />,
      PENDING: <Clock className="w-3 h-3" />,
      FAILED: <XCircle className="w-3 h-3" />,
    };
    return icons[status] || <AlertCircle className="w-3 h-3" />;
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;
  const hasActiveFilters =
    searchTerm || statusFilter || dateFilter !== "all" || scheduleFilter;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const statsConfig = [
    {
      label: "Total Bookings",
      value: stats.total,
      color: "blue",
      icon: Calendar,
    },
    {
      label: "Confirmed",
      value: stats.confirmed,
      color: "green",
      icon: CheckCircle,
    },
    { label: "Pending", value: stats.pending, color: "yellow", icon: Clock },
    { label: "Failed", value: stats.failed, color: "red", icon: XCircle },
  ];

  // Get selected schedule name
  const getSelectedScheduleName = () => {
    const schedule = schedules.find((s) => s.id === scheduleFilter);
    return schedule
      ? `${schedule.name} - ${formatDate(schedule.date)} ${schedule.time}`
      : "";
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Booking History
            </h2>
            <p className="text-gray-600 mt-1">
              Tampilan komprehensif dari semua transaksi pemesanan
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {loading && !mountedRef.current ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {statsConfig.map(({ label, value, color, icon: Icon }) => (
              <Card
                key={label}
                className={`border-${color}-200 bg-${color}-50/50`}
              >
                <CardContent className="p-6">
                  <div className="pt-4 flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium text-${color}-600`}>
                        {label}
                      </p>
                      <p className={`text-3xl font-bold text-${color}-900`}>
                        {value}
                      </p>
                    </div>
                    <div className={`p-3 bg-${color}-100 rounded-lg`}>
                      <Icon className={`w-6 h-6 text-${color}-600`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="pt-4 flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by customer name, booking ID, phone, or venue..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="SUCCESS">Success</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>

                <select
                  value={scheduleFilter}
                  onChange={(e) => setScheduleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
                  disabled={loadingSchedules}
                >
                  <option value="">All Schedules</option>
                  {schedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.name} - {formatDate(schedule.date)}{" "}
                      {schedule.time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mr-2">Active filters:</p>
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Search: {searchTerm}
                    <button
                      onClick={() => setSearchTerm("")}
                      className="ml-1 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {statusFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter("")}
                      className="ml-1 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {dateFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Date: {dateFilter}
                    <button
                      onClick={() => setDateFilter("all")}
                      className="ml-1 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {scheduleFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Schedule: {getSelectedScheduleName()}
                    <button
                      onClick={() => setScheduleFilter("")}
                      className="ml-1 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs px-2 py-1 h-auto"
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking History Table */}
        <Card className="border-gray-200">
          <CardContent className="p-0">
            {loading ? (
              <TableSkeleton />
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No bookings found
                </h3>
                <p className="text-gray-600">
                  {hasActiveFilters
                    ? "Try adjusting your search criteria"
                    : "No booking history available"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      {[
                        "Booking ID",
                        "Customer",
                        "Schedule",
                        "Jersey Size",
                        "Type",
                        "Amount",
                        "Status",
                        "Booked At",
                        "Pay At",
                      ].map((h) => (
                        <TableHead
                          key={h}
                          className="font-semibold text-gray-900"
                        >
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking, index) => (
                      <TableRow
                        key={`${booking.bookingId}-${index}`}
                        className="hover:bg-gray-50/50"
                      >
                        <TableCell>
                          <div className="font-mono text-sm font-medium text-blue-600">
                            {booking.bookingId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {booking.customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              <a
                                href={`https://wa.me/${booking.customerPhone.replace(
                                  /^0/,
                                  "62",
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-700"
                              >
                                {booking.customerPhone}
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {booking.scheduleName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.venue}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatDate(booking.date)} • {booking.time}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm font-medium text-blue-600">
                            {booking.jerseySize}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className={
                                booking.bookingType === "INDIVIDUAL"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-purple-50 text-purple-700 border-purple-200"
                              }
                            >
                              {booking.bookingType}
                            </Badge>
                            <div className="text-xs text-gray-500">
                              {booking.playerCount} player(s)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(booking.totalAmount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`flex items-center space-x-1 ${getStatusColor(
                              booking.paymentStatus,
                            )}`}
                          >
                            {getStatusIcon(booking.paymentStatus)}
                            <span>{booking.paymentStatus}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {new Date(booking.bookedAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}{" "}
                            -{" "}
                            {new Date(booking.bookedAt).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {new Date(booking.paymentAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}{" "}
                            -{" "}
                            {new Date(booking.paymentAt).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        <Card className="border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-sm text-gray-700 font-medium">
                <span className="text-gray-600">Showing</span>
                <span className="mx-2 text-gray-900 font-semibold">
                  {totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                </span>
                <span className="text-gray-600">to</span>
                <span className="mx-2 text-gray-900 font-semibold">
                  {totalCount === 0
                    ? 0
                    : Math.min(currentPage * itemsPerPage, totalCount)}
                </span>
                <span className="text-gray-600">of</span>
                <span className="mx-2 text-gray-900 font-semibold">
                  {totalCount}
                </span>
                <span className="text-gray-600">
                  booking{totalCount !== 1 ? "s" : ""}
                </span>
                {totalPages > 1 && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-gray-600">Page</span>
                    <span className="mx-2 text-gray-900 font-semibold">
                      {currentPage}
                    </span>
                    <span className="text-gray-600">of</span>
                    <span className="mx-2 text-gray-900 font-semibold">
                      {totalPages}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={!hasPreviousPage || loading || totalCount === 0}
                  className="px-2"
                >
                  ⟨⟨
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!hasPreviousPage || loading || totalCount === 0}
                >
                  ⟨
                </Button>

                {totalPages > 1 && (
                  <div className="flex items-center space-x-1 px-3 py-2 bg-white rounded-lg border border-gray-200">
                    {getVisiblePages().map((page, index) =>
                      page === "..." ? (
                        <span
                          key={`dots-${index}`}
                          className="px-2 text-gray-400"
                        >
                          •••
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={page === currentPage ? "primary" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page as number)}
                          disabled={loading}
                          className={`w-9 h-9 p-0 ${
                            page === currentPage
                              ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </Button>
                      ),
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!hasNextPage || loading || totalCount === 0}
                >
                  ⟩
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={!hasNextPage || loading || totalCount === 0}
                  className="px-2"
                >
                  ⟩⟩
                </Button>
              </div>
            </div>

            {totalPages > 10 && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center gap-3">
                <label className="text-sm text-gray-600 font-medium">
                  Jump to page:
                </label>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  placeholder="Enter page number"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const page = parseInt(
                        (e.target as HTMLInputElement).value,
                      );
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24 text-sm"
                />
                <span className="text-sm text-gray-500">
                  (1 - {totalPages})
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BookingHistoryDetail
        bookingId={selectedBookingId || ""}
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedBookingId(null);
        }}
        onRefresh={handleRefresh}
      />
    </>
  );
}
