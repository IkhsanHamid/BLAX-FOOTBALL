"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Save,
  Calendar,
  Users,
  AlertCircle,
  X,
  Shuffle,
  Swords,
  Clock,
} from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent } from "../atoms/Card";
import Input from "../atoms/Input";
import Badge from "../atoms/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../atoms/Dialog";
import ConfirmationModal from "../molecules/ConfirmationModal";
import { useNotifications } from "./NotificationContainer";
import { formatDate } from "@/lib/helper";
import { adminService } from "@/utils/admin";
import type {
  ScheduleMatch,
  ScheduleMatchInput,
  ScheduleMatchTeam,
} from "@/types/schedule";

interface ScheduleOption {
  id: string;
  name: string;
  date: string;
  time: string;
  team: number;
  scheduleTeams?: string[];
}

interface MatchFormRow {
  teamAId: string;
  teamBId: string;
  matchTime: string;
}

const emptyMatch: MatchFormRow = {
  teamAId: "",
  teamBId: "",
  matchTime: "",
};

export default function ScheduleMatchManagement() {
  const { showSuccess, showError } = useNotifications();

  // Schedule selection
  const [schedules, setSchedules] = useState<ScheduleOption[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );
  const [selectedScheduleName, setSelectedScheduleName] = useState("");

  // Matches for selected schedule
  const [matches, setMatches] = useState<ScheduleMatch[]>([]);
  const [teams, setTeams] = useState<ScheduleMatchTeam[]>([]);
  const [masterTeams, setMasterTeams] = useState<
    {
      id: string;
      name: string;
      hexColor: string | null;
      image: string | null;
    }[]
  >([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Bulk replace dialog
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkMatches, setBulkMatches] = useState<MatchFormRow[]>([
    { ...emptyMatch },
  ]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Edit single match dialog
  const [editingMatch, setEditingMatch] = useState<ScheduleMatch | null>(null);
  const [editForm, setEditForm] = useState<MatchFormRow>(emptyMatch);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<ScheduleMatch | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isFetchingRef = useRef(false);

  const fetchSchedules = useCallback(async () => {
    setSchedulesLoading(true);
    try {
      const response = (await adminService.scheduleOverview()) as any;
      const list: any[] = Array.isArray(response)
        ? response
        : (response?.data ?? []);
      const opts: ScheduleOption[] = list.map((s: any) => ({
        id: s.id,
        name: s.name,
        date: s.date,
        time: s.time,
        team: s.team,
        scheduleTeams: Array.isArray(s.scheduleTeams) ? s.scheduleTeams : [],
      }));
      setSchedules(opts);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      showError("Error", "Gagal memuat daftar jadwal");
      setSchedules([]);
    } finally {
      setSchedulesLoading(false);
    }
  }, [showError]);

  const fetchMatches = useCallback(
    async (scheduleId: string) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setMatchesLoading(true);
      try {
        const response = await adminService.getScheduleMatches(scheduleId);
        const list = response?.data ?? [];
        const matchList = Array.isArray(list) ? list : [];
        setMatches(matchList);

        // Collect unique teams from matches (to populate teams dropdown)
        const teamMap = new Map<string, ScheduleMatchTeam>();
        matchList.forEach((m: ScheduleMatch) => {
          if (m.teamA) teamMap.set(m.teamA.id, m.teamA);
          if (m.teamB) teamMap.set(m.teamB.id, m.teamB);
        });
        setTeams(Array.from(teamMap.values()));
      } catch (error: any) {
        console.error("Error fetching matches:", error);
        showError(
          "Error",
          error?.message || "Gagal memuat daftar pertandingan",
        );
        setMatches([]);
        setTeams([]);
      } finally {
        setMatchesLoading(false);
        isFetchingRef.current = false;
      }
    },
    [showError],
  );

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    if (selectedScheduleId) {
      fetchMatches(selectedScheduleId);
    } else {
      setMatches([]);
      setTeams([]);
    }
  }, [selectedScheduleId, fetchMatches]);

  // Fetch master teams when a schedule is selected (for team dropdowns)
  useEffect(() => {
    if (!selectedScheduleId) {
      setMasterTeams([]);
      return;
    }
    const fetchMasterTeams = async () => {
      try {
        const response = await adminService.getMasterTeams("", 0, 100);
        setMasterTeams(response?.data?.data ?? []);
      } catch (error) {
        console.error("Error fetching master teams:", error);
        setMasterTeams([]);
      }
    };
    fetchMasterTeams();
  }, [selectedScheduleId]);

  const handleSelectSchedule = (schedule: ScheduleOption) => {
    setSelectedScheduleId(schedule.id);
    setSelectedScheduleName(schedule.name);
  };

  const handleBackToList = () => {
    setSelectedScheduleId(null);
    setSelectedScheduleName("");
    setMatches([]);
    setTeams([]);
    setMasterTeams([]);
  };

  // --- Bulk replace ---
  const openBulkDialog = () => {
    if (matches.length > 0) {
      setBulkMatches(
        matches.map((m) => ({
          teamAId: m.teamA?.id || "",
          teamBId: m.teamB?.id || "",
          matchTime: m.matchTime,
        })),
      );
    } else {
      setBulkMatches([{ ...emptyMatch }]);
    }
    setShowBulkDialog(true);
  };

  const addBulkRow = () => {
    setBulkMatches((prev) => [...prev, { ...emptyMatch }]);
  };

  const removeBulkRow = (index: number) => {
    setBulkMatches((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBulkRow = (
    index: number,
    field: keyof MatchFormRow,
    value: string,
  ) => {
    setBulkMatches((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  };

  const handleBulkSave = async () => {
    if (!selectedScheduleId) return;
    if (bulkMatches.length === 0) {
      showError("Validasi gagal", "Minimal 1 pertandingan");
      return;
    }
    for (let i = 0; i < bulkMatches.length; i++) {
      const m = bulkMatches[i];
      if (!m.teamAId || !m.teamBId || !m.matchTime) {
        showError(
          "Validasi gagal",
          `Pertandingan #${i + 1}: Team A, Team B, dan waktu wajib diisi`,
        );
        return;
      }
      if (m.teamAId === m.teamBId) {
        showError(
          "Validasi gagal",
          `Pertandingan #${i + 1}: Team A dan Team B tidak boleh sama`,
        );
        return;
      }
    }

    setBulkSubmitting(true);
    try {
      const payload = {
        matches: bulkMatches.map((m) => ({
          teamAId: m.teamAId,
          teamBId: m.teamBId,
          matchTime: m.matchTime,
        })),
      };
      const response = await adminService.bulkReplaceScheduleMatches(
        selectedScheduleId,
        payload,
      );
      showSuccess(
        "Pertandingan berhasil disimpan",
        `${response?.data?.length ?? bulkMatches.length} pertandingan terdaftar`,
      );
      setShowBulkDialog(false);
      await fetchMatches(selectedScheduleId);
    } catch (error: any) {
      console.error("Error saving matches:", error);
      showError("Gagal menyimpan", error?.message || "Terjadi kesalahan");
    } finally {
      setBulkSubmitting(false);
    }
  };

  // --- Edit single match ---
  const openEditMatch = (match: ScheduleMatch) => {
    setEditingMatch(match);
    setEditForm({
      teamAId: match.teamA?.id || "",
      teamBId: match.teamB?.id || "",
      matchTime: match.matchTime,
    });
  };

  const closeEditMatch = () => {
    setEditingMatch(null);
    setEditForm(emptyMatch);
  };

  const handleUpdateMatch = async () => {
    if (!editingMatch) return;
    if (!editForm.teamAId || !editForm.teamBId || !editForm.matchTime) {
      showError("Validasi gagal", "Semua field wajib diisi");
      return;
    }
    if (editForm.teamAId === editForm.teamBId) {
      showError("Validasi gagal", "Team A dan Team B tidak boleh sama");
      return;
    }
    setEditSubmitting(true);
    try {
      await adminService.updateScheduleMatch(editingMatch.id, {
        matchTime: editForm.matchTime,
        teamAId: editForm.teamAId,
        teamBId: editForm.teamBId,
      });
      showSuccess("Pertandingan berhasil diupdate");
      closeEditMatch();
      if (selectedScheduleId) await fetchMatches(selectedScheduleId);
    } catch (error: any) {
      console.error("Error updating match:", error);
      showError("Gagal mengupdate", error?.message || "Terjadi kesalahan");
    } finally {
      setEditSubmitting(false);
    }
  };

  // --- Delete ---
  const handleDeleteMatch = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteScheduleMatch(deleteTarget.id);
      showSuccess("Pertandingan berhasil dihapus");
      setDeleteTarget(null);
      if (selectedScheduleId) await fetchMatches(selectedScheduleId);
    } catch (error: any) {
      console.error("Error deleting match:", error);
      showError("Gagal menghapus", error?.message || "Terjadi kesalahan");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered schedules
  // Only show schedules that have teams configured (scheduleTeams array not empty)
  const schedulesWithTeams = schedules.filter(
    (s) => s.scheduleTeams && s.scheduleTeams.length > 0,
  );

  const filteredSchedules = scheduleSearch
    ? schedulesWithTeams.filter(
        (s) =>
          s.name.toLowerCase().includes(scheduleSearch.toLowerCase()) ||
          formatDate(s.date)
            .toLowerCase()
            .includes(scheduleSearch.toLowerCase()),
      )
    : schedulesWithTeams;

  // Teams available for team pickers in bulk/edit dialogs.
  // Source of truth: master teams whose name matches one of the
  // `scheduleTeams` from the currently selected schedule.
  const selectedSchedule = selectedScheduleId
    ? schedules.find((s) => s.id === selectedScheduleId)
    : null;
  const availableTeamNames = selectedSchedule?.scheduleTeams ?? [];
  const allTeamsForDropdown = (() => {
    const map = new Map<string, {
      id: string;
      name: string;
      hexColor: string | null;
      image: string | null;
    }>();
    masterTeams
      .filter((t) => availableTeamNames.includes(t.name))
      .forEach((t) => map.set(t.id, { id: t.id, name: t.name, hexColor: t.hexColor, image: t.image }));
    teams.forEach((t) => map.set(t.id, { id: t.id, name: t.name, hexColor: t.hexColor, image: t.image }));
    return Array.from(map.values());
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Atur Jadwal Pertandingan
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Atur jadwal pertandingan (match) antara team untuk setiap jadwal.
          </p>
        </div>
        {selectedScheduleId && (
          <Button variant="outline" onClick={handleBackToList}>
            ← Kembali ke daftar jadwal
          </Button>
        )}
      </div>

      {!selectedScheduleId ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari nama atau tanggal jadwal..."
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={fetchSchedules}
                disabled={schedulesLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${schedulesLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            {schedulesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : filteredSchedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {schedulesWithTeams.length === 0
                  ? "Tidak ada jadwal yang memiliki team. Atur team di menu Jadwal (Edit Jadwal) terlebih dahulu."
                  : "Tidak ada jadwal ditemukan"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSchedules.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSchedule(s)}
                    className="w-full flex items-center gap-2 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:border-sky-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{s.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{formatDate(s.date)} • {s.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge variant="outline" className="hidden sm:inline-flex">
                        <Users className="w-3 h-3 mr-1" />
                        {s.team} team
                      </Badge>
                      <span className="text-sky-600 text-xs sm:text-sm font-medium whitespace-nowrap">
                        Atur Match →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <div className="text-sm text-gray-500">Jadwal</div>
                <div className="font-semibold text-gray-900">
                  {selectedScheduleName}
                </div>
              </div>
              <Button
                onClick={openBulkDialog}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Atur Semua Match
              </Button>
            </div>

            {matchesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                <Swords className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-3">
                  Belum ada pertandingan terdaftar untuk jadwal ini
                </p>
                <Button
                  onClick={openBulkDialog}
                  className="bg-sky-600 hover:bg-sky-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Match
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {matches.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge variant="outline" className="flex-shrink-0 hidden sm:inline-flex">
                        #{m.matchOrder + 1}
                      </Badge>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0"
                          style={{
                            backgroundColor: m.teamA?.hexColor || "#6B7280",
                          }}
                        >
                          {m.teamA?.image ? (
                            <img
                              src={m.teamA.image}
                              alt={m.teamA.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            m.teamA?.name?.charAt(0).toUpperCase() || "?"
                          )}
                        </div>
                        <span className="font-medium text-gray-900 truncate text-sm sm:text-base">
                          {m.teamA?.name}
                        </span>
                        <Swords className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0"
                          style={{
                            backgroundColor: m.teamB?.hexColor || "#6B7280",
                          }}
                        >
                          {m.teamB?.image ? (
                            <img
                              src={m.teamB.image}
                              alt={m.teamB.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            m.teamB?.name?.charAt(0).toUpperCase() || "?"
                          )}
                        </div>
                        <span className="font-medium text-gray-900 truncate text-sm sm:text-base">
                          {m.teamB?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {m.matchTime}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <span title="Edit">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditMatch(m)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </span>
                      <span title="Hapus">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(m)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {matches.length > 0 && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                Total {matches.length} pertandingan
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk Replace Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atur Semua Pertandingan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                Mengatur ulang akan{" "}
                <strong>menghapus semua pertandingan existing</strong> dan
                menggantinya dengan daftar di bawah.
              </div>
            </div>

            <div className="space-y-2">
              {bulkMatches.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg"
                >
                  <span className="text-xs text-gray-500 w-6 font-mono">
                    #{i + 1}
                  </span>
                  <select
                    value={m.teamAId}
                    onChange={(e) => updateBulkRow(i, "teamAId", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Pilih Team A</option>
                    {allTeamsForDropdown.map((t) => (
                      <option key={`a-${i}-${t.id}`} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <Swords className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={m.teamBId}
                    onChange={(e) => updateBulkRow(i, "teamBId", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Pilih Team B</option>
                    {allTeamsForDropdown.map((t) => (
                      <option key={`b-${i}-${t.id}`} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={m.matchTime}
                    onChange={(e) =>
                      updateBulkRow(i, "matchTime", e.target.value)
                    }
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {bulkMatches.length > 1 && (
                    <button
                      onClick={() => removeBulkRow(i)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg flex-shrink-0"
                      title="Hapus"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addBulkRow} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Baris
            </Button>

            <div className="flex gap-2 justify-end pt-3 border-t">
              <Button
                variant="outline"
                onClick={() => setShowBulkDialog(false)}
                disabled={bulkSubmitting}
              >
                Batal
              </Button>
              <Button
                onClick={handleBulkSave}
                disabled={bulkSubmitting}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {bulkSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Single Match Dialog */}
      <Dialog
        open={!!editingMatch}
        onOpenChange={(open) => !open && closeEditMatch()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pertandingan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Team A
              </label>
              <select
                value={editForm.teamAId}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, teamAId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Pilih Team A</option>
                {allTeamsForDropdown.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Team B
              </label>
              <select
                value={editForm.teamBId}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, teamBId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Pilih Team B</option>
                {allTeamsForDropdown.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Waktu Pertandingan
              </label>
              <input
                type="time"
                value={editForm.matchTime}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, matchTime: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={closeEditMatch}
                disabled={editSubmitting}
              >
                Batal
              </Button>
              <Button
                onClick={handleUpdateMatch}
                disabled={editSubmitting}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                {editSubmitting ? "Menyimpan..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteMatch}
        title="Hapus Pertandingan"
        message={
          deleteTarget
            ? `Hapus pertandingan #${deleteTarget.matchOrder + 1}?`
            : ""
        }
        type="danger"
        confirmText={deleting ? "Menghapus..." : "Hapus"}
        cancelText="Batal"
        isLoading={deleting}
      />
    </div>
  );
}
