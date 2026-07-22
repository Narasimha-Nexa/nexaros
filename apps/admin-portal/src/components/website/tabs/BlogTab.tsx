'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useToastStore } from '@/stores/ui.store';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/website-primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/badge';
import { ConfirmDeleteDialog } from '../shared';

export function BlogTab({ tenantId }: { tenantId: string }) {
  const { addToast } = useToastStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [deleting, setDeleting] = useState<any>(null);
  const { data, isLoading } = useQuery({ queryKey: ['admin-blog', tenantId], queryFn: () => adminApi.listBlogPosts(tenantId) });

  const open = (b?: any) => { setEditing(b || {}); setForm(b || { title: '', slug: '', content: '', excerpt: '', author: '', tags: [], status: 'DRAFT' }); };
  const save = useMutation({ mutationFn: () => (editing.id ? adminApi.updateBlogPost(tenantId, editing.id, form) : adminApi.createBlogPost(tenantId, form)), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-blog', tenantId] }); setEditing(null); addToast('Blog post saved', 'success'); }, onError: (e: any) => addToast(e.message || 'Failed', 'error') });
  const remove = useMutation({ mutationFn: (id: string) => adminApi.deleteBlogPost(tenantId, id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-blog', tenantId] }); setDeleting(null); addToast('Blog post deleted', 'success'); }, onError: (e: any) => addToast(e.message || 'Failed', 'error') });

  const items: any[] = data || [];
  return (
    <div>
      <div className="flex justify-end mb-3"><Button size="sm" onClick={() => open()}>+ New Post</Button></div>
      <DataTable isLoading={isLoading} data={items} keyExtractor={(r) => r.id}
        columns={[
          { key: 'title', header: 'Title', render: (v) => <span className="font-semibold text-ink">{v}</span> },
          { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} label={v} /> },
          { key: 'author', header: 'Author', render: (v) => v || '—' },
          { key: 'publishedAt', header: 'Published', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
          { key: 'actions', header: '', render: (_: any, r: any) => (<div className="flex gap-2 justify-end"><Button size="sm" variant="ghost" onClick={() => open(r)}>Edit</Button><Button size="sm" variant="danger" onClick={() => setDeleting(r)}>Delete</Button></div>) },
        ]} emptyMessage="No blog posts yet." />
      {editing && (
        <Dialog open onClose={() => setEditing(null)} title={editing.id ? 'Edit Post' : 'New Post'} size="lg">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <Input label="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Slug" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated-from-title" />
            <Textarea label="Content" value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            <Textarea label="Excerpt" value={form.excerpt || ''} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            <Input label="Cover Image URL" value={form.coverImage || ''} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} />
            <Input label="Author" value={form.author || ''} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            <Input label="Tags (comma-separated)" value={(form.tags || []).join(', ')} onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} />
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status || 'DRAFT'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['DRAFT', 'PUBLISHED', 'ARCHIVED'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={() => save.mutate()} isLoading={save.isPending}>Save</Button></DialogFooter>
        </Dialog>
      )}
      <ConfirmDeleteDialog open={!!deleting} onClose={() => setDeleting(null)} title={deleting?.title || 'this post'} isLoading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting.id)} />
    </div>
  );
}
