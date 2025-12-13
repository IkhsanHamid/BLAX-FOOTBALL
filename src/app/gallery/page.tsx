"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  MapPin,
  Clock,
  ExternalLink,
  FolderOpen,
  Image as ImageIcon,
  RefreshCw,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { GalleryPhoto } from "@/types/gallery";
import { galleryService } from "@/utils/gallery";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import SearchBar from "@/components/atoms/SearchBar";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import { Card, CardContent } from "@/components/atoms/Card";
import Pagination from "@/components/atoms/Pagination";
import Navbar from "@/components/organisms/Navbar";

// Skeleton Loading Components
function SessionSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="pt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-9 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

function SkeletonLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar
        currentPage={""}
        navigateTo={function (page: string): void {
          throw new Error("Function not implemented.");
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <div className="h-10 bg-gray-200 rounded-lg w-96 mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded-lg w-80 mx-auto animate-pulse"></div>
        </div>

        {/* Filters Skeleton */}
        <Card className="mb-8 animate-pulse">
          <CardContent className="p-6">
            <div className="pt-4 flex flex-col lg:flex-row gap-4">
              <div className="flex-1 h-10 bg-gray-200 rounded"></div>
              <div className="flex gap-4">
                <div className="w-40 h-10 bg-gray-200 rounded"></div>
                <div className="w-32 h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List Skeleton */}
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <SessionSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const router = useRouter();
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVenue, setSelectedVenue] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterPhotos();
  }, [galleryPhotos, searchQuery, selectedVenue]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const fetchedPhotos = await galleryService.getAllPhotos();
      setGalleryPhotos(fetchedPhotos);
    } catch (error) {
      console.error("Error fetching gallery data:", error);
      showError("Failed to load gallery", "Please try refreshing the page");
    } finally {
      setLoading(false);
    }
  };

  const filterPhotos = () => {
    let filtered = galleryPhotos;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (photo) =>
          photo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          photo.venue.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Venue filter
    if (selectedVenue !== "all") {
      filtered = filtered.filter((photo) => photo.venue === selectedVenue);
    }

    setFilteredPhotos(filtered);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    showSuccess("Gallery refreshed successfully");
  };

  const handleOpenLink = (
    link: string,
    name: string,
    type: "photo" | "video"
  ) => {
    if (link) {
      window.open(link, "_blank");
      showSuccess(`Opening ${type}s for ${name}`);
    } else {
      showError(
        `No ${type} link available`,
        `${name} doesn't have ${type}s yet`
      );
    }
  };

  // Get unique venues for filter
  const venues = ["all", ...new Set(galleryPhotos.map((photo) => photo.venue))];

  // Pagination
  const totalPages = Math.ceil(filteredPhotos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPhotos = filteredPhotos.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Stats
  const stats = {
    totalSessions: galleryPhotos.length,
    venues: new Set(galleryPhotos.map((photo) => photo.venue)).size,
    withPhotos: galleryPhotos.filter((photo) => photo.linkPhoto).length,
    withVideos: galleryPhotos.filter((photo) => photo.linkVideo).length,
  };

  if (loading) {
    return <SkeletonLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar
        currentPage={""}
        navigateTo={function (page: string): void {
          throw new Error("Function not implemented.");
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 mt-10">
        {/* Header */}
        {/* <div className="text-center mb-8 bg-white/80 backdrop-blur-sm border border-blue-100 p-8 rounded-2xl shadow-lg">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-4">
            Galeri Foto & Video
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Jelajahi sesi foto dan video komunitas sepak bola kami. Akses
            koleksi lengkap dari setiap pertandingan dan acara.
          </p>
        </div> */}

        {/* Stats */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border border-blue-100">
            <CardContent className="p-6">
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalSessions}
                  </p>
                </div>
                <FolderOpen className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-blue-100">
            <CardContent className="p-6">
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">With Photos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.withPhotos}
                  </p>
                </div>
                <ImageIcon className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-blue-100">
            <CardContent className="p-6">
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">With Videos</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.withVideos}
                  </p>
                </div>
                <Video className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div> */}

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="pt-4 flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <SearchBar
                  placeholder="Search sessions by name, venue..."
                  onSearch={handleSearch}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={selectedVenue}
                  onChange={(e) => setSelectedVenue(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Venues</option>
                  {venues.slice(1).map((venue) => (
                    <option key={venue} value={venue}>
                      {venue}
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {(searchQuery || selectedVenue !== "all") && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mr-2">Active filters:</p>
                {searchQuery && (
                  <Badge
                    variant="default"
                    className="bg-blue-100 text-blue-800"
                  >
                    Search: {searchQuery}
                  </Badge>
                )}
                {selectedVenue !== "all" && (
                  <Badge
                    variant="default"
                    className="bg-blue-100 text-blue-800"
                  >
                    Venue: {selectedVenue}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-6">
          <p className="text-slate-600 bg-white/60 backdrop-blur-sm border border-blue-100 p-3 rounded-lg">
            Showing {paginatedPhotos.length} of {filteredPhotos.length} gallery
            sessions
          </p>
        </div>

        {/* Gallery List */}
        {filteredPhotos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4 mt-10" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Tidak ada foto atau video ditemukan
              </h3>
              <p className="text-gray-600">
                {searchQuery || selectedVenue !== "all"
                  ? "Coba cari lagi venue lainnya"
                  : "Tidak tersedia foto atau video untuk saat ini"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {paginatedPhotos.map((photo, index) => (
              <Card
                key={`${photo.name}-${photo.date}-${index}`}
                className="hover:shadow-lg transition-all duration-200 border border-blue-100 hover:border-blue-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Session Icon */}
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                        <FolderOpen className="w-6 h-6 text-white" />
                      </div>

                      {/* Session Info */}
                      <div className="pt-4 flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                          {photo.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span>
                              {new Date(photo.date).toLocaleDateString("id-ID")}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-green-500" />
                            <span>{photo.time} WIB</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4 text-purple-500" />
                            <span className="truncate">{photo.venue}</span>
                          </div>
                        </div>

                        <div className="mt-2 flex gap-2">
                          {photo.linkPhoto && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              Foto tersedia
                            </Badge>
                          )}
                          {photo.linkVideo && (
                            <Badge
                              variant="outline"
                              className="bg-purple-50 text-purple-700 border-purple-200"
                            >
                              Video tersedia
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      {photo.linkPhoto && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleOpenLink(photo.linkPhoto, photo.name, "photo")
                          }
                          className="flex items-center border-green-200 text-green-700 hover:bg-green-50"
                        >
                          <ImageIcon className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Photos</span>
                        </Button>
                      )}

                      {photo.linkVideo && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleOpenLink(photo.linkVideo, photo.name, "video")
                          }
                          className="flex items-center border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          <Video className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Videos</span>
                        </Button>
                      )}

                      {!photo.linkPhoto && !photo.linkVideo && (
                        <Badge variant="outline" className="text-gray-500">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-8 border-gray-200">
          <CardContent className="p-6">
            <div className="pt-4 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Butuh Bantuan Mengakses Media?
              </h3>
              <p className="text-gray-600 mb-4">
                Klik "Foto" atau "Video" untuk membuka folder masing-masing.
                Anda mungkin perlu meminta akses jika folder bersifat privat.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <div className="text-sm text-gray-500">
                  📞 Support: +62 21 1234 5678
                </div>
                <div className="text-sm text-gray-500">
                  📧 Email: support@blaxfootball.com
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
