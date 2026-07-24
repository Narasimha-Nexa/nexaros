const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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

    const method = (fetchOptions.method || 'GET').toUpperCase();
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);
    const headers: Record<string, string> = {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
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

  async pauseTenant(id: string) {
    return this.request(`/tenants/${id}/pause`, { method: 'POST' });
  }

  async resumeTenant(id: string) {
    return this.request(`/tenants/${id}/resume`, { method: 'POST' });
  }

  async deleteTenant(id: string) {
    return this.request(`/tenants/${id}`, { method: 'DELETE' });
  }

  async updateTenantStatus(id: string, status: string) {
    return this.request(`/tenants/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
  }

  async getTenantStats() {
    return this.request('/tenants/stats');
  }

  async exportTenants(format: 'csv' | 'json', params: Record<string, string> = {}) {
    return this.request('/tenants/export', { params: { format, ...params } });
  }

  async bulkTenantAction(ids: string[], action: string) {
    return this.request('/tenants/bulk', { method: 'POST', body: JSON.stringify({ ids, action }) });
  }

  // Billing
  async createBillingCheckout(data: { tenantId?: string; planId: string; customerEmail?: string; customerPhone?: string }) {
    return this.request('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyBillingPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    tenantId?: string;
    planId: string;
  }) {
    return this.request('/billing/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  async updatePlanPrice(planId: string, price: number) {
    return this.request(`/plans/admin/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify({ price }),
    });
  }

  // Coupons
  async getCoupons(page = 1, limit = 50, search?: string) {
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (search) params.search = search;
    return this.request('/coupons', { params });
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
  async getAuditLogs(page = 1, limit = 50, search?: string, severity?: string) {
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (search) params.search = search;
    if (severity) params.severity = severity;
    return this.request('/admin/audit-logs', { params });
  }

  // Admin Users
  async getAdminSessions() {
    return this.request('/admin/auth/sessions');
  }

  async getAdminUsers(search = '', page = 1, limit = 50) {
    return this.request(`/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`);
  }

  async createAdminUser(data: { name: string; email: string; password: string; role?: string }) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  // Dashboard Health
  async getDashboardHealth() {
    return this.request('/admin/dashboard/health');
  }

  // Dashboard Snapshots
  async getDashboardSnapshots(branchId?: string, from?: string, to?: string) {
    const params = new URLSearchParams();
    if (branchId) params.set('branchId', branchId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return this.request(`/admin/dashboard/snapshots${qs ? `?${qs}` : ''}`);
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
    country?: string;
    cuisineType?: string;
    planId?: string;
    gstNumber?: string;
    phone?: string;
    timezone?: string;
    currency?: string;
    subdomain?: string;
    logo?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }) {
    return this.request('/admin/tenants/provision', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Provisioning Lifecycle (new)
  async createProvisionDraft(data: Record<string, any>) {
    return this.request('/provisioning/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProvisionPlans() {
    return this.request('/provisioning/plans');
  }

  async calculateProvisionPrice(data: { planId: string; couponCode?: string; billingCycle?: string; customAmount?: number }) {
    return this.request('/provisioning/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async validateProvisionCoupon(data: { couponCode: string; planId: string; billingCycle?: string }) {
    return this.request('/provisioning/coupon/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createProvisionPaymentOrder(data: { requestId: string; paymentProvider?: string }) {
    return this.request('/provisioning/payment/create-order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyProvisionPayment(data: {
    requestId: string;
    paymentOrderId: string;
    paymentId: string;
    paymentSignature: string;
  }) {
    return this.request('/provisioning/payment/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async executeProvisioning(data: { requestId: string }) {
    return this.request('/provisioning/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async previewProvisioning(requestId: string) {
    return this.request('/provisioning/preview', {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    });
  }

  async getProvisionProgress(requestId: string) {
    return this.request(`/provisioning/${requestId}/progress`);
  }

  async getProvisionByToken(token: string) {
    return this.request(`/provisioning/token/${token}`);
  }

  async updateProvisionDraft(requestId: string, data: Record<string, any>) {
    return this.request(`/provisioning/draft/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async validatePreProvision(requestId: string) {
    return this.request(`/provisioning/validate/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async checkOwner(email: string) {
    return this.request('/provisioning/check-owner', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Onboarding
  async startOnboarding() {
    return this.request('/public/onboarding/start', { method: 'POST' });
  }

  async getOnboardingStatus(token: string) {
    return this.request(`/public/onboarding/${token}`);
  }

  async updateOnboardingRestaurant(token: string, data: Record<string, any>) {
    return this.request(`/public/onboarding/${token}/restaurant`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOnboardingOwner(token: string, data: Record<string, any>) {
    return this.request(`/public/onboarding/${token}/owner`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOnboardingSettings(token: string, data: Record<string, any>) {
    return this.request(`/public/onboarding/${token}/settings`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async selectOnboardingPlan(token: string, planId: string, billingCycle?: string, couponCode?: string) {
    return this.request(`/public/onboarding/${token}/plan`, {
      method: 'POST',
      body: JSON.stringify({ planId, billingCycle, couponCode }),
    });
  }

  async createOnboardingPaymentOrder(token: string, couponCode?: string) {
    return this.request(`/public/onboarding/${token}/payment/order?coupon=${couponCode || ''}`, {
      method: 'POST',
    });
  }

  async verifyOnboardingPayment(token: string, data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    return this.request(`/public/onboarding/${token}/payment/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeOnboarding(token: string, data: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }) {
    return this.request(`/public/onboarding/${token}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelOnboarding(token: string) {
    return this.request(`/public/onboarding/${token}/cancel`, {
      method: 'POST',
    });
  }

  // Impersonation
  async impersonate(tenantId: string, userId: string) {
    return this.request('/admin/impersonate', {
      method: 'POST',
      body: JSON.stringify({ tenantId, userId }),
    });
  }

  async exitImpersonation() {
    return this.request('/admin/impersonate/exit', { method: 'POST' });
  }

  // Users (for impersonation target selection)
  async listTenantUsers(tenantId: string) {
    return this.request(`/tenants/${tenantId}/users`);
  }

  // API Keys
  async listApiKeys(tenantId: string) {
    return this.request(`/admin/api-keys`, { params: { tenantId } });
  }

  async createApiKey(tenantId: string, data: { name: string; permissions: string[]; expiresAt?: string }) {
    return this.request('/admin/api-keys', { method: 'POST', body: JSON.stringify({ tenantId, ...data }) });
  }

  async revokeApiKey(id: string) {
    return this.request(`/admin/api-keys/${id}/revoke`, { method: 'POST' });
  }

  async rotateApiKey(id: string) {
    return this.request(`/admin/api-keys/${id}/rotate`, { method: 'POST' });
  }

  async deleteApiKey(id: string) {
    return this.request(`/admin/api-keys/${id}`, { method: 'DELETE' });
  }

  // Webhooks
  async listWebhooks(tenantId: string) {
    return this.request('/admin/webhooks', { params: { tenantId } });
  }

  async createWebhook(tenantId: string, data: { name: string; url: string; events: string[]; secret?: string }) {
    return this.request('/admin/webhooks', { method: 'POST', body: JSON.stringify({ tenantId, ...data }) });
  }

  async updateWebhook(id: string, data: { name?: string; url?: string; events?: string[]; isActive?: boolean }) {
    return this.request(`/admin/webhooks/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async deleteWebhook(id: string) {
    return this.request(`/admin/webhooks/${id}`, { method: 'DELETE' });
  }

  async getWebhookDeliveries(id: string) {
    return this.request(`/admin/webhooks/${id}/deliveries`);
  }

  async testWebhook(id: string) {
    return this.request(`/admin/webhooks/test/${id}`, { method: 'POST' });
  }

  // Workflows
  async listWorkflowTemplates(tenantId: string) {
    return this.request('/admin/workflows/templates', { params: { tenantId } });
  }

  async createWorkflowTemplate(tenantId: string, data: any) {
    return this.request('/admin/workflows/templates', { method: 'POST', body: JSON.stringify({ ...data, tenantId }) });
  }

  async updateWorkflowTemplate(tenantId: string, id: string, data: any) {
    return this.request(`/admin/workflows/templates/${id}`, { method: 'PATCH', params: { tenantId }, body: JSON.stringify(data) });
  }

  async deleteWorkflowTemplate(tenantId: string, id: string) {
    return this.request(`/admin/workflows/templates/${id}`, { method: 'DELETE', params: { tenantId } });
  }

  async listWorkflowRequests(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/workflows/requests', { params: { ...params, tenantId } });
  }

  async getWorkflowRequest(tenantId: string, id: string) {
    return this.request(`/admin/workflows/requests/${id}`, { params: { tenantId } });
  }

  async approveWorkflowRequest(tenantId: string, id: string, data: { decision: string; comment?: string }) {
    return this.request(`/admin/workflows/requests/${id}/approve`, { method: 'POST', params: { tenantId }, body: JSON.stringify(data) });
  }

  async rejectWorkflowRequest(tenantId: string, id: string, comment: string) {
    return this.request(`/admin/workflows/requests/${id}/reject`, { method: 'POST', params: { tenantId }, body: JSON.stringify({ comment }) });
  }

  async getWorkflowStats(tenantId: string) {
    return this.request('/admin/workflows/stats', { params: { tenantId } });
  }

  // AI Insights & Forecasting (admin-scoped, tenant-selected)
  async getAiInsights(tenantId: string) {
    return this.request(`/admin/ai/insights?tenantId=${tenantId}`);
  }

  async getAiForecast(tenantId: string, days = 7) {
    return this.request(`/admin/ai/forecast?tenantId=${tenantId}&days=${days}`);
  }

  async getAiPairings(tenantId: string, menuItemId: string) {
    return this.request(`/admin/ai/pairings/${menuItemId}?tenantId=${tenantId}`);
  }

  // Backups
  async listBackups() {
    return this.request('/admin/backups');
  }

  async triggerBackup(data: { name?: string; type?: string; tables?: string[] }) {
    return this.request('/admin/backups/trigger', { method: 'POST', body: JSON.stringify(data) });
  }

  async restoreBackup(id: string) {
    return this.request(`/admin/backups/${id}/restore`, { method: 'POST' });
  }

  async deleteBackup(id: string) {
    return this.request(`/admin/backups/${id}`, { method: 'DELETE' });
  }

  async getBackupStats() {
    return this.request('/admin/backups/stats');
  }

  // Branches
  async listBranches(params: Record<string, string> = {}) {
    return this.request('/admin/branches', { params });
  }

  async getBranch(id: string) {
    return this.request(`/admin/branches/${id}`);
  }

  async updateBranchStatus(id: string, status: string) {
    return this.request(`/admin/branches/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
  }

  // ─── Website Management (super-admin, tenant-scoped) ───
  async getWebsiteConfig(tenantId: string) {
    return this.request(`/admin/tenants/${tenantId}/website`);
  }

  async updateWebsiteConfig(tenantId: string, data: Record<string, any>) {
    return this.request(`/admin/tenants/${tenantId}/website`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateWebsiteSeo(tenantId: string, seo: Record<string, any>) {
    return this.request(`/admin/tenants/${tenantId}/website/seo`, {
      method: 'PATCH',
      body: JSON.stringify(seo),
    });
  }

  async updateWebsiteFeatures(tenantId: string, features: Record<string, any>) {
    return this.request(`/admin/tenants/${tenantId}/website/features`, {
      method: 'PATCH',
      body: JSON.stringify({ features }),
    });
  }

  async updateWebsiteSections(tenantId: string, sections: any[]) {
    return this.request(`/admin/tenants/${tenantId}/website/sections`, {
      method: 'PATCH',
      body: JSON.stringify({ sections }),
    });
  }

  async publishWebsite(tenantId: string) {
    return this.request(`/admin/tenants/${tenantId}/website/publish`, { method: 'POST' });
  }

  async schedulePublish(tenantId: string, scheduledAt: string) {
    return this.request(`/admin/tenants/${tenantId}/website/schedule`, {
      method: 'POST',
      body: JSON.stringify({ scheduledAt }),
    });
  }

  async cancelScheduledPublish(tenantId: string) {
    return this.request(`/admin/tenants/${tenantId}/website/schedule`, { method: 'DELETE' });
  }

  async getSeoScore(tenantId: string) {
    return this.request(`/admin/tenants/${tenantId}/website/seo-score`);
  }

  async resetWebsite(tenantId: string) {
    return this.request(`/admin/tenants/${tenantId}/website/reset`, { method: 'POST' });
  }

  async saveRevision(tenantId: string, label?: string) {
    return this.request(`/admin/tenants/${tenantId}/website/revisions`, {
      method: 'POST',
      body: JSON.stringify({ label }),
    });
  }

  async listRevisions(tenantId: string) {
    return this.request(`/admin/tenants/${tenantId}/website/revisions`);
  }

  async revertRevision(tenantId: string, revisionId: string) {
    return this.request(`/admin/tenants/${tenantId}/website/revisions/${revisionId}/revert`, { method: 'POST' });
  }

  // ─── Offers (super-admin, tenant-scoped) ───
  async listOffers(tenantId: string) {
    return this.request(`/admin/tenants/${tenantId}/offers`);
  }

  async createOffer(tenantId: string, data: Record<string, any>) {
    return this.request(`/admin/tenants/${tenantId}/offers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOffer(tenantId: string, id: string, data: Record<string, any>) {
    return this.request(`/admin/tenants/${tenantId}/offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOffer(tenantId: string, id: string) {
    return this.request(`/admin/tenants/${tenantId}/offers/${id}`, { method: 'DELETE' });
  }

  // ─── Announcements (super-admin, tenant-scoped) ───
  async listAnnouncements(tenantId: string) {
    return this.request(`/admin/tenants/${tenantId}/announcements`);
  }

  async createAnnouncement(tenantId: string, data: Record<string, any>) {
    return this.request(`/admin/tenants/${tenantId}/announcements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAnnouncement(tenantId: string, id: string, data: Record<string, any>) {
    return this.request(`/admin/tenants/${tenantId}/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(tenantId: string, id: string) {
    return this.request(`/admin/tenants/${tenantId}/announcements/${id}`, { method: 'DELETE' });
  }

  // ─── Gallery (super-admin, tenant-scoped) ───
  async listGallery(tenantId: string) {
    return this.request(`/admin/tenants/${tenantId}/gallery`);
  }

  async createGalleryImage(tenantId: string, data: Record<string, any>) {
    return this.request(`/admin/tenants/${tenantId}/gallery`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGalleryImage(tenantId: string, id: string, data: Record<string, any>) {
    return this.request(`/admin/tenants/${tenantId}/gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGalleryImage(tenantId: string, id: string) {
    return this.request(`/admin/tenants/${tenantId}/gallery/${id}`, { method: 'DELETE' });
  }

  // ─── Testimonials (admin, tenant-scoped) ───
  async listTestimonials(tenantId: string) { return this.request(`/admin/tenants/${tenantId}/testimonials`); }
  async createTestimonial(tenantId: string, data: Record<string, any>) { return this.request(`/admin/tenants/${tenantId}/testimonials`, { method: 'POST', body: JSON.stringify(data) }); }
  async updateTestimonial(tenantId: string, id: string, data: Record<string, any>) { return this.request(`/admin/tenants/${tenantId}/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteTestimonial(tenantId: string, id: string) { return this.request(`/admin/tenants/${tenantId}/testimonials/${id}`, { method: 'DELETE' }); }

  // ─── FAQs (admin, tenant-scoped) ───
  async listFaqs(tenantId: string) { return this.request(`/admin/tenants/${tenantId}/faqs`); }
  async createFaq(tenantId: string, data: Record<string, any>) { return this.request(`/admin/tenants/${tenantId}/faqs`, { method: 'POST', body: JSON.stringify(data) }); }
  async updateFaq(tenantId: string, id: string, data: Record<string, any>) { return this.request(`/admin/tenants/${tenantId}/faqs/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteFaq(tenantId: string, id: string) { return this.request(`/admin/tenants/${tenantId}/faqs/${id}`, { method: 'DELETE' }); }

  // ─── Blog Posts (admin, tenant-scoped) ───
  async listBlogPosts(tenantId: string) { return this.request(`/admin/tenants/${tenantId}/blog-posts`); }
  async createBlogPost(tenantId: string, data: Record<string, any>) { return this.request(`/admin/tenants/${tenantId}/blog-posts`, { method: 'POST', body: JSON.stringify(data) }); }
  async updateBlogPost(tenantId: string, id: string, data: Record<string, any>) { return this.request(`/admin/tenants/${tenantId}/blog-posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteBlogPost(tenantId: string, id: string) { return this.request(`/admin/tenants/${tenantId}/blog-posts/${id}`, { method: 'DELETE' }); }

  // ─── Events (admin, tenant-scoped) ───
  async listEvents(tenantId: string) { return this.request(`/admin/tenants/${tenantId}/events`); }
  async createEvent(tenantId: string, data: Record<string, any>) { return this.request(`/admin/tenants/${tenantId}/events`, { method: 'POST', body: JSON.stringify(data) }); }
  async updateEvent(tenantId: string, id: string, data: Record<string, any>) { return this.request(`/admin/tenants/${tenantId}/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteEvent(tenantId: string, id: string) { return this.request(`/admin/tenants/${tenantId}/events/${id}`, { method: 'DELETE' }); }

  // ─── BI / Executive Analytics (admin, tenant-scoped) ───
  async getBiExecutiveSummary(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/bi/executive-summary', { params: { ...params, tenantId } });
  }
  async getBiRevenueTrend(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/bi/revenue-trend', { params: { ...params, tenantId } });
  }
  async getBiOrdersTrend(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/bi/orders-trend', { params: { ...params, tenantId } });
  }
  async getBiCustomerTrend(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/bi/customer-trend', { params: { ...params, tenantId } });
  }
  async getBiProfitability(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/bi/profitability', { params: { ...params, tenantId } });
  }
  async getBiPeakHours(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/bi/peak-hours', { params: { ...params, tenantId } });
  }
  async getBiTopItems(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/bi/top-items', { params: { ...params, tenantId } });
  }
  async getBiBranchLeaderboard(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/bi/branch-leaderboard', { params: { ...params, tenantId } });
  }
  async getBiBranchComparison(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/bi/branch-comparison', { params: { ...params, tenantId } });
  }
  async getBiRegionalPerformance(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/bi/regional-performance', { params: { ...params, tenantId } });
  }
  async getBiInsights(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/bi/insights', { params: { ...params, tenantId } });
  }
  async getBiGoals(tenantId: string) {
    return this.request('/admin/bi/goals', { params: { tenantId } });
  }
  async getBiAlerts(tenantId: string) {
    return this.request('/admin/bi/alerts', { params: { tenantId } });
  }
  async getForecastRevenue(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/bi/forecast/revenue', { params: { ...params, tenantId } });
  }
  async getForecastOrders(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/bi/forecast/orders', { params: { ...params, tenantId } });
  }
  async getForecastInventory(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/bi/forecast/inventory', { params: { ...params, tenantId } });
  }
  async getForecastStaffing(tenantId: string, params: Record<string, string> = {}) {
    return this.request('/admin/bi/forecast/staffing', { params: { ...params, tenantId } });
  }

  // ─── AI Business Copilot (admin, tenant-scoped) ───
  async getCopilotProviders(tenantId: string) {
    return this.request('/admin/ai-copilot/providers', { params: { tenantId } });
  }
  async getCopilotSuggestions(tenantId: string) {
    return this.request('/admin/ai-copilot/suggestions', { params: { tenantId } });
  }
  async listCopilotConversations(tenantId: string) {
    return this.request('/admin/ai-copilot/conversations', { params: { tenantId } });
  }
  async getCopilotConversation(tenantId: string, id: string) {
    return this.request(`/admin/ai-copilot/conversations/${id}`, { params: { tenantId } });
  }
  async deleteCopilotConversation(tenantId: string, id: string) {
    return this.request(`/admin/ai-copilot/conversations/${id}`, { method: 'DELETE', params: { tenantId } });
  }
  async sendCopilotMessage(tenantId: string, message: string, conversationId?: string) {
    return this.request('/admin/ai-copilot/chat', {
      method: 'POST',
      params: { tenantId },
      body: JSON.stringify({ message, conversationId }),
    });
  }
  async generateCopilotReport(tenantId: string, type: string, from?: string, to?: string) {
    return this.request('/admin/ai-copilot/reports', {
      method: 'POST',
      params: { tenantId },
      body: JSON.stringify({ type, from, to }),
    });
  }
  async listCopilotReports(tenantId: string) {
    return this.request('/admin/ai-copilot/reports', { params: { tenantId } });
  }
  async pinCopilotConversation(tenantId: string, id: string, pinned: boolean) {
    return this.request(`/admin/ai-copilot/conversations/${id}/pin`, {
      method: 'PATCH',
      params: { tenantId },
      body: JSON.stringify({ pinned }),
    });
  }
  async renameCopilotConversation(tenantId: string, id: string, title: string) {
    return this.request(`/admin/ai-copilot/conversations/${id}/rename`, {
      method: 'PATCH',
      params: { tenantId },
      body: JSON.stringify({ title }),
    });
  }
  async searchCopilotConversations(tenantId: string, query: string) {
    return this.request('/admin/ai-copilot/conversations/search', { params: { tenantId, q: query } });
  }
  streamCopilotMessage(tenantId: string, message: string, conversationId?: string): EventSource {
    const params = new URLSearchParams({ tenantId, message });
    if (conversationId) params.set('conversationId', conversationId);
    const token = this.getToken();
    return new EventSource(`/api/v1/admin/ai-copilot/chat/stream?${params.toString()}`);
  }

  // ─── Reservations ───
  async getReservations(params: Record<string, string> = {}) {
    return this.request('/reservations', { params });
  }

  async getReservation(id: string) {
    return this.request(`/reservations/${id}`);
  }

  async createReservation(data: Record<string, any>) {
    return this.request('/reservations', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateReservation(id: string, data: Record<string, any>) {
    return this.request(`/reservations/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async deleteReservation(id: string) {
    return this.request(`/reservations/${id}`, { method: 'DELETE' });
  }

  async getReservationStats(params: Record<string, string> = {}) {
    return this.request('/reservations/stats', { params });
  }

  async getReservationAvailability(params: Record<string, string> = {}) {
    return this.request('/reservations/availability', { params });
  }

  async getTodayReservations(params: Record<string, string> = {}) {
    return this.request('/reservations/today', { params });
  }

  async getUpcomingReservations(params: Record<string, string> = {}) {
    return this.request('/reservations/upcoming', { params });
  }

  // ─── Delivery ───
  async getDeliveryActive(params: Record<string, string> = {}) {
    return this.request('/delivery/active', { params });
  }

  async getDeliveryPartners(params: Record<string, string> = {}) {
    return this.request('/delivery/partners', { params });
  }

  async getDeliveryStats(params: Record<string, string> = {}) {
    return this.request('/delivery/stats', { params });
  }

  async assignDeliveryPartner(data: { deliveryId: string; partnerId: string }) {
    return this.request('/delivery/assign', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateDeliveryStatus(id: string, data: Record<string, any>) {
    return this.request(`/delivery/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async getDeliveryHistory(params: Record<string, string> = {}) {
    return this.request('/delivery/history', { params });
  }

  async getDeliveryById(id: string) {
    return this.request(`/delivery/${id}`);
  }

  // ─── Inventory ───
  async getInventory(params: Record<string, string> = {}) {
    return this.request('/inventory', { params });
  }

  async getInventoryItem(id: string) {
    return this.request(`/inventory/${id}`);
  }

  async createInventoryItem(data: Record<string, any>) {
    return this.request('/inventory', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateInventoryItem(id: string, data: Record<string, any>) {
    return this.request(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async adjustInventoryStock(id: string, data: { quantity: number; type: 'IN' | 'OUT'; reason: string }) {
    return this.request(`/inventory/${id}/adjust`, { method: 'POST', body: JSON.stringify(data) });
  }

  async getInventoryMovements(id: string, params: Record<string, string> = {}) {
    return this.request(`/inventory/${id}/movements`, { params });
  }

  async getInventoryLowStock(params: Record<string, string> = {}) {
    return this.request('/inventory/low-stock', { params });
  }

  async deleteInventoryItem(id: string) {
    return this.request(`/inventory/${id}`, { method: 'DELETE' });
  }

  // ─── Staff (existing convenience wrappers) ───
  async getStaffList(params: Record<string, string> = {}) {
    return this.request('/staff', { params });
  }

  async getStaffSchedule(params: Record<string, string> = {}) {
    return this.request('/staff/schedule', { params });
  }

  async getStaffAttendance(params: Record<string, string> = {}) {
    return this.request('/staff/attendance', { params });
  }

  async clockIn(data: { staffId: string; method?: string }) {
    return this.request('/staff/clock-in', { method: 'POST', body: JSON.stringify(data) });
  }

  async clockOut(data: { attendanceId: string }) {
    return this.request('/staff/clock-out', { method: 'POST', body: JSON.stringify(data) });
  }
}

/**
 * MediaService — real file upload via the backend /media/upload endpoint.
 */
export const mediaService = {
  async upload(file: File, tenantId: string, folder?: string): Promise<{ url: string; id: string }> {
    const token = localStorage.getItem('admin_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenantId', tenantId);
    if (folder) formData.append('folder', folder);

    const res = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(err.message || `Upload failed (${res.status})`);
    }
    const result = await res.json();
    return { url: result.data.url, id: result.data.id };
  },
  async uploadUrl(url: string): Promise<{ url: string }> {
    return { url };
  },
  async list(tenantId: string, opts?: { folder?: string; search?: string; page?: number }) {
    const token = localStorage.getItem('admin_token');
    const params = new URLSearchParams({ tenantId });
    if (opts?.folder) params.set('folder', opts.folder);
    if (opts?.search) params.set('search', opts.search);
    if (opts?.page) params.set('page', String(opts.page));
    const res = await fetch(`${API_BASE}/media?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to list media');
    return res.json();
  },
  async remove(id: string, tenantId: string) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API_BASE}/media/${id}?tenantId=${tenantId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete media');
    return res.json();
  },
};

export const adminApi = new AdminApiClient();
