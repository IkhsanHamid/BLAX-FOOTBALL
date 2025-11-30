"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Share2, Clock } from "lucide-react";
import { newsService } from "@/utils/news";
import { News } from "@/types/news";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import Navbar from "@/components/organisms/Navbar";

// Skeleton Loading Component for News Detail
function NewsDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 to-blue-500">
      <Navbar
        currentPage={""}
        navigateTo={function (page: string): void {
          throw new Error("Function not implemented.");
        }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Back Button Skeleton */}
        <div className="mb-6">
          <div className="h-10 w-20 bg-white/20 rounded-lg animate-pulse"></div>
        </div>

        {/* Article Header Skeleton */}
        <div className="mb-8">
          {/* Meta info */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-6 w-20 bg-white/20 rounded-full animate-pulse"></div>
            <div className="h-4 w-32 bg-white/20 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-white/20 rounded animate-pulse"></div>
          </div>

          {/* Title */}
          <div className="space-y-3 mb-4">
            <div className="h-8 bg-white/20 rounded animate-pulse"></div>
            <div className="h-8 bg-white/20 rounded w-3/4 animate-pulse"></div>
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <div className="h-6 bg-white/20 rounded animate-pulse"></div>
            <div className="h-6 bg-white/20 rounded w-5/6 animate-pulse"></div>
          </div>
        </div>

        {/* Featured Image Skeleton */}
        <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
          <div className="w-full h-64 md:h-96 bg-white/20 animate-pulse"></div>
        </div>

        {/* Content Skeleton */}
        <div className="mb-8 space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-white/10 rounded animate-pulse"></div>
              <div className="h-4 bg-white/10 rounded w-11/12 animate-pulse"></div>
              <div className="h-4 bg-white/10 rounded w-4/5 animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Share Section Skeleton */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex items-center justify-between">
            <div className="h-4 w-40 bg-white/20 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-white/20 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* CTA Button Skeleton */}
        <div className="mt-12 text-center">
          <div className="h-12 w-48 bg-white/20 rounded-lg animate-pulse mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotifications();

  useEffect(() => {
    const fetchArticle = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        const result = await newsService.newsDetail(params.id as string);
        if (result) {
          setArticle(result);
        } else {
          setArticle(null);
        }
      } catch (error) {
        console.error("Error fetching article:", error);
        showError("Failed to load article", "Please try refreshing the page");
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [params.id, showError]);

  const handleShare = () => {
    if (navigator.share && article) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <NewsDetailSkeleton />;
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-400 to-blue-500">
        <Navbar
          currentPage={""}
          navigateTo={function (page: string): void {
            throw new Error("Function not implemented.");
          }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center bg-white rounded-xl shadow-lg p-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Article Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push("/news")}
              className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium"
            >
              Back to News
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar
        currentPage={""}
        navigateTo={function (page: string): void {
          throw new Error("Function not implemented.");
        }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center px-4 py-2 text-slate-700 bg-white/80 backdrop-blur-sm hover:bg-white border border-blue-100 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        {/* Article Content Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-blue-100">
          {/* Featured Image */}
          {article.imageUrl && (
            <div className="w-full h-64 md:h-96 overflow-hidden relative">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>
          )}

          <div className="p-8">
            {/* Article Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-4">
                <span className="inline-block px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full border border-blue-200">
                  {article.category}
                </span>
                <div className="flex items-center text-slate-500 text-sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(article.publishAt)}
                </div>
                {article.readTime && (
                  <div className="flex items-center text-slate-500 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {article.readTime}
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                {article.title}
              </h1>

              <p className="text-xl text-slate-600 leading-relaxed">
                {article.excerpt}
              </p>
            </div>

            {/* Article Content */}
            <div className="mb-8">
              <div
                dangerouslySetInnerHTML={{ __html: article.content }}
                className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-a:text-blue-600 prose-strong:text-slate-900 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:pl-4 prose-code:bg-slate-100 prose-code:px-2 prose-code:py-1 prose-code:rounded"
              />
            </div>

            {/* Share Button */}
            <div className="border-t border-slate-200 pt-8">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Published on {formatDate(article.publishAt)}
                </div>
                <button
                  onClick={handleShare}
                  className="flex items-center px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Article
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={() => router.push("/news")}
            className="px-8 py-4 bg-white/90 backdrop-blur-sm text-blue-600 rounded-lg hover:bg-white border border-blue-200 transition-all duration-300 font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Read More Articles
          </button>
        </div>
      </div>
    </div>
  );
}
