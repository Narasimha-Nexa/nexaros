'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useToastStore } from '@/stores/ui.store';
import { useWebsiteBuilderStore } from '@/stores/website-builder.store';
import { useWebsiteSocket } from '@/hooks/use-website-socket';
import { Tabs } from '@/components/ui/website-primitives';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { WebsiteBuilderLayout } from '@/components/website/WebsiteBuilderLayout';
import {
  BrandingTab, ThemeTab, TypographyTab, SeoTab, SocialHoursTab, ContactTab,
  LegalTab, SectionsTab, FeaturesTab, PreviewTab, HistoryTab,
  OffersTab, AnnouncementsTab, GalleryTab, TestimonialsTab, FaqsTab, BlogTab, EventsTab,
} from '@/components/website/tabs';
import {
  Palette, Type, Search, Share2, Clock, Phone, FileText, LayoutGrid, ToggleLeft,
  Tag, Megaphone, Images, Eye, Rocket, History, Star,
} from 'lucide-react';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/auth.store';

type TabId =
  | 'branding' | 'theme' | 'typography' | 'seo' | 'social'
  | 'contact' | 'legal' | 'sections' | 'features' | 'offers'
  | 'announcements' | 'gallery' | 'testimonials' | 'faqs' | 'blog' | 'events'
  | 'preview' | 'history';

const CONFIG_FIELDS = [
  'restaurantName', 'tagline', 'logo', 'favicon', 'phone', 'email', 'address',
  'mapUrl', 'whatsappNumber', 'currency', 'timezone', 'primaryColor',
  'secondaryColor', 'accentColor', 'fontHeading', 'fontBody', 'borderRadius',
  'containerWidth', 'features', 'seo', 'openingHours', 'socialLinks',
  'analytics', 'legalPages', 'homeSections',
];

function sanitizeConfig(draft: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of CONFIG_FIELDS) {
    if (draft[k] !== undefined) out[k] = draft[k];
  }
  return out;
}

export default function WebsiteHub() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const router = useRouter();
  const { addToast } = useToastStore();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const store = useWebsiteBuilderStore();
  const [tab, setTab] = useState<TabId>('branding');

  useWebsiteSocket({ tenantId: tenantId!, token: token!, enabled: !!token && !!tenantId });

  const { data, isLoading } = useQuery({
    queryKey: ['website', tenantId],
    queryFn: () => adminApi.getWebsiteConfig(tenantId),
  });

  const { data: tenant } = useQuery({
    queryKey: ['admin-tenant', tenantId],
    queryFn: () => adminApi.getTenant(tenantId),
  });
  const slug = (tenant as any)?.data?.slug || tenant?.slug || '' as string;

  useEffect(() => {
    if (data) {
      store.initializeDraft({ ...data, slug });
    }
  }, [data, slug]);

  const { draft, isDirty } = store;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Autosave effect
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(async () => {
      const currentStore = useWebsiteBuilderStore.getState();
      if (!currentStore.isDirty) return;
      try {
        await adminApi.updateWebsiteConfig(tenantId!, sanitizeConfig(currentStore.draft));
        currentStore.markSaved(JSON.stringify(currentStore.draft));
        console.log('[Autosave] Auto-saved at', new Date().toLocaleTimeString());
      } catch (error: any) {
        console.error('[Autosave] Failed:', error.message);
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [draft, tenantId]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => adminApi.updateWebsiteConfig(tenantId, sanitizeConfig(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website', tenantId] });
      store.markSaved(JSON.stringify(draft));
      addToast('Website settings saved', 'success');
    },
    onError: (e: any) => addToast(e.message || 'Save failed', 'error'),
  });

  const [confirmPublish, setConfirmPublish] = useState(false);

  const publishMutation = useMutation({
    mutationFn: async () => {
      await adminApi.saveRevision(tenantId, 'Pre-publish snapshot');
      return adminApi.publishWebsite(tenantId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website', tenantId] });
      store.markPublished(new Date());
      addToast('Website published & cache refreshed', 'success');
      setConfirmPublish(false);
    },
    onError: (e: any) => addToast(e.message || 'Publish failed', 'error'),
  });

  const resetMutation = useMutation({
    mutationFn: () => adminApi.resetWebsite(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website', tenantId] });
      addToast('Website reset to defaults', 'success');
    },
    onError: (e: any) => addToast(e.message || 'Reset failed', 'error'),
  });

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'branding', label: 'Branding', icon: <Palette size={16} /> },
    { id: 'theme', label: 'Theme', icon: <Palette size={16} /> },
    { id: 'typography', label: 'Typography', icon: <Type size={16} /> },
    { id: 'seo', label: 'SEO', icon: <Search size={16} /> },
    { id: 'social', label: 'Social & Hours', icon: <Share2 size={16} /> },
    { id: 'contact', label: 'Contact', icon: <Phone size={16} /> },
    { id: 'legal', label: 'Legal', icon: <FileText size={16} /> },
    { id: 'sections', label: 'Home Sections', icon: <LayoutGrid size={16} /> },
    { id: 'features', label: 'Features', icon: <ToggleLeft size={16} /> },
    { id: 'offers', label: 'Offers', icon: <Tag size={16} /> },
    { id: 'announcements', label: 'Announcements', icon: <Megaphone size={16} /> },
    { id: 'gallery', label: 'Gallery', icon: <Images size={16} /> },
    { id: 'testimonials', label: 'Testimonials', icon: <Star size={16} /> },
    { id: 'faqs', label: 'FAQs', icon: <FileText size={16} /> },
    { id: 'blog', label: 'Blog', icon: <FileText size={16} /> },
    { id: 'events', label: 'Events', icon: <Megaphone size={16} /> },
    { id: 'history', label: 'History', icon: <History size={16} /> },
    { id: 'preview', label: 'Preview & Publish', icon: <Eye size={16} /> },
  ];

  if (isLoading) return <p className="text-body">Loading website configuration...</p>;

  const set = (key: string, value: any) => store.setDraft((d) => ({ ...d, [key]: value }));
  const setJson = (key: string, patch: Record<string, any>) => store.setDraft((d) => ({ ...d, [key]: { ...(d[key] || {}), ...patch } }));

  const leftPanel = (
    <div className="p-3">
      <Tabs tabs={tabs} active={tab} onChange={(t) => setTab(t as TabId)} />
      <div className="mt-3 space-y-4">
        {tab === 'branding' && <BrandingTab tenantId={tenantId} draft={draft} set={set} setJson={setJson} />}
        {tab === 'theme' && <ThemeTab draft={draft} set={set} />}
        {tab === 'typography' && <TypographyTab draft={draft} set={set} />}
        {tab === 'seo' && <SeoTab tenantId={tenantId} draft={draft} setJson={setJson} />}
        {tab === 'social' && <SocialHoursTab draft={draft} setJson={setJson} />}
        {tab === 'contact' && <ContactTab draft={draft} set={set} />}
        {tab === 'legal' && <LegalTab draft={draft} setJson={setJson} />}
        {tab === 'sections' && <SectionsTab draft={draft} set={set} />}
        {tab === 'features' && <FeaturesTab draft={draft} setJson={setJson} />}
        {tab === 'offers' && <OffersTab tenantId={tenantId} />}
        {tab === 'announcements' && <AnnouncementsTab tenantId={tenantId} />}
        {tab === 'gallery' && <GalleryTab tenantId={tenantId} />}
        {tab === 'testimonials' && <TestimonialsTab tenantId={tenantId} />}
        {tab === 'faqs' && <FaqsTab tenantId={tenantId} />}
        {tab === 'blog' && <BlogTab tenantId={tenantId} />}
        {tab === 'events' && <EventsTab tenantId={tenantId} />}
        {tab === 'history' && <HistoryTab tenantId={tenantId} draft={draft} setDraft={store.setDraft} />}
        {tab === 'preview' && <PreviewTab draft={draft} />}
      </div>
    </div>
  );

  return (
    <div className="space-y-0">
      <PageHeader
        title={draft.restaurantName || 'Website'}
        description={`Editing /${draft.slug || ''} · tenant ${tenantId}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/website')}>Change Tenant</Button>
            <Button variant="ghost" onClick={() => resetMutation.mutate()} isLoading={resetMutation.isPending}>Reset</Button>
          </div>
        }
      />

      <WebsiteBuilderLayout
        tenantId={tenantId}
        slug={slug}
        leftPanel={leftPanel}
        onSave={() => saveMutation.mutate(draft)}
        onPublish={() => setConfirmPublish(true)}
        isSaving={saveMutation.isPending}
        isPublishing={publishMutation.isPending}
      />

      {confirmPublish && (
        <Dialog open onClose={() => setConfirmPublish(false)} title="Publish Website" size="sm">
          <p className="text-sm text-ink/70 mb-1">This will save a revision snapshot and publish all current changes to the live website.</p>
          {draft.publishedAt && (
            <p className="text-xs text-ink/50 mb-3">Last published: {new Date(draft.publishedAt).toLocaleString()}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPublish(false)}>Cancel</Button>
            <Button onClick={() => publishMutation.mutate()} isLoading={publishMutation.isPending}>
              <Rocket size={14} className="mr-1" /> Confirm Publish
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}
