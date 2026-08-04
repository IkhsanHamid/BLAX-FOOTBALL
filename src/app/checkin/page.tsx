"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QrCode, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Navbar from "@/components/organisms/Navbar";
import { apiClient } from "@/utils/api";

export default function CheckinPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Token tidak ditemukan. Pastikan URL memiliki parameter token.");
      return;
    }

    const fetchQr = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get(`/api/v1/attendance/qr/${token}`);
        if (res?.status && res?.data?.qrCode) {
          setQrCode(res.data.qrCode);
        } else {
          setError(res?.message || "Gagal memuat QR code kehadiran.");
        }
      } catch (err: any) {
        console.error("Error fetching QR code:", err);
        setError(err?.message || "Gagal memuat QR code kehadiran.");
      } finally {
        setLoading(false);
      }
    };

    fetchQr();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900">
      <Navbar
        useScrollEffect={false}
        currentPage={""}
        navigateTo={function (page: string): void {
          throw new Error("Function not implemented.");
        }}
      />

      <div className="max-w-md mx-auto px-4 pt-28 sm:pt-32 pb-16">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/20 mb-4">
            <QrCode className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">
            QR Kehadiran
          </h1>
          <p className="text-sm text-slate-400">
            Tunjukkan QR code ini kepada petugas untuk check-in kehadiran
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
              <p className="text-slate-500 text-sm">Memuat QR Code...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-slate-800 font-semibold mb-1">Gagal Memuat</p>
              <p className="text-sm text-slate-500">{error}</p>
            </div>
          ) : qrCode ? (
            <div className="flex flex-col items-center">
              <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 mb-6">
                <img
                  src={qrCode}
                  alt="QR Code Kehadiran"
                  className="w-60 h-60 sm:w-72 sm:h-72 object-contain"
                />
              </div>
              <p className="text-xs text-slate-400 text-center max-w-xs">
                QR code ini berlaku untuk satu kali check-in. Jangan bagikan kepada orang lain.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
