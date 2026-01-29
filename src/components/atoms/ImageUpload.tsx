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
    console.log("=== FILE VALIDATION ===");
    console.log("File name:", file.name);
    console.log("File type:", file.type);
    console.log("File size:", file.size);
    console.log("=====================");

    // Validasi size minimum (avoid corrupted files)
    if (file.size < 100) {
      return "File seems to be corrupted or too small";
    }

    // Validasi size maximum
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size too large. Maximum size is ${maxSize}MB`;
    }

    // Validasi type - Safari iOS kadang tidak mengirim MIME type yang benar
    if (file.type) {
      // Jika ada MIME type, validasi
      if (!file.type.startsWith("image/")) {
        return "Please select an image file";
      }
    } else {
      // Safari iOS kadang tidak set MIME type, validasi dari extension
      const extension = file.name.split(".").pop()?.toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "gif", "heic", "heif"];

      if (!extension || !validExtensions.includes(extension)) {
        return `Invalid file format. Supported: ${validExtensions.join(", ")}`;
      }

      console.log("File type empty, validating by extension:", extension);
    }

    return null;
  };

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      console.log("=== FILE CHANGE EVENT ===");
      console.log("Event target:", event.target);
      console.log("Files:", event.target.files);

      const file = event.target.files?.[0];

      if (!file) {
        console.log("No file selected");
        return;
      }

      console.log("File selected:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });

      setValidationError("");
      const validationErr = validateFile(file);

      if (validationErr) {
        console.error("Validation error:", validationErr);
        setValidationError(validationErr);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setUploading(true);
      console.log("File validation passed, processing...");

      // Simulate upload process
      setTimeout(() => {
        console.log("Calling onChange with file:", file);
        onChange(file);
        setUploading(false);
      }, 300);
    },
    [onChange, maxSize],
  );

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Removing file");
    onChange(null);
    setPreview("");
    setValidationError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || uploading) {
      console.log("Click ignored - disabled or uploading");
      return;
    }

    console.log("Opening file picker");

    // Reset input value untuk memastikan onChange trigger bahkan jika file sama
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // Detect browser
  const isSafari =
    typeof window !== "undefined" &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOS =
    typeof window !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  console.log("Browser detection:", { isSafari, isIOS });

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-4">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          // PENTING: Untuk Safari iOS, gunakan multiple accepted formats
          accept="image/jpeg,image/jpg,image/png,image/gif,image/heic,image/heif,image/*"
          onChange={handleFileChange}
          disabled={disabled || uploading}
          className="hidden"
          style={{ display: "none" }}
          // JANGAN gunakan capture - biarkan user pilih
        />

        {/* Upload Area - Gunakan button untuk better compatibility */}
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || uploading}
          className={`
            w-full relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
            ${disabled || uploading ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400 active:border-blue-400 cursor-pointer"}
            ${error || validationError ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"}
          `}
        >
          {uploading ? (
            <div className="space-y-3">
              <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Processing...
                </p>
                <p className="text-sm text-gray-600">
                  Please wait while we process your image
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto text-gray-400">
                {isIOS ? (
                  <Camera className="w-full h-full" />
                ) : (
                  <Upload className="w-full h-full" />
                )}
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isIOS ? "Select Photo" : "Upload an image"}
                </p>
                <p className="text-sm text-gray-600">
                  Tap to select from camera or gallery
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG, GIF{isIOS ? ", HEIC" : ""} • Max {maxSize}MB
                </p>
              </div>
            </div>
          )}
        </button>

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
              onError={(e) => {
                console.error("Failed to load preview image");
                setPreview("");
              }}
            />

            {/* Remove Button */}
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full transition-colors shadow-lg z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Success Indicator */}
            <div className="absolute bottom-2 left-2 flex items-center space-x-2 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Ready to upload</span>
            </div>
          </div>

          {/* Image Info */}
          {value instanceof File && (
            <div className="mt-2 text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span
                    className="truncate ml-2 max-w-[200px]"
                    title={value.name}
                  >
                    {value.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Size:</span>
                  <span>{(value.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                {value.type && (
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span>{value.type}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
