"use client";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Clock,
  User,
  Mail,
  Phone,
  Shield,
  Users,
  Tag,
  X,
  Shirt,
  Plus,
  Zap,
  Package,
  ChevronDown,
  CheckCircle2,
  Trophy,
  Star,
  ArrowLeft,
  Hash,
  Layers,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Navbar from "@/components/organisms/Navbar";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { useAuth } from "@/contexts/AuthContext";
import { adminService } from "@/utils/admin";
import { QRISPaymentPage } from "@/components/organisms/QRISPayment";
import { voucherService } from "@/utils/voucher";
import PaymentSuccessModal from "@/components/molecules/SuccessPaymentModal";
import { bookingService } from "@/utils/booking";
import { bookingEventReq } from "@/types/booking";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const noSpace = (value: string) => value.replace(/\s{2,}/g, " ").slice(0, 100);
const onlyNumbers = (value: string) => value.replace(/\D/g, "").slice(0, 20);
const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone: string) =>
  /^[0-9]+$/.test(phone) && phone.length >= 10;
const validateName = (value: string) => value.trim().length > 0;

const JERSEY_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];

const JERSEY_SURCHARGE: Record<string, number> = {
  "2XL": 20_000,
  "3XL": 20_000,
  "4XL": 40_000,
};

const getJerseySurcharge = (size: string): number =>
  JERSEY_SURCHARGE[size] ?? 0;

const formatCurrency = (v: number) => `IDR ${v.toLocaleString("id-ID")}`;
const formatDateShort = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const getVenueName = (
  venue: { id: string; name: string } | string | undefined,
) => {
  if (!venue) return "-";
  if (typeof venue === "string") return venue;
  return venue.name ?? "-";
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SlotRole = "goalkeeper" | "player" | null;
type PricingMode = "single" | "multi";

interface IndividualSlot {
  role: SlotRole;
  name: string;
  jerseySize: string;
  jerseyName: string;
  jerseyNumber: string;
  phone: string;
  email?: string;
}

interface AddOn {
  id?: string;
  name: string;
  price: number;
  stock?: number;
  maxPerBooking: number;
  isActive: boolean;
}

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
  slot?: TeamSlot;
  availableGkSlots?: number;
  availablePlayerSlots?: number;
  potId?: string | null;
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
  startDate: string;
  endDate: string;
  feePlayer: number;
  feeGk: number;
  venue: { id: string; name: string } | string;
  isOpen: boolean;
  typeMatch?: string;
  pricingMode?: PricingMode;
  pots?: Pot[];
  teams?: Team[];
  addOn?: AddOn[];
  phases?: Phase[];
  canRegistTeam?: boolean;
}

interface RosterPlayer {
  name: string;
  phone: string;
  email: string;
  jerseySize: string;
  jerseyName: string;
  jerseyNumber: string;
  isGk: boolean;
}

// ─── Pot color helpers ────────────────────────────────────────────────────────

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

// ─── Active phase helper ───────────────────────────────────────────────────────

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

const resolveTeamFee = (
  team: Team | null,
  pots: Pot[],
  pricingMode: PricingMode,
  eventFeePlayer: number,
  eventFeeGk: number,
  activePhase: Phase | null,
): {
  feePlayer: number;
  feeGk: number;
  baseFeePlayer: number;
  baseFeeGk: number;
  pot: Pot | null;
} => {
  let baseFeePlayer = eventFeePlayer;
  let baseFeeGk = eventFeeGk;
  let pot: Pot | null = null;

  if (pricingMode === "multi" && team?.potId) {
    const found = pots.find((p) => p.id === team.potId) ?? null;
    if (found) {
      pot = found;
      baseFeePlayer = found.feePlayer;
      baseFeeGk = found.feeGk;
    }
  }

  const feePlayer = activePhase
    ? Math.max(0, baseFeePlayer - activePhase.feePlayer)
    : baseFeePlayer;
  const feeGk = activePhase
    ? Math.max(0, baseFeeGk - activePhase.feeGk)
    : baseFeeGk;

  return { feePlayer, feeGk, baseFeePlayer, baseFeeGk, pot };
};

const calcPartialDiscount = (
  phase: Phase | null,
  gkQty: number,
  playerQty: number,
): {
  discountedGk: number;
  discountedPlayer: number;
  normalGk: number;
  normalPlayer: number;
  remainingGkQuota: number | null;
  remainingPlayerQuota: number | null;
} => {
  if (!phase) {
    return {
      discountedGk: 0,
      discountedPlayer: 0,
      normalGk: gkQty,
      normalPlayer: playerQty,
      remainingGkQuota: null,
      remainingPlayerQuota: null,
    };
  }

  const remGk =
    (phase.quotaGk ?? 0) > 0
      ? Math.max(0, (phase.quotaGk ?? 0) - (phase.usedQuotaGk ?? 0))
      : null;

  const remPlayer =
    (phase.quotaPlayer ?? 0) > 0
      ? Math.max(0, (phase.quotaPlayer ?? 0) - (phase.usedQuotaPlayer ?? 0))
      : null;

  const discountedGk = remGk === null ? gkQty : Math.min(gkQty, remGk);
  const discountedPlayer =
    remPlayer === null ? playerQty : Math.min(playerQty, remPlayer);

  return {
    discountedGk,
    discountedPlayer,
    normalGk: gkQty - discountedGk,
    normalPlayer: playerQty - discountedPlayer,
    remainingGkQuota: remGk,
    remainingPlayerQuota: remPlayer,
  };
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: Phase }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl"
    >
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100">
        <Zap className="w-3.5 h-3.5 text-amber-600" />
      </div>
      <div>
        <p className="text-xs font-bold text-amber-700 leading-none">
          {phase.name} aktif — berlaku sebagai potongan harga
        </p>
        <p className="text-[11px] text-amber-600 mt-0.5">
          s/d {formatDateShort(phase.endDate)}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
        <span className="text-xs font-bold text-amber-700">Promo</span>
      </div>
    </motion.div>
  );
}

function PhaseQuotaInfo({
  phase,
  discountedGk,
  discountedPlayer,
  normalGk,
  normalPlayer,
  remainingGkQuota,
  remainingPlayerQuota,
  effectiveFeeGk,
  effectiveFeePlayer,
  baseFeeGk,
  baseFeePlayer,
}: {
  phase: Phase;
  discountedGk: number;
  discountedPlayer: number;
  normalGk: number;
  normalPlayer: number;
  remainingGkQuota: number | null;
  remainingPlayerQuota: number | null;
  effectiveFeeGk: number;
  effectiveFeePlayer: number;
  baseFeeGk: number;
  baseFeePlayer: number;
}) {
  const hasAnySelected =
    discountedGk + discountedPlayer + normalGk + normalPlayer > 0;
  const hasPartial =
    (normalGk > 0 || normalPlayer > 0) &&
    (discountedGk > 0 || discountedPlayer > 0);
  const allNormal =
    discountedGk === 0 && discountedPlayer === 0 && hasAnySelected;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-amber-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-bold text-amber-800">{phase.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {remainingPlayerQuota !== null ? (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">
                Sisa kuota player:{" "}
                <strong
                  className={
                    remainingPlayerQuota <= 3
                      ? "text-red-600"
                      : "text-amber-800"
                  }
                >
                  {remainingPlayerQuota}
                </strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs text-amber-600">Player: unlimited</span>
            </div>
          )}
          {remainingGkQuota !== null ? (
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">
                GK:{" "}
                <strong
                  className={
                    remainingGkQuota <= 1 ? "text-red-600" : "text-amber-800"
                  }
                >
                  {remainingGkQuota}
                </strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs text-amber-600">GK: unlimited</span>
            </div>
          )}
        </div>
      </div>

      {hasAnySelected && (
        <div className="px-4 py-3 space-y-2">
          {discountedGk > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <span className="text-green-700 font-medium">
                  {discountedGk}x GK dapat {phase.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 line-through mr-1">
                  {formatCurrency(baseFeeGk)}
                </span>
                <span className="text-sm font-bold text-green-700">
                  {formatCurrency(effectiveFeeGk)}
                </span>
              </div>
            </div>
          )}
          {discountedPlayer > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <span className="text-green-700 font-medium">
                  {discountedPlayer}x Player dapat {phase.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 line-through mr-1">
                  {formatCurrency(baseFeePlayer)}
                </span>
                <span className="text-sm font-bold text-green-700">
                  {formatCurrency(effectiveFeePlayer)}
                </span>
              </div>
            </div>
          )}
          {normalGk > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-300 text-white flex items-center justify-center text-[10px] font-bold">
                  −
                </span>
                <span className="text-gray-600">
                  {normalGk}x GK harga normal
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {formatCurrency(baseFeeGk)}
              </span>
            </div>
          )}
          {normalPlayer > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-300 text-white flex items-center justify-center text-[10px] font-bold">
                  −
                </span>
                <span className="text-gray-600">
                  {normalPlayer}x Player harga normal
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {formatCurrency(baseFeePlayer)}
              </span>
            </div>
          )}
          {hasPartial && (
            <div className="mt-2 pt-2 border-t border-amber-200">
              <p className="text-[11px] text-amber-700">
                ⚡ Kuota {phase.name} tidak cukup untuk semua slot —{" "}
                {discountedGk + discountedPlayer} slot pertama dapat promo,
                sisanya harga normal.
              </p>
            </div>
          )}
          {allNormal && (
            <div className="mt-2 pt-2 border-t border-amber-200">
              <p className="text-[11px] text-red-600 font-medium">
                ⚠ Kuota {phase.name} sudah habis — semua slot akan dikenakan
                harga normal.
              </p>
            </div>
          )}
        </div>
      )}

      {!hasAnySelected && (
        <div className="px-4 py-3">
          <p className="text-xs text-amber-600">
            Pilih posisi & jumlah slot untuk melihat rincian promo yang berlaku.
          </p>
        </div>
      )}
    </motion.div>
  );
}

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

function JerseySurchargeNote({ size }: { size: string }) {
  const surcharge = getJerseySurcharge(size);
  if (!surcharge) return null;
  return (
    <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
      <Zap className="w-3 h-3" />
      Ukuran {size}: tambahan biaya {formatCurrency(surcharge)}
    </p>
  );
}

function AddOnSelector({
  addOns,
  selected,
  onChange,
}: {
  addOns: AddOn[];
  selected: Record<string, number>;
  onChange: (id: string, qty: number) => void;
}) {
  const activeAddOns = addOns.filter((a) => a.isActive);
  if (!activeAddOns.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 bg-white border border-blue-200 rounded-3xl space-y-4 shadow-xl"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
          <Package className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-blue-600 font-semibold">Add Ons</h3>
          <p className="text-xs text-gray-500">
            Opsional — tambahkan sesuai kebutuhan
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {activeAddOns.map((addon, i) => {
          const key = addon.id ?? String(i);
          const qty = selected[key] ?? 0;
          const isSelected = qty > 0;

          return (
            <motion.div
              key={key}
              layout
              className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-100 bg-gray-50 hover:border-blue-200"
              }`}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0 mr-3">
                <p
                  className={`text-sm font-semibold ${isSelected ? "text-blue-700" : "text-gray-800"}`}
                >
                  {addon.name}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm font-bold text-blue-600">
                    {formatCurrency(addon.price)}
                  </span>
                  {addon.stock != null && (
                    <span className="text-[11px] text-gray-400">
                      Stok: {addon.stock}
                    </span>
                  )}
                  {addon.maxPerBooking > 1 && (
                    <span className="text-[11px] text-gray-400">
                      Maks. {addon.maxPerBooking}x
                    </span>
                  )}
                </div>
              </div>

              {addon.maxPerBooking === 1 ? (
                <button
                  onClick={() => onChange(key, isSelected ? 0 : 1)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                  }`}
                >
                  {isSelected ? "Dipilih" : "Pilih"}
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onChange(key, Math.max(0, qty - 1))}
                    disabled={qty === 0}
                    className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-gray-800">
                    {qty}
                  </span>
                  <button
                    onClick={() =>
                      onChange(
                        key,
                        Math.min(
                          addon.maxPerBooking,
                          addon.stock != null
                            ? Math.min(addon.stock, addon.maxPerBooking)
                            : addon.maxPerBooking,
                          qty + 1,
                        ),
                      )
                    }
                    disabled={
                      qty >= addon.maxPerBooking ||
                      (addon.stock != null && qty >= addon.stock)
                    }
                    className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white"
                  >
                    +
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function TeamSelector({
  teams,
  pots,
  pricingMode,
  selectedTeamId,
  onSelect,
  required = false,
  bookingType = "individual",
}: {
  teams: Team[];
  pots: Pot[];
  pricingMode: PricingMode;
  selectedTeamId: string | null;
  onSelect: (id: string | null) => void;
  required?: boolean;
  bookingType?: "individual" | "team";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = teams.find((t) => t.id === selectedTeamId);

  const isTeamFull = (team: Team): boolean => {
    if (!team.slot) return false;
    if (bookingType === "team") return (
      team.slot.bookedSlots !== 0 ||
      team.availableGkSlots! + team.availablePlayerSlots! === 0
    );
    return team.availableGkSlots! + team.availablePlayerSlots! === 0;
  };

  const getSlotLabel = (team: Team): string => {
    if (!team.slot) return "";
    if (bookingType === "team")
      return team.slot.bookedSlots !== 0 ||
        team.availableGkSlots! + team.availablePlayerSlots! === 0
        ? "Sudah ada booking"
        : "Tersedia";
    if (team.availableGkSlots! + team.availablePlayerSlots! === 0)
      return "Penuh";
    return `${team.availableGkSlots! + team.availablePlayerSlots!} slot tersisa`;
  };

  const getSlotBadgeClass = (team: Team): string => {
    const full = isTeamFull(team);
    if (full) return "bg-red-100 text-red-600";
    if (
      bookingType === "individual" &&
      (team.availableGkSlots ?? 0) + (team.availablePlayerSlots ?? 0) <= 3
    )
      return "bg-amber-100 text-amber-600";
    return "bg-green-100 text-green-600";
  };

  const getPotForTeam = (team: Team): Pot | null => {
    if (pricingMode !== "multi" || !team.potId) return null;
    return pots.find((p) => p.id === team.potId) ?? null;
  };

  const getPotIndex = (pot: Pot): number =>
    pots.findIndex((p) => p.id === pot.id);

  return (
    <div className="space-y-3">
      <label className="block text-gray-600 text-sm font-medium">
        Pilih Tim {required && <span className="text-red-500">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all text-left ${
          selected
            ? "border-blue-500 bg-blue-50"
            : "border-blue-200 bg-blue-50 hover:border-blue-400"
        }`}
      >
        {selected ? (
          <div className="flex items-center gap-3">
            {selected.imageUrl ? (
              <img
                src={selected.imageUrl}
                alt={selected.name}
                className="w-8 h-8 rounded-lg object-cover border border-blue-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              <span className="text-gray-800 font-medium text-sm block">
                {selected.name}
              </span>
              {(() => {
                const pot = getPotForTeam(selected);
                if (!pot) return null;
                return <PotBadge pot={pot} index={getPotIndex(pot)} />;
              })()}
            </div>
            {selected.slot && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getSlotBadgeClass(selected)}`}
              >
                {getSlotLabel(selected)}
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">-- Pilih Tim --</span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{ duration: 0.15 }}
            className="origin-top bg-white border-2 border-blue-200 rounded-2xl overflow-hidden shadow-lg z-10 relative"
          >
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {!required && (
                <button
                  onClick={() => {
                    onSelect(null);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-gray-400 text-sm">-- Tanpa tim --</span>
                </button>
              )}
              {teams.map((team) => {
                const full = isTeamFull(team);
                const pot = getPotForTeam(team);
                const potIdx = pot ? getPotIndex(pot) : -1;
                return (
                  <button
                    key={team.id}
                    onClick={() => {
                      if (!full) {
                        onSelect(team.id);
                        setIsOpen(false);
                      }
                    }}
                    disabled={full}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-left ${
                      full
                        ? "opacity-50 cursor-not-allowed bg-gray-50"
                        : "hover:bg-blue-50 cursor-pointer"
                    } ${selectedTeamId === team.id ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      {team.imageUrl ? (
                        <img
                          src={team.imageUrl}
                          alt={team.name}
                          className="w-9 h-9 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {team.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {pot && <PotBadge pot={pot} index={potIdx} />}
                          {team.slot && (
                            <p className="text-[11px] text-gray-400">
                              {bookingType === "team"
                                ? `Booked: ${team.slot.bookedSlots} · GK: ${team.slot.gkSlots} · Player: ${team.slot.playerSlots}`
                                : `${team.availableGkSlots! + team.availablePlayerSlots!}/${team.slot.totalSlots} slot · GK: ${team.availableGkSlots} · Player: ${team.availablePlayerSlots}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {team.slot && (
                      <span
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${getSlotBadgeClass(team)}`}
                      >
                        {getSlotLabel(team)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
);

const makeEmptyPlayer = (): RosterPlayer => ({
  name: "",
  phone: "",
  email: "",
  jerseySize: "",
  jerseyName: "",
  jerseyNumber: "",
  isGk: false,
});

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function EventCheckoutPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showSuccess, showError } = useNotifications();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [bookingType, setBookingType] = useState<"individual" | "team">(
    "individual",
  );
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [slots, setSlots] = useState<IndividualSlot[]>([
    {
      role: null,
      name: "",
      jerseySize: "",
      jerseyName: "",
      jerseyNumber: "",
      phone: "",
      email: "",
    },
  ]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [jerseyName, setJerseyName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  const [picName, setPicName] = useState("");
  const [picEmail, setPicEmail] = useState("");
  const [picJerseySize, setPicJerseySize] = useState("");
  const [picJerseyName, setPicJerseyName] = useState("");
  const [picJerseyNumber, setPicJerseyNumber] = useState("");
  const [picIsGk, setPicIsGk] = useState(false);

  const [includeRoster, setIncludeRoster] = useState(false);
  const [players, setPlayers] = useState<RosterPlayer[]>(
    Array.from({ length: 10 }, makeEmptyPlayer),
  );

  const [emailErrors, setEmailErrors] = useState<{ [key: number]: string }>({});
  const [phoneErrors, setPhoneErrors] = useState<{ [key: number]: string }>({});
  const [phoneFormatErrors, setPhoneFormatErrors] = useState<{
    [key: number]: string;
  }>({});
  const [emailFormatErrors, setEmailFormatErrors] = useState<{
    [key: number]: string;
  }>({});

  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>(
    {},
  );

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    nominal: number;
    type: "PERCENTAGE" | "FIXED";
  } | null>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

  const [showPayment, setShowPayment] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [successPayment, setSuccessPayment] = useState(false);
  const [amount, setAmount] = useState(0);
  const [isMember, setIsMember] = useState(false);

  const activePhase = getActivePhase(event?.phases);
  const pricingMode: PricingMode = event?.pricingMode ?? "single";
  const pots = event?.pots ?? [];
  const isMulti = pricingMode === "multi" && pots.length > 0;
  const canRegistTeam = event?.canRegistTeam ?? false;
  const typeMatch = event?.typeMatch;
  const ROSTER_SIZE =
    typeMatch === "MINI-SOCCER"
      ? 6
      : typeMatch === "MINI-SOCCER-BEKASI"
        ? 7
        : 10;
  const teams = event?.teams ?? [];
  const addOns = event?.addOn ?? [];

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null;
  const availableGkSlots = selectedTeam?.availableGkSlots ?? 0;
  const availablePlayerSlots = selectedTeam?.availablePlayerSlots ?? 0;

  const {
    feePlayer: effectiveFeePlayer,
    feeGk: effectiveFeeGk,
    baseFeePlayer,
    baseFeeGk,
    pot: selectedPot,
  } = resolveTeamFee(
    selectedTeam,
    pots,
    pricingMode,
    event?.feePlayer ?? 0,
    event?.feeGk ?? 0,
    activePhase,
  );

  const selectedPotIndex = selectedPot
    ? pots.findIndex((p) => p.id === selectedPot.id)
    : -1;
  const hasPhaseDiscount =
    !!activePhase &&
    (baseFeePlayer !== effectiveFeePlayer || baseFeeGk !== effectiveFeeGk);
  const countGk = () => slots.filter((s) => s.role === "goalkeeper").length;
  const countPlayer = () => slots.filter((s) => s.role === "player").length;
  const gkCount = countGk();
  const playerCount = countPlayer();

  const teamGkQty = bookingType === "team" ? 1 : gkCount;
  const teamPlayerQty = bookingType === "team" ? ROSTER_SIZE : playerCount;

  const partialDiscount = calcPartialDiscount(
    activePhase,
    teamGkQty,
    teamPlayerQty,
  );

  const gkInRoster = players.findIndex((p) => p.isGk);
  const hasGkAssigned = picIsGk || gkInRoster !== -1;

  useEffect(() => {
    if (!eventId) return;
    const fetchEvent = async () => {
      setIsLoadingEvent(true);
      try {
        const res = await adminService.getEventDetail(eventId);
        setEvent(res);
        if (res.typeMatch === "PADEL") setBookingType("individual");
        const rosterSize =
          res.typeMatch === "MINI-SOCCER"
            ? 6
            : res.typeMatch === "MINI-SOCCER-BEKASI"
              ? 7
              : 10;
        setPlayers(Array.from({ length: rosterSize }, makeEmptyPlayer));
      } catch (err: any) {
        showError(err.message ?? "Gagal memuat detail event");
      } finally {
        setIsLoadingEvent(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPicName(user.name || "");
      setPicEmail(user.email || "");
      setEmail(user.email || "");
      setWhatsapp(user.phone || "");
      if (user.isMember) setIsMember(true);
      setSlots((prev) =>
        prev.map((s, i) => (i === 0 ? { ...s, name: user.name || "" } : s)),
      );
    }
  }, [user]);

  useEffect(() => {
    setSlots([
      {
        role: null,
        name: user?.name || "",
        jerseySize: "",
        jerseyName: "",
        jerseyNumber: "",
        phone: "",
        email: "",
      },
    ]);
  }, [selectedTeamId]);

  useEffect(() => {
    const pid = searchParams.get("paymentId");
    if (pid) {
      setPaymentId(pid);
      setShowPayment(true);
    }
  }, [searchParams]);

  const handleTogglePicGk = () => {
    const next = !picIsGk;
    setPicIsGk(next);
    if (next) {
      setPlayers((prev) => prev.map((p) => ({ ...p, isGk: false })));
    }
  };

  const handleTogglePlayerGk = (index: number) => {
    const isAlreadyGk = players[index].isGk;
    if (isAlreadyGk) {
      setPlayers((prev) =>
        prev.map((p, i) => (i === index ? { ...p, isGk: false } : p)),
      );
    } else {
      setPicIsGk(false);
      setPlayers((prev) => prev.map((p, i) => ({ ...p, isGk: i === index })));
    }
  };

  const getMaxQuantity = (): number => {
    if (!selectedTeamId) return 1;
    const maxByMatchType =
      typeMatch === "MINI-SOCCER"
        ? 6
        : typeMatch === "MINI-SOCCER-BEKASI"
          ? 7
          : 10;
    const totalAvailable = availableGkSlots + availablePlayerSlots;
    return Math.min(totalAvailable, maxByMatchType);
  };

  const bookingQuantity = slots.length;

  const addSlot = () => {
    const max = getMaxQuantity();
    if (slots.length < max) {
      setSlots([
        ...slots,
        {
          role: null,
          name: "",
          jerseySize: "",
          jerseyName: "",
          jerseyNumber: "",
          phone: "",
          email: "",
        },
      ]);
    }
  };

  const removeSlot = (index: number) => {
    if (slots.length <= 1) return;
    setSlots(slots.filter((_, i) => i !== index));
  };

  const setSlotRole = (index: number, role: SlotRole) => {
    const updated = [...slots];
    const currentCount = updated.filter((s) => s.role === role).length;
    const available =
      role === "goalkeeper" ? availableGkSlots : availablePlayerSlots;

    if (updated[index].role === role) {
      updated[index].role = null;
      setSlots(updated);
      return;
    }

    if (currentCount >= available) {
      showError(
        `Slot ${role === "goalkeeper" ? "Goalkeeper" : "Player"} sudah penuh`,
      );
      return;
    }
    updated[index].role = role;
    setSlots(updated);
  };

  const canSelectRole = (slotIndex: number, role: SlotRole) => {
    if (!role) return true;
    const currentForRole = slots.filter(
      (s, i) => i !== slotIndex && s.role === role,
    ).length;
    const available =
      role === "goalkeeper" ? availableGkSlots : availablePlayerSlots;
    return currentForRole < available;
  };

  const calcIndividualJerseySurcharge = (): number => {
    return slots.reduce((sum, s) => sum + getJerseySurcharge(s.jerseySize), 0);
  };

  const calcTeamJerseySurcharge = (): number => {
    let total = getJerseySurcharge(picJerseySize);
    if (includeRoster) {
      total += players.reduce(
        (sum, p) => sum + getJerseySurcharge(p.jerseySize),
        0,
      );
    }
    return total;
  };

  const handleAddOnChange = (id: string, qty: number) => {
    setSelectedAddOns((prev) => ({ ...prev, [id]: qty }));
  };

  const addOnTotal = () =>
    addOns.reduce(
      (sum, addon, i) =>
        sum + (selectedAddOns[addon.id ?? String(i)] ?? 0) * addon.price,
      0,
    );

  const addOnLineItems = () =>
    addOns
      .map((addon, i) => {
        const qty = selectedAddOns[addon.id ?? String(i)] ?? 0;
        if (!qty) return null;
        return { name: addon.name, qty, price: addon.price };
      })
      .filter(Boolean) as { name: string; qty: number; price: number }[];

  const handlePlayerChange = (
    index: number,
    field: keyof RosterPlayer,
    value: string,
  ) => {
    const updated = [...players];
    if (field === "name" || field === "email" || field === "jerseyName") {
      (updated[index] as any)[field] = noSpace(value);
    } else if (field === "phone" || field === "jerseyNumber") {
      (updated[index] as any)[field] = onlyNumbers(value);
    } else {
      (updated[index] as any)[field] = value;
    }

    if (field === "phone") {
      const cleaned = onlyNumbers(value);
      const dupErrs = { ...phoneErrors };
      const fmtErrs = { ...phoneFormatErrors };
      const dupIdx = updated.findIndex(
        (p, i) => i !== index && p.phone && p.phone === cleaned,
      );
      if (dupIdx !== -1 && cleaned) {
        dupErrs[index] = `Nomor sama dengan Player ${dupIdx + 1}`;
        dupErrs[dupIdx] = `Nomor sama dengan Player ${index + 1}`;
      } else {
        delete dupErrs[index];
        Object.keys(dupErrs).forEach((k) => {
          const ki = Number(k);
          const hasDup = updated.some(
            (p, i) =>
              i !== ki && p.phone === updated[ki]?.phone && updated[ki]?.phone,
          );
          if (!hasDup) delete dupErrs[ki];
        });
      }
      if (cleaned && cleaned.length < 10) {
        fmtErrs[index] = "Nomor HP minimal 10 digit";
      } else {
        delete fmtErrs[index];
      }
      setPhoneErrors(dupErrs);
      setPhoneFormatErrors(fmtErrs);
    }

    if (field === "email") {
      const cleaned = noSpace(value);
      const dupErrs = { ...emailErrors };
      const fmtErrs = { ...emailFormatErrors };
      const dupIdx = updated.findIndex(
        (p, i) => i !== index && p.email && p.email === cleaned,
      );
      if (dupIdx !== -1 && cleaned) {
        dupErrs[index] = `Email sama dengan Player ${dupIdx + 1}`;
        dupErrs[dupIdx] = `Email sama dengan Player ${index + 1}`;
      } else {
        delete dupErrs[index];
        Object.keys(dupErrs).forEach((k) => {
          const ki = Number(k);
          const hasDup = updated.some(
            (p, i) =>
              i !== ki && p.email === updated[ki]?.email && updated[ki]?.email,
          );
          if (!hasDup) delete dupErrs[ki];
        });
      }
      if (cleaned && !validateEmail(cleaned)) {
        fmtErrs[index] = "Format email tidak valid";
      } else {
        delete fmtErrs[index];
      }
      setEmailErrors(dupErrs);
      setEmailFormatErrors(fmtErrs);
    }

    setPlayers(updated);
  };

  // ── Pricing ───────────────────────────────────────────────────────────────────
  const calculatePricing = () => {
    const gkCount = countGk();
    const playerCount = countPlayer();

    let basePrice = 0;
    let phaseDiscount = 0;

    if (bookingType === "individual") {
      const partial = calcPartialDiscount(activePhase, gkCount, playerCount);
      basePrice = gkCount * baseFeeGk + playerCount * baseFeePlayer;
      phaseDiscount =
        partial.discountedGk * (baseFeeGk - effectiveFeeGk) +
        partial.discountedPlayer * (baseFeePlayer - effectiveFeePlayer);
    } else {
      const partial = calcPartialDiscount(activePhase, 1, ROSTER_SIZE);
      basePrice = ROSTER_SIZE * baseFeePlayer + baseFeeGk;
      const priceAfterPhase =
        partial.discountedPlayer * effectiveFeePlayer +
        partial.normalPlayer * baseFeePlayer +
        partial.discountedGk * effectiveFeeGk +
        partial.normalGk * baseFeeGk;
      phaseDiscount = basePrice - priceAfterPhase;
    }

    const adminFee = isMember ? 0 : 1000;
    let memberDiscount = 0;
    if (isMember && bookingType === "individual" && bookingQuantity > 0) {
      memberDiscount = Math.round(
        (gkCount > 0 ? effectiveFeeGk : effectiveFeePlayer) * 0.1,
      );
    }

    const teamDiscount =
      bookingType === "team"
        ? Math.round((basePrice - phaseDiscount) * 0.05)
        : 0;

    const jerseySurcharge =
      bookingType === "individual"
        ? calcIndividualJerseySurcharge()
        : calcTeamJerseySurcharge();

    const priceAfterPhaseAndMember =
      basePrice - phaseDiscount - memberDiscount - teamDiscount + adminFee;
    let voucherDiscount = 0;
    if (appliedVoucher) {
      voucherDiscount =
        appliedVoucher.type === "PERCENTAGE"
          ? Math.round(
              priceAfterPhaseAndMember * (appliedVoucher.nominal / 100),
            )
          : appliedVoucher.nominal;
    }

    const total = Math.max(
      0,
      priceAfterPhaseAndMember -
        voucherDiscount +
        addOnTotal() +
        jerseySurcharge,
    );

    return {
      basePrice,
      phaseDiscount,
      adminFee,
      memberDiscount,
      teamDiscount,
      voucherDiscount,
      jerseySurcharge,
      total,
    };
  };

  // ── Voucher ───────────────────────────────────────────────────────────────────
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return showError("Masukkan kode voucher");
    setIsCheckingVoucher(true);
    try {
      const response = await voucherService.validateVoucher(voucherCode);
      if (response.status) {
        setAppliedVoucher({
          code: voucherCode.toUpperCase(),
          ...response.data,
        });
        showSuccess("Voucher berhasil diterapkan!");
      } else {
        showError("Kode voucher tidak valid");
      }
    } catch {
      showError("Gagal memvalidasi voucher");
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    showSuccess("Voucher dihapus");
  };

  // ── Validation ────────────────────────────────────────────────────────────────
  const isFormValid = () => {
    if (teams.length > 0 && !selectedTeamId) return false;

    if (bookingType === "individual") {
      return (
        validateName(name) &&
        validateEmail(email) &&
        validatePhone(whatsapp) &&
        jerseyName.trim().length > 0 &&
        jerseyNumber.trim().length > 0 &&
        slots.length > 0 &&
        slots.every((s) => s.role !== null) &&
        slots.every((s) => s.jerseySize !== "") &&
        slots.every((s, i) =>
          i === 0
            ? true
            : validateName(s.name) &&
              validatePhone(s.phone) &&
              validateEmail(s.email ?? "") &&
              s.jerseyName.trim().length > 0 &&
              s.jerseyNumber.trim().length > 0,
        )
      );
    }

    const isPicValid =
      validateName(picName) &&
      validateEmail(picEmail) &&
      validatePhone(whatsapp) &&
      picJerseySize !== "" &&
      picJerseyName.trim().length > 0 &&
      picJerseyNumber.trim().length > 0;

    if (!includeRoster) return isPicValid;

    return (
      isPicValid &&
      Object.keys(emailErrors).length === 0 &&
      Object.keys(phoneErrors).length === 0 &&
      Object.keys(phoneFormatErrors).length === 0 &&
      Object.keys(emailFormatErrors).length === 0 &&
      players.every(
        (p) =>
          validateName(p.name) &&
          validatePhone(p.phone) &&
          validateEmail(p.email) &&
          p.jerseySize !== "" &&
          p.jerseyName.trim().length > 0 &&
          p.jerseyNumber.trim().length > 0,
      )
    );
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleBookingConfirmation = async () => {
    if (teams.length > 0 && !selectedTeamId)
      return showError("Pilih tim terlebih dahulu");

    if (bookingType === "individual") {
      if (!validateName(name)) return showError("Nama wajib diisi");
      if (!validateEmail(email)) return showError("Email tidak valid");
      if (!validatePhone(whatsapp)) return showError("WhatsApp tidak valid");
      if (!jerseyName.trim())
        return showError("Nama jersey Slot 1 wajib diisi");
      if (!jerseyNumber.trim())
        return showError("Nomor jersey Slot 1 wajib diisi");
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        if (!s.role) return showError(`Pilih role untuk Slot ${i + 1}`);
        if (!s.jerseySize)
          return showError(`Ukuran jersey Slot ${i + 1} wajib dipilih`);
        if (i > 0 && !validateName(s.name))
          return showError(`Nama teman ${i} wajib diisi`);
        if (i > 0 && !validatePhone(s.phone))
          return showError(`No HP teman ${i} tidak valid`);
        if (i > 0 && !validateEmail(s.email ?? ""))
          return showError(`Email teman ${i} wajib diisi dan valid`);
        if (i > 0 && !s.jerseyName.trim())
          return showError(`Nama jersey teman ${i} wajib diisi`);
        if (i > 0 && !s.jerseyNumber.trim())
          return showError(`Nomor jersey teman ${i} wajib diisi`);
      }
    } else {
      if (!validateName(picName)) return showError("PIC name wajib diisi");
      if (!validateEmail(picEmail)) return showError("PIC email tidak valid");
      if (!validatePhone(whatsapp))
        return showError("WhatsApp PIC tidak valid");
      if (!picJerseySize) return showError("Ukuran jersey PIC wajib dipilih");
      if (!picJerseyName.trim())
        return showError("Nama jersey PIC wajib diisi");
      if (!picJerseyNumber.trim())
        return showError("Nomor jersey PIC wajib diisi");
      if (includeRoster) {
        if (Object.keys(emailErrors).length > 0)
          return showError("Terdapat email yang sama di team roster");
        if (Object.keys(phoneErrors).length > 0)
          return showError("Terdapat nomor phone yang sama di team roster");
        for (let i = 0; i < players.length; i++) {
          const p = players[i];
          if (!validateName(p.name))
            return showError(`Nama Player ${i + 1} wajib diisi`);
          if (!validatePhone(p.phone))
            return showError(`Phone Player ${i + 1} tidak valid`);
          if (!validateEmail(p.email))
            return showError(`Email Player ${i + 1} wajib diisi dan valid`);
          if (!p.jerseySize)
            return showError(`Jersey size Player ${i + 1} wajib dipilih`);
          if (!p.jerseyName.trim())
            return showError(`Nama jersey Player ${i + 1} wajib diisi`);
          if (!p.jerseyNumber.trim())
            return showError(`Nomor jersey Player ${i + 1} wajib diisi`);
        }
      }
    }

    const bookerRole = slots[0]?.role;
    const payload: bookingEventReq = {
      eventId,
      eventTeamId: selectedTeamId!,
      bookingType: bookingType.toUpperCase(),
      isGuest: !user,
      name: user ? user.name : bookingType === "team" ? picName : name,
      email: user ? user.email : bookingType === "team" ? picEmail : email,
      phoneNumber: user ? user.phone : whatsapp,
      jerseyName: bookingType === "individual" ? jerseyName : picJerseyName,
      jerseyNumber:
        bookingType === "individual" ? jerseyNumber : picJerseyNumber,
      isPlayer: bookingType === "team" ? !picIsGk : bookerRole === "player",
      isGk: bookingType === "team" ? picIsGk : bookerRole === "goalkeeper",
      isTeam: bookingType === "team" && includeRoster,
      jerseySize:
        bookingType === "individual" ? slots[0]?.jerseySize : picJerseySize,
      gkQuantity: bookingType === "individual" ? countGk() : 0,
      playerQuantity: bookingType === "individual" ? countPlayer() : 0,
      quantity: bookingType === "individual" ? bookingQuantity : 1,
      slotDetails:
        bookingType === "individual"
          ? slots.map((s, i) => ({
              name: i === 0 ? (user?.name ?? name) : s.name,
              jerseySize: s.jerseySize,
              jerseyName: i === 0 ? jerseyName : s.jerseyName,
              jerseyNumber: i === 0 ? jerseyNumber : s.jerseyNumber,
              role: s.role,
              phone: i === 0 ? (user?.phone ?? whatsapp) : s.phone,
              email: i === 0 ? (user?.email ?? email) : s.email || undefined,
            }))
          : undefined,
    };

    if (payload.isTeam) {
      payload.teamRoster = players.map((p) => ({
        name: p.name,
        phone: p.phone,
        email: p.email,
        jerseySize: p.jerseySize,
        jerseyName: p.jerseyName,
        jerseyNumber: p.jerseyNumber,
        isGk: p.isGk,
        isPlayer: !p.isGk,
      }));
    }

    try {
      setIsBookingLoading(true);
      const res = await bookingService.bookEvent(payload);
      setPaymentId(res);
      setShowPayment(true);
    } catch (err) {
      console.error(err);
      showError("Gagal melakukan booking");
    } finally {
      setIsBookingLoading(false);
    }
  };

  // ─── Guards ───────────────────────────────────────────────────────────────────

  if (showPayment && paymentId) {
    return <QRISPaymentPage paymentId={paymentId} paymentType="booking" />;
  }

  const pricing = calculatePricing();
  const isAdminEmail =
    user?.email === "ardiantosandi@gmail.com" ||
    user?.email === "ikhsanhamid352@gmail.com";
  const isLocked = !!user && !isAdminEmail;

  const jerseySurchargeItems: { label: string; amount: number }[] = [];
  if (bookingType === "individual") {
    slots.forEach((s, i) => {
      const sc = getJerseySurcharge(s.jerseySize);
      if (sc > 0) {
        jerseySurchargeItems.push({
          label: `Surcharge Jersey ${s.jerseySize} (${i === 0 ? "Anda" : `Teman ${i}`})`,
          amount: sc,
        });
      }
    });
  } else {
    const picSc = getJerseySurcharge(picJerseySize);
    if (picSc > 0)
      jerseySurchargeItems.push({
        label: `Surcharge Jersey PIC (${picJerseySize})`,
        amount: picSc,
      });
    if (includeRoster) {
      players.forEach((p, i) => {
        const sc = getJerseySurcharge(p.jerseySize);
        if (sc > 0)
          jerseySurchargeItems.push({
            label: `Surcharge Jersey Player ${i + 1} (${p.jerseySize})`,
            amount: sc,
          });
      });
    }
  }

  // ── Derive a human-readable reason why the form isn't valid yet ───────────────
  const getFormInvalidReason = (): string => {
    if (teams.length > 0 && !selectedTeamId) return "Pilih tim terlebih dahulu";
    if (bookingType === "individual") {
      if (slots.some((s) => s.role === null))
        return "Pilih role untuk semua slot";
      if (slots.some((s) => !s.jerseySize))
        return "Pilih ukuran jersey untuk semua slot";
      if (!jerseyName.trim() || !jerseyNumber.trim())
        return "Isi nama dan nomor jersey Anda";
      if (slots.some((s, i) => i > 0 && !validateName(s.name)))
        return "Isi nama teman dengan benar";
      if (slots.some((s, i) => i > 0 && !validatePhone(s.phone)))
        return "Isi no HP teman dengan benar";
      if (slots.some((s, i) => i > 0 && !validateEmail(s.email ?? "")))
        return "Isi email teman dengan benar";
      if (
        slots.some(
          (s, i) => i > 0 && (!s.jerseyName.trim() || !s.jerseyNumber.trim()),
        )
      )
        return "Isi nama dan nomor jersey teman";
    } else {
      if (!picJerseyName.trim() || !picJerseyNumber.trim())
        return "Isi nama dan nomor jersey PIC";
      if (includeRoster) {
        if (players.some((p) => !validateEmail(p.email)))
          return "Isi email semua player dengan benar";
        if (players.some((p) => !p.jerseyName.trim() || !p.jerseyNumber.trim()))
          return "Isi nama dan nomor jersey semua player";
      }
    }
    return "Lengkapi semua data untuk melanjutkan";
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen py-24 px-4 bg-gradient-to-br from-blue-50 to-white">
        <Navbar currentPage="" navigateTo={() => {}} />

        <div className="max-w-6xl mx-auto mt-10">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke detail event
          </button>

          {/* Header */}
          {isLoadingEvent ? (
            <div className="mb-12 text-center space-y-3">
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
                {event?.name}
              </h1>
              <p className="text-gray-500 text-sm">
                Selesaikan pendaftaran Anda untuk event ini
              </p>
            </motion.div>
          )}

          {/* Phase banner */}
          {!isLoadingEvent && activePhase && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto mb-8 space-y-3"
            >
              <PhaseBadge phase={activePhase} />
              {selectedTeamId && (
                <PhaseQuotaInfo
                  phase={activePhase}
                  discountedGk={partialDiscount.discountedGk}
                  discountedPlayer={partialDiscount.discountedPlayer}
                  normalGk={partialDiscount.normalGk}
                  normalPlayer={partialDiscount.normalPlayer}
                  remainingGkQuota={partialDiscount.remainingGkQuota}
                  remainingPlayerQuota={partialDiscount.remainingPlayerQuota}
                  effectiveFeeGk={effectiveFeeGk}
                  effectiveFeePlayer={effectiveFeePlayer}
                  baseFeeGk={baseFeeGk}
                  baseFeePlayer={baseFeePlayer}
                />
              )}
            </motion.div>
          )}

          {isLoadingEvent ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-12 rounded-3xl" />
                <Skeleton className="h-96 rounded-3xl" />
              </div>
              <Skeleton className="h-96 rounded-3xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* ── Left Column ────────────────────────────────────────────────── */}
              <div className="lg:col-span-2 space-y-6">
                {/* ── Booking type toggle ───────────────────────────────────────── */}
                {typeMatch !== "PADEL" && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="p-2 bg-white border border-blue-200 rounded-3xl flex gap-2 shadow-lg"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setBookingType("individual");
                        setSelectedTeamId(null);
                      }}
                      className={`flex-1 px-6 py-4 rounded-2xl transition-all ${bookingType === "individual" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:text-blue-600"}`}
                    >
                      Individual
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: !canRegistTeam ? 1 : 1.02 }}
                      whileTap={{ scale: !canRegistTeam ? 1 : 0.98 }}
                      onClick={() => {
                        if (canRegistTeam) {
                          setBookingType("team");
                          setSelectedTeamId(null);
                        }
                      }}
                      disabled={!canRegistTeam}
                      className={`flex-1 px-6 py-4 rounded-2xl transition-all relative ${!canRegistTeam ? "bg-gray-200 text-gray-400 cursor-not-allowed" : bookingType === "team" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:text-blue-600"}`}
                    >
                      Team
                      {!canRegistTeam && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          FULL
                        </span>
                      )}
                    </motion.button>
                  </motion.div>
                )}

                {/* ── Team Selector ─────────────────────────────────────────────── */}
                {teams.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="p-6 bg-white border border-blue-200 rounded-3xl shadow-xl"
                  >
                    <TeamSelector
                      teams={teams}
                      pots={pots}
                      pricingMode={pricingMode}
                      selectedTeamId={selectedTeamId}
                      onSelect={setSelectedTeamId}
                      required
                      bookingType={bookingType}
                    />

                    {selectedTeam && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 space-y-3"
                      >
                        {bookingType === "individual" && (
                          <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-blue-50 rounded-xl px-3 py-2">
                              <Shield className="w-3.5 h-3.5 text-blue-500" />
                              <span>
                                GK tersisa:{" "}
                                <strong className="text-blue-600">
                                  {availableGkSlots}
                                </strong>{" "}
                                / {selectedTeam.slot?.gkSlots ?? "-"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-blue-50 rounded-xl px-3 py-2">
                              <User className="w-3.5 h-3.5 text-blue-500" />
                              <span>
                                Player tersisa:{" "}
                                <strong className="text-blue-600">
                                  {availablePlayerSlots}
                                </strong>{" "}
                                / {selectedTeam.slot?.playerSlots ?? "-"}
                              </span>
                            </div>
                          </div>
                        )}

                        <div
                          className={`rounded-2xl border p-4 ${selectedPot ? POT_COLORS[selectedPotIndex % POT_COLORS.length] : "bg-blue-50 border-blue-200"}`}
                        >
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {isMulti && selectedPot ? (
                              <>
                                <Layers className="w-4 h-4" />
                                <span className="text-sm font-semibold">
                                  Harga Pot: {selectedPot.name}
                                </span>
                                {hasPhaseDiscount && activePhase && (
                                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                    <Zap className="w-2.5 h-2.5" />
                                    {activePhase.name}
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <Tag className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-semibold text-blue-700">
                                  Harga Event
                                </span>
                                {hasPhaseDiscount && activePhase && (
                                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                    <Zap className="w-2.5 h-2.5" />
                                    {activePhase.name}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white/70 rounded-xl px-3 py-2 text-center">
                              <div className="text-[10px] text-slate-400 mb-0.5">
                                Fee Pemain
                              </div>
                              {hasPhaseDiscount ? (
                                <>
                                  <div className="text-sm font-bold text-blue-700">
                                    {formatCurrency(effectiveFeePlayer)}
                                  </div>
                                  <div className="text-[10px] text-slate-400 line-through">
                                    {formatCurrency(baseFeePlayer)}
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm font-bold text-slate-800">
                                  {formatCurrency(effectiveFeePlayer)}
                                </div>
                              )}
                            </div>
                            <div className="bg-white/70 rounded-xl px-3 py-2 text-center">
                              <div className="text-[10px] text-slate-400 mb-0.5">
                                Fee GK
                              </div>
                              {hasPhaseDiscount ? (
                                <>
                                  <div className="text-sm font-bold text-blue-700">
                                    {formatCurrency(effectiveFeeGk)}
                                  </div>
                                  <div className="text-[10px] text-slate-400 line-through">
                                    {formatCurrency(baseFeeGk)}
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm font-bold text-slate-800">
                                  {formatCurrency(effectiveFeeGk)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ── Individual Form ─────────────────────────────────────────── */}
                {bookingType === "individual" && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="p-8 bg-white border border-blue-200 rounded-3xl space-y-6 shadow-xl"
                  >
                    <h3 className="text-blue-600">Personal Information</h3>

                    {[
                      {
                        label: "Nama lengkap",
                        value: name,
                        setter: setName,
                        type: "text",
                        placeholder: "Enter your name",
                        icon: User,
                        transform: noSpace,
                      },
                      {
                        label: "Email",
                        value: email,
                        setter: setEmail,
                        type: "text",
                        placeholder: "your@email.com",
                        icon: Mail,
                        transform: noSpace,
                      },
                      {
                        label: "WhatsApp Number",
                        value: whatsapp,
                        setter: setWhatsapp,
                        type: "tel",
                        placeholder: "0812 3456 7890",
                        icon: Phone,
                        transform: onlyNumbers,
                      },
                    ].map(
                      ({
                        label,
                        value,
                        setter,
                        type,
                        placeholder,
                        icon: Icon,
                        transform,
                      }) => (
                        <div key={label}>
                          <label className="block text-gray-600 mb-2">
                            {label} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type={type}
                              value={value}
                              disabled={isLocked}
                              onChange={(e) =>
                                setter(transform(e.target.value))
                              }
                              placeholder={placeholder}
                              className={`w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 ${isLocked ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed" : ""}`}
                            />
                            {isLocked && (
                              <p className="text-xs text-gray-500 mt-1">
                                Data diambil dari profil akun Anda
                              </p>
                            )}
                          </div>
                        </div>
                      ),
                    )}

                    {/* Slot selection */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-blue-600">
                          Pilih Slot & Posisi
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            ({slots.length} slot)
                          </span>
                        </h3>
                      </div>

                      {!selectedTeamId && teams.length > 0 ? (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-4 h-4 text-amber-600" />
                          </div>
                          <p className="text-sm text-amber-700">
                            Pilih tim terlebih dahulu untuk melihat slot yang
                            tersedia
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-gray-500 mb-4">
                            Slot pertama otomatis untuk Anda. Tambah slot jika
                            membawa teman — isi nama, no HP, email, dan jersey
                            mereka.
                          </p>

                          {/* Jersey surcharge info */}
                          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                              <Shirt className="w-3.5 h-3.5" />
                              Info Ukuran Jersey
                            </p>
                            <p className="text-[11px] text-amber-600 mt-1">
                              XXL & XXXL: tambahan biaya{" "}
                              <strong>IDR 20.000</strong> · 4XL: tambahan biaya{" "}
                              <strong>IDR 40.000</strong>
                            </p>
                          </div>

                          <div className="space-y-3">
                            {slots.map((slot, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className="p-4 bg-blue-50 rounded-2xl border border-blue-100"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <span className="text-gray-700 font-semibold text-sm">
                                      {index === 0
                                        ? "Slot Anda"
                                        : `Teman ${index}`}
                                    </span>
                                    <span
                                      className={`ml-2 text-xs px-2 py-0.5 rounded-full ${index === 0 ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"}`}
                                    >
                                      {index === 0 ? "Akun Anda" : "Teman"}
                                    </span>
                                  </div>
                                  {index > 0 && (
                                    <button
                                      onClick={() => removeSlot(index)}
                                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100"
                                    >
                                      <X className="w-3.5 h-3.5" /> Hapus
                                    </button>
                                  )}
                                </div>

                                {index > 0 && (
                                  <>
                                    <div className="mb-3">
                                      <label className="block text-xs text-gray-500 mb-1">
                                        Nama Teman{" "}
                                        <span className="text-red-500">*</span>
                                      </label>
                                      <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                          type="text"
                                          value={slot.name}
                                          onChange={(e) => {
                                            const u = [...slots];
                                            u[index].name = noSpace(
                                              e.target.value,
                                            );
                                            setSlots(u);
                                          }}
                                          placeholder={`Nama teman ${index}`}
                                          className="w-full pl-9 pr-4 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 text-gray-900 text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="mb-3">
                                      <label className="block text-xs text-gray-500 mb-1">
                                        No HP Teman{" "}
                                        <span className="text-red-500">*</span>
                                      </label>
                                      <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                          type="tel"
                                          value={slot.phone}
                                          onChange={(e) => {
                                            const u = [...slots];
                                            u[index].phone = onlyNumbers(
                                              e.target.value,
                                            );
                                            setSlots(u);
                                          }}
                                          placeholder="0812 3456 7890"
                                          className="w-full pl-9 pr-4 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 text-gray-900 text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="mb-3">
                                      <label className="block text-xs text-gray-500 mb-1">
                                        Email Teman{" "}
                                        <span className="text-red-500">*</span>
                                      </label>
                                      <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                          type="email"
                                          value={slot.email ?? ""}
                                          onChange={(e) => {
                                            const u = [...slots];
                                            u[index].email = noSpace(
                                              e.target.value,
                                            );
                                            setSlots(u);
                                          }}
                                          placeholder="email@teman.com"
                                          className="w-full pl-9 pr-4 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 text-gray-900 text-sm"
                                        />
                                      </div>
                                      <p className="text-xs text-red-400 mt-1">
                                        Wajib diisi — digunakan untuk informasi
                                        booking
                                      </p>
                                    </div>
                                  </>
                                )}

                                {/* Jersey size */}
                                <div className="mb-3">
                                  <label className="block text-xs text-gray-500 mb-1">
                                    Ukuran Jersey{" "}
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <div className="relative">
                                    <Shirt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select
                                      value={slot.jerseySize}
                                      onChange={(e) => {
                                        const u = [...slots];
                                        u[index].jerseySize = e.target.value;
                                        setSlots(u);
                                      }}
                                      className="w-full pl-9 pr-4 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 text-gray-900 appearance-none cursor-pointer text-sm"
                                    >
                                      <option value="">Pilih ukuran</option>
                                      {JERSEY_SIZES.map((size) => {
                                        const sc = getJerseySurcharge(size);
                                        return (
                                          <option key={size} value={size}>
                                            {size}
                                            {sc > 0
                                              ? ` (+IDR ${sc.toLocaleString("id-ID")})`
                                              : ""}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>
                                  <JerseySurchargeNote size={slot.jerseySize} />
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                      Nama Jersey{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                      <input
                                        type="text"
                                        value={
                                          index === 0
                                            ? jerseyName
                                            : slot.jerseyName
                                        }
                                        onChange={(e) => {
                                          if (index === 0) {
                                            setJerseyName(
                                              noSpace(e.target.value),
                                            );
                                          } else {
                                            const u = [...slots];
                                            u[index].jerseyName = noSpace(
                                              e.target.value,
                                            );
                                            setSlots(u);
                                          }
                                        }}
                                        placeholder="e.g. RONALDO"
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 text-gray-900 text-sm uppercase"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                      Nomor Jersey{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                      <input
                                        type="text"
                                        value={
                                          index === 0
                                            ? jerseyNumber
                                            : slot.jerseyNumber
                                        }
                                        onChange={(e) => {
                                          if (index === 0) {
                                            setJerseyNumber(
                                              onlyNumbers(e.target.value),
                                            );
                                          } else {
                                            const u = [...slots];
                                            u[index].jerseyNumber = onlyNumbers(
                                              e.target.value,
                                            );
                                            setSlots(u);
                                          }
                                        }}
                                        placeholder="e.g. 7"
                                        maxLength={3}
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 text-gray-900 text-sm"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-2">
                                    Posisi{" "}
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <div
                                    className={`grid gap-3 ${typeMatch !== "PADEL" ? "grid-cols-2" : "grid-cols-1"}`}
                                  >
                                    {typeMatch !== "PADEL" && (
                                      <motion.button
                                        whileHover={{
                                          scale:
                                            !canSelectRole(
                                              index,
                                              "goalkeeper",
                                            ) && slot.role !== "goalkeeper"
                                              ? 1
                                              : 1.02,
                                        }}
                                        onClick={() =>
                                          setSlotRole(index, "goalkeeper")
                                        }
                                        disabled={
                                          !canSelectRole(index, "goalkeeper") &&
                                          slot.role !== "goalkeeper"
                                        }
                                        className={`p-3 border-2 rounded-xl transition-all text-left relative ${
                                          !canSelectRole(index, "goalkeeper") &&
                                          slot.role !== "goalkeeper"
                                            ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                                            : slot.role === "goalkeeper"
                                              ? "border-blue-600 bg-blue-100 shadow-md"
                                              : "border-blue-200 bg-white hover:border-blue-400 cursor-pointer"
                                        }`}
                                      >
                                        <Shield
                                          className={`w-5 h-5 mb-1 ${slot.role === "goalkeeper" ? "text-blue-600" : "text-gray-400"}`}
                                        />
                                        <div
                                          className={`text-xs font-medium ${slot.role === "goalkeeper" ? "text-blue-600" : "text-gray-600"}`}
                                        >
                                          Goalkeeper
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          {hasPhaseDiscount ? (
                                            <span>
                                              <span className="line-through text-gray-300 mr-1">
                                                {formatCurrency(baseFeeGk)}
                                              </span>
                                              <span className="text-blue-600 font-semibold">
                                                {formatCurrency(effectiveFeeGk)}
                                              </span>
                                            </span>
                                          ) : (
                                            formatCurrency(effectiveFeeGk)
                                          )}
                                        </div>
                                        {slot.role === "goalkeeper" && (
                                          <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs">
                                              ✓
                                            </span>
                                          </div>
                                        )}
                                      </motion.button>
                                    )}
                                    <motion.button
                                      whileHover={{
                                        scale:
                                          !canSelectRole(index, "player") &&
                                          slot.role !== "player"
                                            ? 1
                                            : 1.02,
                                      }}
                                      onClick={() =>
                                        setSlotRole(index, "player")
                                      }
                                      disabled={
                                        !canSelectRole(index, "player") &&
                                        slot.role !== "player"
                                      }
                                      className={`p-3 border-2 rounded-xl transition-all text-left relative ${
                                        !canSelectRole(index, "player") &&
                                        slot.role !== "player"
                                          ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                                          : slot.role === "player"
                                            ? "border-blue-600 bg-blue-100 shadow-md"
                                            : "border-blue-200 bg-white hover:border-blue-400 cursor-pointer"
                                      }`}
                                    >
                                      <User
                                        className={`w-5 h-5 mb-1 ${slot.role === "player" ? "text-blue-600" : "text-gray-400"}`}
                                      />
                                      <div
                                        className={`text-xs font-medium ${slot.role === "player" ? "text-blue-600" : "text-gray-600"}`}
                                      >
                                        Player
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {hasPhaseDiscount ? (
                                          <span>
                                            <span className="line-through text-gray-300 mr-1">
                                              {formatCurrency(baseFeePlayer)}
                                            </span>
                                            <span className="text-blue-600 font-semibold">
                                              {formatCurrency(
                                                effectiveFeePlayer,
                                              )}
                                            </span>
                                          </span>
                                        ) : (
                                          formatCurrency(effectiveFeePlayer)
                                        )}
                                      </div>
                                      {slot.role === "player" && (
                                        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                          <span className="text-white text-xs">
                                            ✓
                                          </span>
                                        </div>
                                      )}
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>

                          {slots.length < getMaxQuantity() && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={addSlot}
                              className="mt-3 w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-blue-300 rounded-2xl text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition-all text-sm font-medium"
                            >
                              <Plus className="w-4 h-4" /> Tambah Teman
                              <span className="text-xs text-gray-400 font-normal">
                                ({slots.length}/{getMaxQuantity()} slot)
                              </span>
                            </motion.button>
                          )}

                          {slots.length >= getMaxQuantity() && (
                            <p className="mt-3 text-center text-xs text-gray-400">
                              Slot sudah penuh ({slots.length}/
                              {getMaxQuantity()})
                            </p>
                          )}

                          {slots.some((s) => s.role !== null) && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl space-y-1.5">
                              {slots.map(
                                (s, i) =>
                                  s.role && (
                                    <div
                                      key={i}
                                      className="flex flex-wrap items-center gap-1.5 text-sm text-green-700"
                                    >
                                      {s.role === "goalkeeper" ? (
                                        <Shield className="w-3.5 h-3.5" />
                                      ) : (
                                        <User className="w-3.5 h-3.5" />
                                      )}
                                      <span className="font-medium">
                                        {i === 0
                                          ? user?.name || name || "Anda"
                                          : s.name || `Teman ${i}`}
                                      </span>
                                      {i > 0 && s.phone && (
                                        <>
                                          <span className="text-green-400">
                                            ·
                                          </span>
                                          <span className="text-green-600 text-xs">
                                            {s.phone}
                                          </span>
                                        </>
                                      )}
                                      <span className="text-green-400">·</span>
                                      <span className="capitalize">
                                        {s.role}
                                      </span>
                                      {s.jerseySize && (
                                        <>
                                          <span className="text-green-400">
                                            ·
                                          </span>
                                          <span>Jersey {s.jerseySize}</span>
                                          {getJerseySurcharge(s.jerseySize) >
                                            0 && (
                                            <span className="text-amber-600 text-xs font-semibold">
                                              (+
                                              {formatCurrency(
                                                getJerseySurcharge(
                                                  s.jerseySize,
                                                ),
                                              )}
                                              )
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  ),
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── Team Form ───────────────────────────────────────────────── */}
                {bookingType === "team" && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="p-8 bg-white border border-blue-200 rounded-3xl space-y-6 shadow-xl"
                  >
                    <h3 className="text-blue-600">Person in Charge (PIC)</h3>

                    {/* Jersey surcharge info banner */}
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                        <Shirt className="w-3.5 h-3.5" />
                        Info Ukuran Jersey
                      </p>
                      <p className="text-[11px] text-amber-600 mt-1">
                        XXL & XXXL: tambahan biaya <strong>IDR 20.000</strong> ·
                        4XL: tambahan biaya <strong>IDR 40.000</strong>
                      </p>
                    </div>

                    {[
                      {
                        label: "PIC Name",
                        value: picName,
                        setter: setPicName,
                        type: "text",
                        placeholder: "Enter PIC name",
                        icon: User,
                        transform: noSpace,
                      },
                      {
                        label: "PIC Email",
                        value: picEmail,
                        setter: setPicEmail,
                        type: "text",
                        placeholder: "pic@email.com",
                        icon: Mail,
                        transform: noSpace,
                      },
                      {
                        label: "PIC WhatsApp",
                        value: whatsapp,
                        setter: setWhatsapp,
                        type: "tel",
                        placeholder: "0812 3456 7890",
                        icon: Phone,
                        transform: onlyNumbers,
                      },
                    ].map(
                      ({
                        label,
                        value,
                        setter,
                        type,
                        placeholder,
                        icon: Icon,
                        transform,
                      }) => (
                        <div key={label}>
                          <label className="block text-gray-600 mb-2">
                            {label} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type={type}
                              value={value}
                              disabled={isLocked}
                              onChange={(e) =>
                                setter(transform(e.target.value))
                              }
                              placeholder={placeholder}
                              className={`w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 text-gray-900 ${isLocked ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed" : ""}`}
                            />
                          </div>
                        </div>
                      ),
                    )}

                    <div>
                      <label className="block text-gray-600 mb-2">
                        Ukuran Jersey PIC{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Shirt className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={picJerseySize}
                          onChange={(e) => setPicJerseySize(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 text-gray-900 appearance-none cursor-pointer"
                        >
                          <option value="">Pilih ukuran</option>
                          {JERSEY_SIZES.map((size) => {
                            const sc = getJerseySurcharge(size);
                            return (
                              <option key={size} value={size}>
                                {size}
                                {sc > 0
                                  ? ` (+IDR ${sc.toLocaleString("id-ID")})`
                                  : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <JerseySurchargeNote size={picJerseySize} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-600 mb-2">
                          Nama Jersey PIC{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={picJerseyName}
                            onChange={(e) =>
                              setPicJerseyName(noSpace(e.target.value))
                            }
                            placeholder="e.g. CAPTAIN"
                            className="w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 text-gray-900 uppercase"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-2">
                          Nomor Jersey PIC{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={picJerseyNumber}
                            onChange={(e) =>
                              setPicJerseyNumber(onlyNumbers(e.target.value))
                            }
                            placeholder="e.g. 10"
                            maxLength={3}
                            className="w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 text-gray-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PIC sebagai GK toggle */}
                    <div
                      onClick={handleTogglePicGk}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        picIsGk
                          ? "border-amber-400 bg-amber-50"
                          : "border-gray-200 bg-gray-50 hover:border-amber-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${picIsGk ? "bg-amber-400" : "bg-gray-200"}`}
                        >
                          <Shield
                            className={`w-5 h-5 ${picIsGk ? "text-white" : "text-gray-400"}`}
                          />
                        </div>
                        <div>
                          <p
                            className={`text-sm font-semibold ${picIsGk ? "text-amber-700" : "text-gray-700"}`}
                          >
                            PIC sebagai Goalkeeper
                          </p>
                          <p className="text-xs text-gray-500">
                            Centang jika PIC adalah penjaga gawang tim
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${picIsGk ? "border-amber-400 bg-amber-400" : "border-gray-300"}`}
                      >
                        {picIsGk && (
                          <span className="text-white text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Include Roster toggle */}
                    <div className="pt-4 border-t border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="text-blue-600 font-medium">
                              Include Team Roster
                            </h4>
                            <p className="text-sm text-gray-500">
                              Add {ROSTER_SIZE} player details (optional)
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIncludeRoster(!includeRoster)}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${includeRoster ? "bg-blue-600" : "bg-gray-300"}`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${includeRoster ? "translate-x-7" : "translate-x-1"}`}
                          />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {includeRoster && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-blue-600">
                              Team Roster ({ROSTER_SIZE} Players)
                            </h3>
                          </div>

                          {/* GK assignment info banner */}
                          <div
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border ${
                              hasGkAssigned
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : "bg-red-50 border-red-200 text-red-500"
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                            {hasGkAssigned
                              ? picIsGk
                                ? `GK: ${picName || "PIC"} · ${players.length} Player`
                                : `GK: ${players[gkInRoster]?.name || `Player ${gkInRoster + 1}`} · ${players.length - 1} Player lainnya`
                              : "Tentukan siapa Goalkeeper tim — klik tombol 'Set GK' pada PIC atau salah satu player"}
                          </div>

                          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                            {players.map((player, index) => (
                              <motion.div
                                key={index}
                                layout
                                className={`p-4 rounded-2xl border-2 transition-all ${
                                  player.isGk
                                    ? "bg-amber-50 border-amber-300"
                                    : "bg-blue-50 border-transparent"
                                }`}
                              >
                                {/* Player header */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                        player.isGk
                                          ? "bg-amber-400 text-white"
                                          : "bg-blue-200 text-blue-700"
                                      }`}
                                    >
                                      {index + 1}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                      {player.isGk
                                        ? "Goalkeeper"
                                        : `Player ${index + 1}`}
                                    </span>
                                    {player.isGk && (
                                      <span className="text-xs px-2 py-0.5 bg-amber-400 text-white rounded-full font-semibold">
                                        GK
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePlayerGk(index)}
                                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-all border flex-shrink-0 ${
                                      player.isGk
                                        ? "bg-amber-400 text-white border-amber-400 hover:bg-amber-500"
                                        : "bg-white text-gray-500 border-gray-200 hover:border-amber-400 hover:text-amber-600"
                                    }`}
                                  >
                                    <Shield className="w-3.5 h-3.5" />
                                    {player.isGk ? "Batal GK" : "Set GK"}
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <input
                                    type="text"
                                    value={player.name}
                                    onChange={(e) =>
                                      handlePlayerChange(
                                        index,
                                        "name",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Nama *"
                                    className={`px-4 py-2 bg-white border rounded-xl focus:outline-none text-gray-900 text-sm ${
                                      player.isGk
                                        ? "border-amber-200 focus:border-amber-400"
                                        : "border-blue-200 focus:border-blue-400"
                                    }`}
                                  />

                                  <div className="flex flex-col gap-1">
                                    <input
                                      type="tel"
                                      value={player.phone}
                                      onChange={(e) =>
                                        handlePlayerChange(
                                          index,
                                          "phone",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="No HP * (min. 10 digit)"
                                      className={`px-4 py-2 bg-white border rounded-xl focus:outline-none text-gray-900 text-sm ${
                                        phoneErrors[index] ||
                                        phoneFormatErrors[index]
                                          ? "border-red-400 bg-red-50"
                                          : player.isGk
                                            ? "border-amber-200 focus:border-amber-400"
                                            : "border-blue-200 focus:border-blue-400"
                                      }`}
                                    />
                                    {phoneFormatErrors[index] && (
                                      <p className="text-xs text-red-500 flex items-center gap-1">
                                        <span>⚠</span>{" "}
                                        {phoneFormatErrors[index]}
                                      </p>
                                    )}
                                    {phoneErrors[index] && (
                                      <p className="text-xs text-red-500 flex items-center gap-1">
                                        <span>⚠</span> {phoneErrors[index]}
                                      </p>
                                    )}
                                  </div>

                                  {/* Email — wajib */}
                                  <div className="flex flex-col gap-1 sm:col-span-2">
                                    <input
                                      type="text"
                                      value={player.email}
                                      onChange={(e) =>
                                        handlePlayerChange(
                                          index,
                                          "email",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Email * (wajib diisi)"
                                      className={`px-4 py-2 bg-white border rounded-xl focus:outline-none text-gray-900 text-sm ${
                                        emailErrors[index] ||
                                        emailFormatErrors[index]
                                          ? "border-red-400 bg-red-50"
                                          : player.isGk
                                            ? "border-amber-200 focus:border-amber-400"
                                            : "border-blue-200 focus:border-blue-400"
                                      }`}
                                    />
                                    {emailFormatErrors[index] && (
                                      <p className="text-xs text-red-500 flex items-center gap-1">
                                        <span>⚠</span>{" "}
                                        {emailFormatErrors[index]}
                                      </p>
                                    )}
                                    {emailErrors[index] && (
                                      <p className="text-xs text-red-500 flex items-center gap-1">
                                        <span>⚠</span> {emailErrors[index]}
                                      </p>
                                    )}
                                  </div>

                                  {/* Jersey size, name, number — semua wajib */}
                                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-1">
                                      <select
                                        value={player.jerseySize}
                                        onChange={(e) =>
                                          handlePlayerChange(
                                            index,
                                            "jerseySize",
                                            e.target.value,
                                          )
                                        }
                                        className={`w-full px-4 py-2 bg-white border rounded-xl focus:outline-none text-gray-900 appearance-none cursor-pointer text-sm ${
                                          player.isGk
                                            ? "border-amber-200 focus:border-amber-400"
                                            : "border-blue-200 focus:border-blue-400"
                                        }`}
                                      >
                                        <option value="">Jersey Size *</option>
                                        {JERSEY_SIZES.map((size) => {
                                          const sc = getJerseySurcharge(size);
                                          return (
                                            <option key={size} value={size}>
                                              {size}
                                              {sc > 0
                                                ? ` (+${sc.toLocaleString("id-ID")})`
                                                : ""}
                                            </option>
                                          );
                                        })}
                                      </select>
                                      <JerseySurchargeNote
                                        size={player.jerseySize}
                                      />
                                    </div>

                                    <input
                                      type="text"
                                      value={player.jerseyName}
                                      onChange={(e) =>
                                        handlePlayerChange(
                                          index,
                                          "jerseyName",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Nama Jersey *"
                                      className={`px-4 py-2 bg-white border rounded-xl focus:outline-none text-gray-900 uppercase text-sm ${
                                        player.isGk
                                          ? "border-amber-200 focus:border-amber-400"
                                          : "border-blue-200 focus:border-blue-400"
                                      }`}
                                    />

                                    <input
                                      type="text"
                                      value={player.jerseyNumber}
                                      onChange={(e) =>
                                        handlePlayerChange(
                                          index,
                                          "jerseyNumber",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Nomor Jersey *"
                                      maxLength={3}
                                      className={`px-4 py-2 bg-white border rounded-xl focus:outline-none text-gray-900 text-sm ${
                                        player.isGk
                                          ? "border-amber-200 focus:border-amber-400"
                                          : "border-blue-200 focus:border-blue-400"
                                      }`}
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* ── Add Ons ─────────────────────────────────────────────────── */}
                {addOns.filter((a) => a.isActive).length > 0 && (
                  <AddOnSelector
                    addOns={addOns}
                    selected={selectedAddOns}
                    onChange={handleAddOnChange}
                  />
                )}
              </div>

              {/* ── Right Column — Order Summary ──────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="lg:sticky lg:top-24 h-fit"
              >
                <div className="p-8 bg-white border border-blue-200 rounded-3xl space-y-6 shadow-xl overflow-hidden">
                  <h3 className="text-blue-600">Order Summary</h3>

                  <div className="space-y-4 pb-6 border-b border-blue-200">
                    <div className="text-gray-600">Event Details</div>
                    <div className="flex items-start gap-3 text-gray-600">
                      <MapPin className="w-4 h-4 mt-1 text-blue-600 flex-shrink-0" />
                      <span>{getVenueName(event?.venue)}</span>
                    </div>
                    <div className="flex items-start gap-3 text-gray-600">
                      <Clock className="w-4 h-4 mt-1 text-blue-600 flex-shrink-0" />
                      <span>
                        {event?.startDate
                          ? formatDateShort(event.startDate)
                          : "-"}
                        {event?.endDate &&
                          event.endDate !== event.startDate &&
                          ` – ${formatDateShort(event.endDate)}`}
                      </span>
                    </div>
                    {selectedTeam && (
                      <div className="flex items-center gap-2.5">
                        {selectedTeam.imageUrl ? (
                          <img
                            src={selectedTeam.imageUrl}
                            alt={selectedTeam.name}
                            className="w-6 h-6 rounded-md object-cover border border-gray-200"
                          />
                        ) : (
                          <Trophy className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        )}
                        <span className="text-gray-600 text-sm">
                          {selectedTeam.name}
                        </span>
                        {isMulti && selectedPot && (
                          <PotBadge
                            pot={selectedPot}
                            index={selectedPotIndex}
                          />
                        )}
                      </div>
                    )}
                    {activePhase && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                        <Zap className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span className="text-xs text-amber-700 font-medium">
                          Potongan harga {activePhase.name} berlaku
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Voucher */}
                  <div className="space-y-3 pb-6 border-b border-blue-200">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Tag className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Punya Kode Voucher?</span>
                    </div>
                    {!user ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                          !
                        </div>
                        <div>
                          <p className="text-amber-800 text-sm font-medium">
                            Login diperlukan
                          </p>
                          <p className="text-amber-700 text-xs">
                            Silakan login untuk menggunakan voucher
                          </p>
                        </div>
                      </div>
                    ) : !appliedVoucher ? (
                      <div className="flex flex-col gap-2">
                        <input
                          value={voucherCode}
                          onChange={(e) =>
                            setVoucherCode(e.target.value.toUpperCase())
                          }
                          placeholder="Masukkan kode"
                          className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
                        />
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={handleApplyVoucher}
                          disabled={isCheckingVoucher}
                          className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                        >
                          {isCheckingVoucher ? "Memvalidasi..." : "Apply"}
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-green-600" />
                          <span className="text-green-700 font-medium text-sm">
                            {appliedVoucher.code}
                          </span>
                        </div>
                        <button
                          onClick={handleRemoveVoucher}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pricing breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-black">Booking Type</span>
                      <span className="capitalize">
                        {bookingType}
                        {bookingType === "individual" &&
                          ` (${bookingQuantity}x slot)`}
                      </span>
                    </div>

                    {isMulti && selectedPot && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Pot</span>
                        <span className="font-medium">{selectedPot.name}</span>
                      </div>
                    )}

                    {bookingType === "individual" &&
                      (gkCount > 0 || playerCount > 0) && (
                        <div className="space-y-1.5 pl-2 border-l-2 border-blue-100">
                          {gkCount > 0 && (
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{gkCount}x Goalkeeper</span>
                              <div className="text-right">
                                {hasPhaseDiscount && (
                                  <div className="text-xs text-gray-400 line-through">
                                    {formatCurrency(gkCount * baseFeeGk)}
                                  </div>
                                )}
                                <div>
                                  {formatCurrency(gkCount * effectiveFeeGk)}
                                </div>
                              </div>
                            </div>
                          )}
                          {playerCount > 0 && (
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{playerCount}x Player</span>
                              <div className="text-right">
                                {hasPhaseDiscount && (
                                  <div className="text-xs text-gray-400 line-through">
                                    {formatCurrency(
                                      playerCount * baseFeePlayer,
                                    )}
                                  </div>
                                )}
                                <div>
                                  {formatCurrency(
                                    playerCount * effectiveFeePlayer,
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    <div className="flex justify-between">
                      <span>Harga Booking</span>
                      <span>
                        {gkCount > 0 ||
                        playerCount > 0 ||
                        bookingType === "team"
                          ? formatCurrency(pricing.basePrice)
                          : "-"}
                      </span>
                    </div>

                    {pricing.phaseDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          Diskon {activePhase?.name}
                          {(partialDiscount.normalGk > 0 ||
                            partialDiscount.normalPlayer > 0) && (
                            <span className="text-[10px] text-green-500 ml-1">
                              (partial)
                            </span>
                          )}
                        </span>
                        <span>- {formatCurrency(pricing.phaseDiscount)}</span>
                      </div>
                    )}

                    {bookingType === "team" && pricing.teamDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          Diskon Team Booking (5%)
                        </span>
                        <span>- {formatCurrency(pricing.teamDiscount)}</span>
                      </div>
                    )}

                    {isMember &&
                      bookingType !== "team" &&
                      pricing.memberDiscount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-green-600 font-medium">
                            Member Discount (10%)
                          </span>
                          <span className="text-green-600">
                            - {formatCurrency(pricing.memberDiscount)}
                          </span>
                        </div>
                      )}

                    {pricing.voucherDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Voucher Discount</span>
                        <span>- {formatCurrency(pricing.voucherDiscount)}</span>
                      </div>
                    )}

                    {addOnLineItems().map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm text-gray-700"
                      >
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-blue-400" />
                          {item.qty}x {item.name}
                        </span>
                        <span>{formatCurrency(item.qty * item.price)}</span>
                      </div>
                    ))}

                    {jerseySurchargeItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm text-amber-700"
                      >
                        <span className="flex items-center gap-1">
                          <Shirt className="w-3.5 h-3.5 text-amber-500" />
                          {item.label}
                        </span>
                        <span>+ {formatCurrency(item.amount)}</span>
                      </div>
                    ))}

                    {pricing.adminFee > 0 && (
                      <div className="flex justify-between text-black">
                        <span>Biaya Admin</span>
                        <span>{formatCurrency(pricing.adminFee)}</span>
                      </div>
                    )}

                    <div className="flex justify-between pt-4 border-t border-blue-200 font-bold text-lg">
                      <span>Total</span>
                      <span>IDR {pricing.total.toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{
                      boxShadow:
                        isFormValid() && !isBookingLoading
                          ? "0 12px 30px rgba(37, 99, 235, 0.35)"
                          : undefined,
                    }}
                    whileTap={{
                      scale: isFormValid() && !isBookingLoading ? 0.98 : 1,
                    }}
                    onClick={handleBookingConfirmation}
                    disabled={isBookingLoading || !isFormValid()}
                    className={`w-full px-6 py-4 rounded-full transition-all shadow-md ${
                      isFormValid() && !isBookingLoading
                        ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isBookingLoading ? "Processing..." : "Proceed to Pay"}
                  </motion.button>

                  {!isFormValid() && !isBookingLoading && (
                    <p className="text-center text-sm text-red-500">
                      {getFormInvalidReason()}
                    </p>
                  )}

                  <p className="text-center text-sm text-gray-500">
                    Secure payment via QRIS
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <PaymentSuccessModal
        isOpen={successPayment}
        onClose={() => {
          setSuccessPayment(false);
          router.push("/event");
        }}
        amount={amount}
        productName="Booking Event"
      />
    </>
  );
}
