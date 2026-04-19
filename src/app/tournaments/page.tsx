"use client";

import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Navbar from "@/components/organisms/Navbar";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { formatCurrency } from "@/lib/helper";
import { adminService } from "@/utils/admin";
import {
  Calendar,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Filter,
  Search,
  X,
  ArrowRight,
  Clock,
  Zap,
  Star,
  LockKeyhole,
  UnlockKeyhole,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type TypeMatch = "FOOTBALL" | "MINI-SOCCER" | "MINI-SOCCER-BEKASI" | "PADEL";

interface Event {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  feePlayer: number;
  feeGk: number;
  venue: string;
  isOpen: boolean;
  typeMatch?: TypeMatch;
  totalTeams?: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateShort = (dateStr: string) => {
  if (!dateStr) return { day: "-", month: "", year: "" };
  const date = new Date(dateStr);
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
    "Okt",
    "Nov",
    "Des",
  ];
  return {
    day: date.getDate(),
    month: months[date.getMonth()],
    year: date.getFullYear(),
  };
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

// ─── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
    <div className="flex flex-col sm:flex-row">
      <div className="w-full sm:w-52 h-48 sm:h-auto bg-slate-200 flex-shrink-0" />
      <div className="flex-1 p-5 space-y-3">
        <div className="h-6 bg-slate-200 rounded-lg w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-slate-200 rounded-lg w-24" />
          <div className="h-8 bg-slate-200 rounded-lg w-32" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Event Card ────────────────────────────────────────────────────────────────

const EventCard = ({
  event,
  onDetail,
}: {
  event: Event;
  onDetail: (id: string) => void;
}) => {
  const startInfo = formatDateShort(event.startDate);
  const endInfo = formatDateShort(event.endDate);
  const minFee = Math.min(event.feePlayer ?? 0, event.feeGk ?? 0);
  const typeLabel = TYPE_MATCH_LABEL[event.typeMatch ?? ""] ?? event.typeMatch;
  const typeColor =
    TYPE_MATCH_COLOR[event.typeMatch ?? ""] ??
    "bg-slate-50 text-slate-700 border-slate-200";

  const now = new Date();
  const end = new Date(event.endDate);
  const isExpired = end < now;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative w-full sm:w-52 h-48 sm:h-auto overflow-hidden flex-shrink-0">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center">
              <Trophy className="w-16 h-16 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            {isExpired ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 backdrop-blur-sm">
                <Clock className="w-3 h-3" />
                Selesai
              </span>
            ) : event.isOpen ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/90 text-white backdrop-blur-sm shadow-lg">
                <UnlockKeyhole className="w-3 h-3" />
                Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/90 text-white backdrop-blur-sm shadow-lg">
                <LockKeyhole className="w-3 h-3" />
                Upcoming
              </span>
            )}
          </div>

          {/* Date pill on image */}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-2.5 border border-white/20 flex items-center gap-2">
              <div className="text-center min-w-[36px]">
                <div className="text-xl font-bold text-white leading-none">
                  {startInfo.day}
                </div>
                <div className="text-[10px] text-white/80 font-medium">
                  {startInfo.month}
                </div>
              </div>
              <div className="w-px h-8 bg-white/30" />
              <div className="text-center min-w-[36px]">
                <div className="text-xl font-bold text-white leading-none">
                  {endInfo.day}
                </div>
                <div className="text-[10px] text-white/80 font-medium">
                  {endInfo.month}
                </div>
              </div>
              <div className="ml-1 text-[10px] text-white/70">
                {startInfo.year}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col">
          {/* Top */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                {event.name}
              </h3>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {event.typeMatch && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${typeColor}`}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  {typeLabel}
                </span>
              )}
              {event.totalTeams != null && event.totalTeams > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border bg-slate-50 text-slate-600 border-slate-200">
                  <Users className="w-3 h-3 mr-1" />
                  {event.totalTeams} tim
                </span>
              )}
            </div>

            {/* Info rows */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="truncate">{event.venue ?? "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>
                  {formatDate(event.startDate)}
                  {event.endDate !== event.startDate && (
                    <> &ndash; {formatDate(event.endDate)}</>
                  )}
                </span>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                {event.description}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3 flex-wrap">
            {/* Fee */}
            <div>
              <p className="text-[10px] text-slate-400 mb-0.5">Mulai dari</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(minFee)}
                </span>
                <span className="text-xs text-slate-400">/orang</span>
              </div>
            </div>

            {/* CTA */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => onDetail(event.id)}
              className="shadow-sm hover:shadow-md text-sm"
            >
              Lihat Event
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function EventPage() {
  const router = useRouter();
  const { showError } = useNotifications();

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedVenue, setSelectedVenue] = useState("All Venues");

  // Fetch
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const res = await adminService.getEvents();
        setEvents(res ?? []);
      } catch {
        showError("Gagal memuat", "Tidak dapat memuat data event");
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Filter options
  const typeOptions = useMemo(
    () => [
      "All Types",
      ...new Set(events.map((e) => e.typeMatch).filter(Boolean) as string[]),
    ],
    [events],
  );
  const venueOptions = useMemo(
    () => [
      "All Venues",
      ...new Set(events.map((e) => e.venue).filter(Boolean)),
    ],
    [events],
  );

  // Filtered list
  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchSearch =
        !searchQuery ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.venue ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchType =
        selectedType === "All Types" || e.typeMatch === selectedType;
      const matchVenue =
        selectedVenue === "All Venues" || e.venue === selectedVenue;
      const matchStatus =
        selectedStatus === "all" ||
        (selectedStatus === "open" && e.isOpen) ||
        (selectedStatus === "upcoming" && !e.isOpen);

      return matchSearch && matchType && matchVenue && matchStatus;
    });
  }, [events, searchQuery, selectedType, selectedVenue, selectedStatus]);

  // Stats
  const stats = useMemo(
    () => ({
      total: events.length,
      open: events.filter((e) => e.isOpen).length,
      upcoming: events.filter((e) => !e.isOpen).length,
    }),
    [events],
  );

  const hasActiveFilters =
    searchQuery ||
    selectedType !== "All Types" ||
    selectedVenue !== "All Venues" ||
    selectedStatus !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedType("All Types");
    setSelectedVenue("All Venues");
    setSelectedStatus("all");
  };

  const handleDetail = (id: string) => {
    router.push(`/tournaments/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar currentPage="" navigateTo={() => {}} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-24">
          <div className="h-10 bg-slate-200 rounded-xl w-56 animate-pulse mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar currentPage="" navigateTo={() => {}} />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-20 sm:py-24 mt-4 sm:mt-8">
        {/* ── Page Header ── */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Event & Tournament
            </h1>
          </div>
          <p className="text-sm text-slate-500 ml-12">
            Temukan dan ikuti event turnamen komunitas
          </p>
        </div>

        {/* ── Stats Strip ── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              label: "Total Event",
              value: stats.total,
              color: "text-blue-600",
              dot: "bg-blue-500",
            },
            {
              label: "Open",
              value: stats.open,
              color: "text-green-600",
              dot: "bg-green-500",
            },
            {
              label: "Upcoming",
              value: stats.upcoming,
              color: "text-indigo-600",
              dot: "bg-indigo-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`}
              />
              <div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 mb-6 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama event, venue, atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdowns row */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Status */}
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
              {[
                { value: "all", label: "Semua" },
                { value: "open", label: "Open" },
                { value: "upcoming", label: "Upcoming" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedStatus(opt.value)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedStatus === opt.value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            >
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {TYPE_MATCH_LABEL[t] ?? t}
                </option>
              ))}
            </select>

            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            >
              {venueOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium self-center">
                Filter aktif:
              </span>
              {searchQuery && (
                <Chip
                  label={`"${searchQuery}"`}
                  onRemove={() => setSearchQuery("")}
                />
              )}
              {selectedStatus !== "all" && (
                <Chip
                  label={selectedStatus === "open" ? "Open" : "Upcoming"}
                  onRemove={() => setSelectedStatus("all")}
                />
              )}
              {selectedType !== "All Types" && (
                <Chip
                  label={TYPE_MATCH_LABEL[selectedType] ?? selectedType}
                  onRemove={() => setSelectedType("All Types")}
                />
              )}
              {selectedVenue !== "All Venues" && (
                <Chip
                  label={selectedVenue}
                  onRemove={() => setSelectedVenue("All Venues")}
                />
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-500 hover:text-red-700 font-medium ml-1"
              >
                Hapus semua
              </button>
            </div>
          )}
        </div>

        {/* ── Results Count ── */}
        <div className="mb-4 text-sm text-slate-500">
          Menampilkan{" "}
          <span className="font-semibold text-slate-900">
            {filtered.length}
          </span>{" "}
          dari{" "}
          <span className="font-semibold text-slate-900">{events.length}</span>{" "}
          event
        </div>

        {/* ── Event List ── */}
        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} onDetail={handleDetail} />
            ))}
          </div>
        ) : (
          <div className="text-center py-14">
            <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Tidak ada event ditemukan
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                Coba ubah filter atau kata kunci pencarian
              </p>
              <Button
                variant="primary"
                onClick={clearAllFilters}
                className="shadow-md"
              >
                <Filter className="w-4 h-4 mr-2" />
                Reset Filter
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chip helper ───────────────────────────────────────────────────────────────

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
    >
      <span className="truncate max-w-[120px]">{label}</span>
      <X className="w-3 h-3 flex-shrink-0" />
    </button>
  );
}
