"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Trophy,
  Clock,
  MapPin,
  Calendar,
  Search,
  Phone,
  Shield,
  Target,
  ChevronDown,
  ChevronUp,
  Filter,
  GripVertical,
  AlertCircle,
  UserCheck,
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

// ========== TYPES ==========
interface SortablePlayerCardProps {
  player: LineupPlayer;
  index: number;
  teamKey: string;
  canAcceptPlayer: boolean;
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
const TEAM_COLORS: TeamColors[] = [
  {
    gradient: "from-rose-50 to-white",
    border: "border-rose-200",
    bg: "bg-rose-50/50",
    badge: "bg-rose-100 text-rose-700",
    icon: "from-rose-500 to-red-600",
    dragOver: "border-rose-400 bg-rose-50",
  },
  {
    gradient: "from-sky-50 to-white",
    border: "border-sky-200",
    bg: "bg-sky-50/50",
    badge: "bg-sky-100 text-sky-700",
    icon: "from-sky-500 to-blue-600",
    dragOver: "border-sky-400 bg-sky-50",
  },
  {
    gradient: "from-emerald-50 to-white",
    border: "border-emerald-200",
    bg: "bg-emerald-50/50",
    badge: "bg-emerald-100 text-emerald-700",
    icon: "from-emerald-500 to-green-600",
    dragOver: "border-emerald-400 bg-emerald-50",
  },
  {
    gradient: "from-purple-50 to-white",
    border: "border-purple-200",
    bg: "bg-purple-50/50",
    badge: "bg-purple-100 text-purple-700",
    icon: "from-purple-500 to-indigo-600",
    dragOver: "border-purple-400 bg-purple-50",
  },
];

const STATUS_COLORS = {
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
} as const;

// ========== UTILITY FUNCTIONS ==========
const getTeamLetter = (index: number): string =>
  String.fromCharCode(65 + index);
const getTeamColor = (index: number): TeamColors =>
  TEAM_COLORS[index % TEAM_COLORS.length];
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
  ({ player, index, teamKey, canAcceptPlayer }: SortablePlayerCardProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: player.id });
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
        }`}
      >
        <div className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              {...attributes}
              {...listeners}
              className={`cursor-grab active:cursor-grabbing p-1.5 rounded flex-shrink-0 touch-none ${
                isGK
                  ? "hover:bg-amber-100 text-amber-600"
                  : "hover:bg-blue-100 text-blue-600"
              }`}
            >
              <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
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
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{player.phone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 flex-shrink-0" />
                  <span>Team {teamKey}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
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
  }
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
  }
);

TeamDropzone.displayName = "TeamDropzone";

// ========== MAIN COMPONENT ==========
export default function LineupManagement() {
  const [lineups, setLineups] = useState<LineupMatch[]>([]);
  const [selectedLineup, setSelectedLineup] = useState<LineupMatch | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>(
    {}
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const { showError, showSuccess, showWarning } = useNotifications();

  // FIXED: Add TouchSensor for mobile support
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // ========== EFFECTS ==========
  useEffect(() => {
    fetchLineups();
  }, []);

  useEffect(() => {
    if (selectedLineup) {
      const initialExpanded: Record<string, boolean> = {};
      for (let i = 0; i < (selectedLineup.totalTeams || 2); i++) {
        initialExpanded[getTeamLetter(i)] = true;
      }
      setExpandedTeams(initialExpanded);

      if (
        !selectedLineup.teams ||
        Object.keys(selectedLineup.teams).length === 0
      ) {
        const teams: Record<string, LineupPlayer[]> = {};
        for (let i = 0; i < (selectedLineup.totalTeams || 2); i++) {
          teams[getTeamLetter(i)] = [];
        }
        setSelectedLineup({ ...selectedLineup, teams });
      }
    }
  }, [selectedLineup?.id]);

  // ========== API CALLS ==========
  const fetchLineups = async () => {
    try {
      setLoading(true);
      const data = await lineupService.fetchLineups();
      const processedData = data.map((lineup) => {
        if (!lineup.teams || Object.keys(lineup.teams).length === 0) {
          const teams: Record<string, LineupPlayer[]> = {};
          for (let i = 0; i < (lineup.totalTeams || 2); i++) {
            teams[getTeamLetter(i)] = [];
          }
          return { ...lineup, teams };
        }
        return lineup;
      });
      setLineups(processedData);
      if (processedData.length > 0) setSelectedLineup(processedData[0]);
    } catch (error) {
      showError("Error", "Failed to load lineups");
    } finally {
      setLoading(false);
    }
  };

  // ========== VALIDATION ==========
  const canAcceptPlayer = useCallback(
    (
      teamKey: string,
      player: LineupPlayer,
      lineup: LineupMatch
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
    []
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

      const activeId = active.id as string;
      const overId = over.id as string;
      const allPlayers = getAllPlayers(selectedLineup);
      const activePlayer = allPlayers.find((p) => p.id === activeId);

      if (!activePlayer) return;

      let targetTeam: string | null = null;
      let targetIndex = -1;

      // Check if dropped on container
      for (let i = 0; i < (selectedLineup.totalTeams || 2); i++) {
        const teamKey = getTeamLetter(i);
        if (overId === `team-${teamKey}-container`) {
          targetTeam = teamKey;
          targetIndex = selectedLineup.teams[teamKey]?.length || 0;
          break;
        }
      }

      // Check if dropped on player
      if (!targetTeam) {
        const overPlayer = allPlayers.find((p) => p.id === overId);
        if (overPlayer) {
          targetTeam = overPlayer.team;
          targetIndex =
            selectedLineup.teams[targetTeam]?.findIndex(
              (p) => p.id === overId
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
            prev.map((l) => (l.id === selectedLineup.id ? updatedLineup : l))
          );
        }
        return;
      }

      // Move to different team
      const { canAccept, reason } = canAcceptPlayer(
        targetTeam,
        activePlayer,
        selectedLineup
      );
      if (!canAccept) {
        showWarning(
          "Cannot move player",
          reason || "Team constraints prevent this move"
        );
        return;
      }

      const updatedTeams = { ...selectedLineup.teams };
      updatedTeams[activePlayer.team] = updatedTeams[activePlayer.team].filter(
        (p) => p.id !== activeId
      );

      const updatedPlayer = { ...activePlayer, team: targetTeam };
      updatedTeams[targetTeam] = [...(updatedTeams[targetTeam] || [])];
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
          lineup.id === selectedLineup.id ? updatedLineup : lineup
        )
      );

      try {
        await lineupService.updatePlayerTeam(activePlayer.id, targetTeam);
        showSuccess(`Player moved to Team ${targetTeam}`);
      } catch (error) {
        showError("Error", "Failed to update player team");
        setSelectedLineup(selectedLineup);
        setLineups((prev) =>
          prev.map((lineup) =>
            lineup.id === selectedLineup.id ? selectedLineup : lineup
          )
        );
      }
    },
    [selectedLineup, canAcceptPlayer, showWarning, showSuccess, showError]
  );

  // ========== MEMOIZED VALUES ==========
  const activeDragPlayer = useMemo(
    () =>
      selectedLineup
        ? getAllPlayers(selectedLineup).find((p) => p.id === activeId)
        : null,
    [selectedLineup, activeId]
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
    [lineups, searchTerm, statusFilter]
  );

  // ========== RENDER HELPERS ==========
  const toggleTeamExpansion = useCallback((teamKey: string) => {
    setExpandedTeams((prev) => ({ ...prev, [teamKey]: !prev[teamKey] }));
  }, []);

  const renderTeamCards = useMemo(() => {
    if (!selectedLineup) return null;

    const totalTeams = selectedLineup.totalTeams || 2;
    const maxPlayersPerTeam = getPlayersPerTeam(selectedLineup);

    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {Array.from({ length: totalTeams }, (_, i) => {
          const teamKey = getTeamLetter(i);
          const teamColor = getTeamColor(i);
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
              isActive={!!activeId && canAccept}
            >
              <Card
                className={`shadow-lg border-2 bg-gradient-to-br transition-all ${
                  teamColor.gradient
                } ${
                  isDragOver && canAccept
                    ? teamColor.dragOver
                    : teamColor.border
                } ${!canAccept && activeId ? "opacity-50" : ""}`}
              >
                <CardHeader className={`border-b ${teamColor.bg} p-3 sm:p-4`}>
                  <button
                    onClick={() => toggleTeamExpansion(teamKey)}
                    className="w-full"
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${teamColor.icon} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0`}
                        >
                          <span className="text-white font-bold text-base sm:text-lg">
                            {teamKey}
                          </span>
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-sm sm:text-base">
                            Team {teamKey}
                          </div>
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
                            />
                          ))
                        ) : (
                          <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-xl">
                            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                            <p className="text-sm sm:text-base text-gray-500">
                              Drop players here
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
                          <Badge
                            className={`text-xs flex-shrink-0 ${getStatusColor(
                              lineup.status
                            )}`}
                          >
                            {lineup.status}
                          </Badge>
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
                      <Badge
                        className={`self-start sm:self-auto ${getStatusColor(
                          selectedLineup.status
                        )}`}
                      >
                        {selectedLineup.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-sm">
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
