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

const ITEMS_PER_PAGE = 10;

export default function ManajemenVenue() {
  // State Management
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch venues when debounced search changes
  useEffect(() => {
    fetchVenues();
  }, [debouncedSearch]);

  // API Functions
  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await masterDataService.getVenues(debouncedSearch);
      setVenues(response);
    } catch (error) {
      console.error("Kesalahan saat memuat venue:", error);
      showError("Kesalahan", "Gagal memuat data venue");
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(venues.length / ITEMS_PER_PAGE);
  const paginatedVenues = venues.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
      errors.gmapLink = "Tautan Google Maps wajib diisi";
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
        showSuccess("Berhasil", "Venue berhasil ditambahkan");
      }

      handleCloseDialog();
      fetchVenues();
    } catch (error) {
      console.error("Kesalahan saat menyimpan venue:", error);
      showError(
        "Kesalahan",
        editingVenue ? "Gagal memperbarui venue" : "Gagal menambahkan venue"
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
      console.error("Kesalahan saat menghapus venue:", error);
      showError("Kesalahan", "Gagal menghapus venue");
    } finally {
      setActionLoading(null);
    }
  };

  // Render Functions
  const renderEmptyState = () => (
    <TableRow>
      <TableCell className="text-center py-12">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">
          {debouncedSearch
            ? "Venue tidak ditemukan"
            : "Belum ada venue yang ditambahkan"}
        </p>
        {!debouncedSearch && (
          <p className="text-sm text-gray-400 mt-2">
            Klik tombol "Tambah Venue" untuk memulai
          </p>
        )}
      </TableCell>
    </TableRow>
  );

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-gray-600">Memuat venue...</span>
    </div>
  );

  const renderMobileCard = (venue: Venue) => (
    <Card key={venue.id} className="mb-3">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900">{venue.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{venue.address}</p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <a
              href={venue.gmapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Lihat Peta
            </a>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
          className="flex items-center justify-center sm:justify-start whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>Tambah Venue</span>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Cari nama venue atau alamat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Venues Display */}
      {loading ? (
        <Card>
          <CardContent className="p-0">{renderLoadingState()}</CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile View - Cards */}
          <div className="md:hidden">
            {paginatedVenues.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    {debouncedSearch
                      ? "Venue tidak ditemukan"
                      : "Belum ada venue yang ditambahkan"}
                  </p>
                  {!debouncedSearch && (
                    <p className="text-sm text-gray-400 mt-2">
                      Klik tombol "Tambah Venue" untuk memulai
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              paginatedVenues.map((venue) => renderMobileCard(venue))
            )}
          </div>

          {/* Desktop View - Table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Nama Venue</TableHead>
                      <TableHead className="w-2/5">Alamat</TableHead>
                      <TableHead className="w-1/6">Google Maps</TableHead>
                      <TableHead className="w-1/6 text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedVenues.length === 0
                      ? renderEmptyState()
                      : paginatedVenues.map((venue) => (
                          <TableRow key={venue.id}>
                            <TableCell className="font-medium">
                              {venue.name}
                            </TableCell>
                            <TableCell>
                              <p className="line-clamp-2">{venue.address}</p>
                            </TableCell>
                            <TableCell>
                              <a
                                href={venue.gmapLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Lihat Peta
                              </a>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center space-x-2">
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
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
          <div className="text-sm text-gray-600">
            Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, venues.length)} dari{" "}
            {venues.length} venue
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </Button>
            <span className="px-3 py-1 text-sm text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVenue ? "Edit Venue" : "Tambah Venue Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Venue <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Contoh: Stadion Gelora Bung Karno"
                className={formErrors.name ? "border-red-500" : ""}
                disabled={submitting}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Masukkan alamat lengkap venue"
                rows={3}
                disabled={submitting}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
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
                Tautan Google Maps <span className="text-red-500">*</span>
              </label>
              <Input
                type="url"
                value={formData.gmapLink}
                onChange={(e) => handleInputChange("gmapLink", e.target.value)}
                placeholder="https://maps.google.com/..."
                className={formErrors.gmapLink ? "border-red-500" : ""}
                disabled={submitting}
              />
              {formErrors.gmapLink && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.gmapLink}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Salin tautan dari Google Maps untuk lokasi venue
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="black"
                size="sm"
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting
                  ? editingVenue
                    ? "Memperbarui..."
                    : "Menambahkan..."
                  : editingVenue
                  ? "Perbarui Venue"
                  : "Tambah Venue"}
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
        message={`Apakah Anda yakin ingin menghapus venue "${deleteConfirmation.venue?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
        isLoading={actionLoading === "delete"}
      />
    </div>
  );
}
