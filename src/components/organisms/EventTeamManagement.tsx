"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  Trophy,
  Users,
  Shield,
  User,
  MapPin,
  Calendar,
  ChevronRight,
  Layers,
  Tag,
  Phone,
  Mail,
  Hash,
  Shirt,
  AlertCircle,
  CheckCircle2,
  Circle,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Zap,
  Download,
  Lock,
  Unlock,
  X,
  Minus,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/atoms/Card";
import Badge from "@/components/atoms/Badge";
import { adminService } from "@/utils/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

type TypeMatch = "FOOTBALL" | "MINI-SOCCER" | "MINI-SOCCER-BEKASI" | "PADEL";
type ViewMode = "events" | "detail";

interface Pot {
  id: string;
  name: string;
  feePlayer: number;
  feeGk: number;
}

interface EventSummary {
  id: string;
  name: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  venue: { id: string; name: string } | string;
  isOpen: boolean;
  typeMatch?: TypeMatch;
  pricingMode?: "single" | "multi";
  pots?: Pot[];
  feePlayer: number;
  feeGk: number;
  teams?: TeamSummary[];
}

interface TeamSummary {
  id: string;
  name: string;
  imageUrl: string;
  potId?: string | null;
  availableGkSlots?: number;
  availablePlayerSlots?: number;
  slot?: {
    totalSlots: number;
    openSlots: number;
    bookedSlots: number;
    gkSlots: number;
    playerSlots: number;
  };
}

interface Player {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  jerseySize?: string;
  jerseyName?: string;
  jerseyNumber?: string;
  isGk: boolean;
  isPlayer: boolean;
  bookingId?: string;
  paymentStatus?: string;
}

interface TeamDetail {
  id: string;
  name: string;
  imageUrl: string;
  potId?: string | null;
  availableGkSlots?: number;
  availablePlayerSlots?: number;
  slot?: {
    totalSlots: number;
    openSlots: number;
    bookedSlots: number;
    gkSlots: number;
    playerSlots: number;
    lock_slot_gk?: number;
    lock_slot_player?: number;
  };
  players?: Player[];
}

interface TabProps {
  showError?: (title: string, message: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MATCH_SLOTS: Record<
  TypeMatch,
  { gk: number; player: number; total: number }
> = {
  FOOTBALL: { gk: 1, player: 10, total: 11 },
  "MINI-SOCCER": { gk: 1, player: 5, total: 6 },
  "MINI-SOCCER-BEKASI": { gk: 1, player: 6, total: 7 },
  PADEL: { gk: 0, player: 4, total: 4 },
};

const TYPE_MATCH_LABEL: Record<TypeMatch, string> = {
  FOOTBALL: "Football",
  "MINI-SOCCER": "Mini Soccer",
  "MINI-SOCCER-BEKASI": "Mini Soccer Bekasi",
  PADEL: "Padel",
};

const TYPE_MATCH_STYLE: Record<
  TypeMatch,
  { bg: string; text: string; dot: string }
> = {
  FOOTBALL: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  "MINI-SOCCER": { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  "MINI-SOCCER-BEKASI": {
    bg: "bg-violet-50",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
  PADEL: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
};

const POT_COLORS = [
  {
    border: "border-blue-200",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    header: "bg-blue-500",
  },
  {
    border: "border-purple-200",
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
    header: "bg-purple-500",
  },
  {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    header: "bg-emerald-500",
  },
  {
    border: "border-orange-200",
    bg: "bg-orange-50",
    text: "text-orange-700",
    dot: "bg-orange-500",
    header: "bg-orange-500",
  },
  {
    border: "border-rose-200",
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
    header: "bg-rose-500",
  },
];

const PAYMENT_STATUS_STYLE: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  PAID: { bg: "bg-green-100", text: "text-green-700", label: "Lunas" },
  PENDING: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
  UNPAID: { bg: "bg-red-100", text: "text-red-700", label: "Belum Bayar" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-500", label: "Batal" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

const formatDateShort = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      })
    : "-";

const getVenueName = (
  venue: { id: string; name: string } | string | undefined,
): string => {
  if (!venue) return "-";
  if (typeof venue === "string") return venue;
  return venue.name ?? "-";
};

const formatCurrency = (v: number) => `IDR ${v.toLocaleString("id-ID")}`;

const exportAllTeamsExcel = (
  teams: TeamDetail[],
  eventName: string,
  pots?: Pot[],
  typeMatch?: TypeMatch,
) => {
  import("xlsx").then((XLSX) => {
    const wb = XLSX.utils.book_new();
    const slotConfig = MATCH_SLOTS[typeMatch ?? "FOOTBALL"];
    const summaryRows: any[][] = [
      [`RINGKASAN EVENT: ${eventName.toUpperCase()}`],
      [],
      ["Tipe Pertandingan", typeMatch ? TYPE_MATCH_LABEL[typeMatch] : "-"],
      ["Total Tim", teams.length],
      [
        "Total Pemain Terdaftar",
        teams.reduce((s, t) => s + (t.players?.length ?? 0), 0),
      ],
      [
        "Tim Penuh",
        teams.filter((t) => (t.players?.length ?? 0) >= slotConfig.total)
          .length,
      ],
      [
        "Tim Belum Penuh",
        teams.filter((t) => (t.players?.length ?? 0) < slotConfig.total).length,
      ],
      [],
      [
        "NO",
        "NAMA TIM",
        "POT",
        "GK TERISI",
        "PLAYER TERISI",
        "TOTAL",
        "STATUS",
      ],
    ];

    teams.forEach((team, i) => {
      const potName = pots?.find((p) => p.id === team.potId)?.name ?? "-";
      const gk = (team.players ?? []).filter((p) => p.isGk).length;
      const pl = (team.players ?? []).filter((p) => !p.isGk).length;
      const total = (team.players ?? []).length;
      const isFull = total >= slotConfig.total;
      summaryRows.push([
        i + 1,
        team.name,
        potName,
        `${gk}/${slotConfig.gk}`,
        `${pl}/${slotConfig.player}`,
        `${total}/${slotConfig.total}`,
        isFull ? "✅ PENUH" : "⏳ BELUM PENUH",
      ]);
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary["!cols"] = [
      { wch: 5 },
      { wch: 30 },
      { wch: 15 },
      { wch: 12 },
      { wch: 14 },
      { wch: 10 },
      { wch: 16 },
    ];
    wsSummary["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

    teams.forEach((team) => {
      const potName = pots?.find((p) => p.id === team.potId)?.name ?? "-";
      const players = team.players ?? [];
      const sorted = [
        ...players.filter((p) => p.isGk),
        ...players.filter((p) => !p.isGk),
      ];
      const gkCount = players.filter((p) => p.isGk).length;
      const playerCount = players.filter((p) => !p.isGk).length;

      const rows: any[][] = [
        [`TIM: ${team.name.toUpperCase()}`],
        ["Pot", potName],
        [
          "Slot Terisi",
          `${players.length} / ${slotConfig.total} (GK: ${gkCount}/${slotConfig.gk}, Player: ${playerCount}/${slotConfig.player})`,
        ],
        [],
        [
          "NO",
          "POSISI",
          "NAMA PEMAIN",
          "JERSEY NAME",
          "JERSEY NO",
          "JERSEY SIZE",
          "NO. HP",
          "EMAIL",
          "STATUS BAYAR",
        ],
      ];

      if (sorted.length === 0) {
        rows.push([
          "-",
          "-",
          "(Belum ada pemain)",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
        ]);
      } else {
        sorted.forEach((p, i) => {
          const payLabel =
            PAYMENT_STATUS_STYLE[p.paymentStatus ?? ""]?.label ??
            (p.paymentStatus || "-");
          rows.push([
            i + 1,
            p.isGk ? "GK" : "Player",
            p.name || "-",
            p.jerseyName || "-",
            p.jerseyNumber || "-",
            p.jerseySize || "-",
            p.phone || "-",
            p.email || "-",
            payLabel,
          ]);
        });
      }

      const remaining = slotConfig.total - sorted.length;
      if (remaining > 0) {
        rows.push([]);
        for (let i = 0; i < remaining; i++) {
          rows.push([
            sorted.length + i + 1,
            i === 0 && slotConfig.gk > gkCount
              ? "GK (Kosong)"
              : "Player (Kosong)",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ]);
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [
        { wch: 5 },
        { wch: 12 },
        { wch: 28 },
        { wch: 18 },
        { wch: 10 },
        { wch: 12 },
        { wch: 16 },
        { wch: 28 },
        { wch: 14 },
      ];
      ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

      const sheetName = team.name
        .substring(0, 31)
        .replace(/[:\\/?\*\[\]]/g, "");
      XLSX.utils.book_append_sheet(
        wb,
        ws,
        sheetName || `Tim ${teams.indexOf(team) + 1}`,
      );
    });

    const safeName = eventName.replace(/[^a-zA-Z0-9_\-\s]/g, "").trim();
    XLSX.writeFile(wb, `${safeName}_data_tim.xlsx`);
  });
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
);

const EventCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <Skeleton className="h-36 w-full rounded-none" />
    <div className="p-4 space-y-2.5">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3.5 w-1/2" />
      <Skeleton className="h-3.5 w-2/3" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  </div>
);

const TeamDetailSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
      >
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((j) => (
            <Skeleton key={j} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ─── Empty States ─────────────────────────────────────────────────────────────

const EmptyState = ({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-slate-300" />
    </div>
    <p className="text-slate-600 font-semibold">{title}</p>
    {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
  </div>
);

// ─── Player Slot ──────────────────────────────────────────────────────────────

function PlayerSlot({
  player,
  slotIndex,
  isGk,
  isEmpty,
}: {
  player?: Player;
  slotIndex: number;
  isGk: boolean;
  isEmpty: boolean;
}) {
  const payStyle = player?.paymentStatus
    ? (PAYMENT_STATUS_STYLE[player.paymentStatus] ??
      PAYMENT_STATUS_STYLE.PENDING)
    : null;

  return (
    <div
      className={`relative rounded-xl border-2 p-3 transition-all ${
        isEmpty
          ? "border-dashed border-slate-200 bg-slate-50"
          : isGk
            ? "border-amber-200 bg-amber-50"
            : "border-blue-100 bg-white"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {isGk ? (
          <Shield className="w-3.5 h-3.5 text-amber-500" />
        ) : (
          <User className="w-3.5 h-3.5 text-blue-400" />
        )}
        <span
          className={`text-[10px] font-black uppercase tracking-wider ${isGk ? "text-amber-600" : "text-blue-500"}`}
        >
          {isGk ? "GK" : `P${slotIndex}`}
        </span>
        {!isEmpty && payStyle && (
          <span
            className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${payStyle.bg} ${payStyle.text}`}
          >
            {payStyle.label}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-2 gap-1">
          <Circle className="w-5 h-5 text-slate-300" />
          <span className="text-[10px] text-slate-400 font-medium">Kosong</span>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-800 truncate leading-tight">
            {player?.name || "-"}
          </p>
          {player?.jerseyName || player?.jerseyNumber ? (
            <p className="text-[10px] text-slate-500 font-mono uppercase truncate">
              {player.jerseyName}
              {player.jerseyNumber ? ` #${player.jerseyNumber}` : ""}
            </p>
          ) : null}
          {player?.jerseySize && (
            <span
              className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                isGk
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <Shirt className="w-2.5 h-2.5" />
              {player.jerseySize}
            </span>
          )}
          {player?.phone && (
            <p className="text-[10px] text-slate-400 truncate flex items-center gap-0.5">
              <Phone className="w-2.5 h-2.5" />
              {player.phone}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Lock Slot Inline Panel ───────────────────────────────────────────────────

function LockSlotPanel({
  team,
  slotConfig,
  onLock,
  onClose,
  isLoading,
}: {
  team: TeamDetail;
  slotConfig: { gk: number; player: number; total: number };
  onLock: (gk: number, player: number) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}) {
  const slot = team.slot;
  const bookedSlots = slot?.bookedSlots ?? 0;
  const lockedGk = slot?.lock_slot_gk ?? 0;
  const lockedPlayer = slot?.lock_slot_player ?? 0;
  const totalSlots = slot?.totalSlots ?? slotConfig.total;

  // Available to lock = total - booked - already locked
  const availableToLock = Math.max(
    0,
    totalSlots - bookedSlots - lockedGk - lockedPlayer,
  );
  const maxGk = Math.max(0, slotConfig.gk - lockedGk);
  const maxPlayer = Math.max(0, slotConfig.player - lockedPlayer);

  const [gkCount, setGkCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [isResetting, setIsResetting] = useState(false);

  const totalToLock = gkCount + playerCount;
  const canSubmit = totalToLock > 0 && !isLoading && !isResetting;
  const canReset =
    (lockedGk > 0 || lockedPlayer > 0) && !isLoading && !isResetting;

  const handleSubmit = async () => {
    await onLock(gkCount, playerCount);
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onLock(0, 0);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="mx-5 mb-5 rounded-2xl border-2 border-blue-200 bg-blue-50 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-200 bg-blue-100/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-200 flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-blue-700" />
          </div>
          <span className="text-sm font-black text-blue-800">Lock Slots</span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg hover:bg-blue-200 flex items-center justify-center transition-colors"
          disabled={isLoading}
        >
          <X className="w-3.5 h-3.5 text-blue-400" />
        </button>
      </div>

      {/* Slot status summary */}
      <div className="px-4 py-3 grid grid-cols-4 gap-2 border-b border-blue-200">
        {[
          { label: "Total", value: totalSlots, color: "text-slate-700" },
          { label: "Booked", value: bookedSlots, color: "text-blue-600" },
          { label: "Locked GK", value: lockedGk, color: "text-amber-600" },
          {
            label: "Locked Player",
            value: lockedPlayer,
            color: "text-violet-600",
          },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Available notice */}
      <div className="px-4 py-2.5 flex items-center gap-2 bg-blue-100/40 border-b border-blue-200">
        {availableToLock === 0 ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-amber-700 font-medium">
              Semua slot sudah terkunci atau terisi
            </span>
          </>
        ) : (
          <>
            <Unlock className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
            <span className="text-xs text-slate-600 font-medium">
              <span className="text-green-700 font-bold">
                {availableToLock} slot
              </span>{" "}
              tersedia untuk dikunci
            </span>
          </>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 space-y-3">
        {/* GK counter */}
        {slotConfig.gk > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">GK Slots</p>
                <p className="text-[11px] text-slate-400">
                  Max {maxGk} tersedia
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGkCount(Math.max(0, gkCount - 1))}
                disabled={gkCount === 0 || isLoading || availableToLock === 0}
                className="w-8 h-8 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
              >
                <Minus className="w-3.5 h-3.5 text-slate-600" />
              </button>
              <span className="w-8 text-center text-lg font-black text-slate-800">
                {gkCount}
              </span>
              <button
                onClick={() => setGkCount(Math.min(maxGk, gkCount + 1))}
                disabled={
                  gkCount >= maxGk || isLoading || availableToLock === 0
                }
                className="w-8 h-8 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          </div>
        )}

        {/* Player counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Player Slots</p>
              <p className="text-[11px] text-slate-400">
                Max {maxPlayer} tersedia
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPlayerCount(Math.max(0, playerCount - 1))}
              disabled={playerCount === 0 || isLoading || availableToLock === 0}
              className="w-8 h-8 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
            >
              <Minus className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <span className="w-8 text-center text-lg font-black text-slate-800">
              {playerCount}
            </span>
            <button
              onClick={() =>
                setPlayerCount(Math.min(maxPlayer, playerCount + 1))
              }
              disabled={
                playerCount >= maxPlayer || isLoading || availableToLock === 0
              }
              className="w-8 h-8 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-1 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isLoading || isResetting}
              className="flex-1 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-semibold text-slate-500 hover:bg-blue-50 disabled:opacity-40 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || availableToLock === 0}
              className="flex-[2] py-2.5 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-blue-300 border-t-white animate-spin" />
                  <span>Mengunci...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    Kunci {totalToLock > 0 ? `${totalToLock} ` : ""}Slot
                  </span>
                </>
              )}
            </button>
          </div>
          {canReset && (
            <button
              onClick={handleReset}
              disabled={!canReset}
              className="w-full py-2 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-500 hover:bg-red-100 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
            >
              {isResetting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-red-300 border-t-red-500 animate-spin" />
                  <span>Mereset...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3" />
                  <span>Reset Semua Lock ({lockedGk + lockedPlayer} slot)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Team Detail Card ─────────────────────────────────────────────────────────

function TeamDetailCard({
  team,
  typeMatch,
  pots,
  pricingMode,
  showError,
  onLockSuccess,
}: {
  team: TeamDetail;
  typeMatch?: TypeMatch;
  pots?: Pot[];
  pricingMode?: "single" | "multi";
  showError?: (title: string, message: string) => void;
  onLockSuccess?: (teamId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showLockPanel, setShowLockPanel] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [lockSuccess, setLockSuccess] = useState(false);

  const slotConfig = MATCH_SLOTS[typeMatch ?? "FOOTBALL"];
  const isMulti = pricingMode === "multi" && pots && pots.length > 0;

  const assignedPot =
    isMulti && team.potId ? pots!.find((p) => p.id === team.potId) : null;
  const potIndex = assignedPot
    ? pots!.findIndex((p) => p.id === team.potId)
    : -1;
  const potStyle =
    potIndex >= 0 ? POT_COLORS[potIndex % POT_COLORS.length] : null;

  const players = team.players ?? [];
  const gkPlayers = players.filter((p) => p.isGk);
  const fieldPlayers = players.filter((p) => !p.isGk);

  const filledGk =
    team.availableGkSlots !== undefined
      ? slotConfig.gk - team.availableGkSlots
      : gkPlayers.length;
  const filledPlayer =
    team.availablePlayerSlots !== undefined
      ? slotConfig.player - team.availablePlayerSlots
      : fieldPlayers.length;
  const totalFilled = filledGk + filledPlayer;
  const fillPercent =
    slotConfig.total > 0
      ? Math.round((totalFilled / slotConfig.total) * 100)
      : 0;
  const isFull = totalFilled >= slotConfig.total;

  const lockedGk = team.slot?.lock_slot_gk ?? 0;
  const lockedPlayer = team.slot?.lock_slot_player ?? 0;
  const totalLocked = lockedGk + lockedPlayer;
  const hasLocked = totalLocked > 0;

  const handleLock = async (gk: number, player: number) => {
    setIsLocking(true);
    try {
      await adminService.lockSlotsEvent(team.id, gk, player);
      setLockSuccess(true);
      setShowLockPanel(false);
      onLockSuccess?.(team.id);
      // Reset success indicator after 3s
      setTimeout(() => setLockSuccess(false), 3000);
    } catch (err: any) {
      showError?.("Gagal Lock Slot", err.message ?? "Terjadi kesalahan");
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md ${
        showLockPanel
          ? "border-blue-400"
          : potStyle
            ? `${potStyle.border}`
            : "border-slate-200"
      }`}
    >
      {/* Card Header */}
      <div
        className={`px-5 py-4 flex items-center gap-4 cursor-pointer ${
          potStyle ? `${potStyle.bg}` : "bg-slate-50"
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Team logo */}
        <div className="relative flex-shrink-0">
          {team.imageUrl ? (
            <img
              src={team.imageUrl}
              alt={team.name}
              className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow"
            />
          ) : (
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 border-white shadow ${potStyle ? potStyle.bg : "bg-slate-200"}`}
            >
              <Trophy
                className={`w-6 h-6 ${potStyle ? potStyle.text : "text-slate-400"}`}
              />
            </div>
          )}
          {isFull && (
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Team info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base font-black text-slate-900 truncate">
              {team.name}
            </h3>
            {assignedPot && potStyle && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${potStyle.bg} ${potStyle.text} ${potStyle.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${potStyle.dot}`} />
                {assignedPot.name}
              </span>
            )}
            {/* Lock badge */}
            {hasLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold bg-blue-50 text-blue-700 border-blue-200">
                <Lock className="w-2.5 h-2.5" />
                {totalLocked} Terkunci
              </span>
            )}
            {/* Success flash */}
            {lockSuccess && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700 animate-pulse">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Berhasil dikunci
              </span>
            )}
          </div>

          {/* Slot stats row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Shield className="w-3 h-3 text-amber-500" />
              <span>
                GK:{" "}
                <strong
                  className={
                    filledGk >= slotConfig.gk
                      ? "text-green-600"
                      : "text-slate-700"
                  }
                >
                  {filledGk}
                </strong>
                <span className="text-slate-400">/{slotConfig.gk}</span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <User className="w-3 h-3 text-blue-400" />
              <span>
                Player:{" "}
                <strong
                  className={
                    filledPlayer >= slotConfig.player
                      ? "text-green-600"
                      : "text-slate-700"
                  }
                >
                  {filledPlayer}
                </strong>
                <span className="text-slate-400">/{slotConfig.player}</span>
              </span>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isFull
                  ? "bg-green-100 text-green-700"
                  : fillPercent > 50
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-50 text-red-500"
              }`}
            >
              {totalFilled}/{slotConfig.total} terisi
            </span>
          </div>
        </div>

        {/* Right side: fill % + lock button + chevron */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {/* Lock slot button — stops click propagation so card doesn't toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLockPanel((v) => !v);
                if (!expanded) setExpanded(true);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                showLockPanel
                  ? "bg-blue-600 text-white border-blue-600"
                  : hasLocked
                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {showLockPanel ? (
                <X className="w-3 h-3" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
              {showLockPanel ? "Tutup" : "Lock Slot"}
            </button>
          </div>

          <div className="text-right">
            <span
              className={`text-lg font-black ${isFull ? "text-green-600" : "text-slate-700"}`}
            >
              {fillPercent}%
            </span>
          </div>
          <div className="w-20 bg-slate-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${isFull ? "bg-green-500" : "bg-blue-500"}`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          <div
            className={`transition-transform duration-200 ${expanded ? "rotate-90" : "rotate-0"}`}
          >
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Lock Slot Panel — inline, dark style */}
      {showLockPanel && (
        <LockSlotPanel
          team={team}
          slotConfig={slotConfig}
          onLock={handleLock}
          onClose={() => setShowLockPanel(false)}
          isLoading={isLocking}
        />
      )}

      {/* Expanded: Player Grid */}
      {expanded && (
        <div className="px-5 pb-5 pt-4 space-y-4">
          {/* GK row */}
          {slotConfig.gk > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-200">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs font-black text-amber-700 uppercase tracking-wide">
                    Goalkeeper
                  </span>
                </div>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div
                className={`grid gap-2 ${slotConfig.gk === 1 ? "grid-cols-1 max-w-[200px]" : "grid-cols-2"}`}
              >
                {Array.from({ length: slotConfig.gk }).map((_, i) => (
                  <PlayerSlot
                    key={`gk-${i}`}
                    player={gkPlayers[i]}
                    slotIndex={i}
                    isGk
                    isEmpty={!gkPlayers[i]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Field players grid */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-black text-blue-700 uppercase tracking-wide">
                  Field Players
                </span>
              </div>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {Array.from({ length: slotConfig.player }).map((_, i) => (
                <PlayerSlot
                  key={`player-${i}`}
                  player={fieldPlayers[i]}
                  slotIndex={i + 1}
                  isGk={false}
                  isEmpty={!fieldPlayers[i]}
                />
              ))}
            </div>
          </div>

          {/* Player full detail table */}
          {players.length > 0 && (
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700 select-none py-1">
                <List className="w-3.5 h-3.5" />
                Lihat detail lengkap ({players.length} pemain)
                <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform ml-auto" />
              </summary>
              <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500">
                        #
                      </th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500">
                        Nama
                      </th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500">
                        Posisi
                      </th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500">
                        Jersey
                      </th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500">
                        Kontak
                      </th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {players.map((p, i) => {
                      const payStyle = p.paymentStatus
                        ? (PAYMENT_STATUS_STYLE[p.paymentStatus] ??
                          PAYMENT_STATUS_STYLE.PENDING)
                        : null;
                      return (
                        <tr
                          key={p.id ?? i}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-3 py-2.5 text-slate-400 font-medium">
                            {i + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-semibold text-slate-800">
                              {p.name || "-"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            {p.isGk ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                                <Shield className="w-2.5 h-2.5" /> GK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">
                                <User className="w-2.5 h-2.5" /> Player
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">
                            {p.jerseyName && (
                              <span className="font-mono uppercase">
                                {p.jerseyName}
                              </span>
                            )}
                            {p.jerseyNumber && (
                              <span className="text-slate-400 ml-1">
                                #{p.jerseyNumber}
                              </span>
                            )}
                            {p.jerseySize && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-semibold">
                                {p.jerseySize}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {p.phone && (
                              <div className="flex items-center gap-1 text-slate-500">
                                <Phone className="w-2.5 h-2.5" />
                                {p.phone}
                              </div>
                            )}
                            {p.email && (
                              <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                                <Mail className="w-2.5 h-2.5" />
                                {p.email}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {payStyle ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${payStyle.bg} ${payStyle.text}`}
                              >
                                {payStyle.label}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Event List View ──────────────────────────────────────────────────────────

function EventListView({
  onSelectEvent,
  showError,
}: {
  onSelectEvent: (event: EventSummary) => void;
  showError?: (title: string, message: string) => void;
}) {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "closed">(
    "all",
  );

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await adminService.getEvents();
        setEvents(res ?? []);
      } catch (err: any) {
        showError?.("Error", err.message ?? "Gagal memuat data event");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [showError]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchSearch =
        !searchTerm ||
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getVenueName(e.venue).toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "open" && e.isOpen) ||
        (filterStatus === "closed" && !e.isOpen);
      return matchSearch && matchStatus;
    });
  }, [events, searchTerm, filterStatus]);

  const totalTeams = events.reduce((s, e) => s + (e.teams?.length ?? 0), 0);
  const stats = [
    {
      label: "Total Event",
      value: events.length,
      icon: Trophy,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Event Open",
      value: events.filter((e) => e.isOpen).length,
      icon: CheckCircle2,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Total Tim",
      value: totalTeams,
      icon: Users,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Kelola Tim</h2>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Pilih event untuk melihat daftar tim dan pemain
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">
                    {s.label}
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">
                    {isLoading ? "-" : s.value}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama event atau venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "open", "closed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    filterStatus === f
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {f === "all" ? "Semua" : f === "open" ? "Open" : "Closed"}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Tidak ada event ditemukan"
          subtitle="Coba ubah filter pencarian"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event, i) => {
            const typeConf = TYPE_MATCH_STYLE[event.typeMatch ?? "FOOTBALL"];
            const typeLabel = event.typeMatch
              ? TYPE_MATCH_LABEL[event.typeMatch]
              : "-";
            const isExpired = new Date(event.endDate) < new Date();
            const teamCount = event.teams?.length ?? 0;
            const isMulti =
              event.pricingMode === "multi" && (event.pots?.length ?? 0) > 0;

            return (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="group text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="relative h-36 overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Trophy className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3">
                    {isExpired ? (
                      <span className="px-2 py-1 rounded-full text-[10px] font-black bg-slate-700/80 text-slate-300 backdrop-blur-sm">
                        Selesai
                      </span>
                    ) : event.isOpen ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black bg-green-500/90 text-white backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        OPEN
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-[10px] font-black bg-blue-500/90 text-white backdrop-blur-sm">
                        Upcoming
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow">
                    <Users className="w-3 h-3 text-slate-600" />
                    <span className="text-[11px] font-black text-slate-700">
                      {teamCount} Tim
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="text-xs font-semibold opacity-80">
                      {formatDateShort(event.startDate)}
                      {event.endDate !== event.startDate
                        ? ` – ${formatDateShort(event.endDate)}`
                        : ""}
                    </p>
                  </div>
                  <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/40 transition-colors">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-black text-slate-900 mb-1.5 line-clamp-1">
                    {event.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      {getVenueName(event.venue)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {event.typeMatch && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${typeConf.bg} ${typeConf.text}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${typeConf.dot}`}
                        />
                        {typeLabel}
                      </span>
                    )}
                    {isMulti && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
                        <Layers className="w-2.5 h-2.5" />
                        {event.pots?.length} Pot
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Event Detail View ────────────────────────────────────────────────────────

function EventDetailView({
  event,
  onBack,
  showError,
}: {
  event: EventSummary;
  onBack: () => void;
  showError?: (title: string, message: string) => void;
}) {
  const [teams, setTeams] = useState<TeamDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTeam, setSearchTeam] = useState("");
  const [filterPot, setFilterPot] = useState<string>("all");

  const isMulti =
    event.pricingMode === "multi" && (event.pots?.length ?? 0) > 0;
  const slotConfig = MATCH_SLOTS[event.typeMatch ?? "FOOTBALL"];
  const typeConf = TYPE_MATCH_STYLE[event.typeMatch ?? "FOOTBALL"];
  const typeLabel = event.typeMatch ? TYPE_MATCH_LABEL[event.typeMatch] : "-";

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const detail = await adminService.getEventDetail(event.id);
      const rawTeams: TeamDetail[] = (detail.teams ?? []).map((t: any) => ({
        id: t.id,
        name: t.name?.trim() ?? "",
        imageUrl: t.imageUrl ?? "",
        potId: t.potId ?? null,
        availableGkSlots: t.availableGkSlots,
        availablePlayerSlots: t.availablePlayerSlots,
        slot: t.slot,
        players: (t.players ?? t.bookings ?? []).map((b: any) => ({
          id: b.id ?? b.bookingId,
          name: b.name ?? b.playerName ?? "",
          phone: b.phone ?? b.phoneNumber ?? "",
          email: b.email ?? "",
          jerseySize: b.jerseySize ?? "",
          jerseyName: b.jerseyName ?? "",
          jerseyNumber: b.jerseyNumber ?? "",
          isGk: b.isGk ?? false,
          isPlayer: b.isPlayer ?? !b.isGk,
          bookingId: b.bookingId ?? b.id,
          paymentStatus: b.paymentStatus ?? b.status ?? "",
        })),
      }));
      setTeams(rawTeams);
    } catch (err: any) {
      showError?.("Error", err.message ?? "Gagal memuat detail event");
    } finally {
      setIsLoading(false);
    }
  }, [event.id, showError]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // Refresh a single team's slot data after lock
  const handleLockSuccess = useCallback(
    async (teamId: string) => {
      // Re-fetch to get updated slot data
      await loadTeams();
    },
    [loadTeams],
  );

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const matchSearch =
        !searchTeam || t.name.toLowerCase().includes(searchTeam.toLowerCase());
      const matchPot = filterPot === "all" || t.potId === filterPot;
      return matchSearch && matchPot;
    });
  }, [teams, searchTeam, filterPot]);

  const totalPlayers = teams.reduce((s, t) => s + (t.players?.length ?? 0), 0);
  const totalSlots = teams.length * slotConfig.total;
  const fillPct =
    totalSlots > 0 ? Math.round((totalPlayers / totalSlots) * 100) : 0;
  const fullTeams = teams.filter(
    (t) => (t.players?.length ?? 0) >= slotConfig.total,
  ).length;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke daftar event
      </button>

      {/* Event Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl">
        {event.imageUrl && (
          <>
            <img
              src={event.imageUrl}
              alt={event.name}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
          </>
        )}
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {event.isOpen ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-green-500/90 text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                OPEN
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/80 text-white">
                Upcoming
              </span>
            )}
            {event.typeMatch && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${typeConf.bg} ${typeConf.text}`}
              >
                <Zap className="w-3 h-3" />
                {typeLabel}
              </span>
            )}
            {isMulti && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                <Layers className="w-3 h-3" />
                Multi Pot
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
            {event.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{getVenueName(event.venue)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {formatDateShort(event.startDate)}
                {event.endDate !== event.startDate
                  ? ` – ${formatDateShort(event.endDate)}`
                  : ""}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>
                {teams.length} Tim · {slotConfig.total} slot/tim
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Tim",
            value: teams.length,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Tim Full",
            value: fullTeams,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Total Pemain",
            value: totalPlayers,
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            label: "Fill Rate",
            value: `${fillPct}%`,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl ${s.bg} p-4`}>
            <p className="text-xs font-semibold text-slate-500">{s.label}</p>
            <p className={`text-2xl font-black ${s.color} mt-0.5`}>
              {isLoading ? "-" : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Slot config info */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-semibold text-slate-500">
          Konfigurasi slot per tim:
        </span>
        {slotConfig.gk > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-xs font-bold">
            <Shield className="w-3 h-3" /> {slotConfig.gk} GK
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-bold">
          <User className="w-3 h-3" /> {slotConfig.player} Player
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 text-xs font-bold">
          <Users className="w-3 h-3" /> {slotConfig.total} Total
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama tim..."
            value={searchTeam}
            onChange={(e) => setSearchTeam(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
          />
        </div>
        {isMulti && event.pots && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterPot("all")}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${filterPot === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
            >
              Semua Pot
            </button>
            {event.pots.map((pot, pi) => {
              const potStyle = POT_COLORS[pi % POT_COLORS.length];
              return (
                <button
                  key={pot.id}
                  onClick={() => setFilterPot(pot.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    filterPot === pot.id
                      ? `${potStyle.bg} ${potStyle.text} ${potStyle.border} shadow-sm`
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${potStyle.dot}`} />
                  {pot.name}
                  <span className="opacity-60">
                    ({teams.filter((t) => t.potId === pot.id).length})
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <button
          onClick={() =>
            exportAllTeamsExcel(teams, event.name, event.pots, event.typeMatch)
          }
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Semua Tim
        </button>
      </div>

      {/* Team cards */}
      {isLoading ? (
        <TeamDetailSkeleton />
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Tidak ada tim ditemukan"
          subtitle="Coba ubah filter pencarian"
        />
      ) : (
        <div className="space-y-4">
          {filteredTeams.map((team) => (
            <TeamDetailCard
              key={team.id}
              team={team}
              typeMatch={event.typeMatch}
              pots={event.pots}
              pricingMode={event.pricingMode}
              showError={showError}
              onLockSuccess={handleLockSuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function TeamManagementTab({ showError }: TabProps) {
  const [view, setView] = useState<ViewMode>("events");
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);

  const handleSelectEvent = useCallback((event: EventSummary) => {
    setSelectedEvent(event);
    setView("detail");
  }, []);

  const handleBack = useCallback(() => {
    setSelectedEvent(null);
    setView("events");
  }, []);

  if (view === "detail" && selectedEvent) {
    return (
      <EventDetailView
        event={selectedEvent}
        onBack={handleBack}
        showError={showError}
      />
    );
  }

  return (
    <EventListView onSelectEvent={handleSelectEvent} showError={showError} />
  );
}
