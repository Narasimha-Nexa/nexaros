const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class AdminApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') localStorage.setItem('admin_token', token);
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') localStorage.removeItem('admin_token');
  }

  async request(path: string, options: RequestInit & { params?: Record<string, string> } = {}) {
    const { params, ...fetchOptions } = options;
    const token = this.getToken();

    let url = `${API_BASE}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v) searchParams.set(k, v); });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(fetchOptions.headers as Record<string, string> || {}),
    };

    const res = await fetch(url, { ...fetchOptions, headers });

    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async verifyMfa(code: string, token: string) {
    return this.request('/admin/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ code, token }),
    });
  }

  // Dashboard
  async getPlatformStats() {
    return this.request('/platform/stats');
  }

  async getExpiringSoon(days = 7) {
    return this.request(`/billing/admin/expiring-soon?days=${days}`);
  }

  // Tenants
  async listTenants(params: Record<string, string> = {}) {
    return this.request('/tenants', { params });
  }

  async getTenants(page = 1, limit = 20, search = '') {
    return this.request('/tenants', { params: { page: String(page), limit: String(limit), search } });
  }

  async getTenant(id: string) {
    return this.request(`/tenants/${id}`);
  }

  async createTenant(data: Record<string, string>) {
    return this.request('/tenants', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateTenant(id: string, data: Record<string, string>) {
    return this.request(`/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async suspendTenant(id: string) {
    return this.request(`/tenants/${id}/suspend`, { method: 'POST' });
  }

  async activateTenant(id: string) {
    return this.request(`/tenants/${id}/activate`, { method: 'POST' });
  }

  // Subscriptions
  async getSubscriptions(page = 1, limit = 50, status = '') {
    return this.request('/billing/admin/subscriptions', { params: { page: String(page), limit: String(limit), status } });
  }

  async transitionSubscription(tenantId: string, status: string) {
    return this.request('/billing/transition', {
      method: 'POST',
      body: JSON.stringify({ tenantId, status }),
    });
  }

  // Billing
  async getInvoices(tenantId: string) {
    return this.request(`/billing/invoices/${tenantId}`);
  }

  async getPayments(tenantId: string) {
    return this.request(`/billing/payments/${tenantId}`);
  }

  async getEntitlements(tenantId: string) {
    return this.request(`/billing/entitlements/${tenantId}`);
  }

  // Plans
  async getPlans() {
    return this.request('/entitlements/plans');
  }

  async getModuleKeys() {
    return this.request('/entitlements/modules');
  }

  async updatePlanEntitlements(planId: string, entitlements: Record<string, boolean>) {
    return this.request(`/entitlements/plans/${planId}/entitlements`, {
      method: 'PUT',
      body: JSON.stringify({ entitlements }),
    });
  }

  // Coupons
  async getCoupons(page = 1, limit = 50) {
    return this.request('/coupons', { params: { page: String(page), limit: String(limit) } });
  }

  async createCoupon(data: any) {
    return this.request('/coupons', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateCoupon(id: string, data: any) {
    return this.request(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async getCouponStats(id: string) {
    return this.request(`/coupons/${id}/stats`);
  }

  async createFestivalCampaign(name: string, discountPercent: number, expiry: string, maxUses: number) {
    return this.request('/coupons/festival-campaign', {
      method: 'POST',
      body: JSON.stringify({ name, discountPercent, expiry, maxUses }),
    });
  }

  // Demo Requests
  async getDemoRequests(page = 1, limit = 50, status = '') {
    return this.request('/demo-requests', { params: { page: String(page), limit: String(limit), status } });
  }

  async updateDemoRequestStatus(id: string, status: string, notes?: string) {
    return this.request(`/demo-requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  }

  async getDemoRequestStats() {
    return this.request('/demo-requests/admin/stats');
  }

  // Support
  async getSupportTickets(page = 1, limit = 50, filters: Record<string, string> = {}) {
    return this.request('/support/tickets', { params: { page: String(page), limit: String(limit), ...filters } });
  }

  async getTicket(id: string) {
    return this.request(`/support/tickets/${id}`);
  }

  async addTicketMessage(id: string, message: string, isInternal = false) {
    return this.request(`/support/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ senderType: 'SUPPORT', senderId: 'admin', message, isInternal }),
    });
  }

  async updateTicketStatus(id: string, status: string) {
    return this.request(`/support/tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getSupportStats() {
    return this.request('/support/admin/stats');
  }

  // Audit Logs
  async getAuditLogs(page = 1, limit = 50) {
    return this.request('/admin/audit-logs', { params: { page: String(page), limit: String(limit) } });
  }

  // Admin Users
  async getAdminSessions() {
    return this.request('/admin/auth/sessions');
  }

  // Notifications
  async getNotifications(limit = 50, unreadOnly = false) {
    return this.request('/admin/notifications', {
      params: { limit: String(limit), unreadOnly: String(unreadOnly) },
    });
  }

  async getUnreadNotificationCount() {
    return this.request('/admin/notifications/unread-count');
  }

  async markNotificationRead(id: string) {
    return this.request(`/admin/notifications/${id}/read`, { method: 'POST' });
  }

  async markAllNotificationsRead() {
    return this.request('/admin/notifications/read-all', { method: 'POST' });
  }

  // Database
  async getDatabaseStats() {
    return this.request('/admin/database/stats');
  }

  // Platform Settings
  async getSettings() {
    return this.request('/platform/settings');
  }

  async setSetting(key: string, value: any, description?: string) {
    return this.request('/platform/settings', {
      method: 'POST',
      body: JSON.stringify({ key, value, description }),
    });
  }

  async getMaintenanceMode() {
    return this.request('/platform/maintenance-mode');
  }

  async setMaintenanceMode(enabled: boolean, message?: string) {
    return this.request('/platform/maintenance-mode', {
      method: 'POST',
      body: JSON.stringify({ enabled, message }),
    });
  }

  // Payment Promises
  async getPaymentPromises(tenantId: string) {
    return this.request(`/billing/payment-promises/${tenantId}`);
  }

  // Feature Flags
  async getFeatureFlags() {
    return this.request('/entitlements/feature-flags');
  }

  async toggleFeatureFlag(key: string, enabled: boolean) {
    return this.request('/entitlements/feature-flags', {
      method: 'POST',
      body: JSON.stringify({ key, enabled }),
    });
  }

  // Tenant Provisioning
  async provisionTenant(data: {
    restaurantName: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone?: string;
    password?: string;
    address?: string;
    city?: string;
    state?: string;
    cuisineType?: string;
    planId?: string;
    gstNumber?: string;
    phone?: string;
  }) {
    return this.request('/admin/tenants/provision', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const adminApi = new AdminApiClient();
