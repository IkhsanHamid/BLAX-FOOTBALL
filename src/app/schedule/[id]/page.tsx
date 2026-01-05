"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Star,
  Shield,
  AlertCircle,
  Wallet,
} from "lucide-react";
import Navbar from "@/components/organisms/Navbar";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import { scheduleService } from "@/utils/schedule";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { formatCurrency } from "@/lib/helper";
import { Rules, Schedule, ScheduleDetail } from "@/types/schedule";
import { useSchedule } from "@/contexts/ScheduleContext";
import { useAuth } from "@/contexts/AuthContext";
import LineupBlur from "@/components/molecules/LineupBlur";
import MembershipModal from "@/components/molecules/MembershipModal";
import AuthModal from "@/components/molecules/AuthModal";

// Skeleton Loading Component
const SkeletonLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50">
    <Navbar currentPage="" navigateTo={() => {}} />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="w-20 h-10 bg-white/20 rounded-lg mb-6 animate-pulse" />
      <div className="relative rounded-2xl overflow-hidden mb-8 h-64 md:h-80 bg-white/20 animate-pulse">
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-20 h-6 bg-white/30 rounded-full" />
            <div className="w-32 h-6 bg-white/30 rounded-full" />
          </div>
          <div className="w-3/4 h-8 bg-white/30 rounded-lg mb-4" />
          <div className="flex flex-wrap gap-4">
            {[32, 24, 40].map((w, i) => (
              <div key={i} className={`w-${w} h-5 bg-white/30 rounded`} />
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
            <div className="w-16 h-6 bg-gray-200 rounded mx-auto mb-1 animate-pulse" />
            <div className="w-20 h-4 bg-gray-200 rounded mx-auto animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex space-x-4 border-b mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-24 h-10 bg-gray-200 rounded animate-pulse"
            />
          ))}
        </div>
        <div className="space-y-4">
          {[100, 75, 50].map((w, i) => (
            <div
              key={i}
              className={`w-${
                w === 100 ? "full" : w === 75 ? "3/4" : "1/2"
              } h-6 bg-gray-200 rounded animate-pulse`}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Not Found Component
const NotFoundDisplay = () => {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50">
      <Navbar currentPage="" navigateTo={() => {}} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 hover:bg-white/80 backdrop-blur-sm text-slate-700 border border-emerald-100 shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button> */}
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Match Not Found
          </h2>
          <p className="text-slate-600 mb-6">
            Sorry, the match you're looking for could not be found or may have
            been removed.
          </p>
          <div className="flex justify-center space-x-4">
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
            <Button onClick={() => router.push("/schedule")} variant="primary">
              View All Matches
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Progress Bar Component
const Progress = ({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) => (
  <div
    className={`w-full bg-gray-200 rounded-full overflow-hidden ${className}`}
  >
    <div
      className="bg-sky-500 h-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

// Avatar Components
const Avatar = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`rounded-full flex items-center justify-center ${className}`}>
    {children}
  </div>
);

const AvatarFallback = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={className}>{children}</div>;

// Tabs Components
const TabsTrigger = ({ value, children, onClick, isActive }: any) => (
  <button
    onClick={() => onClick(value)}
    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-white text-sky-600 shadow-sm"
        : "text-gray-600 hover:text-gray-900"
    }`}
  >
    {children}
  </button>
);

const TabsContent = ({ value, activeTab, children, className = "" }: any) => {
  if (value !== activeTab) return null;
  return <div className={className}>{children}</div>;
};

// Stats Card Component
const StatsCard = ({ icon: Icon, value, label, colorClass }: any) => (
  <div
    className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border ${colorClass} hover:shadow-xl transition-all duration-300`}
  >
    <div className="p-4 text-center">
      <Icon
        className={`h-8 w-8 mx-auto mb-2 ${colorClass
          .replace("border-", "text-")
          .replace("100", "500")}`}
      />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  </div>
);

// Player Card Component
const PlayerCard = ({ player, isGK }: { player: any; isGK: boolean }) => {
  const bgClass = isGK
    ? "bg-amber-50 hover:bg-amber-100 border-amber-200"
    : "bg-blue-50 hover:bg-blue-100 border-blue-200";
  const badgeClass = isGK
    ? "bg-amber-100 text-amber-800 border-amber-200"
    : "bg-blue-100 text-blue-800 border-blue-200";
  const avatarClass = isGK
    ? "bg-gradient-to-r from-amber-400 to-orange-500"
    : "bg-gradient-to-r from-blue-400 to-blue-500";

  return (
    <div
      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors border ${bgClass}`}
    >
      <Avatar className="h-10 w-10">
        <AvatarFallback className={`${avatarClass} text-white text-sm`}>
          {player.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{player.name}</p>
        <div className="flex items-center space-x-2">
          <Badge className={`${badgeClass} text-xs`} variant="outline">
            {isGK ? "GK" : "PLAYER"}
          </Badge>
          <span className="text-xs text-slate-500">{player.phone}</span>
        </div>
      </div>
    </div>
  );
};

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { showError } = useNotifications();
  const { setSelectedSchedule } = useSchedule();
  const { user, setUser } = useAuth();
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const occupancyPercentage = useMemo(
    () =>
      schedule
        ? (Number(schedule.bookedSlots) / Number(schedule.totalSlots)) * 100
        : 0,
    [schedule]
  );

  const formattedDate = useMemo(
    () =>
      schedule
        ? new Date(schedule.date).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "",
    [schedule]
  );

  // Function to check if booking is still allowed (at least 2 hours before match time)
  const isBookingAllowed = useCallback(
    (matchDate: string, matchTime: string): boolean => {
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
    },
    []
  );

  // Function to check if lineup should be visible (H-2 hours or if user is member)
  const isLineupVisible = useMemo(() => {
    if (!schedule) return false;
    // If user is a member, always show lineup
    if (user?.isMember) return true;
    // If not a member, show lineup only if H-2 hours has passed
    return !isBookingAllowed(schedule.date, schedule.time);
  }, [schedule, user?.isMember, isBookingAllowed]);

  useEffect(() => {
    const fetchScheduleDetail = async () => {
      if (!params.id) return;
      try {
        setLoading(true);
        const result = await scheduleService.scheduleDetail(
          params.id as string
        );
        setSchedule(result || null);
      } catch (error) {
        console.error("Error fetching schedule:", error);
        showError("Failed to load schedule", "Please try refreshing the page");
        setSchedule(null);
      } finally {
        setLoading(false);
      }
    };
    fetchScheduleDetail();
  }, [params.id, showError]);

  const handleBooking = (schedule: any) => {
    setSelectedSchedule(schedule);
    router.push(`/checkout`);
  };

  if (loading) return <SkeletonLoading />;
  if (!schedule) return <NotFoundDisplay />;

  const handleAuthSuccess = (userData: any, session: any) => {
    setUser(userData);
    setIsAuthModalOpen(false);
    router.push("/schedule");
  };

  const handleClickMembership = () => {
    if (user) {
      setMembershipModalOpen(true);
    } else if (!user) {
      setIsAuthModalOpen(true);
    }
  };

  const statsData = [
    {
      icon: Users,
      value: `${schedule.bookedSlots}/${schedule.totalSlots}`,
      label: "Players Joined",
      colorClass: "border-blue-100",
    },
    {
      icon: Wallet,
      value: (
        <div className="space-y-2">
          <div>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(schedule.feePlayer))}
            </div>
            <div className="text-sm text-slate-600">Per Player</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(schedule.feeGk))}
            </div>
            <div className="text-sm text-slate-600">Per Goalkeeper</div>
          </div>
        </div>
      ),
      label: "",
      colorClass: "border-emerald-100",
    },
    {
      icon: Shield,
      value: schedule.facilities.length,
      label: "Facilities",
      colorClass: "border-teal-100",
    },
    {
      icon: Star,
      value: `${Math.round(occupancyPercentage)}%`,
      label: "Occupancy",
      colorClass: "border-orange-100",
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <Navbar currentPage="" navigateTo={() => {}} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          {/* <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 hover:bg-white/80 backdrop-blur-sm text-slate-700 border border-emerald-100 shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button> */}

          {/* Hero Section */}
          <div className="relative rounded-2xl overflow-hidden mb-8 h-64 md:h-80 shadow-xl border border-emerald-200 mt-10">
            <img
              src={schedule.imageUrl}
              alt={schedule.venue}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className="bg-white/25 backdrop-blur-md text-white border-white/40 shadow-lg">
                  {schedule.typeEvent}
                </Badge>
                <Badge className="bg-emerald-500/90 text-white border border-emerald-400/50 shadow-lg">
                  {schedule.openSlots} slots available
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {schedule.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formattedDate}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {schedule.time} WIB
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {schedule.venue}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {statsData.map((stat, idx) => (
              <StatsCard key={idx} {...stat} />
            ))}
          </div>

          {/* Main Content Tabs */}
          <div className="space-y-6">
            <div className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-emerald-100 shadow-lg rounded-lg p-1">
              {["overview", "lineup", "facilities", "rules"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  onClick={setActiveTab}
                  isActive={activeTab === tab}
                >
                  {tab.charAt(0).toUpperCase() +
                    tab.slice(1).replace(/([A-Z])/g, " $1")}
                </TabsTrigger>
              ))}
            </div>

            <TabsContent
              value="overview"
              activeTab={activeTab}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-emerald-100">
                    <div className="p-6 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Match Information
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-slate-900">
                            Match Details
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Type:</span>
                              <span className="font-medium">
                                {schedule.typeMatch}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Event:</span>
                              <span className="font-medium">
                                {schedule.typeEvent}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-slate-900">
                            Booking Status
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Available Slots</span>
                              <span className="font-medium">
                                {schedule.openSlots}/{schedule.totalSlots}
                              </span>
                            </div>
                            <Progress
                              value={occupancyPercentage}
                              className="h-2 bg-slate-200"
                            />
                            <p className="text-xs text-slate-500">
                              {schedule.openSlots} slots remaining
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100">
                    <div className="p-6 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Quick Actions
                      </h3>
                    </div>
                    <div className="p-6 space-y-3">
                      {isBookingAllowed(schedule.date, schedule.time) ? (
                        <Button
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-500 hover:from-blue-600 hover:to-blue-600 shadow-md hover:shadow-lg"
                          variant="primary"
                          size="lg"
                          onClick={() => handleBooking(schedule)}
                          disabled={Number(schedule.openSlots) === 0}
                        >
                          {Number(schedule.openSlots) === 0
                            ? "Penuh"
                            : "Book Sekarang"}
                        </Button>
                      ) : (
                        <div className="w-full px-4 py-3 bg-gray-100 text-gray-500 rounded-lg text-center font-medium">
                          Booking Ditutup
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100">
                    <div className="p-6 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Venue Information
                      </h3>
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-sm font-bold text-slate-900">
                            {schedule.venue}
                          </p>
                          <p className="font-sm text-slate-600">
                            {schedule.address}
                          </p>
                        </div>
                      </div>
                      <Button
                        href={schedule.gmapLink}
                        variant="outline"
                        size="sm"
                        className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        View on Map
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="lineup"
              activeTab={activeTab}
              className="space-y-6"
            >
              {!isLineupVisible ? (
                /* ❌ NON-MEMBER & BOOKING MASIH BUKA → BLUR */
                <LineupBlur onUpgradeClick={() => handleClickMembership()} />
              ) : schedule.lineUp && Object.keys(schedule.lineUp).length > 0 ? (
                /* ✅ MEMBER ATAU H-2 JAM → LINEUP ASLI */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(schedule.lineUp).map(
                    ([teamKey, team]: [string, any]) => (
                      <div
                        key={teamKey}
                        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100"
                      >
                        <div className="p-6 border-b border-slate-200">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">
                              Team {teamKey}
                            </h3>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {(team.PLAYERS?.length || 0) + (team.GK ? 1 : 0)}{" "}
                              Players
                            </Badge>
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="space-y-3">
                            {team.GK && <PlayerCard player={team.GK} isGK />}
                            {team.PLAYERS?.map((player: any, index: number) => (
                              <PlayerCard
                                key={index}
                                player={player}
                                isGK={false}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                /* EMPTY STATE */
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-100 p-12 text-center">
                  <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    No Lineup Yet
                  </h3>
                  <p className="text-slate-600">
                    Teams will be formed once more players join the match.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="facilities"
              activeTab={activeTab}
              className="space-y-6"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-emerald-100">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Available Facilities
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {schedule.facilities.map((facility: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
                      >
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <span className="text-sm font-medium text-emerald-800">
                          {facility.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="rules"
              activeTab={activeTab}
              className="space-y-6"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-violet-100">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Match Rules & Regulations
                  </h3>
                </div>
                <div className="p-6">
                  {schedule.rules && schedule.rules.length > 0 ? (
                    <div className="space-y-3">
                      {schedule.rules.map((rule: Rules, index: number) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                            {index + 1}
                          </div>
                          <p className="text-slate-700 flex-1">
                            {rule.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-slate-900 mb-2">
                        No Specific Rules
                      </h4>
                      <p className="text-slate-600">
                        Standard football rules apply. Have fun and play fair!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </div>
      </div>

      <MembershipModal
        open={membershipModalOpen}
        onOpenChange={setMembershipModalOpen}
        code={user?.code!}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        mode={"signup"}
      />
    </>
  );
}
