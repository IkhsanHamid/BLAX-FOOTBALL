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
} from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../atoms/Card";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import autoTable from "jspdf-autotable";
import { adminService } from "@/utils/admin";
import { useNotifications } from "../organisms/NotificationContainer";

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

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalData, setTotalData] = useState<number>(0);

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
        "",
        Number(skip),
        itemsPerPage,
      );

      setMembershipPayments(membershipData.data || []);

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
  }, [currentPage, itemsPerPage, startDate, endDate]);

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
        (sum, p) => sum + p.amount,
        0,
      );
      const activeCount = membershipPayments.filter((p) => p.isActive).length;

      doc.setFontSize(14);
      doc.text("Ringkasan", 20, 65);

      const summaryData: (string | number)[][] = [
        ["Total Transaksi", membershipPayments.length.toString()],
        ["Total Pendapatan", `Rp ${totalAmount.toLocaleString("id-ID")}`],
        ["Member Aktif", activeCount.toString()],
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
          payment.status,
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
            "Status",
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
        ["Total Transaksi", membershipPayments.length],
        ["Total Pendapatan", totalAmount],
        ["Member Aktif", activeCount],
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
        "Status Pembayaran",
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
          payment.status,
          payment.isActive ? "Aktif" : "Tidak Aktif",
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
    const totalTransactions = membershipPayments.length;
    const totalRevenue = membershipPayments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );
    const activeMembers = membershipPayments.filter((p) => p.isActive).length;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-3 h-3" />;
      case "FAILED":
        return <Clock className="w-3 h-3" />;
      case "PENDING":
        return <Clock className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const handlePageChange = (newPage: number): void => {
    setCurrentPage(newPage);
  };

  const handleLimitChange = (newLimit: number): void => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when limit changes
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Rata-rata Bayar
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  Rp {Math.round(stats.averagePayment / 1000)}K
                </p>
                <p className="text-xs text-purple-600 flex items-center mt-1">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Per transaksi
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
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
                      Status
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
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            payment.status,
                          )}`}
                        >
                          {getStatusIcon(payment.status)}
                          {payment.status}
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

      {/* Export Summary */}
      <Card className="border-2 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="pt-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-green-900">
                Opsi Export History Membership
              </h3>
              <p className="text-sm text-green-700">
                Generate laporan komprehensif dalam format yang Anda inginkan
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={generatePDF}
                disabled={!membershipPayments.length}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF Report
              </Button>
              <Button
                variant="outline"
                onClick={generateExcel}
                disabled={!membershipPayments.length}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
