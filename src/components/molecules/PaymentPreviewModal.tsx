"use client";

import React from "react";
import {
  X,
  CheckCircle,
  Calendar,
  CreditCard,
  Hash,
  Clock,
  User,
  MapPin,
  Download,
  ExternalLink,
} from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent } from "../atoms/Card";
import Badge from "../atoms/Badge";
import { formatCurrency } from "@/lib/helper";
import html2canvas from "html2canvas";

interface PaymentPreviewData {
  bookingId: string;
  amount: number;
  paymentDate: string;
  paymentTime: string;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  scheduleName: string;
  venue: string;
  matchDate: string;
  matchTime: string;
  status: string;
}

interface PaymentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PaymentPreviewData | null;
  loading?: boolean;
}

export default function PaymentPreviewModal({
  isOpen,
  onClose,
  paymentData,
  loading = false,
}: PaymentPreviewModalProps) {
  if (!isOpen) return null;

  const generateReceiptHTML = (data: PaymentPreviewData): string => {
    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${data.bookingId}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            padding: 20px;
        }
        
        .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .receipt-header {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .receipt-header h1 {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .receipt-header p {
            opacity: 0.9;
            font-size: 16px;
        }
        
        .receipt-body {
            padding: 30px;
        }
        
        .status-badge {
            display: inline-block;
            background: #dcfce7;
            color: #166534;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 30px;
        }
        
        .amount-section {
            text-align: center;
            padding: 20px;
            background: #f0fdf4;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 2px solid #bbf7d0;
        }
        
        .amount {
            font-size: 36px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 10px;
        }
        
        .details-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .detail-group h3 {
            color: #374151;
            font-size: 18px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .detail-item:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            color: #6b7280;
            font-weight: 500;
        }
        
        .detail-value {
            font-weight: 600;
            color: #111827;
            text-align: right;
        }
        
        .booking-id {
            font-family: 'Courier New', monospace;
            background: #f3f4f6;
            padding: 4px 8px;
            border-radius: 4px;
        }
        
        .footer-section {
            background: #f9fafb;
            padding: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        }
        
        .footer-section p {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .company-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        
        .company-info h4 {
            color: #374151;
            margin-bottom: 8px;
        }
        
        .company-info p {
            font-size: 13px;
            color: #6b7280;
        }
        
        @media (max-width: 768px) {
            .details-section {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .amount {
                font-size: 28px;
            }
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .receipt-container {
                box-shadow: none;
                border-radius: 0;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="receipt-header">
            <h1>Bukti Pembayaran</h1>
            <p>Terimakasih atas pemesanan anda</p>
        </div>
        
        <div class="receipt-body">
            <div style="text-align: center;">
                <span class="status-badge">✓ Pembayaran terkonfirmasi</span>
            </div>
            
            <div class="amount-section">
                <div class="amount">${formatCurrency(data.amount)}</div>
                <p style="color: #059669; font-weight: 600;">Berhasil dibayar</p>
            </div>
            
            <div class="details-section">
                <div class="detail-group">
                    <h3>💳 Informasi pembayaran</h3>
                    <div class="detail-item">
                        <span class="detail-label">Booking ID</span>
                        <span class="detail-value booking-id">${
                          data.bookingId
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Payment Method</span>
                        <span class="detail-value">${data.paymentMethod}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Payment Date</span>
                        <span class="detail-value">${data.paymentDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Payment Time</span>
                        <span class="detail-value">${
                          data.paymentTime
                        } WIB</span>
                    </div>
                </div>
                
                <div class="detail-group">
                    <h3>📅 Booking Details</h3>
                    <div class="detail-item">
                        <span class="detail-label">Name</span>
                        <span class="detail-value">${data.customerName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Phone Number</span>
                        <span class="detail-value">${data.customerPhone}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Jadwal</span>
                        <span class="detail-value">${data.scheduleName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Venue</span>
                        <span class="detail-value">${data.venue}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Match Date</span>
                        <span class="detail-value">${new Date(
                          data.matchDate
                        ).toLocaleDateString("id-ID")}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Match Time</span>
                        <span class="detail-value">${data.matchTime} WIB</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer-section">
            <p><strong>Transaksi berhasil pada ${data.paymentDate} at ${
      data.paymentTime
    } WIB</strong></p>
            <p>Simpan struk ini untuk arsip Anda</p>
            
            <div class="company-info">
                <h4>Blax football</h4>
                <p>Customer Service: support@blaxfootball.com</p>
                <p>Phone: +62 xxx-xxx-xxxx</p>
                <p>Thank you for choosing our service!</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  };

  const handleDownloadReceipt = async () => {
    if (!paymentData) return;

    try {
      // Buat container sementara untuk HTML receipt
      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = generateReceiptHTML(paymentData);
      document.body.appendChild(tempContainer);

      const receiptElement = tempContainer.querySelector(
        ".receipt-container"
      ) as HTMLElement;

      if (!receiptElement) throw new Error("Receipt element not found");

      // Render ke canvas pakai html2canvas
      const canvas = await html2canvas(receiptElement, {
        scale: 2, // biar hasilnya lebih tajam
      });

      // Convert canvas ke PNG
      const dataUrl = canvas.toDataURL("image/png");

      // Download PNG
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `receipt-${
        paymentData.bookingId
      }-${paymentData.paymentDate.replace(/\//g, "-")}.png`;
      document.body.appendChild(link);
      link.click();

      // Bersihkan container sementara
      document.body.removeChild(link);
      document.body.removeChild(tempContainer);
    } catch (error) {
      console.error("Error downloading receipt:", error);
      alert("Failed to download receipt. Please try again.");
    }
  };

  const handleViewFullDetails = () => {
    if (paymentData?.bookingId) {
      window.open(`/payment/${paymentData.bookingId}`, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Pembayaran berhasil
                </h2>
                <p className="text-sm text-gray-600">
                  Booking anda sudah dikonfirmasi
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {/* Loading skeleton */}
                <div className="animate-pulse">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-8 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-8 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : paymentData ? (
              <div className="space-y-6">
                {/* Payment Summary */}
                <Card className="border-green-200 bg-green-50/30">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {formatCurrency(paymentData.amount)}
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Pembayaran dikonfirmasi
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Payment Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                          Informasi pembayaran
                        </h3>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Booking ID
                            </span>
                            <span className="font-mono text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                              {paymentData.bookingId}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Payment Method
                            </span>
                            <span className="font-medium text-gray-900">
                              {paymentData.paymentMethod}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Payment Date
                            </span>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {paymentData.paymentDate}
                              </div>
                              <div className="text-sm text-gray-500">
                                {paymentData.paymentTime} WIB
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                          Booking Details
                        </h3>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <User className="w-4 h-4 text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {paymentData.customerName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {paymentData.customerPhone}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {paymentData.scheduleName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {paymentData.venue}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {new Date(
                                  paymentData.matchDate
                                ).toLocaleDateString("id-ID")}
                              </div>
                              <div className="text-sm text-gray-600">
                                {paymentData.matchTime} WIB
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Success Message */}
                <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Booking Confirmed!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Pembayaran anda telah berhasil diproses.
                  </p>
                  <div className="text-sm text-gray-500">
                    Transaksi berhasil pada {paymentData.paymentDate}{" "}
                    {paymentData.paymentTime} WIB
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Payment Data
                </h3>
                <p className="text-gray-600">
                  Unable to load payment information at this time.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex items-center"
            >
              Close
            </Button>

            {paymentData && (
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadReceipt}
                  className="flex items-center border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
