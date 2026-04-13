"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Gift,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Trophy,
  User,
  Eye,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Camera,
  Crown,
  Copy,
  Check,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { voucherService } from "@/utils/voucher";
import { formatCurrency, formatDate } from "@/lib/helper";
import LoadingScreen from "@/components/atoms/LoadingScreen";
import Navbar from "@/components/organisms/Navbar";
import { bookingService } from "@/utils/booking";
import MembershipBanner from "@/components/molecules/MembershipBanner";
import BookingHistoryBlur from "@/components/molecules/MembershipBlur";
import VouchersBlur from "@/components/molecules/VoucherBlur";
import MembershipModal from "@/components/molecules/MembershipModal";
import { UserVoucher } from "@/types/voucher";
import PointsBadge from "@/components/atoms/PointsBadge";
import VoucherCarousel from "@/components/molecules/VoucherCaraousel";

// Popover Component
const Popover: React.FC<{ children: React.ReactNode; content: string }> = ({
  children,
  content,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-blue-600 hover:text-blue-800 transition-colors"
        type="button"
      >
        {children}
      </button>
      {isOpen && (
        <div className="absolute z-50 w-72 p-3 bg-white border border-gray-200 rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          <div className="text-sm text-gray-700">{content}</div>
          <div className="absolute w-3 h-3 bg-white border-b border-r border-gray-200 transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1.5"></div>
        </div>
      )}
    </div>
  );
};

// VoucherCard Component
const VoucherCard: React.FC<{ voucher: UserVoucher; index: number }> = ({
  voucher,
  index,
}) => {
  const [copied, setCopied] = useState(false);
  const { showSuccess, showError } = useNotifications();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      showSuccess("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      showError("Failed to copy code");
    }
  };

  const truncateDescription = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const isDescriptionLong = voucher.description.length > 60;

  // Format discount display
  const getDiscountDisplay = () => {
    if (voucher.type === "PERCENTAGE") {
      return `${voucher.nominal}%`;
    } else {
      return formatCurrency(voucher.nominal);
    }
  };

  const getDiscountLabel = () => {
    if (voucher.type === "PERCENTAGE") {
      return "Diskon";
    } else {
      return "Potongan";
    }
  };

  return (
    <div
      key={`${voucher.code}-${index}`}
      className="p-4 border border-green-200 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-green-800 text-base">
              {voucher.name}
            </h4>
            <div className="px-2 py-0.5 bg-green-600 text-white rounded-md text-xs font-bold">
              {getDiscountDisplay()}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <p className="text-sm text-green-700">
              {truncateDescription(voucher.description)}
            </p>
            {isDescriptionLong && (
              <Popover content={voucher.description}>
                <Info className="w-4 h-4 flex-shrink-0" />
              </Popover>
            )}
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800 border border-green-200 ml-2">
          Available
        </Badge>
      </div>

      {/* Divider */}
      <div className="border-t border-green-200 my-3"></div>

      {/* Code Section */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-green-600 font-medium mb-1">
            Voucher Code
          </p>
          <p className="font-mono text-sm font-bold text-green-800">
            {voucher.code}
          </p>
        </div>
        <button
          onClick={handleCopyCode}
          className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
            copied
              ? "bg-green-600 text-white"
              : "bg-white text-green-700 border border-green-300 hover:bg-green-100"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Skeleton Components
const StatsCardSkeleton = () => (
  <Card className="bg-white/95 backdrop-blur-sm border border-gray-100 hover:shadow-lg transition-shadow duration-200">
    <CardContent className="p-6">
      <div className="pt-4 flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
        </div>
        <div className="p-3 bg-gray-100 rounded-lg">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const VoucherCardSkeleton = () => (
  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
    <div className="flex items-center justify-between mb-2">
      <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
      <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-full"></div>
    <div className="flex items-center justify-between">
      <div>
        <div className="h-6 bg-gray-200 rounded animate-pulse w-16 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
      </div>
      <div className="text-right">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-8 mb-1"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
      </div>
    </div>
    <div className="h-3 bg-gray-200 rounded animate-pulse mt-2 w-24"></div>
  </div>
);

const BookingHistoryCardSkeleton = () => (
  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
    <div className="flex items-center justify-between mb-3">
      <div>
        <div className="h-5 bg-gray-200 rounded animate-pulse w-40 mb-1"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-28"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
    </div>

    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
      <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
      <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
    </div>
  </div>
);

const DashboardContentSkeleton = () => (
  <div className="pt-24 pb-8 px-4">
    <div className="max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse"></div>
            <div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded animate-pulse w-48 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-9 bg-gray-200 rounded animate-pulse w-24"></div>
            <div className="h-9 bg-gray-200 rounded animate-pulse w-32"></div>
          </div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vouchers Skeleton */}
        <div className="lg:col-span-1">
          <Card className="bg-white/95 backdrop-blur-sm border border-gray-100">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-40"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <VoucherCardSkeleton key={i} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking History Skeleton */}
        <div className="lg:col-span-2">
          <Card className="bg-white/95 backdrop-blur-sm border border-gray-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-40"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {[1, 2, 3].map((i) => (
                  <BookingHistoryCardSkeleton key={i} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 mt-8">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Interface for booking history based on API response
interface BookingHistory {
  scheduleName: string;
  bookingId: string;
  venue: string;
  date: string;
  time: string;
  amount: number;
  statusPayment: string;
  bookedAt: string;
}

import { RedeemableVoucher } from "@/types/voucher";
import { AuthService } from "@/utils/auth";

export default function PlayerDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([]);
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [redeemableVouchers, setRedeemableVouchers] = useState<
    RedeemableVoucher[]
  >([]);
  console.log("user", user);

  const hasInitialized = useRef(false);

  useEffect(() => {
    // Skip jika sudah initialized
    if (hasInitialized.current) return;

    const checkAccess = async () => {
      if (!user) {
        router.push("/");
        return;
      }

      // Check if user has player role
      if (
        user.role !== "Player" &&
        user.role !== "Admin" &&
        user.role !== "Owner" &&
        user.role !== "Admin-magnifico"
      ) {
        showError("Access Denied", "This dashboard is only for players");
        router.push("/");
        return;
      }

      // Fetch data TANPA update user
      await fetchDashboardData(false);
      setLoading(false);
      hasInitialized.current = true;
    };

    if (!authLoading && user) {
      checkAccess();
      setUserPoints(user?.points);
    }
  }, [authLoading, user?.code]);

  const fetchDashboardData = async (shouldUpdateUser = false) => {
    try {
      setDataLoading(true);

      // Fetch user vouchers using the correct service method
      const vouchersResult = await voucherService.voucherUser();
      setUserVouchers(vouchersResult);

      const availeVouchers = await voucherService.voucherAvailable();
      setRedeemableVouchers(availeVouchers);

      // Fetch booking history from API
      const bookingsResult = await bookingService.bookingHistoryUser();
      setBookingHistory(bookingsResult);

      if (shouldUpdateUser) {
        const session = await AuthService.getSession();
        const dataUser = await AuthService.getCurrentUser(session.access_token);
        setUser(dataUser);
        setUserPoints(dataUser.points);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showError("Error", "Failed to load dashboard data");
    } finally {
      setDataLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData(true);
    setRefreshing(false);
    showSuccess("Dashboard refreshed successfully");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
      case "SUCCESS":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "FAILED":
      case "CANCELLED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
      case "SUCCESS":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "FAILED":
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Stats calculation - updated to work with simplified UserVoucher interface
  const stats = {
    totalBookings: bookingHistory.length,
    availableVouchers: userVouchers.length, // All vouchers from voucherUser are considered available
    successfulPayments: bookingHistory.filter(
      (b) => b.statusPayment === "PAID" || b.statusPayment === "SUCCESS",
    ).length,
    totalSpent: bookingHistory
      .filter(
        (b) => b.statusPayment === "PAID" || b.statusPayment === "SUCCESS",
      )
      .reduce((sum, b) => sum + b.amount, 0),
  };

  if (authLoading || loading) {
    return <LoadingScreen message="Loading player dashboard..." />;
  }

  if (!user) {
    return <LoadingScreen message="Redirecting..." />;
  }

  const visibleBookings = user.isMember
    ? bookingHistory
    : bookingHistory.slice(0, 1);
  const hiddenBookingsCount = user.isMember ? 0 : bookingHistory.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Navbar
        currentPage={""}
        navigateTo={function (page: string): void {
          throw new Error("Function not implemented.");
        }}
      />

      {/* Show skeleton when refreshing or data loading */}
      {refreshing || dataLoading ? (
        <DashboardContentSkeleton />
      ) : (
        <div className="pt-24 pb-8 px-4">
          <div className="max-w-7xl mx-auto mt-10">
            {!user.isMember && (
              <MembershipBanner
                onUpgradeClick={() => setMembershipModalOpen(true)}
                className="mb-8"
              />
            )}
            {/* Header */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-gray-200 mb-8">
              <div className="flex flex-col gap-6">
                {/* TOP SECTION */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* USER INFO */}
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Text */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-gray-600 text-sm">
                          Player Dashboard
                        </p>

                        {user.isMember && (
                          <div className="flex items-center bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                            <Crown className="w-3.5 h-3.5 mr-1 fill-purple-700 text-purple-700" />
                            Membership
                          </div>
                        )}
                      </div>

                      <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                        Welcome back, {user.name}!
                      </h1>

                      <Badge className="bg-blue-100 text-blue-800 mt-1 text-xs sm:text-sm">
                        {user.role}
                      </Badge>
                    </div>
                  </div>

                  {/* POINTS (mobile pindah ke bawah tombol) */}
                  <div className="flex sm:hidden justify-between items-center">
                    <p className="text-xs text-muted-foreground">Total Poin</p>
                    <PointsBadge points={userPoints} size="md" />
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* BUTTONS */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex items-center justify-center w-full sm:w-auto"
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${
                          refreshing ? "animate-spin" : ""
                        }`}
                      />
                      {refreshing ? "Refreshing..." : "Refresh"}
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => router.push("/schedule")}
                      className="flex items-center justify-center w-full sm:w-auto"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      New Booking
                    </Button>
                  </div>

                  {/* POINTS (desktop & tablet) */}
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Total Poin
                      </p>
                    </div>
                    <PointsBadge points={userPoints} size="lg" />
                  </div>
                </div>
              </div>
            </div>

            {user.isMember && (
              <Card className="mb-8 border-primary/10 shadow-lg">
                <CardContent className="p-6 pt-5">
                  <VoucherCarousel
                    vouchers={redeemableVouchers}
                    userPoints={userPoints!}
                    onPointsUpdate={setUserPoints}
                    onRefresh={handleRefresh}
                  />
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Available Vouchers */}
              <div className="lg:col-span-1">
                <Card className="bg-white/95 backdrop-blur-sm border border-green-100">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-800">
                      <Gift className="w-5 h-5 mr-2" />
                      Voucher Tersedia
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!user.isMember ? (
                      <VouchersBlur
                        onUpgradeClick={() => setMembershipModalOpen(true)}
                      />
                    ) : userVouchers.length === 0 ? (
                      <div className="text-center py-8">
                        <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                          Tidak ada voucher tersedia
                        </p>
                        <p className="text-sm text-gray-400">
                          Silahkan cek kembali secara berkala
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userVouchers.slice(0, 3).map((voucher, index) => (
                          <VoucherCard
                            key={`${voucher.code}-${index}`}
                            voucher={voucher}
                            index={index}
                          />
                        ))}
                        {userVouchers.length > 3 && (
                          <div className="text-center pt-2">
                            <p className="text-sm text-green-600">
                              +{userVouchers.length - 3} more vouchers available
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Booking History */}
              <div className="lg:col-span-2">
                <Card className="bg-white/95 backdrop-blur-sm border border-purple-100">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-purple-800">
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Booking History
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bookingHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No booking history</p>
                        <p className="text-sm text-gray-400">
                          Start booking games to see your history!
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {visibleBookings.map((booking, index) => (
                            <div
                              key={`${booking.bookingId}-${index}`}
                              className="p-4 border border-purple-200 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-purple-800">
                                    {booking.scheduleName}
                                  </h4>
                                  <p className="text-sm text-purple-600">
                                    ID: {booking.bookingId}
                                  </p>
                                </div>
                                <Badge
                                  className={`flex items-center space-x-1 ${getStatusColor(
                                    booking.statusPayment,
                                  )}`}
                                >
                                  {getStatusIcon(booking.statusPayment)}
                                  <span>{booking.statusPayment}</span>
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-700 mb-3">
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {booking.venue}
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {formatDate(booking.date)} • {booking.time}
                                </div>
                                <div className="flex items-center">
                                  <CreditCard className="w-4 h-4 mr-1" />
                                  {formatCurrency(booking.amount)}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-purple-200">
                                <div className="text-xs text-purple-600">
                                  Booked:{" "}
                                  {new Date(
                                    booking.bookedAt,
                                  ).toLocaleDateString("id-ID", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Blurred section for non-members */}
                        {!user.isMember && hiddenBookingsCount > 0 && (
                          <BookingHistoryBlur
                            onUpgradeClick={() => setMembershipModalOpen(true)}
                            blurredCount={hiddenBookingsCount}
                          />
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 mt-8">
              <CardHeader>
                <CardTitle className="text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="primary"
                    onClick={() => router.push("/schedule")}
                    className="flex items-center justify-center py-4"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Book New Game
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/gallery")}
                    className="flex items-center justify-center py-4"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    View Gallery
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/news")}
                    className="flex items-center justify-center py-4"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    Latest News
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Membership Modal */}
      <MembershipModal
        open={membershipModalOpen}
        onOpenChange={setMembershipModalOpen}
        code={user.code}
      />
    </div>
  );
}
