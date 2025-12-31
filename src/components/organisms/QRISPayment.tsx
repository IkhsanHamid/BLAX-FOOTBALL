"use client";

import { motion } from "motion/react";
import {
  ArrowLeft,
  QrCode,
  Clock,
  CheckCircle,
  MessageCircle,
  RefreshCw,
  Copy,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "./NotificationContainer";
import Navbar from "./Navbar";
import { paymentService } from "@/utils/payment";
import { PaymentDataBooking, PaymentDataMember } from "@/types/payment";
import PaymentSuccessModal from "../molecules/SuccessPaymentModal";
import { bookingService } from "@/utils/booking";
import { formatCurrency, formatDate } from "@/lib/helper";
import Button from "../atoms/Button";
import { useAuth } from "@/contexts/AuthContext";

interface QRISPaymentPageProps {
  amount?: number;
  paymentType: "booking" | "membership";
  paymentId: string;
  onPaymentSuccess?: () => void;
}

export function QRISPaymentPage({
  amount,
  paymentType,
  paymentId,
  onPaymentSuccess,
}: QRISPaymentPageProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(900);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<
    PaymentDataMember | PaymentDataBooking | null
  >(null);
  const [successPayment, setSuccessPayment] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "settled" | "expired"
  >("pending");

  // Ref to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize payment label calculation
  const PAYMENT_LABEL: Record<string, string> = {
    booking: "Booking",
    membership: "Membership",
  };
  const paymentLabel = PAYMENT_LABEL[paymentType] ?? "Pembayaran";

  // Fetch payment data with proper error handling and loading state
  const fetchPaymentData = useCallback(async () => {
    // Skip fetch if payment already settled
    if (paymentStatus === "settled") {
      return "settled";
    }

    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);

      let result;
      if (paymentType === "membership") {
        result = await paymentService.showQRMember(paymentId);
      } else if (paymentType === "booking") {
        result = await bookingService.previewPayment(paymentId);
      } else {
        throw new Error("Invalid payment type");
      }

      if (result?.status === "expire") {
        setPaymentStatus("expired");
        showError(
          "error",
          "Pembayaran telah kadaluarsa silahkan login kembali"
        );
        router.push("/");
        return "expired";
      }

      // Check if payment is already settled
      if (result?.status === "settlement" || result?.status === true) {
        setPaymentStatus("settled");
        setPaymentData(result);
        return "settled";
      }

      setPaymentData(result);
      return "pending";
    } catch (error: any) {
      console.error("Error fetching payment data:", error);
      showError(
        "Payment Error",
        error?.message || "Failed to fetch payment data"
      );
      setPaymentData(null);
      return "error";
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [paymentId, paymentType, showError, router, paymentStatus]);

  // Initial data fetch
  useEffect(() => {
    // Skip if payment already settled or expired
    if (paymentStatus === "settled" || paymentStatus === "expired") {
      return;
    }

    // Initial fetch
    let mounted = true;
    const initializePayment = async () => {
      if (paymentId && mounted) {
        const status = await fetchPaymentData();

        // Don't start timer if payment already settled/expired
        if (status === "settled" || status === "expired") {
          return;
        }
      }
    };

    initializePayment();

    // Cleanup for initial fetch
    return () => {
      mounted = false;
    };
  }, [paymentId]); // Only depend on paymentId for initial fetch

  // Timer effect with proper cleanup and expiry handling
  useEffect(() => {
    // Don't run timer if payment settled or no expiry time
    if (
      paymentStatus === "settled" ||
      paymentStatus === "expired" ||
      !paymentData?.expired_at
    ) {
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const expiredAt = new Date(paymentData.expired_at);
      const diffInSeconds = Math.floor(
        (expiredAt.getTime() - now.getTime()) / 1000
      );
      return Math.max(0, diffInSeconds);
    };

    // Set initial time
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    // Don't start timer if already expired
    if (initialTime <= 0) {
      setPaymentStatus("expired");
      const timeoutId = setTimeout(() => {
        showError("error", "Payment session expired");
        if (paymentType === "booking") {
          router.push("/schedule");
        } else {
          router.push("/");
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }

    timerRef.current = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        setPaymentStatus("expired");
        // Defer navigation to avoid state update during render
        setTimeout(() => {
          showError("error", "Payment session expired");
          if (paymentType === "booking") {
            router.push("/schedule");
          } else {
            router.push("/");
          }
        }, 0);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [paymentData?.expired_at, paymentStatus, showError, router, paymentType]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const copyBookId = async () => {
    // Type guard untuk memastikan ini adalah PaymentDataBooking
    if (!paymentData || !("bookId" in paymentData)) {
      showError("Error", "Booking ID tidak tersedia");
      return;
    }

    const bookingData = paymentData as PaymentDataBooking;

    if (!bookingData.bookId) {
      showError("Error", "Booking ID tidak tersedia");
      return;
    }

    try {
      await navigator.clipboard.writeText(bookingData.bookId);
      showSuccess("Berhasil!", "Booking ID berhasil disalin ke clipboard");
    } catch (error) {
      // Fallback untuk browser yang tidak mendukung clipboard API
      try {
        const textArea = document.createElement("textarea");
        textArea.value = bookingData.bookId;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showSuccess("Berhasil!", "Booking ID berhasil disalin ke clipboard");
      } catch (fallbackError) {
        showError("Error", "Gagal menyalin Booking ID");
        console.error("Copy failed:", fallbackError);
      }
    }
  };

  const handleRefreshPayment = async () => {
    if (isRefreshing || paymentStatus === "settled") return; // Prevent double-click and unnecessary refresh

    try {
      setIsRefreshing(true);

      let result;
      if (paymentType === "membership") {
        result = await paymentService.checkPaymentStatusMembership(paymentId);
      } else if (paymentType === "booking") {
        result = await bookingService.checkPaymentStatusBooking(paymentId);
      }

      if (result?.status === "settlement") {
        setPaymentStatus("settled");
        // Stop timer to prevent further fetching
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setSuccessPayment(true);
        showSuccess("success", "Berhasil melakukan pembayaran");
        // Navigation will be handled by modal close
      } else if (result?.status === "expire") {
        setPaymentStatus("expired");
        // Stop timer to prevent further fetching
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        showError("error", "Gagal melakukan pembayaran silahkan login kembali");
        setTimeout(() => router.push("/"), 1000);
      } else if (result?.status === true) {
        setPaymentStatus("settled");
        // Stop timer to prevent further fetching
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        showSuccess("success", "Pembayaran sudah dilakukan");
        setTimeout(() => router.push("/"), 1000);
      } else if (result?.status === "pending") {
        await fetchPaymentData();
        showSuccess("success", "Berhasil refresh pembayaran");
      } else {
        showSuccess("success", "Status pembayaran diperbarui");
      }
    } catch (error: any) {
      console.error("Error refreshing payment:", error);
      showError(
        "Payment Error",
        error?.message || "Failed to refresh payment data"
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleWhatsAppChat = () => {
    const phoneNumber = "6281234567890"; // Replace with actual WhatsApp business number
    const message = encodeURIComponent(
      `Hi Admin Blax Football! Saya butuh bantuan dalam melakukan pembayaran ${
        paymentType === "booking" ? "booking" : "membership"
      }. Jumlah transaksi: ${
        amount ? formatCurrency(amount) : formatCurrency(paymentData?.total!)
      }`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  const handleCloseSuccessModal = () => {
    setSuccessPayment(false);
    // Navigate based on payment type
    if (paymentType === "booking") {
      router.push("/schedule");
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <div className="min-h-screen py-24 px-4 bg-gradient-to-br from-blue-50 to-white">
        <Navbar
          currentPage={""}
          navigateTo={function (page: string): void {
            throw new Error("Function not implemented.");
          }}
        />
        <div className="max-w-4xl mx-auto mt-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-4">
              Selesaikan Pembayaran {paymentLabel} Anda
            </h1>

            <p className="text-gray-700 text-sm md:text-base">
              Hanya beberapa langkah lagi untuk menyelesaikan proses{" "}
              {paymentLabel.toLowerCase()} Anda.
            </p>

            <p className="text-gray-700 text-sm md:text-base mt-1">
              Data yang Anda masukkan akan kami jaga kerahasiaannya.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - QR Code */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white border border-blue-200 rounded-3xl p-8 shadow-xl"
            >
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="mb-2 text-blue-600">Scan untuk Pembayaran</h2>
                <p className="text-gray-600">
                  Gunakan e-wallet atau mobile banking anda
                </p>
              </div>

              {/* Timer */}
              <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="flex items-center justify-center gap-2 text-center">
                  <Clock
                    className={`w-5 h-5 ${
                      timeLeft < 300 ? "text-red-500" : "text-blue-600"
                    }`}
                  />
                  <div>
                    <div className="text-gray-600 text-sm">
                      Payment expires in
                    </div>
                    <div
                      className={`${
                        timeLeft < 300 ? "text-red-500" : "text-blue-600"
                      } font-semibold text-lg`}
                    >
                      {formatTime(timeLeft)}
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`mb-6 p-8 bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl cursor-pointer hover:shadow-xl transition-all border-2 ${
                  isProcessing
                    ? "border-green-400 bg-gradient-to-br from-green-100 to-green-50"
                    : "border-blue-200"
                }`}
              >
                <div className="aspect-square flex items-center justify-center">
                  {isProcessing ? (
                    <div className="text-center text-green-600">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <CheckCircle className="w-32 h-32 mx-auto mb-4" />
                      </motion.div>
                      <p className="text-gray-700">Processing payment...</p>
                    </div>
                  ) : loading ? (
                    <div className="text-center text-blue-600">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <RefreshCw className="w-12 h-12 mx-auto mb-4" />
                      </motion.div>
                      <p className="text-gray-700">Loading QR Code...</p>
                    </div>
                  ) : paymentData?.imageBase64 ? (
                    <div className="text-center">
                      <img
                        src={paymentData.imageBase64}
                        alt="QRIS Payment"
                        className="w-full h-auto max-w-md mx-auto rounded-xl"
                      />
                      <p className="text-gray-700 mt-4">
                        Scan QR Code untuk membayar
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-blue-600">
                      <p className="text-gray-700">QR Code not available</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRefreshPayment}
                disabled={
                  isRefreshing || loading || paymentStatus === "settled"
                }
                className="w-full mb-4 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl hover:bg-blue-50 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh Payment"}
              </motion.button>

              {/* Amount */}
              <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl text-white shadow-lg space-y-2">
                <div className="mb-3 font-semibold text-sm text-white">
                  Rincian Pembayaran
                </div>

                {/* Harga Booking - Only show for booking type */}
                {paymentType === "booking" &&
                  paymentData &&
                  "baseFee" in paymentData && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">Harga Booking</span>
                      <span className="font-medium">
                        {formatCurrency(paymentData.baseFee ?? 0)}
                      </span>
                    </div>
                  )}

                {/* Diskon Member - Only show for booking type */}
                {paymentType === "booking" &&
                  paymentData &&
                  "discountAmount" in paymentData &&
                  paymentData.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">Total diskon</span>
                      <span className="font-medium text-white">
                        - {formatCurrency(paymentData.discountAmount)}
                      </span>
                    </div>
                  )}

                {/* Admin Fee - Only show for booking type */}
                {paymentType === "booking" &&
                  paymentData &&
                  "adminFee" in paymentData && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">Admin Fee</span>

                      {paymentData?.adminFee == 0 ? (
                        <span className="font-medium text-white">FREE</span>
                      ) : (
                        <span className="font-medium">
                          {formatCurrency(paymentData?.adminFee ?? 0)}
                        </span>
                      )}
                    </div>
                  )}

                <hr className="border-white/20 my-2" />

                {/* Total */}
                <div className="flex items-center justify-between text-base">
                  <span className="font-semibold">Total Pembayaran</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(paymentData?.total ?? 0)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Details & Instructions */}
            <div className="space-y-6">
              {/* Payment Details */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white border border-blue-200 rounded-3xl p-8 shadow-xl"
              >
                <h3 className="mb-6 text-blue-600 font-semibold">
                  Detail Pembayaran
                </h3>

                {paymentType === "booking" &&
                paymentData &&
                "venue" in paymentData ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-gray-500 mb-2 text-sm">
                        Booking ID
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-gray-900 font-mono font-medium">
                            {paymentData.bookId}
                          </div>
                        </div>
                        <button
                          onClick={copyBookId}
                          className="px-4 py-2 bg-yellow-50 border-2 border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-all flex items-center gap-2 font-medium"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Simpan Booking ID ini untuk referensi Anda
                      </p>
                    </div>

                    {/* Venue */}
                    <div>
                      <div className="text-gray-500 mb-1 text-sm">Venue</div>
                      <div className="text-gray-900 font-medium">
                        {paymentData.venue}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-gray-500 mb-1 text-sm">
                          Tanggal
                        </div>
                        <div className="text-gray-900 font-medium">
                          {formatDate(paymentData.date!)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1 text-sm">Jam</div>
                        <div className="text-gray-900 font-medium">
                          {paymentData.time}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1 text-sm">
                        Booking Type
                      </div>
                      <div className="text-gray-900 capitalize font-medium">
                        {paymentData.bookingType}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="text-gray-500 mb-1 text-sm">Product</div>
                      <div className="text-gray-900 font-medium">
                        Blax Football Membership
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1 text-sm">Validity</div>
                      <div className="text-gray-900 font-medium">
                        Annual Access
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1 text-sm">Benefits</div>
                      <div className="text-gray-900 font-medium">
                        Free admin, Discounts, Premium Access
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-semibold">Total</span>
                    <div className="text-blue-600 font-bold text-lg">
                      {amount
                        ? formatCurrency(amount)
                        : formatCurrency(paymentData?.total!)}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Instructions */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white border border-blue-200 rounded-3xl p-8 shadow-xl"
              >
                <h3 className="mb-6 text-blue-600 font-semibold">
                  Bagaimana cara pembayaran?
                </h3>

                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      1
                    </div>
                    <div>
                      <div className="text-gray-900 mb-1 font-medium">
                        Buka aplikasi
                      </div>
                      <div className="text-gray-600 text-sm">
                        Buka aplikasi mobile banking atau e-wallet anda
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div>
                      <div className="text-gray-900 mb-1 font-medium">
                        Scan QR Code
                      </div>
                      <div className="text-gray-600 text-sm">
                        Gunakan fitur scan QRIS yang ada di aplikasi anda
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      3
                    </div>
                    <div>
                      <div className="text-gray-900 mb-1 font-medium">
                        Verifikasi jumlah
                      </div>
                      <div className="text-gray-600 text-sm">
                        Cek kembali apakah jumlah yang dibayarkan sudah sesuai
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      4
                    </div>
                    <div>
                      <div className="text-gray-900 mb-1 font-medium">
                        Selesaikan pembayaran
                      </div>
                      <div className="text-gray-600 text-sm">
                        Konfirmasi dan selesaikan pembayaran anda
                      </div>
                    </div>
                  </li>
                </ol>

                <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <p className="text-gray-600 text-center text-sm">
                    Pembayaran anda akan terkonfirmasi otomatis. Jika belum
                    terkonfirmasi, harap tekan tombol refresh payment.
                  </p>
                </div>
              </motion.div>

              {/* WhatsApp Chat Button */}
              <motion.button
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWhatsAppChat}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Chat with Support
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      <PaymentSuccessModal
        isOpen={successPayment}
        onClose={handleCloseSuccessModal}
        amount={amount}
        productName={paymentType === "booking" ? "Booking" : "Membership"}
      />
    </>
  );
}
