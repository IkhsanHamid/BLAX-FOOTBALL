"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, FileText, Search } from "lucide-react";
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
import { masterDataService, Rule, RulePayload } from "@/utils/masterData";
import { TableLoadingSkeleton } from "./LoadingSkeleton";

export default function RuleManagement() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    rule: Rule | null;
  }>({ isOpen: false, rule: null });

  const [formData, setFormData] = useState<RulePayload>({
    description: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<RulePayload>>({});

  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    fetchRules();
  }, [searchTerm, currentPage]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await masterDataService.getRules(
        searchTerm,
        currentPage,
        10
      );
      setRules(response);
    } catch (error) {
      console.error("Error fetching rules:", error);
      showError("Error", "Failed to load rules");
    } finally {
      setLoading(false);
    }
  };
  const validateForm = (): boolean => {
    const errors: Partial<RulePayload> = {};

    if (!formData.description.trim()) {
      errors.description = "Rule description is required";
    } else if (formData.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters long";
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

      if (editingRule) {
        await masterDataService.updateRule(editingRule.id, formData);
        showSuccess("Success", "Rule updated successfully");
      } else {
        await masterDataService.createRule(formData);
        showSuccess("Success", "Rule created successfully");
      }

      handleCloseDialog();
      fetchRules();
    } catch (error) {
      console.error("Error saving rule:", error);
      showError(
        "Error",
        editingRule ? "Failed to update rule" : "Failed to create rule"
      );
    } finally {
      setSubmitting(false);
    }
  };
  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);

    setFormData({
      description: rule.description,
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.rule) return;

    try {
      setActionLoading("delete");
      await masterDataService.deleteRule(deleteConfirmation.rule.id);
      showSuccess("Success", "Rule deleted successfully");
      setDeleteConfirmation({ isOpen: false, rule: null });
      fetchRules();
    } catch (error) {
      console.error("Error deleting rule:", error);
      showError("Error", "Failed to delete rule");
    } finally {
      setActionLoading(null);
    }
  };
  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingRule(null);
    setFormData({ description: "" });
    setFormErrors({});
  };

  const handleInputChange = (field: keyof RulePayload, value: string) => {
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
            Manajemen Aturan
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Kelola aturan dan regulasi pertandingan
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
          <span className="hidden md:inline">Tambah Aturan</span>
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
              placeholder="Cari aturan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 md:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
            />
          </div>
        </CardContent>
      </Card>
      {/* Rules Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading rules...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No rules found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="max-w-md">
                        <p className="line-clamp-3">{rule.description}</p>
                      </TableCell>
                      <TableCell>
                        {rule.createdAt
                          ? new Date(rule.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(rule)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              setDeleteConfirmation({
                                isOpen: true,
                                rule: rule,
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
              {editingRule ? "Edit Rule" : "Add New Rule"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rule Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Enter rule description..."
                rows={6}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical ${
                  formErrors.description ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.description}
                </p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Minimum 10 characters required
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
              >
                {submitting
                  ? editingRule
                    ? "Updating..."
                    : "Creating..."
                  : editingRule
                  ? "Update Rule"
                  : "Create Rule"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, rule: null })}
        onConfirm={handleDelete}
        title="Delete Rule"
        message={`Apakah kamu yakin hapus aturan ini? Aksi ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={actionLoading === "delete"}
      />
    </div>
  );
}
