"use client";

import React, { useState, useEffect, useRef, ReactNode } from "react";
import { motion } from "motion/react";
import { Clock, CheckCircle, MessageCircle, RefreshCw } from "lucide-react";
import Button from "@/components/atoms/Button";
import Navbar from "@/components/organisms/Navbar";
import { formatCurrency } from "@/lib/helper";

interface PaymentViewProps {
  paymentData: {
    status: string;
    totalAmount: number;
    imageBase64?: string;
    expiredAt?: string;
  } | null;
  loading: boolean;
  error?: string | null;
  refreshing?: boolean;
  title: string;
  subtitle: string;
  children?: ReactNode;
  onRefresh: () => void;
  onBack?: () => void;
  onDashboard: () => void;
  pendingActions?: ReactNode;
  extraSuccessActions?: ReactNode;
  extraExpiredActions?: ReactNode;
  successTitle?: string;
  successMessage?: string;
  expiredTitle?: string;
  expiredMessage?: string;
  refreshText?: string;
  refreshingText?: string;
  backText?: string;
  paymentLabel?: string;
  showInstructions?: boolean;
  showWhatsApp?: boolean;
}

export default function PaymentView({
  paymentData,
  loading,
  error,
  refreshing,
  title,
  subtitle,
  children,
  onRefresh,
  onBack,
  onDashboard,
  pendingActions,
  extraSuccessActions,
  extraExpiredActions,
  successTitle = "Pembayaran berhasil!",
  successMessage,
  expiredTitle = "Pembayaran Kadaluarsa",
  expiredMessage = "Link pembayaran ini sudah tidak berlaku",
  refreshText = "Refresh Payment",
  refreshingText = "Refreshing...",
  backText = "Kembali",
  paymentLabel = "Topup",
  showInstructions = true,
  showWhatsApp = true,
}: PaymentViewProps) {
  const [timeLeft, setTimeLeft] = useState<number>(-1);
  const [isExpiredLocally, setIsExpiredLocally] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(0);
  const [errorRedirectCountdown, setErrorRedirectCountdown] =
    useState<number>(0);
  const onDashboardRef = useRef(onDashboard);
  onDashboardRef.current = onDashboard;

  useEffect(() => {
    if (
      !paymentData ||
      paymentData.status !== "PENDING" ||
      !paymentData.expiredAt
    ) {
      return;
    }

    const calcTimeLeft = () => {
      const now = new Date();
      const expiry = new Date(paymentData.expiredAt!);
      const diff = Math.floor((expiry.getTime() - now.getTime()) / 1000);
      return Math.max(0, diff);
    };

    const initial = calcTimeLeft();
    setTimeLeft(initial);

    if (initial <= 0) return;

    const interval = setInterval(() => {
      const remaining = calcTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentData?.expiredAt, paymentData?.status]);

  const isPending =
    paymentData?.status === "PENDING" || paymentData?.status === "pending";
  const isSuccess =
    paymentData?.status === "SUCCESS" || paymentData?.status === "settlement";
  const isExpired =
    paymentData?.status === "EXPIRED" || paymentData?.status === "expire";

  useEffect(() => {
    if (timeLeft < 0) return;
    if (timeLeft > 0 || isSuccess || isExpired) {
      setIsExpiredLocally(false);
      return;
    }
    if (!isPending) return;
    setIsExpiredLocally(true);
  }, [timeLeft, isPending, isSuccess, isExpired]);

  useEffect(() => {
    if (!isExpiredLocally) {
      setRedirectCountdown(0);
      return;
    }
    setRedirectCountdown(10);
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isExpiredLocally]);

  useEffect(() => {
    if (redirectCountdown > 0 || !isExpiredLocally) return;
    onDashboardRef.current();
  }, [redirectCountdown, isExpiredLocally]);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!isSuccess) {
      setRedirectCountdown(0);
      return;
    }
    setRedirectCountdown(10);
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isSuccess]);

  useEffect(() => {
    if (redirectCountdown > 0 || !isSuccess) return;
    onDashboardRef.current();
  }, [redirectCountdown, isSuccess]);

  useEffect(() => {
    if (!error) {
      setErrorRedirectCountdown(0);
      return;
    }
    setErrorRedirectCountdown(10);
    const interval = setInterval(() => {
      setErrorRedirectCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [error]);

  useEffect(() => {
    if (errorRedirectCountdown > 0 || !error) return;
    onDashboardRef.current();
  }, [errorRedirectCountdown, error]);

  if (loading && !paymentData) {
    return (
      <div className="min-h-screen py-24 px-4 bg-gradient-to-br from-blue-50 to-white">
        <Navbar currentPage={""} navigateTo={() => {}} />
        <div className="max-w-4xl mx-auto mt-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-12 text-center"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-4">
              Selesaikan Pembayaran {paymentLabel} Anda
            </h1>
            <p className="text-gray-700 text-sm md:text-base">{subtitle}</p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="bg-white border border-blue-200 rounded-3xl p-8 shadow-xl"
            >
              <div className="aspect-square flex items-center justify-center">
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
              </div>
            </motion.div>
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white border border-blue-200 rounded-3xl p-8 shadow-xl"
              >
                <h3 className="mb-6 text-blue-600 font-semibold">
                  Detail Pembayaran
                </h3>
                <div className="text-center text-gray-500 py-8">
                  Memuat data pembayaran...
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Navbar currentPage={""} navigateTo={() => {}} />
        <div className="text-center max-w-md">
          <h2 className="mb-4 text-blue-600">Pembayaran Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">
            {error || "Data pembayaran tidak dapat dimuat"}
          </p>
          {errorRedirectCountdown > 0 && (
            <p className="text-gray-500 text-sm mb-6">
              Mengalihkan ke dashboard dalam {errorRedirectCountdown} detik...
            </p>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDashboard}
            className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md"
          >
            Kembali ke Dashboard
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen py-24 px-4 bg-gradient-to-br from-blue-50 to-white">
        <Navbar currentPage={""} navigateTo={() => {}} />
        <div className="max-w-4xl mx-auto mt-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-12 text-center"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-4">
              Selesaikan Pembayaran {paymentLabel} Anda
            </h1>
            <p className="text-gray-700 text-sm md:text-base">{subtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - QR Code */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="bg-white border border-blue-200 rounded-3xl p-8 shadow-xl"
            >
              {isExpiredLocally ? (
                <div className="text-center py-8">
                  <Clock className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-red-800 mb-2">
                    Pembayaran telah kadaluarsa
                  </h3>
                  <p className="text-red-600 mb-4">
                    Waktu pembayaran telah habis
                  </p>
                  {redirectCountdown > 0 && (
                    <p className="text-gray-500 text-sm">
                      Mengalihkan ke dashboard dalam {redirectCountdown}{" "}
                      detik...
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h2 className="mb-2 text-blue-600">
                      Scan untuk Pembayaran
                    </h2>
                    <p className="text-gray-600">
                      Gunakan e-wallet atau mobile banking anda
                    </p>
                  </div>

                  {isPending && timeLeft > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                      <div className="flex items-center justify-center gap-2 text-center">
                        <Clock
                          className={`w-5 h-5 ${timeLeft < 300 ? "text-red-500" : "text-blue-600"}`}
                        />
                        <div>
                          <div className="text-gray-600 text-sm">
                            Payment expires in
                          </div>
                          <div
                            className={`${timeLeft < 300 ? "text-red-500" : "text-blue-600"} font-semibold text-lg`}
                          >
                            {formatTime(timeLeft)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`mb-6 p-8 bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl cursor-pointer hover:shadow-xl transition-all border-2 ${
                      isSuccess
                        ? "border-green-400 bg-gradient-to-br from-green-100 to-green-50"
                        : "border-blue-200"
                    }`}
                  >
                    <div className="aspect-square flex items-center justify-center">
                      {loading ? (
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
                      ) : isSuccess ? (
                        <div className="text-center text-green-600">
                          <CheckCircle className="w-32 h-32 mx-auto mb-4" />
                          <p className="text-gray-700 text-lg font-semibold">
                            Pembayaran berhasil!
                          </p>
                          <p className="text-gray-500 text-sm mt-2">
                            Mengalihkan ke dashboard dalam {redirectCountdown}{" "}
                            detik...
                          </p>
                        </div>
                      ) : paymentData.imageBase64 ? (
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

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onRefresh}
                    disabled={refreshing || isSuccess}
                    className="w-full mb-4 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl hover:bg-blue-50 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw
                      className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                    />
                    {refreshing ? refreshingText : refreshText}
                  </motion.button>

                  <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl text-white shadow-lg space-y-2">
                    <div className="mb-3 font-semibold text-sm text-white">
                      Rincian Pembayaran
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">Harga {paymentLabel}</span>
                      <span className="font-medium">
                        {formatCurrency(paymentData.totalAmount)}
                      </span>
                    </div>
                    <hr className="border-white/20 my-2" />
                    <div className="flex items-center justify-between text-base">
                      <span className="font-semibold">Total Pembayaran</span>
                      <span className="font-semibold text-lg">
                        {formatCurrency(paymentData.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {isPending && pendingActions}
                </>
              )}
            </motion.div>

            {/* Right Column - Details & Instructions */}
            <div className="space-y-6">
              {/* Payment Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white border border-blue-200 rounded-3xl p-8 shadow-xl"
              >
                <h3 className="mb-6 text-blue-600 font-semibold">
                  Detail Pembayaran
                </h3>
                {children}

                {isSuccess && (
                  <div className="mt-6 pt-6 border-t border-blue-200">
                    <div className="text-center">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-green-800 mb-2">
                        {successTitle}
                      </h3>
                      {successMessage && (
                        <p className="text-green-700 mb-6">{successMessage}</p>
                      )}
                    </div>
                    <div className="space-y-3">
                      {extraSuccessActions}
                      <Button
                        variant="primary"
                        onClick={onDashboard}
                        className="w-full"
                      >
                        Ke Dashboard
                      </Button>
                    </div>
                  </div>
                )}

                {isExpired && (
                  <div className="mt-6 pt-6 border-t border-blue-200">
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-800 mb-2">
                        {expiredTitle}
                      </div>
                      <p className="text-red-700 mb-6">{expiredMessage}</p>
                    </div>
                    <div className="space-y-3">
                      {extraExpiredActions}
                      <Button
                        variant="primary"
                        onClick={onDashboard}
                        className="w-full"
                      >
                        Ke Dashboard
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Actions */}
              {!isSuccess && !isExpired && !isExpiredLocally && (
                <div className="space-y-3">
                  <Button
                    onClick={onDashboard}
                    variant="outline"
                    className="w-full"
                  >
                    Kembali ke Dashboard
                  </Button>
                </div>
              )}

              {/* Instructions */}
              {showInstructions && isPending && !isExpiredLocally && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
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
              )}

              {/* WhatsApp Chat Button */}
              {showWhatsApp && isPending && !isExpiredLocally && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `Hi Admin Blax Football! Saya butuh bantuan dalam melakukan pembayaran ${paymentLabel.toLowerCase()}.`,
                    );
                    window.open(
                      `https://wa.me/6281385042622?text=${msg}`,
                      "_blank",
                    );
                  }}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat with Support
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
