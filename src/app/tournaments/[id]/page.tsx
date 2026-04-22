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
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type TypeMatch = "FOOTBALL" | "MINI-SOCCER" | "MINI-SOCCER-BEKASI" | "PADEL";
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
  feePlayer: number;
  feeGk: number;
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
  "MINI-SOCCER-BEKASI": "Mini Soccer Bekasi",
  PADEL: "Padel",
};

const TYPE_MATCH_COLOR: Record<string, string> = {
  FOOTBALL: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "MINI-SOCCER": "bg-sky-50 text-sky-700 border-sky-200",
  "MINI-SOCCER-BEKASI": "bg-violet-50 text-violet-700 border-violet-200",
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
    <Section icon={<Tag className="w-4 h-4" />} title="Harga per Pot">
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
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {formatDateShort(phase.startDate)} –{" "}
            {formatDateShort(phase.endDate)}
          </span>
        </div>
        {(phase.quotaPlayer != null || phase.quotaGk != null) && (
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {phase.quotaPlayer ?? 0} pemain · {phase.quotaGk ?? 0} GK
            </span>
          </div>
        )}
      </div>

      {/* Phase fee = potongan harga */}
      <div className="flex gap-2">
        <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] text-slate-400 mb-0.5">Diskon Pemain</div>
          <div className="text-sm font-bold text-green-600">
            - {formatCurrency(phase.feePlayer)}
          </div>
        </div>
        <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] text-slate-400 mb-0.5">Diskon GK</div>
          <div className="text-sm font-bold text-green-600">
            - {formatCurrency(phase.feeGk)}
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
    fetchDetail();
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
  // Single: pakai event.feePlayer
  const { lowestFeePlayer, lowestFeeGk } = (() => {
    if (isMulti) {
      const cheapest = pots.reduce((min, pot) =>
        pot.feePlayer < min.feePlayer ? pot : min,
      );
      return {
        lowestFeePlayer: cheapest.feePlayer,
        lowestFeeGk: cheapest.feeGk,
      };
    }
    return {
      lowestFeePlayer: event?.feePlayer ?? 0,
      lowestFeeGk: event?.feeGk ?? 0,
    };
  })();

  const minFee = Math.min(lowestFeePlayer, lowestFeeGk);

  // Harga terendah setelah phase diskon
  const minFeeAfterPhase = activePhase
    ? Math.max(0, minFee - Math.min(activePhase.feePlayer, activePhase.feeGk))
    : null;

  const now = new Date();
  const isExpired = event ? new Date(event.endDate) < now : false;
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
          <div className="space-y-4">
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
                    <Clock className="w-3.5 h-3.5" />
                    Selesai
                  </span>
                ) : event.isOpen ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/90 text-white backdrop-blur-sm shadow-lg">
                    <UnlockKeyhole className="w-3.5 h-3.5" />
                    Open — Daftar Sekarang
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/90 text-white backdrop-blur-sm shadow-lg">
                    <LockKeyhole className="w-3.5 h-3.5" />
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
                      <Zap className="w-3 h-3" />
                      {typeLabel}
                    </span>
                  )}
                  {/* Pricing mode badge */}
                  {isMulti && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border bg-white/90 text-slate-700 border-white/50">
                      <Layers className="w-3 h-3" />
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
                  <Calendar className="w-3.5 h-3.5" />
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
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Venue
                </div>
                <div className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                  {getVenueName(event.venue)}
                </div>
              </div>

              {/* Fee — single: tampil 2 card, multi: tampil 1 card "mulai dari" */}
              {isMulti ? (
                <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <Tag className="w-3.5 h-3.5" />
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
              ) : (
                <>
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                      <Tag className="w-3.5 h-3.5" />
                      Fee Pemain
                    </div>
                    <div className="text-base font-bold text-blue-600">
                      {formatCurrency(event.feePlayer)}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                      <Tag className="w-3.5 h-3.5" />
                      Fee GK
                    </div>
                    <div className="text-base font-bold text-blue-600">
                      {formatCurrency(event.feeGk)}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Description ── */}
            {event.description && (
              <Section icon={<Layers className="w-4 h-4" />} title="Deskripsi">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {parseTextWithLinks(event.description)}
                </p>
              </Section>
            )}

            {/* ── Pot Pricing (hanya jika multi) ── */}
            {isMulti && (
              <PotPricingSection pots={pots} activePhase={activePhase} />
            )}

            {/* ── Teams ── */}
            {event.teams && event.teams.length > 0 && (
              <Section
                icon={<Users className="w-4 h-4" />}
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
                            {team.slot && (
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[11px] text-slate-500">
                                  <span className="font-semibold text-blue-600">
                                    {team.slot.openSlots}
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
                          {team.slot && (
                            <span
                              className={`flex-shrink-0 text-[11px] font-bold px-2 py-1 rounded-lg ${
                                team.slot.openSlots === 0
                                  ? "bg-red-100 text-red-600"
                                  : team.slot.openSlots <= 3
                                    ? "bg-amber-100 text-amber-600"
                                    : "bg-green-100 text-green-600"
                              }`}
                            >
                              {team.slot.openSlots === 0
                                ? "Penuh"
                                : `${team.slot.openSlots} tersisa`}
                            </span>
                          )}
                        </div>

                        {/* Row 2: pot badge + fee tim ini */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          {isMulti && pot && (
                            <PotBadge pot={pot} index={potIndex} />
                          )}
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── Phases ── */}
            {event.phases && event.phases.length > 0 && (
              <Section
                icon={<Layers className="w-4 h-4" />}
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

            {/* ── Facilities ── */}
            {event.facilities && event.facilities.length > 0 && (
              <Section
                icon={<CheckCircle2 className="w-4 h-4" />}
                title="Fasilitas"
              >
                <div className="flex flex-wrap gap-2">
                  {event.facilities.map((f) => (
                    <span
                      key={f.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
                    >
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      {f.name}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Rules ── */}
            {event.rules && event.rules.length > 0 && (
              <Section
                icon={<ShieldCheck className="w-4 h-4" />}
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

            {/* ── Sticky Booking Footer ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/80 p-4 flex items-center justify-between gap-4">
              <div>
                {activePhase ? (
                  <>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 mb-1">
                      <Zap className="w-3 h-3" />
                      {activePhase.name}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(minFeeAfterPhase!)}
                      </span>
                      <span className="text-sm text-slate-400 line-through">
                        {formatCurrency(minFee)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {isMulti
                        ? "Harga terendah setelah promo"
                        : "Harga setelah promo"}{" "}
                      · s/d {formatDateShort(activePhase.endDate)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      {isMulti ? "Mulai dari" : "Mulai dari"}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(minFee)}
                      </span>
                      <span className="text-xs text-slate-400">/orang</span>
                    </div>
                    {isMulti && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Harga berbeda per pot tim
                      </p>
                    )}
                  </>
                )}
              </div>

              <Button
                variant="primary"
                onClick={handleBooking}
                disabled={!event.isOpen || isExpired}
                className="flex-shrink-0 shadow-md hover:shadow-lg px-6"
              >
                {isExpired
                  ? "Event Selesai"
                  : !event.isOpen
                    ? "Belum Dibuka"
                    : "Booking Sekarang"}
                {event.isOpen && !isExpired && (
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
