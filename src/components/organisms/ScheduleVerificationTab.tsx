"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  User,
  AlertCircle,
  Image as ImageIcon,
  Edit3,
} from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent } from "../atoms/Card";
import Input from "../atoms/Input";
import Pagination from "../atoms/Pagination";
import Badge from "../atoms/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../atoms/Dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../atoms/Table";
import { useNotifications } from "./NotificationContainer";
import { formatCurrency, formatDate } from "@/lib/helper";
import { adminService } from "@/utils/admin";
import ScheduleRevisionForm from "./ScheduleRevisionForm";
import ConfirmationModal from "../molecules/ConfirmationModal";
import { useAuth } from "@/contexts/AuthContext";
import type {
  PendingVerificationItem,
  RejectedScheduleItem,
  VerificationDetail,
} from "@/types/schedule";

type TabKey = "pending" | "rejected";

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

export default function ScheduleVerificationTab() {
  const { user } = useAuth();
  const isAdminOrOwner =
    user?.role === "Admin" || user?.role === "Owner";

  const [activeTab, setActiveTab] = useState<TabKey>(
    isAdminOrOwner ? "pending" : "rejected",
  );
  const [pendingItems, setPendingItems] = useState<PendingVerificationItem[]>(
    [],
  );
  const [rejectedItems, setRejectedItems] = useState<RejectedScheduleItem[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(false);

  const [detailItem, setDetailItem] = useState<VerificationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const [rejectedDetail, setRejectedDetail] =
    useState<RejectedScheduleItem | null>(null);
  const [revisionTargetId, setRevisionTargetId] = useState<string | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { showSuccess, showError } = useNotifications();

  const fetchPending = useCallback(async (page: number) => {
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const skip = (page - 1) * itemsPerPage;
      const response = await adminService.getPendingVerification(skip, itemsPerPage);
      setPendingItems(response?.data?.data ?? []);
      setTotal(response?.data?.meta?.total ?? 0);
    } catch (error) {
      console.error("Error fetching pending verification:", error);
      showError("Error", "Gagal memuat daftar verifikasi jadwal");
      setPendingItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [showError]);

  const fetchRejected = useCallback(async (page: number) => {
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const skip = (page - 1) * itemsPerPage;
      const response = await adminService.getRejectedSchedules(skip, itemsPerPage);
      setRejectedItems(response?.data?.data ?? []);
      setTotal(response?.data?.meta?.total ?? 0);
    } catch (error) {
      console.error("Error fetching rejected schedules:", error);
      showError("Error", "Gagal memuat daftar jadwal ditolak");
      setRejectedItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [showError]);

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (activeTab === "pending") {
      await fetchPending(currentPage);
    } else {
      await fetchRejected(currentPage);
    }
  }, [activeTab, currentPage, fetchPending, fetchRejected]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;
    setCurrentPage(1);
  }, [debouncedSearch, activeTab]);

  useEffect(() => {
    if (!mountedRef.current) return;
    fetchData();
  }, [currentPage, activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    showSuccess("Data verifikasi berhasil diperbarui");
  };

  const openDetail = async (id: string) => {
    setDetailItem(null);
    setDetailLoading(true);
    try {
      const response = await adminService.getVerificationDetail(id);
      setDetailItem(response.data);
    } catch (error: any) {
      console.error("Error fetching detail:", error);
      showError("Error", error?.message || "Gagal memuat detail jadwal");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailItem(null);
    setRejectReason("");
    setShowRejectDialog(false);
  };

  const handleApprove = async () => {
    if (!detailItem) return;
    setShowApproveConfirm(true);
  };

  const confirmApprove = async () => {
    if (!detailItem) return;
    setActionLoading(true);
    try {
      await adminService.verifySchedule({
        scheduleId: detailItem.id,
        action: "approve",
      });
      showSuccess("Jadwal berhasil disetujui");
      setShowApproveConfirm(false);
      closeDetail();
      await fetchData();
    } catch (error: any) {
      console.error("Error approving:", error);
      showError("Gagal menyetujui", error?.message || "Terjadi kesalahan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!detailItem) return;
    if (!rejectReason.trim()) {
      showError("Validasi gagal", "Alasan penolakan wajib diisi");
      return;
    }
    setActionLoading(true);
    try {
      await adminService.verifySchedule({
        scheduleId: detailItem.id,
        action: "reject",
        rejectReason: rejectReason.trim(),
      });
      showSuccess("Jadwal berhasil ditolak");
      closeDetail();
      await fetchData();
    } catch (error: any) {
      console.error("Error rejecting:", error);
      showError("Gagal menolak", error?.message || "Terjadi kesalahan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevisionSuccess = () => {
    setRevisionTargetId(null);
    if (activeTab === "rejected") {
      fetchData();
    } else {
      setActiveTab("pending");
    }
  };

  const handleDeleteRejected = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await adminService.deleteRejectedSchedule(deleteTarget.id);
      showSuccess("Berhasil", "Schedule berhasil dihapus permanen");
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      showError("Error", err?.message || "Gagal menghapus schedule");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPending = debouncedSearch
    ? pendingItems.filter(
        (it) =>
          it.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          it.community
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          it.createdBy
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()),
      )
    : pendingItems;

  const filteredRejected = debouncedSearch
    ? rejectedItems.filter(
        (it) =>
          it.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          it.community
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          it.createdBy
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()),
      )
    : rejectedItems;

  const items = activeTab === "pending" ? filteredPending : filteredRejected;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-xl font-semibold text-gray-900">
          Verifikasi Jadwal
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isAdminOrOwner
            ? "Review dan setujui jadwal dari community selain Blax yang menunggu verifikasi."
            : "Lihat jadwal yang ditolak dan lakukan revisi."}
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
              {isAdminOrOwner && (
                <button
                  onClick={() => {
                    setActiveTab("pending");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${
                    activeTab === "pending"
                      ? "bg-white text-sky-700 shadow-sm font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Menunggu Verifikasi
                </button>
              )}
              {!isAdminOrOwner && (
                <button
                  onClick={() => {
                    setActiveTab("rejected");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${
                    activeTab === "rejected"
                      ? "bg-white text-sky-700 shadow-sm font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Ditolak
                </button>
              )}
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-sm text-gray-600">
                Total:{" "}
                <span className="font-semibold text-gray-900">{total}</span>{" "}
                {activeTab === "pending"
                  ? "jadwal menunggu verifikasi"
                  : "jadwal ditolak"}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari nama, community, atau creator..."
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-900">
                    Nama Jadwal
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900">
                    Community
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900">
                    Venue
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900">
                    Tanggal & Waktu
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900">
                    Tipe
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900">
                    Creator
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
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      {activeTab === "pending"
                        ? "Tidak ada jadwal yang menunggu verifikasi"
                        : "Tidak ada jadwal yang ditolak"}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((it: any) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium text-gray-900">
                        {it.name}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 capitalize">
                          {it.community}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {it.venue}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-700">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {formatDate(it.date)} • {it.time}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {it.typeMatch} • {it.team} team
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-gray-900 text-sm">
                              {it.createdBy}
                            </div>
                            <div className="text-xs text-gray-500">
                              {it.createdByPhone}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {activeTab === "pending" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetail(it.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectedDetail(it)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Detail
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setRevisionTargetId(it.id)}
                              className="bg-sky-600 hover:bg-sky-700 text-white"
                            >
                              <Edit3 className="w-4 h-4 mr-1" />
                              Revisi
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => setDeleteTarget(it)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Hapus
                            </Button>
                          </div>
                        )}
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

      {/* Detail Modal */}
      <Dialog
        open={!!detailItem || detailLoading}
        onOpenChange={(open) => !open && closeDetail()}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detail Verifikasi Jadwal</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-12 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
              <p className="text-gray-500 text-sm">Memuat detail...</p>
            </div>
          ) : detailItem ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-500">Nama</span>
                    <span className="font-medium text-gray-900">
                      {detailItem.name}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-500">Community</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {detailItem.community}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-500">Venue</span>
                    <span className="font-medium text-gray-900">
                      {detailItem.venue.name}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-500">Tipe</span>
                    <span className="font-medium text-gray-900">
                      {detailItem.typeEvent} • {detailItem.typeMatch}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-500">Tanggal</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(detailItem.date)} • {detailItem.time}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-500">Team</span>
                    <span className="font-medium text-gray-900">
                      {detailItem.team}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-500">Fee Player</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(detailItem.feePlayer)}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-500">Fee GK</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(detailItem.feeGk)}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
                  <div className="px-4 py-2.5 text-sm">
                    <div className="text-gray-500 mb-1">Creator</div>
                    <div className="font-medium text-gray-900">
                      {detailItem.createdBy.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {detailItem.createdBy.phone}
                    </div>
                    <div className="text-xs text-gray-500">
                      {detailItem.createdBy.email}
                    </div>
                  </div>
                  <div className="px-4 py-2.5 text-sm">
                    <div className="text-gray-500 mb-1">Fasilitas</div>
                    <div className="flex flex-wrap gap-1">
                      {detailItem.facilities.length === 0 ? (
                        <span className="text-gray-400">-</span>
                      ) : (
                        detailItem.facilities.map((f) => (
                          <Badge key={f.id} variant="outline">
                            {f.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-2.5 text-sm">
                    <div className="text-gray-500 mb-1">Rules</div>
                    <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                      {detailItem.rules.length === 0 ? (
                        <li className="text-gray-400">-</li>
                      ) : (
                        detailItem.rules.map((r) => (
                          <li key={r.id}>{r.description}</li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Gambar Jadwal
                  </div>
                  {detailItem.imageUrl ? (
                    <a
                      href={detailItem.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <img
                        src={detailItem.imageUrl}
                        alt="Schedule"
                        className="w-full max-h-64 object-contain rounded-lg border border-gray-200 bg-gray-50"
                      />
                    </a>
                  ) : (
                    <div className="text-sm text-gray-400">-</div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" />
                    Bukti Pembayaran Lapangan
                  </div>
                  {detailItem.paymentProof ? (
                    <a
                      href={detailItem.paymentProof}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <img
                        src={detailItem.paymentProof}
                        alt="Payment Proof"
                        className="w-full max-h-64 object-contain rounded-lg border border-gray-200 bg-gray-50"
                      />
                    </a>
                  ) : (
                    <div className="text-sm text-gray-400">
                      Tidak ada bukti pembayaran
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={closeDetail}
                  disabled={actionLoading}
                >
                  Tutup
                </Button>
                <Button
                  onClick={() => setShowRejectDialog(true)}
                  disabled={actionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Tolak
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {actionLoading ? "Memproses..." : "Setujui"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog
        open={showRejectDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowRejectDialog(false);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alasan Penolakan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                Alasan penolakan akan dikirimkan ke creator via email.
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Alasan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Bukti pembayaran tidak valid / tidak sesuai"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason("");
                }}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {actionLoading ? "Memproses..." : "Konfirmasi Tolak"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejected Detail Modal */}
      <Dialog
        open={!!rejectedDetail}
        onOpenChange={(open) => !open && setRejectedDetail(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Jadwal Ditolak</DialogTitle>
          </DialogHeader>
          {rejectedDetail && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-red-800 mb-1">
                    Alasan Penolakan
                  </div>
                  <div className="text-sm text-red-700">
                    {rejectedDetail.rejectReason || "-"}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-500">Nama</span>
                  <span className="font-medium text-gray-900">
                    {rejectedDetail.name}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-500">Community</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {rejectedDetail.community}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-500">Venue</span>
                  <span className="font-medium text-gray-900">
                    {rejectedDetail.venue}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-500">Tipe</span>
                  <span className="font-medium text-gray-900">
                    {rejectedDetail.typeMatch} • {rejectedDetail.team} team
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-500">Tanggal</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(rejectedDetail.date)} • {rejectedDetail.time}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-500">Creator</span>
                  <span className="font-medium text-gray-900">
                    {rejectedDetail.createdBy} ({rejectedDetail.createdByPhone})
                  </span>
                </div>
                {rejectedDetail.rejectedAt && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-500">Ditolak pada</span>
                    <span className="font-medium text-gray-900">
                      {new Date(rejectedDetail.rejectedAt).toLocaleString(
                        "id-ID",
                        { dateStyle: "medium", timeStyle: "short" },
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" />
                    Gambar Jadwal
                  </div>
                  {rejectedDetail.imageUrl ? (
                    <a
                      href={rejectedDetail.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={rejectedDetail.imageUrl}
                        alt="Schedule"
                        className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
                      />
                    </a>
                  ) : (
                    <div className="text-sm text-gray-400">-</div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" />
                    Bukti Pembayaran
                  </div>
                  {rejectedDetail.paymentProof ? (
                    <a
                      href={rejectedDetail.paymentProof}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={rejectedDetail.paymentProof}
                        alt="Payment Proof"
                        className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
                      />
                    </a>
                  ) : (
                    <div className="text-sm text-gray-400">-</div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <Button
                  variant="outline"
                  onClick={() => setRejectedDetail(null)}
                >
                  Tutup
                </Button>
                <Button
                  onClick={() => {
                    setRevisionTargetId(rejectedDetail.id);
                    setRejectedDetail(null);
                  }}
                  className="bg-sky-600 hover:bg-sky-700 text-white"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Revisi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revision Form Modal */}
      <Dialog
        open={!!revisionTargetId}
        onOpenChange={(open) => !open && setRevisionTargetId(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisi Jadwal</DialogTitle>
          </DialogHeader>
          {revisionTargetId && (
            <ScheduleRevisionForm
              scheduleId={revisionTargetId}
              onClose={() => setRevisionTargetId(null)}
              onSuccess={handleRevisionSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={showApproveConfirm}
        onClose={() => {
          if (!actionLoading) setShowApproveConfirm(false);
        }}
        onConfirm={confirmApprove}
        title="Setujui Jadwal"
        message={
          detailItem
            ? `Setujui jadwal "${detailItem.name}"? Tindakan ini akan mengirim email notifikasi ke creator.`
            : ""
        }
        type="info"
        confirmText={actionLoading ? "Memproses..." : "Setujui"}
        cancelText="Batal"
        isLoading={actionLoading}
      />

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!actionLoading) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteRejected}
        title="Hapus Jadwal Ditolak"
        message={
          deleteTarget
            ? `Hapus permanen jadwal "${deleteTarget.name}"? Tindakan ini tidak dapat dibatalkan.`
            : ""
        }
        type="danger"
        confirmText={actionLoading ? "Menghapus..." : "Hapus Permanen"}
        cancelText="Batal"
        isLoading={actionLoading}
      />
    </div>
  );
}
