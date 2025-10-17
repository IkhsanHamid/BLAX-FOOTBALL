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
import { TableLoadingSkeleton } from "./LoadingSkeleton";

export default function VenueManagement() {
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

  useEffect(() => {
    fetchVenues();
  }, [searchTerm, currentPage]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await masterDataService.getVenues(searchTerm);
      setVenues(response);
    } catch (error) {
      console.error("Error fetching venues:", error);
      showError("Error", "Failed to load venues");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<VenuePayload> = {};

    if (!formData.name.trim()) {
      errors.name = "Venue name is required";
    }

    if (!formData.address.trim()) {
      errors.address = "Address is required";
    }

    if (!formData.gmapLink.trim()) {
      errors.gmapLink = "Google Maps link is required";
    } else if (!isValidUrl(formData.gmapLink)) {
      errors.gmapLink = "Please enter a valid URL";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      if (editingVenue) {
        await masterDataService.updateVenue(editingVenue.id, formData);
        showSuccess("Success", "Venue updated successfully");
      } else {
        await masterDataService.createVenue(formData);
        showSuccess("Success", "Venue created successfully");
      }

      handleCloseDialog();
      fetchVenues();
    } catch (error) {
      console.error("Error saving venue:", error);
      showError(
        "Error",
        editingVenue ? "Failed to update venue" : "Failed to create venue"
      );
    } finally {
      setSubmitting(false);
    }
  };

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
      showSuccess("Success", "Venue deleted successfully");
      setDeleteConfirmation({ isOpen: false, venue: null });
      fetchVenues();
    } catch (error) {
      console.error("Error deleting venue:", error);
      showError("Error", "Failed to delete venue");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingVenue(null);
    setFormData({ name: "", gmapLink: "", address: "" });
    setFormErrors({});
  };

  const handleInputChange = (field: keyof VenuePayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

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
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading venues...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Google Maps</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {venues.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-center py-8">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No venues found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  venues.map((venue) => (
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
                          View Map
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
                  ))
                )}
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
            Previous
          </Button>
          <span className="flex items-center px-4 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingVenue ? "Edit Venue" : "Add New Venue"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter venue name"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter venue address"
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
                Google Maps Link *
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
                Cancel
              </Button>
              <Button
                type="submit"
                variant="black"
                size="sm"
                disabled={submitting}
              >
                {submitting
                  ? editingVenue
                    ? "Updating..."
                    : "Creating..."
                  : editingVenue
                  ? "Update Venue"
                  : "Create Venue"}
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
        title="Delete Venue"
        message={`Apakah kamu yakin hapus venue "${deleteConfirmation.venue?.name}"? Aksi ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={actionLoading === "delete"}
      />
    </div>
  );
}
