"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Clock,
  Search,
  Plus,
  History,
  User,
  FileText,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import Button from "@/components/atoms/Button";
import { Card, CardContent } from "@/components/atoms/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/Table";
import Badge from "@/components/atoms/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/Dialog";
import Input from "@/components/atoms/Input";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { formatDate } from "@/lib/helper";
import Pagination from "@/components/atoms/Pagination";
import { adminService } from "@/utils/admin";
import { RescheduleManagement } from "@/types/admin";

const ITEMS_PER_PAGE = 10;

interface BookingData {
  id: string;
  playerName: string;
  playerPhone: string;
  courtName: string;
  originalDate: string;
  originalTime: string;
  status: "pending" | "confirmed";
}

interface RescheduleRequest {
  id: string;
  bookingId: string;
  playerName: string;
  playerPhone: string;
  originalDate: string;
  originalTime: string;
  venueName: string;
  reason: string;
  createdAt: string;
  createdBy: string;
}

// const STATS_CONFIG = [
//   {
//     key: "total",
//     label: "Total Reschedule",
//     icon: Calendar,
//     color: "blue",
//   },
//   {
//     key: "thisMonth",
//     label: "This Month",
//     icon: Clock,
//     color: "purple",
//   },
//   {
//     key: "thisWeek",
//     label: "This Week",
//     icon: AlertCircle,
//     color: "green",
//   },
//   {
//     key: "today",
//     label: "Today",
//     icon: FileText,
//     color: "yellow",
//   },
// ];

export default function RescheduleManagementComponent() {
  const { showSuccess, showError } = useNotifications();

  // State Management
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create Reschedule States
  const [searchBooking, setSearchBooking] = useState("");
  const [selectedBooking, setSelectedBooking] =
    useState<RescheduleManagement | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    reason: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // History States
  const [rescheduleHistory, setRescheduleHistory] = useState<
    RescheduleRequest[]
  >([]);
  const [searchHistory, setSearchHistory] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<RescheduleRequest | null>(null);
  const [historyPagination, setHistoryPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    skip: 0,
    limit: ITEMS_PER_PAGE,
  });

  // Available Bookings States
  const [availableBookings, setAvailableBookings] = useState<
    RescheduleManagement[]
  >([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsPagination, setBookingsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    skip: 0,
    limit: ITEMS_PER_PAGE,
  });

  // Fetch available bookings
  const fetchAvailableBookings = useCallback(async () => {
    try {
      setBookingsLoading(true);
      const skip = (bookingsPagination.currentPage - 1) * ITEMS_PER_PAGE;

      const result = await adminService.listAvailReschedule(
        skip,
        ITEMS_PER_PAGE,
        searchBooking
      );

      if (result?.status && result?.data) {
        setAvailableBookings(result.data);
        setBookingsPagination({
          currentPage: bookingsPagination.currentPage,
          totalPages: Math.ceil((result.totalData || 0) / ITEMS_PER_PAGE),
          total: result.totalData || 0,
          skip: result.skip || 0,
          limit: result.limit || ITEMS_PER_PAGE,
        });
      } else {
        setAvailableBookings([]);
        setBookingsPagination({
          currentPage: 1,
          totalPages: 1,
          total: 0,
          skip: 0,
          limit: ITEMS_PER_PAGE,
        });
      }
    } catch (error: any) {
      console.error("Error fetching available bookings:", error);
      showError(
        "Error",
        error?.message || "Failed to fetch available bookings"
      );
      setAvailableBookings([]);
      setBookingsPagination({
        currentPage: 1,
        totalPages: 1,
        total: 0,
        skip: 0,
        limit: ITEMS_PER_PAGE,
      });
    } finally {
      setBookingsLoading(false);
    }
  }, [bookingsPagination.currentPage, searchBooking, showError]);

  // Fetch bookings on component mount and when dependencies change
  useEffect(() => {
    if (activeTab === "create") {
      fetchAvailableBookings();
    }
  }, [activeTab, bookingsPagination.currentPage, searchBooking]);

  // Debounce search for bookings
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "create") {
        setBookingsPagination((prev) => ({ ...prev, currentPage: 1 }));
        fetchAvailableBookings();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchBooking]);

  // Fetch reschedule history
  const fetchRescheduleHistory = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (historyPagination.currentPage - 1) * ITEMS_PER_PAGE;

      const result = await adminService.historyReschedule(
        skip,
        ITEMS_PER_PAGE,
        searchHistory
      );

      if (result?.status && result?.data) {
        setRescheduleHistory(result.data);
        setHistoryPagination({
          currentPage: historyPagination.currentPage,
          totalPages: Math.ceil((result.totalData || 0) / ITEMS_PER_PAGE),
          total: result.totalData || 0,
          skip: result.skip || 0,
          limit: result.limit || ITEMS_PER_PAGE,
        });
      } else {
        setRescheduleHistory([]);
        setHistoryPagination({
          currentPage: 1,
          totalPages: 1,
          total: 0,
          skip: 0,
          limit: ITEMS_PER_PAGE,
        });
      }
    } catch (error: any) {
      console.error("Error fetching reschedule history:", error);
      showError(
        "Error",
        error?.message || "Failed to fetch reschedule history"
      );
      setRescheduleHistory([]);
      setHistoryPagination({
        currentPage: 1,
        totalPages: 1,
        total: 0,
        skip: 0,
        limit: ITEMS_PER_PAGE,
      });
    } finally {
      setLoading(false);
    }
  }, [historyPagination.currentPage, searchHistory, showError]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchRescheduleHistory();
    }
  }, [activeTab, historyPagination.currentPage, searchHistory]);

  // Debounce search for history
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "history") {
        setHistoryPagination((prev) => ({ ...prev, currentPage: 1 }));
        fetchRescheduleHistory();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchHistory]);

  // Filter history - now handled by API
  const filteredHistory = useMemo(() => {
    return rescheduleHistory;
  }, [rescheduleHistory]);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: rescheduleHistory.length,
      thisMonth: rescheduleHistory.filter(
        (r) => new Date(r.createdAt) >= monthStart
      ).length,
      thisWeek: rescheduleHistory.filter(
        (r) => new Date(r.createdAt) >= weekStart
      ).length,
      today: rescheduleHistory.filter((r) => new Date(r.createdAt) >= today)
        .length,
    };
  }, [rescheduleHistory]);

  // Pagination for history - now handled by API
  const paginatedHistory = useMemo(() => filteredHistory, [filteredHistory]);

  // Handlers
  const handleSelectBooking = (booking: RescheduleManagement) => {
    setSelectedBooking(booking);
    setRescheduleForm({ reason: "" });
    setFormErrors({});
  };

  const handleFormChange = (field: string, value: string) => {
    setRescheduleForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!rescheduleForm.reason.trim())
      errors.reason = "Reason is required (min. 10 characters)";
    else if (rescheduleForm.reason.trim().length < 10)
      errors.reason = "Reason must be at least 10 characters";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitReschedule = async () => {
    if (!selectedBooking || !validateForm()) return;

    try {
      setActionLoading("submit");
      const bookId = selectedBooking.bookId;
      const reason = rescheduleForm.reason;
      await adminService.createRescheduleRecord(bookId, reason);

      showSuccess("Reschedule record created successfully!");
      setSelectedBooking(null);
      setRescheduleForm({ reason: "" });
      setActiveTab("history");
      fetchRescheduleHistory();
    } catch (error) {
      showError("Error", "Failed to create reschedule record");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetail = (request: RescheduleRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleDeleteRecord = async (requestId: string) => {
    try {
      setActionLoading("delete");
      // TODO: Implement API call
      // await adminService.deleteReschedule(requestId);

      showSuccess("Reschedule record deleted successfully!");
      setShowDetailModal(false);
      fetchRescheduleHistory();
    } catch (error) {
      showError("Error", "Failed to delete reschedule record");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reschedule Records</h2>
        <p className="text-gray-600 mt-1">
          Catat dan kelola data reschedule booking
        </p>
      </div>

      {/* Stats Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {STATS_CONFIG.map(({ key, label, icon: Icon, color }) => (
          <Card
            key={key}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats[key as keyof typeof stats]}
                  </p>
                </div>
                <div className={`p-3 bg-${color}-100 rounded-lg`}>
                  <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div> */}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === "create"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Create Reschedule</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === "history"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <History className="w-4 h-4" />
          <span>History</span>
        </button>
      </div>

      {/* Create Reschedule Tab */}
      {activeTab === "create" && (
        <div className="space-y-6">
          {/* Search Booking */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 mt-4">
                Search Booking to Reschedule
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by player name..."
                  value={searchBooking}
                  onChange={(e) => setSearchBooking(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Booking List */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 mt-4">
                Available Bookings
              </h3>
              {bookingsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-spin" />
                  <p className="text-gray-600">Loading bookings...</p>
                </div>
              ) : availableBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No bookings found</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {availableBookings.map((booking) => (
                      <div
                        key={booking.id}
                        onClick={() => handleSelectBooking(booking)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedBooking?.id === booking.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <Badge variant="outline" className="text-xs">
                                {booking.bookId}
                              </Badge>
                              <span className="font-medium">
                                {booking.playerName}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate(booking.date)}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {booking.time}
                              </span>
                              <span>{booking.venueName}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination for bookings */}
                  {bookingsPagination.totalPages > 1 && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={bookingsPagination.currentPage}
                        totalPages={bookingsPagination.totalPages}
                        onPageChange={(page) =>
                          setBookingsPagination((prev) => ({
                            ...prev,
                            currentPage: page,
                          }))
                        }
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Reschedule Form */}
          {selectedBooking && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 mt-4">
                  Reschedule Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reason for Reschedule *
                    </label>
                    <textarea
                      value={rescheduleForm.reason}
                      onChange={(e) =>
                        handleFormChange("reason", e.target.value)
                      }
                      placeholder="Jelaskan alasan reschedule (minimal 10 karakter)..."
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.reason ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {formErrors.reason && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.reason}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedBooking(null)}
                      disabled={actionLoading === "submit"}
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="black"
                      onClick={handleSubmitReschedule}
                      disabled={actionLoading === "submit"}
                      size="sm"
                    >
                      {actionLoading === "submit" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Reschedule Request"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by ID, player name, or phone..."
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* History Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Loading history...</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No reschedule records found
                  </h3>
                  <p className="text-gray-600">
                    Reschedule records will appear here
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book ID</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Original Schedule</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedHistory.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {request.bookingId}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {request.playerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.playerPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(request.originalDate)}</div>
                            <div className="text-gray-500">
                              {request.originalTime} - {request.venueName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {request.createdBy}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(request.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetail(request)}
                          >
                            View Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {historyPagination.totalPages > 1 && (
            <Pagination
              currentPage={historyPagination.currentPage}
              totalPages={historyPagination.totalPages}
              onPageChange={(page) =>
                setHistoryPagination((prev) => ({
                  ...prev,
                  currentPage: page,
                }))
              }
            />
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reschedule Record Detail</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Record ID
                  </label>
                  <p className="mt-1 font-medium">
                    {selectedRequest.bookingId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Booking ID
                  </label>
                  <p className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {selectedRequest.bookingId}
                    </Badge>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Player Information
                </label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedRequest.playerName}</p>
                  <p className="text-sm text-gray-600">
                    {selectedRequest.playerPhone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Original Schedule
                  </label>
                  <div className="mt-2 p-4 bg-red-50 rounded-lg">
                    <p>{formatDate(selectedRequest.originalDate)}</p>
                    <p className="text-sm text-gray-600">
                      {selectedRequest.originalTime}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedRequest.venueName}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Reason
                </label>
                <p className="mt-2 p-4 bg-gray-50 rounded-lg">
                  {selectedRequest.reason}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Created by: {selectedRequest.createdBy}
                    </p>
                    <p className="text-sm text-blue-700">
                      {formatDate(selectedRequest.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </Button>
                {/* <Button
                  variant="outline"
                  onClick={() => handleDeleteRecord(selectedRequest.id)}
                  disabled={actionLoading === "delete"}
                  className="text-red-600 hover:bg-red-50 border-red-300"
                >
                  {actionLoading === "delete" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Record"
                  )}
                </Button> */}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
