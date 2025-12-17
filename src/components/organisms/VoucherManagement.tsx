"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Edit, Trash2, Search, Gift, Eye, X } from "lucide-react";
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
import { voucherService } from "@/utils/voucher";
import Badge from "../atoms/Badge";
import Pagination from "../atoms/Pagination";
import { CardsLoadingSkeleton } from "./LoadingSkeleton";
import { formatCurrency } from "@/lib/helper";
import { Voucher, VoucherPayload } from "@/types/voucher";

// Constants
const ITEMS_PER_PAGE = 12;
const MIN_CODE_LENGTH = 3;
const MAX_PERCENTAGE = 100;

const INITIAL_FORM_DATA: VoucherPayload = {
  code: "",
  name: "",
  description: "",
  type: "PERCENTAGE",
  nominal: 0,
  isActive: true,
};

const STATUS_FILTERS = [
  { value: "all", label: "Semua Status" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Tidak Aktif" },
] as const;

// Types
type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

interface VoucherStatus {
  status: string;
  color: string;
}

interface DeleteConfirmation {
  isOpen: boolean;
  voucher: Voucher | null;
}

type FormErrors = Partial<Record<keyof VoucherPayload, string>>;

// Utility functions
const getVoucherStatus = (voucher: Voucher): VoucherStatus => {
  if (!voucher.isActive) {
    return { status: "tidak aktif", color: "bg-gray-100 text-gray-800" };
  }
  return { status: "aktif", color: "bg-green-100 text-green-800" };
};

const getDiscountDisplay = (voucher: Voucher): string => {
  return voucher.type === "PERCENTAGE"
    ? `${voucher.nominal}%`
    : formatCurrency(voucher.nominal);
};

// Validation
const validateVoucherForm = (formData: VoucherPayload): FormErrors => {
  const errors: FormErrors = {};

  if (formData.code?.trim() && formData.code.trim().length < MIN_CODE_LENGTH) {
    errors.code = `Kode harus minimal ${MIN_CODE_LENGTH} karakter`;
  }

  if (!formData.name.trim()) {
    errors.name = "Nama voucher wajib diisi";
  }

  if (!formData.description.trim()) {
    errors.description = "Deskripsi wajib diisi";
  }

  if (formData.nominal <= 0) {
    errors.nominal = "Nilai diskon harus lebih dari 0";
  }

  if (formData.type === "PERCENTAGE" && formData.nominal > MAX_PERCENTAGE) {
    errors.nominal = "Diskon persentase tidak boleh melebihi 100%";
  }

  return errors;
};

// Main Component
export default function VoucherManagement(): JSX.Element {
  // State
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmation>({
      isOpen: false,
      voucher: null,
    });
  const [selectedVouchers, setSelectedVouchers] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] =
    useState<boolean>(false);
  const [formData, setFormData] = useState<VoucherPayload>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [viewingVoucher, setViewingVoucher] = useState<Voucher | null>(null);

  const { showSuccess, showError } = useNotifications();

  // Fetch vouchers
  const fetchVouchers = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await voucherService.getVouchers(
        searchTerm,
        currentPage,
        ITEMS_PER_PAGE
      );
      setVouchers(response.data);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      showError("Error", "Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, showError]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  // Filter vouchers
  const filteredVouchers = useMemo((): Voucher[] => {
    let filtered = vouchers;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (voucher) =>
          voucher.name.toLowerCase().includes(lowerSearch) ||
          voucher.code.toLowerCase().includes(lowerSearch) ||
          voucher.description.toLowerCase().includes(lowerSearch)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((voucher) => {
        if (statusFilter === "active") return voucher.isActive;
        if (statusFilter === "inactive") return !voucher.isActive;
        return true;
      });
    }

    return filtered;
  }, [vouchers, searchTerm, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Pagination
  const { paginatedVouchers, totalPages, startIndex, endIndex } =
    useMemo(() => {
      const total = Math.ceil(filteredVouchers.length / ITEMS_PER_PAGE);
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = Math.min(start + ITEMS_PER_PAGE, filteredVouchers.length);
      const paginated = filteredVouchers.slice(start, end);

      return {
        paginatedVouchers: paginated,
        totalPages: total,
        startIndex: start,
        endIndex: end,
      };
    }, [filteredVouchers, currentPage]);

  // Form handlers
  const handleInputChange = useCallback(
    <K extends keyof VoucherPayload>(
      field: K,
      value: VoucherPayload[K]
    ): void => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const handleCloseDialog = useCallback((): void => {
    setShowDialog(false);
    setEditingVoucher(null);
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    const errors = validateVoucherForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      if (editingVoucher) {
        await voucherService.updateVoucher(editingVoucher.id, formData);
        showSuccess("Success", "Voucher updated successfully");
      } else {
        await voucherService.createVoucher(formData);
        showSuccess("Success", "Voucher created successfully");
      }

      handleCloseDialog();
      fetchVouchers();
    } catch (error) {
      console.error("Error saving voucher:", error);
      showError(
        "Error",
        editingVoucher ? "Failed to update voucher" : "Failed to create voucher"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = useCallback((voucher: Voucher): void => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      name: voucher.name,
      description: voucher.description,
      type: voucher.type,
      nominal: voucher.nominal,
      isActive: voucher.isActive,
    });
    setShowDialog(true);
  }, []);

  const handleDelete = async (): Promise<void> => {
    if (!deleteConfirmation.voucher) return;

    try {
      await voucherService.deleteVoucher(deleteConfirmation.voucher.id);
      showSuccess("Success", "Voucher deleted successfully");
      setDeleteConfirmation({ isOpen: false, voucher: null });
      fetchVouchers();
    } catch (error) {
      console.error("Error deleting voucher:", error);
      showError("Error", "Failed to delete voucher");
    }
  };

  const handleBulkDelete = async (): Promise<void> => {
    try {
      await Promise.all(
        selectedVouchers.map((id) => voucherService.deleteVoucher(id))
      );
      showSuccess(
        "Success",
        `${selectedVouchers.length} vouchers deleted successfully`
      );
      setShowBulkDeleteConfirm(false);
      setSelectedVouchers([]);
      fetchVouchers();
    } catch (error) {
      console.error("Error bulk deleting vouchers:", error);
      showError("Error", "Failed to delete vouchers");
    }
  };

  const handleSelectVoucher = useCallback((id: string): void => {
    setSelectedVouchers((prev) =>
      prev.includes(id) ? prev.filter((vId) => vId !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback((): void => {
    setSelectedVouchers((prev) =>
      prev.length === paginatedVouchers.length
        ? []
        : paginatedVouchers.map((v) => v.id)
    );
  }, [paginatedVouchers]);

  // Loading state
  if (loading) {
    return <CardsLoadingSkeleton />;
  }

  const hasActiveFilters = searchTerm || statusFilter !== "all";
  const isAllSelected =
    selectedVouchers.length === paginatedVouchers.length &&
    paginatedVouchers.length > 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Manajemen Voucher
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Kelola voucher diskon dan promosi
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedVouchers.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowBulkDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Hapus</span> (
              {selectedVouchers.length})
            </Button>
          )}

          <Button variant="black" size="sm" onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Tambah Voucher</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Cari voucher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">Filter aktif:</p>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Pencarian: {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Status: {statusFilter === "active" ? "Aktif" : "Tidak Aktif"}
                  <button
                    onClick={() => setStatusFilter("all")}
                    className="ml-1 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Info */}
      <div className="flex justify-between items-center text-sm">
        <p className="text-gray-600">
          {startIndex + 1}-{endIndex} dari {filteredVouchers.length} voucher
        </p>

        {filteredVouchers.length > 0 && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-600">Pilih semua</span>
          </label>
        )}
      </div>

      {/* Vouchers List */}
      {filteredVouchers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tidak ada voucher ditemukan
            </h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters
                ? "Coba sesuaikan kriteria pencarian Anda"
                : "Mulai dengan menambahkan voucher pertama Anda"}
            </p>
            {!hasActiveFilters && (
              <Button
                variant="black"
                size="sm"
                onClick={() => setShowDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Voucher Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y divide-gray-200">
            {paginatedVouchers.map((voucher) => (
              <VoucherListItem
                key={voucher.id}
                voucher={voucher}
                isSelected={selectedVouchers.includes(voucher.id)}
                onSelect={handleSelectVoucher}
                onEdit={handleEdit}
                onDelete={(v) =>
                  setDeleteConfirmation({ isOpen: true, voucher: v })
                }
                onView={setViewingVoucher}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Dialogs */}
      <VoucherFormDialog
        open={showDialog}
        editingVoucher={editingVoucher}
        formData={formData}
        formErrors={formErrors}
        submitting={submitting}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
      />

      <VoucherDetailDialog
        voucher={viewingVoucher}
        onClose={() => setViewingVoucher(null)}
        onEdit={(voucher) => {
          setViewingVoucher(null);
          handleEdit(voucher);
        }}
        onDelete={(voucher) => {
          setViewingVoucher(null);
          setDeleteConfirmation({ isOpen: true, voucher });
        }}
      />

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, voucher: null })}
        onConfirm={handleDelete}
        title="Hapus Voucher"
        message={`Apakah Anda yakin ingin menghapus "${deleteConfirmation.voucher?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
      />

      <ConfirmationModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Hapus Beberapa Voucher"
        message={`Apakah Anda yakin ingin menghapus ${selectedVouchers.length} voucher yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Hapus Semua"
        cancelText="Batal"
      />
    </div>
  );
}

// Voucher List Item Component
interface VoucherListItemProps {
  voucher: Voucher;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (voucher: Voucher) => void;
  onDelete: (voucher: Voucher) => void;
  onView: (voucher: Voucher) => void;
}

function VoucherListItem({
  voucher,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onView,
}: VoucherListItemProps): JSX.Element {
  const status = getVoucherStatus(voucher);

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex gap-3">
        {/* Checkbox */}
        <div className="flex-shrink-0 pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(voucher.id)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>

        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Gift className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-gray-900">
                {voucher.name}
              </h3>
              <Badge className={status.color}>{status.status}</Badge>
            </div>
            <div className="text-lg font-bold text-green-600">
              {getDiscountDisplay(voucher)}
            </div>
          </div>

          <p className="text-sm text-gray-600 font-mono mb-2">{voucher.code}</p>

          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
            {voucher.description}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => onView(voucher)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Detail
            </button>
            <button
              onClick={() => onEdit(voucher)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={() => onDelete(voucher)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Form Dialog Component
interface VoucherFormDialogProps {
  open: boolean;
  editingVoucher: Voucher | null;
  formData: VoucherPayload;
  formErrors: FormErrors;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onInputChange: <K extends keyof VoucherPayload>(
    field: K,
    value: VoucherPayload[K]
  ) => void;
}

function VoucherFormDialog({
  open,
  editingVoucher,
  formData,
  formErrors,
  submitting,
  onClose,
  onSubmit,
  onInputChange,
}: VoucherFormDialogProps): JSX.Element | null {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingVoucher ? "Edit Voucher" : "Tambah Voucher Baru"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode Voucher
              </label>
              <Input
                type="text"
                value={formData.code || ""}
                onChange={(e) =>
                  onInputChange("code", e.target.value.toUpperCase())
                }
                placeholder="SAVE20 (opsional)"
                className={formErrors.code ? "border-red-500" : ""}
              />
              {formErrors.code && (
                <p className="text-red-500 text-xs mt-1">{formErrors.code}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Kosongkan untuk generate otomatis
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Voucher *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => onInputChange("name", e.target.value)}
                placeholder="Masukkan nama voucher"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => onInputChange("description", e.target.value)}
                placeholder="Masukkan deskripsi voucher"
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  formErrors.description ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe Diskon *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    onInputChange(
                      "type",
                      e.target.value as "PERCENTAGE" | "FIXED"
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="FIXED">Nominal Tetap (Rp)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nilai Diskon *
                </label>
                <Input
                  type="number"
                  value={formData.nominal.toString()}
                  onChange={(e) =>
                    onInputChange("nominal", parseFloat(e.target.value) || 0)
                  }
                  placeholder={formData.type === "PERCENTAGE" ? "20" : "50000"}
                  min="0"
                  max={formData.type === "PERCENTAGE" ? "100" : undefined}
                  className={formErrors.nominal ? "border-red-500" : ""}
                />
                {formErrors.nominal && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.nominal}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => onInputChange("isActive", e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700"
              >
                Voucher aktif
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="black"
              size="sm"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingVoucher ? "Memperbarui..." : "Membuat..."}
                </>
              ) : editingVoucher ? (
                "Perbarui Voucher"
              ) : (
                "Buat Voucher"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Detail Dialog Component
interface VoucherDetailDialogProps {
  voucher: Voucher | null;
  onClose: () => void;
  onEdit: (voucher: Voucher) => void;
  onDelete: (voucher: Voucher) => void;
}

function VoucherDetailDialog({
  voucher,
  onClose,
  onEdit,
  onDelete,
}: VoucherDetailDialogProps): JSX.Element | null {
  if (!voucher) return null;

  const status = getVoucherStatus(voucher);

  return (
    <Dialog open={!!voucher} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Detail Voucher</DialogTitle>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex-shrink-0">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-xl font-bold text-gray-900">
                  {voucher.name}
                </h3>
                <Badge className={status.color}>{status.status}</Badge>
              </div>
              <p className="text-sm text-gray-600 font-mono bg-white px-3 py-1.5 rounded inline-block">
                {voucher.code}
              </p>
            </div>
          </div>

          {/* Discount Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 mb-1">Nilai Diskon</p>
              <p className="text-3xl font-bold text-green-800">
                {getDiscountDisplay(voucher)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 mb-1">Tipe Diskon</p>
              <p className="text-xl font-semibold text-blue-800">
                {voucher.type === "PERCENTAGE" ? "Persentase" : "Nominal Tetap"}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Deskripsi</h4>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {voucher.description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              Tutup
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(voucher)}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Voucher
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(voucher)}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Voucher
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
