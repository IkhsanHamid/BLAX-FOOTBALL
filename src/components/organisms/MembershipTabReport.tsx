"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  RefreshCw,
  FileSpreadsheet,
  CreditCard,
  CheckCircle,
  Clock,
  Search,
  X,
} from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../atoms/Card";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import autoTable from "jspdf-autotable";
import { adminService } from "@/utils/admin";
import { useNotifications } from "./NotificationContainer";

// ========================================
// TYPE DEFINITIONS
// ========================================

interface MembershipPayment {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  amount: number;
  payAt: string;
  validUntil: string;
  isActive: boolean;
}

interface MembershipReportTabProps {
  startDate: string;
  endDate: string;
  onRefreshRequest?: () => void;
}

// ========================================
// MEMBERSHIP REPORT TAB COMPONENT
// ========================================

export default function MembershipReportTab({
  startDate,
  endDate,
  onRefreshRequest,
}: MembershipReportTabProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [membershipPayments, setMembershipPayments] = useState<
    MembershipPayment[]
  >([]);

  // Search state
  const [searchName, setSearchName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalData, setTotalData] = useState<number>(0);
  const [totalActive, setTotalActive] = useState<number>(0);

  const { showSuccess, showError } = useNotifications();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialMount = useRef(true);

  // Fetch membership data
  const fetchMembershipData = async (): Promise<void> => {
    if (!startDate || !endDate) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const membershipData = await adminService.membershipReport(
        startDate,
        endDate,
        searchQuery,
        Number(skip),
        itemsPerPage,
      );

      setMembershipPayments(membershipData.data || []);

      setTotalActive(membershipData.totalActive);

      if (membershipData.totalPages) {
        setTotalPages(membershipData.totalPages);
      }
      if (membershipData.totalData !== undefined) {
        setTotalData(membershipData.totalData);
      }

      if (!isInitialMount.current) {
        showSuccess("Data berhasil di-refresh");
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === "AbortError") return;

      if (error.message.includes("fetch")) {
        showError(
          "Network Error",
          "Tidak dapat terhubung ke server. Pastikan server berjalan di localhost:3100",
        );
      } else if (error.message.includes("404")) {
        showError(
          "API Not Found",
          "Endpoint API tidak ditemukan. Periksa URL API",
        );
      } else if (error.message.includes("500")) {
        showError("Server Error", "Server mengalami error internal");
      } else {
        showError(
          "Error",
          `Gagal memuat data pembayaran membership: ${error.message}`,
        );
      }
    } finally {
      setLoading(false);
      isInitialMount.current = false;
    }
  };

  // Initial load
  useEffect(() => {
    fetchMembershipData();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Refetch when pagination or date range changes
  useEffect(() => {
    if (!isInitialMount.current) {
      fetchMembershipData();
    }
  }, [currentPage, itemsPerPage, startDate, endDate, searchQuery]);

  // Generate PDF Report
  const generatePDF = (): void => {
    if (!membershipPayments.length) {
      showError("Error", "Tidak ada data untuk di-export");
      return;
    }

    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Blax Football - History Pembayaran Membership", 20, 30);

      // Date range
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Periode: ${startDate} - ${endDate}`, 20, 45);

      // Summary
      const totalAmount = membershipPayments.reduce(
        (sum, p) => p.amount * totalData,
        0,
      );

      doc.setFontSize(14);
      doc.text("Ringkasan", 20, 65);

      const summaryData: (string | number)[][] = [
        ["Total Transaksi", totalData],
        ["Total Pendapatan", `Rp ${totalAmount.toLocaleString("id-ID")}`],
        ["Member Aktif", totalActive],
      ];

      autoTable(doc, {
        startY: 75,
        head: [["Metrik", "Nilai"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 20, right: 20 },
      });

      // Payment details
      const lastY: number = (doc as any).lastAutoTable?.finalY || 75;

      doc.setFontSize(14);
      doc.text("Detail Pembayaran", 20, lastY + 20);

      const paymentData: (string | number)[][] = membershipPayments.map(
        (payment) => [
          payment.name,
          payment.phone,
          `Rp ${payment.amount.toLocaleString("id-ID")}`,
          new Date(payment.payAt).toLocaleDateString("id-ID"),
          new Date(payment.validUntil).toLocaleDateString("id-ID"),
          payment.isActive ? "Active" : "Expired",
        ],
      );

      autoTable(doc, {
        startY: lastY + 30,
        head: [
          [
            "Nama",
            "No. HP",
            "Nominal",
            "Tanggal Bayar",
            "Valid Sampai",
            "Status Membership",
          ],
        ],
        body: paymentData,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 20, right: 20 },
      });

      // Footer
      const pageCount: number = (doc as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generated on ${new Date().toLocaleDateString(
            "id-ID",
          )} - Page ${i} of ${pageCount}`,
          20,
          (doc as any).internal.pageSize.height - 10,
        );
      }

      doc.save(`membership-payments-${startDate}-to-${endDate}.pdf`);
      showSuccess("PDF Report Generated", "Report berhasil diunduh");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showError("Export Error", "Gagal membuat PDF report");
    }
  };

  // Generate Excel Report
  const generateExcel = (): void => {
    if (!membershipPayments.length) {
      showError("Error", "Tidak ada data untuk di-export");
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const totalAmount = membershipPayments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );
      const activeCount = membershipPayments.filter((p) => p.isActive).length;

      const summaryData: (string | number)[][] = [
        ["Metrik", "Nilai"],
        ["Total Transaksi", totalData],
        ["Total Pendapatan", totalAmount],
        ["Member Aktif", totalActive],
      ];

      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWS, "Ringkasan");

      // Payment sheet
      const paymentHeaders: string[] = [
        "ID",
        "Nama",
        "No. HP",
        "Nominal Bayar",
        "Tanggal Bayar",
        "Valid Sampai",
        "Status Membership",
      ];

      const paymentData: (string | number)[][] = [
        paymentHeaders,
        ...membershipPayments.map((payment) => [
          payment.id,
          payment.name,
          payment.phone,
          payment.amount,
          payment.payAt,
          payment.validUntil,
          payment.isActive ? "Active" : "Expired",
        ]),
      ];

      const paymentWS = XLSX.utils.aoa_to_sheet(paymentData);
      XLSX.utils.book_append_sheet(wb, paymentWS, "History Pembayaran");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(data, `membership-payments-${startDate}-to-${endDate}.xlsx`);
      showSuccess("Excel Report Generated", "Report berhasil diunduh");
    } catch (error) {
      console.error("Error generating Excel:", error);
      showError("Export Error", "Gagal membuat Excel report");
    }
  };

  // Calculate statistics
  const getStats = () => {
    const totalTransactions = totalData;
    const totalRevenue = membershipPayments.reduce(
      (sum, p) => p.amount * totalData,
      0,
    );
    const activeMembers = totalActive;
    const averagePayment =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalTransactions,
      totalRevenue,
      activeMembers,
      averagePayment,
    };
  };

  const stats = getStats();

  const handlePageChange = (newPage: number): void => {
    setCurrentPage(newPage);
  };

  const handleLimitChange = (newLimit: number): void => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when limit changes
  };

  const handleSearch = (): void => {
    setSearchQuery(searchName);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearSearch = (): void => {
    setSearchName("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            History Pembayaran Membership
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Kelola dan analisis data pembayaran membership
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="danger"
            size="sm"
            onClick={generatePDF}
            disabled={!membershipPayments.length}
            className="flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>

          <Button
            variant="black"
            size="sm"
            onClick={generateExcel}
            disabled={!membershipPayments.length}
            className="flex items-center bg-green-600 hover:bg-green-700"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari berdasarkan Nama
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Ketik nama user..."
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {searchName && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleSearch}
                disabled={loading}
                className="flex items-center"
              >
                <Search className="w-4 h-4 mr-2" />
                Cari
              </Button>
            </div>
            {searchQuery && (
              <div className="mt-2 flex items-center text-sm text-gray-600">
                <span>
                  Hasil pencarian untuk: <strong>"{searchQuery}"</strong>
                </span>
                <button
                  onClick={handleClearSearch}
                  className="ml-2 text-green-600 hover:text-green-800 font-medium"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Transaksi
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalTransactions}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <CreditCard className="w-3 h-3 mr-1" />
                  Pembayaran membership
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Pendapatan
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  Rp {(stats.totalRevenue / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-emerald-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Dari membership
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Member Aktif
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.activeMembers}
                </p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Status aktif
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Table */}
      <Card>
        <CardHeader>
          <CardTitle>History Pembayaran Membership</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-green-500" />
              <span className="ml-2 text-gray-600">Memuat data...</span>
            </div>
          ) : !membershipPayments.length ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Belum ada data pembayaran membership
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No. HP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nominal Bayar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Bayar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valid Sampai
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Membership
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {membershipPayments.map((payment: MembershipPayment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {payment.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {payment.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          Rp {payment.amount.toLocaleString("id-ID")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {new Date(payment.payAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(payment.payAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          {new Date(payment.validUntil).toLocaleDateString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payment.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {payment.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Expired
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {membershipPayments.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Tampilkan</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">data per halaman</span>
              </div>

              {/* Pagination info and controls */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(currentPage * itemsPerPage, totalData)} dari{" "}
                  {totalData} data
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1"
                  >
                    Prev
                  </Button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? "bg-green-600 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="px-3 py-1"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
