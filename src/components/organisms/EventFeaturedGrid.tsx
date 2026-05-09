"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  MapPin,
  Calendar,
  ArrowRight,
  Zap,
  Tag,
  Layers,
  ChevronRight,
  Flame,
  Star,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { adminService } from "@/utils/admin";
import { formatCurrency } from "@/lib/helper";

// ─── Types ────────────────────────────────────────────────────────────────────

type PricingMode = "single" | "multi";

interface Pot {
  id: string;
  name: string;
  feePlayer: number;
  feeGk: number;
}

interface Phase {
  id?: string;
  name: string;
  order: number;
  feePlayer: number;
  feeGk: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface EventItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  feePlayer: number;
  feeGk: number;
  isOpen: boolean;
  typeMatch?: string;
  pricingMode?: PricingMode;
  pots?: Pot[];
  phases?: Phase[];
  venue: { id: string; name: string } | string;
  totalTeam?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getVenueName = (
  venue: { id: string; name: string } | string | undefined,
): string => {
  if (!venue) return "-";
  if (typeof venue === "string") return venue;
  return venue.name ?? "-";
};

const formatDateRange = (start: string, end: string): string => {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  if (s.toDateString() === e.toDateString()) {
    return s.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return `${s.toLocaleDateString("id-ID", opts)} – ${e.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
};

const formatDay = (dateStr: string) =>
  new Date(dateStr)
    .toLocaleDateString("id-ID", { weekday: "short" })
    .toUpperCase();

const formatDayNum = (dateStr: string) => new Date(dateStr).getDate();

const formatMonth = (dateStr: string) =>
  new Date(dateStr)
    .toLocaleDateString("id-ID", { month: "short" })
    .toUpperCase();

const getActivePhase = (phases?: Phase[]): Phase | null => {
  if (!phases?.length) return null;
  const now = new Date();
  return (
    phases.find(
      (p) =>
        p.isActive &&
        now >= new Date(p.startDate) &&
        now <= new Date(p.endDate),
    ) ?? null
  );
};

const getLowestFee = (
  event: EventItem,
): { player: number; gk: number; base: { player: number; gk: number } } => {
  const isMulti =
    event.pricingMode === "multi" && (event.pots?.length ?? 0) > 0;
  const activePhase = getActivePhase(event.phases);

  let basePlayer = event.feePlayer;
  let baseGk = event.feeGk;

  if (isMulti && event.pots) {
    const cheapest = event.pots.reduce((min, p) =>
      p.feePlayer < min.feePlayer ? p : min,
    );
    basePlayer = cheapest.feePlayer;
    baseGk = cheapest.feeGk;
  }

  const feePlayer = activePhase
    ? Math.max(0, basePlayer - activePhase.feePlayer)
    : basePlayer;
  const feeGk = activePhase ? Math.max(0, baseGk - activePhase.feeGk) : baseGk;

  return {
    player: feePlayer,
    gk: feeGk,
    base: { player: basePlayer, gk: baseGk },
  };
};

const TYPE_MATCH_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  FOOTBALL: {
    label: "Football",
    color: "text-emerald-600",
    bg: "bg-emerald-500",
  },
  "MINI-SOCCER": {
    label: "Mini Soccer",
    color: "text-sky-600",
    bg: "bg-sky-500",
  },
  "MINI-FOOTBALL": {
    label: "Mini Soccer",
    color: "text-violet-600",
    bg: "bg-violet-500",
  },
  PADEL: { label: "Padel", color: "text-amber-600", bg: "bg-amber-500" },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = ({ large = false }: { large?: boolean }) => (
  <div
    className={`animate-pulse rounded-3xl overflow-hidden bg-slate-100 ${large ? "h-[520px]" : "h-64"}`}
  >
    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-100" />
  </div>
);

// ─── Event Card — Large (hero/featured) ──────────────────────────────────────

function EventCardLarge({ event, index }: { event: EventItem; index: number }) {
  const router = useRouter();
  const isMulti =
    event.pricingMode === "multi" && (event.pots?.length ?? 0) > 0;
  const activePhase = getActivePhase(event.phases);
  const fees = getLowestFee(event);
  const hasDiscount = activePhase && fees.player !== fees.base.player;
  const typeConf = TYPE_MATCH_CONFIG[event.typeMatch ?? ""] ?? null;
  const isExpired = new Date(event.endDate) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.1 }}
      onClick={() => router.push(`/tournaments/${event.id}`)}
      className="group relative rounded-3xl overflow-hidden cursor-pointer h-full min-h-[480px] shadow-xl hover:shadow-2xl transition-shadow duration-500"
    >
      {/* BG image */}
      <div className="absolute inset-0">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 flex items-center justify-center">
            <Trophy className="w-24 h-24 text-white/10" />
          </div>
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      {/* Date chip — top right */}
      <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-md rounded-2xl px-3 py-3 text-center shadow-lg border border-white/50 min-w-[64px]">
        <div className="text-[10px] font-black text-blue-600 tracking-widest mb-0.5">
          {formatDay(event.startDate)}
        </div>
        <div className="text-3xl font-black text-slate-900 leading-none">
          {formatDayNum(event.startDate)}
        </div>
        <div className="text-[10px] font-bold text-slate-500 mt-0.5">
          {formatMonth(event.startDate)}
        </div>
      </div>

      {/* Status badges — top left */}
      <div className="absolute top-5 left-5 flex flex-col gap-2">
        {!isExpired && event.isOpen && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-green-500/90 text-white backdrop-blur-sm shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            OPEN
          </span>
        )}
        {typeConf && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white backdrop-blur-sm shadow ${typeConf.bg}/80`}
          >
            <Zap className="w-3 h-3" />
            {typeConf.label}
          </span>
        )}
        {isMulti && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm border border-white/30">
            <Layers className="w-3 h-3" />
            Multi Pot
          </span>
        )}
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        {/* Phase promo banner */}
        {activePhase && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-amber-500/20 backdrop-blur-sm border border-amber-400/40 w-fit">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">
              {activePhase.name} — Potongan s/d{" "}
              {new Date(activePhase.endDate).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        )}

        <h3 className="text-2xl font-black text-white mb-2 leading-tight drop-shadow-md line-clamp-2">
          {event.name}
        </h3>

        <div className="flex items-center gap-2 text-white/80 mb-4">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-white/60" />
          <span className="text-sm font-medium truncate">
            {getVenueName(event.venue)}
          </span>
          <span className="text-white/40 mx-1">·</span>
          <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-white/60" />
          <span className="text-sm font-medium">
            {formatDateRange(event.startDate, event.endDate)}
          </span>
        </div>

        {/* Fee strip */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-white/60 text-xs font-medium">
              {isMulti ? "Mulai dari" : "Fee"}
            </span>
            {hasDiscount ? (
              <>
                <span className="text-white/40 text-sm line-through">
                  {formatCurrency(fees.base.player)}
                </span>
                <span className="text-2xl font-black text-white">
                  {formatCurrency(fees.player)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-black text-white">
                {formatCurrency(fees.player)}
              </span>
            )}
            <span className="text-white/60 text-xs">/orang</span>
          </div>

          <motion.div
            whileHover={{ x: 4 }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-black shadow-lg"
          >
            Daftar
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Event Card — Small ───────────────────────────────────────────────────────

function EventCardSmall({ event, index }: { event: EventItem; index: number }) {
  const router = useRouter();
  const isMulti =
    event.pricingMode === "multi" && (event.pots?.length ?? 0) > 0;
  const activePhase = getActivePhase(event.phases);
  const fees = getLowestFee(event);
  const hasDiscount = activePhase && fees.player !== fees.base.player;
  const typeConf = TYPE_MATCH_CONFIG[event.typeMatch ?? ""] ?? null;
  const isExpired = new Date(event.endDate) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.1 }}
      onClick={() => router.push(`/tournaments/${event.id}`)}
      className="group flex gap-4 bg-white rounded-2xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-lg cursor-pointer transition-all duration-300"
    >
      {/* Image */}
      <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white/40" />
          </div>
        )}
        {/* Date overlay */}
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
          <span className="text-[9px] font-black text-white/80 tracking-wider">
            {formatDay(event.startDate)}
          </span>
          <span className="text-xl font-black text-white leading-none">
            {formatDayNum(event.startDate)}
          </span>
          <span className="text-[9px] font-bold text-white/70">
            {formatMonth(event.startDate)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Badges row */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          {!isExpired && event.isOpen && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-green-100 text-green-700">
              <span className="w-1 h-1 rounded-full bg-green-500" />
              OPEN
            </span>
          )}
          {typeConf && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 ${typeConf.color}`}
            >
              {typeConf.label}
            </span>
          )}
          {isMulti && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-0.5">
              <Layers className="w-2.5 h-2.5" /> Multi Pot
            </span>
          )}
        </div>

        <h4 className="text-sm font-black text-slate-900 line-clamp-1 mb-1">
          {event.name}
        </h4>

        <div className="flex items-center gap-1 text-slate-500 text-xs mb-2">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{getVenueName(event.venue)}</span>
        </div>

        {/* Phase promo */}
        {activePhase && (
          <div className="flex items-center gap-1 mb-1.5">
            <Flame className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600">
              {activePhase.name} aktif
            </span>
          </div>
        )}

        {/* Fee */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            {hasDiscount && (
              <span className="text-[10px] text-slate-400 line-through">
                {formatCurrency(fees.base.player)}
              </span>
            )}
            <span className="text-sm font-black text-blue-600">
              {formatCurrency(fees.player)}
            </span>
            <span className="text-[10px] text-slate-400">/org</span>
          </div>
          <motion.span
            whileHover={{ x: 2 }}
            className="text-[10px] font-black text-blue-600 flex items-center gap-0.5"
          >
            Lihat <ChevronRight className="w-3 h-3" />
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Pot Info Chip ────────────────────────────────────────────────────────────

const POT_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
];

function PotChips({
  pots,
  activePhase,
}: {
  pots: Pot[];
  activePhase: Phase | null;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {pots.map((pot, i) => {
        const baseFee = pot.feePlayer;
        const effectiveFee = activePhase
          ? Math.max(0, baseFee - activePhase.feePlayer)
          : baseFee;
        const hasDiscount = effectiveFee !== baseFee;
        const color = POT_COLORS[i % POT_COLORS.length];
        return (
          <span
            key={pot.id}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold ${color}`}
          >
            <Tag className="w-2.5 h-2.5" />
            {pot.name}:{" "}
            {hasDiscount ? (
              <>
                <span className="line-through opacity-50">
                  {formatCurrency(baseFee)}
                </span>{" "}
                {formatCurrency(effectiveFee)}
              </>
            ) : (
              formatCurrency(baseFee)
            )}
          </span>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EventFeaturedGrid() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await adminService.getEvents();
        // Only open, max 3, sorted soonest first
        const open = (res ?? [])
          .filter(
            (e: EventItem) => e.isOpen && new Date(e.endDate) >= new Date(),
          )
          .sort(
            (a: EventItem, b: EventItem) =>
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
          )
          .slice(0, 3);
        setEvents(open);
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-10 bg-slate-200 rounded-full w-64 mx-auto mb-4 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded-full w-96 max-w-full mx-auto mb-12 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SkeletonCard large />
            </div>
            <div className="flex flex-col gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!events.length) return null;

  const [featured, ...rest] = events;
  const featuredPhase = getActivePhase(featured.phases);
  const isFeaturedMulti =
    featured.pricingMode === "multi" && (featured.pots?.length ?? 0) > 0;

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-4 uppercase tracking-widest">
            <Trophy className="w-3.5 h-3.5" />
            Turnamen & Event
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4 leading-tight">
            Event yang Sedang
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Buka Pendaftaran
            </span>
          </h2>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto font-medium">
            Daftarkan tim atau dirimu sekarang sebelum slot habis!
          </p>
        </motion.div>

        {/* Grid layout */}
        {events.length === 1 ? (
          // Single event — full width card
          <div className="max-w-3xl mx-auto">
            <EventCardLarge event={featured} index={0} />
            {/* Pot info below */}
            {isFeaturedMulti && featured.pots && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"
              >
                <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Harga per Pot
                </p>
                <PotChips pots={featured.pots} activePhase={featuredPhase} />
              </motion.div>
            )}
          </div>
        ) : events.length === 2 ? (
          // Two events — two large cards
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event, i) => (
              <EventCardLarge key={event.id} event={event} index={i} />
            ))}
          </div>
        ) : (
          // Three events — 1 large hero + 2 small sidebar
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Hero card */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <EventCardLarge event={featured} index={0} />

              {/* Pot chips for featured */}
              {isFeaturedMulti && featured.pots && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"
                >
                  <p className="text-xs font-bold text-slate-500 mb-2.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Harga per Pot
                    {featuredPhase
                      ? ` — setelah promo ${featuredPhase.name}`
                      : ""}
                  </p>
                  <PotChips pots={featured.pots} activePhase={featuredPhase} />
                </motion.div>
              )}
            </div>

            {/* Sidebar — smaller cards */}
            <div className="flex flex-col gap-4">
              {/* Decorative heading for sidebar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2"
              >
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Event Lainnya
                </span>
              </motion.div>

              {rest.map((event, i) => (
                <EventCardSmall key={event.id} event={event} index={i} />
              ))}

              {/* CTA card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                onClick={() => router.push("/tournaments")}
                className="group relative rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-br from-blue-600 to-indigo-700 p-5 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative">
                  <Trophy className="w-8 h-8 text-white/30 mb-3" />
                  <p className="text-white font-black text-base mb-1">
                    Lihat Semua Event
                  </p>
                  <p className="text-blue-200 text-xs font-medium mb-4">
                    Jangan lewatkan turnamen lainnya
                  </p>
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    Explore
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "easeInOut",
                      }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex flex-col items-center gap-3 mt-10 sm:mt-14"
        >
          <button
            onClick={() => router.push("/tournaments")}
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <Trophy className="w-4 h-4" />
            Lihat Semua Event
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-slate-400 text-xs font-medium">
            Turnamen, liga, dan event eksklusif tersedia
          </p>
        </motion.div>
      </div>
    </section>
  );
}
