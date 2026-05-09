"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Search,
  Wifi,
  Car,
  Coffee,
  Shield,
  Zap,
  Grid3x3,
  List,
} from "lucide-react";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import { Card, CardContent } from "../atoms/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../atoms/Dialog";
import ConfirmationModal from "../molecules/ConfirmationModal";
import { useNotifications } from "./NotificationContainer";
import {
  masterDataService,
  Facility,
  FacilityPayload,
} from "@/utils/masterData";
import Badge from "../atoms/Badge";
import Pagination from "../atoms/Pagination";
import { CardsLoadingSkeleton } from "./LoadingSkeleton";

// Pemetaan ikon fasilitas
const FACILITY_ICONS: Record<string, any> = {
  "Air Mineral": Coffee,
  Rompi: Shield,
  Bola: Settings,
  Shower: Settings,
  Wasit: Settings,
  Parking: Car,
  WiFi: Wifi,
  Electricity: Zap,
  default: Settings,
};

// Warna gradient untuk kartu fasilitas
const GRADIENT_COLORS = [
  "from-blue-500 to-teal-500",
  "from-green-500 to-emerald-500",
  "from-purple-500 to-pink-500",
  "from-orange-500 to-red-500",
  "from-indigo-500 to-blue-500",
  "from-yellow-500 to-orange-500",
];

export default function FacilityManagement() {
  // State Management
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    facility: Facility | null;
  }>({ isOpen: false, facility: null });
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [formData, setFormData] = useState<FacilityPayload>({ name: "" });
  const [formErrors, setFormErrors] = useState<Partial<FacilityPayload>>({});

  const { showSuccess, showError } = useNotifications();

  // Fetch facilities
  const fetchFacilities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await masterDataService.getFacilities(searchTerm);
      setFacilities(response.data);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      showError("Gagal memuat data fasilitas");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, showError]);

  // Effects
  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const filteredFacilities = useMemo(() => {
    if (!searchTerm) return facilities;
    return facilities.filter((f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [facilities, searchTerm]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<FacilityPayload> = {};

    if (!formData.name.trim()) {
      errors.name = "Nama fasilitas wajib diisi";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Nama fasilitas minimal 2 karakter";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (editingFacility) {
        await masterDataService.updateFacility(editingFacility.id, formData);
        showSuccess("Fasilitas berhasil diperbarui");
      } else {
        await masterDataService.createFacility(formData);
        showSuccess("Fasilitas berhasil ditambahkan");
      }

      handleCloseDialog();
      fetchFacilities();
    } catch (error) {
      console.error("Error saving facility:", error);
      showError(
        editingFacility
          ? "Gagal memperbarui fasilitas"
          : "Gagal menambahkan fasilitas",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Edit facility
  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setFormData({ name: facility.name });
    setShowDialog(true);
  };

  // Delete single facility
  const handleDelete = async () => {
    if (!deleteConfirmation.facility) return;

    try {
      setActionLoading("delete");
      await masterDataService.deleteFacility(deleteConfirmation.facility.id);
      showSuccess("Fasilitas berhasil dihapus");
      setDeleteConfirmation({ isOpen: false, facility: null });
      fetchFacilities();
    } catch (error) {
      console.error("Error deleting facility:", error);
      showError("Gagal menghapus fasilitas");
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showSuccess(`${selectedFacilities.length} fasilitas berhasil dihapus`);
      setShowBulkDeleteConfirm(false);
      setSelectedFacilities([]);
      fetchFacilities();
    } catch (error) {
      showError("Gagal menghapus fasilitas");
    }
  };

  // Close dialog
  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingFacility(null);
    setFormData({ name: "" });
    setFormErrors({});
  };

  // Handle input change
  const handleInputChange = (field: keyof FacilityPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Utility functions
  const getFacilityIcon = (name: string) => {
    return FACILITY_ICONS[name] || FACILITY_ICONS.default;
  };

  const getFacilityColor = (name: string) => {
    const index = name.length % GRADIENT_COLORS.length;
    return GRADIENT_COLORS[index];
  };

  // Loading state
  if (loading) {
    return <CardsLoadingSkeleton />;
  }

  return (
    <div className="space-y-4 p-4 sm:p-0">
      {/* Header - Responsif */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Manajemen Fasilitas
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Kelola fasilitas dan amenitas venue
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedFacilities.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden xs:inline">Hapus</span>
              <span>({selectedFacilities.length})</span>
            </Button>
          )}

          <Button
            variant="black"
            size="sm"
            onClick={() => setShowDialog(true)}
            disabled={loading}
            className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Fasilitas</span>
          </Button>
        </div>
      </div>

      {/* Search & View Toggle - Responsif */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
              <input
                type="text"
                placeholder="Cari fasilitas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 self-start">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {searchTerm && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600">Filter aktif:</p>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
                Pencarian: {searchTerm}
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-1 hover:text-blue-600 text-base"
                >
                  ×
                </button>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredFacilities.length === 0 ? (
        <Card>
          <CardContent className="p-8 sm:p-12 text-center">
            <Settings className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Tidak ada fasilitas
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {searchTerm
                ? "Coba sesuaikan kata kunci pencarian"
                : "Mulai dengan menambahkan fasilitas pertama"}
            </p>
            {!searchTerm && (
              <Button
                variant="black"
                size="sm"
                onClick={() => setShowDialog(true)}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Tambah Fasilitas Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid View - Responsif */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {facilities.map((facility) => {
            const IconComponent = getFacilityIcon(facility.name);
            const colorClass = getFacilityColor(facility.name);

            return (
              <Card
                key={facility.id}
                className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${colorClass} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}
                    >
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {facility.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {facility.createdAt
                          ? new Date(facility.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "Baru ditambahkan"}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 text-xs"
                    >
                      Aktif
                    </Badge>
                    <div className="flex gap-1 sm:gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(facility)}
                        className="hover:bg-yellow-50 p-1.5 sm:p-2"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDeleteConfirmation({
                            isOpen: true,
                            facility: facility,
                          })
                        }
                        className="hover:bg-red-50 text-red-600 p-1.5 sm:p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View - Responsif */
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {filteredFacilities.map((facility) => {
                const IconComponent = getFacilityIcon(facility.name);
                const colorClass = getFacilityColor(facility.name);

                return (
                  <div
                    key={facility.id}
                    className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 bg-gradient-to-r ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}
                        >
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                            {facility.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {facility.createdAt
                              ? new Date(facility.createdAt).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "Baru ditambahkan"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 text-xs hidden sm:inline-flex"
                        >
                          Aktif
                        </Badge>
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(facility)}
                            className="hover:bg-yellow-50 p-1.5 sm:p-2"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setDeleteConfirmation({
                                isOpen: true,
                                facility: facility,
                              })
                            }
                            className="hover:bg-red-50 text-red-600 p-1.5 sm:p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog - Responsif */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingFacility ? "Edit Fasilitas" : "Tambah Fasilitas Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Fasilitas <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Masukkan nama fasilitas"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">
                  {formErrors.name}
                </p>
              )}
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                Contoh: Air Mineral, Rompi, Bola, Shower, Wasit, Parking, WiFi
              </p>
            </div>

            <div className="flex justify-end gap-2 sm:gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseDialog}
                disabled={submitting}
                className="flex-1 sm:flex-initial"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="black"
                size="sm"
                disabled={submitting}
                className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>
                      {editingFacility ? "Menyimpan..." : "Menambah..."}
                    </span>
                  </>
                ) : (
                  <span>{editingFacility ? "Perbarui" : "Tambah"}</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, facility: null })}
        onConfirm={handleDelete}
        title="Hapus Fasilitas"
        message={`Apakah Anda yakin ingin menghapus fasilitas "${deleteConfirmation.facility?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
        isLoading={actionLoading === "delete"}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Hapus Beberapa Fasilitas"
        message={`Apakah Anda yakin ingin menghapus ${selectedFacilities.length} fasilitas? Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Hapus Semua"
        cancelText="Batal"
      />
    </div>
  );
}
