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
  Crown,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import { AuthService } from "@/utils/auth";
import { useNotifications } from "../organisms/NotificationContainer";
import { decodeJwt } from "@/lib/helper";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FormSignup } from "@/types/auth";
import { useFormSignup } from "@/contexts/FormSignupContext";
import { paymentService } from "@/utils/payment";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any, session: any) => void;
  mode?: "signin" | "signup";
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  mode: initialMode = "signin",
}: AuthModalProps) {
  // ---- FLEXIBLE MODE ----
  const [authMode, setAuthMode] = useState<
    "signin" | "signup" | "forgot-password" | "verify-otp" | "reset-password"
  >(initialMode);

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
    type: "",
    otp: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [includeMembership, setIncludeMembership] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const { showSuccess } = useNotifications();
  const { setSelectedSignup } = useFormSignup();

  const resetForm = () => {
    setFormData({
      phone: "",
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
      type: "",
      otp: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setError("");
    setSuccess("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setResetEmail("");
    setOtpValues(["", "", "", "", "", ""]);
  };

  const handleModeSwitch = (
    newMode:
      | "signin"
      | "signup"
      | "forgot-password"
      | "verify-otp"
      | "reset-password"
  ) => {
    setAuthMode(newMode);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ---- VALIDATION ----
  const validateForm = () => {
    if (authMode === "signup") {
      if (!formData.name.trim()) {
        setError("Nama wajib di isi");
        return false;
      } else if (/[^a-zA-Z0-9\s]/.test(formData.name)) {
        setError("Nama tidak boleh mengandung spesial karakter");
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Password konfirmasi tidak sesuai");
        return false;
      }
      // email
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

    if (authMode === "forgot-password") {
      if (!formData.email.trim()) {
        setError("Email wajib di isi");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Format email tidak valid");
        return false;
      }
      return true;
    }

    if (authMode === "verify-otp") {
      const otpString = otpValues.join("");
      if (!otpString.trim()) {
        setError("Kode OTP wajib di isi");
        return false;
      }
      if (otpString.length !== 6) {
        setError("Kode OTP harus 6 digit");
        return false;
      }
      return true;
    }

    if (authMode === "reset-password") {
      if (!formData.newPassword) {
        setError("Password baru wajib di isi");
        return false;
      }
      if (formData.newPassword.length < 6) {
        setError("Password minimal 6 karakter");
        return false;
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        setError("Konfirmasi password tidak sesuai");
        return false;
      }
      return true;
    }

    //  no hp
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

    return true;
  };

  // ---- FORGOT PASSWORD FLOW ----
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // TODO: Replace with your actual API endpoint
      await AuthService.requestPasswordReset(formData.email);

      setResetEmail(formData.email);
      setSuccess("Kode OTP telah dikirim ke email Anda");

      setTimeout(() => {
        setAuthMode("verify-otp");
        setSuccess("");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Gagal mengirim kode OTP. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const otpString = otpValues.join("");
      // TODO: Replace with your actual API endpoint
      const verify = await AuthService.verifyOTP(resetEmail, otpString);

      setResetToken(verify.resetToken);

      setSuccess("Kode OTP berhasil diverifikasi");

      setTimeout(() => {
        setAuthMode("reset-password");
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Kode OTP tidak valid. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // TODO: Replace with your actual API endpoint
      await AuthService.resetPassword(resetToken, formData.newPassword);

      setSuccess("Password berhasil direset! Silakan login.");

      setTimeout(() => {
        handleModeSwitch("signin");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Gagal mereset password. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // ---- SUBMIT ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Route to appropriate handler based on mode
    if (authMode === "forgot-password") {
      return handleForgotPassword(e);
    }
    if (authMode === "verify-otp") {
      return handleVerifyOTP(e);
    }
    if (authMode === "reset-password") {
      return handleResetPassword(e);
    }

    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (authMode === "signup") {
        const formSignup: FormSignup = {
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          name: formData.name,
        };

        if (includeMembership) {
          formSignup.membership = true;
          formSignup.type = "member";
          setSelectedSignup(formSignup);
          const response = await AuthService.signUp(formSignup);

          if (response.data) {
            const setupPayment = await paymentService.setupMemberPayment(
              response.data!
            );
            setSuccess(
              "Akun berhasil dibuat! Mohon tunggu untuk melakukan pembayaran."
            );
            router.push(`/signup/membership?paymentId=${setupPayment}`);
          }
        } else {
          formSignup.type = "non member";
          await AuthService.signUp(formSignup);
          setSuccess("Akun berhasil dibuat! Silahkan login.");
          setTimeout(() => {
            handleModeSwitch("signin");
          }, 2000);
        }
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

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);
    setError("");

    // Auto focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);

    if (digits.length > 0) {
      const newOtpValues = [...otpValues];
      for (let i = 0; i < digits.length && i < 6; i++) {
        newOtpValues[i] = digits[i];
      }
      setOtpValues(newOtpValues);

      const nextIndex = Math.min(digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    }
  };

  if (!isOpen) return null;

  // ---- RENDER TITLE & SUBTITLE ----
  const getTitle = () => {
    switch (authMode) {
      case "signin":
        return "Selamat Datang";
      case "signup":
        return "Buat Akun";
      case "forgot-password":
        return "Lupa Password";
      case "verify-otp":
        return "Verifikasi OTP";
      case "reset-password":
        return "Reset Password";
      default:
        return "Selamat Datang";
    }
  };

  const getSubtitle = () => {
    switch (authMode) {
      case "signin":
        return "Masuk ke akun blax kamu";
      case "signup":
        return "Join blax sekarang!";
      case "forgot-password":
        return "Masukkan email untuk reset password";
      case "verify-otp":
        return "Masukkan kode OTP yang dikirim ke email";
      case "reset-password":
        return "Buat password baru untuk akun Anda";
      default:
        return "Masuk ke akun blax kamu";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Back button for forgot password flow */}
        {(authMode === "forgot-password" ||
          authMode === "verify-otp" ||
          authMode === "reset-password") && (
          <button
            onClick={() => {
              if (authMode === "verify-otp") {
                setAuthMode("forgot-password");
              } else {
                setAuthMode("signin");
              }
              setError("");
              setSuccess("");
            }}
            className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {getTitle()}
          </h2>
          <p className="text-muted-foreground text-sm">{getSubtitle()}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* FORGOT PASSWORD - Email Input */}
          {authMode === "forgot-password" && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Email
              </label>
              <Input
                type="email"
                placeholder="Masukkan email Anda"
                value={formData.email}
                onChange={(e) => {
                  const noSpaces = e.target.value.replace(/\s/g, "");
                  handleInputChange("email", noSpaces);
                }}
                icon={<Mail className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
          )}

          {/* VERIFY OTP */}
          {authMode === "verify-otp" && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-3 text-center">
                Kode OTP
              </label>
              <div className="flex gap-2 justify-center mb-4">
                {otpValues.map((value, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-12 h-14 text-center text-2xl font-semibold border-2 border-border rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-background"
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Kode OTP telah dikirim ke{" "}
                <span className="font-medium">{resetEmail}</span>
              </p>
            </div>
          )}

          {/* RESET PASSWORD */}
          {authMode === "reset-password" && (
            <>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Password Baru
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Min. 6 karakter"
                    value={formData.newPassword}
                    onChange={(e) => {
                      const noSpaces = e.target.value.replace(/\s/g, "");
                      handleInputChange("newPassword", noSpaces);
                    }}
                    icon={<Lock className="h-4 w-4 text-muted-foreground" />}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmNewPassword ? "text" : "password"}
                    placeholder="Ulangi password baru"
                    value={formData.confirmNewPassword}
                    onChange={(e) => {
                      const noSpaces = e.target.value.replace(/\s/g, "");
                      handleInputChange("confirmNewPassword", noSpaces);
                    }}
                    icon={<Lock className="h-4 w-4 text-muted-foreground" />}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmNewPassword(!showConfirmNewPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* SIGNUP FORM */}
          {authMode === "signup" && (
            <div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Nama lengkap
                </label>
                <Input
                  type="text"
                  placeholder="Nama anda"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  icon={<User className="h-4 w-4 text-muted-foreground" />}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Email anda"
                  value={formData.email}
                  onChange={(e) => {
                    const noSpaces = e.target.value.replace(/\s/g, "");
                    handleInputChange("email", noSpaces);
                  }}
                  icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                />
              </div>
            </div>
          )}

          {/* SIGNIN & SIGNUP - Phone Number */}
          {(authMode === "signin" || authMode === "signup") && (
            <div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  No HP
                </label>
                <Input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/\D/g, "");
                    handleInputChange("phone", onlyNums);
                  }}
                  icon={<Phone className="h-4 w-4 text-muted-foreground" />}
                />
              </div>

              {authMode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 karakter"
                      value={formData.password}
                      onChange={(e) => {
                        const noSpaces = e.target.value.replace(/\s/g, "");
                        handleInputChange("password", noSpaces);
                      }}
                      icon={<Lock className="h-4 w-4 text-muted-foreground" />}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SIGNIN - Password */}
          {authMode === "signin" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-foreground">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => handleModeSwitch("forgot-password")}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Lupa Password?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={(e) => {
                    const noSpaces = e.target.value.replace(/\s/g, "");
                    handleInputChange("password", noSpaces);
                  }}
                  icon={<Lock className="h-4 w-4 text-muted-foreground" />}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SIGNUP - Confirm Password & Membership */}
          {authMode === "signup" && (
            <>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      const noSpaces = e.target.value.replace(/\s/g, "");
                      handleInputChange("confirmPassword", noSpaces);
                    }}
                    icon={<Lock className="h-4 w-4 text-muted-foreground" />}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Compact Membership Card */}
              <div
                onClick={() => setIncludeMembership(!includeMembership)}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  includeMembership
                    ? "bg-amber-50 border-amber-300"
                    : "bg-muted/30 border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-all ${
                      includeMembership
                        ? "bg-amber-500"
                        : "bg-background border-2 border-muted-foreground/30"
                    }`}
                  >
                    {includeMembership && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-sm text-foreground">
                        Membership Program
                      </span>
                      <span className="text-xs text-amber-600 font-semibold">
                        IDR 100K
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Discount eksklusif, diskon 10%, akses live lineup
                    </p>
                    {includeMembership && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex items-center gap-2 text-amber-700 bg-amber-100 px-3 py-2 rounded-lg mt-2"
                      >
                        <Crown className="w-4 h-4" />
                        <span className="text-[10px] leading-tight">
                          Membership checkout akan muncul setelah klik tombol
                          dibawah ini
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-b-2 border-white mr-2"></div>
                {authMode === "signin" && "Signing In..."}
                {authMode === "signup" && "Creating Account..."}
                {authMode === "forgot-password" && "Mengirim OTP..."}
                {authMode === "verify-otp" && "Memverifikasi..."}
                {authMode === "reset-password" && "Mereset Password..."}
              </div>
            ) : (
              <>
                {authMode === "signin" && "Login"}
                {authMode === "signup" && "Buat Akun"}
                {authMode === "forgot-password" && "Kirim Kode OTP"}
                {authMode === "verify-otp" && "Verifikasi OTP"}
                {authMode === "reset-password" && "Reset Password"}
              </>
            )}
          </Button>
        </form>

        {/* MODE SWITCH */}
        {(authMode === "signin" || authMode === "signup") && (
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
        )}

        {/* RESEND OTP */}
        {authMode === "verify-otp" && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              Kirim ulang kode OTP
            </button>
          </div>
        )}

        {/* TERMS & PRIVACY */}
        {authMode === "signup" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Dengan membuat akun, anda setuju dengan{" "}
            <a href="#" className="text-primary hover:underline">
              Terms
            </a>{" "}
            &{" "}
            <a href="#" className="text-primary hover:underline">
              Privacy
            </a>
          </p>
        )}
      </motion.div>
    </div>
  );
}
