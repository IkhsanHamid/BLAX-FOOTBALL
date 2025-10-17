"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  MoreHorizontal,
  Percent,
  DollarSign,
  Calendar,
  Users,
  Gift,
  Tag,
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
import { voucherService } from "@/utils/voucher";
import Badge from "../atoms/Badge";
import Pagination from "../atoms/Pagination";
import { CardsLoadingSkeleton } from "./LoadingSkeleton";
import { formatCurrency } from "@/lib/helper";
import { Voucher, VoucherPayload } from "@/types/voucher";

export default function VoucherManagement() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [showDialog, setShowDialog] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    voucher: Voucher | null;
  }>({ isOpen: false, voucher: null });
  const [selectedVouchers, setSelectedVouchers] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [formData, setFormData] = useState<VoucherPayload>({
    code: "",
    name: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: 0,
    minPurchase: 0,
    maxDiscount: 0,
    validFrom: "",
    validUntil: "",
    usageLimit: 1,
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState<Partial<VoucherPayload>>({});

  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    filterVouchers();
  }, [vouchers, searchTerm, statusFilter]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await voucherService.getVouchers(
        searchTerm,
        currentPage,
        itemsPerPage
      );
      setVouchers(response.data);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      showError("Error", "Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const filterVouchers = () => {
    let filtered = vouchers;

    if (searchTerm) {
      filtered = filtered.filter(
        (voucher) =>
          voucher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          voucher.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((voucher) => {
        switch (statusFilter) {
          case "active":
            return (
              voucher.isActive &&
              new Date(voucher.validFrom) <= now &&
              new Date(voucher.validUntil) >= now
            );
          case "expired":
            return new Date(voucher.validUntil) < now;
          case "inactive":
            return !voucher.isActive;
          case "upcoming":
            return new Date(voucher.validFrom) > now;
          default:
            return true;
        }
      });
    }

    setFilteredVouchers(filtered);
    setCurrentPage(1);
  };

  const validateForm = (): boolean => {
    const errors: Partial<VoucherPayload> = {};

    if (!formData.code.trim()) {
      errors.code = "Voucher code is required";
    } else if (formData.code.trim().length < 3) {
      errors.code = "Code must be at least 3 characters long";
    }

    if (!formData.name.trim()) {
      errors.name = "Voucher name is required";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }

    // if (formData.discountValue <= 0) {
    //   errors.discountValue = "Discount value must be greater than 0";
    // }

    // if (formData.discountType === "PERCENTAGE" && formData.discountValue > 100) {
    //   errors.discountValue = "Percentage discount cannot exceed 100%";
    // }

    // if (formData.minPurchase < 0) {
    //   errors.minPurchase = "Minimum purchase cannot be negative";
    // }

    if (!formData.validFrom) {
      errors.validFrom = "Valid from date is required";
    }

    if (!formData.validUntil) {
      errors.validUntil = "Valid until date is required";
    }

    if (formData.validFrom && formData.validUntil) {
      if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
        errors.validUntil = "Valid until must be after valid from date";
      }
    }

    // if (formData.usageLimit <= 0) {
    //   errors.usageLimit = "Usage limit must be greater than 0";
    // }

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

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      name: voucher.name,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      minPurchase: voucher.minPurchase,
      maxDiscount: voucher.maxDiscount || 0,
      validFrom: voucher.validFrom.split("T")[0],
      validUntil: voucher.validUntil.split("T")[0],
      usageLimit: voucher.usageLimit,
      isActive: voucher.isActive,
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
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

  const handleBulkDelete = async () => {
    try {
      // Simulate API call for bulk delete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showSuccess(`${selectedVouchers.length} vouchers deleted successfully`);
      setShowBulkDeleteConfirm(false);
      setSelectedVouchers([]);
      fetchVouchers();
    } catch (error) {
      showError("Error", "Failed to delete vouchers");
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingVoucher(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      minPurchase: 0,
      maxDiscount: 0,
      validFrom: "",
      validUntil: "",
      usageLimit: 1,
      isActive: true,
    });
    setFormErrors({});
  };

  const handleInputChange = (field: keyof VoucherPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSelectVoucher = (id: string) => {
    setSelectedVouchers((prev) =>
      prev.includes(id)
        ? prev.filter((voucherId) => voucherId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedVouchers.length === paginatedVouchers.length) {
      setSelectedVouchers([]);
    } else {
      setSelectedVouchers(paginatedVouchers.map((v) => v.id));
    }
  };

  const getVoucherStatus = (voucher: Voucher) => {
    const now = new Date();
    const validFrom = new Date(voucher.validFrom);
    const validUntil = new Date(voucher.validUntil);

    if (!voucher.isActive)
      return { status: "inactive", color: "bg-gray-100 text-gray-800" };
    if (validFrom > now)
      return { status: "upcoming", color: "bg-blue-100 text-blue-800" };
    if (validUntil < now)
      return { status: "expired", color: "bg-red-100 text-red-800" };
    if (voucher.usedCount >= voucher.usageLimit)
      return { status: "used up", color: "bg-orange-100 text-orange-800" };
    return { status: "active", color: "bg-green-100 text-green-800" };
  };

  const getDiscountDisplay = (voucher: Voucher) => {
    if (voucher.discountType === "PERCENTAGE") {
      return `${voucher.discountValue}%`;
    } else {
      return formatCurrency(voucher.discountValue);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVouchers = filteredVouchers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Stats calculation
  const stats = {
    total: vouchers.length,
    active: vouchers.filter((v) => {
      const now = new Date();
      return (
        v.isActive &&
        new Date(v.validFrom) <= now &&
        new Date(v.validUntil) >= now &&
        v.usedCount < v.usageLimit
      );
    }).length,
    expired: vouchers.filter((v) => new Date(v.validUntil) < new Date()).length,
    totalUsage: vouchers.reduce((sum, v) => sum + v.usedCount, 0),
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
            Manajemen Voucher
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Kelola voucher diskon dan promosi
          </p>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          {selectedVouchers.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center"
            >
              <Trash2 className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden md:inline">
                Hapus ({selectedVouchers.length})
              </span>
              <span className="md:hidden">({selectedVouchers.length})</span>
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
            <span className="hidden md:inline">Tambah Voucher</span>
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
                  Total Vouchers
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Gift className="w-6 h-6 text-blue-600" />
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
                <Tag className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.expired}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usage</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalUsage}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
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
                placeholder="Search vouchers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="pt-4 flex items-center space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="inactive">Inactive</option>
                <option value="upcoming">Upcoming</option>
              </select>

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
          {(searchTerm || statusFilter !== "all") && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mr-2">Active filters:</p>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Status: {statusFilter}
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
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1}-
          {Math.min(startIndex + itemsPerPage, filteredVouchers.length)} of{" "}
          {filteredVouchers.length} vouchers
        </p>

        {filteredVouchers.length > 0 && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={
                selectedVouchers.length === paginatedVouchers.length &&
                paginatedVouchers.length > 0
              }
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Select all</span>
          </div>
        )}
      </div>

      {/* Vouchers Display */}
      {filteredVouchers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No vouchers found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search criteria"
                : "Get started by adding your first voucher"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button
                variant="black"
                size="sm"
                onClick={() => setShowDialog(true)}
                className="flex items-center mx-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Voucher
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedVouchers.map((voucher) => {
            const status = getVoucherStatus(voucher);

            return (
              <Card
                key={voucher.id}
                className="hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 group"
              >
                {/* Selection Checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedVouchers.includes(voucher.id)}
                    onChange={() => handleSelectVoucher(voucher.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <CardContent className="p-6">
                  <div className="pt-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                            <Gift className="w-5 h-5 text-white" />
                          </div>
                          <Badge className={status.color}>
                            {status.status}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {voucher.name}
                        </h3>
                        <p className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                          {voucher.code}
                        </p>
                      </div>
                    </div>

                    {/* Discount Info */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600">Discount</p>
                          <p className="text-2xl font-bold text-green-800">
                            {getDiscountDisplay(voucher)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-600">Min Purchase</p>
                          <p className="text-lg font-semibold text-green-800">
                            {formatCurrency(voucher.minPurchase)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {voucher.description}
                    </p>

                    {/* Usage Stats */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Usage</span>
                        <span className="font-medium">
                          {voucher.usedCount}/{voucher.usageLimit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (voucher.usedCount / voucher.usageLimit) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Validity Period */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Valid:{" "}
                        {new Date(
                          voucher.validFrom
                        ).toLocaleDateString()} -{" "}
                        {new Date(voucher.validUntil).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(voucher)}
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
                              voucher: voucher,
                            })
                          }
                          className="hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
              {paginatedVouchers.map((voucher) => {
                const status = getVoucherStatus(voucher);

                return (
                  <div
                    key={voucher.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedVouchers.includes(voucher.id)}
                          onChange={() => handleSelectVoucher(voucher.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                          <Gift className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {voucher.name}
                            </h3>
                            <Badge className={status.color}>
                              {status.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 font-mono">
                            {voucher.code}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {voucher.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {getDiscountDisplay(voucher)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Min: {formatCurrency(voucher.minPurchase)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Usage</p>
                          <p className="font-semibold">
                            {voucher.usedCount}/{voucher.usageLimit}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(voucher)}
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
                                voucher: voucher,
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVoucher ? "Edit Voucher" : "Add New Voucher"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voucher Code *
                </label>
                <Input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    handleInputChange("code", e.target.value.toUpperCase())
                  }
                  placeholder="e.g., SAVE20, NEWUSER"
                  className={formErrors.code ? "border-red-500" : ""}
                />
                {formErrors.code && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voucher Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter voucher name"
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Enter voucher description"
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.description ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type *
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) =>
                    handleInputChange(
                      "discountType",
                      e.target.value as "PERCENTAGE" | "FIXED"
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (Rp)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value *
                </label>
                <Input
                  type="number"
                  value={formData.discountValue.toString()}
                  onChange={(e) =>
                    handleInputChange(
                      "discountValue",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder={
                    formData.discountType === "PERCENTAGE" ? "20" : "50000"
                  }
                  min="0"
                  max={
                    formData.discountType === "PERCENTAGE" ? "100" : undefined
                  }
                  className={formErrors.discountValue ? "border-red-500" : ""}
                />
                {formErrors.discountValue && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.discountValue}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Purchase (Rp) *
                </label>
                <Input
                  type="number"
                  value={formData.minPurchase.toString()}
                  onChange={(e) =>
                    handleInputChange(
                      "minPurchase",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="100000"
                  min="0"
                  className={formErrors.minPurchase ? "border-red-500" : ""}
                />
                {formErrors.minPurchase && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.minPurchase}
                  </p>
                )}
              </div>
            </div>

            {formData.discountType === "PERCENTAGE" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Discount (Rp)
                </label>
                <Input
                  type="number"
                  value={formData.maxDiscount?.toString() || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "maxDiscount",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="500000"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for no maximum limit
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid From *
                </label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) =>
                    handleInputChange("validFrom", e.target.value)
                  }
                  className={formErrors.validFrom ? "border-red-500" : ""}
                />
                {formErrors.validFrom && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.validFrom}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until *
                </label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) =>
                    handleInputChange("validUntil", e.target.value)
                  }
                  className={formErrors.validUntil ? "border-red-500" : ""}
                />
                {formErrors.validUntil && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.validUntil}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usage Limit *
                </label>
                <Input
                  type="number"
                  value={formData.usageLimit.toString()}
                  onChange={(e) =>
                    handleInputChange(
                      "usageLimit",
                      parseInt(e.target.value) || 1
                    )
                  }
                  placeholder="100"
                  min="1"
                  className={formErrors.usageLimit ? "border-red-500" : ""}
                />
                {formErrors.usageLimit && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.usageLimit}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  handleInputChange("isActive", e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700"
              >
                Active voucher
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
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
                    {editingVoucher ? "Updating..." : "Creating..."}
                  </>
                ) : editingVoucher ? (
                  "Update Voucher"
                ) : (
                  "Create Voucher"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, voucher: null })}
        onConfirm={handleDelete}
        title="Delete Voucher"
        message={`Are you sure you want to delete "${deleteConfirmation.voucher?.name}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Vouchers"
        message={`Are you sure you want to delete ${selectedVouchers.length} selected vouchers? This action cannot be undone.`}
        type="danger"
        confirmText="Delete All"
        cancelText="Cancel"
      />
    </div>
  );
}
