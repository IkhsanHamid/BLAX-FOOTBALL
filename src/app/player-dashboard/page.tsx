"use client";

import React, { useEffect, useState } from "react";
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

// Updated UserVoucher interface to match the API response
export interface UserVoucher {
  name: string;
  code: string;
  description: string;
}

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

export default function PlayerDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([]);
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [user]);

  const checkAccess = async () => {
    if (!user) {
      router.push("/");
      return;
    }

    // Check if user has player role
    if (user.role !== "Player" && user.role !== "Admin") {
      showError("Access Denied", "This dashboard is only for players");
      router.push("/");
      return;
    }

    await fetchDashboardData();
    setLoading(false);
  };

  const fetchDashboardData = async () => {
    try {
      setDataLoading(true);

      // Fetch user vouchers using the correct service method
      const vouchersResult = await voucherService.voucherUser();
      setUserVouchers(vouchersResult);

      // Fetch booking history from API
      const bookingsResult = await bookingService.bookingHistoryUser();
      setBookingHistory(bookingsResult);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showError("Error", "Failed to load dashboard data");
    } finally {
      setDataLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    showSuccess("Dashboard refreshed successfully");
  };

  const handleViewPaymentDetails = (bookingId: string) => {
    router.push(`/payment/${bookingId}`);
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
      (b) => b.statusPayment === "PAID" || b.statusPayment === "SUCCESS"
    ).length,
    totalSpent: bookingHistory
      .filter(
        (b) => b.statusPayment === "PAID" || b.statusPayment === "SUCCESS"
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

  const handleUpgradeMembership = () => {
    // Handle membership upgrade logic here
    console.log("Upgrading membership...");
  };

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
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-600">Player Dashboard</p>

                      {user.isMember && (
                        <div className="flex items-center bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                          <Crown className="w-4 h-4 mr-1 fill-purple-700 text-purple-700" />
                          Membership
                        </div>
                      )}
                    </div>
                    <h1 className="text-xl md:text-3xl font-bold text-gray-900">
                      Welcome back, {user.name}!
                    </h1>
                    <Badge className="bg-blue-100 text-blue-800 mt-1">
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center"
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
                    className="flex items-center"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    New Booking
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/95 backdrop-blur-sm border border-blue-100 hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Bookings
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.totalBookings}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border border-green-100 hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Available Vouchers
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.availableVouchers}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Gift className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border border-purple-100 hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Successful Payments
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.successfulPayments}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Trophy className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Spent
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.totalSpent)}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <CreditCard className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div> */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Available Vouchers */}
              <div className="lg:col-span-1">
                <Card className="bg-white/95 backdrop-blur-sm border border-green-100">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-800">
                      <Gift className="w-5 h-5 mr-2" />
                      Available Vouchers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!user.isMember ? (
                      <VouchersBlur
                        onUpgradeClick={() => setMembershipModalOpen(true)}
                      />
                    ) : userVouchers.length === 0 ? (
                      <div className="text-center py-8">
                        <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No vouchers available
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Check back later for new offers!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userVouchers.slice(0, 3).map((voucher, index) => (
                          <div
                            key={`${voucher.code}-${index}`}
                            className="p-4 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-green-800">
                                {voucher.name}
                              </h4>
                              <Badge className="bg-green-100 text-green-800">
                                Available
                              </Badge>
                            </div>
                            <p className="text-sm text-green-700 mb-2">
                              {voucher.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="text-right">
                                <p className="text-xs text-green-600">Code</p>
                                <p className="font-mono text-sm font-bold text-green-800">
                                  {voucher.code}
                                </p>
                              </div>
                            </div>
                          </div>
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-300 text-purple-700 hover:bg-purple-100"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
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
                                    booking.statusPayment
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
                                    booking.bookedAt
                                  ).toLocaleDateString("id-ID", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleViewPaymentDetails(booking.bookingId)
                                  }
                                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Details
                                </Button>
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
        onUpgrade={handleUpgradeMembership}
      />
    </div>
  );
}
