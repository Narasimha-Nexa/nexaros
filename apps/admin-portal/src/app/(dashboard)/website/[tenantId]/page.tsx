'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useToastStore } from '@/stores/ui.store';
import { Input } from '@/components/ui/input';
import { Textarea, Switch, ColorPicker, Tabs, MediaField } from '@/components/ui/website-primitives';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { LivePreview } from '@/components/website/LivePreview';
import { OffersTab, AnnouncementsTab, GalleryTab } from '@/components/website/management-tabs';
import {
  Palette, Type, Search, Share2, Clock, Phone, FileText, LayoutGrid, ToggleLeft,
  Tag, Megaphone, Images, Eye, Rocket,
} from 'lucide-react';

type TabId =
  | 'branding' | 'theme' | 'typography' | 'seo' | 'social'
  | 'contact' | 'legal' | 'sections' | 'features' | 'offers'
  | 'announcements' | 'gallery' | 'preview';

const FONT_OPTIONS = [
  'Playfair Display', 'Inter', 'Lora', 'Montserrat', 'Poppins',
  'Roboto', 'Open Sans', 'Merriweather', 'Oswald', 'Nunito',
];

// Strip Prisma/system fields that are not part of the UpdateCmsConfigDto so the
// backend's forbidNonWhitelisted ValidationPipe does not reject the request.
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
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>('branding');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [draft, setDraft] = useState<Record<string, any>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['website', tenantId],
    queryFn: () => adminApi.getWebsiteConfig(tenantId),
  });

  const { data: tenant } = useQuery({
    queryKey: ['admin-tenant', tenantId],
    queryFn: () => adminApi.getTenant(tenantId),
  });
  const slug = (tenant?.slug || (tenant as any)?.data?.slug || '') as string;

  useEffect(() => {
    if (data) setDraft({ ...data, slug });
  }, [data, slug]);

  const set = (key: string, value: any) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const setJson = (key: string, patch: Record<string, any>) =>
    setDraft((d) => ({ ...d, [key]: { ...(d[key] || {}), ...patch } }));

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => adminApi.updateWebsiteConfig(tenantId, sanitizeConfig(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website', tenantId] });
      addToast('Website settings saved', 'success');
    },
    onError: (e: any) => addToast(e.message || 'Save failed', 'error'),
  });

  const publishMutation = useMutation({
    mutationFn: () => adminApi.publishWebsite(tenantId),
    onSuccess: () => addToast('Website published & cache refreshed', 'success'),
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
    { id: 'preview', label: 'Preview & Publish', icon: <Eye size={16} /> },
  ];

  if (isLoading) return <p className="text-body">Loading website configuration...</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={draft.restaurantName || 'Website'}
        description={`Editing /${draft.slug || ''} · tenant ${tenantId}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/website')}>Change Tenant</Button>
            <Button variant="ghost" onClick={() => resetMutation.mutate()} isLoading={resetMutation.isPending}>Reset</Button>
            <Button variant="outline" onClick={() => saveMutation.mutate(draft)} isLoading={saveMutation.isPending}>Save</Button>
            <Button onClick={() => publishMutation.mutate()} isLoading={publishMutation.isPending}>
              <Rocket size={16} className="mr-1" /> Publish
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
        <Card className="p-5">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
          <div className="min-h-[420px]">
            {tab === 'branding' && <BrandingTab draft={draft} set={set} setJson={setJson} />}
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
            {tab === 'preview' && <PreviewTab draft={draft} />}
          </div>
        </Card>

        <div className="lg:sticky lg:top-6 space-y-3">
          <Card className="p-3">
            <div className="flex gap-1 mb-3">
              {(['desktop', 'tablet', 'mobile'] as const).map((d) => (
                <Button key={d} size="sm" variant={device === d ? 'primary' : 'ghost'}
                  onClick={() => setDevice(d)} className="capitalize flex-1">{d}</Button>
              ))}
            </div>
            <LivePreview config={draft} device={device} slug={slug} />
            <Button variant="outline" size="sm" className="mt-3 w-full"
              onClick={() => window.open(`${process.env.NEXT_PUBLIC_CUSTOMER_SITE_URL || 'https://localhost:3001'}/${draft.slug || ''}`, '_blank')}>
              Open Live Site ↗
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Tab panels ───────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

function BrandingTab({ draft, set, setJson }: any) {
  return (
    <div>
      <Field label="Restaurant Name"><Input value={draft.restaurantName || ''} onChange={(e) => set('restaurantName', e.target.value)} /></Field>
      <Field label="Tagline"><Input value={draft.tagline || ''} onChange={(e) => set('tagline', e.target.value)} /></Field>
      <Field label="Logo"><MediaField value={draft.logo} onChange={(v) => set('logo', v)} label="Logo" aspect="aspect-square" /></Field>
      <Field label="Favicon"><MediaField value={draft.favicon} onChange={(v) => set('favicon', v)} label="Favicon" aspect="aspect-square" /></Field>
    </div>
  );
}

function ThemeTab({ draft, set }: any) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <ColorPicker label="Primary Color" value={draft.primaryColor} onChange={(v) => set('primaryColor', v)} />
      <ColorPicker label="Secondary Color" value={draft.secondaryColor} onChange={(v) => set('secondaryColor', v)} />
      <ColorPicker label="Accent Color" value={draft.accentColor} onChange={(v) => set('accentColor', v)} />
      <Field label="Border Radius">
        <select className="input" value={draft.borderRadius || 'xl'} onChange={(e) => set('borderRadius', e.target.value)}>
          {['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <Field label="Container Width">
        <select className="input" value={draft.containerWidth || 'max-w-7xl'} onChange={(e) => set('containerWidth', e.target.value)}>
          {['max-w-5xl', 'max-w-6xl', 'max-w-7xl', 'max-w-screen-xl', 'max-w-full'].map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
      </Field>
    </div>
  );
}

function TypographyTab({ draft, set }: any) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="Heading Font">
        <select className="input" value={draft.fontHeading || 'Playfair Display'} onChange={(e) => set('fontHeading', e.target.value)}>
          {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </Field>
      <Field label="Body Font">
        <select className="input" value={draft.fontBody || 'Inter'} onChange={(e) => set('fontBody', e.target.value)}>
          {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </Field>
    </div>
  );
}

function SeoTab({ tenantId, draft, setJson }: any) {
  const seo = draft.seo || {};
  return (
    <div>
      <Field label="Meta Title"><Input value={seo.title || ''} onChange={(e) => setJson('seo', { title: e.target.value })} /></Field>
      <Field label="Meta Description"><Textarea value={seo.description || ''} onChange={(e) => setJson('seo', { description: e.target.value })} /></Field>
      <Field label="Keywords (comma separated)">
        <Input value={(seo.keywords || []).join(', ')} onChange={(e) => setJson('seo', { keywords: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} />
      </Field>
      <Field label="OG Image"><MediaField value={seo.ogImage} onChange={(v) => setJson('seo', { ogImage: v })} label="Social Preview" /></Field>
      <Field label="Robots Index">
        <Switch checked={seo.robots?.index !== false} onChange={(v) => setJson('seo', { robots: { ...(seo.robots || {}), index: v } })} />
      </Field>
    </div>
  );
}

function SocialHoursTab({ draft, setJson }: any) {
  const social = draft.socialLinks || {};
  const hours = draft.openingHours || {};
  const socialKeys = ['facebook', 'instagram', 'twitter', 'youtube', 'linkedin', 'website'];
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <h3 className="font-semibold text-ink mb-3">Social Media</h3>
        {socialKeys.map((k) => (
          <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
            <Input value={social[k] || ''} onChange={(e) => setJson('socialLinks', { [k]: e.target.value })} placeholder="https://..." />
          </Field>
        ))}
      </div>
      <div>
        <h3 className="font-semibold text-ink mb-3">Business Hours</h3>
        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => (
          <Field key={d} label={d.charAt(0).toUpperCase() + d.slice(1)}>
            <Input value={hours[d] || ''} onChange={(e) => setJson('openingHours', { [d]: e.target.value })} placeholder="9:00 AM - 10:00 PM" />
          </Field>
        ))}
      </div>
    </div>
  );
}

function ContactTab({ draft, set }: any) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="Phone"><Input value={draft.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
      <Field label="Email"><Input value={draft.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
      <Field label="WhatsApp Number"><Input value={draft.whatsappNumber || ''} onChange={(e) => set('whatsappNumber', e.target.value)} /></Field>
      <Field label="Address"><Input value={draft.address || ''} onChange={(e) => set('address', e.target.value)} /></Field>
      <Field label="Map URL"><Input value={draft.mapUrl || ''} onChange={(e) => set('mapUrl', e.target.value)} /></Field>
      <Field label="Currency"><Input value={draft.currency || 'INR'} onChange={(e) => set('currency', e.target.value)} /></Field>
    </div>
  );
}

function LegalTab({ draft, setJson }: any) {
  const legal = draft.legalPages || {};
  const pages = ['privacyPolicy', 'termsOfService', 'refundPolicy', 'cancellationPolicy', 'cookiePolicy'];
  return (
    <div className="space-y-4">
      {pages.map((p) => (
        <Card key={p} className="p-4">
          <h4 className="font-semibold text-ink mb-2 capitalize">{p.replace(/([A-Z])/g, ' $1')}</h4>
          <Field label="Title"><Input value={legal[p]?.title || ''} onChange={(e) => setJson('legalPages', { [p]: { ...(legal[p] || {}), title: e.target.value } })} /></Field>
          <Field label="Content"><Textarea value={legal[p]?.content || ''} onChange={(e) => setJson('legalPages', { [p]: { ...(legal[p] || {}), content: e.target.value } })} /></Field>
        </Card>
      ))}
    </div>
  );
}

function SectionsTab({ draft, set }: any) {
  const sections = useMemo(() => draft.homeSections || [], [draft.homeSections]);
  const available = ['hero', 'about', 'menu', 'gallery', 'offers', 'hours', 'contact', 'reviews', 'footer'];
  const toggle = (key: string) => {
    const exists = sections.find((s: any) => s.key === key);
    if (exists) {
      set('homeSections', sections.filter((s: any) => s.key !== key));
    } else {
      set('homeSections', [...sections, { key, enabled: true, order: sections.length + 1 }]);
    }
  };
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    next.forEach((s, i) => (s.order = i + 1));
    set('homeSections', next);
  };
  return (
    <div className="space-y-2">
      <p className="text-body text-sm mb-2">Enable/disable and reorder homepage sections.</p>
      {available.map((key) => {
        const idx = sections.findIndex((s: any) => s.key === key);
        const enabled = idx >= 0;
        return (
          <div key={key} className="flex items-center justify-between border border-ink/10 rounded-lg px-3 py-2">
            <span className="font-sans font-semibold capitalize text-ink">{key}</span>
            <div className="flex items-center gap-2">
              {enabled && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => move(idx, -1)}>↑</Button>
                  <Button size="sm" variant="ghost" onClick={() => move(idx, 1)}>↓</Button>
                </>
              )}
              <Switch checked={enabled} onChange={() => toggle(key)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FeaturesTab({ draft, setJson }: any) {
  const features = draft.features || {};
  const list = [
    ['onlineOrdering', 'Online Ordering'], ['reservations', 'Reservations'], ['reviews', 'Reviews'],
    ['offers', 'Offers'], ['loyalty', 'Loyalty'], ['qrOrdering', 'QR Ordering'],
    ['delivery', 'Delivery'], ['pickup', 'Pickup'], ['whatsappOrdering', 'WhatsApp Ordering'],
    ['aiAssistant', 'AI Assistant'], ['maintenanceMode', 'Maintenance Mode'],
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {list.map(([k, label]) => (
        <div key={k} className="border border-ink/10 rounded-lg px-3 py-2">
          <Switch checked={features[k] !== false} onChange={(v) => setJson('features', { [k]: v })} label={label} />
        </div>
      ))}
    </div>
  );
}

function PreviewTab({ draft }: any) {
  return (
    <div className="space-y-3">
      <p className="text-body">This is a quick themed preview. Use “Open Live Site” for the full customer experience. Changes are pushed live instantly after Publish via real-time sync.</p>
      <pre className="text-xs bg-canvas border border-ink/10 rounded-lg p-3 overflow-auto max-h-64">
        {JSON.stringify({ restaurantName: draft.restaurantName, primaryColor: draft.primaryColor, features: draft.features, homeSections: draft.homeSections }, null, 2)}
      </pre>
    </div>
  );
}
