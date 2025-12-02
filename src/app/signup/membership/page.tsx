"use client";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Check, QrCode } from "lucide-react";
import { useState } from "react";
import EmptyState from "@/components/molecules/EmptyState";
import { useRouter } from "next/navigation";
import Navbar from "@/components/organisms/Navbar";
import { useFormSignup } from "@/contexts/FormSignupContext";

export default function MembershipCheckoutPage() {
  const [showQRIS, setShowQRIS] = useState(false);
  const membershipPrice = 100000;
  const navigate = useRouter();

  const { selectedSignup } = useFormSignup();

  const benefits = [
    "Jersey eksklusif Blax Football",
    "Diskon 10% untuk semua booking",
    "Akses informasi lineup secara langsung",
    "Prioritas booking untuk jam populer",
    "Event dan turnamen khusus member",
    "Sesi latihan gratis setiap bulan",
  ];

  const handlePayment = () => {
    setShowQRIS(true);
  };

  const handlePaymentSuccess = () => {
    setShowQRIS(false);
  };

  if (!selectedSignup) {
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
    <div className="min-h-screen py-24 px-4 bg-gradient-to-br from-blue-50 to-white">
      <Navbar
        currentPage={""}
        navigateTo={function (page: string): void {
          throw new Error("Function not implemented.");
        }}
      />
      <div className="max-w-4xl mx-auto mt-10">
        {/* Kartu Membership */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white border border-blue-200 rounded-3xl p-8 md:p-12 shadow-xl mb-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-3 text-blue-600">
              Membership Blax Football
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Bergabung dengan program membership eksklusif kami dan nikmati
              berbagai keuntungan premium termasuk jersey gratis dan diskon
              spesial
            </p>
          </div>

          {/* Harga */}
          <div className="text-center mb-8 p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border-2 border-amber-200">
            <div className="text-gray-600 mb-2">Biaya Membership</div>
            <div className="text-3xl font-bold text-amber-600">
              IDR {membershipPrice.toLocaleString("id-ID")}
            </div>
            <div className="text-gray-500 mt-2">Pembayaran sekali</div>
          </div>

          {/* Keuntungan */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6 text-center text-blue-600">
              Keuntungan Membership
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-200"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tombol Pembayaran */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePayment}
            className="w-full px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg flex items-center justify-center gap-3 font-semibold"
          >
            <QrCode className="w-5 h-5" />
            Lanjutkan ke Pembayaran
          </motion.button>

          {/* Syarat & Ketentuan */}
          <p className="text-center text-gray-500 mt-6 text-sm">
            Dengan membeli membership, kamu menyetujui syarat dan ketentuan yang
            berlaku
          </p>
        </motion.div>

        {/* Highlight Fitur */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: Crown,
              title: "Akses Premium",
              description:
                "Dapatkan akses ke fitur dan konten eksklusif khusus member",
            },
            {
              icon: Check,
              title: "Jersey Berkualitas",
              description:
                "Terima jersey resmi Blax Football setelah aktivasi membership",
            },
            {
              icon: QrCode,
              title: "Pembayaran Mudah",
              description: "Pembayaran aman dan instan melalui QRIS",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="p-6 bg-white border border-blue-200 rounded-2xl shadow-md text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="font-semibold mb-2 text-blue-600">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
