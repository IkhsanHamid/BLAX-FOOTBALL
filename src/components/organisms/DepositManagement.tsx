"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, History, Loader2, Ticket, Download } from "lucide-react";
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
import { DepositHistory, VoucherHistoryRecord } from "@/types/admin";

const ITEMS_PER_PAGE = 10;

export default function DepositManagementComponent() {
  const { showSuccess, showError } = useNotifications();

  const [activeTab, setActiveTab] = useState<"all-deposit" | "history">(
    "all-deposit",
  );
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [depositSearch, setDepositSearch] = useState("");
  const [deposits, setDeposits] = useState<DepositHistory[]>([]);
  const [depositsPagination, setDepositsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    skip: 0,
    limit: ITEMS_PER_PAGE,
  });
  const [totalRemainingDeposit, setTotalRemainingDeposit] = useState(0);

  const [historySearch, setHistorySearch] = useState("");
  const [voucherHistories, setVoucherHistories] = useState<
    VoucherHistoryRecord[]
  >([]);
  const [historyPagination, setHistoryPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    skip: 0,
    limit: ITEMS_PER_PAGE,
  });

  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositHistory | null>(
    null,
  );
  const [voucherForm, setVoucherForm] = useState({
    nominal: "",
    name: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchDeposits = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (depositsPagination.currentPage - 1) * ITEMS_PER_PAGE;

      const result = await adminService.getDepositHistories(
        skip,
        ITEMS_PER_PAGE,
        depositSearch,
      );

      if (result?.data) {
        setDeposits(result.data);
        setTotalRemainingDeposit(result.summary?.totalRemainingDeposit || 0);
        setDepositsPagination({
          currentPage: depositsPagination.currentPage,
          totalPages: Math.ceil((result.totalData || 0) / ITEMS_PER_PAGE),
          total: result.totalData || 0,
          skip: result.skip || 0,
          limit: result.limit || ITEMS_PER_PAGE,
        });
      } else {
        setDeposits([]);
        setDepositsPagination({
          currentPage: 1,
          totalPages: 1,
          total: 0,
          skip: 0,
          limit: ITEMS_PER_PAGE,
        });
        setTotalRemainingDeposit(0);
      }
    } catch (error: any) {
      console.error("Error fetching deposits:", error);
      showError("Error", error?.message || "Failed to fetch deposits");
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  }, [depositsPagination.currentPage, depositSearch, showError]);

  const fetchVoucherHistories = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (historyPagination.currentPage - 1) * ITEMS_PER_PAGE;

      const result = await adminService.getVoucherHistories(
        skip,
        ITEMS_PER_PAGE,
        historySearch,
      );

      if (result?.data) {
        setVoucherHistories(result.data);
        setHistoryPagination({
          currentPage: historyPagination.currentPage,
          totalPages: Math.ceil((result.totalData || 0) / ITEMS_PER_PAGE),
          total: result.totalData || 0,
          skip: result.skip || 0,
          limit: result.limit || ITEMS_PER_PAGE,
        });
      } else {
        setVoucherHistories([]);
        setHistoryPagination({
          currentPage: 1,
          totalPages: 1,
          total: 0,
          skip: 0,
          limit: ITEMS_PER_PAGE,
        });
      }
    } catch (error: any) {
      console.error("Error fetching voucher histories:", error);
      showError("Error", error?.message || "Failed to fetch voucher histories");
      setVoucherHistories([]);
    } finally {
      setLoading(false);
    }
  }, [historyPagination.currentPage, historySearch, showError]);

  useEffect(() => {
    if (activeTab === "all-deposit") {
      fetchDeposits();
    }
  }, [activeTab, depositsPagination.currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const depositSearchTerm = depositSearch.trim();
      const historySearchTerm = historySearch.trim();

      if (activeTab === "all-deposit") {
        if (depositSearchTerm.length >= 3 || depositSearchTerm.length === 0) {
          setDepositsPagination((prev) => ({ ...prev, currentPage: 1 }));
          fetchDeposits();
        }
      } else {
        if (historySearchTerm.length >= 3 || historySearchTerm.length === 0) {
          setHistoryPagination((prev) => ({ ...prev, currentPage: 1 }));
          fetchVoucherHistories();
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [depositSearch, historySearch, activeTab]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchVoucherHistories();
    }
  }, [activeTab, historyPagination.currentPage]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchVoucherHistories();
    }
  }, [activeTab, historyPagination.currentPage, historySearch]);

  const handleOpenVoucherModal = (deposit: DepositHistory) => {
    setSelectedDeposit(deposit);
    setVoucherForm({ nominal: "", name: "", description: "" });
    setFormErrors({});
    setShowVoucherModal(true);
  };

  const handleCloseVoucherModal = () => {
    setShowVoucherModal(false);
    setSelectedDeposit(null);
    setVoucherForm({ nominal: "", name: "", description: "" });
    setFormErrors({});
  };

  const handleVoucherFormChange = (field: string, value: string) => {
    setVoucherForm((prev) => ({ ...prev, [field]: value }));

    if (field === "nominal" && selectedDeposit) {
      const nominal = parseInt(value);
      if (value.trim() && !isNaN(nominal) && nominal > selectedDeposit.total) {
        setFormErrors((prev) => ({
          ...prev,
          nominal: `Nominal tidak boleh lebih dari saldo deposit (${formatCurrency(selectedDeposit.total)})`,
        }));
      } else {
        setFormErrors((prev) => ({ ...prev, [field]: "" }));
      }
    } else {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateVoucherForm = () => {
    const errors: Record<string, string> = {};
    const nominal = parseInt(voucherForm.nominal);

    if (!voucherForm.nominal.trim()) {
      errors.nominal = "Nominal is required";
    } else if (isNaN(nominal) || nominal <= 0) {
      errors.nominal = "Nominal harus lebih dari 0";
    } else if (selectedDeposit && nominal > selectedDeposit.total) {
      errors.nominal = `Nominal tidak boleh lebih dari saldo deposit (${formatCurrency(selectedDeposit.total)})`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateVoucher = async () => {
    if (!selectedDeposit || !validateVoucherForm()) return;

    try {
      setActionLoading("create-voucher");
      const nominal = parseInt(voucherForm.nominal);
      const name = voucherForm.name.trim() || undefined;
      const description = voucherForm.description.trim() || undefined;

      await adminService.createVoucher(
        selectedDeposit.id,
        nominal,
        name,
        description,
      );

      showSuccess("Voucher created successfully!");
      handleCloseVoucherModal();
      fetchDeposits();
    } catch (error: any) {
      showError("Error", error?.message || "Failed to create voucher");
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportDeposits = async () => {
    try {
      setExporting(true);
      const result = await adminService.exportDepositHistories(depositSearch);

      if (!result.data || result.data.length === 0) {
        showError("Error", "No data to export");
        return;
      }

      const headers = [
        "No",
        "Nama User",
        "No. Telepon",
        "Booking ID",
        "Total Deposit",
        "Dibuat",
      ];

      const rows = result.data.map((deposit, index) => [
        index + 1,
        deposit.userName,
        deposit.userPhone,
        deposit.bookingId,
        deposit.total,
        new Date(deposit.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      ]);

      exportToExcel("Deposit_History", headers, rows);
      showSuccess("Export berhasil!");
    } catch (error: any) {
      showError("Error", error?.message || "Failed to export");
    } finally {
      setExporting(false);
    }
  };

  const handleExportVouchers = async () => {
    try {
      setExporting(true);
      const result = await adminService.exportVoucherHistories(historySearch);

      if (!result.data || result.data.length === 0) {
        showError("Error", "No data to export");
        return;
      }

      const headers = [
        "No",
        "Nama User",
        "No. Telepon",
        "Kode Voucher",
        "Nama Voucher",
        "Nominal",
        "Tipe",
        "Used Booking",
        "Used Schedule",
        "Sisa Deposit",
        "Dibuat Oleh",
        "Dibuat",
      ];

      const rows = result.data.map((voucher, index) => [
        index + 1,
        voucher.userName,
        voucher.userPhone,
        voucher.voucherCode,
        voucher.voucherName,
        voucher.voucherNominal,
        voucher.voucherType,
        voucher.usedBookingId || "-",
        voucher.usedScheduleName || "-",
        voucher.depositRemaining,
        voucher.createdByName,
        new Date(voucher.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      ]);

      exportToExcel("Voucher_History", headers, rows);
      showSuccess("Export berhasil!");
    } catch (error: any) {
      showError("Error", error?.message || "Failed to export");
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = (
    sheetName: string,
    headers: string[],
    rows: (string | number)[][],
  ) => {
    const csvContent = [
      headers.join("\t"),
      ...rows.map((row) => row.join("\t")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sheetName}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Deposit Management</h2>
        <p className="text-gray-600 mt-1">Kelola deposit dan voucher</p>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("all-deposit")}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === "all-deposit"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>All Deposit</span>
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

      {activeTab === "all-deposit" && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mt-4 mb-4">
                <h3 className="text-lg font-semibold">Semua Deposit</h3>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportDeposits}
                    disabled={deposits.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Deposit</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(totalRemainingDeposit)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by player name or phone..."
                  value={depositSearch}
                  onChange={(e) => setDepositSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-spin" />
                  <p className="text-gray-600">Loading...</p>
                </div>
              ) : deposits.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No deposits found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deposits.map((deposit) => (
                        <TableRow key={deposit.id}>
                          <TableCell className="font-medium">
                            {deposit.userName}
                          </TableCell>
                          <TableCell>{deposit.userPhone}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {deposit.bookingId}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(deposit.total)}
                          </TableCell>
                          <TableCell>{formatDate(deposit.createdAt)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="black"
                              onClick={() => handleOpenVoucherModal(deposit)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Buat Voucher
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {depositsPagination.totalPages > 1 && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={depositsPagination.currentPage}
                        totalPages={depositsPagination.totalPages}
                        onPageChange={(page) =>
                          setDepositsPagination((prev) => ({
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
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mt-4 mb-4">
                Riwayat Voucher
              </h3>

              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by user name or code..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportVouchers}
                  disabled={voucherHistories.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-spin" />
                  <p className="text-gray-600">Loading...</p>
                </div>
              ) : voucherHistories.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No voucher histories found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Voucher Code</TableHead>
                        <TableHead>Voucher Name</TableHead>
                        <TableHead>Nominal</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Used Booking</TableHead>
                        <TableHead>Used Schedule</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voucherHistories.map((history) => (
                        <TableRow key={history.id}>
                          <TableCell className="font-medium">
                            {history.userName}
                          </TableCell>
                          <TableCell>{history.userPhone}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {history.voucherCode}
                            </Badge>
                          </TableCell>
                          <TableCell>{history.voucherName}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(history.voucherNominal)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="success">
                              {history.voucherType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {history.usedBookingId && (
                              <Badge variant="outline" className="text-xs">
                                {history.usedBookingId}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {history.usedScheduleName || "-"}
                          </TableCell>
                          <TableCell>{formatDate(history.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {historyPagination.totalPages > 1 && (
                    <div className="mt-4">
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
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showVoucherModal} onOpenChange={handleCloseVoucherModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Voucher</DialogTitle>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Detail Deposit
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">User:</span>
                    <span className="font-medium">
                      {selectedDeposit.userName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span>{selectedDeposit.userPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(selectedDeposit.total)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nominal Voucher *
                </label>
                <Input
                  type="number"
                  value={voucherForm.nominal}
                  onChange={(e) =>
                    handleVoucherFormChange("nominal", e.target.value)
                  }
                  placeholder="Masukkan nominal voucher..."
                  error={formErrors.nominal}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nama Voucher (Opsional)
                </label>
                <Input
                  value={voucherForm.name}
                  onChange={(e) =>
                    handleVoucherFormChange("name", e.target.value)
                  }
                  placeholder="Contoh: Voucher Ulang Tahun"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={voucherForm.description}
                  onChange={(e) =>
                    handleVoucherFormChange("description", e.target.value)
                  }
                  placeholder="Masukkan deskripsi voucher..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCloseVoucherModal}
                  disabled={actionLoading === "create-voucher"}
                >
                  Cancel
                </Button>
                <Button
                  variant="black"
                  onClick={handleCreateVoucher}
                  disabled={actionLoading === "create-voucher"}
                >
                  {actionLoading === "create-voucher" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Buat Voucher"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
