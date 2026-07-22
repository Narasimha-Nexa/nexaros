'use client';
import React, { useEffect, useState } from 'react';
import { Select } from '@/components/ui/select';
import { adminApi } from '@/lib/api';

interface TenantOption {
  id: string;
  name: string;
}

export function useTenantSelector() {
  const [tenantId, setTenantId] = useState<string>('');
  const [tenants, setTenants] = useState<TenantOption[]>([]);

  useEffect(() => {
    adminApi
      .listTenants({ limit: '100' })
      .then((r: any) => {
        const items = (r?.data || r || []) as any[];
        const mapped = items.map((t: any) => ({ id: t.id, name: t.name || t.restaurantName || t.tenantName || t.id }));
        setTenants(mapped);
        if (mapped.length && !tenantId) setTenantId(mapped[0].id);
      })
      .catch(() => {});
  }, []);

  return { tenantId, setTenantId, tenants };
}

export function TenantSelector({
  tenantId,
  onTenantChange,
  tenants,
}: {
  tenantId: string;
  onTenantChange: (id: string) => void;
  tenants: TenantOption[];
}) {
  return (
    <Select
      label="Restaurant (Tenant)"
      value={tenantId}
      onChange={(e) => onTenantChange(e.target.value)}
      options={tenants.map((t) => ({ value: t.id, label: t.name }))}
    />
  );
}
