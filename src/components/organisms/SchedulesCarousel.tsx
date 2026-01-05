"use client";
import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Shield,
  ExternalLink,
  Calendar,
  MapPin,
  Users,
  Clock,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Badge from "../atoms/Badge";
import Button from "../atoms/Button";
import { Schedule } from "@/types/schedule";
import { scheduleService } from "@/utils/schedule";
import { useNotifications } from "./NotificationContainer";
import { formatCurrency, formatMatchDate } from "@/lib/helper";
import { useSchedule } from "@/contexts/ScheduleContext";

// Skeleton Card Component
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-green-200 h-full animate-pulse">
    <div className="flex flex-col h-full">
      {/* Image Section Skeleton */}
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <div className="absolute top-4 right-4">
          <div className="bg-gray-300 rounded-full px-3 py-1 w-16 h-6"></div>
        </div>
        <div className="absolute bottom-4 left-4">
          <div className="bg-gray-300/80 backdrop-blur-sm border border-gray-300/20 p-3 rounded-2xl">
            <div className="bg-gray-400 h-6 w-20 rounded mb-1"></div>
            <div className="bg-gray-400 h-3 w-16 rounded mb-2"></div>
            <div className="bg-gray-400 h-6 w-20 rounded mb-1"></div>
            <div className="bg-gray-400 h-3 w-12 rounded"></div>
          </div>
        </div>
      </div>

      {/* Content Section Skeleton */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-200 rounded-xl mr-3"></div>
            <div>
              <div className="bg-gray-300 h-5 w-32 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 w-24 rounded"></div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 flex flex-col">
          <div className="space-y-2 mb-4">
            <div className="bg-gray-200 h-4 w-full rounded"></div>
            <div className="bg-gray-200 h-4 w-5/6 rounded"></div>
            <div className="bg-gray-200 h-4 w-4/6 rounded"></div>
          </div>

          {/* Match Details Skeleton */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center">
              <div className="bg-gray-200 h-4 w-4 rounded mr-2"></div>
              <div className="bg-gray-200 h-4 w-40 rounded"></div>
            </div>
            <div className="flex items-center">
              <div className="bg-gray-200 h-4 w-4 rounded mr-2"></div>
              <div className="bg-gray-200 h-4 w-36 rounded"></div>
            </div>
          </div>

          {/* Facilities Skeleton */}
          <div className="flex flex-wrap gap-1 mb-4">
            <div className="bg-gray-200 h-6 w-16 rounded-full"></div>
            <div className="bg-gray-200 h-6 w-20 rounded-full"></div>
            <div className="bg-gray-200 h-6 w-14 rounded-full"></div>
          </div>

          {/* Progress Bar Skeleton */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-300 h-2 rounded-full w-3/5"></div>
            </div>
            <div className="bg-gray-200 h-3 w-16 rounded mt-1"></div>
          </div>

          {/* Footer Skeleton */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 space-x-2">
            <div className="bg-gray-200 h-9 flex-1 rounded"></div>
            <div className="bg-gray-300 h-9 flex-1 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Skeleton Loading State Component
const SkeletonLoading = () => (
  <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-green-100">
    <div className="container mx-auto px-6">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-3 rounded-xl mr-3">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Jadwal Pertandingan
          </h2>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Pilih jadwal fun game terbaik mu pekan ini!
        </p>
      </div>

      {/* Filter Buttons Skeleton */}
      <div className="flex justify-center gap-2 md:gap-3 mb-8 flex-wrap px-4">
        <div className="bg-gray-200 h-9 md:h-10 w-20 md:w-24 rounded-lg animate-pulse"></div>
        <div className="bg-gray-200 h-9 md:h-10 w-20 md:w-24 rounded-lg animate-pulse"></div>
        <div className="bg-gray-200 h-9 md:h-10 w-24 md:w-28 rounded-lg animate-pulse"></div>
        <div className="bg-gray-200 h-9 md:h-10 w-16 md:w-20 rounded-lg animate-pulse"></div>
      </div>

      {/* Skeleton Cards */}
      <div className="relative max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2">
          <SkeletonCard />
          <div className="hidden lg:block">
            <SkeletonCard />
          </div>
        </div>

        {/* Skeleton Dots Indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Skeleton CTA */}
      <div className="flex justify-center mt-12">
        <div className="bg-gray-200 h-12 w-48 rounded-xl animate-pulse"></div>
      </div>
    </div>
  </section>
);

export default function SchedulesCarousel() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("Semua");
  const { showSuccess, showError } = useNotifications();
  const { setSelectedSchedule } = useSchedule();

  // Filter schedules based on selected type
  const filteredSchedules = schedules.filter((schedule) => {
    if (selectedFilter === "Semua") return true;
    return schedule.typeMatch.toLowerCase() === selectedFilter.toLowerCase();
  });

  // Move matchesData inside useEffect or create it as a useMemo
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
    type: schedule.typeEvent,
    typeMatch: schedule.typeMatch,
    facilities: schedule.facilities,
    image: schedule.imageUrl,
    canRegistTeam: schedule.canRegistTeam,
    availableGkSlots: schedule.availableGkSlots,
    availablePlayerSlots: schedule.availablePlayerSlots,
  }));

  // Responsive items per page: 1 for mobile, 2 for desktop
  const [itemsPerPage, setItemsPerPage] = useState(2);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 1024 ? 1 : 2);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalSlides = Math.ceil(matchesData.length / itemsPerPage);

  // Group matches into pairs for carousel slides
  const groupedMatches = [];
  for (let i = 0; i < matchesData.length; i += itemsPerPage) {
    groupedMatches.push(matchesData.slice(i, i + itemsPerPage));
  }

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || totalSlides === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === totalSlides - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalSlides]);

  // Reset to first slide when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsAutoPlaying(true);
  }, [selectedFilter]);

  // Reset to first slide when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsAutoPlaying(true);
  }, [selectedFilter]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(currentIndex === 0 ? totalSlides - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(currentIndex === totalSlides - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

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

  // Show skeleton loading state while fetching data
  if (isLoading) {
    return <SkeletonLoading />;
  }

  const handleDetailClick = (matchId: string) => {
    router.push(`/schedule/${matchId}`);
  };

  const handleBooking = (schedule: any) => {
    setSelectedSchedule(schedule);
    router.push(`/checkout`);
  };

  // Function to check if booking is still allowed (at least 2 hours before match time)
  const isBookingAllowed = (matchDate: string, matchTime: string): boolean => {
    try {
      const now = new Date();
      const matchDateTime = new Date(matchDate);

      // Parse time (format: "HH:MM")
      const [hours, minutes] = matchTime.split(":").map(Number);
      matchDateTime.setHours(hours, minutes, 0, 0);

      // Calculate difference in hours
      const diffInMs = matchDateTime.getTime() - now.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);

      // Allow booking if match is more than 2 hours away
      return diffInHours >= 2;
    } catch (error) {
      console.error("Error checking booking time:", error);
      return true; // Default to allowing booking if there's an error
    }
  };

  // Filter buttons data
  const filterButtons = [
    { label: "Semua", value: "Semua" },
    { label: "Football", value: "Football" },
    { label: "Mini Soccer", value: "Mini Soccer" },
    { label: "Padel", value: "Padel" },
  ];

  // Show message if no schedules available
  if (!isLoading && schedules.length === 0) {
    return (
      <section
        id="schedule-carousel"
        className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-green-100"
      >
        <div className="container mx-auto px-6">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No schedules available
            </h3>
            <p className="text-gray-600">
              Check back later for upcoming matches!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        id="schedule-carousel"
        className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-green-100"
      >
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-500 p-3 rounded-xl mr-3">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                Jadwal Pertandingan
              </h2>
            </div>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Pilih jadwal fun game terbaik mu pekan ini!
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex justify-center gap-2 md:gap-3 mb-8 flex-wrap px-4">
            {filterButtons.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedFilter(filter.value)}
                className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg font-medium text-sm md:text-base transition-all duration-200 ${
                  selectedFilter === filter.value
                    ? "bg-blue-500 text-white shadow-md scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Show message if no matches found for filter */}
          {matchesData.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Tidak ada jadwal {selectedFilter}
              </h3>
              <p className="text-gray-600">
                Coba filter lain atau cek kembali nanti!
              </p>
            </div>
          ) : (
            <>
              {/* Carousel Container */}
              <div className="relative max-w-7xl mx-auto">
                <div className="overflow-hidden rounded-2xl">
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                  >
                    {groupedMatches.map((matchPair, slideIndex) => (
                      <div key={slideIndex} className="w-full flex-shrink-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2">
                          {matchPair.map((match) => (
                            <div
                              key={match.id}
                              className="bg-white rounded-2xl overflow-hidden shadow-lg border border-green-200 h-full"
                            >
                              <div className="flex flex-col h-full">
                                {/* Image Section */}
                                <div className="relative h-48 overflow-hidden">
                                  <img
                                    src={match.image}
                                    alt={`${match.type} match`}
                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                                  <div className="absolute top-4 right-4">
                                    <Badge
                                      variant="default"
                                      className="flex items-center bg-white/90 text-blue-600"
                                    >
                                      <Users className="h-3 w-3 mr-1" />
                                      {match.openSlots}/{match.totalSlots}
                                    </Badge>
                                  </div>
                                  <div className="absolute bottom-4 left-4 text-white bg-white/5 backdrop-blur-sm border border-white/10 p-3 rounded-2xl">
                                    <div className="text-xl md:text-2xl font-bold">
                                      {formatCurrency(match.feePlayer)}
                                    </div>
                                    <div className="text-xs md:text-sm opacity-90">
                                      Player Fee
                                    </div>
                                    <div className="text-xl md:text-2xl font-bold">
                                      {formatCurrency(match.feeGk)}
                                    </div>
                                    <div className="text-xs md:text-sm opacity-90">
                                      GK Fee
                                    </div>
                                  </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-4 md:p-6 flex-1 flex flex-col">
                                  {/* Header */}
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                      <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                                        <Calendar className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                                      </div>
                                      <div>
                                        <h3 className="text-lg md:text-xl font-bold text-gray-900 line-clamp-1">
                                          {match.name}
                                        </h3>
                                        <p className="text-gray-600 text-xs md:text-sm line-clamp-1">
                                          {match.type} • {match.typeMatch}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 flex flex-col">
                                    {/* Match Details */}
                                    <div className="space-y-2 mb-4">
                                      <div className="flex items-center text-xs md:text-sm font-bold text-black">
                                        <Clock className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                                        <span className="truncate">
                                          {formatMatchDate(match.date)} • PKL{" "}
                                          {match.time}
                                        </span>
                                      </div>
                                      <div className="flex items-center text-xs md:text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                                        <span className="truncate">
                                          {match.venue}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Facilities */}
                                    <div className="flex flex-wrap gap-1 mb-4">
                                      {match.facilities
                                        .slice(0, 3)
                                        .map((facility, index) => (
                                          <span
                                            key={index}
                                            className="px-2 py-1 bg-green-50 text-blue-700 rounded-full text-xs border border-green-200"
                                          >
                                            {facility.name}
                                          </span>
                                        ))}
                                      {match.facilities.length > 3 && (
                                        <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs border border-gray-200">
                                          +{match.facilities.length - 3} more
                                        </span>
                                      )}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-gradient-to-r from-sky-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                                          style={{
                                            width: `${
                                              (Number(match.bookedSlots) /
                                                Number(match.totalSlots)) *
                                              100
                                            }%`,
                                          }}
                                        />
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {Math.round(
                                          (Number(match.bookedSlots) /
                                            Number(match.totalSlots)) *
                                            100
                                        )}
                                        % terisi
                                      </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleDetailClick(match.id)
                                        }
                                        className="flex-1 hover:bg-sky-50 hover:border-sky-300 text-xs md:text-sm"
                                      >
                                        <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                        Detail
                                      </Button>
                                      {isBookingAllowed(
                                        match.date,
                                        match.time
                                      ) ? (
                                        <Button
                                          variant="primary"
                                          size="sm"
                                          onClick={() => handleBooking(match)}
                                          disabled={
                                            Number(match.openSlots) === 0
                                          }
                                          className="flex-1 shadow-md hover:shadow-lg text-xs md:text-sm"
                                        >
                                          {Number(match.openSlots) === 0
                                            ? "Penuh"
                                            : "Book Sekarang"}
                                        </Button>
                                      ) : (
                                        <div className="flex-1 px-3 md:px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-xs md:text-sm text-center font-medium">
                                          Booking Ditutup
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* If odd number of matches in last slide on desktop, add placeholder */}
                          {matchPair.length === 1 && itemsPerPage === 2 && (
                            <div className="hidden lg:flex bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-200 items-center justify-center">
                              <div className="text-center text-gray-400">
                                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">
                                  Jadwal lainnya segera hadir
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Arrows */}
                {totalSlides > 1 && (
                  <>
                    <button
                      onClick={goToPrevious}
                      className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 md:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
                    >
                      <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                    </button>

                    <button
                      onClick={goToNext}
                      className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 md:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
                    >
                      <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                    </button>
                  </>
                )}

                {/* Dots Indicator */}
                {totalSlides > 1 && (
                  <div className="flex justify-center mt-6 md:mt-8 space-x-2">
                    {Array.from({ length: totalSlides }, (_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-200 ${
                          index === currentIndex
                            ? "bg-green-500 scale-125"
                            : "bg-green-200 hover:bg-green-300"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Call to Action */}
              <div className="flex justify-center mt-8 md:mt-12 px-4">
                <Button
                  variant="primary"
                  className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-500 hover:to-teal-500 text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-sm md:text-base"
                  onClick={() => router.push("/schedule")}
                >
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Lihat Semua Jadwal
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
