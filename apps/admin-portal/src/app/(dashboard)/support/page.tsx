'use client';
import React, { useState } from 'react';
import { DataTable, Pagination } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/page-header';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { useToastStore } from '@/stores/ui.store';
import { formatDate } from '@/lib/utils';
import { LifeBuoy, Plus, MessageSquare, Clock, AlertTriangle, CheckCircle, User } from 'lucide-react';

const mockTickets = [
  { id: 'TK-1234', subject: 'Payment gateway not responding', tenant: 'Spice Garden', status: 'open', priority: 'high', assignee: 'Ravi K.', createdAt: '2025-01-14', messages: 5 },
  { id: 'TK-1233', subject: 'Need help with inventory setup', tenant: 'Pizza Palace', status: 'in_progress', priority: 'medium', assignee: 'Priya M.', createdAt: '2025-01-13', messages: 3 },
  { id: 'TK-1232', subject: 'Custom report generation', tenant: 'Biryani Barn', status: 'resolved', priority: 'low', assignee: 'Amit S.', createdAt: '2025-01-12', messages: 8 },
  { id: 'TK-1231', subject: 'Kitchen display not updating', tenant: 'Food Court Express', status: 'open', priority: 'high', assignee: 'Unassigned', createdAt: '2025-01-14', messages: 1 },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState(mockTickets);
  const [selected, setSelected] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const { addToast } = useToastStore();

  const stats = [
    { label: 'Open Tickets', value: '23', change: '5 urgent', changeType: 'negative' as const },
    { label: 'Avg Response Time', value: '2.4h', change: '-18% improvement', changeType: 'positive' as const },
    { label: 'Resolution Rate', value: '94%', change: '+3% this week', changeType: 'positive' as const },
    { label: 'Customer Satisfaction', value: '4.6/5', change: 'Based on 847 reviews', changeType: 'neutral' as const },
  ];

  const filtered = statusFilter === 'all' ? tickets : tickets.filter(t => t.status === statusFilter);

  const columns = [
    {
      key: 'id',
      header: 'Ticket',
      render: (_: any, row: any) => (
        <div>
          <p className="font-sans font-semibold text-sm">{row.id}</p>
          <p className="text-caption text-body font-sans">{row.subject}</p>
        </div>
      ),
    },
    {
      key: 'tenant',
      header: 'Tenant',
      render: (_: any, row: any) => <span className="text-body-sm font-sans">{row.tenant}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (_: any, row: any) => (
        <span className={`text-body-sm font-sans font-semibold ${row.priority === 'high' ? 'text-ink' : row.priority === 'medium' ? 'text-body' : 'text-body'}`}>
          {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
        </span>
      ),
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (_: any, row: any) => <span className="text-body-sm font-sans">{row.assignee}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (_: any, row: any) => <span className="text-body-sm font-sans text-body">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Support Center" actions={<Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> New Ticket</Button>} />
      <div className="divider-heavy" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <Card padding="sm">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search tickets..."
            className="input py-2 text-sm max-w-sm"
          />
          <Select
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      <DataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} keyExtractor={(r) => r.id} />

      <Dialog open={!!selected} onClose={() => setSelected(null)} title={`${selected?.id} — ${selected?.subject}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><p className="label">Tenant</p><p className="text-body-sm font-sans">{selected.tenant}</p></div>
              <div><p className="label">Status</p><StatusBadge status={selected.status} /></div>
              <div><p className="label">Priority</p><p className="text-body-sm font-sans capitalize">{selected.priority}</p></div>
              <div><p className="label">Assignee</p><p className="text-body-sm font-sans">{selected.assignee}</p></div>
              <div><p className="label">Created</p><p className="text-body-sm font-sans">{formatDate(selected.createdAt)}</p></div>
              <div><p className="label">Messages</p><p className="text-body-sm font-sans">{selected.messages}</p></div>
            </div>
            <div className="divider" />
            <div>
              <p className="label">Message Thread</p>
              <div className="border border-hairline p-4 mt-2">
                <p className="text-body-sm font-sans text-body">Message thread would appear here with full conversation history.</p>
              </div>
            </div>
            <div>
              <p className="label">Reply</p>
              <textarea className="input min-h-[100px] resize-y mt-2" placeholder="Type your reply..." />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              <Button onClick={() => { addToast('Reply sent', 'success'); setSelected(null); }}>Send Reply</Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Create Support Ticket">
        <div className="space-y-4">
          <Input label="Subject" placeholder="Brief description of the issue" />
          <Select
            label="Tenant"
            options={[{ value: '', label: 'Select tenant...' }, { value: 'spice-garden', label: 'Spice Garden' }, { value: 'pizza-palace', label: 'Pizza Palace' }]}
          />
          <Select
            label="Priority"
            options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]}
          />
          <div>
            <p className="label">Description</p>
            <textarea className="input min-h-[120px] resize-y" placeholder="Detailed description..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => { addToast('Ticket created', 'success'); setShowCreate(false); }}>Create Ticket</Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
