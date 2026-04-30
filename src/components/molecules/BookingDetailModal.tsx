"use client";

import React, { useState } from "react";
import {
  X,
  Crown,
  Phone,
  User,
  Hash,
  Receipt,
  Users,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";
import Button from "../atoms/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../atoms/Dialog";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNotifications } from "../organisms/NotificationContainer";

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
  baseFee?: number | string;
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

interface BookingDetailModalProps {
  schedule: Schedule | null;
  bookings: BookingDetail[];
  onClose: () => void;
}

// ========================================
// BOOKING DETAIL MODAL COMPONENT
// ========================================

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  schedule,
  bookings,
  onClose,
}) => {
  const { showSuccess, showError } = useNotifications();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  if (!schedule) return null;

  // Calculate totals
  const totalSlots: number = bookings.reduce((sum, b) => sum + b.quantity, 0);
  const totalBaseFee: number = bookings.reduce(
    (sum, b) => sum + (b.baseFee ? parseInt(String(b.baseFee)) : 0),
    0,
  );
  const totalAdminFee: number = bookings.reduce(
    (sum, b) => sum + (!b.isMember && b.adminFee ? parseInt(b.adminFee) : 0),
    0,
  );
  const totalDiscount: number = bookings.reduce(
    (sum, b) =>
      sum +
      (b.discountAmount && parseInt(b.discountAmount) > 0
        ? parseInt(b.discountAmount)
        : 0),
    0,
  );
  const memberCount: number = bookings.filter((b) => b.isMember).length;
  const teamCount: number = bookings.filter(
    (b) => b.bookingType === "TEAM",
  ).length;

  // Pagination
  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = bookings.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Get slot display based on booking type and match type
  const getSlotDisplay = (booking: BookingDetail): string => {
    if (booking.bookingType === "TEAM") {
      const slots = schedule.typeMatch.toLowerCase() === "mini-soccer" ? 7 : 11;
      return `${slots} pemain`;
    }
    return `${booking.quantity} slot`;
  };

  // Export to Excel
  const handleExportExcel = (): void => {
    try {
      const wb = XLSX.utils.book_new();

      const scheduleInfo: (string | number)[][] = [
        ["Informasi Jadwal"],
        ["Nama", schedule.name],
        ["Tanggal", new Date(schedule.date).toLocaleDateString("id-ID")],
        ["Waktu", schedule.time],
        ["Venue", schedule.venue],
        ["Tipe Match", schedule.typeMatch],
        ["Total Pemain", schedule.players],
        ["Total Pendapatan", schedule.revenue],
        ["Status", schedule.status ? "Aktif" : "Selesai"],
        [],
      ];

      const bookingHeaders: string[] = [
        "No",
        "ID Booking",
        "Nama",
        "No. HP",
        "Status Member",
        "Tipe",
        "Jumlah Slot",
        "Biaya Admin",
        "Diskon",
        "Harga Dasar",
      ];

      const bookingData: (string | number)[][] = bookings.map(
        (booking, index) => [
          index + 1,
          booking.bookId,
          booking.userName,
          booking.userPhone,
          booking.isMember ? "Member" : "Non-Member",
          booking.bookingType === "TEAM" ? "Tim" : "Individu",
          getSlotDisplay(booking),
          booking.isMember
            ? "-"
            : booking.adminFee
              ? parseInt(booking.adminFee)
              : "-",
          booking.discountAmount && parseInt(booking.discountAmount) > 0
            ? parseInt(booking.discountAmount)
            : "-",
          booking.baseFee !== undefined
            ? parseInt(String(booking.baseFee))
            : "Menunggu",
        ],
      );

      const summary: (string | number)[][] = [
        [],
        ["Ringkasan"],
        ["Total Booking", bookings.length],
        ["Total Slot", totalSlots],
        ["Total Biaya Admin", totalAdminFee],
        ["Total Diskon", totalDiscount],
        ["Total Bayar (Harga Dasar)", totalBaseFee],
        ["Member Premium", memberCount],
        ["Booking Team", teamCount],
      ];

      const allData = [
        ...scheduleInfo,
        ["Detail Booking"],
        bookingHeaders,
        ...bookingData,
        ...summary,
      ];

      const ws = XLSX.utils.aoa_to_sheet(allData);

      ws["!cols"] = [
        { wch: 5 },
        { wch: 20 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 18 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Detail Booking");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileName = `booking-detail-${schedule.name
        .replace(/\s+/g, "-")
        .toLowerCase()}-${
        new Date(schedule.date).toISOString().split("T")[0]
      }.xlsx`;

      saveAs(data, fileName);
      showSuccess(
        "Excel Berhasil Diexport",
        "Detail booking berhasil diexport",
      );
    } catch (error) {
      console.error("Error exporting Excel:", error);
      showError("Gagal Export", "Gagal export detail booking ke Excel");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full p-0 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 md:p-6 border-b border-gray-200 mb-0 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <DialogTitle className="text-lg md:text-2xl truncate">
              Detail Booking
            </DialogTitle>
            <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">
              {schedule.name} -{" "}
              {new Date(schedule.date).toLocaleDateString("id-ID")}{" "}
              {schedule.time}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="flex items-center border-green-300 text-green-700 hover:bg-green-50"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <button
              onClick={() => onClose()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
            </button>
          </div>
        </DialogHeader>

        {/* Modal Content - Scrollable */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {/* Schedule Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">Venue</p>
              <p className="text-sm md:text-lg font-semibold text-blue-900 truncate">
                {schedule.venue}
              </p>
            </div>
            <div className="bg-purple-50 p-3 md:p-4 rounded-lg">
              <p className="text-xs text-purple-600 font-medium">Tipe Match</p>
              <p className="text-sm md:text-lg font-semibold text-purple-900 truncate">
                {schedule.typeMatch}
              </p>
            </div>
            <div className="bg-green-50 p-3 md:p-4 rounded-lg">
              <p className="text-xs text-green-600 font-medium">Total Pemain</p>
              <p className="text-sm md:text-lg font-semibold text-green-900">
                {schedule.players}
              </p>
            </div>
            <div className="bg-orange-50 p-3 md:p-4 rounded-lg">
              <p className="text-xs text-orange-600 font-medium">
                Total Pendapatan
              </p>
              <p className="text-sm md:text-lg font-semibold text-orange-900 truncate">
                Rp {schedule.revenue.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      No
                    </th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      ID Booking
                    </th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Nama & No HP
                    </th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Tipe
                    </th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Slot
                    </th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Biaya Admin
                    </th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Diskon
                    </th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Harga Dasar
                    </th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Total Bayar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {currentBookings.map((booking: BookingDetail, index) => (
                    <tr key={booking.bookId} className="hover:bg-gray-50">
                      <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Hash className="w-3 h-3 md:w-4 md:h-4 text-gray-400 mr-1 md:mr-2 shrink-0" />
                          <span className="text-xs md:text-sm font-medium text-gray-900 truncate">
                            {booking.bookId}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4">
                        <div className="flex items-start">
                          <User className="w-3 h-3 md:w-4 md:h-4 text-gray-400 mr-1 md:mr-2 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 md:gap-2">
                              <span className="text-xs md:text-sm font-medium text-gray-900 truncate">
                                {booking.userName}
                              </span>
                              {booking.isMember && (
                                <Crown className="w-3 h-3 md:w-4 md:h-4 text-purple-500 shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center mt-1">
                              <Phone className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400 mr-1 shrink-0" />
                              <a
                                href={`https://wa.me/${booking.userPhone.replace(
                                  /^0/,
                                  "62",
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-700"
                              >
                                {booking.userPhone}
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            booking.bookingType === "TEAM"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {booking.bookingType === "TEAM" ? "Tim" : "Individu"}
                        </span>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-3 h-3 md:w-4 md:h-4 text-gray-400 mr-1 md:mr-2 shrink-0" />
                          <span className="text-xs md:text-sm text-gray-900">
                            {getSlotDisplay(booking)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                        <div className="text-xs md:text-sm text-gray-900">
                          {booking.isMember
                            ? "-"
                            : booking.adminFee
                              ? `Rp ${parseInt(booking.adminFee).toLocaleString(
                                  "id-ID",
                                )}`
                              : "-"}
                        </div>
                      </td>
                      {/* Kolom Diskon - terpisah */}
                      <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                        <div className="text-xs md:text-sm text-purple-600">
                          {booking.discountAmount &&
                          parseInt(booking.discountAmount) > 0
                            ? `Rp ${parseInt(
                                booking.discountAmount,
                              ).toLocaleString("id-ID")}`
                            : "-"}
                        </div>
                      </td>
                      {/* Base Fee */}
                      <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                        <div className="text-xs md:text-sm font-semibold text-blue-600">
                          {booking.baseFee !== undefined
                            ? `Rp ${parseInt(String(booking.baseFee)).toLocaleString("id-ID")}`
                            : "Menunggu"}
                        </div>
                      </td>
                      {/* Total Amount */}
                      <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                        <div className="text-xs md:text-sm font-semibold text-green-600">
                          {booking.totalAmount !== undefined
                            ? `Rp ${booking.totalAmount.toLocaleString("id-ID")}`
                            : "Menunggu"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 md:px-4 py-3 text-right font-semibold text-gray-700 text-xs md:text-sm"
                    >
                      Total:
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <div className="flex items-center">
                        <Users className="w-3 h-3 md:w-4 md:h-4 text-gray-400 mr-1 md:mr-2 shrink-0" />
                        <span className="text-xs md:text-sm font-semibold text-gray-900">
                          {totalSlots} slot
                        </span>
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <div className="text-xs md:text-sm font-semibold text-gray-900">
                        Rp {totalAdminFee.toLocaleString("id-ID")}
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <div className="text-xs md:text-sm font-semibold text-purple-600">
                        Rp {totalDiscount.toLocaleString("id-ID")}
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <div className="text-xs md:text-sm font-bold text-blue-600">
                        Rp {totalBaseFee.toLocaleString("id-ID")}
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <div className="text-xs md:text-sm font-bold text-green-600">
                        Rp{" "}
                        {bookings
                          .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
                          .toLocaleString("id-ID")}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <div className="text-xs md:text-sm text-gray-700">
                Menampilkan {startIndex + 1} -{" "}
                {Math.min(endIndex, bookings.length)} dari {bookings.length}{" "}
                booking
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Prev</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => {
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <button
                            onClick={() => goToPage(page)}
                            className={`px-2 md:px-3 py-1 text-xs md:text-sm rounded-md transition-colors ${
                              currentPage === page
                                ? "bg-blue-600 text-white font-semibold"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center"
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 md:p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">
                    Total Booking
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-blue-900">
                    {bookings.length}
                  </p>
                </div>
                <Hash className="w-6 h-6 md:w-8 md:h-8 text-blue-500 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 md:p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-600 font-medium">
                    Total Biaya Admin
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-orange-900 truncate">
                    Rp {totalAdminFee.toLocaleString("id-ID")}
                  </p>
                </div>
                <Receipt className="w-6 h-6 md:w-8 md:h-8 text-orange-500 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 md:p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 font-medium">
                    Member Premium
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-purple-900">
                    {memberCount}
                  </p>
                </div>
                <Crown className="w-6 h-6 md:w-8 md:h-8 text-purple-500 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 md:p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 font-medium">
                    Booking Team
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-green-900">
                    {teamCount}
                  </p>
                </div>
                <Users className="w-6 h-6 md:w-8 md:h-8 text-green-500 opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-4 md:p-6 border-t border-gray-200 shrink-0">
          <Button variant="outline" onClick={() => onClose()} size="sm">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailModal;
