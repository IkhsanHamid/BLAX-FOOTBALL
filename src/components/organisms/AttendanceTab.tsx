"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Search,
  ClipboardCheck,
  History,
  UserCheck,
  UserX,
  CheckCircle,
  AlertCircle,
  Check,
} from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent } from "../atoms/Card";
import Input from "../atoms/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../atoms/Table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../atoms/Dialog";
import { useNotifications } from "./NotificationContainer";
import { adminService } from "@/utils/admin";
import type { AttendanceTeam, AttendanceHistoryData } from "@/types/admin";

type SubTab = "checklist" | "history";

export default function AttendanceTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [selectedScheduleName, setSelectedScheduleName] = useState("");

  const [activeTab, setActiveTab] = useState<SubTab>("checklist");

  // Checklist
  const [checklist, setChecklist] = useState<AttendanceTeam[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);

  // History
  const [history, setHistory] = useState<AttendanceHistoryData | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Complete dialog
  const [showComplete, setShowComplete] = useState(false);
  const [penanggungJawab, setPenanggungJawab] = useState("");
  const [completeResult, setCompleteResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const { showSuccess, showError } = useNotifications();
  const isSearchingRef = useRef(false);

  const handleSearch = async () => {
    if (!searchTerm.trim() || isSearchingRef.current) return;
    isSearchingRef.current = true;
    setLoadingSchedules(true);
    try {
      const data = await adminService.scheduleOverview();
      const filtered = (Array.isArray(data) ? data : []).filter((s: any) =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setSchedules(filtered.slice(0, 20));
    } catch {
      showError("Error", "Gagal mencari jadwal");
    } finally {
      setLoadingSchedules(false);
      isSearchingRef.current = false;
    }
  };

  const selectSchedule = (id: string, name: string) => {
    setSelectedScheduleId(id);
    setSelectedScheduleName(name);
    if (activeTab === "checklist") loadChecklist(id);
    else loadHistory(id);
  };

  const loadChecklist = useCallback(async (scheduleId: string) => {
    setLoadingChecklist(true);
    try {
      const res = await adminService.getAttendanceChecklist(scheduleId);
      setChecklist(res?.data ?? []);
    } catch {
      showError("Error", "Gagal memuat checklist");
    } finally {
      setLoadingChecklist(false);
    }
  }, [showError]);

  const loadHistory = useCallback(async (scheduleId: string) => {
    setLoadingHistory(true);
    try {
      const res = await adminService.getAttendanceHistory(scheduleId);
      setHistory(res?.data ?? null);
    } catch {
      showError("Error", "Gagal memuat riwayat");
    } finally {
      setLoadingHistory(false);
    }
  }, [showError]);

  const toggleTab = (tab: SubTab) => {
    setActiveTab(tab);
    if (selectedScheduleId) {
      if (tab === "checklist") loadChecklist(selectedScheduleId);
      else loadHistory(selectedScheduleId);
    }
  };

  const handleToggleHadir = async (player: any) => {
    try {
      await adminService.updateAttendance(player.lineupId, {
        isPresent: !player.isPresent,
      });
      setChecklist((prev) =>
        prev.map((team) => ({
          ...team,
          gk: team.gk?.lineupId === player.lineupId
            ? { ...team.gk, isPresent: !player.isPresent }
            : team.gk,
          players: team.players.map((p) =>
            p.lineupId === player.lineupId
              ? { ...p, isPresent: !p.isPresent }
              : p,
          ),
        } as AttendanceTeam)),
      );
    } catch {
      showError("Error", "Gagal update kehadiran");
    }
  };

  const handleSaveJersey = async (player: any) => {
    try {
      await adminService.updateAttendance(player.lineupId, {
        jerseyNumber: player.jerseyNumber || "",
        jerseySize: player.jerseySize || "",
      });
      showSuccess("Tersimpan", "Jersey berhasil disimpan");
    } catch {
      showError("Error", "Gagal menyimpan jersey");
    }
  };

  const handleCompleteSchedule = async () => {
    if (!penanggungJawab.trim()) {
      showError("Error", "Nama penanggung jawab wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      const res = await adminService.completeSchedule(selectedScheduleId, {
        penanggungJawab: penanggungJawab.trim(),
      });
      setCompleteResult(res?.data ?? res);
      showSuccess("Berhasil", "Schedule berhasil diselesaikan");
    } catch (err: any) {
      showError("Error", err?.message || "Gagal menyelesaikan schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const getHadirCount = (team: AttendanceTeam) => {
    const gkHadir = team.gk?.isPresent ? 1 : 0;
    const playersHadir = team.players.filter((p) => p.isPresent).length;
    return gkHadir + playersHadir;
  };

  const getTotalCount = (team: AttendanceTeam) => {
    return (team.gk ? 1 : 0) + team.players.length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Kehadiran Lineup</h2>
        <p className="text-sm text-gray-500 mt-1">Kelola kehadiran pemain dan riwayat lineup</p>
      </div>

      {/* Schedule Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1" onKeyDown={(e) => e.key === "Enter" && handleSearch()}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari jadwal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <Button variant="primary" onClick={handleSearch} disabled={loadingSchedules}>
              <Search className="w-4 h-4 mr-2" />
              Cari
            </Button>
          </div>
          {schedules.length > 0 && (
            <div className="mt-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y">
              {schedules.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => selectSchedule(s.id, s.name)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-sky-50 transition-colors ${
                    selectedScheduleId === s.id ? "bg-sky-50 text-sky-700 font-medium" : "text-gray-700"
                  }`}
                >
                  {s.name} — {s.date ? new Date(s.date).toLocaleDateString("id-ID") : ""} {s.time}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedScheduleId && (
        <>
          {/* Sub-tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => toggleTab("checklist")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === "checklist"
                  ? "bg-white text-sky-700 shadow-sm font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              Kehadiran
            </button>
            <button
              onClick={() => toggleTab("history")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === "history"
                  ? "bg-white text-sky-700 shadow-sm font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <History className="w-4 h-4" />
              Riwayat
            </button>
          </div>

          {activeTab === "checklist" ? (
            <>
              {/* Checklist Header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-gray-800">
                  {selectedScheduleName}
                </h3>
                <Button variant="primary" size="sm" onClick={() => { setShowComplete(true); setCompleteResult(null); setPenanggungJawab(""); }}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Selesaikan Schedule
                </Button>
              </div>

              {/* Check stats */}
              {checklist.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {checklist.map((team) => (
                    <Card key={team.teamName}>
                      <CardContent className="p-3 text-center">
                        <p className="text-sm font-bold" style={{ color: team.hexColor || "#333" }}>{team.teamName}</p>
                        <p className="text-xs text-gray-500">
                          <span className="text-green-600 font-semibold">{getHadirCount(team)}</span>
                          /
                          <span className="text-gray-600">{getTotalCount(team)}</span> hadir
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Checklist Detail */}
              {loadingChecklist ? (
                <div className="text-center py-8 text-gray-500">Memuat...</div>
              ) : checklist.length > 0 ? (
                <div className="space-y-4">
                  {checklist.map((team) => (
                    <Card key={team.teamName}>
                      <CardContent className="p-0">
                        <div
                          className="px-4 py-3 border-b font-semibold text-sm flex items-center gap-2"
                          style={{ backgroundColor: (team.hexColor || "#6B7280") + "15" }}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: team.hexColor || "#6B7280" }}
                          />
                          {team.teamName}
                        </div>
                        <div className="divide-y">
                          {team.gk && (
                            <PlayerRow
                              player={team.gk}
                              onToggle={handleToggleHadir}
                              onSaveJersey={handleSaveJersey}
                            />
                          )}
                          {team.players.map((p) => (
                            <PlayerRow
                              key={p.lineupId}
                              player={p}
                              onToggle={handleToggleHadir}
                              onSaveJersey={handleSaveJersey}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">Belum ada data lineup</div>
              )}
            </>
          ) : (
            /* History */
            loadingHistory ? (
              <div className="text-center py-8 text-gray-500">Memuat...</div>
            ) : history ? (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{history.scheduleName}</h3>
                        <p className="text-xs text-gray-500">
                          {new Date(history.date).toLocaleDateString("id-ID")} • {history.time} WIB
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{history.attendance.hadir}</p>
                          <p className="text-xs text-gray-500">Hadir</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-500">{history.attendance.tidakHadir}</p>
                          <p className="text-xs text-gray-500">Tidak Hadir</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-slate-600">{history.attendance.totalPlayers}</p>
                          <p className="text-xs text-gray-500">Total</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Penanggung Jawab: {history.penanggungJawab}
                    </p>
                  </CardContent>
                </Card>

                {history.lineup.map((team) => (
                  <Card key={team.teamName}>
                    <CardContent className="p-0">
                      <div className="px-4 py-3 border-b font-semibold text-sm">{team.teamName}</div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Posisi</TableHead>
                            <TableHead>Jersey</TableHead>
                            <TableHead>Kehadiran</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {team.gk && (
                            <HistoryPlayerRow player={team.gk} />
                          )}
                          {team.players.map((p, i) => (
                            <HistoryPlayerRow key={i} player={p} />
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">Belum ada riwayat</div>
            )
          )}
        </>
      )}

      {/* Complete Dialog */}
      <Dialog open={showComplete} onOpenChange={setShowComplete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selesaikan Schedule</DialogTitle>
          </DialogHeader>
          {completeResult ? (
            <div className="space-y-4 py-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Schedule selesai</p>
                  <div className="text-xs text-emerald-600 mt-1 space-y-0.5">
                    <p>Total: {completeResult.total} pemain</p>
                    <p>Hadir: {completeResult.hadir}</p>
                    <p>Tidak Hadir: {completeResult.tidakHadir}</p>
                  </div>
                </div>
              </div>
              <Button variant="primary" className="w-full" onClick={() => setShowComplete(false)}>Tutup</Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-sm text-amber-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Schedule akan ditandai selesai dan tidak bisa diedit kembali.</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Penanggung Jawab <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Nama penanggung jawab"
                  value={penanggungJawab}
                  onChange={(e) => setPenanggungJawab(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowComplete(false)} disabled={submitting}>
                  Batal
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleCompleteSchedule} disabled={submitting}>
                  {submitting ? "Memproses..." : "Selesaikan"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlayerRow({
  player,
  onToggle,
  onSaveJersey,
}: {
  player: any;
  onToggle: (p: any) => void;
  onSaveJersey: (p: any) => void;
}) {
  const [jerseyNumber, setJerseyNumber] = useState(player.jerseyNumber || "");
  const [jerseySize, setJerseySize] = useState(player.jerseySize || "");
  const [showJersey, setShowJersey] = useState(false);

  return (
    <div className="px-4 py-2.5 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => {
              player.jerseyNumber = jerseyNumber;
              player.jerseySize = jerseySize;
              onToggle(player);
            }}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              player.isPresent
                ? "bg-green-500 border-green-500 text-white"
                : "border-gray-300 hover:border-green-400"
            }`}
          >
            {player.isPresent && <Check className="w-3 h-3" />}
          </button>
          <div className="min-w-0">
            <p className={`text-sm truncate ${player.isPresent ? "text-gray-800 font-medium" : "text-gray-500"}`}>
              {player.name || "—"}
            </p>
            <p className="text-[10px] text-gray-400">
              {player.position}
              {player.jerseyNumber && <> · #{player.jerseyNumber}</>}
              {player.jerseySize && <> · {player.jerseySize}</>}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowJersey(!showJersey)}
          className="text-[10px] text-sky-600 hover:text-sky-800 font-medium flex-shrink-0"
        >
          {showJersey ? "Tutup" : "Jersey"}
        </button>
      </div>
      {showJersey && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            maxLength={10}
            placeholder="No."
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
            className="w-14 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-sky-500"
          />
          <input
            type="text"
            maxLength={5}
            placeholder="Size"
            value={jerseySize}
            onChange={(e) => setJerseySize(e.target.value)}
            className="w-14 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-sky-500"
          />
          <Button
            size="sm"
            variant="outline"
            className="text-[10px] h-auto py-1"
            onClick={() => {
              player.jerseyNumber = jerseyNumber;
              player.jerseySize = jerseySize;
              onSaveJersey(player);
              setShowJersey(false);
            }}
          >
            Simpan
          </Button>
        </div>
      )}
    </div>
  );
}

function HistoryPlayerRow({ player }: { player: any }) {
  return (
    <TableRow>
      <TableCell className="text-sm">{player.name || "—"}</TableCell>
      <TableCell className="text-xs text-gray-500">{player.position}</TableCell>
      <TableCell className="text-xs text-gray-500">
        {player.jerseyNumber ? `#${player.jerseyNumber}` : "—"}
        {player.jerseySize ? ` (${player.jerseySize})` : ""}
      </TableCell>
      <TableCell>
        {player.isPresent ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
            <UserCheck className="w-3 h-3" /> Hadir
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
            <UserX className="w-3 h-3" /> Tidak Hadir
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}
