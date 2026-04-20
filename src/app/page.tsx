"use client";
import Navbar from "@/components/organisms/Navbar";
import Hero from "@/components/Hero";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import ScheduleFeaturedGrid from "@/components/organisms/ScheduleFeaturedGrid";
import NewsSection from "@/components/organisms/News";
import PaymentChecker from "@/components/molecules/PaymentChecker";
import PopupBanner from "@/components/molecules/PopupBanner";
import banner from "@/assets/FWC.jpeg";
import EventFeaturedGrid from "@/components/organisms/EventFeaturedGrid";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Popup Banner - akan muncul otomatis saat pertama kali buka */}
      <PopupBanner
        bannerImage={banner}
        title="FWC Tournament! 🏆"
        description="Ikuti Fantasy World Cup terbaru kami. Daftar sekarang dan menangkan hadiah menarik!"
        storageKey="hasSeenTournamentPopup" // Key untuk localStorage
      />

      <Navbar
        useScrollEffect={true}
        currentPage={""}
        navigateTo={function (page: string): void {
          throw new Error("Function not implemented.");
        }}
      />
      <Hero />
      <EventFeaturedGrid />
      <ScheduleFeaturedGrid />

      {/* Payment Checker Section */}
      <section
        id="payment-checker-section"
        className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Check Status Pembayaran Anda
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Masukkan booking ID anda untuk memeriksa status pembayaran saat
              ini.
            </p>
          </div>
          <PaymentChecker />
        </div>
      </section>

      <NewsSection />
      {/* <Testimonials /> */}
      <Footer />
    </div>
  );
}
