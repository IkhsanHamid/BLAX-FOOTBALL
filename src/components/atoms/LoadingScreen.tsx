import React from "react";
import { Loader2 } from "lucide-react";
import BlaxLogo from "@/assets/blax-logo.png";
import Image from "next/image";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({
  message = "Loading...",
  fullScreen = true,
}: LoadingScreenProps) {
  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"
    : "w-full h-64 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 rounded-xl";

  return (
    <div className={`${containerClasses} flex items-center justify-center`}>
      <div className="text-center">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-gradient-to-r from-blue-400 to-teal-400 p-4 rounded-2xl mr-4 relative">
            <Image src={BlaxLogo} alt="Logo" width={150} height={150} />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-teal-400 rounded-2xl animate-pulse opacity-50"></div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            Blax Football
          </h1>
        </div>

        {/* Loading Animation */}
        <div className="mb-6">
          <Loader2 className="h-12 w-12 text-blue-400 mx-auto animate-spin" />
        </div>

        {/* Loading Message */}
        <p className="text-xl text-slate-300 mb-4">{message}</p>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
          <div
            className="w-3 h-3 bg-teal-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
