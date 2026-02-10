"use client";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/atoms/Button";
import Image from "next/image";

interface PopupBannerProps {
  // Optional props jika ingin customize
  bannerImage?: any;
  title?: string;
  description?: string;
  ctaText?: string;
  storageKey?: string;
}

export default function PopupBanner({
  bannerImage,
  title = "FCL Tournament! 🏆",
  description = "Ikuti Fantasy Champions League terbaru kami. Daftar sekarang dan menangkan hadiah menarik!",
  ctaText = "Lihat Jadwal Tournament",
  storageKey = "hasSeenPopupBanner",
}: PopupBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Cek apakah user sudah klik "Jangan tampilkan lagi"
    const dontShowAgain = localStorage.getItem(storageKey);

    if (!dontShowAgain) {
      // Popup akan muncul jika user belum klik "Jangan tampilkan lagi"
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500); // Muncul setelah 1 detik

      return () => clearTimeout(timer);
    }
  }, [storageKey]);
  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDontShowAgain = () => {
    setIsOpen(false);
    // Simpan ke localStorage bahwa user tidak ingin melihat popup lagi
    localStorage.setItem(storageKey, "true");
  };

  const handleCTAClick = () => {
    handleClose();
    // Redirect ke schedule page dengan query parameter untuk filter tournament
    // autoSelectDate=true akan membuat schedule page otomatis pilih tanggal terdekat tournament
    router.push("/schedule?event=TOURNAMENT&autoSelectDate=true");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            aria-label="Close popup"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>

          {/* Banner Image */}
          <div className="relative w-full h-64 sm:h-80 overflow-hidden">
            <Image
              src={bannerImage}
              alt="Tournament Banner"
              //   className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              {title}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mb-6">
              {description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={handleCTAClick}
                className="flex-1 shadow-lg hover:shadow-xl text-base sm:text-lg py-3"
              >
                {ctaText}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 sm:flex-none text-base sm:text-lg py-3"
              >
                Nanti Saja
              </Button>
            </div>

            {/* Don't show again option */}
            <div className="mt-4 text-center">
              <button
                onClick={handleDontShowAgain}
                className="text-sm text-slate-500 hover:text-slate-700 underline transition-colors"
              >
                Jangan tampilkan lagi
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
