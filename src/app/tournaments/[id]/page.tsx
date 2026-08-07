"use client";

import Button from "@/components/atoms/Button";
import Navbar from "@/components/organisms/Navbar";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { formatCurrency } from "@/lib/helper";
import { adminService } from "@/utils/admin";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  ArrowLeft,
  Clock,
  Zap,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Tag,
  Layers,
  UnlockKeyhole,
  LockKeyhole,
  Swords,
  BarChart3,
  Medal,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type TypeMatch = "FOOTBALL" | "MINI-SOCCER" | "MINI-FOOTBALL" | "PADEL";
type PricingMode = "single" | "multi";

interface TeamSlot {
  totalSlots: number;
  openSlots: number;
  bookedSlots: number;
  gkSlots: number;
  playerSlots: number;
}

interface Pot {
  id: string;
  eventId: string;
  name: string;
  feePlayer: number;
  feeGk: number;
  createdAt: string;
  updatedAt: string | null;
}

interface Team {
  id: string;
  name: string;
  imageUrl: string;
  availableGkSlots: number;
  availablePlayerSlots: number;
  potId?: string | null;
  slot?: TeamSlot;
}

interface Facility {
  id: string;
  name: string;
}

interface Rule {
  id: string;
  description: string;
}

interface AddOn {
  id?: string;
  name: string;
  price: number;
  stock?: number;
  maxPerBooking: number;
  isActive: boolean;
}

interface Phase {
  id?: string;
  name: string;
  order: number;
  feePlayer: number;
  feeGk: number;
  feeTeam: number;
  startDate: string;
  endDate: string;
  quotaPlayer?: number;
  quotaGk?: number;
  usedQuotaPlayer?: number;
  usedQuotaGk?: number;
  isActive: boolean;
}

interface EventDetail {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  time?: string;
  feePlayer: number;
  feeGk: number;
  feeTeam?: number | null;
  venue: { id: string; name: string } | string;
  venueId?: string;
  isOpen: boolean;
  typeMatch?: TypeMatch;
  totalTeam?: number;
  pricingMode?: PricingMode;
  pots?: Pot[];
  teams?: Team[];
  facilities?: Facility[];
  rules?: Rule[];
  addOn?: AddOn[];
  phases?: Phase[];
  canRegistTeam?: boolean;
  isOnlyTeam?: boolean;
  isOnlyIndividual?: boolean;
  isJersey?: boolean;
  category?: string;
}

interface EventLineupPlayer {
  name: string;
  position: string;
}

interface EventLineupTeam {
  teamName: string;
  players: EventLineupPlayer[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const parseTextWithLinks = (text: string): React.ReactNode[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      // Reset lastIndex karena split + test mengubah state regex
      urlRegex.lastIndex = 0;
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline underline-offset-2 hover:text-blue-700 break-all transition-colors"
        >
          {part}
        </a>
      );
    }
    urlRegex.lastIndex = 0;
    return <span key={i}>{part}</span>;
  });
};

const formatDateShort = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
};

const getVenueName = (
  venue: { id: string; name: string } | string | undefined,
): string => {
  if (!venue) return "-";
  if (typeof venue === "string") return venue;
  return venue.name ?? "-";
};

const TYPE_MATCH_LABEL: Record<string, string> = {
  FOOTBALL: "Football",
  "MINI-SOCCER": "Mini Soccer",
  "MINI-FOOTBALL": "Mini Football",
  PADEL: "Padel",
};

const TYPE_MATCH_COLOR: Record<string, string> = {
  FOOTBALL: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "MINI-SOCCER": "bg-sky-50 text-sky-700 border-sky-200",
  "MINI-FOOTBALL": "bg-violet-50 text-violet-700 border-violet-200",
  PADEL: "bg-amber-50 text-amber-700 border-amber-200",
};

/** Warna pot cycling */
const POT_COLORS = [
  "bg-blue-50 border-blue-200 text-blue-700",
  "bg-purple-50 border-purple-200 text-purple-700",
  "bg-emerald-50 border-emerald-200 text-emerald-700",
  "bg-orange-50 border-orange-200 text-orange-700",
  "bg-rose-50 border-rose-200 text-rose-700",
];

const POT_BADGE_BG = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-rose-500",
];

const POT_TEAM_BORDER = [
  "border-l-blue-400",
  "border-l-purple-400",
  "border-l-emerald-400",
  "border-l-orange-400",
  "border-l-rose-400",
];

const getActivePhase = (phases?: Phase[]): Phase | null => {
  if (!phases?.length) return null;
  const now = new Date();
  return (
    phases.find((p) => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return p.isActive && now >= start && now <= end;
    }) ?? null
  );
};

/**
 * Resolve fee dari pot yang di-assign ke tim.
 * Jika single pricing → pakai event fee global.
 */
const resolvePotFee = (
  team: Team,
  pots: Pot[],
  pricingMode: PricingMode,
  fallbackFeePlayer: number,
  fallbackFeeGk: number,
): { feePlayer: number; feeGk: number; pot: Pot | null } => {
  if (pricingMode === "multi" && team.potId) {
    const pot = pots.find((p) => p.id === team.potId) ?? null;
    if (pot) return { feePlayer: pot.feePlayer, feeGk: pot.feeGk, pot };
  }
  return { feePlayer: fallbackFeePlayer, feeGk: fallbackFeeGk, pot: null };
};

// ─── Skeleton ──────────────────────────────────────────────────────────────────

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
);

const SkeletonDetail = () => (
  <div className="space-y-6">
    <Skeleton className="w-full h-64 sm:h-80 rounded-2xl" />
    <div className="space-y-3">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
    <Skeleton className="h-32 rounded-xl" />
    <Skeleton className="h-48 rounded-xl" />
  </div>
);

// ─── Section Wrapper ───────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <span className="text-blue-500">{icon}</span>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const TabsTrigger = ({
  value,
  onClick,
  isActive,
  children,
}: {
  value: string;
  onClick: (v: string) => void;
  isActive: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={() => onClick(value)}
    className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-[9px] sm:text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-white text-slate-900 shadow-sm"
        : "text-slate-500 hover:text-slate-700"
    }`}
  >
    {children}
  </button>
);

const TabsContent = ({
  value,
  activeTab,
  children,
  className = "",
}: {
  value: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}) => {
  if (value !== activeTab) return null;
  return <div className={className}>{children}</div>;
};

// ─── Pot Badge ─────────────────────────────────────────────────────────────────

function PotBadge({ pot, index }: { pot: Pot; index: number }) {
  const color = POT_COLORS[index % POT_COLORS.length];
  const dot = POT_BADGE_BG[index % POT_BADGE_BG.length];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {pot.name}
    </span>
  );
}

// ─── Pot Pricing Section ───────────────────────────────────────────────────────

function PotPricingSection({
  pots,
  activePhase,
}: {
  pots: Pot[];
  activePhase: Phase | null;
}) {
  return (
    <Section icon={<Tag className="w-5 h-5" />} title="Harga per Pot">
      <div className="space-y-3">
        {pots.map((pot, i) => {
          const color = POT_COLORS[i % POT_COLORS.length];
          const dot = POT_BADGE_BG[i % POT_BADGE_BG.length];

          // Harga setelah phase diskon (jika ada)
          const discountedFeePlayer = activePhase
            ? Math.max(0, pot.feePlayer - activePhase.feePlayer)
            : null;
          const discountedFeeGk = activePhase
            ? Math.max(0, pot.feeGk - activePhase.feeGk)
            : null;

          const hasDiscount =
            discountedFeePlayer !== null &&
            (discountedFeePlayer !== pot.feePlayer ||
              discountedFeeGk !== pot.feeGk);

          return (
            <div key={pot.id} className={`rounded-xl border p-4 ${color}`}>
              {/* Pot header */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${dot}`}
                >
                  {i + 1}
                </span>
                <span className="font-bold text-sm">{pot.name}</span>
                {hasDiscount && activePhase && (
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                    <Zap className="w-2.5 h-2.5" />
                    {activePhase.name}
                  </span>
                )}
              </div>

              {/* Fee grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/60 rounded-lg px-3 py-2 text-center">
                  <div className="text-[10px] text-slate-400 mb-0.5">
                    Fee Pemain
                  </div>
                  {hasDiscount && discountedFeePlayer !== null ? (
                    <>
                      <div className="text-sm font-bold text-blue-700">
                        {formatCurrency(discountedFeePlayer)}
                      </div>
                      <div className="text-[10px] text-slate-400 line-through">
                        {formatCurrency(pot.feePlayer)}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm font-bold text-slate-800">
                      {formatCurrency(pot.feePlayer)}
                    </div>
                  )}
                </div>
                <div className="bg-white/60 rounded-lg px-3 py-2 text-center">
                  <div className="text-[10px] text-slate-400 mb-0.5">
                    Fee GK
                  </div>
                  {hasDiscount && discountedFeeGk !== null ? (
                    <>
                      <div className="text-sm font-bold text-blue-700">
                        {formatCurrency(discountedFeeGk)}
                      </div>
                      <div className="text-[10px] text-slate-400 line-through">
                        {formatCurrency(pot.feeGk)}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm font-bold text-slate-800">
                      {formatCurrency(pot.feeGk)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ─── Phase Card ────────────────────────────────────────────────────────────────

function PhaseCard({ phase, index }: { phase: Phase; index: number }) {
  const now = new Date();
  const start = new Date(phase.startDate);
  const end = new Date(phase.endDate);
  const isActive = now >= start && now <= end && phase.isActive;
  const isPast = now > end;

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all ${
        isActive
          ? "border-blue-300 bg-blue-50 shadow-sm"
          : isPast
            ? "border-slate-200 bg-slate-50 opacity-60"
            : "border-slate-200 bg-white"
      }`}
    >
      {isActive && (
        <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Aktif Sekarang
        </span>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              isActive
                ? "bg-blue-500 text-white"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {phase.order}
          </span>
          <span className="font-semibold text-slate-800 text-sm">
            {phase.name}
          </span>
        </div>
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            phase.isActive && !isPast
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {isPast ? "Selesai" : phase.isActive ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>
            {formatDateShort(phase.startDate)} –{" "}
            {formatDateShort(phase.endDate)}
          </span>
        </div>
        {(phase.quotaPlayer != null || phase.quotaGk != null) && (
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-400" />
            <span>
              {phase.quotaPlayer ?? 0} pemain · {phase.quotaGk ?? 0} GK
            </span>
          </div>
        )}
      </div>

      {/* Phase fee = potongan harga */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] text-slate-400 mb-0.5">Diskon Pemain</div>
          <div className="text-sm font-bold text-green-600">
            - {formatCurrency(phase.feePlayer)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] text-slate-400 mb-0.5">Diskon GK</div>
          <div className="text-sm font-bold text-green-600">
            - {formatCurrency(phase.feeGk)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] text-slate-400 mb-0.5">Diskon Team</div>
          <div className="text-sm font-bold text-green-600">
            - {formatCurrency(phase.feeTeam)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;
  const { showError } = useNotifications();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [lineupData, setLineupData] = useState<EventLineupTeam[]>([]);
  const [lineupLocked, setLineupLocked] = useState(false);
  const [bracketData, setBracketData] = useState<any[]>([]);
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);

  useEffect(() => {
    if (!eventId) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const res = await adminService.getEventDetail(eventId);
        setEvent(res);
      } catch (err: any) {
        showError("Error", err.message ?? "Gagal memuat detail event");
      } finally {
        setIsLoading(false);
      }
    };
    const fetchLineup = async () => {
      try {
        const res = await adminService.getEventLineup(eventId);
        if (res.locked) {
          setLineupLocked(true);
        } else {
          setLineupData(res.data ?? []);
        }
      } catch (_) {
      }
    };
    const fetchBracket = async () => {
      try {
        const res = await adminService.getBracket(eventId);
        const data = res?.data ?? [];
        setBracketData(data);
        return data.length > 0;
      } catch (_) {
        return false;
      }
    };
    const fetchTopScorers = async () => {
      try {
        const res = await adminService.getTopScorers(eventId);
        setTopScorers(res?.data ?? []);
      } catch (_) {
      }
    };
    const fetchStandings = async () => {
      try {
        const res = await adminService.getStandings(eventId);
        setStandings(res?.data ?? []);
      } catch (_) {
      }
    };
    const init = async () => {
      fetchDetail();
      fetchLineup();
      const hasBracket = await fetchBracket();
      if (hasBracket) {
        fetchTopScorers();
        fetchStandings();
      }
    };
    init();
  }, [eventId]);

  const handleBooking = () => {
    router.push(`/tournaments/${eventId}/checkout`);
  };

  const activePhase = getActivePhase(event?.phases);
  const pricingMode: PricingMode = event?.pricingMode ?? "single";
  const pots = event?.pots ?? [];
  const isMulti = pricingMode === "multi" && pots.length > 0;

  // ── Harga terendah untuk footer ──────────────────────────────────────────────
  // Multi: ambil pot dengan feePlayer terendah
  // EXTERNAL: pakai feeTeam
  // Single: pakai event.feePlayer
  const isExternal = event?.category === "EXTERNAL";

  const { lowestFeePlayer, lowestFeeGk, lowestFeeTeam } = (() => {
    if (isExternal) {
      return {
        lowestFeePlayer: 0,
        lowestFeeGk: 0,
        lowestFeeTeam: event?.feeTeam ?? 0,
      };
    }
    if (isMulti) {
      const cheapest = pots.reduce((min, pot) =>
        pot.feePlayer < min.feePlayer ? pot : min,
      );
      return {
        lowestFeePlayer: cheapest.feePlayer,
        lowestFeeGk: cheapest.feeGk,
        lowestFeeTeam: null,
      };
    }
    return {
      lowestFeePlayer: event?.feePlayer ?? 0,
      lowestFeeGk: event?.feeGk ?? 0,
      lowestFeeTeam: null,
    };
  })();

  const minFee: number = isExternal
    ? (lowestFeeTeam ?? 0)
    : Math.min(lowestFeePlayer, lowestFeeGk);

  // Harga terendah setelah phase diskon
  const minFeeAfterPhase = activePhase
    ? Math.max(
        0,
        isExternal
          ? (lowestFeeTeam ?? 0) - activePhase.feeTeam
          : minFee - Math.min(activePhase.feePlayer, activePhase.feeGk),
      )
    : null;

  const now = new Date();
  const endDateOnly = event?.endDate ? event.endDate.split("T")[0] : null;
  const endTime = event?.time || "23:59";
  const eventEndDateTime = endDateOnly ? new Date(`${endDateOnly}T${endTime}`) : null;
  const isExpired = eventEndDateTime ? eventEndDateTime < now : false;
  const isH1Closed = eventEndDateTime
    ? new Date(eventEndDateTime.getTime() - 60 * 60 * 1000) < now
    : false;
  const canRegistTeam = event?.canRegistTeam;
  const isOnlyTeam = event?.isOnlyTeam;
  const isOnlyIndividual = event?.isOnlyIndividual;
  const teams = event?.teams ?? [];
  console.log(
    "canRegistTeam",
    canRegistTeam,
    "isOnlyTeam",
    isOnlyTeam,
    "isOnlyIndividual",
    isOnlyIndividual,
  );

  const isOnlyTeamMode = isOnlyTeam && !isOnlyIndividual;
  const isOnlyIndividuMode = isOnlyIndividual && !isOnlyTeam;

  const isTeamFullBlocked = isOnlyTeamMode && !canRegistTeam;
  const isIndividuFullBlocked =
    isOnlyIndividuMode &&
    teams.length > 0 &&
    teams.every(
      (team) => team.availableGkSlots === 0 && team.availablePlayerSlots === 0,
    );

  const isFullBlocked = isTeamFullBlocked || isIndividuFullBlocked;
  const typeLabel =
    TYPE_MATCH_LABEL[event?.typeMatch ?? ""] ?? event?.typeMatch;
  const typeColor =
    TYPE_MATCH_COLOR[event?.typeMatch ?? ""] ??
    "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar currentPage="" navigateTo={() => {}} />

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-20 sm:py-24 mt-4 sm:mt-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke daftar event
        </button>

        {isLoading ? (
          <SkeletonDetail />
        ) : !event ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Event tidak ditemukan</p>
          </div>
        ) : (
          <div>
          <div className="space-y-4 pb-20 sm:pb-24">
            {/* ── Hero Image ── */}
            <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Trophy className="w-20 h-20 text-white/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Status */}
              <div className="absolute top-4 left-4">
                {isExpired ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800/80 text-slate-300 backdrop-blur-sm">
                    <Clock className="w-4 h-4" />
                    Selesai
                  </span>
                ) : event.isOpen ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/90 text-white backdrop-blur-sm shadow-lg">
                    <UnlockKeyhole className="w-4 h-4" />
                    Open — Daftar Sekarang
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/90 text-white backdrop-blur-sm shadow-lg">
                    <LockKeyhole className="w-4 h-4" />
                    Upcoming
                  </span>
                )}
              </div>

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-1">
                  {event.name}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {event.typeMatch && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${typeColor}`}
                    >
                      <Zap className="w-4 h-4" />
                      {typeLabel}
                    </span>
                  )}
                  {/* Pricing mode badge */}
                  {isMulti && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border bg-white/90 text-slate-700 border-white/50">
                      <Layers className="w-4 h-4" />
                      Multi Pot
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Key Info ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                  <Calendar className="w-5 h-5" />
                  Tanggal
                </div>
                <div className="text-sm font-semibold text-slate-800 leading-snug">
                  {formatDate(event.startDate)}
                </div>
                {event.endDate !== event.startDate && (
                  <div className="text-xs text-slate-400 mt-0.5">
                    s/d {formatDate(event.endDate)}
                  </div>
                )}
                {event.time && (
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {event.time} WIB
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                  <MapPin className="w-5 h-5" />
                  Venue
                </div>
                <div className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                  {getVenueName(event.venue)}
                </div>
              </div>

              {/* Fee — multi / external / internal single */}
              {isMulti ? (
                <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <Tag className="w-5 h-5" />
                    Harga
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-slate-400">Mulai dari</span>
                    <span className="text-base font-bold text-blue-600">
                      {formatCurrency(lowestFeePlayer)}
                    </span>
                    <span className="text-xs text-slate-400">/pemain</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Harga berbeda per tim — lihat detail pot di bawah
                  </p>
                </div>
              ) : event.category === "EXTERNAL" ? (
                <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <Tag className="w-5 h-5" />
                    Fee Team
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-blue-600">
                      {formatCurrency(event.feeTeam ?? 0)}
                    </span>
                    <span className="text-xs text-slate-400">/team</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                      <Tag className="w-5 h-5" />
                      Fee Pemain
                    </div>
                    <div className="text-base font-bold text-blue-600">
                      {formatCurrency(event.feePlayer)}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                      <Tag className="w-5 h-5" />
                      Fee GK
                    </div>
                    <div className="text-base font-bold text-blue-600">
                      {formatCurrency(event.feeGk)}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Tab Navigation ── */}
            <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-sm border border-slate-200 shadow rounded-xl p-1 mb-4">
              <div className="flex overflow-x-auto gap-1">
                {[
                  { id: "overview", label: "Overview", icon: Layers },
                  { id: "tim", label: "Tim", icon: Users },
                  { id: "bracket", label: "Bracket", icon: Swords },
                  { id: "top-skors", label: "Top Skor", icon: Medal },
                  { id: "fasilitas", label: "Fasilitas", icon: CheckCircle2 },
                  { id: "peraturan", label: "Aturan", icon: ShieldCheck },
                ].map((t) => (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    onClick={setActiveTab}
                    isActive={activeTab === t.id}
                  >
                    <t.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-xs">{t.label}</span>
                  </TabsTrigger>
                ))}
              </div>
            </div>

            <TabsContent value="overview" activeTab={activeTab} className="space-y-4">

            {/* ── Description ── */}
            {event.description && (
              <Section icon={<Layers className="w-5 h-5" />} title="Deskripsi">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {parseTextWithLinks(event.description)}
                </p>
              </Section>
            )}

            {/* ── Pot Pricing (hanya jika multi) ── */}
            {isMulti && (
              <PotPricingSection pots={pots} activePhase={activePhase} />
            )}
            </TabsContent>

            <TabsContent value="tim" activeTab={activeTab} className="space-y-4">

            {/* ── Teams ── */}
            {event.teams && event.teams.length > 0 && (
              <Section
                icon={<Users className="w-5 h-5" />}
                title={`Daftar Tim (${event.teams.length})`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.teams.map((team) => {
                    // Resolve pot untuk tim ini
                    const { feePlayer, feeGk, pot } = resolvePotFee(
                      team,
                      pots,
                      pricingMode,
                      event.feePlayer,
                      event.feeGk,
                    );
                    const potIndex = pot
                      ? pots.findIndex((p) => p.id === pot.id)
                      : -1;
                    const borderColor =
                      potIndex >= 0
                        ? POT_TEAM_BORDER[potIndex % POT_TEAM_BORDER.length]
                        : "";

                    return (
                      <div
                        key={team.id}
                        className={`flex flex-col gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 ${
                          isMulti && pot ? `border-l-4 ${borderColor}` : ""
                        }`}
                      >
                        {/* Row 1: logo + nama + slot badge */}
                        <div className="flex items-center gap-3">
                          {team.imageUrl ? (
                            <img
                              src={team.imageUrl}
                              alt={team.name}
                              className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                              <Trophy className="w-5 h-5 text-white" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {team.name.trim()}
                            </p>
                            {team.slot && !isExternal && !isOnlyTeamMode && (
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[11px] text-slate-500">
                                  <span className="font-semibold text-blue-600">
                                    {team.availableGkSlots +
                                      team.availablePlayerSlots}
                                  </span>
                                  /{team.slot.totalSlots} slot
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="text-[11px] text-slate-500">
                                  GK: {team.availableGkSlots}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="text-[11px] text-slate-500">
                                  Player: {team.availablePlayerSlots}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Slot badge */}
                          {team.slot &&
                            (() => {
                              const remainingSlots =
                                team.availableGkSlots +
                                team.availablePlayerSlots;
                              const isFull =
                                team.slot.openSlots === 0 ||
                                remainingSlots === 0;

                              const isAlmostFull = team.slot.openSlots <= 3;

                              const colorClass = isFull
                                ? "bg-red-100 text-red-600"
                                : isAlmostFull
                                  ? "bg-amber-100 text-amber-600"
                                  : "bg-green-100 text-green-600";

                              const label = isFull
                                ? "Penuh"
                                : `${remainingSlots} tersisa`;

                              return (
                                <span
                                  className={`flex-shrink-0 text-[11px] font-bold px-2 py-1 rounded-lg ${colorClass}`}
                                >
                                  {label}
                                </span>
                              );
                            })()}
                        </div>

                        {/* Row 2: pot badge + fee tim ini */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          {isMulti && pot && (
                            <PotBadge pot={pot} index={potIndex} />
                          )}
                          {isExternal ? (
                            <div className="ml-auto text-right">
                              <div className="text-[10px] text-slate-400">
                                Fee Team
                              </div>
                              <div className="text-xs font-bold text-slate-700">
                                {formatCurrency(event.feeTeam ?? 0)}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 ml-auto">
                              <div className="text-right">
                                <div className="text-[10px] text-slate-400">
                                  Pemain
                                </div>
                                <div className="text-xs font-bold text-slate-700">
                                  {formatCurrency(feePlayer)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] text-slate-400">
                                  GK
                                </div>
                                <div className="text-xs font-bold text-slate-700">
                                  {formatCurrency(feeGk)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── Lineup ── */}
            {!lineupLocked && lineupData.length > 0 && (
              <div className="space-y-4">
                {lineupData.map((team) => {
                  const sorted = [...team.players].sort((a, b) => {
                    const order: Record<string, number> = { GK: 0, Player: 1, Substitute: 2 };
                    return (order[a.position] ?? 99) - (order[b.position] ?? 99);
                  });
                  return (
                    <div key={team.teamName} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <p className="text-sm font-bold text-slate-800">{team.teamName}</p>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {sorted.map((player, i) => (
                          <div key={i} className="flex items-center justify-between px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                              <span className="text-sm text-slate-700">{player.name}</span>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${player.position === "GK" ? "bg-yellow-100 text-yellow-700" : player.position === "Substitute" ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-600"}`}>{player.position}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {lineupLocked && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                <LockKeyhole className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-amber-800">Lineup akan tersedia H-3 sebelum event dimulai</p>
                <p className="text-xs text-amber-600 mt-1">Kembali lagi nanti untuk melihat susunan pemain</p>
              </div>
            )}
            </TabsContent>

            <TabsContent value="overview" activeTab={activeTab} className="space-y-4">

            {/* ── Phases ── */}
            {event.phases && event.phases.length > 0 && (
              <Section
                icon={<Layers className="w-5 h-5" />}
                title="Phase / Promo"
              >
                <p className="text-xs text-slate-400 mb-3">
                  Phase berlaku sebagai{" "}
                  <span className="font-semibold text-green-600">
                    potongan harga
                  </span>{" "}
                  dari harga dasar masing-masing tim.
                </p>
                <div className="space-y-3">
                  {event.phases
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((phase, i) => (
                      <PhaseCard key={phase.id ?? i} phase={phase} index={i} />
                    ))}
                </div>
              </Section>
            )}
            </TabsContent>

            <TabsContent value="fasilitas" activeTab={activeTab} className="space-y-4">

            {/* ── Facilities ── */}
            {event.facilities && event.facilities.length > 0 && (
              <Section
                icon={<CheckCircle2 className="w-5 h-5" />}
                title="Fasilitas"
              >
                <div className="flex flex-wrap gap-2">
                  {event.facilities.map((f) => (
                    <span
                      key={f.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      {f.name}
                    </span>
                  ))}
                </div>
              </Section>
            )}
            </TabsContent>

            <TabsContent value="peraturan" activeTab={activeTab} className="space-y-4">

            {/* ── Rules ── */}
            {event.rules && event.rules.length > 0 && (
              <Section
                icon={<ShieldCheck className="w-5 h-5" />}
                title="Peraturan"
              >
                <ol className="space-y-2">
                  {event.rules.map((rule, i) => (
                    <li
                      key={rule.id}
                      className="flex items-start gap-3 text-sm text-slate-600"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {rule.description}
                    </li>
                  ))}
                </ol>
              </Section>
            )}
            </TabsContent>

            <TabsContent value="bracket" activeTab={activeTab} className="space-y-4">
              {(() => {
                const AVATAR_COLORS = [
                  "bg-blue-500", "bg-red-500", "bg-emerald-500", "bg-amber-500",
                  "bg-violet-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500",
                  "bg-teal-500", "bg-indigo-500", "bg-rose-500", "bg-lime-500",
                ];
                const avatarColor = (name: string) => {
                  let hash = 0;
                  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
                  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
                };
                const TeamAvatar = ({ team }: { team: any }) => (
                  team?.imageUrl ? (
                    <img src={team.imageUrl} alt={team.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${avatarColor(team?.name ?? "?")} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                      {team?.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                  )
                );

                return bracketData.length > 0 ? (
                <div className={bracketData[0]?.stage === "group"
                  ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
                  : "-mx-2 sm:mx-0 overflow-x-auto pb-4"
                }>
                  {bracketData[0]?.stage === "group" ? (
                    bracketData.map((round: any, ri: number) => (
                      <div key={`${round.roundName}-${ri}`} className="flex flex-col gap-3">
                        <div className="bg-slate-800 text-white text-center py-2 px-3 rounded-lg">
                          <p className="text-xs font-bold uppercase tracking-wide">{round.roundName}</p>
                        </div>
                        {round.matches?.map((match: any) => (
                          <div
                            key={match.id}
                            className={`relative bg-white rounded-xl border-2 p-3 ${
                              match.score?.status === "finished"
                                ? "border-green-200"
                                : match.score?.status === "live"
                                  ? "border-red-300 shadow-md shadow-red-100"
                                  : "border-slate-200"
                            }`}
                          >
                            {match.score?.status === "live" && (
                              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow animate-pulse">
                                LIVE
                              </span>
                            )}
                            {match.score?.status === "finished" && (
                              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                Selesai
                              </span>
                            )}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <TeamAvatar team={match.teamA} />
                                  <span className="text-xs font-medium truncate">{match.teamA?.name ?? "TBD"}</span>
                                </div>
                                <span className="text-base font-black text-slate-700 flex-shrink-0">
                                  {match.score?.scoreA ?? 0}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <TeamAvatar team={match.teamB} />
                                  <span className="text-xs font-medium truncate">{match.teamB?.name ?? "TBD"}</span>
                                </div>
                                <span className="text-base font-black text-slate-700 flex-shrink-0">
                                  {match.score?.scoreB ?? 0}
                                </span>
                              </div>
                              {match.goals?.length > 0 && (
                                <div className="border-t border-slate-100 pt-1.5 mt-1 space-y-0.5">
                                  <p className="text-[10px] font-semibold text-slate-400">Pencetak Goal:</p>
                                  {match.goals.map((goal: any) => (
                                    <div key={goal.id} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${goal.type === "penalty" ? "bg-amber-400" : goal.type === "own_goal" ? "bg-red-400" : "bg-green-400"}`} />
                                      <span className="font-medium text-slate-600">{goal.userName ?? goal.teamName}</span>
                                      <span>{goal.minute}&apos;</span>
                                      {goal.type === "penalty" && <span className="text-amber-500">(P)</span>}
                                      {goal.type === "own_goal" && <span className="text-red-400">(OG)</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="flex gap-4 sm:gap-6 min-w-max px-2 sm:px-0">
                      {bracketData.map((round: any, ri: number) => (
                        <div key={round.round ?? ri} className="flex flex-col gap-3" style={{ minWidth: 180 }}>
                          <div className="bg-slate-800 text-white text-center py-2 px-3 rounded-lg">
                            <p className="text-xs font-bold uppercase tracking-wide">{round.roundName}</p>
                          </div>
                          {round.matches?.map((match: any) => (
                            <div
                              key={match.id}
                              className={`relative bg-white rounded-xl border-2 p-3 w-full ${
                                match.score?.status === "finished"
                                  ? "border-green-200"
                                  : match.score?.status === "live"
                                    ? "border-red-300 shadow-md shadow-red-100"
                                    : "border-slate-200"
                              }`}
                            >
                              {match.score?.status === "live" && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow animate-pulse">
                                  LIVE
                                </span>
                              )}
                              {match.score?.status === "finished" && (
                                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                  Selesai
                                </span>
                              )}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <TeamAvatar team={match.teamA} />
                                    <span className="text-sm font-medium truncate">{match.teamA?.name ?? "TBD"}</span>
                                  </div>
                                  <span className="text-lg font-black text-slate-700 flex-shrink-0">
                                    {match.score?.scoreA ?? 0}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <TeamAvatar team={match.teamB} />
                                    <span className="text-sm font-medium truncate">{match.teamB?.name ?? "TBD"}</span>
                                  </div>
                                  <span className="text-lg font-black text-slate-700 flex-shrink-0">
                                    {match.score?.scoreB ?? 0}
                                  </span>
                                </div>
                                {match.goals?.length > 0 && (
                                  <div className="border-t border-slate-100 pt-1.5 mt-1 space-y-0.5">
                                    <p className="text-[10px] font-semibold text-slate-400">Pencetak Goal:</p>
                                    {match.goals.map((goal: any) => (
                                      <div key={goal.id} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                        <span className={`w-1 h-1 rounded-full flex-shrink-0 ${goal.type === "penalty" ? "bg-amber-400" : goal.type === "own_goal" ? "bg-red-400" : "bg-green-400"}`} />
                                        <span className="font-medium text-slate-600">{goal.userName ?? goal.teamName}</span>
                                        <span>{goal.minute}&apos;</span>
                                        {goal.type === "penalty" && <span className="text-amber-500">(P)</span>}
                                        {goal.type === "own_goal" && <span className="text-red-400">(OG)</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Swords className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Bracket belum tersedia</p>
                  <p className="text-xs text-slate-400 mt-1">Bracket akan muncul setelah dibuat oleh admin</p>
                </div>
              )})()}

              {standings.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Klasemen</h2>
                  </div>
                  {standings.map((group: any, gi: number) => (
                    <div key={gi} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-800">{group.roundName}</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-xs text-slate-500 uppercase">
                              <th className="text-center py-2 w-8">#</th>
                              <th className="text-left py-2">Tim</th>
                              <th className="text-center py-2 w-8">P</th>
                              <th className="text-center py-2 w-8">W</th>
                              <th className="text-center py-2 w-8">D</th>
                              <th className="text-center py-2 w-8">L</th>
                              <th className="text-center py-2">GF</th>
                              <th className="text-center py-2">GA</th>
                              <th className="text-center py-2">GD</th>
                              <th className="text-center py-2 font-bold">PTS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(group.standings || []).map((s: any, i: number) => (
                              <tr key={s.teamId} className="border-t border-slate-100">
                                <td className="text-center py-2 font-bold">{i + 1}</td>
                                <td className="py-2">
                                  <div className="flex items-center gap-2">
                                    {s.teamImageUrl && <img src={s.teamImageUrl} className="w-5 h-5 rounded" />}
                                    <span className="font-medium">{s.teamName}</span>
                                  </div>
                                </td>
                                <td className="text-center py-2 text-xs">{s.played}</td>
                                <td className="text-center py-2 text-xs">{s.wins}</td>
                                <td className="text-center py-2 text-xs">{s.draws}</td>
                                <td className="text-center py-2 text-xs">{s.losses}</td>
                                <td className="text-center py-2 text-xs">{s.goalsFor}</td>
                                <td className="text-center py-2 text-xs">{s.goalsAgainst}</td>
                                <td className="text-center py-2 text-xs">{s.goalDifference}</td>
                                <td className="text-center py-2 text-sm font-bold">{s.points}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="top-skors" activeTab={activeTab} className="space-y-4">
              {topScorers.length > 0 ? (
                <div className="space-y-2">
                  {topScorers.map((player: any, i: number) => (
                    <div
                      key={player.userId ?? `${player.eventTeamId}-${i}`}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        i === 0
                          ? "bg-amber-50 border-amber-200"
                          : i === 1
                            ? "bg-slate-50 border-slate-200"
                            : i === 2
                              ? "bg-orange-50 border-orange-100"
                              : "bg-white border-slate-100"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {player.name ?? "Pemain tidak dikenal"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{player.teamName}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xl font-black text-slate-800">{player.goals}</span>
                        <span className="text-xs text-slate-400">gol</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Belum ada data top skor</p>
                </div>
              )}
            </TabsContent>
          </div>

          {/* ── Floating Booking Bar ── */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg shadow-slate-300/50 p-3 sm:p-4 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {activePhase ? (
                <div className="flex flex-col">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 mb-1 w-fit">
                    <Zap className="w-4 h-4" />
                    {activePhase.name}
                  </span>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-lg sm:text-xl font-bold text-blue-600">
                      {formatCurrency(minFeeAfterPhase!)}
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      {formatCurrency(minFee)}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400">
                      {isExternal ? "/team" : "/orang"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400 mb-0.5">Mulai dari</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-bold text-blue-600">
                      {formatCurrency(minFee)}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400">
                      {isExternal ? "/team" : "/orang"}
                    </span>
                  </div>
                  {isMulti && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Harga berbeda per pot tim
                    </p>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="primary"
              onClick={handleBooking}
              disabled={!event.isOpen || isH1Closed || isFullBlocked}
              className="flex-shrink-0 shadow-md hover:shadow-lg px-5 sm:px-6 text-sm sm:text-base"
            >
              {isFullBlocked
                ? "FULL"
                : isExpired || isH1Closed
                  ? "Selesai"
                  : !event.isOpen
                    ? "Belum Dibuka"
                    : "Book Sekarang"}
              {!isFullBlocked && !isH1Closed && !isExpired && event.isOpen && (
                <ChevronRight className="w-4 h-4 ml-1" />
              )}
            </Button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
