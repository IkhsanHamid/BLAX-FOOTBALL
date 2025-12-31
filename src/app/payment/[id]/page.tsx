"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  QrCode,
  Copy,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Calendar,
  MapPin,
  User,
  Phone,
  MessageCircle,
  X,
  Download,
} from "lucide-react";
import Button from "@/components/atoms/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card";
import Badge from "@/components/atoms/Badge";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { bookingService } from "@/utils/booking";
import { formatCurrency } from "@/lib/helper";
import LoadingScreen from "@/components/atoms/LoadingScreen";
import Navbar from "@/components/organisms/Navbar";
import { useAuth } from "@/contexts/AuthContext";

interface PaymentData {
  name: string;
  phone: string;
  bookId: string;
  total: number;
  imageBase64: string;
  status: "pending" | "settlement" | "expire";
  scheduleName?: string;
  venue?: string;
  date?: string;
  time?: string;
  bookingType?: string;
  feeGk?: number;
  feePlayer?: number;
  error?: string;
}

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PaymentData;
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  paymentData,
}) => {
  const generateWhatsAppMessage = () => {
    const message = `Halo Admin Blax Football,

Saya ingin mengkonfirmasi pembayaran booking saya:

📋 Booking ID: ${paymentData.bookId}
👤 Nama: ${paymentData.name}
📱 No HP: ${paymentData.phone}
🏟️ Pertandingan: ${paymentData.scheduleName || "N/A"}
📍 Venue: ${paymentData.venue || "N/A"}
📅 Tanggal: ${
      paymentData.date
        ? new Date(paymentData.date).toLocaleDateString("id-ID")
        : "N/A"
    }
⏰ Waktu: ${paymentData.time || "N/A"} WIB
💰 Total: ${formatCurrency(paymentData.total)}
✅ Status: Pembayaran Berhasil

Mohon dicek dan dikonfirmasi untuk lineup. Terima kasih!`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = "621385042622"; // Replace with actual admin WhatsApp number
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    window.open(whatsappUrl, "_blank");
    onClose();
  };

  const { showSuccess, showError } = useNotifications();
  const handleDownloadReceipt = () => {
    // Implement receipt download functionality
    showSuccess("Receipt downloaded successfully");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="w-6 h-6 mr-2 text-green-600" />
              Contact Admin
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Pembayaran berhasil!
              </h3>
              <p className="text-gray-600 text-sm">
                Pembayaran Anda telah dikonfirmasi. Hubungi admin melalui
                WhatsApp jika mengalami kendala dan cek line up anda.
              </p>
            </div>

            {/* WhatsApp Preview */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-3">
                <MessageCircle className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  Message Preview:
                </span>
              </div>
              <div className="text-xs text-gray-600 bg-white p-3 rounded border max-h-32 overflow-y-auto">
                <p>Halo Admin Blax Football,</p>
                <br />
                <p>Saya ingin mengkonfirmasi pembayaran booking saya:</p>
                <br />
                <p>📋 Booking ID: {paymentData.bookId}</p>
                <p>👤 Nama: {paymentData.name}</p>
                <p>📱 No HP: {paymentData.phone}</p>
                <p>🏟️ Pertandingan: {paymentData.scheduleName || "N/A"}</p>
                <p>📍 Venue: {paymentData.venue || "N/A"}</p>
                <p>
                  📅 Tanggal:{" "}
                  {paymentData.date
                    ? new Date(paymentData.date).toLocaleDateString("id-ID")
                    : "N/A"}
                </p>
                <p>⏰ Waktu: {paymentData.time || "N/A"} WIB</p>
                <p>💰 Total: {formatCurrency(paymentData.total)}</p>
                <p>✅ Status: Pembayaran Berhasil</p>
                <br />
                <p>Mohon dicek dan dikonfirmasi untuk lineup. Terima kasih!</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="black"
                size="sm"
                onClick={handleDownloadReceipt}
                className="flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button
                variant="primary"
                onClick={handleWhatsAppClick}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Open WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [hasShownSuccessModal, setHasShownSuccessModal] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (params.id) {
      fetchPaymentData();
    }
  }, [params.id]);

  // Show WhatsApp modal when payment becomes successful
  useEffect(() => {
    if (
      paymentData &&
      paymentData.status === "settlement" &&
      !hasShownSuccessModal
    ) {
      setShowWhatsAppModal(true);
      setHasShownSuccessModal(true);
    }
  }, [paymentData, hasShownSuccessModal]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const result = await bookingService.previewPayment(params.id as string);
      setPaymentData(result);
    } catch (error) {
      console.error("Error fetching payment data:", error);
      showError("Payment Error", "Failed to fetch payment data");
      setPaymentData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPaymentData();
    setRefreshing(false);
    showSuccess("Data refreshed successfully");
  };

  const copyBookId = () => {
    if (paymentData?.bookId) {
      navigator.clipboard.writeText(paymentData.bookId);
      showSuccess("Copied", "Book ID copied to clipboard");
    }
  };

  const getStatusDisplay = () => {
    if (!paymentData) return null;

    switch (paymentData.status) {
      case "pending":
        return {
          icon: <Clock className="w-6 h-6 text-yellow-500" />,
          title: "Payment Pending",
          description: "Please complete your payment using the QR code below",
          color: "border-yellow-200 bg-yellow-50",
          textColor: "text-yellow-800",
        };
      case "settlement":
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          title: "Payment Successful",
          description: "Your payment has been confirmed successfully",
          color: "border-green-200 bg-green-50",
          textColor: "text-green-800",
        };
      case "expire":
        return {
          icon: <XCircle className="w-6 h-6 text-red-500" />,
          title: "Payment Expired",
          description:
            "This payment link has expired. Please create a new booking.",
          color: "border-red-200 bg-red-50",
          textColor: "text-red-800",
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-gray-500" />,
          title: "Unknown Status",
          description: "Unable to determine payment status",
          color: "border-gray-200 bg-gray-50",
          textColor: "text-gray-800",
        };
    }
  };

  if (loading) {
    return (
      <>
        <Navbar
          currentPage={""}
          navigateTo={function (page: string): void {
            throw new Error("Function not implemented.");
          }}
        />
        <LoadingScreen message="Loading payment information..." />
      </>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Navbar
          currentPage={""}
          navigateTo={function (page: string): void {
            throw new Error("Function not implemented.");
          }}
        />
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Payment Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The payment information could not be loaded. Please check your
              payment ID and try again.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push("/")}
                className="flex-1"
              >
                Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If payment status is expired, show only the expired card
  if (paymentData.status === "expire") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar
          currentPage={""}
          navigateTo={function (page: string): void {
            throw new Error("Function not implemented.");
          }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 mt-10">
          {/* Header */}
          <div className="mb-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Payment Information
              </h1>
              <p className="text-gray-600">Selesaikan pembayaran anda</p>
            </div>
          </div>

          {/* Expired Card */}
          <div className="flex items-center justify-center">
            <Card className="border-red-200 bg-red-50 max-w-md w-full">
              <CardContent className="p-8 text-center">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-800 mb-2">
                  Payment Expired
                </h3>
                <p className="text-red-700 mb-6">
                  Link pembayaran ini sudah expired. Silahkan buat booking baru
                  untuk melanjutkannya
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/schedule")}
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-100"
                  >
                    New Booking
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => router.push("/")}
                    className="flex-1"
                  >
                    Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar
          currentPage={""}
          navigateTo={function (page: string): void {
            throw new Error("Function not implemented.");
          }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 hover:bg-white/80 backdrop-blur-sm text-slate-700 border border-blue-100 shadow-md hover:shadow-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Informasi pembayaran
              </h1>
              <p className="text-gray-600">
                Selesaikan pembayaran booking Anda dengan aman
              </p>
            </div>
          </div>

          {/* Status Card */}
          <Card className={`mb-8 ${statusDisplay?.color}`}>
            <CardContent className="p-6">
              <div className="pt-4 flex items-center space-x-4">
                {statusDisplay?.icon}
                <div>
                  <h3
                    className={`text-lg font-semibold ${statusDisplay?.textColor}`}
                  >
                    {statusDisplay?.title}
                  </h3>
                  <p className={`text-sm ${statusDisplay?.textColor}`}>
                    {statusDisplay?.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Details */}
            <div className="space-y-6">
              {/* Booking ID Card */}
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-yellow-800">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Booking Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white p-3 rounded border border-yellow-300">
                      <div>
                        <p className="text-sm text-yellow-700 font-medium">
                          Booking ID
                        </p>
                        <span className="text-lg font-mono font-bold text-gray-800">
                          {paymentData.bookId}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyBookId}
                        className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="text-sm text-yellow-700 leading-relaxed">
                      <strong>📝 Penting:</strong>Simpan ID booking Anda sebagai
                      bukti pembayaran atau berikan kepada admin jika pembayaran
                      gagal.
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Details */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-800">
                    <User className="w-5 h-5 mr-2" />
                    Detail Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">{paymentData.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">{paymentData.venue}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">{paymentData.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">
                        Jumlah:{" "}
                        <strong>{formatCurrency(paymentData.total)}</strong>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Details (if available) */}
              {paymentData.scheduleName && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-purple-800">
                      <Calendar className="w-5 h-5 mr-2" />
                      Detail Jadwal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {paymentData.scheduleName}
                        </p>
                      </div>
                      {paymentData.venue && (
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700">
                            {paymentData.venue}
                          </span>
                        </div>
                      )}
                      {paymentData.date && paymentData.time && (
                        <div className="flex items-center space-x-3">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700">
                            {new Date(paymentData.date).toLocaleDateString(
                              "id-ID"
                            )}{" "}
                            • {paymentData.time} WIB
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* QR Code Section */}
            <div className="space-y-6">
              {paymentData.status === "pending" && paymentData.imageBase64 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-800">
                      <QrCode className="w-5 h-5 mr-2" />
                      Pembayaran QRIS Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 inline-block mb-4">
                      <img
                        src={paymentData.imageBase64}
                        alt="QRIS Code"
                        className="w-64 h-64 mx-auto"
                        onError={(e) => {
                          console.error("Failed to load QRIS image");
                          showError("Image Error", "Failed to load QRIS code");
                        }}
                      />
                    </div>
                    <p className="text-green-700 mb-4">
                      Pindai kode QR ini dengan aplikasi mobile banking atau
                      e-wallet Anda
                    </p>
                    <div className="text-sm text-green-600 space-y-1">
                      <p>• Buka aplikasi mobile banking atau e-wallet anda</p>
                      <p>• Pilih fitur pembayaran kode QR</p>
                      <p>• Arahkan kamera ke kode QR di atas</p>
                      <p>
                        • Konfirmasi jumlah pembayaran dan selesaikan transaksi
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {paymentData.status === "settlement" && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="pt-4 text-xl font-bold text-green-800 mb-2">
                      Pembayaran berhasil!
                    </h3>
                    <p className="text-green-700 mb-6">
                      Pembayaran Anda telah dikonfirmasi. Hubungi admin melalui
                      WhatsApp jika mengalami kendala dan cek line up anda.
                    </p>
                    <div className="space-y-3">
                      <Button
                        variant="primary"
                        onClick={() => setShowWhatsAppModal(true)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Hubungi Admin via WhatsApp
                      </Button>
                      {user && (
                        <Button
                          variant="outline"
                          onClick={() => router.push("/player-dashboard")}
                          className="w-full"
                        >
                          Go to Dashboard
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="w-full"
                  disabled={refreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  {refreshing ? "Refreshing..." : "Refresh Status"}
                </Button>

                <Button
                  onClick={() => router.push("/")}
                  variant="primary"
                  className="w-full"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <Card className="mt-8 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Butuh bantuan?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Payment Issues
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      • Kode QR tidak berfungsi atau tidak muncul? Coba refresh
                      halaman ini
                    </li>
                    <li>
                      • Pembayaran gagal? Silahkan hubungi admin dan lampirkan
                      ID booking anda
                    </li>
                    <li>• Simpan ID booking Anda untuk referensi</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Contact Support
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📞 Phone: +62 21 1234 5678</p>
                    <p>📧 Email: support@blaxfootball.com</p>
                    <p>💬 WhatsApp: +62 812 3456 7890</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        paymentData={paymentData}
      />
    </>
  );
}
