"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  MoreHorizontal,
  Wifi,
  Car,
  Coffee,
  Shield,
  Zap,
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

// Facility icons mapping
const facilityIcons: Record<string, any> = {
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

// Skeleton Components
const FacilityCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
      </div>
    </CardContent>
  </Card>
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-6">
          <div className="pt-4 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function FacilityManagement() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
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

  const [formData, setFormData] = useState<FacilityPayload>({
    name: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<FacilityPayload>>({});

  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    filterFacilities();
  }, [facilities, searchTerm]);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await masterDataService.getFacilities(
        searchTerm,
        currentPage,
        itemsPerPage
      );
      setFacilities(response.data);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      showError("Error", "Failed to load facilities");
    } finally {
      setLoading(false);
    }
  };

  const filterFacilities = () => {
    let filtered = facilities;

    if (searchTerm) {
      filtered = filtered.filter((facility) =>
        facility.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFacilities(filtered);
    setCurrentPage(1);
  };

  const validateForm = (): boolean => {
    const errors: Partial<FacilityPayload> = {};

    if (!formData.name.trim()) {
      errors.name = "Facility name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Facility name must be at least 2 characters long";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      if (editingFacility) {
        await masterDataService.updateFacility(editingFacility.id, formData);
        showSuccess("Success", "Facility updated successfully");
      } else {
        await masterDataService.createFacility(formData);
        showSuccess("Success", "Facility created successfully");
      }

      handleCloseDialog();
      fetchFacilities();
    } catch (error) {
      console.error("Error saving facility:", error);
      showError(
        "Error",
        editingFacility
          ? "Failed to update facility"
          : "Failed to create facility"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setFormData({
      name: facility.name,
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.facility) return;

    try {
      setActionLoading("delete");
      await masterDataService.deleteFacility(deleteConfirmation.facility.id);
      showSuccess("Success", "Facility deleted successfully");
      setDeleteConfirmation({ isOpen: false, facility: null });
      fetchFacilities();
    } catch (error) {
      console.error("Error deleting facility:", error);
      showError("Error", "Failed to delete facility");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      // Simulate API call for bulk delete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showSuccess(
        `${selectedFacilities.length} facilities deleted successfully`
      );
      setShowBulkDeleteConfirm(false);
      setSelectedFacilities([]);
      fetchFacilities();
    } catch (error) {
      showError("Error", "Failed to delete facilities");
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingFacility(null);
    setFormData({ name: "" });
    setFormErrors({});
  };

  const handleInputChange = (field: keyof FacilityPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSelectFacility = (id: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(id)
        ? prev.filter((facilityId) => facilityId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedFacilities.length === paginatedFacilities.length) {
      setSelectedFacilities([]);
    } else {
      setSelectedFacilities(paginatedFacilities.map((f) => f.id));
    }
  };

  const getFacilityIcon = (name: string) => {
    const IconComponent = facilityIcons[name] || facilityIcons.default;
    return IconComponent;
  };

  const getFacilityColor = (name: string) => {
    const colors = [
      "from-blue-500 to-teal-500",
      "from-green-500 to-emerald-500",
      "from-purple-500 to-pink-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-blue-500",
      "from-yellow-500 to-orange-500",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  // Pagination
  const totalPages = Math.ceil(filteredFacilities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFacilities = filteredFacilities.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Stats calculation
  const stats = {
    total: facilities.length,
    active: facilities.length, // All facilities are active
    categories: new Set(facilities.map((f) => f.name.split(" ")[0])).size,
    recent: facilities.filter(
      (f) =>
        f.createdAt &&
        new Date(f.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
  };

  if (loading) {
    return <CardsLoadingSkeleton />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Manajemen Fasilitas
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Kelola fasilitas dan amenitas venue
          </p>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          {selectedFacilities.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center"
            >
              <Trash2 className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden md:inline">
                Hapus ({selectedFacilities.length})
              </span>
              <span className="md:hidden">({selectedFacilities.length})</span>
            </Button>
          )}

          <Button
            variant="black"
            size="sm"
            onClick={() => setShowDialog(true)}
            disabled={loading}
            className="flex items-center"
          >
            <Plus className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Tambah Fasilitas</span>
            <span className="md:hidden">Tambah</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Facilities
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.active}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.categories}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Filter className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Added This Week
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.recent}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Plus className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="pt-4 flex-1 relative">
              <Search className="absolute left-3 top-9 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search facilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="pt-4 flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "grid"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {searchTerm && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mr-2">Active filters:</p>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Search: {searchTerm}
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-1 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Info */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1}-
          {Math.min(startIndex + itemsPerPage, filteredFacilities.length)} of{" "}
          {filteredFacilities.length} facilities
        </p>
      </div>

      {/* Facilities Display */}
      {filteredFacilities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No facilities found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "Get started by adding your first facility"}
            </p>
            {!searchTerm && (
              <Button
                variant="black"
                size="sm"
                onClick={() => setShowDialog(true)}
                className="flex items-center mx-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Facility
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedFacilities.map((facility) => {
            const IconComponent = getFacilityIcon(facility.name);
            const colorClass = getFacilityColor(facility.name);

            return (
              <Card
                key={facility.id}
                className="hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 group"
              >
                <CardContent className="p-6">
                  <div className="pt-4 flex items-center space-x-4 mb-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${colorClass} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {facility.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {facility.createdAt
                          ? `Added ${new Date(
                              facility.createdAt
                            ).toLocaleDateString()}`
                          : "Recently added"}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      Active
                    </Badge>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(facility)}
                        className="hover:bg-yellow-50"
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
                        className="hover:bg-red-50 text-red-600"
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
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {paginatedFacilities.map((facility) => {
                const IconComponent = getFacilityIcon(facility.name);
                const colorClass = getFacilityColor(facility.name);

                return (
                  <div
                    key={facility.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-10 h-10 bg-gradient-to-r ${colorClass} rounded-lg flex items-center justify-center`}
                        >
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {facility.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {facility.createdAt
                              ? `Added ${new Date(
                                  facility.createdAt
                                ).toLocaleDateString()}`
                              : "Recently added"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Active
                        </Badge>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(facility)}
                            className="hover:bg-yellow-50"
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
                            className="hover:bg-red-50 text-red-600"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFacility ? "Edit Facility" : "Add New Facility"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facility Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter facility name"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Examples: Air Mineral, Rompi, Bola, Shower, Wasit, Parking, WiFi
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
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
                className="flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingFacility ? "Updating..." : "Creating..."}
                  </>
                ) : editingFacility ? (
                  "Update Facility"
                ) : (
                  "Create Facility"
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
        title="Delete Facility"
        message={`Apakah kamu yakin hapus fasilitas "${deleteConfirmation.facility?.name}"? Aksi ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={actionLoading === "delete"}
      />
    </div>
  );
}
