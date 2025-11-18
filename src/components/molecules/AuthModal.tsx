import React, { useState } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Phone,
} from "lucide-react";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import { AuthService } from "@/utils/auth";
import { useNotifications } from "../organisms/NotificationContainer";
import { decodeJwt } from "@/lib/helper";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any, session: any) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { showSuccess, showError } = useNotifications();

  const resetForm = () => {
    setFormData({
      phone: "",
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
    });
    setError("");
    setSuccess("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleModeSwitch = (newMode: "signin" | "signup") => {
    setMode(newMode);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return false;
    } else if (formData.phone.length < 9) {
      setError("Phone number must be at least 9 digits");
      return false;
    } else if (formData.phone.length > 14) {
      setError("Phone number is too long");
      return false;
    } else if (!formData.phone.startsWith("0")) {
      setError("Phone number must start with 0");
      return false;
    }

    if (!formData.password) {
      setError("Password is required");
      return false;
    } else if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    if (mode === "signup") {
      if (!formData.name.trim()) {
        setError("Name is required");
        return false;
      } else if (/[^a-zA-Z0-9\s]/.test(formData.name)) {
        setError("Names must not include special characters");
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }

      if (!formData.email.trim()) {
        setError("Email is required");
        return false;
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError("Invalid email format");
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "signup") {
        await AuthService.signUp({
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });

        setSuccess("Account created successfully! Please login.");

        // Auto-switch to signin after successful signup
        setTimeout(() => {
          handleModeSwitch("signin");
        }, 2000);
      } else {
        const response = await AuthService.signIn({
          phone: formData.phone,
          password: formData.password,
        });

        // Save session and notify parent component
        if (response.data) {
          const decoded = await decodeJwt(response.data.accessToken);
          const session = {
            access_token: response.data.accessToken,
            expires_at: Number(decoded.exp),
          };
          AuthService.saveSession(session);

          const dataUser = await AuthService.getCurrentUser(
            response.data.accessToken
          );
          onAuthSuccess(dataUser, session);
        }
        showSuccess("Success Login!");
        handleClose();
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(""); // Clear error when user starts typing
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-gray-600">
            {mode === "signin"
              ? "Sign in to your Blax Football account"
              : "Join the blax community today"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field (Sign Up Only) */}
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Masukkan nama anda"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  icon={<User className="h-5 w-5 text-gray-400" />}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Masukkan email anda"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  icon={<Mail className="h-5 w-5 text-gray-400" />}
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <Input
              type="tel"
              placeholder="Masukkan no hp anda"
              value={formData.phone}
              onChange={(e) => {
                // hanya ambil angka (0-9)
                const onlyNums = e.target.value.replace(/\D/g, "");
                handleInputChange("phone", onlyNums);
              }}
              icon={<Phone className="h-5 w-5 text-gray-400" />}
              className="w-full"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={
                  mode === "signin" ? "Masukkan password" : "Buat password"
                }
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                icon={<Lock className="h-5 w-5 text-gray-400" />}
                className="w-full pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Sign Up Only) */}
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  icon={<Lock className="h-5 w-5 text-gray-400" />}
                  className="w-full pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {mode === "signin" ? "Signing In..." : "Creating Account..."}
              </div>
            ) : mode === "signin" ? (
              "Sign In"
            ) : (
              "Buat Akun"
            )}
          </Button>
        </form>

        {/* Mode Switch */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {mode === "signin" ? "Tidak punya akun? " : "Sudah punya akun? "}
            <button
              onClick={() =>
                handleModeSwitch(mode === "signin" ? "signup" : "signin")
              }
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {mode === "signin" ? "Buat akun" : "Masuk"}
            </button>
          </p>
        </div>

        {/* Terms and Privacy */}
        {mode === "signup" && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Privacy Policy
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
