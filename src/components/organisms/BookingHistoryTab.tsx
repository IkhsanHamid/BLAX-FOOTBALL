"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Search,
  Filter,
  Eye,
  Download,
  RefreshCw,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
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

// Response type from API
interface BookingHistoryResponse {
  status: boolean;
  statusCode: number;
  message: string;
  skip: number;
  limit: number;
  totalData: number;
  data: BookingHistory[];
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Table skeleton component for partial loading
const TableSkeleton = () => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead className="font-semibold text-gray-900">
            Booking ID
          </TableHead>
          <TableHead className="font-semibold text-gray-900">
            Customer
          </TableHead>
          <TableHead className="font-semibold text-gray-900">
            Schedule
          </TableHead>
          <TableHead className="font-semibold text-gray-900">Type</TableHead>
          <TableHead className="font-semibold text-gray-900">Amount</TableHead>
          <TableHead className="font-semibold text-gray-900">Status</TableHead>
          <TableHead className="font-semibold text-gray-900">
            Booked At
          </TableHead>
          <TableHead className="font-semibold text-gray-900">Pay At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
            </TableCell>
            <TableCell>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-28"></div>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-36"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            </TableCell>
            <TableCell>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
            </TableCell>
            <TableCell>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
            </TableCell>
            <TableCell>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
            </TableCell>
            <TableCell>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

// Stats skeleton component
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, index) => (
      <Card key={index} className="border-gray-200">
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // API-based pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 5; // Static limit per page

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    failed: 0,
  });

  // Loading state for UI
  const loading = initialLoading || filterLoading;

  const { showSuccess, showError } = useNotifications();

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch stats separately (with first page data to get totalData count)
  const fetchStats = useCallback(async () => {
    try {
      const { startDate, endDate } = getDateRange(dateFilter);

      // Fetch first page to get total count and calculate stats from it
      // The API should return totalData which represents filtered total
      const response = (await adminService.historyRecentBooking(
        startDate,
        endDate,
        statusFilter || undefined,
        debouncedSearchTerm || undefined,
        0,
        itemsPerPage
      )) as unknown as BookingHistoryResponse;

      if (response.status && response.data) {
        // Use the totalData from API response for actual count
        // Calculate stats from current page data as sample
        const pageData = response.data;

        const successCount = pageData.filter(
          (b: BookingHistory) => b.paymentStatus === "PAID"
        ).length;
        const pendingCount = pageData.filter(
          (b: BookingHistory) => b.paymentStatus === "PENDING"
        ).length;
        const failedCount = pageData.filter(
          (b: BookingHistory) =>
            b.paymentStatus === "FAILED" || b.paymentStatus === "EXPIRED"
        ).length;

        setStats({
          total: response.totalData,
          confirmed: successCount,
          pending: pendingCount,
          failed: failedCount,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [debouncedSearchTerm, statusFilter, dateFilter, itemsPerPage]);

  // Fetch paginated booking history
  const fetchBookingHistory = useCallback(
    async (isSearch = false) => {
      try {
        // Determine loading state
        if (isFirstLoad) {
          setInitialLoading(true);
        } else if (isSearch) {
          setFilterLoading(true);
        } else {
          setFilterLoading(true);
        }

        const { startDate, endDate } = getDateRange(dateFilter);

        // Calculate skip based on current page
        // Page 1: skip = 0
        // Page 2: skip = 10
        // Page 3: skip = 20
        // etc.
        const skip = (currentPage - 1) * itemsPerPage;

        console.log(
          `Fetching page ${currentPage}: skip=${skip}, limit=${itemsPerPage}`
        );

        // Call API with query parameters
        const response = (await adminService.historyRecentBooking(
          startDate,
          endDate,
          statusFilter || undefined,
          debouncedSearchTerm || undefined,
          skip,
          itemsPerPage
        )) as unknown as BookingHistoryResponse;
        console.log(
          "response111",
          response,
          `skip: ${skip}, limit: ${itemsPerPage}`
        );

        console.log("Booking history response:", response);

        // Handle response based on API structure
        if (response.status && response.data) {
          setBookings(response.data);
          setTotalCount(response.totalData);
        } else {
          setBookings([]);
          setTotalCount(0);
        }
      } catch (error) {
        console.error("Error fetching booking history:", error);
        showError("Error", "Failed to load booking history");
        setBookings([]);
        setTotalCount(0);
      } finally {
        setInitialLoading(false);
        setFilterLoading(false);
        setIsFirstLoad(false);
      }
    },
    [
      debouncedSearchTerm,
      statusFilter,
      dateFilter,
      currentPage,
      itemsPerPage,
      showError,
      isFirstLoad,
    ]
  );

  // Initial load
  useEffect(() => {
    fetchBookingHistory();
    fetchStats();
  }, []);

  // Handle filter changes and pagination
  useEffect(() => {
    if (!isFirstLoad) {
      const isSearchOnly =
        !!debouncedSearchTerm && !statusFilter && dateFilter === "all";
      fetchBookingHistory(isSearchOnly);
    }
  }, [
    debouncedSearchTerm,
    statusFilter,
    dateFilter,
    currentPage,
    isFirstLoad,
    fetchBookingHistory,
  ]);

  // Fetch stats when filters change (but not on page change)
  useEffect(() => {
    if (!isFirstLoad) {
      fetchStats();
    }
  }, [debouncedSearchTerm, statusFilter, dateFilter, isFirstLoad, fetchStats]);

  // Reset to first page when filters change
  useEffect(() => {
    if (!isFirstLoad) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, statusFilter, dateFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBookingHistory(), fetchStats()]);
    setRefreshing(false);
    showSuccess("Booking history refreshed successfully");
  };

  const handleViewDetail = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedBookingId(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDateFilter("all");
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "PAID":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "PAID":
        return <CheckCircle className="w-3 h-3" />;
      case "PENDING":
        return <Clock className="w-3 h-3" />;
      case "FAILED":
      case "EXPIRED":
        return <XCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  // Calculate visible page numbers for pagination
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

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter || dateFilter !== "all";

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
              Comprehensive view of all booking transactions
            </p>
          </div>

          <div className="flex items-center space-x-3">
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
        </div>

        {/* Stats Cards */}
        {loading && isFirstLoad ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      Total Bookings
                    </p>
                    <p className="text-3xl font-bold text-blue-900">
                      {stats.total}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Confirmed
                    </p>
                    <p className="text-3xl font-bold text-green-900">
                      {stats.confirmed}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="p-6">
                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">
                      Pending
                    </p>
                    <p className="text-3xl font-bold text-yellow-900">
                      {stats.pending}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-6">
                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Failed</p>
                    <p className="text-3xl font-bold text-red-900">
                      {stats.failed}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  <option value="EXPIRED">Expired</option>
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
                      <TableHead className="font-semibold text-gray-900">
                        Booking ID
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Customer
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Schedule
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Type
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Amount
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Booked At
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Pay At
                      </TableHead>
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
                              {booking.customerPhone}
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
                              booking.paymentStatus
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
                              }
                            )}{" "}
                            -{" "}
                            {new Date(booking.bookedAt).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
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
                              }
                            )}{" "}
                            -{" "}
                            {new Date(booking.paymentAt).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
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

        {/* API-based Pagination - Always Visible */}
        <Card className="border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Left: Summary Info */}
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

              {/* Right: Pagination Controls */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={
                    !hasPreviousPage || filterLoading || totalCount === 0
                  }
                  // title="Go to first page"
                  className="px-2"
                >
                  ⟨⟨
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={
                    !hasPreviousPage || filterLoading || totalCount === 0
                  }
                  // title="Previous page"
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
                          disabled={filterLoading}
                          className={`w-9 h-9 p-0 ${
                            page === currentPage
                              ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!hasNextPage || filterLoading || totalCount === 0}
                  // title="Next page"
                >
                  ⟩
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={!hasNextPage || filterLoading || totalCount === 0}
                  // title="Go to last page"
                  className="px-2"
                >
                  ⟩⟩
                </Button>
              </div>
            </div>

            {/* Quick Page Jump */}
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
                        (e.target as HTMLInputElement).value
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

      {/* Booking Detail Modal */}
      <BookingHistoryDetail
        bookingId={selectedBookingId || ""}
        open={showDetailModal}
        onClose={handleCloseDetail}
        onRefresh={handleRefresh}
      />
    </>
  );
}
