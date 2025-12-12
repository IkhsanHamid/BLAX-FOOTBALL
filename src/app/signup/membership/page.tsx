"use client";
import EmptyState from "@/components/molecules/EmptyState";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/organisms/Navbar";
import { useFormSignup } from "@/contexts/FormSignupContext";
import { QRISPaymentPage } from "@/components/organisms/QRISPayment";

export default function MembershipCheckoutPage() {
  const searchParams = useSearchParams();
  const navigate = useRouter();

  const { selectedSignup } = useFormSignup();

  const paymentIdFromQuery = searchParams.get("paymentId");

  const handlePaymentSuccess = () => {
    setTimeout(() => {
      navigate.push("/");
    }, 10000); // 10 detik = 10000 ms
  };

  const isPaymentIdInvalid =
    !paymentIdFromQuery ||
    paymentIdFromQuery === "undefined" ||
    paymentIdFromQuery === "";

  if (!selectedSignup && isPaymentIdInvalid) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar
          currentPage={""}
          navigateTo={function (page: string): void {
            throw new Error("Function not implemented.");
          }}
        />
        <EmptyState
          title="Data tidak ditemukan"
          description="Maaf, data yang kamu cari tidak tersedia"
          onBack={() => navigate.push("/")}
          backLabel="Kembali ke Beranda"
        />
      </div>
    );
  }

  return (
    <>
      <QRISPaymentPage
        amount={100000}
        paymentType="membership"
        paymentId={paymentIdFromQuery!}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}
