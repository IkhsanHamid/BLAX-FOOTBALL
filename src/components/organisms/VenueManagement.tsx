"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, MapPin, ExternalLink, Search } from "lucide-react";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import { Card, CardContent } from "../atoms/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../atoms/Dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../atoms/Table";
import ConfirmationModal from "../molecules/ConfirmationModal";
import { useNotifications } from "./NotificationContainer";
import { masterDataService, Venue, VenuePayload } from "@/utils/masterData";

export default function ManajemenVenue() {
  // State Management
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    venue: Venue | null;
  }>({ isOpen: false, venue: null });

  const [formData, setFormData] = useState<VenuePayload>({
    name: "",
    gmapLink: "",
    address: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<VenuePayload>>({});

  const { showSuccess, showError } = useNotifications();

  // Effects
  useEffect(() => {
    fetchVenues();
  }, [searchTerm, currentPage]);

  // API Functions
  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await masterDataService.getVenues(searchTerm);
      setVenues(response);
    } catch (error) {
      console.error("Error fetching venues:", error);
      showError("Error", "Gagal memuat data venue");
    } finally {
      setLoading(false);
    }
  };

  // Validation
  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<VenuePayload> = {};

    if (!formData.name.trim()) {
      errors.name = "Nama venue wajib diisi";
    }

    if (!formData.address.trim()) {
      errors.address = "Alamat wajib diisi";
    }

    if (!formData.gmapLink.trim()) {
      errors.gmapLink = "Link Google Maps wajib diisi";
    } else if (!isValidUrl(formData.gmapLink)) {
      errors.gmapLink = "Mohon masukkan URL yang valid";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Handlers
  const handleInputChange = (field: keyof VenuePayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (editingVenue) {
        await masterDataService.updateVenue(editingVenue.id, formData);
        showSuccess("Berhasil", "Venue berhasil diperbarui");
      } else {
        await masterDataService.createVenue(formData);
        showSuccess("Berhasil", "Venue berhasil dibuat");
      }

      handleCloseDialog();
      fetchVenues();
    } catch (error) {
      console.error("Error saving venue:", error);
      showError(
        "Error",
        editingVenue ? "Gagal memperbarui venue" : "Gagal membuat venue"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingVenue(null);
    setFormData({ name: "", gmapLink: "", address: "" });
    setFormErrors({});
  };

  // CRUD Handlers
  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      gmapLink: venue.gmapLink,
      address: venue.address,
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.venue) return;

    try {
      setActionLoading("delete");
      await masterDataService.deleteVenue(deleteConfirmation.venue.id);
      showSuccess("Berhasil", "Venue berhasil dihapus");
      setDeleteConfirmation({ isOpen: false, venue: null });
      fetchVenues();
    } catch (error) {
      console.error("Error deleting venue:", error);
      showError("Error", "Gagal menghapus venue");
    } finally {
      setActionLoading(null);
    }
  };

  // Render Functions
  const renderEmptyState = () => (
    <TableRow>
      <TableCell className="text-center py-8">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Tidak ada venue ditemukan</p>
      </TableCell>
    </TableRow>
  );

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span className="ml-2 text-gray-600">Memuat venue...</span>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Manajemen Venue
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Kelola data venue dan lokasi pertandingan
          </p>
        </div>
        <Button
          variant="black"
          size="sm"
          onClick={() => setShowDialog(true)}
          disabled={loading}
          className="flex items-center"
        >
          <Plus className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Tambah Venue</span>
          <span className="md:hidden">Tambah</span>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-3 md:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
            <input
              type="text"
              placeholder="Cari venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 md:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Venues Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            renderLoadingState()
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Google Maps</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {venues.length === 0
                  ? renderEmptyState()
                  : venues.map((venue) => (
                      <TableRow key={venue.id}>
                        <TableCell className="font-medium">
                          {venue.name}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {venue.address}
                        </TableCell>
                        <TableCell>
                          <a
                            href={venue.gmapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Lihat Peta
                          </a>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(venue)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                setDeleteConfirmation({
                                  isOpen: true,
                                  venue: venue,
                                })
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Sebelumnya
          </Button>
          <span className="flex items-center px-4 py-2 text-sm text-gray-700">
            Halaman {currentPage} dari {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Berikutnya
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingVenue ? "Edit Venue" : "Buat Venue Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Venue *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Masukkan nama venue"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Masukkan alamat venue"
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.address ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.address && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.address}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link Google Maps *
              </label>
              <Input
                type="url"
                value={formData.gmapLink}
                onChange={(e) => handleInputChange("gmapLink", e.target.value)}
                placeholder="https://maps.google.com/..."
                className={formErrors.gmapLink ? "border-red-500" : ""}
              />
              {formErrors.gmapLink && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.gmapLink}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCloseDialog}
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
                {submitting
                  ? editingVenue
                    ? "Memperbarui..."
                    : "Membuat..."
                  : editingVenue
                  ? "Perbarui Venue"
                  : "Buat Venue"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, venue: null })}
        onConfirm={handleDelete}
        title="Hapus Venue"
        message={`Apakah kamu yakin ingin menghapus venue "${deleteConfirmation.venue?.name}"? Aksi ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
        isLoading={actionLoading === "delete"}
      />
    </div>
  );
}
