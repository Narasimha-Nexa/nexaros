export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  customDomain?: string;
  email?: string;
  phone?: string;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  gstNumber?: string;
  businessType?: string;
  timezone?: string;
  currency?: string;
  isActive: boolean;
  onboardingStatus?: string;
  createdAt: string;
  updatedAt?: string;
  owner?: { id: string; name: string; email: string };
  subscription?: {
    plan: string;
    planSlug: string;
    status: string;
    trialEndsAt?: string;
    currentPeriodEnd?: string;
  } | null;
  branchCount?: number;
  userCount?: number;
  orderCount?: number;
}

export interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  createdToday: number;
  createdThisMonth: number;
  trialTenants: number;
  paidTenants: number;
  totalBranches: number;
  totalUsers: number;
  totalOrders: number;
  planDistribution: Array<{
    plan: string;
    slug: string;
    count: number;
    price: number;
  }>;
}

export interface Subscription {
  id: string;
  tenantId: string;
  tenant: { id: string; name: string; slug: string };
  tenantName?: string;
  tenantEmail?: string;
  planId: string;
  plan: string;
  amount?: number;
  status: string;
  entitlements: Record<string, boolean>;
  trialEndsAt: string;
  currentPeriodEnd: string;
  startDate?: string;
  endDate?: string;
  gracePeriodDays: number;
  hasPromise: boolean;
  promiseUntil: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: string;
  value: number;
  maxDiscount: number;
  expiry: string;
  maxTotalUses: number;
  maxUsesPerUser: number;
  festivalTag: string;
  isActive: boolean;
  createdAt: string;
}

export interface DemoRequest {
  id: string;
  restaurantName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  currentPos: string;
  message: string;
  status: string;
  assignedTo: string;
  notes: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  tenantId: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  assignedTo: string;
  messages: TicketMessage[];
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  senderType: string;
  senderId: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress: string;
  createdAt: string;
}

export interface PlatformStats {
  tenants: { total: number; active: number };
  users: number;
  menuItems: number;
  orders: number;
  subscriptions: { total: number; active: number; trial: number };
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLogin: string;
}
