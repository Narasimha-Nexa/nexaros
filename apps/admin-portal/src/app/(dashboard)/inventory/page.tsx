'use client';
import React, { useState, useEffect } from 'react';
import { DataTable, Pagination } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Search, Plus, RefreshCw, Package, AlertTriangle, XCircle, DollarSign, ArrowUpDown, History } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  costPerUnit: number;
  tenantId: string;
  tenantName?: string;
  branchId?: string;
  branchName?: string;
  status: string;
  lastUpdated: string;
  createdAt: string;
}

interface StockMovement {
  id: string;
  inventoryItemId: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy?: string;
  createdAt: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const { addToast } = useToastStore();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, categoryFilter, statusFilter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const result = await adminApi.request('/inventory', { params });
      setItems(result.data || []);
      setTotal(result.total || (result.data || []).length);
    } catch (err: any) {
      addToast(err.message || 'Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [lowStockResult, allResult] = await Promise.all([
        adminApi.request('/inventory/low-stock', { params: { limit: '100' } }),
        adminApi.request('/inventory', { params: { limit: '1000' } }),
      ]);
      const allItems = allResult.data || [];
      const lowStockItems = lowStockResult.data || [];
      setLowStockCount(lowStockItems.length);
      setOutOfStockCount(allItems.filter((i: InventoryItem) => i.currentStock <= 0).length);
      setTotalValue(allItems.reduce((sum: number, i: InventoryItem) => sum + (i.currentStock * i.costPerUnit), 0));
    } catch {
      // Stats are non-critical
    }
  };

  useEffect(() => { fetchItems(); }, [page, debouncedSearch, categoryFilter, statusFilter]);
  useEffect(() => { fetchStats(); }, []);

  const fetchMovements = async (itemId: string) => {
    setMovementsLoading(true);
    try {
      const result = await adminApi.request(`/inventory/${itemId}/movements`, { params: { limit: '50' } });
      setMovements(result.data || []);
    } catch (err: any) {
      addToast(err.message || 'Failed to load stock history', 'error');
    } finally {
      setMovementsLoading(false);
    }
  };

  const handleViewDetail = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDetail(true);
    fetchMovements(item.id);
  };

  const handleAdjustClick = (item: InventoryItem) => {
    setAdjustItem(item);
    setShowAdjust(true);
  };

  const columns = [
    {
      key: 'name',
      header: 'Item Name',
      sortable: true,
      render: (_: any, row: InventoryItem) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ink text-canvas flex items-center justify-center text-[11px] font-bold shrink-0">
            <Package size={14} />
          </div>
          <div>
            <p className="font-sans font-semibold text-sm">{row.name}</p>
            <p className="text-caption text-body font-sans">{row.tenantName || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (_: any, row: InventoryItem) => <StatusBadge status={row.category} />,
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      sortable: true,
      render: (_: any, row: InventoryItem) => (
        <span className={`font-sans font-semibold text-sm ${row.currentStock <= 0 ? 'text-danger' : row.currentStock <= row.minimumStock ? 'text-amber-600' : ''}`}>
          {row.currentStock} {row.unit}
        </span>
      ),
    },
    {
      key: 'minimumStock',
      header: 'Min Stock',
      render: (_: any, row: InventoryItem) => (
        <span className="text-body-sm font-sans">{row.minimumStock} {row.unit}</span>
      ),
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (_: any, row: InventoryItem) => (
        <span className="text-body-sm font-sans">{row.unit}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, row: InventoryItem) => {
        let status = 'active';
        if (row.currentStock <= 0) status = 'out_of_stock';
        else if (row.currentStock <= row.minimumStock) status = 'low_stock';
        return <StatusBadge status={status} />;
      },
    },
    {
      key: 'lastUpdated',
      header: 'Last Updated',
      render: (_: any, row: InventoryItem) => (
        <span className="text-body-sm font-sans text-body">{formatDate(row.lastUpdated)}</span>
      ),
    },
  ];

  const categories = [...new Set(items.map(i => i.category))].filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stock"
        title="Inventory Management"
        description="Track and manage inventory across all restaurants on the platform"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => { fetchItems(); fetchStats(); }}><RefreshCw size={14} /> Refresh</Button>
            <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Add Item</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={total} />
        <StatCard label="Low Stock" value={lowStockCount} changeType={lowStockCount > 0 ? 'negative' : 'positive'} change={lowStockCount > 0 ? 'Needs attention' : 'All good'} />
        <StatCard label="Out of Stock" value={outOfStockCount} changeType={outOfStockCount > 0 ? 'negative' : 'positive'} change={outOfStockCount > 0 ? 'Critical' : 'None'} />
        <StatCard label="Total Value" value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
      </div>

      <div className="divider-heavy" />

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
            <input
              type="text"
              placeholder="Search inventory items..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9 py-2 text-sm w-full"
            />
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map(c => ({ value: c, label: c })),
            ]}
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          />
          <Select
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'In Stock' },
              { value: 'low_stock', label: 'Low Stock' },
              { value: 'out_of_stock', label: 'Out of Stock' },
            ]}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          />
        </div>
      </Card>

      {loading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Package size={48} strokeWidth={1} />}
          title="No inventory items found"
          description={search || categoryFilter !== 'all' || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Inventory items will appear here once added by restaurant owners.'}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={items}
            onRowClick={(row) => handleViewDetail(row)}
            keyExtractor={(row) => row.id}
          />
          <Pagination
            page={page}
            totalPages={Math.ceil(total / 10)}
            onPageChange={setPage}
            total={total}
            pageSize={10}
          />
        </>
      )}

      <Dialog open={showDetail} onClose={() => setShowDetail(false)} title={selectedItem?.name || 'Item Details'} size="lg">
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-ink text-canvas flex items-center justify-center shrink-0">
                <Package size={20} />
              </div>
              <div>
                <h3 className="text-display-xs font-sans">{selectedItem.name}</h3>
                <p className="text-body-sm text-body font-sans">{selectedItem.tenantName || '—'}</p>
              </div>
            </div>
            <div className="h-[2px] bg-hairline" />
            <div className="grid grid-cols-2 gap-4">
              <div><p className="label">Category</p><StatusBadge status={selectedItem.category} /></div>
              <div><p className="label">Status</p><StatusBadge status={selectedItem.currentStock <= 0 ? 'out_of_stock' : selectedItem.currentStock <= selectedItem.minimumStock ? 'low_stock' : 'active'} /></div>
              <div><p className="label">Current Stock</p><p className="text-body-sm font-sans font-semibold">{selectedItem.currentStock} {selectedItem.unit}</p></div>
              <div><p className="label">Minimum Stock</p><p className="text-body-sm font-sans">{selectedItem.minimumStock} {selectedItem.unit}</p></div>
              <div><p className="label">Cost Per Unit</p><p className="text-body-sm font-sans">${selectedItem.costPerUnit.toFixed(2)}</p></div>
              <div><p className="label">Total Value</p><p className="text-body-sm font-sans font-semibold">${(selectedItem.currentStock * selectedItem.costPerUnit).toFixed(2)}</p></div>
              <div><p className="label">Branch</p><p className="text-body-sm font-sans">{selectedItem.branchName || '—'}</p></div>
              <div><p className="label">Last Updated</p><p className="text-body-sm font-sans">{formatDate(selectedItem.lastUpdated)}</p></div>
            </div>

            <div className="h-[2px] bg-hairline" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-display-xs font-sans flex items-center gap-2"><History size={14} /> Stock History</h4>
              </div>
              {movementsLoading ? (
                <TableSkeleton rows={3} cols={5} />
              ) : movements.length === 0 ? (
                <p className="text-body-sm text-body font-sans">No stock movements recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {movements.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2 bg-canvas-soft text-sm">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown size={12} className={m.type === 'IN' ? 'text-green-600' : m.type === 'OUT' ? 'text-red-600' : 'text-amber-600'} />
                        <div>
                          <p className="font-sans font-medium">{m.type === 'IN' ? 'Stock In' : m.type === 'OUT' ? 'Stock Out' : 'Adjustment'}</p>
                          <p className="text-caption text-body text-xs">{m.reason || '—'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-sans font-semibold ${m.type === 'IN' ? 'text-green-600' : m.type === 'OUT' ? 'text-red-600' : 'text-amber-600'}`}>
                          {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : (m.quantity >= 0 ? '+' : '')}{Math.abs(m.quantity)} {selectedItem.unit}
                        </p>
                        <p className="text-caption text-body text-xs">{formatDate(m.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
              <Button variant="outline" onClick={() => { setShowDetail(false); handleAdjustClick(selectedItem); }}>Adjust Stock</Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Add Inventory Item" size="lg">
        <InventoryForm onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); fetchItems(); fetchStats(); }} />
      </Dialog>

      <Dialog open={showAdjust} onClose={() => setShowAdjust(false)} title={`Adjust Stock — ${adjustItem?.name || ''}`} size="md">
        {adjustItem && (
          <AdjustStockForm
            item={adjustItem}
            onClose={() => setShowAdjust(false)}
            onSuccess={() => { setShowAdjust(false); fetchItems(); fetchStats(); }}
          />
        )}
      </Dialog>
    </div>
  );
}

function InventoryForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', category: '', currentStock: 0, minimumStock: 0, unit: '', costPerUnit: 0, tenantId: '', branchId: '' });
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const { addToast } = useToastStore();

  useEffect(() => {
    adminApi.listTenants({ limit: '100' }).then((res) => {
      setTenants(res.data || res.tenants || res || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.tenantId) {
      adminApi.listBranches({ tenantId: form.tenantId, limit: '100' })
        .then((res: any) => setBranches(res.data || res.branches || res || []))
        .catch(() => setBranches([]));
    } else {
      setBranches([]);
    }
  }, [form.tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.request('/inventory', { method: 'POST', body: JSON.stringify(form) });
      addToast('Inventory item created', 'success');
      onSuccess();
    } catch (err: any) {
      addToast(err.message || 'Failed to create item', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Item Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Produce, Dairy, Meat" required />
        <Input label="Current Stock" type="number" min={0} value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })} required />
        <Input label="Minimum Stock" type="number" min={0} value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: Number(e.target.value) })} required />
        <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. kg, liters, pieces" required />
        <Input label="Cost Per Unit ($)" type="number" min={0} step={0.01} value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: Number(e.target.value) })} required />
        <Select
          label="Restaurant"
          value={form.tenantId}
          onChange={(e) => setForm({ ...form, tenantId: e.target.value, branchId: '' })}
          options={[
            { value: '', label: 'Select restaurant...' },
            ...tenants.map((t: any) => ({ value: t.id, label: t.name })),
          ]}
        />
        <Select
          label="Branch"
          value={form.branchId}
          onChange={(e) => setForm({ ...form, branchId: e.target.value })}
          options={[
            { value: '', label: 'Select branch...' },
            ...branches.map((b: any) => ({ value: b.id, label: b.name })),
          ]}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" isLoading={loading}>Create Item</Button>
      </DialogFooter>
    </form>
  );
}

function AdjustStockForm({ item, onClose, onSuccess }: { item: InventoryItem; onClose: () => void; onSuccess: () => void }) {
  const [adjustType, setAdjustType] = useState('IN');
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      addToast('Quantity must be greater than zero', 'error');
      return;
    }
    setLoading(true);
    try {
      await adminApi.request(`/inventory/${item.id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ type: adjustType, quantity, reason }),
      });
      addToast(`Stock ${adjustType === 'IN' ? 'increased' : 'decreased'} successfully`, 'success');
      onSuccess();
    } catch (err: any) {
      addToast(err.message || 'Failed to adjust stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-canvas-soft text-sm font-sans">
        <p className="text-body">Current stock: <span className="font-semibold text-ink">{item.currentStock} {item.unit}</span></p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Adjustment Type"
          value={adjustType}
          onChange={(e) => setAdjustType(e.target.value)}
          options={[
            { value: 'IN', label: 'Stock In (Increase)' },
            { value: 'OUT', label: 'Stock Out (Decrease)' },
          ]}
        />
        <Input label={`Quantity (${item.unit})`} type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
      </div>
      <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. New delivery, Waste, Sold" required />
      <div className="p-3 bg-canvas-soft text-sm font-sans">
        <p className="text-body">
          New stock level:{' '}
          <span className="font-semibold text-ink">
            {adjustType === 'IN' ? item.currentStock + quantity : item.currentStock - quantity} {item.unit}
          </span>
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" isLoading={loading}>{adjustType === 'IN' ? 'Increase' : 'Decrease'} Stock</Button>
      </DialogFooter>
    </form>
  );
}
