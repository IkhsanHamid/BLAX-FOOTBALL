"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, ExternalLink, ShoppingBag, Package } from "lucide-react";
import Button from "../atoms/Button";
import { formatCurrency } from "@/lib/helper";

interface ProductImage {
  url: string;
  isPrimary: boolean;
}

interface ProductVariant {
  price: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  images: ProductImage[];
  variants: ProductVariant[];
  isPreOrder?: boolean;
  preOrderDays?: number;
}

interface ApiResponse {
  status: boolean;
  data: {
    data: Product[];
  };
}

const STORE_URL = "https://store.blaxfootball.id";

function getProductImage(product: Product): string {
  const primary = product.images.find((img) => img.isPrimary);
  return primary?.url ?? product.images[0]?.url ?? "";
}

function getMinPrice(product: Product): number {
  const prices = product.variants
    .map((v) => parseInt(v.price, 10))
    .filter((p) => !isNaN(p));
  return prices.length > 0 ? Math.min(...prices) : 0;
}

function getProductLink(product: Product): string {
  return `${STORE_URL}/products/${product.slug}?productId=${product.id}`;
}

export default function MerchandiseSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          "https://api-store.blaxfootball.id/api/v1/master/products/featured",
        );
        const json: ApiResponse = await res.json();
        if (json.status && json.data?.data) {
          setProducts(json.data.data.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to fetch merchandise:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-4 uppercase tracking-widest">
            <ShoppingBag className="w-3.5 h-3.5" />
            Blax Store
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
            Merchandise Blax Sudah Hadir di Store
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Dapatkan jersey dan merchandise eksklusif Blax Football sekarang
            juga
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse"
              >
                <div className="h-56 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {products.map((product) => {
              const imageUrl = getProductImage(product);
              const minPrice = getMinPrice(product);
              const productLink = getProductLink(product);

              return (
                <a
                  key={product.id}
                  href={productLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100 flex flex-col"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {product.isPreOrder && (
                      <div className="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                        <Package className="w-3 h-3 text-white" />
                        <span className="text-xs font-medium text-white">
                          Pre-Order
                          {product.preOrderDays
                            ? ` (${product.preOrderDays}h)`
                            : ""}
                        </span>
                      </div>
                    )}

                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
                      {product.name}
                    </h3>

                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(minPrice)}
                      </span>
                      <span className="text-sm text-blue-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Beli di Store
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        <div className="flex justify-center">
          <a
            href={STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="primary"
              size="lg"
              className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Lihat Lebih Banyak
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
