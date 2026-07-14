'use client';
import React, { useState } from 'react';
import { DataTable, Pagination } from '@/components/ui/table';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { formatDate } from '@/lib/utils';
import { MessageSquare, Phone, Mail, ExternalLink, CheckCircle, Clock } from 'lucide-react';

const mockRequests = [
  { id: '1', name: 'Rajesh Sharma', restaurant: 'Spice Bazaar', email: 'rajesh@spicebazaar.com', phone: '+91 98765 43210', city: 'Bangalore', state: 'Karnataka', businessType: 'Restaurant', status: 'new', createdAt: '2025-01-14' },
  { id: '2', name: 'Anita Patel', restaurant: 'Gujarat Thali', email: 'anita@gujratthali.com', phone: '+91 87654 32109', city: 'Mumbai', state: 'Maharashtra', businessType: 'Restaurant', status: 'contacted', createdAt: '2025-01-13' },
  { id: '3', name: 'Suresh Reddy', restaurant: 'Hyderabadi Biryani', email: 'suresh@hdbiryani.com', phone: '+91 76543 21098', city: 'Hyderabad', state: 'Telangana', businessType: 'Cloud Kitchen', status: 'converted', createdAt: '2025-01-12' },
];

export default function DemoRequestsPage() {
  const [requests] = useState(mockRequests);
  const [selected, setSelected] = useState<any>(null);
  const { addToast } = useToastStore();

  const stats = [
    { label: 'New Requests', value: '1', change: 'Needs follow-up', changeType: 'neutral' as const },
    { label: 'Contacted', value: '1', change: 'Awaiting response', changeType: 'neutral' as const },
    { label: 'Converted', value: '1', change: '33% conversion', changeType: 'positive' as const },
    { label: 'This Month', value: '3', change: '+50% vs last month', changeType: 'positive' as const },
  ];

  const columns = [
    {
      key: 'name',
      header: 'Contact',
      render: (_: any, row: any) => (
        <div>
          <p className="font-sans font-semibold text-sm">{row.name}</p>
          <p className="text-caption text-body font-sans">{row.restaurant}</p>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'Location',
      render: (_: any, row: any) => <span className="text-body-sm font-sans">{row.city}, {row.state}</span>,
    },
    {
      key: 'businessType',
      header: 'Type',
      render: (_: any, row: any) => <Badge variant="outline">{row.businessType}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (_: any, row: any) => <span className="text-body-sm font-sans text-body">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (_: any, row: any) => (
        <div className="flex gap-1">
          <button className="btn-ghost btn-sm p-1.5"><Phone size={14} /></button>
          <button className="btn-ghost btn-sm p-1.5"><Mail size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Sales" title="Demo Requests" />
      <div className="divider-heavy" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <DataTable
        columns={columns}
        data={requests}
        onRowClick={(row) => setSelected(row)}
        keyExtractor={(r) => r.id}
      />

      <Dialog open={!!selected} onClose={() => setSelected(null)} title="Request Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="label">Name</p><p className="text-body-sm font-sans">{selected.name}</p></div>
              <div><p className="label">Restaurant</p><p className="text-body-sm font-sans">{selected.restaurant}</p></div>
              <div><p className="label">Email</p><p className="text-body-sm font-sans">{selected.email}</p></div>
              <div><p className="label">Phone</p><p className="text-body-sm font-sans">{selected.phone}</p></div>
              <div><p className="label">City</p><p className="text-body-sm font-sans">{selected.city}, {selected.state}</p></div>
              <div><p className="label">Business Type</p><p className="text-body-sm font-sans">{selected.businessType}</p></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              <Button onClick={() => { addToast('Marked as contacted', 'success'); setSelected(null); }}>Mark as Contacted</Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
