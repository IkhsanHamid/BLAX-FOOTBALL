"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Trophy,
  Swords,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Flame,
  BarChart3,
} from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent } from "../atoms/Card";
import Input from "../atoms/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../atoms/Table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../atoms/Dialog";
import { useNotifications } from "./NotificationContainer";
import ConfirmationModal from "../molecules/ConfirmationModal";
import { adminService } from "@/utils/admin";
import type { BracketRound, BracketMatch, MatchDetail, TopScorer } from "@/types/admin";

export default function EventBracketManagement() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [bracket, setBracket] = useState<BracketRound[]>([]);
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [eventDetail, setEventDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Generate bracket
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [stageMode, setStageMode] = useState<"knockout" | "group" | "group-knockout">("knockout");
  const [rounds, setRounds] = useState<{ round: number; roundName: string }[]>([
    { round: 1, roundName: "Quarter Final" },
    { round: 2, roundName: "Semi Final" },
    { round: 3, roundName: "Final" },
  ]);
  const [groups, setGroups] = useState<{ roundName: string; teamIds: string[] }[]>([
    { roundName: "Group A", teamIds: [] },
    { roundName: "Group B", teamIds: [] },
  ]);
  const [knockoutRounds, setKnockoutRounds] = useState<{ round: number; roundName: string }[]>([
    { round: 1, roundName: "Semi Final" },
    { round: 2, roundName: "Final" },
  ]);
  const [advancePerGroup, setAdvancePerGroup] = useState(2);
  const [advanceText, setAdvanceText] = useState("2");
  const [seedings, setSeedings] = useState<{ teamAId: string; teamBId: string }[]>([
    { teamAId: "", teamBId: "" },
  ]);
  const [eventTeams, setEventTeams] = useState<any[]>([]);

  // Edit match
  const [editMatch, setEditMatch] = useState<MatchDetail | null>(null);
  const [editForm, setEditForm] = useState({ status: "scheduled" as string });

  // Add goal
  const [goalMatch, setGoalMatch] = useState<MatchDetail | null>(null);
  const [goalForm, setGoalForm] = useState({ eventTeamId: "", userId: "", name: "", type: "goal" as string });
  const [matchPlayers, setMatchPlayers] = useState<any>(null);
  const [showDeleteGoal, setShowDeleteGoal] = useState<{ matchId: string; goalId: string } | null>(null);
  const [showAdvancePreview, setShowAdvancePreview] = useState(false);
  const [advanceData, setAdvanceData] = useState<any>(null);
  const [advancing, setAdvancing] = useState(false);
  const [manualAdvanceMode, setManualAdvanceMode] = useState(false);
  const [manualAdvanceMatches, setManualAdvanceMatches] = useState<any[]>([]);

  const { showSuccess, showError } = useNotifications();
  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await adminService.getAdminEvents();
      setEvents(res || []);
    } catch {
      showError("Error", "Gagal memuat event");
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadEventData = useCallback(async (eventId: string) => {
    if (!eventId || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const [bracketRes, scorerRes, detailRes, standingsRes] = await Promise.all([
        adminService.getBracket(eventId),
        adminService.getTopScorers(eventId),
        adminService.getEventDetail(eventId),
        adminService.getStandings(eventId),
      ]);
      setBracket(bracketRes?.data ?? []);
      setTopScorers(scorerRes?.data ?? []);
      setEventDetail(detailRes);
      setEventTeams(detailRes?.teams ?? []);
      setStandings(standingsRes?.data ?? []);
    } catch {
      showError("Error", "Gagal memuat data event");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [showError]);

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    if (eventId) loadEventData(eventId);
  };

  const handleGenerateBracket = async () => {
    if (!selectedEventId) return;
    setSubmitting(true);
    try {
      const payload: any = { stage: stageMode };
      if (stageMode === "knockout") {
        if (rounds.length === 0) { showError("Error", "Minimal 1 round"); setSubmitting(false); return; }
        payload.rounds = rounds;
      } else if (stageMode === "group-knockout") {
        if (groups.length === 0 || knockoutRounds.length === 0) { showError("Error", "Minimal 1 group dan 1 knockout round"); setSubmitting(false); return; }
        payload.groups = groups.map((g) => ({ roundName: g.roundName, teamIds: g.teamIds.length > 0 ? g.teamIds : undefined }));
        payload.knockoutRounds = knockoutRounds;
        payload.advancePerGroup = advancePerGroup;
      } else {
        if (groups.length === 0) { showError("Error", "Minimal 1 group"); setSubmitting(false); return; }
        payload.groups = groups.map((g) => ({ roundName: g.roundName, teamIds: g.teamIds.length > 0 ? g.teamIds : undefined }));
      }
      const validSeedings = seedings.filter((s) => s.teamAId.trim() && s.teamBId.trim());
      if (validSeedings.length > 0) payload.seedings = validSeedings.map((s) => ({ teamAId: s.teamAId, teamBId: s.teamBId }));
      const res = await adminService.generateBracket(selectedEventId, payload);
      setBracket(res?.data ?? []);
      setShowGenerateForm(false);
      showSuccess("Berhasil", res?.message || "Bracket berhasil dibuat");
      loadEventData(selectedEventId);
    } catch (err: any) {
      showError("Error", err?.message || "Gagal membuat bracket");
    } finally { setSubmitting(false); }
  };

  const handleDeleteBracket = async () => {
    setSubmitting(true);
    try {
      const result = await adminService.deleteBracket(selectedEventId);
      setBracket([]);
      setShowDeleteConfirm(false);
      showSuccess("Berhasil", result?.message || "Bracket berhasil dihapus");
      loadEventData(selectedEventId);
    } catch (err: any) {
      showError("Error", err?.message || "Gagal menghapus bracket");
    } finally {
      setSubmitting(false);
    }
  };

  const isEventDay = eventDetail
    ? new Date() >= new Date(eventDetail.startDate)
    : false;

  const eventStartStr = eventDetail
    ? new Date(eventDetail.startDate).toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const handlePreviewAdvance = async () => {
    setAdvancing(true);
    try {
      const res = await adminService.getAdvancePreview(selectedEventId, 2);
      setAdvanceData(res?.data ?? null);
      setManualAdvanceMode(false);
      setManualAdvanceMatches((res?.data?.advance ?? []).map((m: any) => ({
        matchId: m.matchId, teamAId: m.teamA?.teamId ?? "", teamBId: m.teamB?.teamId ?? "",
      })));
      setShowAdvancePreview(true);
    } catch (err: any) {
      showError("Error", err?.message || "Gagal memuat preview");
    } finally { setAdvancing(false); }
  };

  const handleSaveManualAdvance = async () => {
    setAdvancing(true);
    try {
      await Promise.all(manualAdvanceMatches.map((m: any) =>
        adminService.updateMatch(selectedEventId, m.matchId, {
          teamAId: m.teamAId || undefined, teamBId: m.teamBId || undefined,
        }),
      ));
      setShowAdvancePreview(false); setManualAdvanceMode(false);
      showSuccess("Berhasil", "Knockout bracket berhasil diisi manual");
      loadEventData(selectedEventId);
    } catch (err: any) {
      showError("Error", err?.message || "Gagal setup manual advance");
    } finally { setAdvancing(false); }
  };

  const handleAutoAdvance = async () => {
    setAdvancing(true);
    try {
      await adminService.autoAdvance(selectedEventId, 2);
      showSuccess("Berhasil", "Knockout bracket berhasil diisi");
      loadEventData(selectedEventId);
    } catch (err: any) {
      showError("Error", err?.message || "Gagal auto advance");
    } finally { setAdvancing(false); }
  };

  const openEditDialog = async (match: BracketMatch) => {
    try {
      const res = await adminService.getMatchDetail(selectedEventId, match.id);
      const d = res.data;
      setEditMatch(d);
      setEditForm({
        status: d.score?.status ?? "scheduled",
      });
    } catch {
      showError("Error", "Gagal memuat detail match");
    }
  };

  const handleUpdateMatch = async () => {
    if (!editMatch) return;
    setSubmitting(true);
    try {
      await adminService.updateMatch(selectedEventId, editMatch.id, {
        status: editForm.status as any,
      });
      setEditMatch(null);
      showSuccess("Berhasil", "Match berhasil diupdate");
      loadEventData(selectedEventId);
    } catch (err: any) {
      showError("Error", err?.message || "Gagal update match");
    } finally {
      setSubmitting(false);
    }
  };

  const openGoalDialog = async (match: BracketMatch) => {
    try {
      const [detailRes, playersRes] = await Promise.all([
        adminService.getMatchDetail(selectedEventId, match.id),
        adminService.getMatchPlayers(selectedEventId, match.id),
      ]);
      setGoalMatch(detailRes.data);
      setMatchPlayers(playersRes?.data ?? null);
      setGoalForm({ eventTeamId: "", userId: "", name: "", type: "goal" });
    } catch {
      showError("Error", "Gagal memuat detail match");
    }
  };

  const handleAddGoal = async () => {
    if (!goalMatch || !goalForm.eventTeamId) return;
    if (!goalForm.userId && !goalForm.name) return;
    setSubmitting(true);
    try {
      const payload: any = {
        eventTeamId: goalForm.eventTeamId,
        type: goalForm.type as any,
      };
      if (goalForm.userId) {
        payload.userId = goalForm.userId;
      } else {
        payload.name = goalForm.name;
      }
      await adminService.addGoal(selectedEventId, goalMatch.id, payload);
      setGoalMatch(null);
      showSuccess("Berhasil", "Gol berhasil ditambahkan");
      loadEventData(selectedEventId);
    } catch (err: any) {
      showError("Error", err?.message || "Gagal menambahkan gol");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!showDeleteGoal) return;
    const { matchId, goalId } = showDeleteGoal;
    setSubmitting(true);
    try {
      await adminService.deleteGoal(selectedEventId, matchId, goalId);
      showSuccess("Berhasil", "Gol berhasil dihapus");
      setShowDeleteGoal(null);
      if (goalMatch && goalMatch.id === matchId) {
        const [detailRes, playersRes] = await Promise.all([
          adminService.getMatchDetail(selectedEventId, matchId),
          adminService.getMatchPlayers(selectedEventId, matchId),
        ]);
        setGoalMatch(detailRes.data);
        setMatchPlayers(playersRes?.data ?? null);
      }
      loadEventData(selectedEventId);
    } catch (err: any) {
      showError("Error", err?.message || "Gagal menghapus gol");
    } finally {
      setSubmitting(false);
    }
  };

  // Get team names from bracket for goal form
  const bracketTeams = (() => {
    const seen = new Set<string>();
    const result: any[] = [];
    for (const r of bracket) {
      for (const m of r.matches ?? []) {
        for (const t of [m.teamA, m.teamB]) {
          if (t && !seen.has(t.id)) {
            seen.add(t.id);
            result.push(t);
          }
        }
      }
    }
    return result;
  })();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Bracket & Score Management</h2>
        <p className="text-sm text-gray-500 mt-1">Kelola bracket, score, dan gol per event</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full sm:max-w-sm">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Event</label>
              <select
                value={selectedEventId}
                onChange={(e) => handleEventSelect(e.target.value)}
                disabled={loadingEvents}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pilih Event --</option>
                {events.map((ev: any) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
            {selectedEventId && (
              <Button
                size="sm"
                className="bg-gray-900 hover:bg-gray-800 text-white text-xs flex-shrink-0"
                onClick={() => setShowGenerateForm(true)}
              >
                <Swords className="w-3 h-3 mr-1" />
                Generate Bracket
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedEventId && loading ? (
        <div className="text-center py-12 text-gray-500">Memuat data...</div>
      ) : selectedEventId && !showGenerateForm ? (
        <>
          {/* Bracket View */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Swords className="w-4 h-4" />
                    Bracket Pertandingan
                  </h3>
                  {eventStartStr && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Dimulai {eventStartStr}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {bracket.length > 0 && (
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 text-xs" onClick={() => setShowDeleteConfirm(true)} disabled={submitting}>
                      <Trash2 className="w-3 h-3 mr-1" />
                      Hapus
                    </Button>
                  )}
                  {bracket.length > 0 && bracket.some((r: any) => r.stage === "knockout" && r.matches?.some((m: any) => !m.teamA && !m.teamB)) && (
                    <>
                      <Button variant="outline" size="sm" className="text-xs" onClick={handlePreviewAdvance} disabled={advancing}>Preview</Button>
                      <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white text-xs" onClick={handleAutoAdvance} disabled={advancing}>Auto Advance</Button>
                    </>
                  )}
                  <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white text-xs" onClick={() => setShowGenerateForm(true)}>
                    <Swords className="w-3 h-3 mr-1" />
                    {bracket.length > 0 ? "Generate Ulang" : "Generate"}
                  </Button>
                </div>
              </div>
              <div className="p-4 overflow-x-auto">
                {bracket.length > 0 ? (
                  <div className={bracket[0]?.stage === "group"
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
                    : "flex gap-4 min-w-max"
                  }>
                    {bracket.map((round, ri) => (
                      <div key={`${round.roundName}-${ri}`} className="flex flex-col gap-3" style={{ minWidth: bracket[0]?.stage === "group" ? "auto" : 200 }}>
                        <div className="bg-slate-800 text-white text-center py-2 px-3 rounded-lg">
                          <p className="text-xs font-bold uppercase">{round.roundName}</p>
                        </div>
                        {round.matches?.map((match) => (
                          <div
                            key={match.id}
                            className={`bg-white rounded-lg border-2 p-3 ${
                              match.score?.status === "finished"
                                ? "border-green-200"
                                : match.score?.status === "live"
                                  ? "border-red-300"
                                  : "border-slate-200"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] text-slate-400">Match #{match.matchOrder}</span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                match.score?.status === "live" ? "bg-red-100 text-red-700" :
                                match.score?.status === "finished" ? "bg-green-100 text-green-700" :
                                "bg-slate-100 text-slate-500"
                              }`}>
                                {match.score?.status ?? "scheduled"}
                              </span>
                            </div>
                            <div className="text-sm flex justify-between mb-1">
                              <span>{match.teamA?.name ?? "TBD"}</span>
                              <span className="font-bold">{match.score?.scoreA ?? 0}</span>
                            </div>
                            <div className="text-sm flex justify-between mb-2">
                              <span>{match.teamB?.name ?? "TBD"}</span>
                              <span className="font-bold">{match.score?.scoreB ?? 0}</span>
                            </div>
                            {match.goals?.length > 0 && (
                              <div className="border-t border-slate-100 pt-1.5 mb-2 space-y-0.5">
                                {match.goals.map((goal: any) => (
                                  <div key={goal.id} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${goal.type === "penalty" ? "bg-amber-400" : goal.type === "own_goal" ? "bg-red-400" : "bg-green-400"}`} />
                                    <span className="font-medium text-slate-600">{goal.userName ?? goal.teamName}</span>
                                    <span>{goal.minute}&apos;</span>
                                    {goal.type === "penalty" && <span className="text-amber-500">(P)</span>}
                                    {goal.type === "own_goal" && <span className="text-red-400">(OG)</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => openEditDialog(match)}>
                                Status
                              </Button>
                              {match.score?.status === "live" && (
                                <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => openGoalDialog(match)}>
                                  Gol
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">Bracket belum dibuat</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Standings (Klasemen) */}
          {standings.length > 0 && (
            <div className="space-y-4">
              {(standings as any[]).map((group: any, gi: number) => (
                <Card key={gi}>
                  <CardContent className="p-0">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Klasemen — {group.roundName}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="w-12 text-center">#</TableHead>
                            <TableHead>Tim</TableHead>
                            <TableHead className="text-center w-10">P</TableHead>
                            <TableHead className="text-center w-10">W</TableHead>
                            <TableHead className="text-center w-10">D</TableHead>
                            <TableHead className="text-center w-10">L</TableHead>
                            <TableHead className="text-center">GF</TableHead>
                            <TableHead className="text-center">GA</TableHead>
                            <TableHead className="text-center">GD</TableHead>
                            <TableHead className="text-center font-bold">P</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(group.standings || []).map((s: any, i: number) => (
                            <TableRow key={s.teamId || `${group.roundName}-${i}`}>
                              <TableCell className="text-center font-bold">{i + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {s.teamImageUrl && <img src={s.teamImageUrl} className="w-6 h-6 rounded" />}
                                  <span className="text-sm font-medium">{s.teamName}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-xs">{s.played}</TableCell>
                              <TableCell className="text-center text-xs">{s.wins}</TableCell>
                              <TableCell className="text-center text-xs">{s.draws}</TableCell>
                              <TableCell className="text-center text-xs">{s.losses}</TableCell>
                              <TableCell className="text-center text-xs">{s.goalsFor}</TableCell>
                              <TableCell className="text-center text-xs">{s.goalsAgainst}</TableCell>
                              <TableCell className="text-center text-xs">{s.goalDifference}</TableCell>
                              <TableCell className="text-center text-sm font-bold">{s.points}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Top Scorers */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  Top Skor
                </h3>
              </div>
              <div className="p-4">
                {topScorers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Tim</TableHead>
                        <TableHead className="text-right">Gol</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topScorers.map((p, i) => (
                        <TableRow key={p.userId ?? `${p.eventTeamId}-${i}`}>
                          <TableCell className="font-bold">{i + 1}</TableCell>
                          <TableCell>{p.name || "-"}</TableCell>
                          <TableCell>{p.teamName}</TableCell>
                          <TableCell className="text-right font-bold">{p.goals}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-400">Belum ada data top skor</div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : !showGenerateForm ? (
        <div className="text-center py-12 text-gray-400">Pilih event terlebih dahulu</div>
      ) : null}

      {/* Generate Bracket Form */}
      {showGenerateForm && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generate Bracket</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowGenerateForm(false)}>✕ Tutup</Button>
            </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
              <div className="flex gap-2 flex-wrap">
                {(["knockout", "group", "group-knockout"] as const).map((mode) => (
                  <button key={mode}
                    onClick={() => setStageMode(mode)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold border-2 transition-all ${
                      stageMode === mode ? "border-sky-500 bg-sky-50 text-sky-700" : "border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    {mode === "group-knockout" ? "Group + KO" : mode === "knockout" ? "Knockout" : "Group"}
                  </button>
                ))}
              </div>
            </div>

            {stageMode === "knockout" ? (
              <>
                {rounds.map((r, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Round {r.round}</label>
                      <Input placeholder="Nama round" value={r.roundName}
                        onChange={(e) => { const u = [...rounds]; u[i].roundName = e.target.value; setRounds(u); }} />
                    </div>
                    <Button variant="ghost" className="text-red-500 mb-0.5"
                      onClick={() => setRounds(rounds.filter((_, j) => j !== i))} disabled={rounds.length <= 1}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full"
                  onClick={() => setRounds([...rounds, { round: rounds.length + 1, roundName: "" }])}>
                  <Plus className="w-4 h-4 mr-2" />Tambah Round
                </Button>
              </>
            ) : stageMode === "group-knockout" ? (
              <>
                <p className="text-xs text-gray-500">Group stage → Knockout. Pilih group, knockout rounds, dan jumlah tim lolos.</p>
                {eventTeams.length > 0 && <div className="text-xs text-slate-500">Total tim: <span className="font-semibold">{eventTeams.length}</span></div>}
                {groups.map((g, i) => (
                  <div key={i} className="space-y-2 p-3 border border-gray-200 rounded-lg">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1"><Input placeholder="Group A" value={g.roundName}
                        onChange={(e) => { const u = [...groups]; u[i].roundName = e.target.value; setGroups(u); }} /></div>
                      <Button variant="ghost" className="text-red-500 mb-0.5"
                        onClick={() => setGroups(groups.filter((_, j) => j !== i))} disabled={groups.length <= 1}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    {eventTeams.length > 0 && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Team ({g.teamIds.length} dipilih)</label>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {eventTeams.map((team) => {
                            const sel = g.teamIds.includes(team.id);
                            const used = groups.some((o, j) => j !== i && o.teamIds.includes(team.id));
                            return (
                              <button key={team.id} disabled={used}
                                onClick={() => { const u = [...groups]; sel ? u[i].teamIds = g.teamIds.filter((id) => id !== team.id) : u[i].teamIds = [...g.teamIds, team.id]; setGroups(u); }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${sel ? "bg-sky-50 border-sky-300 text-sky-700" : used ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed opacity-40" : "bg-white border-gray-200 text-gray-600 hover:border-sky-200"}`}>
                                {team.imageUrl && <img src={team.imageUrl} className="w-4 h-4 rounded" />}{team.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <Button variant="outline" className="w-full"
                  onClick={() => setGroups([...groups, { roundName: "", teamIds: [] }])}><Plus className="w-4 h-4 mr-2" />Tambah Group</Button>

                <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div><div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400">Knockout</span></div></div>
                {knockoutRounds.map((r, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Round {r.round}</label>
                      <Input placeholder="Nama round" value={r.roundName}
                        onChange={(e) => { const u = [...knockoutRounds]; u[i].roundName = e.target.value; setKnockoutRounds(u); }} />
                    </div>
                    <Button variant="ghost" className="text-red-500 mb-0.5"
                      onClick={() => setKnockoutRounds(knockoutRounds.filter((_, j) => j !== i))} disabled={knockoutRounds.length <= 1}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full"
                  onClick={() => setKnockoutRounds([...knockoutRounds, { round: knockoutRounds.length + 1, roundName: "" }])}><Plus className="w-4 h-4 mr-2" />Tambah Knockout Round</Button>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tim Lolos per Group</label>
                  <Input type="text" inputMode="numeric" maxLength={2} placeholder="2" value={advanceText}
                    onChange={(e) => { const raw = e.target.value.replace(/\D/g, "").slice(0, 2); setAdvanceText(raw); const v = parseInt(raw); if (raw === "") setAdvancePerGroup(2); else if (v >= 1 && v <= 4) setAdvancePerGroup(v); }} />
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500">Group stage — auto-generate round-robin matches. Pilih team untuk setiap group, atau kosongkan untuk distribusi acak.</p>
                {eventTeams.length > 0 && <div className="text-xs text-slate-500">Total tim: <span className="font-semibold">{eventTeams.length}</span></div>}
                {groups.map((g, i) => (
                  <div key={i} className="space-y-2 p-3 border border-gray-200 rounded-lg">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1"><Input placeholder="Group A" value={g.roundName}
                        onChange={(e) => { const u = [...groups]; u[i].roundName = e.target.value; setGroups(u); }} /></div>
                      <Button variant="ghost" className="text-red-500 mb-0.5"
                        onClick={() => setGroups(groups.filter((_, j) => j !== i))} disabled={groups.length <= 1}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Team ({g.teamIds.length} dipilih)</label>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {eventTeams.length === 0 ? <span className="text-xs text-gray-400">Pilih event dulu</span> :
                          eventTeams.map((team) => {
                            const sel = g.teamIds.includes(team.id);
                            const used = groups.some((o, j) => j !== i && o.teamIds.includes(team.id));
                            return (
                              <button key={team.id} disabled={used}
                                onClick={() => { const u = [...groups]; sel ? u[i].teamIds = g.teamIds.filter((id) => id !== team.id) : u[i].teamIds = [...g.teamIds, team.id]; setGroups(u); }}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${sel ? "bg-sky-50 border-sky-300 text-sky-700" : used ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed opacity-40" : "bg-white border-gray-200 text-gray-600 hover:border-sky-200 hover:bg-sky-50"}`}>
                                {team.imageUrl && <img src={team.imageUrl} className="w-4 h-4 rounded object-cover" />}{team.name}{used && <span className="text-[9px] text-gray-400">(di group lain)</span>}
                              </button>
                            );
                          })
                        }
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full"
                  onClick={() => setGroups([...groups, { roundName: "", teamIds: [] }])}><Plus className="w-4 h-4 mr-2" />Tambah Group</Button>
              </>
            )}

            {eventTeams.length > 0 && (
              <>
                <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div><div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400">Atur Jadwal Pertandingan (opsional)</span></div></div>
                <p className="text-xs text-gray-500">Atur sendiri jadwal pertandingan. Biarkan kosong untuk pengaturan otomatis.</p>
                <div className="text-xs text-slate-500">Total tim tersedia: <span className="font-semibold">{eventTeams.length}</span></div>
                {seedings.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-6">#{i + 1}</span>
                    <div className="flex-1 flex items-center gap-1.5">
                      <select value={s.teamAId} onChange={(e) => { const u = [...seedings]; u[i].teamAId = e.target.value; setSeedings(u); }}
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg">
                        <option value="">Pilih Tim</option>
                        {eventTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <span className="text-[10px] text-gray-400 font-bold">VS</span>
                      <select value={s.teamBId} onChange={(e) => { const u = [...seedings]; u[i].teamBId = e.target.value; setSeedings(u); }}
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg">
                        <option value="">Pilih Tim</option>
                        {eventTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <Button variant="ghost" className="text-red-500 flex-shrink-0" onClick={() => setSeedings(seedings.filter((_, j) => j !== i))} disabled={seedings.length <= 1}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => setSeedings([...seedings, { teamAId: "", teamBId: "" }])}><Plus className="w-4 h-4 mr-2" />Tambah Pertandingan</Button>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setShowGenerateForm(false)}>Batal</Button>
              <Button size="sm" className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs" onClick={handleGenerateBracket} disabled={submitting}>
                {submitting ? "Membuat..." : "Generate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Advance Preview Dialog */}
      <Dialog open={showAdvancePreview} onOpenChange={setShowAdvancePreview}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advance — Group ke Knockout</DialogTitle>
          </DialogHeader>
          {advanceData && (
            <div className="space-y-4 py-2">
              <div className="text-xs font-semibold text-gray-700 mb-2">Klasemen</div>
              {(Array.isArray(advanceData.standings) ? advanceData.standings : Array.isArray(advanceData) ? advanceData : []).map((group: any, gi: number) => (
                <div key={gi} className="border rounded-lg overflow-hidden mb-2">
                  <div className="bg-slate-100 px-3 py-1.5 text-xs font-semibold">{group.roundName}</div>
                  <div className="divide-y text-xs">
                    {(group.standings || group.teams || []).map((t: any, i: number) => (
                      <div key={t.teamId} className={`flex items-center justify-between px-3 py-1.5 ${i < 2 ? "bg-green-50" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-bold w-4">{i + 1}</span>
                          {t.teamImageUrl ? <img src={t.teamImageUrl} className="w-5 h-5 rounded" /> : null}
                          <span>{t.teamName}</span>
                        </div>
                        <span className="text-gray-500">{t.played}M · {t.wins}W · {t.draws}D · P: {t.points}</span>
                        {i < 2 && <span className="text-green-600 font-bold ml-1 text-[10px]">Lolos</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(advanceData.advance?.length > 0) && (
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">{manualAdvanceMode ? "Setup Manual — pilih tim:" : "Prediksi Otomatis:"}</div>
                  <div className="space-y-2">
                    {advanceData.advance.map((m: any, i: number) => {
                      const manual = manualAdvanceMatches[i];
                      const allTeams = (Array.isArray(advanceData.standings) ? advanceData.standings : []).flatMap((g: any) => g.standings ?? g.teams ?? []).map((t: any) => ({ teamId: t.teamId, teamName: t.teamName }));
                      return (
                        <div key={i} className="bg-slate-50 rounded-lg px-3 py-2">
                          <div className="text-[10px] text-gray-400 mb-1">{m.roundName} #{m.matchOrder}</div>
                          {manualAdvanceMode ? (
                            <div className="flex items-center gap-2">
                              <select className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded" value={manual?.teamAId ?? ""}
                                onChange={(e) => { const u = [...manualAdvanceMatches]; u[i] = { ...u[i], teamAId: e.target.value }; setManualAdvanceMatches(u); }}>
                                <option value="">--</option>
                                {allTeams.map((t: any) => <option key={t.teamId} value={t.teamId}>{t.teamName}</option>)}
                              </select>
                              <span className="text-xs text-gray-400">vs</span>
                              <select className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded" value={manual?.teamBId ?? ""}
                                onChange={(e) => { const u = [...manualAdvanceMatches]; u[i] = { ...u[i], teamBId: e.target.value }; setManualAdvanceMatches(u); }}>
                                <option value="">--</option>
                                {allTeams.map((t: any) => <option key={t.teamId} value={t.teamId}>{t.teamName}</option>)}
                              </select>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-xs">
                              <span>{m.teamA?.teamName ?? "?"} {m.teamA?.fromGroup ? `(${m.teamA.fromGroup})` : ""}</span>
                              <span className="text-gray-400">vs</span>
                              <span>{m.teamB?.teamName ?? "?"} {m.teamB?.fromGroup ? `(${m.teamB.fromGroup})` : ""}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2 pt-2">
                {manualAdvanceMode ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setManualAdvanceMode(false)} disabled={advancing}>Kembali</Button>
                    <Button size="sm" className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs" onClick={handleSaveManualAdvance} disabled={advancing}>
                      {advancing ? "Menyimpan..." : "Simpan Manual"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setShowAdvancePreview(false)}>Tutup</Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setManualAdvanceMode(true)}>Setup Manual</Button>
                    <Button size="sm" className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs" onClick={handleAutoAdvance} disabled={advancing}>
                      {advancing ? "Memproses..." : "Gunakan Auto"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Match Dialog */}
      <Dialog open={!!editMatch} onOpenChange={(open) => { if (!open) setEditMatch(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Status Pertandingan</DialogTitle>
          </DialogHeader>
          {editMatch && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                {editMatch.teamA?.name ?? "TBD"} vs {editMatch.teamB?.name ?? "TBD"}
              </p>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <select value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="finished">Finished</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setEditMatch(null)}>Batal</Button>
                <Button size="sm" className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs" onClick={handleUpdateMatch} disabled={submitting}>
                  {submitting ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Goal Dialog */}
      <Dialog open={!!goalMatch} onOpenChange={(open) => { if (!open) setGoalMatch(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Gol</DialogTitle>
          </DialogHeader>
          {goalMatch && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                {goalMatch.teamA?.name ?? "TBD"} vs {goalMatch.teamB?.name ?? "TBD"}
              </p>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Pemain Pencetak Gol</label>
                <select
                  value={`${goalForm.eventTeamId}||${goalForm.userId}||${goalForm.name}`}
                  onChange={(e) => {
                    const [teamId, userId, name] = e.target.value.split("||");
                    setGoalForm({ ...goalForm, eventTeamId: teamId, userId, name });
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="">Pilih pemain</option>
                  {matchPlayers ? (
                    <>
                      {matchPlayers.teamA?.players?.length > 0 && (
                        <optgroup label={matchPlayers.teamA.teamName}>
                          {matchPlayers.teamA.players.map((p: any) => (
                            <option key={p.userId || p.name} value={`${matchPlayers.teamA.teamId}||${p.userId || ""}||${p.name}`}>
                              {p.name}{p.isSubstitute ? " (Cadangan)" : ""}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {matchPlayers.teamB?.players?.length > 0 && (
                        <optgroup label={matchPlayers.teamB.teamName}>
                          {matchPlayers.teamB.players.map((p: any) => (
                            <option key={p.userId || p.name} value={`${matchPlayers.teamB.teamId}||${p.userId || ""}||${p.name}`}>
                              {p.name}{p.isSubstitute ? " (Cadangan)" : ""}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  ) : (
                    <option disabled>Memuat pemain...</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Jenis Gol</label>
                <select value={goalForm.type}
                  onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
                  <option value="goal">Goal</option>
                  <option value="penalty">Penalty</option>
                  <option value="own_goal">Own Goal</option>
                </select>
              </div>

              {goalMatch.goals?.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 mb-2">Gol saat ini:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {goalMatch.goals.map((g) => (
                      <div key={g.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded">
                        <span>{g.teamName} — {g.userName ?? "?"} ({g.minute}&apos;)</span>
                        <Button size="sm" variant="ghost" className="text-red-500 h-auto p-1"
                          onClick={() => setShowDeleteGoal({ matchId: goalMatch.id, goalId: g.id })}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setGoalMatch(null)}>Batal</Button>
                <Button size="sm" className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs" onClick={handleAddGoal} disabled={submitting}>
                  {submitting ? "Menyimpan..." : "Tambah Gol"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => !submitting && setShowDeleteConfirm(false)}
        onConfirm={handleDeleteBracket}
        title="Hapus Bracket"
        message="Hapus seluruh bracket untuk event ini? Semua data match, score, dan gol akan dihapus."
        type="danger"
        confirmText={submitting ? "Menghapus..." : "Hapus"}
        cancelText="Batal"
        isLoading={submitting}
      />

      <ConfirmationModal
        isOpen={!!showDeleteGoal}
        onClose={() => !submitting && setShowDeleteGoal(null)}
        onConfirm={handleDeleteGoal}
        title="Hapus Gol"
        message="Hapus data gol ini?"
        type="danger"
        confirmText={submitting ? "Menghapus..." : "Hapus"}
        cancelText="Batal"
        isLoading={submitting}
      />
    </div>
  );
}
