"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Save,
  Users,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import Button from "../atoms/Button";
import { Card, CardContent } from "../atoms/Card";
import Input from "../atoms/Input";
import Badge from "../atoms/Badge";
import Pagination from "../atoms/Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../atoms/Dialog";
import ConfirmationModal from "../molecules/ConfirmationModal";
import ImageUpload from "../atoms/ImageUpload";
import { useNotifications } from "./NotificationContainer";
import { adminService } from "@/utils/admin";
import type {
  MasterTeam,
  MasterTeamCreatePayload,
  MasterTeamUpdatePayload,
} from "@/types/schedule";

const PRESET_COLORS = [
  "#EF4444",
  "#F8F9FA",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#F97316",
  "#06B6D4",
  "#84CC16",
  "#6B7280",
  "#000000",
];

interface TeamFormState {
  name: string;
  hexColor: string;
  imageFile: File | null;
  existingImageUrl: string | null;
  removeImage: boolean;
}

const emptyForm: TeamFormState = {
  name: "",
  hexColor: "#EF4444",
  imageFile: null,
  existingImageUrl: null,
  removeImage: false,
};

export default function LineupTeamManagement() {
  const { showSuccess, showError } = useNotifications();

  const [teams, setTeams] = useState<MasterTeam[]>([]);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(false);

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<MasterTeam | null>(null);
  const [teamForm, setTeamForm] = useState<TeamFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
  }>({});

  const [deleteTarget, setDeleteTarget] = useState<MasterTeam | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTeams = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await adminService.getMasterTeams(
        debouncedSearch || undefined,
        skip,
        itemsPerPage,
      );
      setTeams(response?.data?.data ?? []);
      setTotal(response?.data?.meta?.total ?? 0);
    } catch (error: any) {
      console.error("Error fetching master teams:", error);
      showError("Error", error?.message || "Gagal memuat daftar team");
      setTeams([]);
      setTotal(0);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [currentPage, debouncedSearch, showError]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (mountedRef.current) {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTeams();
    setRefreshing(false);
    showSuccess("Data team berhasil diperbarui");
  };

  const openCreateDialog = () => {
    setEditingTeam(null);
    setTeamForm(emptyForm);
    setFormErrors({});
    setShowFormDialog(true);
  };

  const openEditDialog = (team: MasterTeam) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      hexColor: team.hexColor || "#EF4444",
      imageFile: null,
      existingImageUrl: team.image || null,
      removeImage: false,
    });
    setFormErrors({});
    setShowFormDialog(true);
  };

  const closeFormDialog = () => {
    if (submitting) return;
    setShowFormDialog(false);
    setEditingTeam(null);
    setTeamForm(emptyForm);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: { name?: string } = {};
    if (!teamForm.name.trim()) {
      errors.name = "Nama team wajib diisi";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editingTeam) {
        const updatePayload: MasterTeamUpdatePayload = {
          name: teamForm.name.trim(),
          hexColor: teamForm.hexColor,
          image: teamForm.removeImage
            ? null
            : teamForm.imageFile
              ? teamForm.imageFile
              : teamForm.existingImageUrl,
        };
        await adminService.updateMasterTeam(editingTeam.id, updatePayload);
        showSuccess("Team berhasil diupdate");
      } else {
        const createPayload: MasterTeamCreatePayload = {
          name: teamForm.name.trim(),
          hexColor: teamForm.hexColor,
          image: teamForm.imageFile,
        };
        await adminService.createMasterTeam(createPayload);
        showSuccess("Team berhasil dibuat");
      }
      closeFormDialog();
      await fetchTeams();
    } catch (error: any) {
      console.error("Error saving team:", error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Terjadi kesalahan";
      showError("Gagal menyimpan", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteMasterTeam(deleteTarget.id);
      showSuccess("Team berhasil dihapus");
      setDeleteTarget(null);
      await fetchTeams();
    } catch (error: any) {
      console.error("Error deleting team:", error);
      showError("Gagal menghapus", error?.message || "Terjadi kesalahan");
    } finally {
      setDeleting(false);
    }
  };

  // Determine preview source
  const getPreviewSrc = (): string => {
    if (teamForm.imageFile) {
      return URL.createObjectURL(teamForm.imageFile);
    }
    if (teamForm.existingImageUrl && !teamForm.removeImage) {
      return teamForm.existingImageUrl;
    }
    return "";
  };

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Lineup Team Management
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Kelola master team (nama, warna, logo) yang dipakai di jadwal.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={openCreateDialog}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Team
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari nama team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-3">
                {debouncedSearch
                  ? "Tidak ada team yang cocok dengan pencarian"
                  : "Belum ada team"}
              </p>
              {!debouncedSearch && (
                <Button
                  onClick={openCreateDialog}
                  className="bg-sky-600 hover:bg-sky-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Team Pertama
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold border border-gray-200 flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: t.hexColor || "#6B7280" }}
                    >
                      {t.image ? (
                        <img
                          src={t.image}
                          alt={t.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        t.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="truncate">{t.name}</span>
                        {t.isActive ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                        <span className="font-mono">{t.hexColor || "—"}</span>
                        <span>
                          {new Date(t.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    <span title="Edit">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(t)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </span>
                    <span title="Hapus">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(t)}
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

          {totalPages > 1 && (
            <div className="p-4 border-t">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog (Create / Edit) */}
      <Dialog
        open={showFormDialog}
        onOpenChange={(open) => !open && closeFormDialog()}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? "Edit Team" : "Tambah Team Baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Live preview card */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold border border-gray-200 overflow-hidden"
                style={{ backgroundColor: teamForm.hexColor || "#6B7280" }}
              >
                {(() => {
                  const src = getPreviewSrc();
                  if (src) {
                    return (
                      <img
                        src={src}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    );
                  }
                  return teamForm.name.charAt(0).toUpperCase() || "?";
                })()}
              </div>
              <div className="text-sm text-gray-600 flex-1">
                <div className="font-medium text-gray-900">Preview</div>
                <div className="text-xs">
                  Preview ini yang akan tampil di list jadwal player
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nama Team <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={teamForm.name}
                onChange={(e) =>
                  setTeamForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Contoh: Tim Merah"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  formErrors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Warna
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={teamForm.hexColor}
                  onChange={(e) =>
                    setTeamForm((p) => ({
                      ...p,
                      hexColor: e.target.value,
                    }))
                  }
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={teamForm.hexColor}
                  onChange={(e) =>
                    setTeamForm((p) => ({
                      ...p,
                      hexColor: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      setTeamForm((p) => ({ ...p, hexColor: c }))
                    }
                    className={`w-6 h-6 rounded border ${
                      teamForm.hexColor.toLowerCase() === c.toLowerCase()
                        ? "border-gray-900 ring-2 ring-offset-1 ring-gray-400"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <ImageIcon className="w-4 h-4" />
                Logo Team (opsional)
              </label>

              {editingTeam && teamForm.existingImageUrl && !teamForm.imageFile && !teamForm.removeImage && (
                <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-white">
                  <div className="text-xs text-gray-500 mb-2">Logo saat ini:</div>
                  <div className="flex items-center gap-3">
                    <img
                      src={teamForm.existingImageUrl}
                      alt="Current"
                      className="w-16 h-16 object-cover rounded border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setTeamForm((p) => ({ ...p, removeImage: true }))
                      }
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Hapus logo
                    </button>
                  </div>
                </div>
              )}

              {(!editingTeam || !teamForm.existingImageUrl || teamForm.removeImage) && (
                <ImageUpload
                  value={teamForm.imageFile ?? undefined}
                  onChange={(file) =>
                    setTeamForm((p) => ({
                      ...p,
                      imageFile: file,
                      removeImage: false,
                    }))
                  }
                  maxSize={5}
                  acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
                />
              )}

              {teamForm.imageFile && (
                <div className="mt-2 text-xs text-gray-600">
                  File baru dipilih:{" "}
                  <span className="font-medium">
                    {teamForm.imageFile.name}
                  </span>
                  {editingTeam && (
                    <button
                      type="button"
                      onClick={() =>
                        setTeamForm((p) => ({ ...p, imageFile: null }))
                      }
                      className="ml-2 text-red-600 hover:text-red-700"
                    >
                      Batal pilih
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={closeFormDialog}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {submitting
                  ? "Menyimpan..."
                  : editingTeam
                    ? "Update"
                    : "Buat"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteTeam}
        title="Hapus Team"
        message={
          deleteTarget
            ? `Hapus team "${deleteTarget.name}"? Team akan di-nonaktifkan (soft delete) dan tidak muncul di daftar.`
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

// Local debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
