"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  Edit,
  Trash2,
  Users,
  UserPlus,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  Trophy,
} from "lucide-react";
import Button from "@/components/atoms/Button";
import { Card, CardContent } from "@/components/atoms/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/Table";
import Badge from "@/components/atoms/Badge";
import { UserManagement, Roles } from "@/types/admin";
import { adminService } from "@/utils/admin";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/helper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/Dialog";
import Input from "@/components/atoms/Input";
import ConfirmationModal from "../molecules/ConfirmationModal";
import Pagination from "../atoms/Pagination";
import { TableLoadingSkeleton } from "./LoadingSkeleton";

const ITEMS_PER_PAGE = 10;
const ACTIVE_DAYS_THRESHOLD = 30;

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  role: "",
};

const statsConfig = [
  { key: "total", label: "Total Users", icon: Users, color: "blue" },
  { key: "active", label: "Active Users", icon: UserCheck, color: "green" },
  {
    key: "newThisMonth",
    label: "New This Month",
    icon: UserPlus,
    color: "purple",
  },
  { key: "totalGames", label: "Total Games", icon: Trophy, color: "yellow" },
];

export default function UsersTab() {
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [roles, setRoles] = useState<Roles[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserManagement | null>(null);
  const [userForm, setUserForm] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await adminService.getAllUsers(100, 0, searchTerm);
      setUsers(result.users);
    } catch (error) {
      showError("Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const rolesData = await adminService.getRoles();
      setRoles(rolesData);
      if (rolesData.length > 0 && !userForm.role && !editingUser) {
        setUserForm((prev) => ({ ...prev, role: rolesData[0].id }));
      }
    } catch (error) {
      showError("Error", "Failed to load roles");
    }
  };

  const isUserActive = (lastPlayed: string | null) => {
    if (!lastPlayed) return false;
    const threshold = Date.now() - ACTIVE_DAYS_THRESHOLD * 24 * 60 * 60 * 1000;
    return new Date(lastPlayed) > new Date(threshold);
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.phone.includes(term)
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((u) => isUserActive(u.lastPlayed));
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((u) => !isUserActive(u.lastPlayed));
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!userForm.name.trim()) errors.name = "Name is required";
    if (!userForm.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(userForm.email))
      errors.email = "Email is invalid";
    if (!userForm.phone.trim()) errors.phone = "Phone is required";
    else if (!/^\d{10,15}$/.test(userForm.phone.replace(/\D/g, ""))) {
      errors.phone = "Phone number must be 10-15 digits";
    }
    if (!userForm.role.trim()) errors.role = "Role is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUserInputChange = (field: string, value: string) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSaveUser = async () => {
    if (!validateForm()) return;

    try {
      setActionLoading("save");

      if (editingUser) {
        // Edit existing user
        await adminService.editStaff(editingUser.id, {
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
        });
        showSuccess("User updated successfully!");
      } else {
        // Create new user
        await adminService.addStaff({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
        });
        showSuccess("User created successfully!");
      }

      setShowUserDialog(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      showError("Error", error?.message || "Failed to save user");
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setUserForm(
      roles.length > 0
        ? { ...initialFormState, role: roles[0].id }
        : initialFormState
    );
    setFormErrors({});
    setEditingUser(null);
  };

  const handleEditUser = (user: UserManagement) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
    setShowUserDialog(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setActionLoading("delete");
      await adminService.removeUser(userToDelete.id);
      showSuccess("User deleted successfully!");
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      showError("Error", "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenUserDialog = () => {
    setShowUserDialog(true);
    if (roles.length === 0) fetchRoles();
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : roleId;
  };

  const uniqueRoles = [...new Set(users.map((u) => u.role))];
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const stats = {
    total: users.length,
    active: users.filter((u) => isUserActive(u.lastPlayed)).length,
    newThisMonth: users.filter(
      (u) => u.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length,
    totalGames: users.reduce((sum, u) => sum + (u.gamesPlayed || 0), 0),
  };

  const activeFilters = [
    searchTerm && {
      label: "Search",
      value: searchTerm,
      clear: () => setSearchTerm(""),
    },
    roleFilter !== "all" && {
      label: "Role",
      value: getRoleName(roleFilter),
      clear: () => setRoleFilter("all"),
    },
    statusFilter !== "all" && {
      label: "Status",
      value: statusFilter,
      clear: () => setStatusFilter("all"),
    },
  ].filter(Boolean);

  if (loading) return <TableLoadingSkeleton />;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            User Management
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Kelola user account dan izin akses
          </p>
        </div>
        <Button
          variant="black"
          size="sm"
          onClick={handleOpenUserDialog}
          className="flex items-center"
        >
          <UserPlus className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Tambah User</span>
          <span className="md:hidden">Tambah</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsConfig.map(({ key, label, icon: Icon, color }) => (
          <Card
            key={key}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <CardContent className="p-6">
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats[key as keyof typeof stats]}
                  </p>
                </div>
                <div className={`p-3 bg-${color}-100 rounded-lg`}>
                  <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="pt-4 flex-1 relative">
              <Search className="absolute left-3 top-9 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>
                    {getRoleName(role)}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mr-2">Active filters:</p>
              {activeFilters.map((filter: any, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {filter.label}: {filter.value}
                  <button
                    onClick={filter.clear}
                    className="ml-1 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Info */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1}-
          {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of{" "}
          {filteredUsers.length} users
        </p>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-600 mb-6">
                {activeFilters.length > 0
                  ? "Try adjusting your search criteria"
                  : "Get started by adding your first user"}
              </p>
              {activeFilters.length === 0 && (
                <Button
                  variant="primary"
                  onClick={handleOpenUserDialog}
                  className="flex items-center mx-auto"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First User
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Games Played</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => {
                  const isActive = isUserActive(user.lastPlayed);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="truncate max-w-[200px]">
                              {user.email || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="w-4 h-4 text-gray-400 mr-2" />
                            <span>{user.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                          }
                        >
                          {getRoleName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">
                            {user.gamesPlayed || 0}
                          </span>
                          {(user.gamesPlayed || 0) >= 10 && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                            >
                              VIP
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.lastPlayed ? (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                              {formatDate(user.lastPlayed)}
                            </div>
                          ) : (
                            <span className="text-gray-400">Never</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            isActive || user.role === "Admin"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                          }
                        >
                          {isActive || user.role === "Admin"
                            ? "Active"
                            : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div
                            title={
                              user.role !== "Admin"
                                ? "Only Admin can edit users"
                                : "Edit user"
                            }
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditUser(user)}
                              className="hover:bg-yellow-50"
                              disabled={user.role !== "Admin"}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                          <div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setUserToDelete(user);
                                setShowDeleteConfirm(true);
                              }}
                              className="hover:bg-red-50 text-red-600"
                              disabled={user.role !== "Admin"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Add/Edit User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  field: "name",
                  label: "Full Name",
                  type: "text",
                  placeholder: "Enter full name",
                },
                {
                  field: "email",
                  label: "Email Address",
                  type: "email",
                  placeholder: "Enter email address",
                },
                {
                  field: "phone",
                  label: "Phone Number",
                  type: "tel",
                  placeholder: "Enter phone number",
                },
              ].map(({ field, label, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-2">
                    {label} *
                  </label>
                  <Input
                    type={type}
                    value={userForm[field as keyof typeof userForm]}
                    onChange={(e) =>
                      handleUserInputChange(field, e.target.value)
                    }
                    placeholder={placeholder}
                    className={formErrors[field] ? "border-red-500" : ""}
                  />
                  {formErrors[field] && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors[field]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowUserDialog(false);
                  resetForm();
                }}
                disabled={actionLoading === "save"}
              >
                Cancel
              </Button>
              <Button
                variant="black"
                size="sm"
                onClick={handleSaveUser}
                disabled={actionLoading === "save"}
                className="flex items-center"
              >
                {actionLoading === "save" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingUser ? "Updating..." : "Creating..."}
                  </>
                ) : editingUser ? (
                  "Update User"
                ) : (
                  "Create User"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Apakah kamu yakin delete user "${userToDelete?.name}"? Aksi ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={actionLoading === "delete"}
      />
    </div>
  );
}
