"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExternalLink, User, Calendar, Clock, CreditCard } from "lucide-react";
import PaymentView from "@/components/organisms/PaymentView";
import { formatCurrency } from "@/lib/helper";
import { depositService } from "@/utils/deposit";
import { AuthService } from "@/utils/auth";
import type { UserDepositPaymentDetail } from "@/types/deposit";

export default function DepositPaymentPage() {
  const params = useParams();
  const router = useRouter();

  const handleRedirect = useCallback(() => {
    AuthService.getSession().then((session) => {
      if (session?.access_token) {
        router.push("/player-dashboard");
      } else {
        router.push("/");
      }
    });
  }, [router]);
  const [paymentData, setPaymentData] =
    useState<UserDepositPaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await depositService.checkPayment(
        params.encryptedPaymentId as string,
      );
      console.log("object", result);
      setPaymentData(result);
    } catch (err) {
      console.error("Error fetching payment data:", err);
      setError("Pembayaran tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.encryptedPaymentId) {
      fetchPaymentData();
    }
  }, [params.encryptedPaymentId]);

  useEffect(() => {
    console.log("paymentData", paymentData);
    if (!paymentData || paymentData.status !== "PENDING") return;

    const interval = setInterval(async () => {
      try {
        const statusResult = await depositService.checkTopupStatus(
          params.encryptedPaymentId as string,
        );

        console.log("statusResult", statusResult);
        const status = String(statusResult.status || "").toUpperCase();
        if (status === "SUCCESS" || status === "SETTLEMENT") {
          setPaymentData((prev) =>
            prev ? { ...prev, status: "SUCCESS" } : null,
          );
        } else if (status === "EXPIRED" || status === "EXPIRE") {
          setPaymentData((prev) =>
            prev ? { ...prev, status: "EXPIRED" } : null,
          );
        } else if (status === "FAILED") {
          setPaymentData((prev) =>
            prev ? { ...prev, status: "FAILED" } : null,
          );
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentData?.status, params.encryptedPaymentId]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const result = await depositService.checkTopupStatus(
        params.encryptedPaymentId as string,
      );
      console.log("result", result);
      const status = String(result.status || "").toUpperCase();
      if (status === "SUCCESS" || status === "SETTLEMENT") {
        setPaymentData((prev) =>
          prev ? { ...prev, status: "SUCCESS" } : null,
        );
      } else if (status === "EXPIRED" || status === "EXPIRE") {
        setPaymentData((prev) =>
          prev ? { ...prev, status: "EXPIRED" } : null,
        );
      } else if (status === "FAILED") {
        setPaymentData((prev) =>
          prev ? { ...prev, status: "FAILED" } : null,
        );
      } else {
        await fetchPaymentData();
      }
    } catch {
      await fetchPaymentData();
    } finally {
      setRefreshing(false);
    }
  };

  const detailsCard = paymentData ? (
    <div className="space-y-4">
      <div>
        <div className="text-gray-500 mb-1 text-sm">Nama</div>
        <div className="text-gray-900 font-medium flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          {paymentData.customerName}
        </div>
      </div>
      <div>
        <div className="text-gray-500 mb-1 text-sm">Jumlah</div>
        <div className="text-gray-900 font-medium flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          {formatCurrency(paymentData.totalAmount)}
        </div>
      </div>
      <div>
        <div className="text-gray-500 mb-1 text-sm">Dibuat</div>
        <div className="text-gray-900 font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          {new Date(paymentData.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
      {paymentData.expiredAt && (
        <div>
          <div className="text-gray-500 mb-1 text-sm">Kadaluarsa</div>
          <div className="text-gray-900 font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            {new Date(paymentData.expiredAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-gray-900 font-semibold">Total</span>
          <div className="text-blue-600 font-bold text-lg">
            {formatCurrency(paymentData.totalAmount)}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <PaymentView
      paymentData={paymentData}
      loading={loading}
      error={error}
      refreshing={refreshing}
      title=""
      subtitle="Hanya beberapa langkah lagi untuk menyelesaikan proses topup Anda."
      onRefresh={handleRefresh}
      onDashboard={handleRedirect}
      paymentLabel="Topup"
      successTitle="Pembayaran berhasil!"
      successMessage={`Topup sebesar ${paymentData ? formatCurrency(paymentData.totalAmount) : ""} telah berhasil ditambahkan ke saldo Anda.`}
      expiredMessage="Link pembayaran ini sudah expired. Silahkan buat topup baru untuk melanjutkannya"
      pendingActions={
        paymentData?.status === "PENDING" && paymentData.paymentUrl ? (
          <div className="mt-4">
            <button
              onClick={() => window.open(paymentData.paymentUrl, "_blank")}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Bayar Sekarang
            </button>
          </div>
        ) : undefined
      }
    >
      {detailsCard}
    </PaymentView>
  );
}
