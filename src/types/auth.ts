export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
}

export interface AuthSession {
  accessToken: string;
}

export interface SignUpRequest {
  phone: string;
  password: string;
  name: string;
  email: string;
}

export interface SignInRequest {
  phone?: string;
  email?: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  data: AuthSession;
}

export interface AuthError {
  error: string;
}
