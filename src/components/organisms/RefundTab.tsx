"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  RefreshCw,
  Calendar,
  User,
  Undo2,
  AlertCircle,
} from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent } from "../atoms/Card";
import Input from "../atoms/Input";
import Pagination from "../atoms/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../atoms/Table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../atoms/Dialog";
import { useNotifications } from "./NotificationContainer";
import { formatCurrency, formatDate } from "@/lib/helper";
import { adminService } from "@/utils/admin";
import type { RefundableBooking, RefundHistoryRecord } from "@/types/admin";

type TabKey = "refundable" | "history";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const TableRowSkeleton = () => (
  <TableRow>
    {Array.from({ length: 7 }).map((_, i) => (
      <TableCell key={i}>
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </TableCell>
    ))}
  </TableRow>
);

export default function RefundTab() {
  const [activeTab, setActiveTab] = useState<TabKey>("refundable");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

  const [refundable, setRefundable] = useState<RefundableBooking[]>([]);
  const [history, setHistory] = useState<RefundHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(false);

  const [refundTarget, setRefundTarget] = useState<RefundableBooking | null>(
    null,
  );
  const [refundReason, setRefundReason] = useState("");

  const { showSuccess, showError } = useNotifications();

  const fetchRefundable = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await adminService.getRefundableBookings(
        debouncedSearch || undefined,
        skip,
        itemsPerPage,
      );
      const data = response?.data?.data ?? [];
      setRefundable(data);
      setTotal(response?.data?.meta?.total ?? 0);
    } catch (error) {
      console.error("Error fetching refundable bookings:", error);
      showError("Error", "Gagal memuat daftar refund");
      setRefundable([]);
      setTotal(0);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [debouncedSearch, currentPage, showError]);

  const fetchHistory = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await adminService.getRefundHistory(
        debouncedSearch || undefined,
        skip,
        itemsPerPage,
      );
      const data = response?.data?.data ?? [];
      setHistory(data);
      setTotal(response?.data?.meta?.total ?? 0);
    } catch (error) {
      console.error("Error fetching refund history:", error);
      showError("Error", "Gagal memuat riwayat refund");
      setHistory([]);
      setTotal(0);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [debouncedSearch, currentPage, showError]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (activeTab === "refundable") {
      fetchRefundable();
    } else {
      fetchHistory();
    }
  }, [activeTab, fetchRefundable, fetchHistory]);

  useEffect(() => {
    if (activeTab === "refundable") {
      fetchRefundable();
    } else {
      fetchHistory();
    }
  }, []);

  useEffect(() => {
    if (mountedRef.current) {
      setCurrentPage(1);
    }
  }, [debouncedSearch, activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === "refundable") {
      await fetchRefundable();
    } else {
      await fetchHistory();
    }
    setRefreshing(false);
    showSuccess("Data refund berhasil diperbarui");
  };

  const openRefundDialog = (booking: RefundableBooking) => {
    setRefundTarget(booking);
    setRefundReason("");
  };

  const closeRefundDialog = () => {
    setRefundTarget(null);
    setRefundReason("");
  };

  const handleSubmitRefund = async () => {
    if (!refundTarget) return;
    if (!refundReason.trim()) {
      showError("Validasi gagal", "Alasan refund wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      await adminService.refundBooking({
        bookId: refundTarget.bookId,
        reason: refundReason.trim(),
      });
      showSuccess("Refund berhasil", `${refundTarget.bookId} telah direfund`);
      closeRefundDialog();
      await fetchRefundable();
    } catch (error: any) {
      console.error("Error refunding booking:", error);
      showError(
        "Refund gagal",
        error?.message || "Terjadi kesalahan saat memproses refund",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-xl font-semibold text-gray-900">
          Refund Management
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Kelola refund untuk booking yang eligible dan lihat riwayat refund
          yang sudah diproses.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => {
                  setActiveTab("refundable");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  activeTab === "refundable"
                    ? "bg-white text-sky-700 shadow-sm font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Eligible Refund
              </button>
              <button
                onClick={() => {
                  setActiveTab("history");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  activeTab === "history"
                    ? "bg-white text-sky-700 shadow-sm font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Riwayat Refund
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari booking ID atau nama customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeTab === "refundable" ? (
        <Card>
          <CardContent className="p-0">
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
                      Tanggal & Waktu
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">
                      BlaxPay
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">
                      QRIS
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} />
                    ))
                  ) : refundable.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-gray-500"
                      >
                        Tidak ada booking yang eligible untuk refund
                      </TableCell>
                    </TableRow>
                  ) : (
                    refundable.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium text-gray-900">
                          {b.bookId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-gray-900">
                                {b.customerName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {b.customerPhone}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-900">{b.scheduleName}</div>
                          <div className="text-xs text-gray-500">{b.venue}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-700">
                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                            {formatDate(b.date)} • {b.time}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {b.depositUsed > 0
                            ? formatCurrency(b.depositUsed)
                            : "-"}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          {b.qrisAmount > 0
                            ? formatCurrency(b.qrisAmount)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRefundDialog(b)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Undo2 className="w-4 h-4 mr-1" />
                            Refund
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
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
                      Tanggal & Waktu
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">
                      BlaxPay
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">
                      QRIS
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">
                      Alasan
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">
                      Refunded At
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} />
                    ))
                  ) : history.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-gray-500"
                      >
                        Belum ada riwayat refund
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium text-gray-900">
                          {h.bookId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-gray-900">
                              {h.customerName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {h.customerPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-900">{h.scheduleName}</div>
                          <div className="text-xs text-gray-500">{h.venue}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-700">
                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                            {formatDate(h.date)} • {h.time}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {h.depositUsed > 0
                            ? formatCurrency(h.depositUsed)
                            : "-"}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          {h.totalAmount > 0
                            ? formatCurrency(h.totalAmount)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700 max-w-xs">
                          {h.reason}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(h.refundedAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!refundTarget}
        onOpenChange={(open) => !open && closeRefundDialog()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Refund</DialogTitle>
          </DialogHeader>
          {refundTarget && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  Tindakan ini tidak dapat dibatalkan. Booking akan di-refund
                  dan slot akan dikembalikan.
                </div>
              </div>

              {refundTarget.depositUsed > 0 &&
                refundTarget.qrisAmount === 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      Booking ini dibayar penuh menggunakan saldo BlaxPay.
                      Refund hanya akan dikembalikan ke saldo deposit BlaxPay,
                      tidak bisa di-refund dalam bentuk uang tunai.
                    </div>
                  </div>
                )}

              {refundTarget.qrisAmount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>
                      Hanya nominal QRIS (
                      {formatCurrency(refundTarget.qrisAmount)}) yang bisa
                      di-refund dalam bentuk uang.
                    </p>
                    {refundTarget.depositUsed > 0 && (
                      <p>
                        Sisa penggunaan deposit BlaxPay (
                        {formatCurrency(refundTarget.depositUsed)}) akan
                        dikembalikan ke saldo deposit customer.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-500">Booking ID</span>
                  <span className="font-medium text-gray-900">
                    {refundTarget.bookId}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-500">Customer</span>
                  <span className="font-medium text-gray-900">
                    {refundTarget.customerName}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-500">Schedule</span>
                  <span className="font-medium text-gray-900">
                    {refundTarget.scheduleName}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-500">Tanggal</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(refundTarget.date)} • {refundTarget.time}
                  </span>
                </div>
                {refundTarget.depositUsed > 0 && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-500">BlaxPay</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(refundTarget.depositUsed)}
                    </span>
                  </div>
                )}
                {refundTarget.qrisAmount > 0 && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-500">QRIS</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(refundTarget.qrisAmount)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Alasan Refund <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Contoh: Pemain tidak bisa hadir karena sakit"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button
                  variant="outline"
                  onClick={closeRefundDialog}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSubmitRefund}
                  disabled={submitting || !refundReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {submitting ? "Memproses..." : "Konfirmasi Refund"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
