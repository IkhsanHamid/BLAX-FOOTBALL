export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  isMember: boolean;
  code: string;
}

export interface AuthSession {
  accessToken: string;
}

export interface SignUpRequest {
  phone: string;
  password: string;
  name: string;
  email: string;
  type?: string;
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

export interface SignUpResponse {
  message: string;
  data: string | null;
}

export interface AuthError {
  error: string;
}

export interface FormSignup {
  phone: string;
  email: string;
  password: string;
  name: string;
  membership?: boolean;
  type?: string;
}
