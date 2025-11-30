"use client";

import { useState, useEffect } from "react";
import {
  Newspaper,
  Filter,
  Calendar,
  Share2,
  Eye,
  Clock,
  User,
} from "lucide-react";
import { News } from "@/types/news";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { newsService } from "@/utils/news";
import Navbar from "@/components/organisms/Navbar";
import SearchBar from "@/components/atoms/SearchBar";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import { useRouter } from "next/navigation";

// Skeleton Loading Component
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-md border border-sky-100 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-6">
        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-1"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// Skeleton Loading Screen Component
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
        {/* Results Count Skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>

        {/* News Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<News[]>([]);
  const [filteredNews, setFilteredNews] = useState<News[]>([]);
  const { showSuccess, showError } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  // Get unique categories from news data
  const categories = [
    "All Categories",
    ...new Set(news.map((article) => article.category)),
  ];

  // Filter and sort effect
  useEffect(() => {
    let filtered = news;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter(
        (article) => article.category === selectedCategory
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime()
          );
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredNews(filtered);
  }, [news, searchQuery, selectedCategory, sortBy]);

  // Fetch news data
  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const result = await newsService.getNews();
      if (result && Array.isArray(result)) {
        setNews(result);
      } else {
        console.warn("Invalid news data received:", result);
        setNews([]);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      showError("Failed to load news", "Please try refreshing the page");
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleShare = (id: string) => {
    const article = news.find((n) => n.id === id);
    if (article && navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: `${window.location.origin}/news/${id}`,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleReadMore = (id: string) => {
    router.push(`/news/${id}`);
  };

  if (loading) {
    return <SkeletonLoading />;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar
          currentPage={""}
          navigateTo={function (page: string): void {
            throw new Error("Function not implemented.");
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          {/* Results */}
          <div className="mb-6">
            <p className="text-slate-600 bg-white/60 backdrop-blur-sm border border-blue-100 p-3 rounded-lg">
              Showing {filteredNews.length} of {news.length} articles
            </p>
          </div>

          {/* News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((article) => (
              <div
                key={article.id}
                className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Image */}
                {article.imageUrl && (
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Category Badge */}
                  <div className="mb-2">
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full border border-blue-200">
                      {article.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 hover:text-blue-700 transition-colors">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                    <span
                      dangerouslySetInnerHTML={{ __html: article.excerpt }}
                    />
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center space-x-4 text-xs text-slate-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(article.publishAt).toLocaleDateString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                    {article.readTime && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{article.readTime}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReadMore(article.id)}
                        className="hover:bg-blue-50 hover:border-blue-300 text-blue-600 border-blue-200"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Read More
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(article.id)}
                      className="hover:bg-slate-50 hover:text-blue-700 text-slate-600"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredNews.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-blue-100 shadow-lg">
                <Newspaper className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-900 mb-2">
                  No articles found
                </h3>
                <p className="text-slate-500 mb-6">
                  Try adjusting your search criteria or filters
                </p>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All Categories");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
