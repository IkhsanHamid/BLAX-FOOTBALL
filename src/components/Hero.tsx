"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "./molecules/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { HeroActions } from "./molecules/HeroActions";
import Image from "next/image";
import BlaxLogo from "@/assets/blax-logo.png";

export default function Hero() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleAuthSuccess = (userData: any, session: any) => {
    setIsAuthModalOpen(false);
    // Redirect to dashboard after successful signup/login
    router.push("/player-dashboard");
  };

  return (
    <>
      <section className="min-h-screen relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white overflow-hidden">
        {/* Background Pattern */}
        {/* <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%a22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div> */}

        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg"
            alt="Football player"
            className="w-full h-full object-cover opacity-60"
          />
          {/* <div className="absolute inset-0 bg-gradient-to-br from-sky-500/40 to-blue-600/40"></div> */}
        </div>

        <div className="relative container mx-auto px-6 py-20 pt-24 flex items-center min-h-screen">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo/Brand */}
            <div className="flex items-center justify-center mb-8">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl mr-2">
                <Image src={BlaxLogo} alt="Logo" width={150} height={150} />
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Booking Fun Game
              <span className="block bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                Mini Soccer & Football
              </span>
            </h2>

            {/* Subheadline */}
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 inline-block mt-6 p-4">
              Bergabung dengan salah satu komunitas football terbesar di Jakarta
            </p>

            {/* Value Props */}
            {/* <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <Users className="h-8 w-8 text-blue-400 mb-4 mx-auto" />
                <h3 className="text-lg font-semibold mb-2">
                  Community Verified
                </h3>
                <p className="text-slate-300 text-sm">
                  Real humans review and verify every AI summary
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <Zap className="h-8 w-8 text-teal-400 mb-4 mx-auto" />
                <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
                <p className="text-slate-300 text-sm">
                  Advanced AI analyzes complex legal language instantly
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <CheckCircle className="h-8 w-8 text-green-400 mb-4 mx-auto" />
                <h3 className="text-lg font-semibold mb-2">Risk Scores</h3>
                <p className="text-slate-300 text-sm">
                  Clear risk ratings for every privacy policy
                </p>
              </div>
            </div> */}

            {/* CTA Buttons */}
            <HeroActions />

            {/* User Status Indicator (Optional) */}
            {user && (
              <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 inline-block">
                <p className="text-sm text-slate-300">
                  Welcome back,{" "}
                  <span className="font-semibold text-white">
                    {user.name ? user.name : user.phone}
                  </span>
                  ! Ready to play fun game weekday or weekend ?
                </p>
              </div>
            )}

            {/* Trust Indicators */}
            {/* <div className="mt-16 pt-8 border-t border-white/10">
              <p className="text-slate-400 text-sm mb-4">
                Trusted by volunteers and enterprises worldwide
              </p>
              <div className="flex items-center justify-center space-x-8 opacity-60">
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-slate-500">|</div>
                <div className="text-2xl font-bold">95%</div>
                <div className="text-slate-500">|</div>
                <div className="text-2xl font-bold">50M+</div>
              </div>
              <div className="flex items-center justify-center space-x-8 text-xs text-slate-400 mt-2">
                <div>Verified Policies</div>
                <div>Accuracy Rate</div>
                <div>Risk Assessments</div>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}
