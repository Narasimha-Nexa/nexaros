export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  businessType: string;
  country: string;
  state: string;
  city: string;
  address?: string;
  isActive: boolean;
  status?: string;
  plan?: string;
  ownerName?: string;
  owner?: { id: string; name: string; email: string };
  subscription?: { plan: string; status: string; amount: number };
  createdAt: string;
  updatedAt?: string;
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
