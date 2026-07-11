"use client";

import React, { useState, useCallback, useRef, type KeyboardEvent } from "react";
import { Search, UserPlus, Clock, CheckCircle } from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent } from "../atoms/Card";
import Input from "../atoms/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../atoms/Table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../atoms/Dialog";
import { useNotifications } from "./NotificationContainer";
import { adminService } from "@/utils/admin";
import type { NonMemberUser, CreateFreeMembershipData } from "@/types/admin";

const TableRowSkeleton = () => (
  <TableRow>
    {[1, 2, 3, 4].map((i) => (
      <TableCell key={i}>
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </TableCell>
    ))}
  </TableRow>
);

const DURATION_OPTIONS = [
  { value: 3, label: "3" },
  { value: 6, label: "6" },
  { value: 12, label: "12" },
];

export default function MembershipAccessTab() {
  const [searchTerm, setSearchTerm] = useState("");

  const [nonMembers, setNonMembers] = useState<NonMemberUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isFetchingRef = useRef(false);

  const [targetUser, setTargetUser] = useState<NonMemberUser | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(3);
  const [customDuration, setCustomDuration] = useState("");
  const [durationError, setDurationError] = useState("");
  const [result, setResult] = useState<CreateFreeMembershipData | null>(null);

  const { showSuccess, showError } = useNotifications();

  const fetchNonMembers = useCallback(async (search: string) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const response = await adminService.searchNonMembers(search || undefined);
      setNonMembers(response?.data ?? []);
    } catch (error) {
      console.error("Error fetching non-members:", error);
      showError("Error", "Gagal memuat data");
      setNonMembers([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [showError]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setNonMembers([]);
      return;
    }
    fetchNonMembers(searchTerm.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleGiveAccess = (user: NonMemberUser) => {
    setTargetUser(user);
    setSelectedDuration(3);
    setCustomDuration("");
    setDurationError("");
    setResult(null);
  };

  const closeDialog = () => {
    setTargetUser(null);
    setResult(null);
    setCustomDuration("");
    setDurationError("");
  };

  const handleDurationPreset = (value: number) => {
    setSelectedDuration(value);
    setCustomDuration("");
    setDurationError("");
  };

  const handleCustomDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setCustomDuration(raw);
    if (raw === "") {
      setSelectedDuration(3);
      setDurationError("");
    } else {
      const num = parseInt(raw, 10);
      if (num < 1) {
        setDurationError("Minimal 1 bulan");
      } else if (num > 12) {
        setDurationError("Maksimal 12 bulan");
      } else {
        setSelectedDuration(num);
        setDurationError("");
      }
    }
  };

  const handleConfirm = async () => {
    if (!targetUser) return;
    setSubmitting(true);
    try {
      const response = await adminService.createFreeMembership({
        userId: targetUser.id,
        durationMonths: selectedDuration,
      });
      setResult(response.data);
      showSuccess("Berhasil", response.message || "Membership berhasil diberikan");
    } catch (error: any) {
      console.error("Error creating membership:", error);
      showError("Error", error?.message || "Gagal memberikan akses membership");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-1 sm:mb-2">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Akses Membership</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Berikan akses membership gratis kepada pengguna non-member
        </p>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 mt-2 sm:mt-4">
            <div className="relative flex-1" onKeyDown={handleKeyDown}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari nama, email, atau telepon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm w-full"
              />
            </div>
            <Button
              variant="primary"
              onClick={handleSearch}
              disabled={loading}
              className="w-full sm:w-auto justify-center"
            >
              <Search className="w-4 h-4 mr-2" />
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-900 text-sm">Nama</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-sm hidden sm:table-cell">Email</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-sm hidden sm:table-cell">Telepon</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-sm text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
                ) : nonMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500 text-sm">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  nonMembers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-sm">{user.name}</TableCell>
                      <TableCell className="text-gray-600 text-sm hidden sm:table-cell">{user.email}</TableCell>
                      <TableCell className="text-gray-600 text-sm hidden sm:table-cell">{user.phone}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleGiveAccess(user)}
                          disabled={submitting}
                          className="text-xs whitespace-nowrap"
                        >
                          <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden xs:inline">Beri Akses</span>
                          <span className="xs:hidden">Beri</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!targetUser} onOpenChange={(open) => { if (!open && !submitting) closeDialog(); }}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {result ? "Akses Berhasil Diberikan" : "Konfirmasi Akses Membership"}
            </DialogTitle>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {result
                ? `Membership telah diberikan kepada ${targetUser?.name}`
                : `Beri akses membership kepada ${targetUser?.name}`}
            </p>
          </DialogHeader>

          {result ? (
            <div className="space-y-4 py-3 sm:py-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 sm:p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    Membership berhasil diaktifkan
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Berlaku hingga {new Date(result.validUntil).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <Button variant="primary" className="w-full justify-center" onClick={closeDialog}>
                Tutup
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-3 sm:py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <UserPlus className="w-4 h-4" />
                  <span className="truncate">{targetUser?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Durasi membership:</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleDurationPreset(opt.value)}
                    className={`py-3 px-4 rounded-lg text-sm font-semibold border-2 transition-all ${
                      selectedDuration === opt.value && customDuration === ""
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {opt.label}
                    <span className="block text-[10px] font-normal text-gray-400">Bulan</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400">atau</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="Kustom"
                    value={customDuration}
                    onChange={handleCustomDurationChange}
                    error={durationError}
                    className="text-sm"
                  />
                </div>
                <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">Bulan</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 justify-center"
                  onClick={closeDialog}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 justify-center"
                  onClick={handleConfirm}
                  disabled={submitting || !!durationError}
                >
                  {submitting ? "Memproses..." : "Konfirmasi"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
