"use client";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import SearchBar from "@/components/atoms/SearchBar";
import Navbar from "@/components/organisms/Navbar";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { formatCurrency, formatMatchDate } from "@/lib/helper";
import { Schedule } from "@/types/schedule";
import { formatDate } from "@/utils/helpers";
import { scheduleService } from "@/utils/schedule";
import {
  Calendar,
  Clock,
  Eye,
  MapPin,
  Users,
  X,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  Filter,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useSchedule } from "@/contexts/ScheduleContext";
import { useAuth } from "@/contexts/AuthContext";

type ViewMode = "calendar" | "list";
type GroupBy = "date" | "venue";

export default function SchedulePage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showSuccess, showError } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVenue, setSelectedVenue] = useState("All Venues");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedEvent, setSelectedEvent] = useState("All Events");
  const [sortBy, setSortBy] = useState("date");
  const { setSelectedSchedule } = useSchedule();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [groupBy, setGroupBy] = useState<GroupBy>("date");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Set default selected date to today
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const matchesData = useMemo(
    () =>
      schedules.map((schedule) => ({
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
      })),
    [schedules],
  );

  // Get unique venues, types, and events for filter options
  const venues = useMemo(
    () => ["All Venues", ...new Set(schedules.map((s) => s.venue))],
    [schedules],
  );
  const types = useMemo(
    () => ["All Types", ...new Set(schedules.map((s) => s.typeMatch))],
    [schedules],
  );
  const events = useMemo(
    () => ["All Events", ...new Set(schedules.map((s) => s.typeEvent))],
    [schedules],
  );

  const isBookingAllowed = (
    matchDate: string,
    matchTime: string,
    email: string | undefined,
  ): boolean => {
    try {
      const isSpecialEmail =
        email === "ardiantosandi@gmail.com" ||
        email === "ikhsanhamid352@gmail.com";

      if (isSpecialEmail) {
        return true;
      }

      const now = new Date();
      const matchDateTime = new Date(matchDate);
      const [hours, minutes] = matchTime.split(":").map(Number);
      matchDateTime.setHours(hours, minutes, 0, 0);

      const diffInMs = matchDateTime.getTime() - now.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);

      return diffInHours >= 2;
    } catch (error) {
      console.error("Error checking booking time:", error);
      return true;
    }
  };

  // Filter matches
  const filteredMatches = useMemo(() => {
    let filtered = matchesData.filter((match) => {
      const matchesSearch =
        !searchQuery ||
        match.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.typeEvent.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesVenue =
        selectedVenue === "All Venues" || match.venue === selectedVenue;
      const matchesType =
        selectedType === "All Types" || match.typeMatch === selectedType;
      const matchesEvent =
        selectedEvent === "All Events" || match.typeEvent === selectedEvent;

      const matchesDate = !selectedDate || match.date === selectedDate;

      return (
        matchesSearch &&
        matchesVenue &&
        matchesType &&
        matchesEvent &&
        matchesDate
      );
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.date + " " + a.time).getTime();
      const dateB = new Date(b.date + " " + b.time).getTime();
      return dateA - dateB;
    });

    return filtered;
  }, [
    matchesData,
    searchQuery,
    selectedVenue,
    selectedType,
    selectedEvent,
    selectedDate,
  ]);

  // Group matches by date or venue
  const groupedMatches = useMemo(() => {
    const groups: { [key: string]: typeof filteredMatches } = {};

    filteredMatches.forEach((match) => {
      const key = groupBy === "date" ? match.date : match.venue;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(match);
    });

    return groups;
  }, [filteredMatches, groupBy]);

  // Get unique dates for calendar selector
  const availableDates = useMemo(() => {
    const dates = [...new Set(matchesData.map((m) => m.date))].sort();
    return dates;
  }, [matchesData]);

  useEffect(() => {
    fetchSchedule();
  }, []);

  // Auto-select today's date after schedules are loaded
  useEffect(() => {
    if (schedules.length > 0 && !selectedDate) {
      const today = getTodayDate();
      const availableDates = schedules.map((s) => s.date);

      // Check if today exists in available dates
      if (availableDates.includes(today)) {
        setSelectedDate(today);
      } else {
        // If today doesn't exist, select the closest future date
        const futureDates = availableDates
          .filter((date) => new Date(date) >= new Date(today))
          .sort();

        if (futureDates.length > 0) {
          setSelectedDate(futureDates[0]);
        } else {
          // If no future dates, select the latest date
          const sortedDates = [...availableDates].sort();
          if (sortedDates.length > 0) {
            setSelectedDate(sortedDates[sortedDates.length - 1]);
          }
        }
      }
    }
  }, [schedules]);

  // Auto-select closest date when filters change (type, event, venue)
  useEffect(() => {
    if (schedules.length === 0) return;

    const today = getTodayDate();

    // Get dates from filtered matches (before date filter is applied)
    const filteredDates = schedules
      .filter((schedule) => {
        const matchesVenue =
          selectedVenue === "All Venues" || schedule.venue === selectedVenue;
        const matchesType =
          selectedType === "All Types" || schedule.typeMatch === selectedType;
        const matchesEvent =
          selectedEvent === "All Events" ||
          schedule.typeEvent === selectedEvent;

        return matchesVenue && matchesType && matchesEvent;
      })
      .map((s) => s.date);

    if (filteredDates.length === 0) {
      // No matches found, clear date selection
      setSelectedDate(null);
      return;
    }

    const uniqueDates = [...new Set(filteredDates)].sort();

    // Check if current selected date is still valid
    if (selectedDate && uniqueDates.includes(selectedDate)) {
      return; // Keep current selection if it's still valid
    }

    // Find the closest date to today from filtered results
    const todayDate = new Date(today);

    // Get future dates (including today)
    const futureDates = uniqueDates.filter(
      (date) => new Date(date) >= todayDate,
    );

    if (futureDates.length > 0) {
      // Select the closest future date
      setSelectedDate(futureDates[0]);
    } else {
      // If no future dates, select the most recent past date
      setSelectedDate(uniqueDates[uniqueDates.length - 1]);
    }
  }, [selectedVenue, selectedType, selectedEvent, schedules]);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      const result = await scheduleService.getSchedules(user?.email);
      if (result) setSchedules(result);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      showError("Failed to load schedules", "Please try refreshing the page");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearFilter = (filterType: string) => {
    switch (filterType) {
      case "search":
        setSearchQuery("");
        break;
      case "venue":
        setSelectedVenue("All Venues");
        break;
      case "type":
        setSelectedType("All Types");
        break;
      case "event":
        setSelectedEvent("All Events");
        break;
      case "date":
        setSelectedDate(null);
        break;
    }
  };

  const handleDetailClick = (matchId: string) => {
    router.push(`/schedule/${matchId}`);
  };

  const handleBooking = (schedule: any) => {
    setSelectedSchedule(schedule);
    router.push(`/checkout`);
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Oct",
      "Nov",
      "Des",
    ];

    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear(),
    };
  };

  // Helper functions for DateSelector
  const calculateInitialIndex = (
    targetDate: string,
    dates: string[],
    count: number,
  ) => {
    const targetIndex = dates.findIndex((date) => date === targetDate);
    if (targetIndex === -1) return 0;

    return Math.max(
      0,
      Math.min(targetIndex - Math.floor(count / 2), dates.length - count),
    );
  };

  const getDateStyles = (isSelected: boolean, isToday: boolean) => {
    if (isSelected) {
      return "border-blue-500 bg-blue-50 shadow-md scale-105";
    }
    if (isToday) {
      return "border-blue-300 bg-blue-50/50 hover:border-blue-400";
    }
    return "border-slate-200 hover:border-blue-300 hover:bg-slate-50";
  };

  const getTextColor = (
    isSelected: boolean,
    isToday: boolean,
    defaultColor: string,
  ) => {
    if (isSelected) return "text-blue-600";
    if (isToday) return "text-blue-500";
    return defaultColor;
  };

  const DateSelector = () => {
    const visibleCount = 7;
    const mobileVisibleCount = 3; // Show fewer dates on mobile
    const [isMobile, setIsMobile] = useState(false);
    const todayDate = getTodayDate();
    const currentVisibleCount = isMobile ? mobileVisibleCount : visibleCount;

    // Detect mobile screen
    useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 640);
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const getInitialIndex = () => {
      const targetDate = selectedDate || todayDate;
      return calculateInitialIndex(
        targetDate,
        availableDates,
        currentVisibleCount,
      );
    };

    const [startIndex, setStartIndex] = useState(getInitialIndex());

    // Auto-scroll to selected date when it changes
    useEffect(() => {
      if (selectedDate) {
        const selectedIndex = availableDates.findIndex(
          (date) => date === selectedDate,
        );
        if (selectedIndex !== -1) {
          const newStartIndex = calculateInitialIndex(
            selectedDate,
            availableDates,
            currentVisibleCount,
          );
          setStartIndex(newStartIndex);
        }
      }
    }, [selectedDate, availableDates, currentVisibleCount]);

    const visibleDates = availableDates.slice(
      startIndex,
      startIndex + currentVisibleCount,
    );

    const handlePrev = () => {
      if (startIndex > 0) {
        setStartIndex(startIndex - 1);
      }
    };

    const handleNext = () => {
      if (startIndex + currentVisibleCount < availableDates.length) {
        setStartIndex(startIndex + 1);
      }
    };

    const getMatchCountForDate = (date: string) => {
      return matchesData.filter((m) => m.date === date).length;
    };

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Pilih Tanggal</span>
            <span className="sm:hidden">Tanggal</span>
          </h3>
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={handlePrev}
              disabled={startIndex === 0}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous dates"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
            </button>
            <button
              onClick={handleNext}
              disabled={
                startIndex + currentVisibleCount >= availableDates.length
              }
              className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next dates"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div
          className={`grid gap-2 ${isMobile ? "grid-cols-3" : "grid-cols-7"}`}
        >
          {visibleDates.map((date) => {
            const dateInfo = formatDateHeader(date);
            const isSelected = selectedDate === date;
            const isToday = date === todayDate;
            const matchCount = getMatchCountForDate(date);

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(isSelected ? null : date)}
                className={`
                  relative p-2 sm:p-3 rounded-lg border-2 transition-all duration-200
                  ${getDateStyles(isSelected, isToday)}
                `}
                aria-label={`Select ${dateInfo.day} ${dateInfo.date} ${dateInfo.month}`}
                aria-pressed={isSelected}
              >
                <div className="text-center">
                  <div
                    className={`text-[10px] sm:text-xs font-medium ${getTextColor(isSelected, isToday, "text-slate-500")}`}
                  >
                    {isMobile ? dateInfo.day.substring(0, 3) : dateInfo.day}
                  </div>
                  <div
                    className={`text-xl sm:text-2xl font-bold ${getTextColor(isSelected, isToday, "text-slate-900")}`}
                  >
                    {dateInfo.date}
                  </div>
                  <div
                    className={`text-[10px] sm:text-xs ${getTextColor(isSelected, isToday, "text-slate-500")}`}
                  >
                    {dateInfo.month}
                  </div>

                  {isToday && (
                    <div className="absolute -top-1 sm:-top-2 -left-1 sm:-left-2">
                      <span className="text-[8px] sm:text-[9px] font-bold text-white bg-blue-500 px-1 sm:px-1.5 py-0.5 rounded-full whitespace-nowrap shadow">
                        {isMobile ? "Today" : "Hari ini"}
                      </span>
                    </div>
                  )}

                  {matchCount > 0 && (
                    <div
                      className={`absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                        isSelected
                          ? "bg-blue-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {matchCount}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const VenueFilter = () => {
    const venueList = venues.filter((v) => v !== "All Venues");

    const getVenueMatchCount = (venue: string) => {
      return matchesData.filter((m) => m.venue === venue).length;
    };

    const VenueButton = ({
      venue,
      isActive,
      count,
      onClick,
    }: {
      venue: string;
      isActive: boolean;
      count?: number;
      onClick: () => void;
    }) => (
      <button
        onClick={onClick}
        className={`
          px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium 
          transition-all duration-200 relative
          ${
            isActive
              ? "bg-blue-500 text-white shadow-md"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }
        `}
      >
        <span className="truncate">{venue}</span>
        {count !== undefined && (
          <span
            className={`ml-1 sm:ml-2 text-xs ${isActive ? "text-blue-100" : "text-slate-500"}`}
          >
            ({count})
          </span>
        )}
      </button>
    );

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 mb-6">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Pilih Venue</span>
          <span className="sm:hidden">Venue</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          <VenueButton
            venue="Semua Venue"
            isActive={selectedVenue === "All Venues"}
            onClick={() => setSelectedVenue("All Venues")}
          />
          {venueList.map((venue) => (
            <VenueButton
              key={venue}
              venue={venue}
              isActive={selectedVenue === venue}
              count={getVenueMatchCount(venue)}
              onClick={() => setSelectedVenue(venue)}
            />
          ))}
        </div>
      </div>
    );
  };

  const MatchCard = ({ match }: { match: (typeof matchesData)[0] }) => {
    const minFee = Math.min(match.feePlayer, match.feeGk);
    const isBookingClosed = !isBookingAllowed(
      match.date,
      match.time,
      user?.email,
    );
    const isFullyBooked = Number(match.openSlots) === 0;

    return (
      <div className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden group">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative w-full sm:w-48 h-40 sm:h-auto overflow-hidden flex-shrink-0">
            <img
              src={match.image}
              alt={match.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
              <Badge className="bg-white/95 text-blue-700 border-0 font-semibold text-xs sm:text-sm">
                <Users className="h-3 w-3 mr-1" />
                {match.openSlots}/{match.totalSlots}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-5">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="mb-3 sm:mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 line-clamp-2 sm:line-clamp-1">
                      {match.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 flex-wrap">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium">
                        {match.typeEvent}
                      </span>
                      <span className="text-slate-400 hidden sm:inline">•</span>
                      <span className="hidden sm:inline">
                        {match.typeMatch}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 sm:space-y-2 mt-2 sm:mt-3">
                  <div className="flex items-center text-xs sm:text-sm text-slate-700">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-blue-500 flex-shrink-0" />
                    <span className="font-medium truncate">
                      {formatMatchDate(match.date)}
                    </span>
                    <span className="mx-1.5 sm:mx-2 text-slate-400">•</span>
                    <span className="font-semibold text-blue-600 whitespace-nowrap">
                      {match.time} WIB
                    </span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-slate-600">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{match.venue}</span>
                  </div>
                </div>
              </div>

              {/* Facilities */}
              <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-4">
                {match.facilities.slice(0, 3).map((facility, index) => (
                  <span
                    key={index}
                    className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-slate-50 text-slate-600 rounded-md text-[10px] sm:text-xs border border-slate-200"
                  >
                    {facility.name}
                  </span>
                ))}
                {match.facilities.length > 3 && (
                  <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-slate-50 text-slate-500 rounded-md text-[10px] sm:text-xs border border-slate-200">
                    +{match.facilities.length - 3}
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100 mt-auto gap-3">
                <div className="flex flex-col">
                  <div className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">
                    Mulai dari
                  </div>
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className="text-lg sm:text-2xl font-bold text-blue-600">
                      {formatCurrency(minFee)}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-500">
                      /orang
                    </span>
                  </div>
                </div>

                <div className="flex gap-1.5 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDetailClick(match.id)}
                    className="border-slate-300 hover:bg-slate-50 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Detail</span>
                  </Button>
                  {!isBookingClosed ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleBooking(match)}
                      disabled={isFullyBooked}
                      className="shadow-md hover:shadow-lg text-xs sm:text-sm px-3 sm:px-4"
                    >
                      {isFullyBooked ? "Penuh" : "Booking"}
                    </Button>
                  ) : (
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 text-slate-500 rounded-lg text-xs sm:text-sm font-medium">
                      Ditutup
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading skeleton
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-48 h-48 sm:h-auto bg-slate-200"></div>
        <div className="flex-1 p-5">
          <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
          <div className="flex gap-2 mb-4">
            <div className="h-6 bg-slate-200 rounded w-20"></div>
            <div className="h-6 bg-slate-200 rounded w-16"></div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="h-8 bg-slate-200 rounded w-24"></div>
            <div className="h-9 bg-slate-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar
          currentPage={""}
          navigateTo={function (page: string): void {
            throw new Error("Function not implemented.");
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="mb-6">
            <div className="h-10 bg-slate-200 rounded-lg w-64 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        currentPage={""}
        navigateTo={function (page: string): void {
          throw new Error("Function not implemented.");
        }}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-20 sm:py-24 mt-6 sm:mt-10">
        {/* Quick Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 mb-6 mt-4">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 text-xs sm:text-sm font-medium"
                aria-label="Filter by match type"
              >
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {/* Event Filter */}
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 text-xs sm:text-sm font-medium"
                aria-label="Filter by event type"
              >
                {events.map((event) => (
                  <option key={event} value={event}>
                    {event}
                  </option>
                ))}
              </select>
            </div>

            {/* Group By Toggle */}
            <div className="flex gap-1.5 sm:gap-2 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setGroupBy("date")}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  groupBy === "date"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                aria-pressed={groupBy === "date"}
              >
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-1.5" />
                <span className="hidden sm:inline">Per Tanggal</span>
                <span className="sm:hidden">Tanggal</span>
              </button>
              <button
                onClick={() => setGroupBy("venue")}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  groupBy === "venue"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                aria-pressed={groupBy === "venue"}
              >
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-1.5" />
                <span className="hidden sm:inline">Per Venue</span>
                <span className="sm:hidden">Venue</span>
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedVenue !== "All Venues" ||
            selectedType !== "All Types" ||
            selectedEvent !== "All Events" ||
            selectedDate) && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200">
              <span className="text-xs sm:text-sm text-slate-600 font-medium">
                Filter aktif:
              </span>
              {selectedDate && (
                <button
                  onClick={() => clearFilter("date")}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-200 transition-colors"
                  aria-label={`Remove date filter: ${formatMatchDate(selectedDate)}`}
                >
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {formatMatchDate(selectedDate)}
                  </span>
                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                </button>
              )}
              {selectedVenue !== "All Venues" && (
                <button
                  onClick={() => clearFilter("venue")}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-200 transition-colors"
                  aria-label={`Remove venue filter: ${selectedVenue}`}
                >
                  <span className="truncate max-w-[100px] sm:max-w-none">
                    {selectedVenue}
                  </span>
                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                </button>
              )}
              {selectedType !== "All Types" && (
                <button
                  onClick={() => clearFilter("type")}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-200 transition-colors"
                  aria-label={`Remove type filter: ${selectedType}`}
                >
                  {selectedType}
                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                </button>
              )}
              {selectedEvent !== "All Events" && (
                <button
                  onClick={() => clearFilter("event")}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-200 transition-colors"
                  aria-label={`Remove event filter: ${selectedEvent}`}
                >
                  {selectedEvent}
                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Date Selector */}
        {groupBy === "date" && <DateSelector />}

        {/* Venue Filter */}
        {groupBy === "venue" && <VenueFilter />}

        {/* Results Count */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-xs sm:text-sm text-slate-600">
            Menampilkan{" "}
            <span className="font-semibold text-slate-900">
              {filteredMatches.length}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-slate-900">
              {matchesData.length}
            </span>{" "}
            jadwal
          </div>
          {filteredMatches.length > 0 && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
              <span>
                {Object.keys(groupedMatches).length}{" "}
                {groupBy === "date" ? "tanggal" : "venue"} tersedia
              </span>
            </div>
          )}
        </div>

        {/* Grouped Matches */}
        {Object.keys(groupedMatches).length > 0 ? (
          <div className="space-y-6 sm:space-y-8">
            {Object.entries(groupedMatches).map(([groupKey, matches]) => {
              const headerInfo =
                groupBy === "date" ? formatDateHeader(groupKey) : null;

              return (
                <div key={groupKey} className="space-y-3 sm:space-y-4">
                  {/* Group Header */}
                  <div className="sticky top-16 sm:top-20 z-10 bg-slate-50 pb-2 sm:pb-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-md">
                      {groupBy === "date" && headerInfo ? (
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 min-w-[60px] sm:min-w-[80px] text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-white">
                              {headerInfo.date}
                            </div>
                            <div className="text-xs sm:text-sm text-blue-100">
                              {headerInfo.month} {headerInfo.year}
                            </div>
                          </div>
                          <div>
                            <div className="text-lg sm:text-2xl font-bold text-white">
                              {headerInfo.day}
                            </div>
                            <div className="text-xs sm:text-sm text-blue-100 flex items-center gap-2 mt-0.5 sm:mt-1">
                              <span>
                                {matches.length} pertandingan tersedia
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3">
                              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div>
                              <div className="text-lg sm:text-2xl font-bold text-white">
                                {groupKey}
                              </div>
                              <div className="text-xs sm:text-sm text-blue-100">
                                {matches.length} pertandingan tersedia
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Matches List */}
                  <div className="space-y-3 sm:space-y-4">
                    {matches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* No Results */
          <div className="text-center py-12 sm:py-16">
            <div className="bg-white rounded-xl sm:rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">
                Tidak ada jadwal ditemukan
              </h3>
              <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
                Coba ubah filter atau tanggal untuk menemukan jadwal yang sesuai
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedVenue("All Venues");
                  setSelectedType("All Types");
                  setSelectedEvent("All Events");
                  setSelectedDate(getTodayDate());
                }}
                className="shadow-md hover:shadow-lg text-sm sm:text-base"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Reset Semua Filter
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
