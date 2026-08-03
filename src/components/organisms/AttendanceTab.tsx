"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Search,
  UserCheck,
  UserX,
  CheckCircle,
  AlertCircle,
  QrCode,
  User,
  Calendar,
  Users,
  ArrowLeft,
  Pencil,
  Save,
  X,
} from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent } from "../atoms/Card";
import Input from "../atoms/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../atoms/Dialog";
import Badge from "../atoms/Badge";
import { useNotifications } from "./NotificationContainer";
import { adminService } from "@/utils/admin";
import { apiClient } from "@/utils/api";
import { formatDate } from "../../lib/helper";
import type {
  AttendanceHistoryData,
  ScanBookingResponse,
  ScanLineupData,
} from "@/types/admin";
import type { ScheduleOverview } from "@/types/schedule";

export default function AttendanceTab() {
  const { showSuccess, showError } = useNotifications();

  // Schedule list state
  const [schedules, setSchedules] = useState<ScheduleOverview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Selected schedule
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [selectedScheduleName, setSelectedScheduleName] = useState("");

  // History
  const [history, setHistory] = useState<AttendanceHistoryData | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Complete dialog
  const [showComplete, setShowComplete] = useState(false);
  const [penanggungJawab, setPenanggungJawab] = useState("");
  const [completeResult, setCompleteResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Scan modal (inside Kehadiran)
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanPlayer, setScanPlayer] = useState<any>(null);
  const [scanBookId, setScanBookId] = useState("");
  const [scanResult, setScanResult] = useState<
    ScanBookingResponse["data"] | null
  >(null);
  const [scanError, setScanError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [scanJerseyData, setScanJerseyData] = useState<
    Record<string, { jerseyNumber: string; jerseySize: string }>
  >({});

  // Auto-load schedules on mount
  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/api/v1/matches/schedules-recent");
      const result = Array.isArray(res) ? res : (res?.data ?? []);
      setSchedules(result);
    } catch {
      showError("Error", "Gagal memuat daftar jadwal");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const filteredSchedules = useMemo(() => {
    if (!searchTerm) return schedules;
    const q = searchTerm.toLowerCase();
    return schedules.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        formatDate(s.date).toLowerCase().includes(q),
    );
  }, [schedules, searchTerm]);

  // Schedule selection
  const selectSchedule = (id: string, name: string) => {
    setSelectedScheduleId(id);
    setSelectedScheduleName(name);
    loadHistory(id);
  };

  const backToList = () => {
    setSelectedScheduleId("");
    setSelectedScheduleName("");
  };

  const loadHistory = useCallback(
    async (scheduleId: string) => {
      setLoadingHistory(true);
      try {
        const res = await adminService.getAttendanceHistory(scheduleId);
        setHistory(res?.data ?? null);
      } catch {
        showError("Error", "Gagal memuat riwayat");
      } finally {
        setLoadingHistory(false);
      }
    },
    [showError],
  );

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

  const handleScan = async () => {
    if (!scanBookId.trim()) return;
    setScanning(true);
    setScanError("");
    setScanResult(null);
    setCheckinSuccess(false);
    try {
      const res = await adminService.scanAttendance(scanBookId.trim());
      if (res?.status && res?.data) {
        setScanResult(res.data);
      } else {
        setScanError(res?.message || "Booking tidak ditemukan");
      }
    } catch (err: any) {
      setScanError(err?.message || "Gagal scan booking");
    } finally {
      setScanning(false);
    }
  };

  const handleCheckin = async () => {
    if (!scanResult?.bookId) return;
    setCheckingIn(true);
    try {
      const res = await adminService.checkinAttendance(scanResult.bookId);
      if (res?.status) {
        setCheckinSuccess(true);
        showSuccess(
          "Berhasil",
          `Checkin berhasil (${res.data?.updatedCount ?? 0} pemain)`,
        );
        if (scanPlayer) {
          const jersey = scanJerseyData[scanPlayer.lineupId] || {
            jerseyNumber: "",
            jerseySize: "",
          };
          const payload: any = {
            lineupId: scanPlayer.lineupId,
            isPresent: true,
            jerseyNumber: jersey.jerseyNumber,
            jerseySize: jersey.jerseySize,
          };
          await adminService.updateAttendance(scanPlayer.lineupId, payload);
        } else {
          const lineupPayloads = (scanResult.lineups || []).map(
            (lineup: ScanLineupData) => {
              const jersey = scanJerseyData[lineup.lineupId] || {
                jerseyNumber: "",
                jerseySize: "",
              };
              return {
                lineupId: lineup.lineupId,
                jerseyNumber: jersey.jerseyNumber,
                jerseySize: jersey.jerseySize,
              };
            },
          );
          await adminService.bulkUpdateAttendance(lineupPayloads);
        }
        loadHistory(selectedScheduleId);
      } else {
        showError("Error", res?.message || "Gagal checkin");
      }
    } catch (err: any) {
      showError("Error", err?.message || "Gagal checkin");
    } finally {
      setCheckingIn(false);
    }
  };

  const openScanModal = (player: any | null = null) => {
    setScanPlayer(player);
    setScanBookId("");
    setScanResult(null);
    setScanError("");
    setCheckinSuccess(false);
    setScanJerseyData({});
    setShowScanModal(true);
  };

  // --- SCHEDULE LIST VIEW (Jadwal Match style) ---
  if (!selectedScheduleId) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Kehadiran Lineup
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Kelola kehadiran pemain per jadwal
          </p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari nama atau tanggal jadwal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
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
                Tidak ada jadwal ditemukan
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSchedules.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectSchedule(s.id, s.name)}
                    className="w-full flex items-center gap-2 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:border-sky-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {s.name}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {formatDate(s.date)} &bull; {s.time}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge
                        variant="outline"
                        className="hidden sm:inline-flex"
                      >
                        <Users className="w-3 h-3 mr-1" />
                        {s.team} tim
                      </Badge>
                      <span className="text-sky-600 text-xs sm:text-sm font-medium whitespace-nowrap">
                        Kehadiran →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- ATTENDANCE VIEW ---
  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={backToList}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
            {selectedScheduleName}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!history?.penanggungJawab && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openScanModal()}
              >
                <QrCode className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Scan QR</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowComplete(true);
                  setCompleteResult(null);
                  setPenanggungJawab("");
                }}
              >
                <CheckCircle className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Selesaikan</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* History */}
      {loadingHistory ? (
        <div className="text-center py-8 text-gray-500">Memuat riwayat...</div>
      ) : history ? (
        <div className="space-y-4">
          {/* Stats Summary */}
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-500">
                  {new Date(history.date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  • {history.time} WIB
                </p>
                {history.penanggungJawab && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    PJ: {history.penanggungJawab}
                  </p>
                )}
              </div>
              {history.penanggungJawab && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 flex-shrink-0">
                  Selesai
                </span>
              )}
            </div>
            <div className="flex gap-3 sm:gap-6">
              {[
                {
                  label: "Hadir",
                  value: history.attendance.hadir,
                  color: "text-green-600 bg-green-50",
                },
                {
                  label: "Tidak Hadir",
                  value: history.attendance.tidakHadir,
                  color: "text-red-500 bg-red-50",
                },
                {
                  label: "Total",
                  value: history.attendance.totalPlayers,
                  color: "text-slate-600 bg-slate-50",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`flex-1 rounded-lg px-3 py-2 text-center ${s.color}`}
                >
                  <p className="text-lg sm:text-xl font-bold">{s.value}</p>
                  <p className="text-[10px] sm:text-xs font-medium opacity-70">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Team tables */}
          {history.lineup.map((team) => (
            <div
              key={team.teamName}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="px-4 py-2.5 border-b font-semibold text-sm text-gray-700 bg-slate-50">
                {team.teamName}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 py-2 font-medium text-gray-500">
                        Nama
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-gray-500 w-16">
                        Posisi
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-gray-500 w-20">
                        Jersey
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-gray-500">
                        Hadir
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {team.gk && (
                      <HistoryPlayerRow
                        player={team.gk}
                        onUpdate={() => loadHistory(selectedScheduleId)}
                      />
                    )}
                    {team.players.map((p, i) => (
                      <HistoryPlayerRow
                        key={i}
                        player={p}
                        onUpdate={() => loadHistory(selectedScheduleId)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Scan QR Modal */}
      <ScanQrModal
        open={showScanModal}
        scanPlayer={scanPlayer}
        scanBookId={scanBookId}
        setScanBookId={setScanBookId}
        scanning={scanning}
        scanError={scanError}
        scanResult={scanResult}
        checkinSuccess={checkinSuccess}
        checkingIn={checkingIn}
        scanJerseyData={scanJerseyData}
        setScanJerseyData={setScanJerseyData}
        onScan={handleScan}
        onCheckin={handleCheckin}
        onClose={() => {
          setShowScanModal(false);
        }}
      />

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
                  <p className="text-sm font-semibold text-emerald-800">
                    Schedule selesai
                  </p>
                  <div className="text-xs text-emerald-600 mt-1 space-y-0.5">
                    <p>Total: {completeResult.total} pemain</p>
                    <p>Hadir: {completeResult.hadir}</p>
                    <p>Tidak Hadir: {completeResult.tidakHadir}</p>
                  </div>
                </div>
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setShowComplete(false)}
              >
                Tutup
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-sm text-amber-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  Schedule akan ditandai selesai dan tidak bisa diedit kembali.
                </span>
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
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowComplete(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleCompleteSchedule}
                  disabled={submitting}
                >
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

import { Html5Qrcode } from "html5-qrcode";

function ScanQrModal({
  open,
  scanPlayer,
  scanBookId,
  setScanBookId,
  scanning,
  scanError,
  scanResult,
  checkinSuccess,
  checkingIn,
  scanJerseyData,
  setScanJerseyData,
  onScan,
  onCheckin,
  onClose,
}: {
  open: boolean;
  scanPlayer: any;
  scanBookId: string;
  setScanBookId: (v: string) => void;
  scanning: boolean;
  scanError: string;
  scanResult: any;
  checkinSuccess: boolean;
  checkingIn: boolean;
  scanJerseyData: Record<string, { jerseyNumber: string; jerseySize: string }>;
  setScanJerseyData: (
    v: Record<string, { jerseyNumber: string; jerseySize: string }>,
  ) => void;
  onScan: () => void;
  onCheckin: () => void;
  onClose: () => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerStartedRef = useRef(false);
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    if (!open) {
      if (scannerRef.current && scannerStartedRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerStartedRef.current = false;
            scannerRef.current = null;
          })
          .catch(() => {});
      } else {
        scannerRef.current = null;
      }
      setShowManual(false);
      setCameraError("");
      setCameraLoading(false);
      setCameraActive(false);
    }
  }, [open]);

  const startCamera = async () => {
    if (!qrContainerRef.current) {
      setCameraError("Gagal mengakses kamera. Gunakan input manual.");
      setShowManual(true);
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setCameraError(
        "Kamera hanya bisa diakses melalui HTTPS. Gunakan input manual.",
      );
      setShowManual(true);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Browser tidak mendukung akses kamera. Gunakan input manual.",
      );
      setShowManual(true);
      return;
    }

    setCameraLoading(true);
    setCameraError("");

    const TIMEOUT_MS = 15000;
    const runWithTimeout = <T,>(p: Promise<T>) =>
      Promise.race<T>([
        p,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), TIMEOUT_MS),
        ),
      ]);

    try {
      const devices = await runWithTimeout(Html5Qrcode.getCameras());

      if (!devices || devices.length === 0) {
        throw new Error("NO_CAMERA");
      }

      const backCam = devices.find((d) =>
        /back|rear|environment/i.test(d.label),
      );
      const chosenId = backCam ? backCam.id : devices[devices.length - 1].id;

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await runWithTimeout(
        scanner.start(
          chosenId,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (scannerStartedRef.current) {
              scanner
                .stop()
                .then(() => {
                  scannerStartedRef.current = false;
                  scannerRef.current = null;
                })
                .catch(() => {});
            }
            setScanBookId(decodedText);
            setTimeout(() => onScan(), 100);
          },
          () => {},
        ),
      );

      scannerStartedRef.current = true;
      setCameraLoading(false);
      setCameraActive(true);
    } catch (e: any) {
      setCameraLoading(false);
      scannerRef.current = null;

      if (e.message === "TIMEOUT") {
        setCameraError("Kamera tidak merespons. Coba input manual.");
      } else if (
        e.name === "NotAllowedError" ||
        /permission/i.test(e.message || "")
      ) {
        setCameraError(
          "Izin kamera ditolak. Buka pengaturan situs di browser (ikon gembok di address bar) lalu izinkan akses kamera, kemudian coba lagi.",
        );
      } else if (e.name === "NotFoundError" || e.message === "NO_CAMERA") {
        setCameraError("Tidak ada kamera terdeteksi di perangkat ini.");
      } else if (e.name === "NotReadableError") {
        setCameraError(
          "Kamera sedang dipakai aplikasi lain. Tutup aplikasi lain lalu coba lagi.",
        );
      } else if (e.name === "OverconstrainedError") {
        setCameraError("Kamera tidak mendukung konfigurasi yang diminta.");
      } else {
        setCameraError(
          `Kamera tidak tersedia (${e.message || "unknown"}). Gunakan input manual.`,
        );
      }
      setShowManual(true);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR / Booking ID</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-500">
            {scanPlayer ? (
              <>
                Pemain:{" "}
                <span className="font-medium text-gray-800">
                  {scanPlayer.name || "—"}
                </span>
              </>
            ) : (
              "Scan QR code pemain"
            )}
          </p>

          {!showManual ? (
            <div>
              {!cameraActive && !cameraLoading && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-sky-500" />
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Klik tombol di bawah untuk mengaktifkan kamera
                  </p>
                  <Button variant="primary" onClick={startCamera}>
                    Aktifkan Kamera
                  </Button>
                </div>
              )}

              {cameraLoading && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-600">
                    Mengaktifkan kamera...
                  </p>
                </div>
              )}

              <div
                id="qr-reader"
                ref={qrContainerRef}
                className="w-full max-w-xs mx-auto rounded-lg overflow-hidden bg-black"
                style={{ minHeight: 250 }}
              />

              {cameraActive && (
                <p className="text-center text-xs text-gray-400 mt-2">
                  Arahkan kamera ke QR code
                </p>
              )}

              {cameraError && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">{cameraError}</p>
                </div>
              )}
              <button
                onClick={() => {
                  if (scannerRef.current && scannerStartedRef.current) {
                    scannerRef.current
                      .stop()
                      .then(() => {
                        scannerStartedRef.current = false;
                        scannerRef.current = null;
                      })
                      .catch(() => {});
                  } else {
                    scannerRef.current = null;
                  }
                  setShowManual(true);
                }}
                className="mt-3 text-xs text-sky-600 hover:text-sky-800 text-center w-full"
              >
                Input Manual →
              </button>
            </div>
          ) : (
            <div>
              <div
                className="flex flex-col sm:flex-row gap-3"
                onKeyDown={(e) => e.key === "Enter" && onScan()}
              >
                <div className="relative flex-1">
                  <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Masukkan Book ID..."
                    value={scanBookId}
                    onChange={(e) => setScanBookId(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={onScan}
                  disabled={scanning || !scanBookId.trim()}
                >
                  {scanning ? "Memindai..." : "Cari"}
                </Button>
              </div>
              <button
                onClick={() => setShowManual(false)}
                className="mt-2 text-xs text-sky-600 hover:text-sky-800 text-center w-full"
              >
                ← Scan QR
              </button>
            </div>
          )}

          {scanError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{scanError}</p>
            </div>
          )}

          {scanResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {scanResult.customerName}
                  </h3>
                  <p className="text-xs text-gray-500">{scanResult.phone}</p>
                </div>
              </div>

              {checkinSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Checkin berhasil!
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      Semua pemain telah dikonfirmasi hadir.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">
                        Schedule
                      </p>
                      <p className="font-medium text-gray-800">
                        {scanResult.scheduleName}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">
                        Tanggal
                      </p>
                      <p className="font-medium text-gray-800">
                        {new Date(scanResult.date).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Waktu</p>
                      <p className="font-medium text-gray-800">
                        {scanResult.time}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Venue</p>
                      <p className="font-medium text-gray-800">
                        {scanResult.venue}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2 col-span-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Tim</p>
                      <p className="font-medium text-gray-800">
                        {scanResult.teamName}
                      </p>
                    </div>
                  </div>

                  {/* Lineups list */}
                  {scanResult.lineups && scanResult.lineups.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-400 font-medium">
                        Pemain ({scanResult.lineups.length})
                      </p>
                      <div className="max-h-60 overflow-y-auto space-y-1.5">
                        {scanResult.lineups.map((lineup: ScanLineupData) => {
                          const jersey = scanJerseyData[lineup.lineupId] || {
                            jerseyNumber: "",
                            jerseySize: "",
                          };
                          return (
                            <div
                              key={lineup.lineupId}
                              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100"
                            >
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-12 text-center flex-shrink-0 ${
                                  lineup.position === "GK"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-50 text-blue-600"
                                }`}
                              >
                                {lineup.position}
                              </span>
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <input
                                  type="text"
                                  maxLength={5}
                                  placeholder="No"
                                  value={jersey.jerseyNumber}
                                  onChange={(e) =>
                                    setScanJerseyData({
                                      ...scanJerseyData,
                                      [lineup.lineupId]: {
                                        ...jersey,
                                        jerseyNumber: e.target.value,
                                      },
                                    })
                                  }
                                  className="w-14 px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-sky-500"
                                />
                                <input
                                  type="text"
                                  maxLength={5}
                                  placeholder="Size"
                                  value={jersey.jerseySize}
                                  onChange={(e) =>
                                    setScanJerseyData({
                                      ...scanJerseyData,
                                      [lineup.lineupId]: {
                                        ...jersey,
                                        jerseySize: e.target.value,
                                      },
                                    })
                                  }
                                  className="w-14 px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-sky-500"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={onCheckin}
                    disabled={checkingIn}
                  >
                    {checkingIn ? "Memproses..." : "Konfirmasi Hadir"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HistoryPlayerRow({
  player,
  onUpdate,
}: {
  player: any;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editNum, setEditNum] = useState(player.jerseyNumber || "");
  const [editSize, setEditSize] = useState(player.jerseySize || "");
  const [editPresent, setEditPresent] = useState(player.isPresent);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!player.lineupId) return;
    setSaving(true);
    try {
      await adminService.updateAttendance(player.lineupId, {
        lineupId: player.lineupId,
        jerseyNumber: editNum,
        jerseySize: editSize,
        isPresent: editPresent,
      });
      onUpdate();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <tr>
        <td className="px-4 py-2 text-sm">{player.name || "—"}</td>
        <td className="px-4 py-2 text-xs text-gray-500">{player.position}</td>
        <td className="px-4 py-2">
          <div className="flex flex-col gap-1">
            <input
              type="text"
              maxLength={5}
              placeholder="No"
              value={editNum}
              onChange={(e) => setEditNum(e.target.value)}
              className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-sky-500"
            />
            <input
              type="text"
              maxLength={5}
              placeholder="Size"
              value={editSize}
              onChange={(e) => setEditSize(e.target.value)}
              className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1 flex-wrap">
            <select
              value={editPresent ? "true" : "false"}
              onChange={(e) => setEditPresent(e.target.value === "true")}
              className="text-xs border border-gray-300 rounded px-1 py-0.5"
            >
              <option value="true">Hadir</option>
              <option value="false">Tidak</option>
            </select>
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1 text-green-600 hover:text-green-800"
              title="Simpan"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Batal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50/50">
      <td className="px-4 py-2.5 text-sm font-medium text-gray-800 truncate max-w-[120px]">
        {player.name || "—"}
      </td>
      <td className="px-4 py-2.5 text-xs text-gray-500">{player.position}</td>
      <td className="px-4 py-2.5 text-xs text-gray-500">
        {player.jerseyNumber ? `#${player.jerseyNumber}` : "—"}
        {player.jerseySize ? ` (${player.jerseySize})` : ""}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          {player.isPresent ? (
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-green-600 font-medium">
              <UserCheck className="w-3 h-3" /> Hadir
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-red-500 font-medium">
              <UserX className="w-3 h-3" /> Tidak
            </span>
          )}
          {player.isPresent && (
            <button
              onClick={() => {
                setEditNum(player.jerseyNumber || "");
                setEditSize(player.jerseySize || "");
                setEditPresent(player.isPresent);
                setEditing(true);
              }}
              className="p-0.5 text-gray-400 hover:text-sky-600 transition-colors flex-shrink-0"
              title="Edit"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
