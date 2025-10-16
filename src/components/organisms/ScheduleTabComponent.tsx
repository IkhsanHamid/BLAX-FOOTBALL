"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
} from "lucide-react";
import Button from "@/components/atoms/Button";
import { Card, CardContent } from "@/components/atoms/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/Dialog";
import Input from "@/components/atoms/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/Table";
import Badge from "@/components/atoms/Badge";
import { ScheduleOverview } from "@/types/schedule";
import { scheduleService } from "@/utils/schedule";
import { adminService } from "@/utils/admin";
import { masterDataService, Rule } from "@/utils/masterData";
import { formatDate, getDateRange } from "@/lib/helper";
import ConfirmationModal from "../molecules/ConfirmationModal";
import Pagination from "../atoms/Pagination";
import { TableLoadingSkeleton } from "./LoadingSkeleton";
import ImageUpload from "../atoms/ImageUpload";

// Constants
const ITEMS_PER_PAGE = 10;
const SLOTS_PER_TEAM = { FUTSAL: 5, "MINI-SOCCER": 7, FOOTBALL: 11 };
const EVENT_TYPES = ["FUN GAME"];
const MATCH_TYPES = ["FUTSAL", "MINI-SOCCER", "FOOTBALL"];
const STATUS_OPTIONS = ["all", "ACTIVE", "COMPLETED", "CANCELLED"];
const DATE_FILTERS = ["all", "today", "week", "month"];

// Types
interface ScheduleTabProps {
  showError: (title: string, message: string) => void;
  showSuccess: (message: string) => void;
}

interface Venue {
  id: string;
  name: string;
  address?: string;
}

interface Facility {
  id: string;
  name: string;
  description?: string;
}

interface ScheduleForm {
  name: string;
  date: string;
  time: string;
  venueId: string;
  totalTeams: string;
  totalSlots: string;
  feePlayer: string;
  feeGk: string;
  typeEvent: string;
  typeMatch: string;
  image: File | string | null;
  facilityIds: string[];
  ruleIds: string[];
}

const initialFormState: ScheduleForm = {
  name: "",
  date: "",
  time: "",
  venueId: "",
  totalTeams: "4",
  totalSlots: "16",
  feePlayer: "",
  feeGk: "",
  typeEvent: "",
  typeMatch: "",
  image: "",
  facilityIds: [],
  ruleIds: [],
};

// Helper Components
const StatCard = ({ title, value, icon: Icon, bgColor, iconColor }: any) => (
  <Card className="hover:shadow-lg transition-shadow duration-200">
    <CardContent className="p-6">
      <div className="pt-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 ${bgColor} rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const FilterBadge = ({ label, value, onRemove }: any) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
    {label}: {value}
    <button onClick={onRemove} className="ml-1 hover:text-blue-600">
      ×
    </button>
  </span>
);

const EmptyState = ({ hasFilters, onAddSchedule }: any) => (
  <div className="text-center py-12">
    <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Tidak ada jadwal
    </h3>
    <p className="text-gray-600 mb-6">
      {hasFilters ? "Coba sesuaikan lagi pencarianmu" : "Buat jadwal pertamamu"}
    </p>
    {!hasFilters && (
      <Button
        variant="black"
        onClick={onAddSchedule}
        className="flex items-center mx-auto"
      >
        <Plus className="w-4 h-4 mr-2" />
        Tambah Jadwal Pertama
      </Button>
    )}
  </div>
);

const formatCurrency = (value: string): string => {
  if (!value) return "";
  return Number(value).toLocaleString("id-ID");
};

// Main Component
export default function ScheduleTab({
  showError,
  showSuccess,
}: ScheduleTabProps) {
  // State Management
  const [schedules, setSchedules] = useState<ScheduleOverview[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<
    ScheduleOverview[]
  >([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);

  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<ScheduleOverview | null>(null);
  const [scheduleToDelete, setScheduleToDelete] =
    useState<ScheduleOverview | null>(null);
  const [scheduleForm, setScheduleForm] =
    useState<ScheduleForm>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [venueFilter, setVenueFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Data Fetching
  const fetchScheduleOverview = useCallback(async () => {
    try {
      setIsLoading(true);
      const { startDate, endDate } = getDateRange(dateFilter);
      const result = await adminService.scheduleOverview(startDate, endDate);
      setSchedules(result);
    } catch (error) {
      showError("Error", "Failed to load schedule overview");
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, showError]);

  const handleFeeChange = (field: "feePlayer" | "feeGk", value: string) => {
    // Remove non-numeric characters except digits
    const numericValue = value.replace(/\D/g, "");

    setScheduleForm((prev) => ({
      ...prev,
      [field]: numericValue,
    }));

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const fetchMasterData = useCallback(async () => {
    try {
      const [venuesData, facilitiesData, rulesData] = await Promise.all([
        masterDataService.getVenues(""),
        masterDataService.getFacilities("", 1, 100),
        masterDataService.getRules("", 1, 10),
      ]);
      setVenues(venuesData);
      setFacilities(facilitiesData.data);
      setRules(rulesData);
    } catch (error) {
      showError("Error", "Failed to load master data");
    }
  }, [showError]);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  useEffect(() => {
    fetchScheduleOverview();
  }, [fetchScheduleOverview]);

  // Filtering
  useEffect(() => {
    let filtered = schedules;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.venue.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (venueFilter !== "all") {
      filtered = filtered.filter((s) => s.venue === venueFilter);
    }

    setFilteredSchedules(filtered);
    setCurrentPage(1);
  }, [schedules, searchTerm, statusFilter, venueFilter]);

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const requiredFields = {
      name: "Schedule name is required",
      date: "Date is required",
      time: "Time is required",
      venueId: "Venue is required",
      feePlayer: "Player fee is required",
      feeGk: "Goalkeeper fee is required",
      typeEvent: "Event type is required",
      typeMatch: "Match type is required",
      image: "Match image is required",
    };

    Object.entries(requiredFields).forEach(([field, message]) => {
      if (!scheduleForm[field as keyof ScheduleForm]) {
        errors[field] = message;
      }
    });

    if (scheduleForm.facilityIds.length === 0) {
      errors.facilityIds = "At least one facility must be selected";
    }

    if (scheduleForm.ruleIds.length === 0) {
      errors.ruleIds = "At least one rule must be selected";
    }

    // Numeric validation
    ["feePlayer", "feeGk"].forEach((field) => {
      const value = scheduleForm[field as keyof ScheduleForm];
      if (value && (isNaN(Number(value)) || Number(value) < 0)) {
        errors[field] = `${
          field === "feePlayer" ? "Player" : "Goalkeeper"
        } fee must be a positive number`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Handlers
  const handleFormChange = (field: string, value: string) => {
    setScheduleForm((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate slots
      if (field === "typeMatch" || field === "totalTeams") {
        const matchType = field === "typeMatch" ? value : prev.typeMatch;
        const slots =
          SLOTS_PER_TEAM[matchType as keyof typeof SLOTS_PER_TEAM] || 0;
        const teams = Number(field === "totalTeams" ? value : prev.totalTeams);
        updated.totalSlots = (slots * teams).toString();
      }

      return updated;
    });

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleArrayChange = (
    field: "facilityIds" | "ruleIds",
    id: string,
    checked: boolean
  ) => {
    setScheduleForm((prev) => ({
      ...prev,
      [field]: checked
        ? [...prev[field], id]
        : prev[field].filter((i) => i !== id),
    }));

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const resetForm = () => {
    setScheduleForm(initialFormState);
    setFormErrors({});
    setEditingSchedule(null);
  };

  // CRUD Operations
  const handleSaveSchedule = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(scheduleForm).forEach(([key, value]) => {
        if (key === "totalSlots") return;
        if (key === "facilityIds" || key === "ruleIds") {
          (value as string[]).forEach((id) => formData.append(`${key}[]`, id));
        } else if (key === "image" && value) {
          formData.append("imageUrl", value as File);
        } else if (key === "totalTeams") {
          formData.append("team", value as string);
        } else if (value) {
          formData.append(key, value as string);
        }
      });

      if (editingSchedule) {
        await adminService.updateSchedule(editingSchedule.id, formData);
      } else {
        await adminService.createSchedule(formData);
      }
      showSuccess(
        `Schedule ${editingSchedule ? "updated" : "created"} successfully!`
      );
      setShowScheduleDialog(false);
      resetForm();
      fetchScheduleOverview();
    } catch (error) {
      showError("Error", "Failed to save schedule");
    } finally {
      setIsSubmitting(false);
    }
  };
  console.log("editingSchedule", editingSchedule);

  const handleEditSchedule = (schedule: ScheduleOverview) => {
    const venue = venues.find((v) => v.name === schedule.venue);
    setEditingSchedule(schedule);
    setScheduleForm({
      ...schedule,
      venueId: venue?.id || "",
      totalTeams: String(schedule.team),
      totalSlots: String(schedule.totalSlots),
      feePlayer: String(schedule.feePlayer),
      feeGk: String(schedule.feeGk),
      image: String(schedule.image),
      facilityIds:
        schedule.facilities?.map((f: any) =>
          typeof f === "string" ? f : f.id
        ) || [],
      ruleIds:
        schedule.rules?.map((r: any) => (typeof r === "string" ? r : r.id)) ||
        [],
    });
    setShowScheduleDialog(true);
  };

  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    setIsDeleting(true);
    try {
      await adminService.deleteSchedule(scheduleToDelete.id);
      showSuccess("Schedule deleted successfully!");
      setShowDeleteConfirm(false);
      setScheduleToDelete(null);
      fetchScheduleOverview();
    } catch (error) {
      showError("Error", "Failed to delete schedule");
    } finally {
      setIsDeleting(false);
    }
  };

  // Computed Values
  const stats = {
    total: schedules.length,
    active: schedules.filter((s) => s.status === "active").length,
    completed: schedules.filter((s) => s.status === "completed").length,
    totalRevenue: schedules.reduce((sum, s) => sum + s.revenue, 0),
  };

  const uniqueVenues = [...new Set(schedules.map((s) => s.venue))];
  const hasActiveFilters =
    searchTerm || statusFilter !== "all" || venueFilter !== "all";

  const totalPages = Math.ceil(filteredSchedules.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSchedules = filteredSchedules.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  if (isLoading) return <TableLoadingSkeleton />;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Manajemen Jadwal
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Kelola jadwal pertandingan sepak bola dan booking
          </p>
        </div>
        <Button
          variant="black"
          size="sm"
          onClick={() => setShowScheduleDialog(true)}
        >
          <Plus className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Tambah Jadwal</span>
          <span className="md:hidden">Tambah</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Schedules"
          value={stats.total}
          icon={Calendar}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Active Schedules"
          value={stats.active}
          icon={Clock}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={Users}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Total Revenue"
          value={`Rp ${(stats.totalRevenue / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          bgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="pt-4 flex-1 relative">
              <Search className="absolute left-3 top-9 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search schedules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Status</option>
                {STATUS_OPTIONS.slice(1).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Time</option>
                {DATE_FILTERS.slice(1).map((d) => (
                  <option key={d} value={d}>
                    {d === "today"
                      ? "Today"
                      : d === "week"
                      ? "This Week"
                      : "This Month"}
                  </option>
                ))}
              </select>
              <select
                value={venueFilter}
                onChange={(e) => setVenueFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Venues</option>
                {uniqueVenues.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mr-2">Active filters:</p>
              {searchTerm && (
                <FilterBadge
                  label="Search"
                  value={searchTerm}
                  onRemove={() => setSearchTerm("")}
                />
              )}
              {statusFilter !== "all" && (
                <FilterBadge
                  label="Status"
                  value={statusFilter}
                  onRemove={() => setStatusFilter("all")}
                />
              )}
              {venueFilter !== "all" && (
                <FilterBadge
                  label="Venue"
                  value={venueFilter}
                  onRemove={() => setVenueFilter("all")}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Info */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1}-
          {Math.min(startIndex + ITEMS_PER_PAGE, filteredSchedules.length)} of{" "}
          {filteredSchedules.length} schedules
        </p>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredSchedules.length === 0 ? (
            <EmptyState
              hasFilters={hasActiveFilters}
              onAddSchedule={() => setShowScheduleDialog(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{schedule.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(schedule.date)} • {schedule.time} WIB
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                        {schedule.venue}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-1" />
                        {schedule.team} teams ({schedule.totalSlots} slots)
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {schedule.bookedSlots}/{schedule.totalSlots}
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (schedule.bookedSlots / schedule.totalSlots) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round(
                            (schedule.bookedSlots / schedule.totalSlots) * 100
                          )}
                          %
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-green-600">
                        Rp {schedule.revenue.toLocaleString("id-ID")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          schedule.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : schedule.status === "CANCELLED"
                            ? "bg-red-400 text-white"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {schedule.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditSchedule(schedule)}
                          disabled={
                            schedule.status === "CANCELLED" ||
                            schedule.status === "COMPLETED"
                          }
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setScheduleToDelete(schedule);
                            setShowDeleteConfirm(true);
                          }}
                          disabled={
                            schedule.status === "CANCELLED" ||
                            schedule.status === "COMPLETED"
                          }
                          className="text-red-600"
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

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? "Edit Jadwal" : "Tambah Jadwal Baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nama Jadwal <span className="text-red-500">*</span>
              </label>
              <Input
                value={scheduleForm.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => handleFormChange("date", e.target.value)}
                  className={formErrors.date ? "border-red-500" : ""}
                />
                {formErrors.date && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Jam <span className="text-red-500">*</span>
                </label>
                <Input
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => handleFormChange("time", e.target.value)}
                  className={formErrors.time ? "border-red-500" : ""}
                />
                {formErrors.time && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.time}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Venue <span className="text-red-500">*</span>
              </label>
              <select
                value={scheduleForm.venueId}
                onChange={(e) => handleFormChange("venueId", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg ${
                  formErrors.venueId ? "border-red-500" : ""
                }`}
              >
                <option value="">Select venue</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              {formErrors.venueId && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.venueId}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Event Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={scheduleForm.typeEvent}
                  onChange={(e) =>
                    handleFormChange("typeEvent", e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-lg ${
                    formErrors.typeEvent ? "border-red-500" : ""
                  }`}
                >
                  <option value="">Select event type</option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Match Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={scheduleForm.typeMatch}
                  onChange={(e) =>
                    handleFormChange("typeMatch", e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-lg ${
                    formErrors.typeMatch ? "border-red-500" : ""
                  }`}
                >
                  <option value="">Select match type</option>
                  {MATCH_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("-", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Total Teams <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={scheduleForm.totalTeams}
                  onChange={(e) =>
                    handleFormChange("totalTeams", e.target.value)
                  }
                  min="2"
                  disabled={!scheduleForm.typeMatch}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Total Slots
                </label>
                <Input
                  type="number"
                  value={scheduleForm.totalSlots}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Player Fee (Rp) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 75.000"
                  value={formatCurrency(scheduleForm.feePlayer)}
                  onChange={(e) => handleFeeChange("feePlayer", e.target.value)}
                  className={formErrors.feePlayer ? "border-red-500" : ""}
                />
                {formErrors.feePlayer && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.feePlayer}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Goalkeeper Fee (Rp) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 50.000"
                  value={formatCurrency(scheduleForm.feeGk)}
                  onChange={(e) => handleFeeChange("feeGk", e.target.value)}
                  className={formErrors.feeGk ? "border-red-500" : ""}
                />
                {formErrors.feeGk && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.feeGk}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                Match Image <span className="text-red-500">*</span>
              </label>
              <ImageUpload
                value={scheduleForm.image ?? undefined}
                onChange={(file) => {
                  setScheduleForm((prev) => ({ ...prev, image: file }));
                  setFormErrors((prev) => ({ ...prev, image: "" }));
                }}
                error={formErrors.image}
                maxSize={5}
                acceptedTypes={["image/jpeg", "image/png", "image/gif"]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                Fasilitas <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {facilities.map((f) => (
                  <label
                    key={f.id}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={scheduleForm.facilityIds.includes(f.id)}
                      onChange={(e) =>
                        handleArrayChange("facilityIds", f.id, e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm font-medium">{f.name}</span>
                  </label>
                ))}
              </div>
              {formErrors.facilityIds && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.facilityIds}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                Rules <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {rules.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={scheduleForm.ruleIds.includes(r.id)}
                      onChange={(e) =>
                        handleArrayChange("ruleIds", r.id, e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm font-medium">{r.description}</span>
                  </label>
                ))}
              </div>
              {formErrors.ruleIds && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.ruleIds}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowScheduleDialog(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="black"
                size="sm"
                onClick={handleSaveSchedule}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingSchedule ? "Updating..." : "Creating..."}
                  </>
                ) : editingSchedule ? (
                  "Update Schedule"
                ) : (
                  "Create Schedule"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setScheduleToDelete(null);
        }}
        onConfirm={handleDeleteSchedule}
        title="Delete Schedule"
        message={`Are you sure you want to delete "${scheduleToDelete?.name}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </div>
  );
}
