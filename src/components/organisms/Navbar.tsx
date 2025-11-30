"use client";
import React, { useState, useEffect } from "react";
import {
  Shield,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Calendar,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../atoms/Button";
import AuthModal from "../molecules/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "./NotificationContainer";
import BlaxLogo from "@/assets/blax.png";
import Image from "next/image";
import { motion } from "motion/react";

interface NavbarProps {
  useScrollEffect?: boolean;
  currentPage: string;
  navigateTo: (page: string) => void;
  userData?: any;
}

export default function Navbar({ useScrollEffect = false }: NavbarProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const [isSignIn, setIsSignIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  console.log("isSignIn", isSignIn);

  const { user, loading, signOut, setUser } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAuthSuccess = (userData: any, session: any) => {
    // Immediately update the user state in context
    setUser(userData);
    setIsAuthModalOpen(false);

    // Redirect to dashboard after successful login
    router.push("/player-dashboard");
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setIsUserMenuOpen(false);

    try {
      await signOut();
      router.push("/");
      // Show success message
      showSuccess("Success Logout!");
    } catch (error) {
      console.error("Sign out error:", error);
      // You could show an error toast here
      showError("Error!");
    } finally {
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    if (useScrollEffect) {
      const handleScroll = () => {
        const scrollTop = window.scrollY;
        setIsScrolled(scrollTop > 50);
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [useScrollEffect]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsUserMenuOpen(false);
    };

    if (isUserMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isUserMenuOpen]);

  // Dynamic styles based on useScrollEffect and isScrolled
  const getNavbarStyles = () => {
    return "bg-white/95 backdrop-blur-md shadow-lg border border-gray-200/20";
  };

  const getTextStyles = () => {
    return "text-gray-700 hover:text-blue-600";
  };

  const getLogoStyles = () => {
    if (!useScrollEffect) {
      return "bg-clip-text text-transparent";
    }
    return isScrolled ? "text-blue-600 bg-clip-text" : "text-white";
  };

  const getButtonStyles = () => {
    return "hover:bg-gray-100 text-gray-700";
  };

  const getGradientStyles = () => {
    return "bg-gradient-to-r from-blue-500 to-teal-500";
  };

  const getMobileTextStyles = () => {
    return "text-gray-700 hover:text-blue-600 hover:bg-gray-50";
  };

  const getMobileBorderStyles = () => {
    return "border-gray-200/50";
  };

  const getMobileUserTextStyles = () => {
    return "text-gray-700";
  };

  const getMobileUserSecondaryTextStyles = () => {
    return "text-gray-500";
  };

  const getSignOutStyles = () => {
    return "text-red-600 hover:bg-red-50";
  };

  return (
    <>
      {/* Running Text Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-500 border-b border-blue-400 overflow-hidden">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="whitespace-nowrap py-2 text-white flex items-center gap-8"
        >
          {/* Repeat the content multiple times for seamless loop */}
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                <span>Membership program hanya Rp 100.000 per tahun</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-300">•</span>
                <span>Dapatkan 15% diskon untuk semua produk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-300">•</span>
                <span>10% diskon semua pertandingan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-300">•</span>
                <span>Exclusive Member Benefits</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
      <nav
        className={`fixed top-10 left-0 px-4 right-0 z-50 transition-all duration-300 ${getNavbarStyles()}`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => router.push("/")}
                className="p-2 rounded-xl"
              >
                <Image
                  src={BlaxLogo}
                  alt="Logo"
                  width={150}
                  height={150}
                  className="mix-blend-mode"
                />
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/schedule"
                className={`font-medium transition-all duration-300 relative group ${getTextStyles()}`}
              >
                Jadwal
                <span
                  className={`absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300 ${getGradientStyles()}`}
                ></span>
              </Link>
              <Link
                href="/news"
                className={`font-medium transition-all duration-300 relative group ${getTextStyles()}`}
              >
                Berita
                <span
                  className={`absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300 ${getGradientStyles()}`}
                ></span>
              </Link>
              <Link
                href="/gallery"
                className={`font-medium transition-all duration-300 relative group ${getTextStyles()}`}
              >
                Galeri
                <span
                  className={`absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300 ${getGradientStyles()}`}
                ></span>
              </Link>
              {user && (
                <Link
                  href="/player-dashboard"
                  className={`font-medium transition-all duration-300 relative group ${getTextStyles()}`}
                >
                  Dashboard
                  <span
                    className={`absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300 ${getGradientStyles()}`}
                  ></span>
                </Link>
              )}
              {user && (
                <>
                  {user.role === "Admin" && (
                    <Link
                      href="/admin"
                      className={`font-medium transition-all duration-300 relative group ${getTextStyles()}`}
                    >
                      Admin
                      <span
                        className={`absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300 ${getGradientStyles()}`}
                      ></span>
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>
                  <div className="w-20 h-4 animate-pulse bg-gray-200 rounded"></div>
                </div>
              ) : user ? (
                /* User Buttons */
                <div className="flex items-center space-x-3">
                  {/* Profile Button */}
                  <div className="relative">
                    <Button
                      variant="primary"
                      onClick={(e: any) => {
                        e.stopPropagation();
                        setIsUserMenuOpen(!isUserMenuOpen);
                      }}
                      size="sm"
                      disabled={isSigningOut}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${getButtonStyles()} ${
                        isSigningOut ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Profile
                    </Button>

                    {/* Profile Dropdown */}
                    {isUserMenuOpen && !isSigningOut && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.phone}
                          </p>
                        </div>
                        <Link
                          href="/player-dashboard"
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors">
                          <Settings className="h-4 w-4 mr-2" />
                          Account Settings
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className={`w-full text-left font-medium py-2 px-4 rounded-lg transition-all duration-300 ${getTextStyles()}`}
                  >
                    {isSigningOut ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <span className="font-normal">Signing Out...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        <span className="font-normal">Sign Out</span>
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                /* Auth Buttons */
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsAuthModalOpen(true);
                      setIsSignIn(true);
                      setIsSignUp(false);
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAuthModalOpen(true);
                      setIsSignUp(true);
                      setIsSignIn(false);
                    }}
                  >
                    Daftar
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className={`md:hidden p-2 rounded-lg transition-all duration-300 ${getButtonStyles()}`}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <div
            className={`md:hidden transition-all duration-300 ease-in-out ${
              isMenuOpen
                ? "max-h-96 opacity-100 pb-6"
                : "max-h-0 opacity-0 overflow-hidden"
            }`}
          >
            <div className="pt-4 space-y-4">
              <Link
                href="/schedule"
                className={`block font-medium py-2 px-4 rounded-lg transition-all duration-300 ${getMobileTextStyles()}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Jadwal
              </Link>
              <Link
                href="/news"
                className={`block font-medium py-2 px-4 rounded-lg transition-all duration-300 ${getMobileTextStyles()}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Berita
              </Link>
              <Link
                href="/gallery"
                className={`block font-medium py-2 px-4 rounded-lg transition-all duration-300 ${getMobileTextStyles()}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Galeri
                <span
                  className={`absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300 ${getGradientStyles()}`}
                ></span>
              </Link>
              {user && (
                <Link
                  href="/admin"
                  className={`block font-medium py-2 px-4 rounded-lg transition-all duration-300 ${getMobileTextStyles()}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </Link>
              )}

              {/* Mobile Auth Section */}
              <div
                className={`pt-4 space-y-3 border-t ${getMobileBorderStyles()}`}
              >
                {loading ? (
                  <div className="w-full h-10 animate-pulse bg-gray-200 rounded-lg"></div>
                ) : user ? (
                  <>
                    {/* User Info */}
                    <div className="px-4 py-2">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p
                            className={`text-sm font-medium truncate ${getMobileUserTextStyles()}`}
                          >
                            {user.name}
                          </p>
                          <p
                            className={`text-xs truncate ${getMobileUserSecondaryTextStyles()}`}
                          >
                            {user.phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Profile Button */}
                    <Link
                      href="/player-dashboard"
                      className={`w-full text-left font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center ${getMobileTextStyles()}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>

                    {/* Admin Button */}
                    <Link
                      href="/admin"
                      className={`w-full text-left font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center ${getMobileTextStyles()}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Link>

                    {/* Settings Button */}
                    <button
                      className={`w-full text-left font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center ${getMobileTextStyles()}`}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </button>

                    {/* Sign Out Button */}
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className={`w-full text-left font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center border-t ${getMobileBorderStyles()} pt-4 mt-2 ${getSignOutStyles()} ${
                        isSigningOut ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isSigningOut ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Signing Out...
                        </>
                      ) : (
                        <>
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setIsSignIn(true);
                        setIsSignUp(false);
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setIsSignUp(true);
                        setIsSignIn(false);
                      }}
                    >
                      Daftar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        mode={isSignIn ? "signin" : isSignUp ? "signup" : "signin"}
      />
    </>
  );
}
