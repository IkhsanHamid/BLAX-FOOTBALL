"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
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
  maxSize?: number;
  acceptedTypes?: string[];
}

// iOS/Safari MIME type normalization map
const IOS_MIME_MAP: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/heic": "image/jpeg",
  "image/heif": "image/jpeg",
  "image/HEIC": "image/jpeg",
  "image/HEIF": "image/jpeg",
};

// Extension to MIME type fallback
const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  heic: "image/jpeg",
  heif: "image/jpeg",
  webp: "image/webp",
};

// VALID image MIME types accepted by browsers generally
const VALID_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
]);

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
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile safely inside useEffect (avoids SSR issues)
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
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

  /**
   * Resolve the "real" MIME type for a file.
   * Handles:
   * - iOS HEIC/HEIF sent with wrong MIME
   * - Chrome Android sometimes sends empty string for certain picks
   * - Files with no MIME (fallback to extension)
   */
  const resolveMimeType = (file: File): string => {
    // 1. Normalize known iOS quirks
    if (IOS_MIME_MAP[file.type]) return IOS_MIME_MAP[file.type];

    // 2. If a valid image MIME is already present, trust it
    if (file.type && VALID_IMAGE_MIMES.has(file.type)) return file.type;

    // 3. If type starts with image/ but isn't in our set, still accept it
    if (file.type && file.type.startsWith("image/")) return file.type;

    // 4. Fall back to file extension (Chrome Android can send empty MIME)
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];

    // 5. Last resort: assume jpeg (covers most camera shots)
    return "image/jpeg";
  };

  const validateFile = (file: File): string | null => {
    // Guard: empty file object (shouldn't happen but defensive)
    if (!file) return "No file selected";

    const resolvedType = resolveMimeType(file);

    // Must resolve to an image
    if (!resolvedType.startsWith("image/")) {
      return "Please select an image file";
    }

    // Check against accepted types (normalize both sides for comparison)
    const normalizedAccepted = acceptedTypes.map((t) => IOS_MIME_MAP[t] ?? t);
    if (!normalizedAccepted.includes(resolvedType)) {
      const readableTypes = acceptedTypes
        .map((t) => (IOS_MIME_MAP[t] ?? t).split("/")[1].replace("jpeg", "jpg"))
        .join(", ");
      return `File type not supported. Please use: ${readableTypes}`;
    }

    // Size check
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size is ${maxSize}MB`;
    }

    // Sanity check for corrupted / empty files
    // Note: lower threshold (100 bytes) to avoid false positives on small valid files
    if (file.size < 100) {
      return "File appears to be corrupted or too small";
    }

    return null;
  };

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      // Reset input value so the same file can be re-selected if removed
      // Do this AFTER reading the file reference
      const inputEl = event.target;

      if (!file) return;

      setValidationError("");

      const validationErr = validateFile(file);
      if (validationErr) {
        setValidationError(validationErr);
        inputEl.value = "";
        return;
      }

      setUploading(true);

      // For HEIC/HEIF files from iOS, rename to .jpg so downstream works correctly
      const resolvedType = resolveMimeType(file);
      const needsRename =
        resolvedType !== file.type || /\.(heic|heif)$/i.test(file.name);

      const normalizedFile = needsRename
        ? new File([file], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
            type: resolvedType,
            lastModified: file.lastModified,
          })
        : file;

      // Call onChange synchronously — no artificial delay needed
      onChange(normalizedFile);
      setUploading(false);

      // Reset input so user can re-pick the same file later if needed
      inputEl.value = "";
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, maxSize, acceptedTypes],
  );

  const handleRemove = () => {
    onChange(null);
    setPreview("");
    setValidationError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClick = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  // Drag-and-drop support (desktop Chrome)
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled || uploading) return;

      const file = event.dataTransfer.files?.[0];
      if (!file) return;

      setValidationError("");

      const validationErr = validateFile(file);
      if (validationErr) {
        setValidationError(validationErr);
        return;
      }

      setUploading(true);
      const resolvedType = resolveMimeType(file);
      const needsRename =
        resolvedType !== file.type || /\.(heic|heif)$/i.test(file.name);
      const normalizedFile = needsRename
        ? new File([file], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
            type: resolvedType,
            lastModified: file.lastModified,
          })
        : file;

      onChange(normalizedFile);
      setUploading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, maxSize, acceptedTypes, disabled, uploading],
  );

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/*
        Key fixes for Chrome Android:
        - Do NOT use capture="camera" unless you ONLY want camera (it hides file picker on Android)
        - accept="image/*" is the most compatible value — granular MIME lists are ignored on many Android browsers
        - Do NOT set capture={undefined} — just omit the attribute entirely
      */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        role="button"
        tabIndex={disabled || uploading ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleClick();
        }}
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
              <p className="text-lg font-medium text-gray-900">Uploading...</p>
              <p className="text-sm text-gray-600">Processing your image</p>
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
                {isMobile ? "Tap to select" : "Click or drag & drop"}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Supports: JPG, PNG, GIF{isMobile ? ", HEIC" : ""} • Max:{" "}
                {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {(error || validationError) && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error || validationError}</span>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="relative">
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover"
              onError={() => setPreview("")}
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 flex items-center space-x-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Image loaded</span>
            </div>
          </div>

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
