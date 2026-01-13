import {
  AuthResponse,
  AuthError,
  SignUpRequest,
  SignInRequest,
  User,
  SignUpResponse,
} from "@/types/auth";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BE}/api/v1/auth`;

export class AuthService {
  static async signUp(data: SignUpRequest): Promise<SignUpResponse> {
    const payload = {
      phone: data.phone,
      password: data.password,
      name: data.name,
      email: data.email,
      type: data.type,
    };
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.log("response", response);
      console.log("result", result);
      throw new Error(result.message || "Sign up failed");
    }

    return result;
  }

  static async signIn(data: SignInRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Sign in failed");
    }

    return result;
  }

  static async signOut(token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Sign out failed");
    }
  }

  static async getCurrentUser(token: string): Promise<User> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BE}/api/v1/users/findUser`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to get user");
    }

    return result.data;
  }

  // Local storage helpers
  static saveSession(session: {
    access_token: string;
    expires_at: number;
    isAdmin?: boolean;
  }) {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_session", JSON.stringify(session));
    }
  }

  static async getSession() {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("auth_session");
      if (session) {
        return JSON.parse(session);
      }
      return null;
    }
    return null;
  }

  static clearSession() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_session");
    }
  }

  static isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt * 1000;
  }

  static async requestPasswordReset(email: string) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BE}/api/v1/users/send-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to send OTP");
    }

    return result.data;
  }

  static async verifyOTP(email: string, otp: string) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BE}/api/v1/users/verify-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Invalid or expired OTP");
    }

    return result.data;
  }

  static async resetPassword(resetToken: string, password: string) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BE}/api/v1/users/reset`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resetToken,
          password,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Invalid reset password");
    }

    return result.data;
  }
}
