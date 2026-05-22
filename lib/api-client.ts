const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class APIClient {
  static async request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add auth token if available
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return await response.json();
}
  // Auth endpoints
  static async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  }

  static async register(name: string, email: string, password: string) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  }

  static async getCurrentAdmin() {
    return await this.request('/auth/me');
  }

  static logout() {
    localStorage.removeItem('auth_token');
  }

  // Chef application endpoints
  static async submitChefApplication(applicationData: any) {
    return await this.request('/chef-applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  static async getChefApplications(filters?: {
    status?: string;
    search?: string;
    applicationType?: 'chef' | 'business_owner';
    sortBy?: string;
    order?: string;
  }) {
    let url = '/chef-applications';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.applicationType) params.append('applicationType', filters.applicationType);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.order) params.append('order', filters.order);
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    return await this.request(url);
  }

  static async getChefApplication(id: string) {
    return await this.request(`/chef-applications/${id}`);
  }

  static async updateApplicationStatus(id: string, status: 'approved' | 'rejected' | 'pending', adminNotes?: string) {
    return await this.request(`/chef-applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes }),
    });
  }

  static async getDashboardStats() {
    return await this.request('/stats/overview');
  }

  // Helper to normalize _id to id
  static normalizeApplication(app: any): any {
    if (app._id && !app.id) {
      app.id = app._id;
    }
    return app;
  }
}
