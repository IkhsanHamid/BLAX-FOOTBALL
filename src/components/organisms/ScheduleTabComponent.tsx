"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  Lock,
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
import { useAuth } from "@/contexts/AuthContext";

// Constants
const ITEMS_PER_PAGE = 10;
const SLOTS_PER_TEAM = {
  FUTSAL: 5,
  "MINI-SOCCER": 7,
  FOOTBALL: 11,
  "MINI-SOCCER-BEKASI": 8,
};
const EVENT_TYPES = ["FUN GAME", "TOURNAMENT"];
const MATCH_TYPES = ["PADEL", "MINI-SOCCER", "FOOTBALL", "MINI-SOCCER-BEKASI"];
const STATUS_OPTIONS = ["all", "ACTIVE", "COMPLETED", "CANCELLED"];
const DATE_FILTERS = ["all", "today", "week", "month"];
const PADEL_MATCH_TYPE = "PADEL";
const COMMUNITY_OPTIONS = ["blax", "magnifico"];

const DATE_FILTER_LABELS = {
  today: "Today",
  week: "This Week",
  month: "This Month",
};

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
  totalTeams: number;
  totalSlots: number;
  feePlayer: string;
  feeGk: string;
  typeEvent: string;
  typeMatch: string;
  image: File | string | null;
  facilityIds: string[];
  ruleIds: string[];
  community: string;
}

const initialFormState: ScheduleForm = {
  name: "",
  date: "",
  time: "",
  venueId: "",
  totalTeams: 4,
  totalSlots: 16,
  feePlayer: "",
  feeGk: "",
  typeEvent: "",
  typeMatch: "",
  image: "",
  facilityIds: [],
  ruleIds: [],
  community: "",
};

// Helper Components
const StatCard = React.memo(
  ({ title, value, icon: Icon, bgColor, iconColor }: any) => (
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
  ),
);

const FilterBadge = React.memo(({ label, value, onRemove }: any) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
    {label}: {value}
    <button onClick={onRemove} className="ml-1 hover:text-blue-600">
      ×
    </button>
  </span>
));

const EmptyState = React.memo(({ hasFilters, onAddSchedule }: any) => (
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
));

const formatCurrency = (value: string): string => {
  if (!value) return "";
  return Number(value).toLocaleString("id-ID");
};

// Main Component
export default function ScheduleTab({
  showError,
  showSuccess,
}: ScheduleTabProps) {
  const { user } = useAuth();

  // State Management
  const [schedules, setSchedules] = useState<ScheduleOverview[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);

  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<ScheduleOverview | null>(null);
  const [lockingSchedule, setLockingSchedule] =
    useState<ScheduleOverview | null>(null);
  const [scheduleToDelete, setScheduleToDelete] =
    useState<ScheduleOverview | null>(null);
  const [scheduleForm, setScheduleForm] =
    useState<ScheduleForm>(initialFormState);
  const [lockSlotCounts, setLockSlotCounts] = useState({
    gk: "",
    player: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [venueFilter, setVenueFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLocked, setIsLoadingLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Helper function to check if schedule is within H-3
  const isWithinH3 = useCallback((scheduleDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedule = new Date(scheduleDate);
    schedule.setHours(0, 0, 0, 0);

    const diffTime = schedule.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 3;
  }, []);

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

  // Memoized Computed Values
  const stats = useMemo(
    () => ({
      total: schedules.length,
      active: schedules.filter((s) => s.status === "active").length,
      completed: schedules.filter((s) => s.status === "completed").length,
      totalRevenue: schedules.reduce((sum, s) => sum + s.revenue, 0),
    }),
    [schedules],
  );

  const uniqueVenues = useMemo(
    () => [...new Set(schedules.map((s) => s.venue))],
    [schedules],
  );

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchesSearch =
        !searchTerm ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.venue.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      const matchesVenue = venueFilter === "all" || s.venue === venueFilter;

      return matchesSearch && matchesStatus && matchesVenue;
    });
  }, [schedules, searchTerm, statusFilter, venueFilter]);

  const hasActiveFilters =
    searchTerm || statusFilter !== "all" || venueFilter !== "all";

  const { paginatedSchedules, totalPages, startIndex } = useMemo(() => {
    const total = Math.ceil(filteredSchedules.length / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = filteredSchedules.slice(start, start + ITEMS_PER_PAGE);

    return {
      paginatedSchedules: paginated,
      totalPages: total,
      startIndex: start,
    };
  }, [filteredSchedules, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, venueFilter]);

  // Form Handlers
  const handleFeeChange = useCallback(
    (field: "feePlayer" | "feeGk", value: string) => {
      const numericValue = value.replace(/\D/g, "");
      setScheduleForm((prev) => ({ ...prev, [field]: numericValue }));
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    },
    [],
  );

  const handleFormChange = useCallback((field: string, value: string) => {
    setScheduleForm((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "typeMatch") {
        const isPadel = value === PADEL_MATCH_TYPE;
        if (isPadel) {
          updated.totalTeams = 0;
        } else {
          const slots =
            SLOTS_PER_TEAM[value as keyof typeof SLOTS_PER_TEAM] || 0;
          updated.totalSlots = slots * prev.totalTeams;
        }
      } else if (
        field === "totalTeams" &&
        prev.typeMatch !== PADEL_MATCH_TYPE
      ) {
        const slots =
          SLOTS_PER_TEAM[prev.typeMatch as keyof typeof SLOTS_PER_TEAM] || 0;
        updated.totalSlots = slots * Number(value);
      }

      return updated;
    });

    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const handleArrayChange = useCallback(
    (field: "facilityIds" | "ruleIds", id: string, checked: boolean) => {
      setScheduleForm((prev) => ({
        ...prev,
        [field]: checked
          ? [...prev[field], id]
          : prev[field].filter((i) => i !== id),
      }));
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setScheduleForm(initialFormState);
    setFormErrors({});
    setEditingSchedule(null);
  }, []);

  const handleLockSlots = useCallback((schedule: ScheduleOverview) => {
    setLockingSchedule(schedule);
    setLockSlotCounts({ gk: "", player: "" });
    setShowLockDialog(true);
  }, []);

  const handleConfirmLockSlots = useCallback(async () => {
    if (!lockingSchedule) return;

    setIsLoadingLocked(true);

    const countGk = parseInt(lockSlotCounts.gk) || 0;
    const countPlayer = parseInt(lockSlotCounts.player) || 0;

    const availableSlotsGk =
      lockingSchedule.totalSlots -
      lockingSchedule.bookedSlots -
      (lockingSchedule.lockedSlotsGk || 0);

    const availableSlotsPlayer =
      lockingSchedule.totalSlots -
      lockingSchedule.bookedSlots -
      (lockingSchedule.lockedSlotsPlayer || 0);

    if (countGk > availableSlotsGk) {
      showError("Error", `Only ${availableSlotsGk} GK slots available to lock`);
      setIsLoadingLocked(false);
      return;
    }

    if (countPlayer > availableSlotsPlayer) {
      showError(
        "Error",
        `Only ${availableSlotsPlayer} player slots available to lock`,
      );
      setIsLoadingLocked(false);
      return;
    }

    try {
      await adminService.lockSlots(lockingSchedule.id, countGk, countPlayer);
      setShowLockDialog(false);
      setLockingSchedule(null);
      setLockSlotCounts({ gk: "", player: "" });
      showSuccess("Slots locked successfully!");
      fetchScheduleOverview();
    } catch (error) {
      showError("Error", "Failed to lock slots");
    } finally {
      setIsLoadingLocked(false);
    }
  }, [
    lockingSchedule,
    lockSlotCounts,
    showError,
    showSuccess,
    fetchScheduleOverview,
  ]);

  // Form Validation
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    const requiredFields = {
      name: "Schedule name is required",
      date: "Date is required",
      time: "Time is required",
      venueId: "Venue is required",
      feePlayer: "Player fee is required",
      ...(scheduleForm.typeMatch !== PADEL_MATCH_TYPE && {
        feeGk: "Goalkeeper fee is required",
      }),
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
  }, [scheduleForm]);

  // CRUD Operations
  const handleSaveSchedule = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      formData.append("name", scheduleForm.name);
      formData.append("date", scheduleForm.date);
      formData.append("time", scheduleForm.time);
      formData.append("venueId", scheduleForm.venueId);
      formData.append(
        "team",
        scheduleForm.typeMatch === PADEL_MATCH_TYPE
          ? String(scheduleForm.totalSlots)
          : String(scheduleForm.totalTeams),
      );
      formData.append("feePlayer", scheduleForm.feePlayer);
      formData.append(
        "feeGk",
        scheduleForm.typeMatch === PADEL_MATCH_TYPE ? "0" : scheduleForm.feeGk,
      );
      formData.append("typeEvent", scheduleForm.typeEvent);
      formData.append("typeMatch", scheduleForm.typeMatch);
      formData.append("community", scheduleForm.community);

      if (scheduleForm.image) {
        formData.append("imageUrl", scheduleForm.image as File);
      }

      scheduleForm.facilityIds.forEach((id) =>
        formData.append("facilityIds[]", id),
      );
      scheduleForm.ruleIds.forEach((id) => formData.append("ruleIds[]", id));

      if (editingSchedule) {
        await adminService.updateSchedule(editingSchedule.id, formData);
      } else {
        await adminService.createSchedule(formData);
      }

      showSuccess(
        `Schedule ${editingSchedule ? "updated" : "created"} successfully!`,
      );
      setShowScheduleDialog(false);
      resetForm();
      fetchScheduleOverview();
    } catch (error) {
      showError("Error", "Failed to save schedule");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    scheduleForm,
    editingSchedule,
    validateForm,
    showSuccess,
    showError,
    resetForm,
    fetchScheduleOverview,
  ]);

  const handleEditSchedule = useCallback(
    (schedule: ScheduleOverview) => {
      const venue = venues.find((v) => v.name === schedule.venue);
      setEditingSchedule(schedule);
      setScheduleForm({
        name: schedule.name,
        date: schedule.date,
        time: schedule.time,
        venueId: venue?.id || "",
        totalTeams: Number(schedule.team),
        totalSlots: schedule.totalSlots,
        feePlayer: String(schedule.feePlayer),
        feeGk: String(schedule.feeGk),
        typeEvent: schedule.typeEvent,
        typeMatch: schedule.typeMatch,
        image: String(schedule.image),
        facilityIds:
          schedule.facilities?.map((f: any) =>
            typeof f === "string" ? f : f.id,
          ) || [],
        ruleIds:
          schedule.rules?.map((r: any) => (typeof r === "string" ? r : r.id)) ||
          [],
        community: schedule.community || "",
      });
      setShowScheduleDialog(true);
    },
    [venues, isWithinH3, showError],
  );

  const handleDeleteSchedule = useCallback(async () => {
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
  }, [scheduleToDelete, showSuccess, showError, fetchScheduleOverview]);

  const removeFilter = useCallback(
    (filterType: "search" | "status" | "venue") => {
      switch (filterType) {
        case "search":
          setSearchTerm("");
          break;
        case "status":
          setStatusFilter("all");
          break;
        case "venue":
          setVenueFilter("all");
          break;
      }
    },
    [],
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
        {user?.role === "Owner" && (
          <StatCard
            title="Total Revenue"
            value={`Rp ${(stats.totalRevenue / 1000000).toFixed(1)}M`}
            icon={DollarSign}
            bgColor="bg-yellow-100"
            iconColor="text-yellow-600"
          />
        )}
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
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? "All Status" : s}
                  </option>
                ))}
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                {DATE_FILTERS.map((d) => (
                  <option key={d} value={d}>
                    {d === "all"
                      ? "All Time"
                      : DATE_FILTER_LABELS[
                          d as keyof typeof DATE_FILTER_LABELS
                        ]}
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
                  onRemove={() => removeFilter("search")}
                />
              )}
              {statusFilter !== "all" && (
                <FilterBadge
                  label="Status"
                  value={statusFilter}
                  onRemove={() => removeFilter("status")}
                />
              )}
              {venueFilter !== "all" && (
                <FilterBadge
                  label="Venue"
                  value={venueFilter}
                  onRemove={() => removeFilter("venue")}
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
                  <TableHead>Community</TableHead>
                  {user?.role === "Owner" && <TableHead>Revenue</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSchedules.map((schedule) => {
                  const isDisabled =
                    schedule.status === "CANCELLED" ||
                    schedule.status === "COMPLETED";
                  const totalLockedSlots =
                    (schedule.lockedSlotsGk || 0) +
                    (schedule.lockedSlotsPlayer || 0);

                  const bookingPercentage = Math.round(
                    ((schedule.bookedSlots + totalLockedSlots) /
                      schedule.totalSlots) *
                      100,
                  );

                  return (
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
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">
                              {schedule.bookedSlots +
                                (schedule.lockedSlotsGk || 0) +
                                (schedule.lockedSlotsPlayer || 0)}
                              /{schedule.totalSlots}
                            </span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${bookingPercentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {bookingPercentage}%
                            </span>
                          </div>
                          {((schedule.lockedSlotsGk || 0) > 0 ||
                            (schedule.lockedSlotsPlayer || 0) > 0) && (
                            <div className="text-xs text-yellow-600">
                              Locked: {schedule.lockedSlotsGk || 0} GK,{" "}
                              {schedule.lockedSlotsPlayer || 0} Player
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {schedule.community ? (
                          <Badge
                            className={
                              schedule.community.toLowerCase() === "blax"
                                ? "bg-gray-900 text-white capitalize"
                                : "bg-orange-100 text-orange-800 capitalize"
                            }
                          >
                            {schedule.community}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      {user?.role === "Owner" && (
                        <TableCell>
                          <div className="text-sm font-medium text-green-600">
                            Rp {schedule.revenue.toLocaleString("id-ID")}
                          </div>
                        </TableCell>
                      )}
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
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleLockSlots(schedule)}
                          >
                            <Lock className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (isWithinH3(schedule.date)) {
                                showError(
                                  "Cannot Delete",
                                  "Schedule cannot be deleted within 3 days before the event date (H-3)",
                                );
                                return;
                              }
                              setScheduleToDelete(schedule);
                              setShowDeleteConfirm(true);
                            }}
                            disabled={isDisabled}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                  value={
                    scheduleForm.date
                      ? new Date(scheduleForm.date).toISOString().split("T")[0]
                      : ""
                  }
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

            {/* Community Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Community
              </label>
              <select
                value={scheduleForm.community}
                onChange={(e) => handleFormChange("community", e.target.value)}
                className="w-full px-4 py-3 border rounded-lg"
              >
                <option value="">Select community</option>
                {COMMUNITY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {scheduleForm.typeMatch !== PADEL_MATCH_TYPE && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Total Teams <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={String(scheduleForm.totalTeams)}
                    onChange={(e) =>
                      handleFormChange("totalTeams", e.target.value)
                    }
                    min="2"
                    disabled={!scheduleForm.typeMatch}
                  />
                </div>
              )}
              <div
                className={
                  scheduleForm.typeMatch === PADEL_MATCH_TYPE
                    ? "md:col-span-2"
                    : ""
                }
              >
                <label className="block text-sm font-medium mb-2">
                  Total Slots{" "}
                  {scheduleForm.typeMatch === PADEL_MATCH_TYPE && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <Input
                  type="number"
                  value={String(scheduleForm.totalSlots)}
                  onChange={(e) =>
                    handleFormChange("totalSlots", e.target.value)
                  }
                  disabled={scheduleForm.typeMatch !== PADEL_MATCH_TYPE}
                  className={
                    scheduleForm.typeMatch !== PADEL_MATCH_TYPE
                      ? "bg-gray-100"
                      : ""
                  }
                  min="1"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div
                className={
                  scheduleForm.typeMatch === PADEL_MATCH_TYPE
                    ? "md:col-span-2"
                    : ""
                }
              >
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
              {scheduleForm.typeMatch !== PADEL_MATCH_TYPE && (
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
              )}
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
                maxSize={2}
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

      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lock Slots</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {lockingSchedule && (
              <>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">
                    {lockingSchedule.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(lockingSchedule.date)} • {lockingSchedule.time}{" "}
                    WIB
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Slots:</span>
                      <span className="font-medium">
                        {lockingSchedule.totalSlots}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Booked:</span>
                      <span className="font-medium text-green-600">
                        {lockingSchedule.bookedSlots}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Already Locked (GK):
                      </span>
                      <span className="font-medium text-yellow-600">
                        {lockingSchedule.lockedSlotsGk || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Already Locked (Player):
                      </span>
                      <span className="font-medium text-yellow-600">
                        {lockingSchedule.lockedSlotsPlayer || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-gray-600">Available to Lock:</span>
                      <span className="font-medium text-blue-600">
                        {lockingSchedule.totalSlots -
                          lockingSchedule.bookedSlots -
                          (lockingSchedule.lockedSlotsGk || 0) -
                          (lockingSchedule.lockedSlotsPlayer || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      GK Slots to Lock
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={lockSlotCounts.gk}
                      onChange={(e) =>
                        setLockSlotCounts((prev) => ({
                          ...prev,
                          gk: e.target.value,
                        }))
                      }
                      min="0"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max:{" "}
                      {lockingSchedule.totalSlots -
                        lockingSchedule.bookedSlots -
                        (lockingSchedule.lockedSlotsGk || 0)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Player Slots to Lock
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={lockSlotCounts.player}
                      onChange={(e) =>
                        setLockSlotCounts((prev) => ({
                          ...prev,
                          player: e.target.value,
                        }))
                      }
                      min="0"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max:{" "}
                      {lockingSchedule.totalSlots -
                        lockingSchedule.bookedSlots -
                        (lockingSchedule.lockedSlotsPlayer || 0)}
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowLockDialog(false);
                  setLockingSchedule(null);
                  setLockSlotCounts({ gk: "", player: "" });
                }}
                disabled={isLoadingLocked}
              >
                Cancel
              </Button>
              <Button
                variant="black"
                size="sm"
                onClick={handleConfirmLockSlots}
                disabled={isLoadingLocked}
              >
                {isLoadingLocked ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Locking...
                  </>
                ) : (
                  "Lock Slots"
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
