import React, { useState, useEffect } from "react";
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
  mode?: "signin" | "signup"; // optional (default signin)
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  mode: initialMode = "signin",
}: AuthModalProps) {
  // ---- FLEXIBLE MODE ----
  const [authMode, setAuthMode] = useState<"signin" | "signup">(initialMode);

  useEffect(() => {
    setAuthMode(initialMode);
    resetForm();
  }, [initialMode]);

  // ---- FORM DATA ----
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

  const { showSuccess } = useNotifications();

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
    setAuthMode(newMode);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ---- VALIDATION ----
  const validateForm = () => {
    if (!formData.phone.trim()) {
      setError("No HP wajib di isi");
      return false;
    } else if (formData.phone.length < 9) {
      setError("No HP terlalu pendek");
      return false;
    } else if (formData.phone.length > 14) {
      setError("No HP terlalu panjang");
      return false;
    } else if (!formData.phone.startsWith("0")) {
      setError("No HP harus diawali dengan 0");
      return false;
    }

    if (!formData.password) {
      setError("Password wajib di isi");
      return false;
    } else if (formData.password.length < 6) {
      setError("Password minimal 6 karakter");
      return false;
    }

    if (authMode === "signup") {
      if (!formData.name.trim()) {
        setError("Name wajib di isi");
        return false;
      } else if (/[^a-zA-Z0-9\s]/.test(formData.name)) {
        setError("Names tidak boleh mengandung spesial karakter");
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Password konfirmasi tidak sesuai");
        return false;
      }

      if (!formData.email.trim()) {
        setError("Email wajib di isi");
        return false;
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError("Format email tidak valid");
          return false;
        }
      }
    }

    return true;
  };

  // ---- SUBMIT ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (authMode === "signup") {
        await AuthService.signUp({
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });

        setSuccess("Akun berhasil dibuat! Silahkan login.");

        setTimeout(() => {
          handleModeSwitch("signin");
        }, 2000);
      } else {
        const response = await AuthService.signIn({
          phone: formData.phone,
          password: formData.password,
        });

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

        showSuccess("Berhasil Login!");
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
    setError("");
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
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {authMode === "signin" ? "Selamat Datang" : "Buat Akun"}
          </h2>
          <p className="text-gray-600">
            {authMode === "signin"
              ? "Masuk ke akun blax kamu"
              : "Join blax sekarang!"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Email (Signup Only) */}
          {authMode === "signup" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama lengkap
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

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No HP
            </label>
            <Input
              type="tel"
              placeholder="Masukkan no hp anda"
              value={formData.phone}
              onChange={(e) => {
                const onlyNums = e.target.value.replace(/\D/g, "");
                handleInputChange("phone", onlyNums);
              }}
              icon={<Phone className="h-5 w-5 text-gray-400" />}
              className="w-full"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={
                  authMode === "signin" ? "Masukkan password" : "Buat password"
                }
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                icon={<Lock className="h-5 w-5 text-gray-400" />}
                className="w-full pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          {authMode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Password
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-b-2 border-white mr-2"></div>
                {authMode === "signin"
                  ? "Signing In..."
                  : "Creating Account..."}
              </div>
            ) : authMode === "signin" ? (
              "Login"
            ) : (
              "Buat Akun"
            )}
          </Button>
        </form>

        {/* Switch Auth Mode */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {authMode === "signin"
              ? "Tidak punya akun? "
              : "Sudah punya akun? "}
            <button
              onClick={() =>
                handleModeSwitch(authMode === "signin" ? "signup" : "signin")
              }
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {authMode === "signin" ? "Buat akun" : "Masuk"}
            </button>
          </p>
        </div>

        {/* Terms */}
        {authMode === "signup" && (
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
