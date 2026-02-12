"use client";

import React, { useEffect, useState } from "react";
import {
  Clock,
  Plus,
  CreditCard as Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  Calendar,
  Tag,
  Image as ImageIcon,
  FileText,
  Download,
  Upload,
  MoreHorizontal,
} from "lucide-react";
import Button from "../atoms/Button";
import RichTextEditor from "../atoms/RichTextEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../atoms/Dialog";
import Input from "../atoms/Input";
import { Card, CardContent } from "../atoms/Card";
import { useNotifications } from "./NotificationContainer";
import { News } from "@/types/news";
import { newsService } from "@/utils/news";
import { adminService } from "@/utils/admin";
import ConfirmationModal from "../molecules/ConfirmationModal";
import { formatDate } from "@/lib/helper";
import Badge from "../atoms/Badge";
import Pagination from "../atoms/Pagination";
import { CardsLoadingSkeleton } from "./LoadingSkeleton";
import ImageUpload from "../atoms/ImageUpload";

export default function NewsTab() {
  const [showNewsDialog, setShowNewsDialog] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [news, setNews] = useState<News[]>([]);
  const [filteredNews, setFilteredNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedNews, setSelectedNews] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  // Form states
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [category, setCategory] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    filterNews();
  }, [news, searchTerm, categoryFilter]);

  const fetchNews = async () => {
    try {
      setIsLoading(true);
      const result = await newsService.getNews();
      if (result) {
        setNews(result);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      showError("Gagal memuat berita", "Silakan refresh halaman");
    } finally {
      setIsLoading(false);
    }
  };

  const filterNews = () => {
    let filtered = news;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    setFilteredNews(filtered);
    setCurrentPage(1);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!title.trim()) errors.title = "Title is required";
    if (!excerpt.trim()) errors.excerpt = "Excerpt is required";
    if (!content.trim()) errors.content = "Content is required";
    if (!category.trim()) errors.category = "Category is required";

    // For new articles, image is required
    if (!editingNews && !image) {
      errors.image = "Featured image is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setTitle("");
    setExcerpt("");
    setContent("");
    setImage(null);
    setImagePreviewUrl("");
    setCategory("");
    setEditingNews(null);
    setFormErrors({});
  };

  const openAddNewsDialog = () => {
    resetForm();
    setShowNewsDialog(true);
  };

  const openEditNewsDialog = (newsItem: News) => {
    setEditingNews(newsItem);
    setTitle(newsItem.title);
    setExcerpt(newsItem.excerpt);
    setContent(newsItem.content);
    setImage(null);
    setImagePreviewUrl(newsItem.imageUrl); // Set preview URL from existing news
    setCategory(newsItem.category);
    setShowNewsDialog(true);
  };

  const closeNewsDialog = () => {
    setShowNewsDialog(false);
    resetForm();
  };

  const handleSubmitNews = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("excerpt", excerpt.trim());
      formData.append("content", content.trim());
      formData.append("category", category.trim());

      // Add image if provided
      if (image) {
        formData.append("image", image);
      }

      if (editingNews) {
        const response = await adminService.updateNews(
          editingNews.id,
          formData,
        );
        if (response.statusCode !== 200) {
          throw new Error("Update failed");
        }
        showSuccess("Berhasil", "Berita berhasil diperbarui");
      } else {
        const response = await adminService.createNews(formData);
        if (!response) {
          throw new Error("Create failed");
        }
        showSuccess("Berhasil", "Berita berhasil ditambahkan");
      }

      closeNewsDialog();
      fetchNews();
    } catch (error: any) {
      console.error("Error submitting news:", error);
      const errorMessage =
        error?.response?.data?.message || error?.message || "Silakan coba lagi";
      showError(
        editingNews ? "Gagal memperbarui berita" : "Gagal menambahkan berita",
        errorMessage,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNews = async () => {
    if (!newsToDelete) return;

    try {
      const response = await adminService.deleteNews(newsToDelete);
      if (response.statusCode !== 200) {
        throw new Error("Delete failed");
      }
      showSuccess("Berhasil", "Berita berhasil dihapus");
      setShowConfirmation(false);
      setNewsToDelete(null);
      fetchNews();
    } catch (error: any) {
      console.error("Error deleting news:", error);
      const errorMessage =
        error?.response?.data?.message || error?.message || "Silakan coba lagi";
      showError("Gagal menghapus berita", errorMessage);
    }
  };

  const handleBulkDelete = async () => {
    try {
      // Call API for bulk delete
      const deletePromises = selectedNews.map((id) =>
        adminService.deleteNews(id),
      );
      const results = await Promise.allSettled(deletePromises);

      // Check if any failed
      const failures = results.filter((result) => result.status === "rejected");

      if (failures.length > 0) {
        throw new Error(
          `${failures.length} dari ${selectedNews.length} berita gagal dihapus`,
        );
      }

      showSuccess("Berhasil", `${selectedNews.length} berita berhasil dihapus`);
      setShowBulkDeleteConfirm(false);
      setSelectedNews([]);
      fetchNews();
    } catch (error: any) {
      console.error("Error bulk deleting news:", error);
      const errorMessage = error?.message || "Silakan coba lagi";
      showError("Gagal menghapus berita", errorMessage);
    }
  };

  const handleDeleteClick = (id: string) => {
    setShowConfirmation(true);
    setNewsToDelete(id);
  };

  const handleSelectNews = (id: string) => {
    setSelectedNews((prev) =>
      prev.includes(id)
        ? prev.filter((newsId) => newsId !== id)
        : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedNews.length === paginatedNews.length) {
      setSelectedNews([]);
    } else {
      setSelectedNews(paginatedNews.map((n) => n.id));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case "title":
        setTitle(value);
        break;
      case "excerpt":
        setExcerpt(value);
        break;
      case "content":
        setContent(value);
        break;
      case "category":
        setCategory(value);
        break;
    }

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageChange = (file: File | null) => {
    setImage(file);
    // Clear preview URL when new image is selected
    if (file) {
      setImagePreviewUrl("");
    }
    // Clear error when user selects an image
    if (formErrors.image && file) {
      setFormErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  // Get unique categories for filter
  const uniqueCategories = [...new Set(news.map((n) => n.category))];

  // Pagination
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNews = filteredNews.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Stats calculation
  const stats = {
    total: news.length,
    published: news.length, // All news are published
    categories: uniqueCategories.length,
    thisMonth: news.filter(
      (n) =>
        new Date(n.publishAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    ).length,
  };

  if (isLoading) {
    return <CardsLoadingSkeleton />;
  }

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Manajemen Berita
            </h2>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Buat dan kelola artikel berita
            </p>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            {selectedNews.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="flex items-center"
              >
                <Trash2 className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">
                  Hapus ({selectedNews.length})
                </span>
                <span className="md:hidden">({selectedNews.length})</span>
              </Button>
            )}

            <Button
              variant="black"
              size="sm"
              onClick={openAddNewsDialog}
              disabled={isLoading}
              className="flex items-center"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden md:inline">Tambah Berita</span>
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
                    Total Articles
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.published}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Categories
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.categories}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Tag className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    This Month
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.thisMonth}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="pt-4 flex-1 relative">
                <Search className="absolute left-3 top-9 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search news by title, excerpt, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(searchTerm || categoryFilter !== "all") && (
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
                {categoryFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Category: {categoryFilter}
                    <button
                      onClick={() => setCategoryFilter("all")}
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
            {Math.min(startIndex + itemsPerPage, filteredNews.length)} of{" "}
            {filteredNews.length} articles
          </p>

          {filteredNews.length > 0 && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={
                  selectedNews.length === paginatedNews.length &&
                  paginatedNews.length > 0
                }
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Select all</span>
            </div>
          )}
        </div>

        {/* News Grid */}
        {filteredNews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No articles found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || categoryFilter !== "all"
                  ? "Try adjusting your search criteria"
                  : "Get started by creating your first news article"}
              </p>
              {!searchTerm && categoryFilter === "all" && (
                <Button
                  variant="black"
                  onClick={openAddNewsDialog}
                  className="flex items-center mx-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Article
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedNews.map((item) => (
              <Card
                key={item.id}
                className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-sky-100 overflow-hidden"
              >
                {/* Selection Checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedNews.includes(item.id)}
                    onChange={() => handleSelectNews(item.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white/90 backdrop-blur-sm"
                  />
                </div>

                {/* Full width image */}
                <div className="relative overflow-hidden h-48 w-full">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg";
                    }}
                  />

                  {/* Category Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-600 text-white">
                      {item.category}
                    </Badge>
                  </div>

                  {/* Read Time Badge */}
                  <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-white" />
                    <span className="text-xs font-medium text-white">
                      {item.readTime}
                    </span>
                  </div>
                </div>

                <CardContent className="p-6">
                  <h3 className="pt-6 font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {item.excerpt}
                  </p>

                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(item.publishAt)}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditNewsDialog(item)}
                        disabled={isLoading}
                        className="hover:bg-yellow-50"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(item.id)}
                      disabled={isLoading}
                      className="hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* News Dialog */}
      <Dialog open={showNewsDialog} onOpenChange={closeNewsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNews ? "Edit News Article" : "Create New Article"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block mb-2 font-medium">
                  Article Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  type="text"
                  placeholder="Enter article title"
                  className={formErrors.title ? "border-red-500" : ""}
                />
                {formErrors.title && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="category" className="block mb-2 font-medium">
                  Category *
                </label>
                <Input
                  value={category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                  type="text"
                  placeholder="e.g., Sports, Tournament, News"
                  className={formErrors.category ? "border-red-500" : ""}
                />
                {formErrors.category && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.category}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="excerpt" className="block mb-2 font-medium">
                Excerpt *
              </label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => handleInputChange("excerpt", e.target.value)}
                placeholder="Brief summary of the article"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  formErrors.excerpt ? "border-red-500" : "border-gray-300"
                }`}
                rows={3}
                disabled={isSubmitting}
              />
              {formErrors.excerpt && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.excerpt}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="content" className="block mb-2 font-medium">
                Content *
              </label>
              <RichTextEditor
                value={content}
                onChange={(value) => handleInputChange("content", value)}
                placeholder="Write your article content here..."
                disabled={isSubmitting}
                className={formErrors.content ? "border-red-500" : ""}
              />
              {formErrors.content && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.content}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="image" className="block mb-3 font-medium">
                Featured Image *
              </label>
              <ImageUpload
                value={image || imagePreviewUrl}
                onChange={handleImageChange}
                error={formErrors.image}
                disabled={isSubmitting}
                maxSize={5}
                acceptedTypes={[
                  "image/jpeg",
                  "image/png",
                  "image/gif",
                  "image/webp",
                ]}
              />
              {formErrors.image && (
                <p className="text-red-500 text-sm mt-1">{formErrors.image}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {editingNews
                  ? "Upload a new image to replace the current one (optional)"
                  : "Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB"}
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={closeNewsDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="black"
                onClick={handleSubmitNews}
                disabled={isSubmitting}
                className="flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingNews ? "Updating..." : "Publishing..."}
                  </>
                ) : editingNews ? (
                  "Update Article"
                ) : (
                  "Publish Article"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleDeleteNews}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Articles"
        message={`Are you sure you want to delete ${selectedNews.length} selected articles? This action cannot be undone.`}
        type="danger"
        confirmText="Delete All"
        cancelText="Cancel"
      />
    </>
  );
}
