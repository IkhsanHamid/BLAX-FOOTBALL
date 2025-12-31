"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Image, Search, Calendar } from "lucide-react";
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
import { GalleriesRequest, GalleryData } from "@/types/galleries";
import { adminService } from "@/utils/admin";
import { ListSchedule } from "@/types/schedule";

export default function GalleriesManagement() {
  const [galleries, setGalleries] = useState<GalleryData[]>([]);
  const [schedules, setSchedules] = useState<ListSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GalleryData | null>(
    null
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    gallery: GalleryData | null;
  }>({ isOpen: false, gallery: null });

  const [formData, setFormData] = useState<GalleriesRequest>({
    scheduleId: "",
    linkPhotos: "",
    linkVideos: "",
    expiredAt: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<GalleriesRequest>>({});
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchGalleries(), fetchListSchedule()]);
    setLoading(false);
  };

  const fetchGalleries = async () => {
    try {
      const response = await adminService.galleriesDatas();
      setGalleries(response || []);
    } catch (error) {
      console.error("Error fetching galleries:", error);
      showError("Error", "Failed to load galleries");
      setGalleries([]);
    }
  };

  const fetchListSchedule = async () => {
    try {
      const response = await adminService.listSchedule();
      setSchedules(response || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      showError("Error", "Failed to load schedules");
      setSchedules([]);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<GalleriesRequest> = {};

    if (!formData.scheduleId.trim()) {
      errors.scheduleId = "Schedule is required";
    }

    if (!formData.linkPhotos.trim()) {
      errors.linkPhotos = "Google Drive photos link is required";
    } else if (!isValidGDriveUrl(formData.linkPhotos)) {
      errors.linkPhotos = "Please enter a valid Google Drive link";
    }

    if (formData.linkVideos && !isValidGDriveUrl(formData.linkVideos)) {
      errors.linkVideos = "Please enter a valid Google Drive link";
    }

    if (!formData.expiredAt) {
      errors.expiredAt = "Expiration date is required";
    } else if (new Date(formData.expiredAt) < new Date()) {
      errors.expiredAt = "Expiration date must be in the future";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidGDriveUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname.includes("drive.google.com") ||
        urlObj.hostname.includes("docs.google.com")
      );
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        linkVideos: formData.linkVideos || undefined,
        linkVideosMatch: formData.linkVideosMatch || undefined,
        linkVideosSlowmo: formData.linkVideosSlowmo || undefined,
      };

      if (editingGallery) {
        await adminService.updateGallery(editingGallery.id, payload);
        showSuccess("Success", "Gallery updated successfully");
      } else {
        await adminService.addGallery(payload);
        showSuccess("Success", "Gallery created successfully");
      }

      handleCloseDialog();
      fetchGalleries();
    } catch (error) {
      console.error("Error saving gallery:", error);
      showError(
        "Error",
        editingGallery ? "Failed to update gallery" : "Failed to create gallery"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (gallery: GalleryData) => {
    setEditingGallery(gallery);
    setFormData({
      scheduleId: gallery.id,
      linkPhotos: gallery.linkPhotos,
      linkVideos: gallery.linkVideos || "",
      expiredAt: gallery.expiredAt.split("T")[0],
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.gallery) return;

    try {
      setActionLoading("delete");
      await adminService.deleteGallery(deleteConfirmation.gallery.id);
      showSuccess("Success", "Gallery deleted successfully");
      setDeleteConfirmation({ isOpen: false, gallery: null });
      fetchGalleries();
    } catch (error) {
      console.error("Error deleting gallery:", error);
      showError("Error", "Failed to delete gallery");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingGallery(null);
    setFormData({
      scheduleId: "",
      linkPhotos: "",
      linkVideos: "",
      expiredAt: "",
    });
    setFormErrors({});
  };

  const handleInputChange = (field: keyof GalleriesRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const filteredGalleries = galleries.filter((gallery) =>
    gallery.scheduleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Manajemen Gallery
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Kelola foto dan video pertandingan
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
          <span className="hidden md:inline">Tambah Gallery</span>
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
              placeholder="Cari berdasarkan nama schedule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 md:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Galleries Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading galleries...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Tanggal & Jam</TableHead>
                    <TableHead>Link Foto</TableHead>
                    <TableHead>Link Video</TableHead>
                    <TableHead>Link Video Match</TableHead>
                    <TableHead>Link Video Slowmo</TableHead>
                    <TableHead>Expired At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGalleries.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center py-12">
                        <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">
                          {searchTerm
                            ? "Tidak ada gallery yang ditemukan"
                            : "Belum ada gallery"}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          {searchTerm
                            ? "Coba dengan kata kunci lain"
                            : "Klik tombol 'Tambah Gallery' untuk membuat gallery baru"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGalleries.map((gallery) => (
                      <TableRow key={gallery.id}>
                        <TableCell className="font-medium">
                          {gallery.scheduleName}
                        </TableCell>
                        <TableCell>
                          {formatDate(gallery.date)} - {gallery.time}
                        </TableCell>
                        <TableCell>
                          <a
                            href={gallery.linkPhotos}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Photos
                          </a>
                        </TableCell>
                        <TableCell>
                          {gallery.linkVideos ? (
                            <a
                              href={gallery.linkVideos}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Videos
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {gallery.linkVideosMatch ? (
                            <a
                              href={gallery.linkVideosMatch}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Videos Match
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {gallery.linkVideosSlowmo ? (
                            <a
                              href={gallery.linkVideosSlowmo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Videos Slowmo
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                            {formatDate(gallery.expiredAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(gallery)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                setDeleteConfirmation({
                                  isOpen: true,
                                  gallery: gallery,
                                })
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGallery ? "Edit Gallery" : "Tambah Gallery Baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Schedule Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule *
              </label>
              <select
                value={formData.scheduleId}
                onChange={(e) =>
                  handleInputChange("scheduleId", e.target.value)
                }
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.scheduleId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Pilih Schedule</option>
                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.name}
                  </option>
                ))}
              </select>
              {formErrors.scheduleId && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.scheduleId}
                </p>
              )}
              {schedules.length === 0 && (
                <p className="text-amber-600 text-sm mt-1">
                  Belum ada schedule tersedia
                </p>
              )}
            </div>

            {/* Link Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link Google Drive Foto *
              </label>
              <Input
                type="url"
                value={formData.linkPhotos}
                onChange={(e) =>
                  handleInputChange("linkPhotos", e.target.value)
                }
                placeholder="https://drive.google.com/..."
                className={formErrors.linkPhotos ? "border-red-500" : ""}
              />
              {formErrors.linkPhotos && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.linkPhotos}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Masukkan link folder Google Drive yang berisi foto
              </p>
            </div>

            {/* Link Videos (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link Google Drive Video (Opsional)
              </label>
              <Input
                type="url"
                value={formData.linkVideos ? formData.linkVideos : ""}
                onChange={(e) =>
                  handleInputChange("linkVideos", e.target.value)
                }
                placeholder="https://drive.google.com/..."
                className={formErrors.linkVideos ? "border-red-500" : ""}
              />
              {formErrors.linkVideos && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.linkVideos}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Masukkan link folder Google Drive yang berisi video (tidak
                wajib)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link Google Drive Video Match (Opsional)
              </label>
              <Input
                type="url"
                value={formData.linkVideos ? formData.linkVideos : ""}
                onChange={(e) =>
                  handleInputChange("linkVideosMatch", e.target.value)
                }
                placeholder="https://drive.google.com/..."
                className={formErrors.linkVideos ? "border-red-500" : ""}
              />
              {formErrors.linkVideos && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.linkVideos}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Masukkan link folder Google Drive yang berisi video Match (tidak
                wajib)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link Google Drive Video Slowmo (Opsional)
              </label>
              <Input
                type="url"
                value={formData.linkVideos ? formData.linkVideos : ""}
                onChange={(e) =>
                  handleInputChange("linkVideosSlowmo", e.target.value)
                }
                placeholder="https://drive.google.com/..."
                className={formErrors.linkVideos ? "border-red-500" : ""}
              />
              {formErrors.linkVideos && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.linkVideos}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Masukkan link folder Google Drive yang berisi video Slowmo
                (tidak wajib)
              </p>
            </div>

            {/* Expired At */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Expired *
              </label>
              <Input
                type="date"
                value={formData.expiredAt}
                onChange={(e) => handleInputChange("expiredAt", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={formErrors.expiredAt ? "border-red-500" : ""}
              />
              {formErrors.expiredAt && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.expiredAt}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Gallery akan otomatis tidak ditampilkan setelah tanggal ini
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
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
                variant="black"
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? editingGallery
                    ? "Updating..."
                    : "Creating..."
                  : editingGallery
                  ? "Update Gallery"
                  : "Buat Gallery"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, gallery: null })}
        onConfirm={handleDelete}
        title="Hapus Gallery"
        message={`Apakah kamu yakin ingin menghapus gallery untuk schedule "${deleteConfirmation.gallery?.scheduleName}"? Aksi ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
        isLoading={actionLoading === "delete"}
      />
    </div>
  );
}
