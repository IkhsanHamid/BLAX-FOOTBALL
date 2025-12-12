"use client";

import { motion } from "motion/react";
import {
  ArrowLeft,
  QrCode,
  Clock,
  CheckCircle,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "./NotificationContainer";
import Navbar from "./Navbar";
import { paymentService } from "@/utils/payment";
import { PaymentDataMember } from "@/types/payment";
import PaymentSuccessModal from "../molecules/SuccessPaymentModal";

interface QRISPaymentPageProps {
  amount: number;
  paymentType: "booking" | "membership";
  bookingDetails?: {
    stadium: string;
    location: string;
    date: string;
    time: string;
    bookingType: string;
  };
  paymentId: string;
  onPaymentSuccess: () => void;
}

export function QRISPaymentPage({
  amount,
  paymentType,
  bookingDetails,
  paymentId,
  onPaymentSuccess,
}: QRISPaymentPageProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(900);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentDataMember | null>(
    null
  );
  const [successPayment, setSuccessPayment] = useState(false);

  useEffect(() => {
    if (!paymentData?.expired_at) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const expiredAt = new Date(paymentData.expired_at);
      const diffInSeconds = Math.floor(
        (expiredAt.getTime() - now.getTime()) / 1000
      );
      return Math.max(0, diffInSeconds);
    };

    // Set initial time
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        showError("error", "Payment session expired");
        if (paymentType === "booking") {
          router.push("/schedule");
        } else {
          router.push("/");
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentData?.expired_at, showError, paymentType, router]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    if (paymentId) {
      fetchPaymentData();
    }
  }, [paymentId]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const result = await paymentService.showQRMember(paymentId);
      if (result.status === "expire") {
        router.push("/");
        showError(
          "error",
          "Pembayaran telah kaduluarsa silahkan login kembali"
        );
      }
      setPaymentData(result);
    } catch (error: any) {
      console.error("Error fetching payment data:", error);
      showError("Payment Error", "Failed to fetch payment data");
      setPaymentData(null);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPayment = async () => {
    try {
      setLoading(true);
      const result = await paymentService.checkPaymentStatusMembership(
        paymentId
      );

      if (result.status === "settlement") {
        setSuccessPayment(true);
        showSuccess("success", "Berhasil melakukan pembayaran");
        onPaymentSuccess();
      } else if (result.status === "expire") {
        showError("error", "Gagal melakukan pembayaran silahkan login kembali");
        router.push("/");
      } else if (result.status === "pending") {
        showSuccess("success", "Berhasil refresh pembayaran");
      } else if (result.status === true) {
        showSuccess("success", "Pembayaran sudah dilakukan");
        router.push("/");
      }
    } catch (error: any) {
      console.error("Error fetching payment data:", error);
      showError("Payment Error", "Failed to refresh payment data");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppChat = () => {
    // Open WhatsApp chat with Blax Football support
    const phoneNumber = "6281234567890"; // Replace with actual WhatsApp business number
    const message = encodeURIComponent(
      `Hi Blax Football! I need help with my ${
        paymentType === "booking" ? "booking" : "membership"
      } payment. Transaction Amount: IDR ${amount.toLocaleString("id-ID")}`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
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
              Selesaikan Pembayaran Membership Anda
            </h1>
            <p className="text-gray-700 text-sm md:text-base">
              Hanya beberapa langkah lagi untuk menyelesaikan proses membership
              Anda.
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
                      }`}
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
                className="w-full mb-4 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl hover:bg-blue-50 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh Payment
              </motion.button>

              {/* Amount */}
              <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <span>Total Pembayaran</span>
                  <div>IDR {amount.toLocaleString("id-ID")}</div>
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
                <h3 className="mb-6 text-blue-600">Detail Pembayaran</h3>

                {paymentType === "booking" && bookingDetails ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-gray-500 mb-1">Stadium</div>
                      <div className="text-gray-900">
                        {bookingDetails.stadium}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Location</div>
                      <div className="text-gray-900">
                        {bookingDetails.location}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-gray-500 mb-1">Date</div>
                        <div className="text-gray-900">
                          {bookingDetails.date}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Time</div>
                        <div className="text-gray-900">
                          {bookingDetails.time}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Booking Type</div>
                      <div className="text-gray-900 capitalize">
                        {bookingDetails.bookingType}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="text-gray-500 mb-1">Product</div>
                      <div className="text-gray-900">
                        Blax Football Membership
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Validity</div>
                      <div className="text-gray-900">Anually Access</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Benefits</div>
                      <div className="text-gray-900">
                        Free admin, Discounts, Premium Access
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">Total</span>
                    <div className="text-blue-600">
                      IDR {amount.toLocaleString("id-ID")}
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
                <h3 className="mb-6 text-blue-600">
                  Bagaimana cara pembayaran ?
                </h3>

                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                      1
                    </div>
                    <div>
                      <div className="text-gray-900 mb-1">Buka aplikasi</div>
                      <div className="text-gray-600">
                        Buka aplikasi mobile banking atau e-wallet anda
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                      2
                    </div>
                    <div>
                      <div className="text-gray-900 mb-1">Scan QR Code</div>
                      <div className="text-gray-600">
                        Gunakan fitur scan QRIS yang ada di aplikasi anda
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                      3
                    </div>
                    <div>
                      <div className="text-gray-900 mb-1">
                        Verifikasi jumlah
                      </div>
                      <div className="text-gray-600">
                        Cek kembali apakah jumlah yang dibayarkan sama
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                      4
                    </div>
                    <div>
                      <div className="text-gray-900 mb-1">
                        Selesaikan pembayaran
                      </div>
                      <div className="text-gray-600">
                        Konfirmasi dan selesaikan pembayaran anda
                      </div>
                    </div>
                  </li>
                </ol>

                <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <p className="text-gray-600 text-center">
                    Pembayaran anda akan terkonfirmasi otomatis jika pembayaran
                    telah diterima, jika belum terkonfirmasi harap tekan tombol
                    konfirmasi
                  </p>
                </div>
              </motion.div>

              {/* WhatsApp Chat Button */}
              <motion.button
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
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
        onClose={() => setSuccessPayment(false)}
        amount={amount}
        productName="Membership"
      />
    </>
  );
}
