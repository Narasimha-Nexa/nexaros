'use client';
import React, { useState, useEffect } from 'react';
import { DataTable, Pagination } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/page-header';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { LifeBuoy, Plus, RefreshCw, MessageSquare } from 'lucide-react';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({ open: 0, avgResponseTime: '—', resolutionRate: '—', satisfaction: '—' });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [replyText, setReplyText] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sending, setSending] = useState(false);
  const { addToast } = useToastStore();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        adminApi.getSupportTickets(page, 20, statusFilter ? { status: statusFilter } : {}),
        adminApi.getSupportStats().catch(() => null),
      ]);
      setTickets(ticketsRes.data || ticketsRes.tickets || []);
      setTotal(ticketsRes.total || 0);
      if (statsRes) {
        setStats({
          open: statsRes.openTickets || statsRes.open || 0,
          avgResponseTime: statsRes.avgResponseTime || '—',
          resolutionRate: statsRes.resolutionRate ? `${statsRes.resolutionRate}%` : '—',
          satisfaction: statsRes.satisfaction || '—',
        });
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to load support tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, statusFilter]);

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      await adminApi.addTicketMessage(selected.id, replyText);
      addToast('Reply sent successfully', 'success');
      setReplyText('');
      fetchData();
    } catch (err: any) {
      addToast(err.message || 'Failed to send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setSending(true);
    try {
      await adminApi.updateTicketStatus(id, newStatus);
      addToast(`Ticket status updated to ${newStatus}`, 'success');
      fetchData();
    } catch (err: any) {
      addToast(err.message || 'Failed to update status', 'error');
    } finally {
      setSending(false);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Ticket',
      render: (_: any, row: any) => (
        <div>
          <p className="font-sans font-semibold text-sm">#{row.id?.toString().slice(-8) || row.ticketNumber || '—'}</p>
          <p className="text-caption text-body font-sans">{row.subject || row.title || 'No subject'}</p>
        </div>
      ),
    },
    {
      key: 'tenant',
      header: 'Tenant',
      render: (_: any, row: any) => <span className="text-body-sm font-sans">{row.tenantName || row.restaurantName || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, row: any) => <StatusBadge status={row.status?.toLowerCase()} />,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (_: any, row: any) => (
        <span className={`text-body-sm font-sans font-semibold ${row.priority === 'high' || row.priority === 'urgent' ? 'text-ink' : 'text-body'}`}>
          {(row.priority || 'medium').charAt(0).toUpperCase() + (row.priority || 'medium').slice(1)}
        </span>
      ),
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (_: any, row: any) => <span className="text-body-sm font-sans">{row.assignedTo || row.assignee || 'Unassigned'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (_: any, row: any) => <span className="text-body-sm font-sans text-body">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Support Center" actions={<Button variant="outline" size="sm" onClick={fetchData}><RefreshCw size={14} /> Refresh</Button>} />
      <div className="divider-heavy" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Tickets" value={String(stats.open)} change="Active issues" changeType={stats.open > 0 ? 'negative' : 'positive'} />
        <StatCard label="Avg Response Time" value={stats.avgResponseTime} change="Target < 4h" changeType="neutral" />
        <StatCard label="Resolution Rate" value={stats.resolutionRate} change="This month" changeType="neutral" />
        <StatCard label="Customer Satisfaction" value={stats.satisfaction} change="Based on reviews" changeType="neutral" />
      </div>

      <Card padding="sm">
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: '', label: 'All Status' },
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

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Card key={i} className="h-12 animate-pulse" />)}</div>
      ) : tickets.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-body-sm text-body font-sans">No support tickets found.</p>
        </Card>
      ) : (
        <>
          <DataTable columns={columns} data={tickets} onRowClick={(row) => setSelected(row)} keyExtractor={(r: any) => r.id} />
          <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} total={total} />
        </>
      )}

      <Dialog open={!!selected} onClose={() => { setSelected(null); setReplyText(''); }} title={`#${selected?.id?.toString().slice(-8) || ''} — ${selected?.subject || selected?.title || ''}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><p className="label">Tenant</p><p className="text-body-sm font-sans">{selected.tenantName || selected.restaurantName || '—'}</p></div>
              <div><p className="label">Status</p><StatusBadge status={selected.status?.toLowerCase()} /></div>
              <div><p className="label">Priority</p><p className="text-body-sm font-sans capitalize">{selected.priority || 'medium'}</p></div>
              <div><p className="label">Assignee</p><p className="text-body-sm font-sans">{selected.assignedTo || selected.assignee || 'Unassigned'}</p></div>
              <div><p className="label">Created</p><p className="text-body-sm font-sans">{formatDate(selected.createdAt)}</p></div>
              <div><p className="label">Category</p><p className="text-body-sm font-sans">{selected.category || '—'}</p></div>
            </div>
            {selected.description && (
              <div>
                <p className="label">Description</p>
                <div className="border border-hairline p-4 mt-2">
                  <p className="text-body-sm font-sans text-body whitespace-pre-wrap">{selected.description}</p>
                </div>
              </div>
            )}
            <div className="divider" />
            <div>
              <p className="label">Reply</p>
              <textarea
                className="input min-h-[100px] resize-y mt-2"
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setSelected(null); setReplyText(''); }}>Close</Button>
              {selected.status?.toLowerCase() !== 'closed' && (
                <Select
                  options={[
                    { value: 'open', label: 'Open' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'resolved', label: 'Resolved' },
                    { value: 'closed', label: 'Closed' },
                  ]}
                  value={selected.status?.toLowerCase() || 'open'}
                  onChange={(e) => handleStatusChange(selected.id, e.target.value)}
                />
              )}
              <Button onClick={handleReply} isLoading={sending} disabled={!replyText.trim()}>Send Reply</Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
