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

  static async getRestaurantClaims(filters?: {
    status?: 'pending' | 'approved' | 'rejected';
    search?: string;
    page?: number;
    limit?: number;
  }) {
    let url = '/restaurant-claims';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (typeof filters.page === 'number') params.append('page', String(filters.page));
      if (typeof filters.limit === 'number') params.append('limit', String(filters.limit));
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    return await this.request(url);
  }

  static async getAdminRestaurants(filters?: {
    status?: 'draft' | 'published' | 'archived';
    search?: string;
    city?: string;
    claimed?: 'claimed' | 'unclaimed';
    owner?: string;
    page?: number;
    limit?: number;
  }) {
    let url = '/admin/restaurants';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.city) params.append('city', filters.city);
      if (filters.claimed) params.append('claimed', filters.claimed);
      if (filters.owner) params.append('owner', filters.owner);
      if (typeof filters.page === 'number') params.append('page', String(filters.page));
      if (typeof filters.limit === 'number') params.append('limit', String(filters.limit));
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    return await this.request(url);
  }

  static async getAdminRestaurant(id: string) {
    return await this.request(`/admin/restaurants/${id}`);
  }

  static async updateAdminRestaurantStatus(
    id: string,
    status: 'draft' | 'published' | 'archived'
  ) {
    return await this.request(`/admin/restaurants/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  static async reassignAdminRestaurantOwner(
    id: string,
    body: { ownerId?: string; ownerEmail?: string }
  ) {
    return await this.request(`/admin/restaurants/${id}/owner`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  static async getBannedPhrases() {
    return await this.request('/admin/review-moderation/banned-phrases');
  }

  static async createBannedPhrase(phrase: string) {
    return await this.request('/admin/review-moderation/banned-phrases', {
      method: 'POST',
      body: JSON.stringify({ phrase }),
    });
  }

  static async updateBannedPhrase(id: string, phrase: string) {
    return await this.request(`/admin/review-moderation/banned-phrases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ phrase }),
    });
  }

  static async deleteBannedPhrase(id: string) {
    return await this.request(`/admin/review-moderation/banned-phrases/${id}`, {
      method: 'DELETE',
    });
  }

  static async getFlaggedReviews(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    let url = '/admin/review-moderation/flagged-reviews';
    if (params) {
      const searchParams = new URLSearchParams();
      if (typeof params.page === 'number') searchParams.append('page', String(params.page));
      if (typeof params.limit === 'number') searchParams.append('limit', String(params.limit));
      if (params.search) searchParams.append('search', params.search);
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }
    return await this.request(url);
  }

  static async getFlaggedReviewsCount() {
    return await this.request('/admin/review-moderation/flagged-reviews/count');
  }

  static async approveFlaggedReview(id: string, adminNotes?: string) {
    return await this.request(`/admin/review-moderation/flagged-reviews/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ adminNotes }),
    });
  }

  static async denyFlaggedReview(id: string, adminNotes?: string) {
    return await this.request(`/admin/review-moderation/flagged-reviews/${id}/deny`, {
      method: 'PATCH',
      body: JSON.stringify({ adminNotes }),
    });
  }

  static async updateFlaggedReview(
    id: string,
    body: { title?: string; comment?: string; adminNotes?: string }
  ) {
    return await this.request(`/admin/review-moderation/flagged-reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  static async updateRestaurantClaimStatus(
    id: string,
    status: 'approved' | 'rejected',
    adminNotes?: string,
    rejectionEmailMessage?: string
  ) {
    return await this.request(`/restaurant-claims/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes, rejectionEmailMessage }),
    });
  }

  // Helper to normalize _id to id
  static normalizeApplication(app: any): any {
    if (app._id && !app.id) {
      app.id = app._id;
    }
    return app;
  }
}
