"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  ArrowLeft,
  Shield,
  Mail,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/utils/auth";
import { decodeJwt } from "@/lib/helper";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLogin() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { showSuccess, showError } = useNotifications();
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (user && (user.role === "Admin" || user.role === "Admin-news")) {
      router.push("/admin");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await AuthService.signIn({
        email: credentials.email,
        password: credentials.password,
      });

      if (response.data) {
        const decoded = await decodeJwt(response.data.accessToken);
        const session = {
          access_token: response.data.accessToken,
          isAdmin: decoded.isAdmin,
          expires_at: Number(decoded.exp),
        };
        AuthService.saveSession(session);
        const dataUser = await AuthService.getCurrentUser(
          response.data.accessToken
        );

        setUser(dataUser);
        setSuccess("Success Login!");
        showSuccess("Success Login!");

        setTimeout(() => {
          router.push("/admin");
        }, 1000);
      } else {
        setError("Authentication failed");
        showError("Authentication failed");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      showError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2387CEEB%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

        <div className="relative w-full max-w-md">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = "/")}
            className="absolute -top-12 left-0 text-sky-700 hover:text-sky-800 hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Site
          </Button>

          {/* Login Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-sky-200/50 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-700 to-blue-700 bg-clip-text text-transparent">
                {isLogin ? "Admin Portal" : "Create Admin Account"}
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="relative">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your email"
                    value={credentials.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    icon={<Mail className="h-5 w-5 text-gray-400" />}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="relative">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={"Enter your password"}
                      value={credentials.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
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
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? "Signing in..." : "Log In"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
