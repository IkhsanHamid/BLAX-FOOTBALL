"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Trophy,
  DollarSign,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Button from "@/components/atoms/Button";
import { Card, CardContent } from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/Table";
import Badge from "@/components/atoms/Badge";
import ConfirmationModal from "../molecules/ConfirmationModal";
import Pagination from "../atoms/Pagination";
import ImageUpload from "@/components/atoms/ImageUpload";
import { adminService } from "@/utils/admin";
import { masterDataService } from "@/utils/masterData";

// ─── Types ────────────────────────────────────────────────────────────────────

type TypeMatch = "FOOTBALL" | "MINI-SOCCER" | "MINI-FOOTBALL" | "PADEL";
type SubView = "list" | "add" | "edit";
type PricingMode = "single" | "multi";

/**
 * Pot harga — setiap pot punya fee sendiri.
 * Tim akan di-assign ke salah satu pot.
 */
interface PotInput {
  id?: string; // ada jika dari server (edit mode)
  localId: string; // client-side key agar stabil saat re-render
  name: string; // contoh: "Pot 1", "Pot Elite"
  feePlayer: string;
  feeGk: string;
}

interface TeamInput {
  id: string;
  name: string;
  imageFile: File | null;
  imageUrl: string;
  /** localId pot yang dipilih (hanya relevan jika pricingMode === 'multi') */
  potLocalId: string;
}

export interface Venue {
  id: string;
  name: string;
  gmapLink: string;
  address: string;
}

export interface Rule {
  id: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Facility {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

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
  venueId?: string;
  maxPlayers?: number;
  typeMatch?: TypeMatch;
  totalTeams?: number;
  teams?: TeamInput[];
  facilityIds?: string[];
  ruleIds?: string[];
  addOns?: AddOnInput[];
  phases?: PhaseInput[];
  pricingMode?: PricingMode;
  pots?: PotInput[];
  isOnlyTeam: boolean;
  isOnlyIndividual: boolean;
}

interface EventForm {
  name: string;
  dateStart: string;
  dateEnd: string;
  venueId: string;
  /** Harga global (single price mode) */
  feePlayer: string;
  feeGk: string;
  typeMatch: TypeMatch;
  description: string;
  imageFile: File | null;
  imageUrl: string;
  totalTeams: string;
  teams: TeamInput[];
  facilityIds: string[];
  ruleIds: string[];
  addOns: AddOnInput[];
  phases: PhaseInput[];
  isOpen: boolean;
  /** Mode harga: 'single' = satu harga global, 'multi' = per pot */
  pricingMode: PricingMode;
  isOnlyTeam: boolean;
  isOnlyIndividual: boolean;
  /** Daftar pot (hanya relevan jika pricingMode === 'multi') */
  pots: PotInput[];
}

interface EventTabProps {
  showError?: (title: string, message: string) => void;
  showSuccess?: (message: string) => void;
}

interface AddOnInput {
  id?: string;
  name: string;
  price: string;
  stock?: string;
  maxPerBooking: string;
  isActive: boolean;
}

interface PhaseInput {
  id?: string;
  name: string;
  order: string;
  feePlayer: string;
  feeGk: string;
  startDate: string;
  endDate: string;
  quotaPlayer: string;
  quotaGk: string;
  isActive: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const TYPE_MATCH_OPTIONS: { value: TypeMatch; label: string }[] = [
  { value: "FOOTBALL", label: "Football" },
  { value: "MINI-SOCCER", label: "Mini Soccer" },
  { value: "MINI-FOOTBALL", label: "Mini Football" },
  { value: "PADEL", label: "Padel" },
];

const OPEN_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "open", label: "Open" },
  { value: "upcoming", label: "Upcoming" },
];

/** Warna badge per pot (cycling) */
const POT_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
];

const POT_BADGE_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-cyan-500",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatCurrencyDisplay = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
};

const formatCurrencyShort = (value: number) =>
  value >= 1_000_000
    ? `${(value / 1_000_000).toFixed(1)}jt`
    : value >= 1_000
      ? `${(value / 1_000).toFixed(0)}rb`
      : String(value);

const getStatusFromIsOpen = (isOpen: boolean) => (isOpen ? "OPEN" : "UPCOMING");

const STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800",
  UPCOMING: "bg-blue-100 text-blue-800",
};

const makePot = (index: number): PotInput => ({
  localId: `pot-${Date.now()}-${index}`,
  name: `Pot ${index + 1}`,
  feePlayer: "",
  feeGk: "",
});

const makeTeam = (index: number, potLocalId = ""): TeamInput => ({
  id: `new-${Date.now()}-${index}`,
  name: "",
  imageFile: null,
  imageUrl: "",
  potLocalId,
});

const buildFormData = (form: EventForm): FormData => {
  const fd = new FormData();

  fd.append("name", form.name);
  fd.append("description", form.description);
  fd.append("startDate", form.dateStart);
  fd.append("endDate", form.dateEnd);
  fd.append("venueId", form.venueId);
  fd.append("totalTeam", form.totalTeams);
  fd.append("typeMatch", form.typeMatch);
  fd.append("isOpen", String(form.isOpen));
  fd.append("isOnlyTeam", String(form.isOnlyTeam));
  fd.append("isOnlyIndividual", String(form.isOnlyIndividual));
  fd.append("pricingMode", form.pricingMode);

  if (form.pricingMode === "single") {
    fd.append("feePlayer", form.feePlayer || "0");
    fd.append("feeGk", form.feeGk || "0");
  } else {
    // Multi-pot: kirim global fee = 0, pot detail di-append terpisah
    fd.append("feePlayer", "0");
    fd.append("feeGk", "0");

    form.pots.forEach((pot, i) => {
      if (pot.id) fd.append(`pots[${i}][id]`, pot.id);
      fd.append(`pots[${i}][name]`, pot.name);
      fd.append(`pots[${i}][feePlayer]`, pot.feePlayer || "0");
      fd.append(`pots[${i}][feeGk]`, pot.feeGk || "0");
    });

    // Append potIndex ke setiap tim agar backend tahu di pot mana
    form.teams.forEach((team, i) => {
      const potIdx = form.pots.findIndex((p) => p.localId === team.potLocalId);
      if (potIdx !== -1) fd.append(`team[${i}][potIndex]`, String(potIdx));
    });
  }

  form.addOns.forEach((a, i) => {
    if (a.id) fd.append(`addOns[${i}][id]`, a.id);
    fd.append(`addOns[${i}][name]`, a.name);
    fd.append(`addOns[${i}][price]`, a.price);
    if (a.stock) fd.append(`addOns[${i}][stock]`, a.stock);
    fd.append(`addOns[${i}][maxPerBooking]`, a.maxPerBooking);
    fd.append(`addOns[${i}][isActive]`, String(a.isActive));
  });

  form.phases.forEach((p, i) => {
    if (p.id) fd.append(`phases[${i}][id]`, p.id);
    fd.append(`phases[${i}][name]`, p.name);
    fd.append(`phases[${i}][order]`, p.order);
    fd.append(`phases[${i}][feePlayer]`, p.feePlayer);
    fd.append(`phases[${i}][feeGk]`, p.feeGk);
    fd.append(`phases[${i}][startDate]`, p.startDate);
    fd.append(`phases[${i}][endDate]`, p.endDate);
    if (p.quotaPlayer) fd.append(`phases[${i}][quotaPlayer]`, p.quotaPlayer);
    if (p.quotaGk) fd.append(`phases[${i}][quotaGk]`, p.quotaGk);
    fd.append(`phases[${i}][isActive]`, String(p.isActive));
  });

  if (form.imageFile) fd.append("image", form.imageFile);

  form.teams.forEach((team, i) => {
    if (team.id && !team.id.startsWith("new-"))
      fd.append(`team[${i}][id]`, team.id);
    fd.append(`team[${i}][name]`, team.name);
    if (team.imageFile) fd.append(`imageTeam${i + 1}`, team.imageFile);
  });

  form.facilityIds.forEach((id) => fd.append("facilityIds[]", id));
  form.ruleIds.forEach((id) => fd.append("ruleIds[]", id));

  return fd;
};

const INITIAL_FORM: EventForm = {
  name: "",
  dateStart: "",
  dateEnd: "",
  venueId: "",
  feePlayer: "",
  feeGk: "",
  typeMatch: "MINI-SOCCER",
  description: "",
  imageFile: null,
  imageUrl: "",
  totalTeams: "0",
  teams: [],
  facilityIds: [],
  ruleIds: [],
  addOns: [],
  phases: [],
  isOpen: false,
  isOnlyTeam: true,
  isOnlyIndividual: true,
  pricingMode: "single",
  pots: [],
};

// ─── Shared UI Components ─────────────────────────────────────────────────────

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        {title}
      </h3>
      {action}
    </div>
  );
}

function FormField({
  label,
  required,
  error,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function CheckboxGroup({
  items,
  selected,
  onChange,
  emptyText = "Tidak ada data",
}: {
  items: (Rule | Facility)[];
  selected: string[];
  onChange: (ids: string[]) => void;
  emptyText?: string;
}) {
  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  };

  if (items.length === 0) {
    return <p className="text-xs text-gray-400 py-2">{emptyText}</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {items.map((item) => {
        const checked = selected.includes(item.id);
        const label = "description" in item ? item.description : item.name;
        return (
          <label
            key={item.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
              checked
                ? "border-sky-500 bg-sky-50 text-sky-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <input
              type="checkbox"
              className="accent-sky-500"
              checked={checked}
              onChange={() => toggle(item.id)}
            />
            {label}
          </label>
        );
      })}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  disabled,
  error,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
        error ? "border-red-400" : "border-gray-300"
      } ${className ?? ""}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  loading,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled || loading}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 disabled:cursor-not-allowed
        ${loading ? "opacity-70 bg-gray-200" : checked ? "bg-green-500" : "bg-gray-300"}
      `}
    >
      {loading ? (
        // Spinner menggantikan thumb saat loading
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-3 h-3 border-2 border-gray-400 border-t-sky-500 rounded-full animate-spin" />
        </span>
      ) : (
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      )}
    </button>
  );
}

// ─── Pot Badge ────────────────────────────────────────────────────────────────

function PotBadge({
  potIndex,
  potName,
}: {
  potIndex: number;
  potName: string;
}) {
  const color = POT_COLORS[potIndex % POT_COLORS.length];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${color}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${POT_BADGE_COLORS[potIndex % POT_BADGE_COLORS.length]}`}
      />
      {potName}
    </span>
  );
}

// ─── Pricing Mode Selector ────────────────────────────────────────────────────

function PricingModeSelector({
  value,
  onChange,
}: {
  value: PricingMode;
  onChange: (v: PricingMode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(
        [
          {
            mode: "single" as PricingMode,
            icon: DollarSign,
            title: "Satu Harga",
            desc: "Semua tim bayar harga yang sama",
          },
          {
            mode: "multi" as PricingMode,
            icon: Layers,
            title: "Multi Pot",
            desc: "Tiap grup tim (pot) punya harga berbeda",
          },
        ] as const
      ).map(({ mode, icon: Icon, title, desc }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
            value === mode
              ? "border-sky-500 bg-sky-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div
            className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              value === mode
                ? "bg-sky-500 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p
              className={`text-sm font-semibold ${value === mode ? "text-sky-700" : "text-gray-700"}`}
            >
              {title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
          </div>
          {value === mode && (
            <span className="ml-auto flex-shrink-0 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">✓</span>
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Pot Manager ──────────────────────────────────────────────────────────────

function PotManager({
  pots,
  teams,
  errors,
  onAddPot,
  onUpdatePot,
  onRemovePot,
}: {
  pots: PotInput[];
  teams: TeamInput[];
  errors: Record<string, string>;
  onAddPot: () => void;
  onUpdatePot: (localId: string, patch: Partial<PotInput>) => void;
  onRemovePot: (localId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {pots.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
          Belum ada pot. Tambahkan minimal 1 pot.
        </p>
      )}

      {pots.map((pot, i) => {
        const teamsInPot = teams.filter((t) => t.potLocalId === pot.localId);
        const colorClass = POT_COLORS[i % POT_COLORS.length];

        return (
          <div
            key={pot.localId}
            className={`rounded-xl border-2 p-4 space-y-3 ${
              i === 0
                ? "border-blue-200 bg-blue-50/40"
                : i === 1
                  ? "border-purple-200 bg-purple-50/40"
                  : i === 2
                    ? "border-emerald-200 bg-emerald-50/40"
                    : i === 3
                      ? "border-orange-200 bg-orange-50/40"
                      : "border-gray-200 bg-gray-50/40"
            }`}
          >
            {/* Pot header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PotBadge potIndex={i} potName={pot.name || `Pot ${i + 1}`} />
                <span className="text-xs text-gray-400">
                  {teamsInPot.length} tim
                </span>
              </div>
              {pots.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemovePot(pot.localId)}
                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Pot name */}
            <FormField
              label="Nama Pot"
              required
              error={errors[`pot_${pot.localId}_name`]}
            >
              <Input
                value={pot.name}
                onChange={(e) =>
                  onUpdatePot(pot.localId, { name: e.target.value })
                }
                placeholder={`Contoh: Pot ${i + 1} / Pot Elite`}
                className={
                  errors[`pot_${pot.localId}_name`] ? "border-red-400" : ""
                }
              />
            </FormField>

            {/* Pot fees */}
            <div className="grid sm:grid-cols-2 gap-3">
              <FormField
                label="Fee Pemain (Rp)"
                required
                error={errors[`pot_${pot.localId}_feePlayer`]}
              >
                <Input
                  type="text"
                  value={formatCurrencyDisplay(pot.feePlayer)}
                  onChange={(e) =>
                    onUpdatePot(pot.localId, {
                      feePlayer: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="0"
                  className={
                    errors[`pot_${pot.localId}_feePlayer`]
                      ? "border-red-400"
                      : ""
                  }
                />
              </FormField>
              <FormField
                label="Fee Kiper (Rp)"
                required
                error={errors[`pot_${pot.localId}_feeGk`]}
              >
                <Input
                  type="text"
                  value={formatCurrencyDisplay(pot.feeGk)}
                  onChange={(e) =>
                    onUpdatePot(pot.localId, {
                      feeGk: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="0"
                  className={
                    errors[`pot_${pot.localId}_feeGk`] ? "border-red-400" : ""
                  }
                />
              </FormField>
            </div>

            {/* Tim dalam pot (preview) */}
            {teamsInPot.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {teamsInPot.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600"
                  >
                    {t.imageUrl || t.imageFile ? (
                      <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />
                    ) : null}
                    {t.name || (
                      <span className="italic text-gray-400">Tanpa nama</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={onAddPot}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-sky-400 hover:text-sky-500 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Tambah Pot
      </button>
    </div>
  );
}

// ─── Team Card ────────────────────────────────────────────────────────────────

function TeamCard({
  team,
  index,
  mode,
  pricingMode,
  pots,
  errors,
  onUpdate,
  onRemove,
}: {
  team: TeamInput;
  index: number;
  mode: "add" | "edit";
  pricingMode: PricingMode;
  pots: PotInput[];
  errors: Record<string, string>;
  onUpdate: (patch: Partial<TeamInput>) => void;
  onRemove: () => void;
}) {
  const assignedPotIndex = pots.findIndex((p) => p.localId === team.potLocalId);
  const assignedPot = assignedPotIndex !== -1 ? pots[assignedPotIndex] : null;

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        pricingMode === "multi" && assignedPot
          ? `border-l-4 ${
              assignedPotIndex === 0
                ? "border-l-blue-400 bg-blue-50/30"
                : assignedPotIndex === 1
                  ? "border-l-purple-400 bg-purple-50/30"
                  : assignedPotIndex === 2
                    ? "border-l-emerald-400 bg-emerald-50/30"
                    : assignedPotIndex === 3
                      ? "border-l-orange-400 bg-orange-50/30"
                      : "border-l-gray-400 bg-gray-50"
            } border-gray-200`
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-sm font-medium text-gray-700">
            Tim {index + 1}
          </span>
          {/* Pot badge jika multi */}
          {pricingMode === "multi" && assignedPot && (
            <PotBadge potIndex={assignedPotIndex} potName={assignedPot.name} />
          )}
          {pricingMode === "multi" && !assignedPot && (
            <span className="text-xs text-red-400 font-medium">
              Belum dipilih pot
            </span>
          )}
        </div>
        {mode === "edit" && (
          <button
            onClick={onRemove}
            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField
          label="Nama Tim"
          required
          error={errors[`team_${index}_name`]}
        >
          <Input
            value={team.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Contoh: Manchester City"
            className={errors[`team_${index}_name`] ? "border-red-400" : ""}
          />
        </FormField>

        <FormField
          label="Logo / Gambar Tim"
          required
          error={errors[`team_${index}_image`]}
        >
          <ImageUpload
            value={team.imageFile ?? team.imageUrl}
            onChange={(file) => onUpdate({ imageFile: file })}
            error={errors[`team_${index}_image`]}
            maxSize={5}
          />
        </FormField>
      </div>

      {/* Pot selector — hanya tampil jika multi price */}
      {pricingMode === "multi" && pots.length > 0 && (
        <div className="mt-4">
          <FormField
            label="Pilih Pot"
            required
            error={errors[`team_${index}_pot`]}
            hint="Tentukan pot harga untuk tim ini"
          >
            <div className="flex flex-wrap gap-2">
              {pots.map((pot, pi) => {
                const isSelected = team.potLocalId === pot.localId;
                const colorActive = POT_COLORS[pi % POT_COLORS.length];
                return (
                  <button
                    key={pot.localId}
                    type="button"
                    onClick={() => onUpdate({ potLocalId: pot.localId })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? `${colorActive} border-current shadow-sm`
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${POT_BADGE_COLORS[pi % POT_BADGE_COLORS.length]}`}
                    />
                    {pot.name || `Pot ${pi + 1}`}
                    {pot.feePlayer && (
                      <span className="opacity-70">
                        · Rp{formatCurrencyShort(Number(pot.feePlayer))}
                      </span>
                    )}
                    {isSelected && <span className="ml-0.5">✓</span>}
                  </button>
                );
              })}
            </div>
          </FormField>
        </div>
      )}

      {pricingMode === "multi" && pots.length === 0 && (
        <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Buat minimal 1 pot harga terlebih dahulu di bagian "Pengaturan Harga"
        </p>
      )}
    </div>
  );
}

// ─── Event Form View ──────────────────────────────────────────────────────────

function EventFormView({
  mode,
  initialData,
  onBack,
  onSave,
  showError,
}: {
  mode: "add" | "edit";
  initialData?: Event;
  onBack: () => void;
  onSave: () => void;
  showError?: (title: string, message: string) => void;
}) {
  const [form, setForm] = useState<EventForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [isMasterLoading, setIsMasterLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Load master data
  useEffect(() => {
    const loadMasterData = async () => {
      setIsMasterLoading(true);
      try {
        const [venuesData, facilitiesData, rulesData] = await Promise.all([
          masterDataService.getVenues(""),
          masterDataService.getFacilities("", 1, 100),
          masterDataService.getRules("", 1, 100),
        ]);
        setVenues(venuesData);
        setFacilities(facilitiesData.data);
        setRules(rulesData);
      } catch {
        showError?.("Error", "Gagal memuat data master");
      } finally {
        setIsMasterLoading(false);
      }
    };

    loadMasterData();
  }, [showError]);

  // Fetch event detail for edit mode
  useEffect(() => {
    if (mode !== "edit" || !initialData?.id) return;

    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const data = await adminService.getEventDetail(initialData.id);

        // Reconstruct pots dari teams jika ada di response
        const serverPots: PotInput[] = (data.pots ?? []).map((p: any) => ({
          id: p.id,
          localId: `pot-server-${p.id}`,
          name: p.name ?? "",
          feePlayer: String(p.feePlayer ?? 0),
          feeGk: String(p.feeGk ?? 0),
        }));

        const pricingMode: PricingMode =
          data.pricingMode ?? (serverPots.length > 0 ? "multi" : "single");

        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          dateStart: data.startDate ? data.startDate.split("T")[0] : "",
          dateEnd: data.endDate ? data.endDate.split("T")[0] : "",
          venueId: data.venueId ?? "",
          feePlayer: String(data.feePlayer ?? 0),
          feeGk: String(data.feeGk ?? 0),
          typeMatch: data.typeMatch ?? "MINI-SOCCER",
          imageFile: null,
          imageUrl: data.imageUrl ?? "",
          totalTeams: String(data.totalTeam ?? 0),
          facilityIds: (data.facilities ?? []).map((f: any) => f.id),
          ruleIds: (data.rules ?? []).map((r: any) => r.id),
          teams: (data.teams ?? []).map((t: any) => {
            const matchedPot = serverPots.find((p) => p.id === t.potId);
            return {
              id: t.id,
              name: t.name?.trim() ?? "",
              imageFile: null,
              imageUrl: t.imageUrl ?? "",
              potLocalId: matchedPot?.localId ?? "",
            };
          }),
          addOns: (data.addOn ?? []).map((a: any) => ({
            id: a.id,
            name: a.name ?? "",
            price: String(a.price ?? 0),
            stock: a.stock != null ? String(a.stock) : "",
            maxPerBooking: String(a.maxPerBooking ?? 1),
            isActive: a.isActive ?? true,
          })),
          phases: (data.phases ?? []).map((p: any) => ({
            id: p.id,
            name: p.name ?? "",
            order: String(p.order ?? 1),
            feePlayer: String(p.feePlayer ?? 0),
            feeGk: String(p.feeGk ?? 0),
            startDate: p.startDate ? p.startDate.split("T")[0] : "",
            endDate: p.endDate ? p.endDate.split("T")[0] : "",
            quotaPlayer: String(p.quotaPlayer ?? 0),
            quotaGk: String(p.quotaGk ?? 0),
            isActive: p.isActive ?? true,
          })),
          isOpen: data.isOpen ?? false,
          isOnlyTeam: data.isOnlyTeam ?? true,
          isOnlyIndividual: data.isOnlyIndividual ?? true,
          pricingMode,
          pots: serverPots,
        });
      } catch (err: any) {
        showError?.("Error", err.message ?? "Gagal memuat detail event");
      } finally {
        setIsLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [mode, initialData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Form helpers ─────────────────────────────────────────────────────────────

  const setField = <K extends keyof EventForm>(
    field: K,
    value: EventForm[K],
  ) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "totalTeams") {
        const count = Math.max(0, parseInt(value as string) || 0);
        const firstPotLocalId = prev.pots[0]?.localId ?? "";
        next.teams = Array.from(
          { length: count },
          (_, i) => prev.teams[i] ?? makeTeam(i, firstPotLocalId),
        );
      }

      // Jika ganti mode: reset pot & potLocalId tim
      if (field === "pricingMode") {
        if (value === "multi") {
          // Buat 2 pot default jika belum ada
          if (prev.pots.length === 0) {
            next.pots = [makePot(0), makePot(1)];
          }
          // Assign semua tim ke pot pertama sebagai default
          const firstPotLocalId = next.pots[0].localId;
          next.teams = prev.teams.map((t) => ({
            ...t,
            potLocalId: t.potLocalId || firstPotLocalId,
          }));
        } else {
          next.teams = prev.teams.map((t) => ({ ...t, potLocalId: "" }));
        }
      }

      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const updateTeam = (index: number, patch: Partial<TeamInput>) => {
    setForm((prev) => {
      const teams = [...prev.teams];
      teams[index] = { ...teams[index], ...patch };
      return { ...prev, teams };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`team_${index}_name`];
      delete next[`team_${index}_image`];
      delete next[`team_${index}_pot`];
      return next;
    });
  };

  const addTeam = () => {
    setForm((prev) => {
      const firstPotLocalId = prev.pots[0]?.localId ?? "";
      return {
        ...prev,
        teams: [...prev.teams, makeTeam(prev.teams.length, firstPotLocalId)],
        totalTeams: String(prev.teams.length + 1),
      };
    });
  };

  const removeTeam = (index: number) => {
    setForm((prev) => ({
      ...prev,
      teams: prev.teams.filter((_, i) => i !== index),
      totalTeams: String(prev.teams.length - 1),
    }));
  };

  // ── Pot helpers ───────────────────────────────────────────────────────────────

  const addPot = () => {
    setForm((prev) => ({
      ...prev,
      pots: [...prev.pots, makePot(prev.pots.length)],
    }));
  };

  const updatePot = (localId: string, patch: Partial<PotInput>) => {
    setForm((prev) => ({
      ...prev,
      pots: prev.pots.map((p) =>
        p.localId === localId ? { ...p, ...patch } : p,
      ),
    }));
    // Clear pot errors
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`pot_${localId}`)) delete next[k];
      });
      return next;
    });
  };

  const removePot = (localId: string) => {
    setForm((prev) => ({
      ...prev,
      pots: prev.pots.filter((p) => p.localId !== localId),
      // Unassign tim yang ada di pot ini
      teams: prev.teams.map((t) =>
        t.potLocalId === localId ? { ...t, potLocalId: "" } : t,
      ),
    }));
  };

  // ── Validation ────────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.name.trim()) errs.name = "Nama event wajib diisi";
    if (!form.description.trim()) errs.description = "Deskripsi wajib diisi";
    if (!form.dateStart) errs.dateStart = "Tanggal mulai wajib diisi";
    if (!form.dateEnd) errs.dateEnd = "Tanggal selesai wajib diisi";
    if (form.dateStart && form.dateEnd && form.dateEnd <= form.dateStart)
      errs.dateEnd = "Tanggal selesai harus setelah tanggal mulai";
    if (!form.venueId) errs.venueId = "Venue wajib dipilih";
    if (!form.typeMatch) errs.typeMatch = "Tipe pertandingan wajib dipilih";
    if (form.teams.length === 0) errs.totalTeams = "Minimal 1 tim";
    if (form.facilityIds.length === 0)
      errs.facilityIds = "Pilih minimal 1 fasilitas";
    if (form.ruleIds.length === 0) errs.ruleIds = "Pilih minimal 1 peraturan";

    // Pricing validation
    if (form.pricingMode === "single") {
      // fee global tidak wajib ada — bisa 0, tapi validasi jika perlu
    } else {
      // Multi pot
      if (form.pots.length < 1) {
        errs.pots = "Minimal 1 pot harga untuk mode Multi Pot";
      }
      form.pots.forEach((pot) => {
        if (!pot.name.trim())
          errs[`pot_${pot.localId}_name`] = "Nama pot wajib diisi";
        if (!pot.feePlayer)
          errs[`pot_${pot.localId}_feePlayer`] = "Fee pemain wajib diisi";
        if (!pot.feeGk)
          errs[`pot_${pot.localId}_feeGk`] = "Fee kiper wajib diisi";
      });
      // Setiap tim harus di-assign ke pot
      form.teams.forEach((team, i) => {
        if (!team.potLocalId) errs[`team_${i}_pot`] = "Pilih pot untuk tim ini";
      });
    }

    form.teams.forEach((team, i) => {
      if (!team.name.trim()) errs[`team_${i}_name`] = "Nama tim wajib diisi";
      if (!team.imageFile && !team.imageUrl)
        errs[`team_${i}_image`] = "Gambar tim wajib diupload";
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const fd = buildFormData(form);
      mode === "edit" && initialData?.id
        ? await adminService.editEvents(initialData.id, fd)
        : await adminService.postEvent(fd);

      onSave();
    } catch (err: any) {
      showError?.("Error", err.message ?? "Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (mode === "edit" && isLoadingDetail) {
    return (
      <div className="text-center py-20 text-gray-400">
        <span className="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full mb-3" />
        <p>Memuat detail event...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar event
      </button>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === "add" ? "Tambah Event" : "Edit Event"}
        </h2>
        {mode === "edit" && (
          <p className="text-sm text-gray-500 mt-0.5">{initialData?.name}</p>
        )}
      </div>

      {/* Basic Info */}
      <Card>
        <CardContent className="p-6 mt-4">
          <SectionHeader title="Informasi Dasar" />
          <div className="space-y-4">
            <FormField label="Nama Event" required error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Contoh: Fantasy World Cup"
                className={errors.name ? "border-red-400" : ""}
              />
            </FormField>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                label="Tanggal Mulai"
                required
                error={errors.dateStart}
              >
                <Input
                  type="date"
                  value={form.dateStart}
                  onChange={(e) => setField("dateStart", e.target.value)}
                  className={errors.dateStart ? "border-red-400" : ""}
                />
              </FormField>
              <FormField
                label="Tanggal Selesai"
                required
                error={errors.dateEnd}
              >
                <Input
                  type="date"
                  value={form.dateEnd}
                  onChange={(e) => setField("dateEnd", e.target.value)}
                  className={errors.dateEnd ? "border-red-400" : ""}
                />
              </FormField>
            </div>

            <FormField label="Venue" required error={errors.venueId}>
              <SelectField
                value={form.venueId}
                onChange={(v) => setField("venueId", v)}
                options={venues.map((v) => ({ value: v.id, label: v.name }))}
                disabled={isMasterLoading}
                error={!!errors.venueId}
                placeholder={
                  isMasterLoading ? "Memuat venue..." : "Pilih venue"
                }
              />
            </FormField>

            <FormField
              label="Tipe Pertandingan"
              required
              error={errors.typeMatch}
            >
              <SelectField
                value={form.typeMatch}
                onChange={(v) => setField("typeMatch", v as TypeMatch)}
                options={TYPE_MATCH_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                error={!!errors.typeMatch}
              />
            </FormField>

            <FormField label="Deskripsi" required error={errors.description}>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={3}
                placeholder="Deskripsi singkat event..."
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none ${
                  errors.description ? "border-red-400" : "border-gray-300"
                }`}
              />
            </FormField>

            <FormField label="Buka Event Sekarang">
              <label className="flex items-center gap-2 cursor-pointer">
                <ToggleSwitch
                  checked={form.isOpen}
                  onChange={(v) => setForm((prev) => ({ ...prev, isOpen: v }))}
                />
                <span className="text-sm text-gray-600">
                  {form.isOpen ? "Event dibuka" : "Event belum dibuka"}
                </span>
              </label>
            </FormField>

            <FormField label="Booking Hanya Individu">
              <label className="flex items-center gap-2 cursor-pointer">
                <ToggleSwitch
                  checked={form.isOnlyIndividual}
                  onChange={(v) =>
                    setForm((prev) => ({ ...prev, isOnlyIndividual: v }))
                  }
                />
                <span className="text-sm text-gray-600">
                  {form.isOnlyIndividual
                    ? "Booking individu diizinkan"
                    : "Booking individu tidak diizinkan"}
                </span>
              </label>
            </FormField>

            <FormField label="Booking Hanya Team">
              <label className="flex items-center gap-2 cursor-pointer">
                <ToggleSwitch
                  checked={form.isOnlyTeam}
                  onChange={(v) =>
                    setForm((prev) => ({ ...prev, isOnlyTeam: v }))
                  }
                />
                <span className="text-sm text-gray-600">
                  {form.isOnlyTeam
                    ? "Booking team diizinkan"
                    : "Booking team tidak diizinkan"}
                </span>
              </label>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ── Pricing Section ─────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-6 mt-4">
          <SectionHeader title="Pengaturan Harga" />

          {/* Mode selector */}
          <div className="mb-5">
            <p className="text-xs text-gray-500 mb-3">
              Pilih apakah semua tim bayar harga yang sama, atau tiap kelompok
              tim (pot) punya harga berbeda.
            </p>
            <PricingModeSelector
              value={form.pricingMode}
              onChange={(v) => setField("pricingMode", v)}
            />
          </div>

          {/* Single price */}
          {form.pricingMode === "single" && (
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <FormField
                label="Fee Pemain (Rp)"
                required
                error={errors.feePlayer}
              >
                <Input
                  type="text"
                  value={formatCurrencyDisplay(form.feePlayer)}
                  onChange={(e) =>
                    setField("feePlayer", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="0"
                  className={errors.feePlayer ? "border-red-400" : ""}
                />
              </FormField>
              <FormField label="Fee Kiper (Rp)" required error={errors.feeGk}>
                <Input
                  type="text"
                  value={formatCurrencyDisplay(form.feeGk)}
                  onChange={(e) =>
                    setField("feeGk", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="0"
                  className={errors.feeGk ? "border-red-400" : ""}
                />
              </FormField>
            </div>
          )}

          {/* Multi pot */}
          {form.pricingMode === "multi" && (
            <div className="mt-4 space-y-2">
              {errors.pots && (
                <p className="text-xs text-red-500">{errors.pots}</p>
              )}
              <PotManager
                pots={form.pots}
                teams={form.teams}
                errors={errors}
                onAddPot={addPot}
                onUpdatePot={updatePot}
                onRemovePot={removePot}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phases */}
      <Card>
        <CardContent className="p-6 mt-4">
          <SectionHeader
            title="Event Phase / Promo"
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    phases: [
                      ...prev.phases,
                      {
                        name: "",
                        order: String(prev.phases.length + 1),
                        feePlayer: "",
                        feeGk: "",
                        startDate: "",
                        endDate: "",
                        quotaPlayer: "",
                        quotaGk: "",
                        isActive: true,
                      },
                    ],
                  }))
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Tambah Phase
              </Button>
            }
          />

          <div className="space-y-4">
            {form.phases.map((p, i) => (
              <div key={i} className="border p-4 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Phase {i + 1}
                  </span>
                  <button
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        phases: prev.phases.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <FormField label="Nama Phase" required>
                  <Input
                    value={p.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => {
                        const phases = [...prev.phases];
                        phases[i] = { ...phases[i], name: val };
                        return { ...prev, phases };
                      });
                    }}
                  />
                </FormField>
                <FormField label="Phase Ke" required>
                  <Input
                    type="number"
                    min="1"
                    value={p.order}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => {
                        const phases = [...prev.phases];
                        phases[i] = { ...phases[i], order: val };
                        return { ...prev, phases };
                      });
                    }}
                  />
                </FormField>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="Fee Player" required>
                    <Input
                      type="number"
                      min="0"
                      value={p.feePlayer}
                      onChange={(e) => {
                        const val = e.target.value.replace(/-/g, "");
                        setForm((prev) => {
                          const phases = [...prev.phases];
                          phases[i] = { ...phases[i], feePlayer: val };
                          return { ...prev, phases };
                        });
                      }}
                    />
                  </FormField>
                  <FormField label="Fee Kiper" required>
                    <Input
                      type="number"
                      min="0"
                      value={p.feeGk}
                      onChange={(e) => {
                        const val = e.target.value.replace(/-/g, "");
                        setForm((prev) => {
                          const phases = [...prev.phases];
                          phases[i] = { ...phases[i], feeGk: val };
                          return { ...prev, phases };
                        });
                      }}
                    />
                  </FormField>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="Quota Player">
                    <Input
                      type="number"
                      min="0"
                      value={p.quotaPlayer}
                      onChange={(e) => {
                        const val = e.target.value.replace(/-/g, "");
                        setForm((prev) => {
                          const phases = [...prev.phases];
                          phases[i] = { ...phases[i], quotaPlayer: val };
                          return { ...prev, phases };
                        });
                      }}
                    />
                  </FormField>
                  <FormField label="Quota Kiper">
                    <Input
                      type="number"
                      min="0"
                      value={p.quotaGk}
                      onChange={(e) => {
                        const val = e.target.value.replace(/-/g, "");
                        setForm((prev) => {
                          const phases = [...prev.phases];
                          phases[i] = { ...phases[i], quotaGk: val };
                          return { ...prev, phases };
                        });
                      }}
                    />
                  </FormField>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="Start Date" required>
                    <Input
                      type="date"
                      value={p.startDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((prev) => {
                          const phases = [...prev.phases];
                          phases[i] = { ...phases[i], startDate: val };
                          return { ...prev, phases };
                        });
                      }}
                    />
                  </FormField>
                  <FormField label="End Date" required>
                    <Input
                      type="date"
                      value={p.endDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((prev) => {
                          const phases = [...prev.phases];
                          phases[i] = { ...phases[i], endDate: val };
                          return { ...prev, phases };
                        });
                      }}
                    />
                  </FormField>
                </div>
              </div>
            ))}
            {form.phases.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">
                Belum ada phase
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Banner */}
      <Card>
        <CardContent className="p-6 mt-4">
          <SectionHeader title="Banner Event" />
          <p className="text-xs text-gray-400 mb-3">
            Gambar utama event (field:{" "}
            <code className="bg-gray-100 px-1 rounded">image</code>)
          </p>
          <ImageUpload
            value={form.imageFile ?? form.imageUrl}
            onChange={(file) =>
              setForm((prev) => ({ ...prev, imageFile: file }))
            }
            maxSize={5}
          />
        </CardContent>
      </Card>

      {/* Facilities */}
      <Card>
        <CardContent className="p-6 mt-4">
          <SectionHeader title="Fasilitas" />
          {errors.facilityIds && (
            <p className="text-xs text-red-500 mb-2">{errors.facilityIds}</p>
          )}
          {isMasterLoading ? (
            <p className="text-xs text-gray-400">Memuat fasilitas...</p>
          ) : (
            <CheckboxGroup
              items={facilities}
              selected={form.facilityIds}
              onChange={(ids) =>
                setForm((prev) => ({ ...prev, facilityIds: ids }))
              }
              emptyText="Tidak ada data fasilitas"
            />
          )}
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardContent className="p-6 mt-4">
          <SectionHeader title="Peraturan" />
          {errors.ruleIds && (
            <p className="text-xs text-red-500 mb-2">{errors.ruleIds}</p>
          )}
          {isMasterLoading ? (
            <p className="text-xs text-gray-400">Memuat peraturan...</p>
          ) : (
            <CheckboxGroup
              items={rules}
              selected={form.ruleIds}
              onChange={(ids) => setForm((prev) => ({ ...prev, ruleIds: ids }))}
              emptyText="Tidak ada data peraturan"
            />
          )}
        </CardContent>
      </Card>

      {/* Teams */}
      <Card>
        <CardContent className="p-6 mt-4">
          <SectionHeader
            title="Daftar Tim"
            action={
              mode === "edit" ? (
                <Button size="sm" variant="outline" onClick={addTeam}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tambah Tim
                </Button>
              ) : undefined
            }
          />

          {/* Summary pot assignment (multi mode) */}
          {form.pricingMode === "multi" &&
            form.pots.length > 0 &&
            form.teams.length > 0 && (
              <div className="mb-5 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Ringkasan Pot
                </p>
                <div className="flex flex-wrap gap-2">
                  {form.pots.map((pot, pi) => {
                    const count = form.teams.filter(
                      (t) => t.potLocalId === pot.localId,
                    ).length;
                    return (
                      <div
                        key={pot.localId}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${POT_COLORS[pi % POT_COLORS.length]}`}
                      >
                        <PotBadge
                          potIndex={pi}
                          potName={pot.name || `Pot ${pi + 1}`}
                        />
                        <span className="font-semibold">{count} tim</span>
                        {pot.feePlayer && (
                          <span className="opacity-70">
                            · Rp{formatCurrencyShort(Number(pot.feePlayer))} /
                            pemain
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {form.teams.filter((t) => !t.potLocalId).length > 0 && (
                    <span className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-medium">
                      {form.teams.filter((t) => !t.potLocalId).length} tim belum
                      dipilih pot
                    </span>
                  )}
                </div>
              </div>
            )}

          {mode === "add" && (
            <div className="mb-5">
              <FormField label="Total Tim" required error={errors.totalTeams}>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={form.totalTeams}
                    onChange={(e) => setField("totalTeams", e.target.value)}
                    min="1"
                    max="32"
                    className="w-28"
                  />
                  <p className="text-xs text-gray-500">
                    Form tim akan muncul otomatis
                  </p>
                </div>
              </FormField>
            </div>
          )}

          {form.teams.length > 0 ? (
            <div className="space-y-4">
              {form.teams.map((team, index) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  index={index}
                  mode={mode}
                  pricingMode={form.pricingMode}
                  pots={form.pots}
                  errors={errors}
                  onUpdate={(patch) => updateTeam(index, patch)}
                  onRemove={() => removeTeam(index)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                {mode === "edit"
                  ? 'Belum ada tim. Klik "Tambah Tim" untuk menambahkan.'
                  : "Isi jumlah tim di atas untuk mulai input data tim."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button
          variant="black"
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Menyimpan...
            </span>
          ) : mode === "add" ? (
            "Simpan Event"
          ) : (
            "Simpan Perubahan"
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Event List View ──────────────────────────────────────────────────────────

function EventListView({
  onAdd,
  onEdit,
  showError,
  showSuccess,
}: {
  onAdd: () => void;
  onEdit: (event: Event) => void;
  showError?: (title: string, message: string) => void;
  showSuccess?: (message: string) => void;
}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getEvents();
      setEvents(res);
    } catch {
      showError?.("Error", "Gagal memuat data event");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleToggleOpen = useCallback(
    async (event: Event) => {
      if (togglingIds.has(event.id)) return;
      setTogglingIds((prev) => new Set(prev).add(event.id));
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, isOpen: !event.isOpen } : e,
        ),
      );
      try {
        await adminService.toggleEventOpen(event.id, { isOpen: !event.isOpen });
        showSuccess?.(
          `Event "${event.name}" ${!event.isOpen ? "dibuka" : "ditutup"}`,
        );
      } catch (err: any) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === event.id ? { ...e, isOpen: event.isOpen } : e,
          ),
        );
        showError?.("Error", err.message ?? "Terjadi kesalahan jaringan");
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev);
          next.delete(event.id);
          return next;
        });
      }
    },
    [togglingIds, showError, showSuccess],
  );

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchSearch =
        !searchTerm ||
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.venue?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "open" && e.isOpen) ||
        (statusFilter === "upcoming" && !e.isOpen);
      return matchSearch && matchStatus;
    });
  }, [events, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminService.deleteEvent?.(deleteTarget.id);
      await loadEvents();
    } catch {
      showError?.("Error", "Gagal menghapus event");
    } finally {
      setDeleteTarget(null);
      setIsDeleting(false);
    }
  }, [deleteTarget, loadEvents, showError]);

  const stats = useMemo(
    () => [
      {
        label: "Total Event",
        value: events.length,
        color: "bg-blue-50 text-blue-600",
      },
      {
        label: "Open",
        value: events.filter((e) => e.isOpen).length,
        color: "bg-green-50 text-green-600",
      },
      {
        label: "Upcoming",
        value: events.filter((e) => !e.isOpen).length,
        color: "bg-indigo-50 text-indigo-600",
      },
    ],
    [events],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Event</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola event & tournament komunitas
          </p>
        </div>
        <Button variant="black" size="sm" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Event
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center justify-between mt-4">
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}
              >
                <Trophy className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama event atau lokasi..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <SelectField
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
              options={OPEN_FILTER_OPTIONS}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-16 text-gray-400">
              <span className="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full mb-3" />
              <p className="text-sm">Memuat data event...</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-600">
                Tidak ada event
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {searchTerm || statusFilter !== "all"
                  ? "Coba ubah filter pencarian"
                  : "Buat event pertamamu"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button
                  variant="black"
                  size="sm"
                  onClick={onAdd}
                  className="mt-4 mx-auto"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Tambah Event
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Event</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Buka/Tutup</TableHead>
                  <TableHead className="w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((event) => {
                  const status = getStatusFromIsOpen(event.isOpen);
                  const isToggling = togglingIds.has(event.id);
                  const isMulti = event.pricingMode === "multi";

                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {event.imageUrl ? (
                            <img
                              src={event.imageUrl}
                              alt={event.name}
                              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Trophy className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <p className="font-medium text-sm text-gray-900 leading-tight">
                            {event.name}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span>{formatDate(event.startDate)}</span>
                          <span className="text-gray-300">–</span>
                          <span>{formatDate(event.endDate)}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {event.venue ?? "-"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Harga — single atau multi pot */}
                      <TableCell>
                        {isMulti && event.pots && event.pots.length > 0 ? (
                          <div className="space-y-1">
                            {event.pots.map((pot, pi) => (
                              <div
                                key={pi}
                                className="flex items-center gap-1.5"
                              >
                                <PotBadge potIndex={pi} potName={pot.name} />
                                <span className="text-xs text-gray-600">
                                  Rp
                                  {Number(pot.feePlayer).toLocaleString(
                                    "id-ID",
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-sm text-gray-700">
                              {event.feePlayer != null
                                ? `Rp ${event.feePlayer.toLocaleString("id-ID")}`
                                : "-"}
                            </p>
                            <p className="text-xs text-gray-400">
                              GK:{" "}
                              {event.feeGk != null
                                ? `Rp ${event.feeGk.toLocaleString("id-ID")}`
                                : "-"}
                            </p>
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLOR[status]}`}>
                          {status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <ToggleSwitch
                          checked={event.isOpen}
                          onChange={() => handleToggleOpen(event)}
                          disabled={isToggling}
                          loading={togglingIds.has(event.id)}
                        />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(event)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-600"
                            onClick={() => setDeleteTarget(event)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Event"
        message={`Yakin ingin menghapus "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
        isLoading={isDeleting}
      />
    </div>
  );
}

// ─── Main EventTab ────────────────────────────────────────────────────────────

export default function EventTab({ showError, showSuccess }: EventTabProps) {
  const [subView, setSubView] = useState<SubView>("list");
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(
    undefined,
  );

  const handleAdd = () => {
    setEditingEvent(undefined);
    setSubView("add");
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setSubView("edit");
  };

  const handleBack = () => {
    setEditingEvent(undefined);
    setSubView("list");
  };

  const handleSave = () => {
    showSuccess?.(
      subView === "add"
        ? "Event berhasil dibuat!"
        : "Event berhasil diperbarui!",
    );
    handleBack();
  };

  if (subView === "add") {
    return (
      <EventFormView
        mode="add"
        onBack={handleBack}
        onSave={handleSave}
        showError={showError}
      />
    );
  }

  if (subView === "edit") {
    return (
      <EventFormView
        mode="edit"
        initialData={editingEvent}
        onBack={handleBack}
        onSave={handleSave}
        showError={showError}
      />
    );
  }

  return (
    <EventListView
      onAdd={handleAdd}
      onEdit={handleEdit}
      showError={showError}
      showSuccess={showSuccess}
    />
  );
}
