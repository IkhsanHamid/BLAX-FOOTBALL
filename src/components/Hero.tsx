"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "./molecules/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { HeroActions } from "./molecules/HeroActions";
import Image from "next/image";

export default function Hero() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleAuthSuccess = (userData: any, session: any) => {
    setIsAuthModalOpen(false);
    router.push("/player-dashboard");
  };

  const merchants = [
    {
      name: "KFC",
      logo: "https://1000logos.net/wp-content/uploads/2017/03/Kfc_logo.png",
    },
    {
      name: "Starbucks",
      logo: "https://upload.wikimedia.org/wikipedia/en/4/45/Starbucks_Corporation_Logo_2011.svg",
    },
    {
      name: "Kopi Kenangan",
      logo: "https://images.squarespace-cdn.com/content/v1/5fa1095912d2fc6dfc63ac9c/dd9b911d-7295-43fc-9452-17a585607187/logo.png",
    },
    {
      name: "Burger King",
      logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Burger_King_2020.svg",
    },
  ];

  return (
    <>
      {/* HERO */}
      <section className="min-h-[70vh] relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg"
            alt="Football player"
            className="w-full h-full object-cover opacity-60"
          />
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 py-20 pt-36 sm:pt-28 md:pt-24 flex items-center min-h-[70vh]">
          <div className="max-w-3xl text-center md:text-left mx-auto md:mx-0">
            {/* HEADING */}
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-5 sm:mb-6 leading-tight">
              Fun game. Good vibes
              <span className="block bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                #kitamainlagi
              </span>
            </h2>

            {/* ACTION BUTTONS */}
            <div className="flex justify-center md:justify-start">
              <HeroActions />
            </div>

            {/* USER GREETING */}
            {user && (
              <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 inline-block max-w-xs sm:max-w-lg">
                <p className="text-xs sm:text-sm text-slate-300 text-center md:text-left">
                  Selamat datang kembali,{" "}
                  <span className="font-semibold text-white">
                    {user.name ? user.name : user.phone}
                  </span>
                  ! Ready bermain bersama?
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MERCHANT PARTNERS */}
      {/* <section className="bg-white py-10">
        <div className="container mx-auto px-4 sm:px-6">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center text-black mb-8 sm:mb-10">
            Merchant Partner Kami
          </h3>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-6 sm:gap-8 items-center justify-center">
            {merchants.map((m, index) => (
              <div
                key={index}
                className="flex justify-center grayscale hover:grayscale-0 transition"
              >
                <img
                  src={m.logo}
                  alt={m.name}
                  className="h-10 sm:h-14 md:h-20 object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}
