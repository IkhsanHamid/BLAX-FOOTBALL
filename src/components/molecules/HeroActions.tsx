import React from "react";
import { Calendar, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { NavigationButton } from "../atoms/NavigationButton";

export const HeroActions: React.FC = () => {
  const router = useRouter();

  const handleScheduleClick = () => {
    const paymentSection = document.getElementById("schedule-carousel");
    if (paymentSection) {
      paymentSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePaymentCheckClick = () => {
    // Scroll ke section PaymentChecker
    const paymentSection = document.getElementById("payment-checker-section");
    if (paymentSection) {
      paymentSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <NavigationButton
        icon={Calendar}
        label="Lihat Jadwal Terbaru"
        onClick={handleScheduleClick}
        className="shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
      />
      <NavigationButton
        icon={CreditCard}
        label="Check Payment"
        onClick={handlePaymentCheckClick}
        variant="outline"
        className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
      />
    </div>
  );
};
