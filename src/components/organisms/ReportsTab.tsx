"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  RefreshCw,
  FileSpreadsheet,
  Eye,
} from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../atoms/Card";
import { useNotifications } from "./NotificationContainer";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import autoTable from "jspdf-autotable";
import { ReportBooking } from "@/types/admin";
import { adminService } from "@/utils/admin";
import BookingDetailModal from "../molecules/BookingDetailModal";

// ========================================
// TYPE DEFINITIONS
// ========================================

interface BookingDetail {
  bookId: string;
  userName: string;
  userPhone: string;
  isMember: boolean;
  quantity: number;
  bookingType: "INDIVIDUAL" | "TEAM";
  totalAmount?: number;
  adminFee?: string;
  discountAmount?: string;
}

interface Schedule {
  scheduleId: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  typeMatch: string;
  status: boolean;
  players: number;
  revenue: number;
}

interface Stats {
  totalBooking: number;
  totalRevenue: number;
  totalPlayers: number;
  activeBookings: number;
  completedBookings: number;
  averageRevenue: number;
}

// ========================================
// MAIN REPORTS TAB COMPONENT
// ========================================

export default function ReportsTab(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<string>("7d");
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetail[]>([]);

  // Initialize with last 7 days
  const getDefaultDates = (): { startDate: string; endDate: string } => {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      startDate: sevenDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  };

  const [startDate, setStartDate] = useState<string>(
    getDefaultDates().startDate,
  );
  const [endDate, setEndDate] = useState<string>(getDefaultDates().endDate);
  const [reportData, setReportData] = useState<ReportBooking | null>(null);
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    handleRefreshData();
  }, []);

  const handleRefreshData = async (): Promise<void> => {
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const reportResponse = await adminService.reportBooking(
        startDate,
        endDate,
      );

      setReportData(reportResponse);
      showSuccess("Data berhasil di-refresh");
    } catch (error: any) {
      // Check if it's a network error
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
        showError("Error", `Gagal memuat data laporan: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = (): void => {
    if (!reportData) {
      showError("Error", "Tidak ada data untuk di-export");
      return;
    }

    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Blax Football - Laporan Booking", 20, 30);

      // Date range
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Periode: ${startDate} - ${endDate}`, 20, 45);

      // Summary section
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Ringkasan", 20, 65);

      const summaryData: (string | number)[][] = [
        ["Total Booking", reportData.totalBooking.toString()],
        [
          "Total Pendapatan",
          `Rp ${reportData.totalRevenue.toLocaleString("id-ID")}`,
        ],
        ["Total Pemain", reportData.totalPlayers.toString()],
        [
          "Jadwal Aktif",
          reportData.schedules.filter((s) => s.status).length.toString(),
        ],
        [
          "Jadwal Selesai",
          reportData.schedules.filter((s) => !s.status).length.toString(),
        ],
      ];

      autoTable(doc, {
        startY: 75,
        head: [["Metrik", "Nilai"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 20 },
      });

      // Schedule details
      const lastY: number = (doc as any).lastAutoTable?.finalY || 75;

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Detail Jadwal", 20, lastY + 20);

      const scheduleData: (string | number)[][] = reportData.schedules.map(
        (schedule) => [
          new Date(schedule.date).toLocaleDateString("id-ID"),
          schedule.name,
          schedule.venue,
          schedule.typeMatch,
          schedule.players.toString(),
          `Rp ${schedule.revenue.toLocaleString("id-ID")}`,
          schedule.status ? "Aktif" : "Selesai",
        ],
      );

      autoTable(doc, {
        startY: lastY + 30,
        head: [
          [
            "Tanggal",
            "Nama",
            "Venue",
            "Tipe",
            "Pemain",
            "Pendapatan",
            "Status",
          ],
        ],
        body: scheduleData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
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

      doc.save(`blax-football-report-${startDate}-to-${endDate}.pdf`);
      showSuccess("PDF Report Generated", "Report berhasil diunduh");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showError("Export Error", "Gagal membuat PDF report");
    }
  };

  const generateExcelReport = (): void => {
    if (!reportData) {
      showError("Error", "Tidak ada data untuk di-export");
      return;
    }

    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData: (string | number)[][] = [
        ["Metrik", "Nilai"],
        ["Total Booking", reportData.totalBooking],
        ["Total Pendapatan", reportData.totalRevenue],
        ["Total Pemain", reportData.totalPlayers],
        ["Jadwal Aktif", reportData.schedules.filter((s) => s.status).length],
        [
          "Jadwal Selesai",
          reportData.schedules.filter((s) => !s.status).length,
        ],
      ];

      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWS, "Ringkasan");

      // Schedule sheet
      const scheduleHeaders: string[] = [
        "ID Jadwal",
        "Nama",
        "Tanggal",
        "Waktu",
        "Venue",
        "Tipe Match",
        "Status",
        "Jumlah Pemain",
        "Pendapatan",
      ];

      const scheduleData: (string | number | boolean)[][] = [
        scheduleHeaders,
        ...reportData.schedules.map((schedule) => [
          schedule.scheduleId,
          schedule.name,
          schedule.date,
          schedule.time,
          schedule.venue,
          schedule.typeMatch,
          schedule.status ? "Aktif" : "Selesai",
          schedule.players,
          schedule.revenue,
        ]),
      ];

      const scheduleWS = XLSX.utils.aoa_to_sheet(scheduleData);
      XLSX.utils.book_append_sheet(wb, scheduleWS, "Detail Jadwal");

      // Generate and save file
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(data, `blax-football-report-${startDate}-to-${endDate}.xlsx`);
      showSuccess("Excel Report Generated", "Report berhasil diunduh");
    } catch (error) {
      console.error("Error generating Excel:", error);
      showError("Export Error", "Gagal membuat Excel report");
    }
  };

  const handleDateRangeChange = (range: string): void => {
    setDateRange(range);

    if (range !== "custom") {
      const today = new Date();
      let startDate: Date;

      switch (range) {
        case "7d":
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      setStartDate(startDate.toISOString().split("T")[0]);
      setEndDate(today.toISOString().split("T")[0]);
    }
  };

  const handleScheduleClick = async (schedule: Schedule): Promise<void> => {
    setSelectedSchedule(schedule);
    setShowDetailModal(true);

    try {
      const bookings = await adminService.getScheduleBookings(
        schedule.scheduleId,
      );
      setBookingDetails(bookings);
    } catch (error) {
      showError("Error", "Gagal memuat detail booking");
      setBookingDetails([]);
    }
  };

  const handleCloseModal = (): void => {
    setShowDetailModal(false);
    setSelectedSchedule(null);
    setBookingDetails([]);
  };

  // Calculate derived statistics
  const getStats = (): Stats => {
    if (!reportData) {
      return {
        totalBooking: 0,
        totalRevenue: 0,
        totalPlayers: 0,
        activeBookings: 0,
        completedBookings: 0,
        averageRevenue: 0,
      };
    }

    const activeBookings = reportData.schedules.filter((s) => s.status).length;
    const completedBookings = reportData.schedules.filter(
      (s) => !s.status,
    ).length;
    const averageRevenue =
      reportData.totalBooking > 0
        ? reportData.totalRevenue / reportData.totalBooking
        : 0;

    return {
      totalBooking: reportData.totalBooking,
      totalRevenue: reportData.totalRevenue,
      totalPlayers: reportData.totalPlayers,
      activeBookings,
      completedBookings,
      averageRevenue,
    };
  };

  const stats: Stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laporan</h2>
          <p className="text-gray-600 mt-1">
            Analisis performa dan statistik platform booking
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={generatePDFReport}
            disabled={!reportData}
            className="flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>

          <Button
            variant="black"
            size="sm"
            onClick={generateExcelReport}
            disabled={!reportData}
            className="flex items-center bg-green-600 hover:bg-green-700"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rentang Tanggal
              </label>
              <select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">7 hari terakhir</option>
                <option value="30d">30 hari terakhir</option>
                <option value="90d">90 hari terakhir</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="primary"
                size="md"
                onClick={handleRefreshData}
                disabled={loading || !startDate || !endDate}
                className="w-full flex items-center justify-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                {loading ? "Memfilter..." : "Terapkan Filter"}
              </Button>
            </div>
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
                  Total Booking
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalBooking}
                </p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Activity className="w-3 h-3 mr-1" />
                  {stats.activeBookings} aktif, {stats.completedBookings}{" "}
                  selesai
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
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
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Rata-rata: Rp {Math.round(stats.averageRevenue / 1000)}K per
                  booking
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Pemain
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalPlayers}
                </p>
                <p className="text-xs text-purple-600 flex items-center mt-1">
                  <Users className="w-3 h-3 mr-1" />
                  {stats.totalBooking > 0
                    ? Math.round(stats.totalPlayers / stats.totalBooking)
                    : 0}{" "}
                  rata-rata per sesi
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Laporan Jadwal</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Memuat data...</span>
            </div>
          ) : !reportData ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Belum ada data laporan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Venue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pemain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pendapatan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.schedules.map((schedule: Schedule) => (
                    <tr key={schedule.scheduleId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {new Date(schedule.date).toLocaleDateString("id-ID")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {schedule.time}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleScheduleClick(schedule)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center transition-colors"
                        >
                          {schedule.name}
                          <Eye className="w-4 h-4 ml-2" />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {schedule.venue}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {schedule.typeMatch}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-2" />
                          {schedule.players}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          Rp {schedule.revenue.toLocaleString("id-ID")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            schedule.status
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {schedule.status ? "Aktif" : "Selesai"}
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

      {/* Export Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="pt-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Opsi Export
              </h3>
              <p className="text-blue-700 text-sm">
                Generate laporan komprehensif dalam format yang Anda inginkan
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={generatePDFReport}
                disabled={!reportData}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF Report
              </Button>
              <Button
                variant="outline"
                onClick={generateExcelReport}
                disabled={!reportData}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Detail Modal */}
      {showDetailModal && selectedSchedule && (
        <BookingDetailModal
          schedule={selectedSchedule}
          bookings={bookingDetails}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
