"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Trophy,
  Clock,
  MapPin,
  Calendar,
  Search,
  Shield,
  Target,
  ChevronDown,
  ChevronUp,
  Filter,
  GripVertical,
  AlertCircle,
  UserCheck,
  Lock,
  Unlock,
  Download,
} from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../atoms/Card";
import Badge from "../atoms/Badge";
import { useNotifications } from "./NotificationContainer";
import { formatDate } from "@/lib/helper";
import { lineupService, LineupMatch, LineupPlayer } from "@/utils/lineup";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  rectIntersection,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { adminService } from "@/utils/admin";
import ExcelJS from "exceljs";

// ========== TYPES ==========
interface SortablePlayerCardProps {
  player: LineupPlayer;
  index: number;
  teamKey: string;
  canAcceptPlayer: boolean;
  isLocked?: boolean;
}

interface TeamDropzoneProps {
  teamKey: string;
  isActive: boolean;
  children: React.ReactNode;
}

interface TeamColors {
  gradient: string;
  border: string;
  bg: string;
  badge: string;
  icon: string;
  dragOver: string;
}

// ========== CONSTANTS ==========
// Mapping warna berdasarkan nama tim dari backend
const TEAM_COLOR_MAP: Record<string, TeamColors> = {
  MERAH: {
    gradient: "from-rose-50 to-white",
    border: "border-rose-200",
    bg: "bg-rose-50/50",
    badge: "bg-rose-100 text-rose-700",
    icon: "from-rose-500 to-red-600",
    dragOver: "border-rose-400 bg-rose-50",
  },
  PUTIH: {
    gradient: "from-gray-50 to-white",
    border: "border-gray-200",
    bg: "bg-gray-50/50",
    badge: "bg-gray-100 text-gray-700",
    icon: "from-gray-400 to-gray-600",
    dragOver: "border-gray-400 bg-gray-50",
  },
  BIRU: {
    gradient: "from-sky-50 to-white",
    border: "border-sky-200",
    bg: "bg-sky-50/50",
    badge: "bg-sky-100 text-sky-700",
    icon: "from-sky-500 to-blue-600",
    dragOver: "border-sky-400 bg-sky-50",
  },
  KUNING: {
    gradient: "from-amber-50 to-white",
    border: "border-amber-200",
    bg: "bg-amber-50/50",
    badge: "bg-amber-100 text-amber-700",
    icon: "from-amber-500 to-yellow-600",
    dragOver: "border-amber-400 bg-amber-50",
  },
  "BIRU MUDA": {
    gradient: "from-cyan-50 to-white",
    border: "border-cyan-200",
    bg: "bg-cyan-50/50",
    badge: "bg-cyan-100 text-cyan-700",
    icon: "from-cyan-400 to-cyan-600",
    dragOver: "border-cyan-400 bg-cyan-50",
  },
  HITAM: {
    gradient: "from-slate-50 to-white",
    border: "border-slate-300",
    bg: "bg-slate-50/50",
    badge: "bg-slate-100 text-slate-800",
    icon: "from-slate-600 to-slate-800",
    dragOver: "border-slate-400 bg-slate-50",
  },
  HIJAU: {
    gradient: "from-emerald-50 to-white",
    border: "border-emerald-200",
    bg: "bg-emerald-50/50",
    badge: "bg-emerald-100 text-emerald-700",
    icon: "from-emerald-500 to-green-600",
    dragOver: "border-emerald-400 bg-emerald-50",
  },
  ORANYE: {
    gradient: "from-orange-50 to-white",
    border: "border-orange-200",
    bg: "bg-orange-50/50",
    badge: "bg-orange-100 text-orange-700",
    icon: "from-orange-500 to-orange-600",
    dragOver: "border-orange-400 bg-orange-50",
  },
  UNGU: {
    gradient: "from-purple-50 to-white",
    border: "border-purple-200",
    bg: "bg-purple-50/50",
    badge: "bg-purple-100 text-purple-700",
    icon: "from-purple-500 to-indigo-600",
    dragOver: "border-purple-400 bg-purple-50",
  },
  PINK: {
    gradient: "from-pink-50 to-white",
    border: "border-pink-200",
    bg: "bg-pink-50/50",
    badge: "bg-pink-100 text-pink-700",
    icon: "from-pink-500 to-pink-600",
    dragOver: "border-pink-400 bg-pink-50",
  },
};

// Default colors for fallback - matching backend order
const DEFAULT_TEAM_COLORS: TeamColors[] = [
  TEAM_COLOR_MAP.MERAH, // 1
  TEAM_COLOR_MAP.PUTIH, // 2
  TEAM_COLOR_MAP.BIRU, // 3
  TEAM_COLOR_MAP.KUNING, // 4
  TEAM_COLOR_MAP["BIRU MUDA"], // 5
  TEAM_COLOR_MAP.HITAM, // 6
  TEAM_COLOR_MAP.HIJAU, // 7
  TEAM_COLOR_MAP.ORANYE, // 8
  TEAM_COLOR_MAP.UNGU, // 9
  TEAM_COLOR_MAP.PINK, // 10
];

const STATUS_COLORS = {
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
} as const;

// ========== UTILITY FUNCTIONS ==========
const getTeamColor = (teamName: string, index: number): TeamColors => {
  // Try to get color from team name mapping
  const upperTeamName = teamName.toUpperCase();
  if (TEAM_COLOR_MAP[upperTeamName]) {
    return TEAM_COLOR_MAP[upperTeamName];
  }

  // Fallback to index-based color
  return DEFAULT_TEAM_COLORS[index % DEFAULT_TEAM_COLORS.length];
};

const getStatusColor = (status: string) =>
  STATUS_COLORS[status as keyof typeof STATUS_COLORS] ||
  "bg-gray-50 text-gray-700 border-gray-200";

const getPlayersPerTeam = (lineup: LineupMatch): number => {
  if (!lineup.totalSlots || !lineup.totalTeams) return 0;
  return Math.floor(lineup.totalSlots / lineup.totalTeams);
};

const getAllPlayers = (lineup: LineupMatch): LineupPlayer[] => {
  if (!lineup.teams) return [];
  return Object.values(lineup.teams).flat();
};

// ========== COMPONENTS ==========

// Sortable Player Card
const SortablePlayerCard = React.memo(
  ({
    player,
    index,
    teamKey,
    canAcceptPlayer,
    isLocked = false,
  }: SortablePlayerCardProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: player.id, disabled: isLocked });
    const isGK = player.position === "GK";

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white border-2 rounded-xl shadow-sm hover:shadow-md transition-all ${
          isDragging ? "opacity-50 scale-105" : "border-gray-200"
        } ${isLocked ? "opacity-75" : ""}`}
      >
        <div className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              {...attributes}
              {...listeners}
              className={`p-1.5 rounded flex-shrink-0 touch-none ${
                isLocked
                  ? "cursor-not-allowed text-gray-400"
                  : `cursor-grab active:cursor-grabbing ${
                      isGK
                        ? "hover:bg-amber-100 text-amber-600"
                        : "hover:bg-blue-100 text-blue-600"
                    }`
              }`}
              disabled={isLocked}
            >
              {isLocked ? (
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 ${
                isGK
                  ? "bg-gradient-to-br from-amber-400 to-orange-500"
                  : "bg-gradient-to-br from-sky-400 to-blue-500"
              }`}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                  {player.name}
                </h4>
                <Badge
                  className={`text-xs ${
                    isGK
                      ? "bg-amber-100 text-amber-800"
                      : "bg-sky-100 text-sky-800"
                  }`}
                >
                  {isGK ? "GK" : "PLAYER"}
                </Badge>
              </div>
              <div className="flex flex-col gap-1 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 flex-shrink-0" />
                  <span>Team {teamKey}</span>
                </div>
                {player.jerseySize && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Jersey:</span>
                    <span className="font-medium text-gray-700">
                      {player.jerseySize}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

SortablePlayerCard.displayName = "SortablePlayerCard";

// Player Card for Drag Overlay
const PlayerCard = React.memo(
  ({ player }: { player: LineupPlayer; index: number }) => {
    const isGK = player.position === "GK";

    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg opacity-90">
        <div className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold ${
                isGK ? "bg-amber-500" : "bg-sky-500"
              }`}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-semibold text-sm sm:text-base text-gray-900">
                {player.name}
              </h4>
              <Badge
                className={`text-xs ${
                  isGK
                    ? "bg-amber-100 text-amber-800"
                    : "bg-sky-100 text-sky-800"
                }`}
              >
                {isGK ? "GK" : "PLAYER"}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

PlayerCard.displayName = "PlayerCard";

// Team Dropzone
const TeamDropzone = React.memo(
  ({ teamKey, isActive, children }: TeamDropzoneProps) => {
    const { setNodeRef, isOver } = useSortable({
      id: `team-${teamKey}-container`,
    });

    return (
      <div
        ref={setNodeRef}
        className={`transition-all ${
          isOver ? "ring-2 ring-blue-400 ring-offset-2" : ""
        }`}
      >
        {children}
      </div>
    );
  },
);

TeamDropzone.displayName = "TeamDropzone";

// ========== MAIN COMPONENT ==========
export default function LineupManagement() {
  const [lineups, setLineups] = useState<LineupMatch[]>([]);
  const [selectedLineup, setSelectedLineup] = useState<LineupMatch | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>(
    {},
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { showError, showSuccess, showWarning } = useNotifications();

  const [editingTeamName, setEditingTeamName] = useState<string | null>(null);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  // ========== EFFECTS ==========
  useEffect(() => {
    fetchLineups();
  }, []);

  useEffect(() => {
    if (selectedLineup) {
      const initialExpanded: Record<string, boolean> = {};
      const initialTeamNames: Record<string, string> = {};

      if (
        selectedLineup.teams &&
        Object.keys(selectedLineup.teams).length > 0
      ) {
        Object.keys(selectedLineup.teams).forEach((teamName) => {
          initialExpanded[teamName] = true;
          initialTeamNames[teamName] = teamName;
        });

        setExpandedTeams(initialExpanded);
        setTeamNames(initialTeamNames);
      } else {
        setExpandedTeams({});
        setTeamNames({});
      }
    }
  }, [selectedLineup?.id]);

  // ========== API CALLS ==========
  const fetchLineups = async () => {
    try {
      setLoading(true);
      const data = await lineupService.fetchLineups();
      console.log("data", data);

      // Data sudah dalam format yang benar dari service
      // Tidak perlu transform lagi karena sudah menggunakan nama warna tim
      setLineups(data);
      if (data.length > 0) setSelectedLineup(data[0]);
    } catch (error) {
      showError("Error", "Failed to load lineups");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTeamName = useCallback(
    async (teamKey: string, newName: string) => {
      if (!selectedLineup || !newName.trim()) return;

      try {
        const updatedNames = { ...teamNames, [teamKey]: newName.trim() };
        setTeamNames(updatedNames);
        setEditingTeamName(null);

        await adminService.changeNameTeam(
          selectedLineup.id,
          newName.trim(),
          teamKey,
        );

        showSuccess(
          "Team name updated",
          `Team ${teamKey} renamed successfully`,
        );
      } catch (error) {
        showError("Error", "Failed to update team name");
        setTeamNames((prev) => {
          const reverted = { ...prev };
          delete reverted[teamKey];
          return reverted;
        });
      }
    },
    [selectedLineup, teamNames, showSuccess, showError],
  );

  const handleLockLineup = async () => {
    if (!selectedLineup) return;

    try {
      setIsLocking(true);
      const newLockStatus = !selectedLineup.lockLineup;

      await lineupService.updateLockLineup(selectedLineup.id, newLockStatus);

      const updatedLineup = { ...selectedLineup, lockLineup: newLockStatus };
      setSelectedLineup(updatedLineup);
      setLineups((prev) =>
        prev.map((lineup) =>
          lineup.id === selectedLineup.id ? updatedLineup : lineup,
        ),
      );

      showSuccess(
        newLockStatus ? "Lineup Locked" : "Lineup Unlocked",
        newLockStatus
          ? "Lineup has been locked. Players cannot be moved."
          : "Lineup has been unlocked. You can now move players.",
      );
    } catch (error) {
      showError("Error", "Failed to update lineup lock status");
    } finally {
      setIsLocking(false);
    }
  };

  const handleExportToExcel = async () => {
    if (!selectedLineup) return;

    try {
      setIsExporting(true);

      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Lineup");

      // ── Mapping nama tim → warna hex (ARGB format untuk ExcelJS) ──
      const TEAM_COLOR_HEX: Record<string, { bg: string; font: string }> = {
        MERAH: { bg: "FFFCE8E6", font: "FFC0392B" },
        PUTIH: { bg: "FFF2F3F4", font: "FF5D6D7E" },
        BIRU: { bg: "FFE8F4FD", font: "FF1A5276" },
        KUNING: { bg: "FFFEF9E7", font: "FF9A7D0A" },
        "BIRU MUDA": { bg: "FFE8F8F5", font: "FF0E6655" },
        HITAM: { bg: "FFD5D8DC", font: "FF17202A" },
        HIJAU: { bg: "FFE9F7EF", font: "FF1E8449" },
        ORANYE: { bg: "FFFEF5E7", font: "FFD35400" },
        UNGU: { bg: "FFF5EEF8", font: "FF6C3483" },
        PINK: { bg: "FFFCE4EC", font: "FFAD1457" },
      };

      const getTeamColorHex = (teamKey: string) => {
        const upper = teamKey.toUpperCase();
        return TEAM_COLOR_HEX[upper] ?? { bg: "FFE8EAF6", font: "FF283593" };
      };

      // ── Helper: style cell ──
      const styleCell = (
        cell: ExcelJS.Cell,
        options: {
          bold?: boolean;
          size?: number;
          bgColor?: string;
          fontColor?: string;
          alignment?: "left" | "center" | "right";
          border?: boolean;
        },
      ) => {
        if (options.bgColor) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: options.bgColor },
          };
        }
        cell.font = {
          name: "Arial",
          bold: options.bold ?? false,
          size: options.size ?? 11,
          color: { argb: options.fontColor ?? "FF000000" },
        };
        if (options.alignment) {
          cell.alignment = {
            horizontal: options.alignment,
            vertical: "middle",
          };
        }
        if (options.border) {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD0D0D0" } },
            left: { style: "thin", color: { argb: "FFD0D0D0" } },
            bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
            right: { style: "thin", color: { argb: "FFD0D0D0" } },
          };
        }
      };

      ws.columns = [
        { key: "no", width: 6 },
        { key: "name", width: 32 },
        { key: "position", width: 14 },
        { key: "jersey", width: 16 },
      ];

      // ── Judul utama ──
      ws.mergeCells("A1:D1");
      const titleCell = ws.getCell("A1");
      titleCell.value = selectedLineup.scheduleName;
      styleCell(titleCell, {
        bold: true,
        size: 16,
        bgColor: "FF1A3C5E",
        fontColor: "FFFFFFFF",
        alignment: "center",
      });
      ws.getRow(1).height = 30;

      // ── Info match ──
      const infoRows: [string, string][] = [
        ["Tanggal", formatDate(selectedLineup.date)],
        ["Waktu", selectedLineup.time],
        ["Venue", selectedLineup.venue],
      ];

      infoRows.forEach(([label, value], i) => {
        const row = ws.getRow(i + 2);
        row.height = 20;
        const labelCell = row.getCell(1);
        const valueCell = row.getCell(2);
        ws.mergeCells(`B${i + 2}:D${i + 2}`);
        labelCell.value = label;
        valueCell.value = value;
        styleCell(labelCell, {
          bold: true,
          bgColor: "FFF0F4F8",
          fontColor: "FF34495E",
        });
        styleCell(valueCell, { bgColor: "FFFFFFFF", fontColor: "FF2C3E50" });
      });

      let currentRow = 6; // baris kosong setelah info

      // ── Per tim ──
      const teamKeys = selectedLineup.teams
        ? Object.keys(selectedLineup.teams)
        : [];

      teamKeys.forEach((teamKey) => {
        const teamPlayers = selectedLineup.teams[teamKey] || [];
        const colors = getTeamColorHex(teamKey);

        // Baris nama tim
        ws.mergeCells(`A${currentRow}:D${currentRow}`);
        const teamHeaderCell = ws.getCell(`A${currentRow}`);
        teamHeaderCell.value = `TEAM ${teamKey}`;
        styleCell(teamHeaderCell, {
          bold: true,
          size: 13,
          bgColor: colors.bg,
          fontColor: colors.font,
          alignment: "center",
          border: true,
        });
        // Border bawah lebih tebal sebagai separator
        teamHeaderCell.border = {
          top: { style: "medium", color: { argb: colors.font } },
          left: { style: "medium", color: { argb: colors.font } },
          bottom: { style: "medium", color: { argb: colors.font } },
          right: { style: "medium", color: { argb: colors.font } },
        };
        ws.getRow(currentRow).height = 24;
        currentRow++;

        // Header kolom
        const headerRow = ws.getRow(currentRow);
        headerRow.height = 20;
        const headers = ["No", "Nama Pemain", "Posisi", "Jersey Size"];
        headers.forEach((h, colIdx) => {
          const cell = headerRow.getCell(colIdx + 1);
          cell.value = h;
          styleCell(cell, {
            bold: true,
            bgColor: colors.bg,
            fontColor: colors.font,
            alignment: "center",
            border: true,
          });
        });
        currentRow++;

        // Data pemain
        if (teamPlayers.length > 0) {
          teamPlayers.forEach((player, idx) => {
            const dataRow = ws.getRow(currentRow);
            dataRow.height = 19;
            const isEven = idx % 2 === 0;
            const rowBg = isEven ? "FFFFFFFF" : "FFF7F9FC";

            const values = [
              idx + 1,
              player.name,
              player.position === "GK" ? "Goalkeeper" : "Player",
              player.jerseySize ?? "-",
            ];
            values.forEach((v, colIdx) => {
              const cell = dataRow.getCell(colIdx + 1);
              cell.value = v;
              styleCell(cell, {
                bgColor: rowBg,
                fontColor: "FF2C3E50",
                alignment:
                  colIdx === 0
                    ? "center"
                    : colIdx === 2 || colIdx === 3
                      ? "center"
                      : "left",
                border: true,
              });
            });
            currentRow++;
          });
        } else {
          ws.mergeCells(`A${currentRow}:D${currentRow}`);
          const emptyCell = ws.getCell(`A${currentRow}`);
          emptyCell.value = "Belum ada pemain";
          styleCell(emptyCell, {
            bgColor: "FFF9F9F9",
            fontColor: "FF95A5A6",
            alignment: "center",
            border: true,
          });
          ws.getRow(currentRow).height = 19;
          currentRow++;
        }

        currentRow++; // baris kosong antar tim
      });

      // ── Generate & download ──
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Lineup_${selectedLineup.scheduleName.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      showSuccess("Export Successful", "Lineup has been exported to Excel");
    } catch (error) {
      console.error("Export error:", error);
      showError("Error", "Failed to export lineup");
    } finally {
      setIsExporting(false);
    }
  };

  // ========== VALIDATION ==========
  const canAcceptPlayer = useCallback(
    (
      teamKey: string,
      player: LineupPlayer,
      lineup: LineupMatch,
    ): { canAccept: boolean; reason?: string } => {
      if (!lineup.teams || !lineup.teams[teamKey]) {
        return { canAccept: false, reason: "Invalid team" };
      }

      const teamPlayers = lineup.teams[teamKey];
      const maxPlayersPerTeam = getPlayersPerTeam(lineup);
      const hasGK = teamPlayers.some((p) => p.position === "GK");
      const isGK = player.position === "GK";

      if (isGK && hasGK && !teamPlayers.find((p) => p.id === player.id)) {
        return { canAccept: false, reason: "Team already has a goalkeeper" };
      }

      const currentCount = teamPlayers.filter((p) => p.id !== player.id).length;
      if (currentCount >= maxPlayersPerTeam) {
        return {
          canAccept: false,
          reason: `Team is full (max ${maxPlayersPerTeam} players)`,
        };
      }

      return { canAccept: true };
    },
    [],
  );

  // ========== DRAG HANDLERS ==========
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setOverId(null);

      if (!over || !selectedLineup || active.id === over.id) return;

      if (selectedLineup.lockLineup) {
        showWarning("Lineup Locked", "Cannot move players. Lineup is locked.");
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;
      const allPlayers = getAllPlayers(selectedLineup);
      const activePlayer = allPlayers.find((p) => p.id === activeId);

      if (!activePlayer) return;

      let targetTeam: string | null = null;
      let targetIndex = -1;

      const teamKeys = selectedLineup.teams
        ? Object.keys(selectedLineup.teams)
        : [];

      for (const teamKey of teamKeys) {
        if (overId === `team-${teamKey}-container`) {
          targetTeam = teamKey;
          targetIndex = selectedLineup.teams[teamKey]?.length || 0;
          break;
        }
      }

      if (!targetTeam) {
        const overPlayer = allPlayers.find((p) => p.id === overId);
        if (overPlayer) {
          targetTeam = overPlayer.team;
          targetIndex =
            selectedLineup.teams[targetTeam]?.findIndex(
              (p) => p.id === overId,
            ) ?? -1;
        }
      }

      if (!targetTeam || targetIndex === -1) return;

      // Reorder within same team
      if (activePlayer.team === targetTeam) {
        const teamPlayers = [...selectedLineup.teams[targetTeam]];
        const oldIndex = teamPlayers.findIndex((p) => p.id === activeId);

        if (oldIndex !== targetIndex) {
          teamPlayers.splice(oldIndex, 1);
          teamPlayers.splice(targetIndex, 0, activePlayer);

          const updatedTeams = {
            ...selectedLineup.teams,
            [targetTeam]: teamPlayers.map((p, idx) => ({
              ...p,
              order: idx + 1,
            })),
          };

          const updatedLineup = { ...selectedLineup, teams: updatedTeams };
          setSelectedLineup(updatedLineup);
          setLineups((prev) =>
            prev.map((l) => (l.id === selectedLineup.id ? updatedLineup : l)),
          );
        }
        return;
      }

      // Move to different team
      const sourceTeam = activePlayer.team;
      const updatedTeams = { ...selectedLineup.teams };
      const isActiveGK = activePlayer.position === "GK";
      const targetTeamPlayers = updatedTeams[targetTeam] || [];
      const targetHasGK = targetTeamPlayers.some((p) => p.position === "GK");

      // GK drag ke tim yang sudah ada GK → SWAP dua GK
      if (isActiveGK && targetHasGK) {
        const targetGK = targetTeamPlayers.find((p) => p.position === "GK")!;

        updatedTeams[sourceTeam] = updatedTeams[sourceTeam]
          .filter((p) => p.id !== activeId)
          .concat({ ...targetGK, team: sourceTeam });

        updatedTeams[targetTeam] = targetTeamPlayers
          .filter((p) => p.id !== targetGK.id)
          .concat({ ...activePlayer, team: targetTeam });

        Object.keys(updatedTeams).forEach((teamKey) => {
          updatedTeams[teamKey] = updatedTeams[teamKey].map((player, idx) => ({
            ...player,
            order: idx + 1,
          }));
        });

        const updatedLineup = { ...selectedLineup, teams: updatedTeams };
        setSelectedLineup(updatedLineup);
        setLineups((prev) =>
          prev.map((l) => (l.id === selectedLineup.id ? updatedLineup : l)),
        );

        try {
          await Promise.all([
            lineupService.updatePlayerTeam(activePlayer.id, targetTeam),
            lineupService.updatePlayerTeam(targetGK.id, sourceTeam),
          ]);
          showSuccess(
            `GK swapped`,
            `Goalkeeper swapped between Team ${sourceTeam} and Team ${targetTeam}`,
          );
        } catch (error) {
          showError("Error", "Failed to swap goalkeepers");
          setSelectedLineup(selectedLineup);
          setLineups((prev) =>
            prev.map((l) => (l.id === selectedLineup.id ? selectedLineup : l)),
          );
        }
        return;
      }

      // Validasi normal untuk non-GK swap
      const { canAccept, reason } = canAcceptPlayer(
        targetTeam,
        activePlayer,
        selectedLineup,
      );
      if (!canAccept) {
        showWarning(
          "Cannot move player",
          reason || "Team constraints prevent this move",
        );
        return;
      }

      updatedTeams[sourceTeam] = updatedTeams[sourceTeam].filter(
        (p) => p.id !== activeId,
      );

      const updatedPlayer = { ...activePlayer, team: targetTeam };
      updatedTeams[targetTeam] = [...targetTeamPlayers];
      updatedTeams[targetTeam].splice(targetIndex, 0, updatedPlayer);

      Object.keys(updatedTeams).forEach((teamKey) => {
        updatedTeams[teamKey] = updatedTeams[teamKey].map((player, idx) => ({
          ...player,
          order: idx + 1,
        }));
      });

      const updatedLineup = {
        ...selectedLineup,
        teams: updatedTeams,
        totalPlayers: getAllPlayers({ ...selectedLineup, teams: updatedTeams })
          .length,
      };

      setSelectedLineup(updatedLineup);
      setLineups((prev) =>
        prev.map((lineup) =>
          lineup.id === selectedLineup.id ? updatedLineup : lineup,
        ),
      );

      try {
        await lineupService.updatePlayerTeam(activePlayer.id, targetTeam);
        showSuccess(`Player moved to Team ${targetTeam}`);
      } catch (error) {
        showError("Error", "Failed to update player team");
        setSelectedLineup(selectedLineup);
        setLineups((prev) =>
          prev.map((lineup) =>
            lineup.id === selectedLineup.id ? selectedLineup : lineup,
          ),
        );
      }
    },
    [selectedLineup, canAcceptPlayer, showWarning, showSuccess, showError],
  );

  // ========== MEMOIZED VALUES ==========
  const activeDragPlayer = useMemo(
    () =>
      selectedLineup
        ? getAllPlayers(selectedLineup).find((p) => p.id === activeId)
        : null,
    [selectedLineup, activeId],
  );

  const filteredLineups = useMemo(
    () =>
      lineups.filter((lineup) => {
        const matchesSearch =
          !searchTerm ||
          lineup.scheduleName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          lineup.venue.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || lineup.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [lineups, searchTerm, statusFilter],
  );

  // ========== RENDER HELPERS ==========
  const toggleTeamExpansion = useCallback((teamKey: string) => {
    setExpandedTeams((prev) => ({ ...prev, [teamKey]: !prev[teamKey] }));
  }, []);

  const renderTeamCards = useMemo(() => {
    if (!selectedLineup) return null;

    const maxPlayersPerTeam = getPlayersPerTeam(selectedLineup);
    const isLocked = selectedLineup.lockLineup || false;

    const teamKeys = selectedLineup.teams
      ? Object.keys(selectedLineup.teams)
      : [];

    if (teamKeys.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No teams available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {teamKeys.map((teamKey, i) => {
          const teamColor = getTeamColor(teamKey, i);
          const teamPlayers = selectedLineup.teams[teamKey] || [];
          const isExpanded = expandedTeams[teamKey] ?? true;
          const hasGK = teamPlayers.some((p) => p.position === "GK");
          const isFull = teamPlayers.length >= maxPlayersPerTeam;
          const canAccept = activeDragPlayer
            ? canAcceptPlayer(teamKey, activeDragPlayer, selectedLineup)
                .canAccept
            : true;
          const isDragOver = overId === `team-${teamKey}-container`;

          return (
            <TeamDropzone
              key={teamKey}
              teamKey={teamKey}
              isActive={!!activeId && canAccept && !isLocked}
            >
              <Card
                className={`shadow-lg border-2 bg-gradient-to-br transition-all ${
                  teamColor.gradient
                } ${
                  isDragOver && canAccept && !isLocked
                    ? teamColor.dragOver
                    : teamColor.border
                } ${(!canAccept || isLocked) && activeId ? "opacity-50" : ""}`}
              >
                <CardHeader className={`border-b ${teamColor.bg} p-3 sm:p-4`}>
                  <button
                    onClick={() => {
                      if (editingTeamName !== teamKey) {
                        toggleTeamExpansion(teamKey);
                      }
                    }}
                    className="w-full"
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${teamColor.icon} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0`}
                        >
                          <span className="text-white font-bold text-base sm:text-lg">
                            {teamKey.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="text-left flex-1">
                          {editingTeamName === teamKey ? (
                            <input
                              type="text"
                              defaultValue={teamKey}
                              onBlur={(e) => {
                                const newValue = e.target.value.trim();
                                if (newValue && newValue !== teamKey) {
                                  handleSaveTeamName(teamKey, newValue);
                                } else {
                                  setEditingTeamName(null);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const newValue = e.currentTarget.value.trim();
                                  if (newValue && newValue !== teamKey) {
                                    handleSaveTeamName(teamKey, newValue);
                                  } else {
                                    setEditingTeamName(null);
                                  }
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  setEditingTeamName(null);
                                }
                              }}
                              autoFocus
                              className="font-bold text-sm sm:text-base border-2 border-blue-500 rounded px-2 py-1 w-full max-w-[200px] outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div
                              className="font-bold text-sm sm:text-base cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isLocked) setEditingTeamName(teamKey);
                              }}
                              title={
                                isLocked
                                  ? "Unlock lineup to edit"
                                  : "Click to edit team name"
                              }
                            >
                              {teamKey}
                            </div>
                          )}
                          <div className="text-xs font-normal text-gray-600">
                            {teamPlayers.length}/{maxPlayersPerTeam} players
                            {hasGK && " • Has GK"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {isFull && (
                          <Badge className="bg-green-100 text-green-700 hidden sm:inline-flex">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Full
                          </Badge>
                        )}
                        {!hasGK && teamPlayers.length > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 hidden sm:inline-flex">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            No GK
                          </Badge>
                        )}
                        <Badge className={teamColor.badge}>
                          {teamPlayers.length}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </div>
                    </CardTitle>
                  </button>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="p-3 sm:p-4">
                    <SortableContext
                      items={[
                        ...teamPlayers.map((p) => p.id),
                        `team-${teamKey}-container`,
                      ]}
                      strategy={verticalListSortingStrategy}
                    >
                      <div
                        id={`team-${teamKey}-container`}
                        className="space-y-2 sm:space-y-3 min-h-[150px] sm:min-h-[200px]"
                      >
                        {teamPlayers.length > 0 ? (
                          teamPlayers.map((player, idx) => (
                            <SortablePlayerCard
                              key={player.id}
                              player={player}
                              index={idx}
                              teamKey={teamKey}
                              canAcceptPlayer={canAccept}
                              isLocked={isLocked}
                            />
                          ))
                        ) : (
                          <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-xl">
                            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                            <p className="text-sm sm:text-base text-gray-500">
                              {isLocked ? "Team is empty" : "Drop players here"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Max {maxPlayersPerTeam} players • 1 GK required
                            </p>
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </CardContent>
                )}
              </Card>
            </TeamDropzone>
          );
        })}
      </div>
    );
  }, [
    selectedLineup,
    expandedTeams,
    activeId,
    activeDragPlayer,
    overId,
    canAcceptPlayer,
    toggleTeamExpansion,
    editingTeamName,
    handleSaveTeamName,
  ]);

  // ========== LOADING STATE ==========
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
        <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-48 sm:w-64"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-4 h-[400px] sm:h-[600px] bg-gray-200 rounded-2xl animate-pulse"></div>
          <div className="lg:col-span-8 h-[400px] sm:h-[600px] bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Lineup Management
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Drag and drop players between teams
          </p>
        </div>
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="lg:hidden p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Calendar className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Sidebar */}
        <div
          className={`fixed inset-0 z-50 lg:relative lg:col-span-4 lg:z-auto ${
            showSidebar ? "block" : "hidden lg:block"
          }`}
        >
          {showSidebar && (
            <div
              className="fixed inset-0 bg-black/50 lg:hidden"
              onClick={() => setShowSidebar(false)}
            />
          )}

          <div className="fixed inset-y-0 left-0 w-80 max-w-[90%] bg-white lg:relative lg:w-auto lg:max-w-none overflow-y-auto">
            <Card className="shadow-lg lg:sticky lg:top-6 h-full lg:h-auto">
              <CardHeader className="border-b p-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-base sm:text-lg">Match Lineups</span>
                  </div>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="lg:hidden p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4">
                <div className="space-y-3 sm:space-y-4 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search matches..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 sm:py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                    />
                  </div>

                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 sm:py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                    >
                      <option value="all">All Status</option>
                      <option value="DRAFT">Draft</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                  {filteredLineups.map((lineup) => (
                    <button
                      key={lineup.id}
                      onClick={() => {
                        setSelectedLineup(lineup);
                        setShowSidebar(false);
                      }}
                      className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all ${
                        selectedLineup?.id === lineup.id
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm line-clamp-2">
                            {lineup.scheduleName}
                          </h4>
                          <div className="flex flex-col gap-1 items-end flex-shrink-0">
                            {lineup.lockLineup && (
                              <Badge className="text-xs bg-red-100 text-red-700">
                                <Lock className="w-3 h-3 mr-1" />
                                Locked
                              </Badge>
                            )}
                            <Badge
                              className={`text-xs ${getStatusColor(
                                lineup.status,
                              )}`}
                            >
                              {lineup.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{lineup.venue}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {formatDate(lineup.date)} • {lineup.time}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>
                              {lineup.totalPlayers}/{lineup.totalSlots} players
                              • {lineup.totalTeams} teams
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-8">
          {selectedLineup ? (
            <DndContext
              sensors={sensors}
              collisionDetection={rectIntersection}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-4 sm:space-y-6">
                {/* Match Info */}
                <Card className="shadow-lg border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-xl sm:text-2xl font-bold flex-1">
                        {selectedLineup.scheduleName}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedLineup.lockLineup && (
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                        <Badge
                          className={`${getStatusColor(selectedLineup.status)}`}
                        >
                          {selectedLineup.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="truncate">
                          {formatDate(selectedLineup.date)} •{" "}
                          {selectedLineup.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span>
                          {selectedLineup.totalPlayers}/
                          {selectedLineup.totalSlots} players
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span>
                          {selectedLineup.totalTeams} teams •{" "}
                          {getPlayersPerTeam(selectedLineup)} per team
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={handleLockLineup}
                        disabled={isLocking}
                        className={`flex-1 sm:flex-none ${
                          selectedLineup.lockLineup
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-600 hover:bg-green-700"
                        } text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isLocking ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Processing...
                          </>
                        ) : selectedLineup.lockLineup ? (
                          <>
                            <Unlock className="w-4 h-4 mr-2" />
                            Unlock Lineup
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Lock Lineup
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={handleExportToExcel}
                        disabled={isExporting}
                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isExporting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Export to Excel
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {renderTeamCards}

                <DragOverlay>
                  {activeId && activeDragPlayer && (
                    <PlayerCard player={activeDragPlayer} index={0} />
                  )}
                </DragOverlay>
              </div>
            </DndContext>
          ) : (
            <Card className="shadow-lg">
              <CardContent className="p-12 sm:p-16 text-center">
                <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4 sm:mb-6" />
                <h3 className="text-lg sm:text-xl font-bold mb-2">
                  No Lineup Selected
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Select a match from the sidebar to manage teams
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
