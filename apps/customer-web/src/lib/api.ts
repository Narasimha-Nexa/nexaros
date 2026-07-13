const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isVeg: boolean;
  image: string | null;
  variants: { id: string; name: string; price: number }[];
  addOns: { id: string; name: string; price: number }[];
  prepTimeMin: number | null;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  currency: string;
  timezone: string;
}

export interface TableInfo {
  id: string;
  number: number;
  name: string | null;
  capacity: number;
  status: string;
  branchId: string;
  branchName: string;
  tenantSlug: string;
  tenantName: string;
}

export interface OrderResult {
  id: string;
  orderNumber: number;
  status: string;
  totalAmount: number;
  items: number;
  createdAt: string;
}

export interface OrderTracking {
  id: string;
  orderNumber: number;
  status: string;
  type: string;
  customerName: string | null;
  totalAmount: number;
  createdAt: string;
  estimatedMinutes: number;
  items: { name: string; quantity: number; status: string }[];
  statusHistory: { status: string; notes: string | null; createdAt: string }[];
  table: { number: number } | null;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getTenantBySlug(slug: string): Promise<TenantInfo> {
  return fetchJson(`${API_BASE}/public/tenant/${slug}`);
}

export async function getTenantMenu(slug: string): Promise<{
  tenant: TenantInfo;
  defaultBranch: { id: string; name: string } | null;
  categories: MenuCategory[];
  totalItems: number;
}> {
  return fetchJson(`${API_BASE}/public/menu/${slug}`);
}

export async function scanTableQr(qrCode: string): Promise<{
  tableId: string;
  tableNumber: number;
  branchId: string;
  branchName: string;
  tenantSlug: string;
  tenantName: string;
  currency: string;
}> {
  return fetchJson(`${API_BASE}/public/table/scan/${qrCode}`);
}

export async function createOrder(data: {
  branchId: string;
  tableId?: string;
  type: string;
  customerName?: string;
  customerPhone?: string;
  guestCount?: number;
  items: { menuItemId: string; name: string; quantity: number; unitPrice: number; notes?: string }[];
}): Promise<OrderResult> {
  return fetchJson(`${API_BASE}/public/orders`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function trackOrder(orderId: string): Promise<OrderTracking> {
  return fetchJson(`${API_BASE}/public/orders/${orderId}/track`);
}
