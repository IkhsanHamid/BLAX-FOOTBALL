"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  History,
  Loader2,
  Ticket,
  Download,
  ArrowDownUp,
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
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { formatDate } from "@/lib/helper";
import Pagination from "@/components/atoms/Pagination";
import { adminService } from "@/utils/admin";
import {
  DepositHistory,
  DepositHistoryRecord,
  DepositUsage,
  VoucherHistoryRecord,
} from "@/types/admin";

const ITEMS_PER_PAGE = 10;

export default function DepositManagementComponent() {
  const { showSuccess, showError } = useNotifications();

  const [activeTab, setActiveTab] = useState<
    "all-deposit" | "history" | "voucher-history" | "usage"
  >("all-deposit");
  const [loading, setLoading] = useState(false);
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
  const [historyRecords, setHistoryRecords] = useState<DepositHistoryRecord[]>(
    [],
  );
  const [historyPagination, setHistoryPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    skip: 0,
    limit: ITEMS_PER_PAGE,
  });
  const [totalActiveBalance, setTotalActiveBalance] = useState(0);

  const [voucherSearch, setVoucherSearch] = useState("");
  const [voucherHistories, setVoucherHistories] = useState<
    VoucherHistoryRecord[]
  >([]);
  const [voucherPagination, setVoucherPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    skip: 0,
    limit: ITEMS_PER_PAGE,
  });

  const [usageSearch, setUsageSearch] = useState("");
  const [usages, setUsages] = useState<DepositUsage[]>([]);
  const [usagePagination, setUsagePagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    skip: 0,
    limit: ITEMS_PER_PAGE,
  });
  const [usageSummary, setUsageSummary] = useState({
    totalUsage: 0,
    totalAmount: 0,
  });

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

  const fetchAdminDepositHistories = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (historyPagination.currentPage - 1) * ITEMS_PER_PAGE;

      const result = await adminService.getAdminDepositHistories(
        skip,
        ITEMS_PER_PAGE,
        historySearch,
      );

      if (result?.data) {
        setHistoryRecords(result.data);
        setTotalActiveBalance(result.summary?.totalActiveBalance || 0);
        setHistoryPagination({
          currentPage: historyPagination.currentPage,
          totalPages: Math.ceil((result.totalData || 0) / ITEMS_PER_PAGE),
          total: result.totalData || 0,
          skip: result.skip || 0,
          limit: result.limit || ITEMS_PER_PAGE,
        });
      } else {
        setHistoryRecords([]);
        setHistoryPagination({
          currentPage: 1,
          totalPages: 1,
          total: 0,
          skip: 0,
          limit: ITEMS_PER_PAGE,
        });
        setTotalActiveBalance(0);
      }
    } catch (error: any) {
      console.error("Error fetching deposit histories:", error);
      showError("Error", error?.message || "Failed to fetch deposit histories");
      setHistoryRecords([]);
    } finally {
      setLoading(false);
    }
  }, [historyPagination.currentPage, historySearch, showError]);

  const fetchVoucherHistories = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (voucherPagination.currentPage - 1) * ITEMS_PER_PAGE;

      const result = await adminService.getVoucherHistories(
        skip,
        ITEMS_PER_PAGE,
        voucherSearch,
      );

      if (result?.data) {
        setVoucherHistories(result.data);
        setVoucherPagination({
          currentPage: voucherPagination.currentPage,
          totalPages: Math.ceil((result.totalData || 0) / ITEMS_PER_PAGE),
          total: result.totalData || 0,
          skip: result.skip || 0,
          limit: result.limit || ITEMS_PER_PAGE,
        });
      } else {
        setVoucherHistories([]);
        setVoucherPagination({
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
  }, [voucherPagination.currentPage, voucherSearch, showError]);

  const fetchDepositUsages = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (usagePagination.currentPage - 1) * ITEMS_PER_PAGE;

      const result = await adminService.getDepositUsages(
        skip,
        ITEMS_PER_PAGE,
        usageSearch,
      );

      if (result?.data) {
        setUsages(result.data);
        setUsageSummary(result.summary || { totalUsage: 0, totalAmount: 0 });
        setUsagePagination({
          currentPage: usagePagination.currentPage,
          totalPages: Math.ceil((result.totalData || 0) / ITEMS_PER_PAGE),
          total: result.totalData || 0,
          skip: result.skip || 0,
          limit: result.limit || ITEMS_PER_PAGE,
        });
      } else {
        setUsages([]);
        setUsagePagination({
          currentPage: 1,
          totalPages: 1,
          total: 0,
          skip: 0,
          limit: ITEMS_PER_PAGE,
        });
        setUsageSummary({ totalUsage: 0, totalAmount: 0 });
      }
    } catch (error: any) {
      console.error("Error fetching deposit usages:", error);
      showError("Error", error?.message || "Failed to fetch deposit usages");
      setUsages([]);
    } finally {
      setLoading(false);
    }
  }, [usagePagination.currentPage, usageSearch, showError]);

  useEffect(() => {
    if (activeTab === "all-deposit") {
      fetchDeposits();
    }
  }, [activeTab, depositsPagination.currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const depositSearchTerm = depositSearch.trim();
      const historySearchTerm = historySearch.trim();
      const voucherSearchTerm = voucherSearch.trim();
      const usageSearchTerm = usageSearch.trim();

      if (activeTab === "all-deposit") {
        if (depositSearchTerm.length >= 3 || depositSearchTerm.length === 0) {
          setDepositsPagination((prev) => ({ ...prev, currentPage: 1 }));
          fetchDeposits();
        }
      } else if (activeTab === "history") {
        if (historySearchTerm.length >= 3 || historySearchTerm.length === 0) {
          setHistoryPagination((prev) => ({ ...prev, currentPage: 1 }));
          fetchAdminDepositHistories();
        }
      } else if (activeTab === "voucher-history") {
        if (voucherSearchTerm.length >= 3 || voucherSearchTerm.length === 0) {
          setVoucherPagination((prev) => ({ ...prev, currentPage: 1 }));
          fetchVoucherHistories();
        }
      } else {
        if (usageSearchTerm.length >= 3 || usageSearchTerm.length === 0) {
          setUsagePagination((prev) => ({ ...prev, currentPage: 1 }));
          fetchDepositUsages();
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [depositSearch, historySearch, voucherSearch, usageSearch, activeTab]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchAdminDepositHistories();
    }
  }, [activeTab, historyPagination.currentPage]);

  useEffect(() => {
    if (activeTab === "voucher-history") {
      fetchVoucherHistories();
    }
  }, [activeTab, voucherPagination.currentPage]);

  useEffect(() => {
    if (activeTab === "usage") {
      fetchDepositUsages();
    }
  }, [activeTab, usagePagination.currentPage]);

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

  const handleExportHistories = async () => {
    try {
      setExporting(true);
      const result =
        await adminService.exportAdminDepositHistories(historySearch);

      if (!result.data || result.data.length === 0) {
        showError("Error", "No data to export");
        return;
      }

      const headers = [
        "No",
        "Nama User",
        "No. Telepon",
        "Tipe",
        "Amount",
        "Status",
        "Saldo Sebelum",
        "Saldo Sesudah",
        "Dibuat",
      ];

      const rows = result.data.map((record, index) => [
        index + 1,
        record.userName,
        record.userPhone,
        record.type,
        record.amount,
        record.paymentStatus || "-",
        record.balanceBefore,
        record.balanceAfter,
        new Date(record.createdAt).toLocaleDateString("id-ID", {
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

  const handleExportVoucherHistories = async () => {
    try {
      setExporting(true);
      const result = await adminService.exportVoucherHistories(voucherSearch);

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
        <button
          onClick={() => setActiveTab("voucher-history")}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === "voucher-history"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Voucher History</span>
        </button>
        <button
          onClick={() => setActiveTab("usage")}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === "usage"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <ArrowDownUp className="w-4 h-4" />
          <span>Usage History</span>
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
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mt-4">Total Saldo Aktif</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(totalActiveBalance)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mt-4 mb-4">
                Riwayat Deposit
              </h3>

              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by user name..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportHistories}
                  disabled={historyRecords.length === 0}
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
              ) : historyRecords.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No deposit history found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Saldo Sebelum</TableHead>
                        <TableHead>Saldo Sesudah</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {record.userName}
                          </TableCell>
                          <TableCell>{record.userPhone}</TableCell>
                          <TableCell>
                            <Badge variant="default">
                              {record.type}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`font-medium ${record.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatCurrency(record.amount)}
                          </TableCell>
                          <TableCell>
                            {record.paymentStatus ? (
                              <Badge
                                variant={
                                  record.paymentStatus.toLowerCase() === "paid" ||
                                  record.paymentStatus.toLowerCase() === "success"
                                    ? "success"
                                    : record.paymentStatus.toLowerCase() === "failed"
                                      ? "destructive"
                                      : "default"
                                }
                              >
                                {record.paymentStatus}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(record.balanceBefore)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(record.balanceAfter)}
                          </TableCell>
                          <TableCell>{formatDate(record.createdAt)}</TableCell>
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

      {activeTab === "voucher-history" && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mt-4 mb-4">
                Riwayat Voucher{" "}
                <span className="text-sm font-normal text-red-500">
                  (data lama yang akan di hapus)
                </span>
              </h3>

              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by user name or code..."
                    value={voucherSearch}
                    onChange={(e) => setVoucherSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportVoucherHistories}
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

                  {voucherPagination.totalPages > 1 && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={voucherPagination.currentPage}
                        totalPages={voucherPagination.totalPages}
                        onPageChange={(page) =>
                          setVoucherPagination((prev) => ({
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

      {activeTab === "usage" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mt-4">Total Penggunaan</p>
                <p className="text-xl font-bold text-gray-900">
                  {usageSummary.totalUsage}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mt-4">Total Jumlah</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(usageSummary.totalAmount)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mt-4 mb-4">
                History Penggunaan Deposit
              </h3>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by user name..."
                  value={usageSearch}
                  onChange={(e) => setUsageSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-spin" />
                  <p className="text-gray-600">Loading...</p>
                </div>
              ) : usages.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowDownUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No usage history found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Balance Before</TableHead>
                        <TableHead>Balance After</TableHead>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usages.map((usage) => (
                        <TableRow key={usage.id}>
                          <TableCell className="font-medium">
                            {usage.userName}
                          </TableCell>
                          <TableCell>{usage.userPhone}</TableCell>
                          <TableCell className="font-medium text-red-600">
                            {formatCurrency(usage.amount)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(usage.balanceBefore)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(usage.balanceAfter)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {usage.bookingId}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {usage.scheduleName} ({usage.scheduleTime})
                          </TableCell>
                          <TableCell>{usage.venueName}</TableCell>
                          <TableCell>{formatDate(usage.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {usagePagination.totalPages > 1 && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={usagePagination.currentPage}
                        totalPages={usagePagination.totalPages}
                        onPageChange={(page) =>
                          setUsagePagination((prev) => ({
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
    </div>
  );
}
