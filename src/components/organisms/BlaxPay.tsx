"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Plus,
  History,
  ArrowDownUp,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
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
import Pagination from "@/components/atoms/Pagination";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { formatCurrency, formatDate } from "@/lib/helper";
import { depositService } from "@/utils/deposit";
import type {
  UserDepositBalance,
  UserDepositHistory,
  UserDepositUsage,
} from "@/types/deposit";

const ITEMS_PER_PAGE = 10;

export default function BlaxPay() {
  const router = useRouter();
  const { showSuccess, showError } = useNotifications();

  const [activeTab, setActiveTab] = useState<"topup" | "history" | "usage">(
    "topup",
  );
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<UserDepositBalance | null>(null);

  const [topupAmount, setTopupAmount] = useState("");
  const [topupError, setTopupError] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);

  const [histories, setHistories] = useState<UserDepositHistory[]>([]);
  const [historyPagination, setHistoryPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [historySummary, setHistorySummary] = useState({
    totalTopup: 0,
    totalUsage: 0,
    totalReschedule: 0,
    totalAmount: 0,
  });

  const [usages, setUsages] = useState<UserDepositUsage[]>([]);
  const [usagePagination, setUsagePagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [usageSummary, setUsageSummary] = useState({
    totalUsage: 0,
    totalAmount: 0,
  });

  const fetchBalance = useCallback(async () => {
    try {
      const result = await depositService.getBalance();
      setBalance(result);
    } catch (error: any) {
      console.error("Error fetching balance:", error);
    }
  }, []);

  const fetchHistories = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (historyPagination.currentPage - 1) * ITEMS_PER_PAGE;
      const result = await depositService.getHistory(skip, ITEMS_PER_PAGE);
      if (result?.data) {
        setHistories(result.data);
        setHistorySummary(
          result.summary || {
            totalTopup: 0,
            totalUsage: 0,
            totalReschedule: 0,
            totalAmount: 0,
          },
        );
        setHistoryPagination({
          currentPage: historyPagination.currentPage,
          totalPages: Math.ceil((result.totalData || 0) / ITEMS_PER_PAGE),
          total: result.totalData || 0,
        });
      }
    } catch (error: any) {
      console.error("Error fetching deposit history:", error);
      showError("Error", error?.message || "Failed to fetch history");
      setHistories([]);
    } finally {
      setLoading(false);
    }
  }, [historyPagination.currentPage, showError]);

  const fetchUsages = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (usagePagination.currentPage - 1) * ITEMS_PER_PAGE;
      const result = await depositService.getUsage(skip, ITEMS_PER_PAGE);
      if (result?.data) {
        setUsages(result.data);
        setUsageSummary(result.summary || { totalUsage: 0, totalAmount: 0 });
        setUsagePagination({
          currentPage: usagePagination.currentPage,
          totalPages: Math.ceil((result.totalData || 0) / ITEMS_PER_PAGE),
          total: result.totalData || 0,
        });
      }
    } catch (error: any) {
      console.error("Error fetching deposit usage:", error);
      showError("Error", error?.message || "Failed to fetch usage");
      setUsages([]);
    } finally {
      setLoading(false);
    }
  }, [usagePagination.currentPage, showError]);

  useEffect(() => {
    fetchBalance();
  }, []);

  useEffect(() => {
    if (activeTab === "history") fetchHistories();
  }, [activeTab, historyPagination.currentPage]);

  useEffect(() => {
    if (activeTab === "usage") fetchUsages();
  }, [activeTab, usagePagination.currentPage]);

  const handleTopup = async () => {
    const amount = parseInt(topupAmount);
    if (!topupAmount.trim() || isNaN(amount) || amount < 10000) {
      showError("Error", "Minimal top up Rp10.000");
      return;
    }

    try {
      setTopupLoading(true);
      const result = await depositService.topup(amount);
      router.push(`/deposit/${encodeURIComponent(result.paymentId)}`);
    } catch (error: any) {
      showError("Error", error?.message || "Top up gagal");
    } finally {
      setTopupLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "TOPUP":
        return <Badge variant="success">TOPUP</Badge>;
      case "USAGE":
        return <Badge variant="default">USAGE</Badge>;
      case "RESCHEDULE":
        return <Badge variant="secondary">RESCHEDULE</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "expired":
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border border-blue-100">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6 mt-2 sm:mt-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Blax Pay</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchBalance}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>

        {balance && (
          <Card className="bg-gradient-to-r from-blue-500 to-teal-500 mb-6">
            <CardContent className="p-4">
              <p className="text-sm text-white/80 mt-4">Saldo</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(balance.balance)}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab("topup")}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md transition-colors text-xs sm:text-sm ${
              activeTab === "topup"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">Top Up</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md transition-colors text-xs sm:text-sm ${
              activeTab === "history"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span className="truncate hidden sm:inline">Riwayat Top Up</span>
            <span className="truncate sm:hidden">Riwayat</span>
          </button>
          <button
            onClick={() => setActiveTab("usage")}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md transition-colors text-xs sm:text-sm ${
              activeTab === "usage"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ArrowDownUp className="w-4 h-4 shrink-0" />
            <span className="truncate hidden sm:inline">Penggunaan</span>
            <span className="truncate sm:hidden">Pakai</span>
          </button>
        </div>

        {activeTab === "topup" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Top Up
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    topupAmount
                      ? Number(topupAmount).toLocaleString("id-ID")
                      : ""
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\./g, "");
                    if (/^\d*$/.test(raw)) {
                      setTopupAmount(raw);
                      const num = parseInt(raw);
                      if (raw && num < 10000)
                        setTopupError("Minimal top up Rp10.000");
                      else setTopupError("");
                    }
                  }}
                  placeholder="10.000"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-blue-500 text-lg font-medium ${
                    topupError
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
              </div>
              {topupError && (
                <p className="text-xs text-red-500 mt-1">{topupError}</p>
              )}
              {!topupError && (
                <p className="text-xs text-gray-500 mt-1">Minimal Rp10.000</p>
              )}
            </div>

            <div className="grid grid-cols-3 sm:flex gap-2">
              {[10000, 20000, 50000, 100000, 200000, 500000].map((nominal) => (
                <button
                  key={nominal}
                  type="button"
                  onClick={() => {
                    setTopupAmount(nominal.toString());
                    setTopupError("");
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    parseInt(topupAmount) === nominal
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {formatCurrency(nominal)}
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              className="w-full py-3 text-base"
              onClick={handleTopup}
              disabled={topupLoading || !topupAmount.trim() || !!topupError}
            >
              {topupLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Top Up Now"
              )}
            </Button>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-spin" />
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : histories.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No history found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Saldo Sebelum</TableHead>
                        <TableHead>Saldo Sesudah</TableHead>
                        <TableHead>Tanggal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {histories.map((h) => (
                          <TableRow key={h.id}>
                          <TableCell>{getTypeBadge(h.type)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(h.status)}
                              <span className="text-xs capitalize">{h.status.toLowerCase()}</span>
                            </div>
                          </TableCell>
                          <TableCell
                            className={`font-medium ${h.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatCurrency(h.amount)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(h.balanceBefore)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(h.balanceAfter)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(h.createdAt).toLocaleDateString("id-ID", {
                              timeZone: "Asia/Jakarta",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
              </>
            )}
          </div>
        )}

        {activeTab === "usage" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-spin" />
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : usages.length === 0 ? (
              <div className="text-center py-8">
                <ArrowDownUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No usage found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Saldo Sebelum</TableHead>
                        <TableHead>Saldo Sesudah</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usages.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium text-red-600">
                            {formatCurrency(u.amount)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(u.balanceBefore)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(u.balanceAfter)}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {u.scheduleName} ({u.scheduleTime})
                          </TableCell>
                          <TableCell>{u.venueName}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(u.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {usagePagination.totalPages > 1 && (
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
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
