"use client";
import React, { useEffect, useState } from "react";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "../atoms/Button";
import { News } from "@/types/news";
import { useNotifications } from "./NotificationContainer";
import { newsService } from "@/utils/news";

export default function NewsSection() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [news, setNews] = useState<News[]>([]);
  const { showSuccess, showError } = useNotifications();

  const handleReadMore = () => {
    router.push("/news");
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setIsLoading(true);
      const result = await newsService.getNews();
      if (result) setNews(result);
    } catch (error) {
      console.error("Error fetching news:", error);
      showError("Failed to load news", "Please try refreshing the page");
    } finally {
      setIsLoading(false);
    }
  };

  // Display 3 most recent news by publishAt
  const displayedNews = [...news]
    .sort(
      (a, b) =>
        new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime()
    )
    .slice(0, 3);

  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-green-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-sky-700 to-blue-700 bg-clip-text text-transparent mb-4">
            Berita Terkini
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Dapatkan update terbaru seputar turnamen, jadwal pertandingan, dan
            berita menarik lainnya
          </p>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {displayedNews.map((news, index) => (
            <div
              key={news.id}
              className={`group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-sky-100 overflow-hidden shadow-md ${
                index === 0 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="relative overflow-hidden">
                <img
                  src={news.imageUrl}
                  alt={news.title}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Date Badge */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-sky-600" />
                  <span className="text-xs font-medium text-gray-700">
                    {new Date(news.publishAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>

                {/* Read Time Badge */}
                {news.readTime && (
                  <div className="absolute top-4 right-4 bg-sky-500/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-white" />
                    <span className="text-xs font-medium text-white">
                      {news.readTime}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-sky-700 transition-colors">
                  {news.title}
                </h3>

                <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                  {news.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {new Date(news.publishAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/news/${news.id}`)}
                    className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 p-0 h-auto font-medium"
                  >
                    Baca Selengkapnya
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Read More Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleReadMore}
            variant="primary"
            size="lg"
            className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Selengkapnya
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
