"use client";
import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Eye,
  ArrowRight,
  TrendingUp,
  Zap,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Badge from "../atoms/Badge";
import Button from "../atoms/Button";
import { Schedule } from "@/types/schedule";
import { scheduleService } from "@/utils/schedule";
import { useNotifications } from "./NotificationContainer";
import { formatCurrency, formatMatchDate } from "@/lib/helper";
import { useSchedule } from "@/contexts/ScheduleContext";

// Skeleton Component
const SkeletonCard = ({ isFeatured = false }: { isFeatured?: boolean }) => (
  <div
    className={`bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 animate-pulse ${
      isFeatured ? "lg:row-span-2" : ""
    }`}
  >
    <div className="relative h-48 sm:h-56 bg-slate-200"></div>
    <div className="p-4 sm:p-6">
      <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded"></div>
        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
      </div>
    </div>
  </div>
);

const SkeletonLoading = () => (
  <section className="py-12 sm:py-16 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
    <div className="container mx-auto px-4 sm:px-6">
      <div className="text-center mb-8 sm:mb-12">
        <div className="h-10 bg-slate-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
        <div className="h-6 bg-slate-200 rounded w-96 max-w-full mx-auto animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <SkeletonCard isFeatured />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  </section>
);

export default function ScheduleFeaturedGrid() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("Semua");
  const [selectedCommunity, setSelectedCommunity] = useState<string>("all");
  const { showSuccess, showError } = useNotifications();
  const { setSelectedSchedule } = useSchedule();

  // Filter schedules by both community and match type
  const filteredSchedules = schedules.filter((schedule) => {
    const matchesCommunity =
      selectedCommunity === "all" ||
      (schedule.community || "").toLowerCase() ===
        selectedCommunity.toLowerCase();

    const matchesType =
      selectedFilter === "Semua" ||
      (selectedFilter === "MINI-SOCCER"
        ? schedule.typeMatch.toLowerCase().startsWith("mini-soccer")
        : schedule.typeMatch.toLowerCase() === selectedFilter.toLowerCase());

    return matchesCommunity && matchesType;
  });

  // Transform to matches data
  const matchesData = filteredSchedules.map((schedule) => ({
    id: schedule.id.toString(),
    name: schedule.name,
    date: schedule.date,
    time: schedule.time,
    venue: schedule.venue,
    openSlots: schedule.openSlots,
    bookedSlots: schedule.bookedSlots,
    totalSlots: schedule.totalSlots,
    feePlayer: Number(schedule.feePlayer),
    feeGk: Number(schedule.feeGk),
    typeEvent: schedule.typeEvent,
    typeMatch: schedule.typeMatch,
    facilities: schedule.facilities,
    image: schedule.imageUrl,
    canRegistTeam: schedule.canRegistTeam,
    availableGkSlots: schedule.availableGkSlots,
    availablePlayerSlots: schedule.availablePlayerSlots,
    community: schedule.community,
    isOpen: schedule.isOpen,
  }));

  // Get featured matches (3 closest upcoming matches)
  const getFeaturedMatches = () => {
    if (matchesData.length === 0) return [];
    const sorted = [...matchesData].sort((a, b) => {
      const dateA = new Date(a.date + " " + a.time);
      const dateB = new Date(b.date + " " + b.time);
      return dateA.getTime() - dateB.getTime();
    });
    return sorted.slice(0, 3);
  };

  // Get other matches (excluding featured)
  const getOtherMatches = () => {
    const featured = getFeaturedMatches();
    if (featured.length === 0) return matchesData.slice(0, 2);
    const featuredIds = featured.map((m) => m.id);
    return matchesData.filter((m) => !featuredIds.includes(m.id)).slice(0, 2);
  };

  const featuredMatches = getFeaturedMatches();
  const otherMatches = getOtherMatches();

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      const result = await scheduleService.getSchedules();
      if (result) setSchedules(result);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      showError("Failed to load schedules", "Please try refreshing the page");
    } finally {
      setIsLoading(false);
    }
  };

  const isBookingAllowed = (
    matchDate: string,
    matchTime: string,
    isOpen: boolean,
  ): boolean => {
    try {
      if (!isOpen) return false;

      const now = new Date();
      const matchDateTime = new Date(matchDate);
      const [hours, minutes] = matchTime.split(":").map(Number);
      matchDateTime.setHours(hours, minutes, 0, 0);
      const diffInHours =
        (matchDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffInHours >= 2;
    } catch (error) {
      return true;
    }
  };

  const handleDetailClick = (matchId: string) => {
    router.push(`/schedule/${matchId}`);
  };

  const handleBooking = (schedule: any) => {
    setSelectedSchedule(schedule);
    router.push(`/checkout`);
  };

  const communityButtons = [
    {
      label: "Blax",
      value: "blax",
      activeClass:
        "bg-gray-900 text-white shadow-lg shadow-gray-900/30 scale-105",
      inactiveClass:
        "bg-white text-gray-800 border border-gray-300 hover:border-gray-800 hover:bg-gray-50 hover:shadow-md",
      logo: "/blax-logo.png",
    },
    {
      label: "Magnifico",
      value: "magnifico",
      activeClass:
        "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 scale-105",
      inactiveClass:
        "bg-white text-orange-700 border border-orange-300 hover:border-orange-500 hover:bg-orange-50 hover:shadow-md",
      logo: "/magnifico-logo.png",
    },
    {
      label: "Red Alert",
      value: "red-alert",
      activeClass:
        "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 scale-105",
      inactiveClass:
        "bg-white text-orange-700 border border-orange-300 hover:border-orange-500 hover:bg-orange-50 hover:shadow-md",
      logo: "/red-alert.png",
    },
  ];

  const filterButtons = [
    { label: "Semua", value: "Semua", icon: Star },
    { label: "Football", value: "FOOTBALL", icon: Zap },
    { label: "Mini Soccer", value: "MINI-SOCCER", icon: TrendingUp },
    { label: "Padel", value: "PADEL", icon: TrendingUp },
  ];

  // Featured Card Component
  const FeaturedCard = ({ match, index }: { match: any; index: number }) => {
    const isBookable = isBookingAllowed(match.date, match.time, match.isOpen);
    const filledPercentage =
      (Number(match.bookedSlots) / Number(match.totalSlots)) * 100;

    const matchDate = new Date(match.date);
    const dayName = matchDate.toLocaleDateString("id-ID", { weekday: "long" });
    const dayNum = matchDate.getDate();
    const monthName = matchDate.toLocaleDateString("id-ID", { month: "long" });
    const year = matchDate.getFullYear();

    return (
      <div className="group relative bg-white rounded-xl sm:rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-500">
        {/* Featured Badge */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-lg flex items-center gap-1">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-white" />
            Terdekat #{index + 1}
          </div>
        </div>

        {/* Image */}
        <div className="relative h-56 sm:h-64 lg:h-72 overflow-hidden">
          <img
            src={match.image}
            alt={match.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

          {/* Date Badge */}
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-xl border-2 border-white/50 min-w-[80px] sm:min-w-[100px] text-center">
              <div className="text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-wide mb-1">
                {dayName}
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 leading-none mb-1">
                {dayNum}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-600">
                {monthName} {year}
              </div>
            </div>
          </div>

          {/* Overlay Info */}
          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 font-semibold">
                {match.type}
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 font-semibold">
                {match.typeMatch}
              </Badge>
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 drop-shadow-lg line-clamp-2">
              {match.name}
            </h3>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-bold text-sm sm:text-base">
                  {match.time} WIB
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-sm sm:text-base truncate max-w-[200px]">
                  {match.venue}
                </span>
              </div>
            </div>
          </div>

          {/* Slots Badge */}
          <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="font-black text-lg sm:text-xl text-slate-900">
                  {match.openSlots}
                  <span className="text-sm sm:text-base text-slate-500">
                    /{match.totalSlots}
                  </span>
                </span>
              </div>
              <div className="text-xs text-slate-600 font-medium text-center">
                slots
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Price */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 border-2 border-blue-200">
              <div className="text-xs sm:text-sm text-blue-600 font-bold mb-1">
                Player Fee
              </div>
              <div className="text-xl sm:text-2xl font-black text-blue-700">
                {formatCurrency(match.feePlayer)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 sm:p-4 border-2 border-emerald-200">
              <div className="text-xs sm:text-sm text-emerald-600 font-bold mb-1">
                GK Fee
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700">
                {formatCurrency(match.feeGk)}
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5">
            {match.facilities.slice(0, 5).map((facility: any, idx: number) => (
              <span
                key={idx}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs sm:text-sm border border-slate-200 font-medium"
              >
                {facility.name}
              </span>
            ))}
            {match.facilities.length > 5 && (
              <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-50 text-slate-500 rounded-lg text-xs sm:text-sm border border-slate-200 font-medium">
                +{match.facilities.length - 5}
              </span>
            )}
          </div>

          {/* Progress */}
          <div className="mb-5 sm:mb-6">
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-slate-600 font-bold">Booking Progress</span>
              <span className="text-blue-600 font-black">
                {Math.round(filledPercentage)}% Terisi
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 sm:h-3.5">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 sm:h-3.5 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${filledPercentage}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => handleDetailClick(match.id)}
              className="flex-1 border-2 border-slate-300 hover:bg-slate-50 font-semibold"
            >
              <Eye className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Detail</span>
              <span className="sm:hidden">Info</span>
            </Button>
            {!match.isOpen ? (
              <div className="flex-1 px-4 py-2.5 bg-amber-100 text-amber-700 rounded-lg text-sm text-center font-bold">
                Belum Dibuka
              </div>
            ) : isBookable ? (
              <Button
                variant="primary"
                onClick={() => handleBooking(match)}
                disabled={Number(match.openSlots) === 0}
                className="flex-1 shadow-lg hover:shadow-xl font-bold text-base"
              >
                {Number(match.openSlots) === 0 ? "Penuh" : "Book Sekarang"}
              </Button>
            ) : (
              <div className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-500 rounded-lg text-sm text-center font-bold">
                Booking Ditutup
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Regular Card Component
  const RegularCard = ({ match }: { match: any }) => {
    const isBookable = isBookingAllowed(match.date, match.time, match.isOpen);
    const filledPercentage =
      (Number(match.bookedSlots) / Number(match.totalSlots)) * 100;

    return (
      <div className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
        {/* Image */}
        <div className="relative h-40 sm:h-48 overflow-hidden">
          <img
            src={match.image}
            alt={match.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

          {/* Slots Badge */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
            <Badge className="bg-white/95 text-blue-600 font-bold text-xs sm:text-sm">
              <Users className="w-3 h-3 mr-1" />
              {match.openSlots}/{match.totalSlots}
            </Badge>
          </div>

          {/* Date & Time Info */}
          <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3">
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 border border-white/20">
              <div className="flex items-center gap-1.5 sm:gap-2 text-white">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="font-black text-xs sm:text-sm truncate">
                  {formatMatchDate(match.date)}
                </span>
                <span className="text-white/60">•</span>
                <span className="font-bold text-xs sm:text-sm whitespace-nowrap">
                  {match.time}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <div className="mb-3">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 line-clamp-1">
              {match.name}
            </h4>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 mb-2">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold">
                {match.type}
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-medium">{match.typeMatch}</span>
            </div>
          </div>

          <div className="flex items-center text-xs sm:text-sm text-slate-600 mb-3">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-blue-500 flex-shrink-0" />
            <span className="truncate font-medium">{match.venue}</span>
          </div>

          {/* Facilities */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3">
            {match.facilities
              .slice(0, 3)
              .map((facility: any, index: number) => (
                <span
                  key={index}
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-50 text-slate-600 rounded-md text-xs border border-slate-200 font-medium"
                >
                  {facility.name}
                </span>
              ))}
            {match.facilities.length > 3 && (
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-50 text-slate-500 rounded-md text-xs font-medium">
                +{match.facilities.length - 3}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 sm:gap-2 mb-3">
            <span className="text-xs sm:text-sm text-slate-500 font-medium">
              Mulai dari
            </span>
            <span className="text-lg sm:text-xl font-black text-blue-600">
              {formatCurrency(Math.min(match.feePlayer, match.feeGk))}
            </span>
            <span className="text-xs text-slate-500">/orang</span>
          </div>

          {/* Progress */}
          <div className="mb-3">
            <div className="w-full bg-slate-100 rounded-full h-1.5 sm:h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 sm:h-2 rounded-full"
                style={{ width: `${filledPercentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {Math.round(filledPercentage)}% terisi
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDetailClick(match.id)}
              className="flex-1 text-xs sm:text-sm font-semibold"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Detail</span>
            </Button>
            {!match.isOpen ? (
              <div className="flex-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs text-center font-bold">
                Belum Dibuka
              </div>
            ) : isBookable ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleBooking(match)}
                disabled={Number(match.openSlots) === 0}
                className="flex-1 text-xs sm:text-sm font-bold"
              >
                {Number(match.openSlots) === 0 ? "Penuh" : "Book"}
              </Button>
            ) : (
              <div className="flex-1 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs text-center font-bold">
                Ditutup
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return <SkeletonLoading />;

  if (!isLoading && schedules.length === 0) {
    return (
      <section className="py-12 sm:py-16 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center py-12 sm:py-16">
            <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">
              No schedules available
            </h3>
            <p className="text-sm sm:text-base text-slate-600">
              Check back later for upcoming matches!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-3 sm:p-4 rounded-2xl shadow-lg">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
            Jadwal Pertandingan Minggu Ini
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto">
            Temukan dan booking jadwal terbaik untuk pengalaman bermain yang
            luar biasa!
          </p>
        </div>

        {/* Community Filter Buttons */}
        <div className="flex justify-center gap-3 sm:gap-4 mb-5 sm:mb-7">
          {communityButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() =>
                setSelectedCommunity(
                  selectedCommunity === btn.value ? "all" : btn.value,
                )
              }
              className={`relative flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 ${
                selectedCommunity === btn.value
                  ? btn.activeClass
                  : btn.inactiveClass
              }`}
            >
              {btn.logo ? (
                <img
                  src={btn.logo}
                  alt={btn.label}
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <span
                  className={`w-2.5 h-2.5 rounded-full ${(btn as any).dotColor} ${
                    selectedCommunity === btn.value ? "bg-white/80" : ""
                  }`}
                />
              )}
              {btn.label}
              {selectedCommunity === btn.value && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                  <span className="text-xs font-black text-slate-800">✓</span>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Match Type Filter Buttons */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 flex-wrap">
          {filterButtons.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.value}
                onClick={() => setSelectedFilter(filter.value)}
                className={`group flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 ${
                  selectedFilter === filter.value
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-md"
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {matchesData.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">
              Tidak ada jadwal{" "}
              {selectedCommunity !== "all"
                ? `community ${selectedCommunity}`
                : selectedFilter !== "Semua"
                  ? selectedFilter
                  : ""}
            </h3>
            <p className="text-sm sm:text-base text-slate-600">
              Coba filter lain atau cek kembali nanti!
            </p>
          </div>
        ) : (
          <>
            {/* Featured Grid */}
            <div className="max-w-7xl mx-auto">
              {/* 3 Featured Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {featuredMatches.map((match, index) => (
                  <FeaturedCard key={match.id} match={match} index={index} />
                ))}
              </div>

              {/* 2 Regular Cards */}
              {otherMatches.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
                  {otherMatches.map((match) => (
                    <RegularCard key={match.id} match={match} />
                  ))}
                </div>
              )}
            </div>

            {/* View All CTA */}
            <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
              <Button
                onClick={() => router.push("/schedule")}
                className="group bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-bold px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 text-base sm:text-lg"
              >
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mr-2.5" />
                <span>Lihat Semua Jadwal</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2.5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-sm sm:text-base text-slate-600 font-medium">
                Total {schedules.length} jadwal tersedia minggu ini
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
