"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Camera,
} from "lucide-react";

interface ImageUploadProps {
  value?: string | File;
  onChange: (file: File | null) => void;
  className?: string;
  disabled?: boolean;
  error?: string;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

export default function ImageUpload({
  value,
  onChange,
  className = "",
  disabled = false,
  error,
  maxSize = 5,
  acceptedTypes = ["image/jpeg", "image/png", "image/gif"],
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize preview when value changes
  React.useEffect(() => {
    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (typeof value === "string" && value) {
      setPreview(value);
    } else {
      setPreview("");
    }
  }, [value]);

  const validateFile = (file: File): string | null => {
    console.log("Validating file:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Validasi type - lebih fleksibel untuk mobile
    if (!file.type.startsWith("image/")) {
      return "Please select an image file";
    }

    // Validasi specific types jika ada
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      // Fallback: cek extension jika MIME type tidak match (masalah di beberapa browser)
      const extension = file.name.split(".").pop()?.toLowerCase();
      const acceptedExtensions = acceptedTypes.map(
        (type) => type.split("/")[1],
      );

      if (!extension || !acceptedExtensions.includes(extension)) {
        return `File type not supported. Please use: ${acceptedExtensions.join(", ")}`;
      }
    }

    // Validasi size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size too large. Maximum size is ${maxSize}MB`;
    }

    // Validasi file size minimum (avoid corrupted files)
    if (file.size < 1024) {
      return "File seems to be corrupted or too small";
    }

    return null;
  };

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      console.log("File selected:", file);

      if (!file) {
        console.log("No file selected");
        return;
      }

      setValidationError("");
      const error = validateFile(file);

      if (error) {
        console.error("Validation error:", error);
        setValidationError(error);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setUploading(true);

      // Simulate upload process
      setTimeout(() => {
        console.log("File validated and ready:", file);
        onChange(file);
        setUploading(false);
      }, 500);
    },
    [onChange, maxSize, acceptedTypes],
  );

  const handleRemove = () => {
    onChange(null);
    setPreview("");
    setValidationError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  // Detect if mobile
  const isMobile =
    typeof window !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-4">
        {/* Hidden File Input - PENTING untuk mobile */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*" // Lebih universal untuk mobile
          onChange={handleFileChange}
          disabled={disabled || uploading}
          className="hidden"
          // Tambahkan capture untuk akses kamera di mobile
          {...(isMobile ? { capture: "environment" } : {})}
        />

        {/* Upload Area */}
        <div
          onClick={handleClick}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
            ${disabled || uploading ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400 active:border-blue-400"}
            ${error || validationError ? "border-red-300 bg-red-50" : "border-gray-300"}
          `}
        >
          {uploading ? (
            <div className="space-y-3">
              <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Uploading...
                </p>
                <p className="text-sm text-gray-600">
                  Please wait while we process your image
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto text-gray-400">
                {isMobile ? (
                  <Camera className="w-full h-full" />
                ) : (
                  <Upload className="w-full h-full" />
                )}
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isMobile
                    ? "Take photo or choose from gallery"
                    : "Upload an image"}
                </p>
                <p className="text-sm text-gray-600">
                  {isMobile ? "Tap to select" : "Click to browse"}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Supports: JPG, PNG, GIF • Max size: {maxSize}MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {(error || validationError) && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error || validationError}</span>
          </div>
        )}
      </div>

      {/* Image Preview */}
      {preview && (
        <div className="relative">
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover"
              onError={() => {
                console.error("Failed to load preview");
                setPreview("");
              }}
            />

            {/* Remove Button */}
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full transition-colors shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Success Indicator */}
            <div className="absolute bottom-2 left-2 flex items-center space-x-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Image loaded</span>
            </div>
          </div>

          {/* Image Info */}
          {value instanceof File && (
            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">File:</span>{" "}
                  <span className="break-all">{value.name}</span>
                </div>
                <div>
                  <span className="font-medium">Size:</span>{" "}
                  {(value.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
