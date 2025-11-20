import { AuthService } from "./auth";

export class ApiClient {
  private static instance: ApiClient;
  private baseURL: string;

  private constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_BE!;
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async getAuthHeaders(
    isFormData: boolean = false
  ): Promise<HeadersInit> {
    const session = await AuthService.getSession();
    const headers: HeadersInit = {};

    // Jangan set Content-Type untuk FormData, biarkan browser yang set dengan boundary
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  private async handleResponse(response: Response): Promise<any> {
    // Check for authentication errors
    if (response.status === 401 || response.status === 403) {
      // Cek session
      const session = await AuthService.getSession();

      if (typeof window !== "undefined") {
        if (session?.isAdmin) {
          window.location.href = "/b/auth/login";
        } else {
          window.location.href = "/";
        }

        // Auto signout on authentication errors
        AuthService.clearSession();
      }

      throw new Error("Authentication failed. Please sign in again.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  async get(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "GET",
      headers: { ...headers, ...options.headers },
      ...options,
    });

    return this.handleResponse(response);
  }

  async post(
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<any> {
    const isFormData = data instanceof FormData;
    const headers = await this.getAuthHeaders(isFormData);

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers: { ...headers, ...options.headers },
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse(response);
  }

  async put(
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<any> {
    const isFormData = data instanceof FormData;
    const headers = await this.getAuthHeaders(isFormData);

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "PUT",
      headers: { ...headers, ...options.headers },
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse(response);
  }

  async delete(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "DELETE",
      headers: { ...headers, ...options.headers },
      ...options,
    });

    return this.handleResponse(response);
  }
}

export const apiClient = ApiClient.getInstance();
