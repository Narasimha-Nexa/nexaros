'use client';
import React from 'react';
import { useWebsiteBuilderStore } from '@/stores/website-builder.store';
import { LivePreview } from './LivePreview';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Undo2, Redo2, Save, Rocket, Eye, EyeOff, Monitor, Tablet, Smartphone,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

interface WebsiteBuilderLayoutProps {
  tenantId: string;
  slug: string;
  leftPanel: React.ReactNode;
  rightPanel?: React.ReactNode;
  onSave?: () => void;
  onPublish?: () => void;
  isSaving?: boolean;
  isPublishing?: boolean;
}

export function WebsiteBuilderLayout({
  tenantId,
  slug,
  leftPanel,
  rightPanel,
  onSave,
  onPublish,
  isSaving,
  isPublishing,
}: WebsiteBuilderLayoutProps) {
  const {
    device, setDevice,
    isPreviewMode, togglePreviewMode,
    sidebarCollapsed, toggleSidebar,
    propertiesPanelOpen, togglePropertiesPanel,
    undo, redo, canUndo, canRedo,
    draft, isDirty, lastSavedAt, lastPublishedAt,
  } = useWebsiteBuilderStore();

  const deviceIcons = {
    desktop: <Monitor size={16} />,
    tablet: <Tablet size={16} />,
    mobile: <Smartphone size={16} />,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={undo} disabled={!canUndo()} title="Undo (Ctrl+Z)">
            <Undo2 size={16} />
          </Button>
          <Button size="sm" variant="ghost" onClick={redo} disabled={!canRedo()} title="Redo (Ctrl+Shift+Z)">
            <Redo2 size={16} />
          </Button>
          <div className="h-4 w-px bg-ink/10 mx-1" />
          <div className="flex gap-0.5 bg-ink/5 rounded-lg p-0.5">
            {(['desktop', 'tablet', 'mobile'] as const).map((d) => (
              <Button key={d} size="sm" variant={device === d ? 'primary' : 'ghost'}
                onClick={() => setDevice(d)} className="capitalize" title={d}>
                {deviceIcons[d]}
              </Button>
            ))}
          </div>
          <div className="h-4 w-px bg-ink/10 mx-1" />
          <Button size="sm" variant={isPreviewMode ? 'primary' : 'ghost'} onClick={togglePreviewMode}>
            {isPreviewMode ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="ml-1 hidden sm:inline">{isPreviewMode ? 'Build' : 'Preview'}</span>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && <span className="text-xs text-warning font-medium">Unsaved changes</span>}
          {lastSavedAt && !isDirty && (
            <span className="text-xs text-ink/40">Saved {lastSavedAt.toLocaleTimeString()}</span>
          )}
          <Button size="sm" variant="outline" onClick={onSave} isLoading={isSaving}>
            <Save size={14} className="mr-1" /> Save
          </Button>
          <Button size="sm" onClick={onPublish} isLoading={isPublishing}>
            <Rocket size={14} className="mr-1" /> Publish
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`border-r bg-white overflow-y-auto transition-all duration-200 ${sidebarCollapsed ? 'w-12' : 'w-[260px]'}`}>
          <button
            onClick={toggleSidebar}
            className="absolute top-14 right-0 z-10 bg-white border border-l-0 rounded-r-md p-1 -mr-3 hover:bg-ink/5"
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          {!sidebarCollapsed && leftPanel}
        </div>

        <div className="flex-1 bg-ink/5 overflow-y-auto flex items-start justify-center p-6">
          <div className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-200 ${
            device === 'desktop' ? 'w-full max-w-5xl' :
            device === 'tablet' ? 'w-[768px]' :
            'w-[375px]'
          }`}>
            <LivePreview config={draft} device={device} slug={slug} />
          </div>
        </div>

        {rightPanel && (
          <div className={`border-l bg-white overflow-y-auto transition-all duration-200 ${propertiesPanelOpen ? 'w-[320px]' : 'w-12'}`}>
            <button
              onClick={togglePropertiesPanel}
              className="absolute top-14 left-0 z-10 bg-white border border-r-0 rounded-l-md p-1 -ml-3 hover:bg-ink/5"
            >
              {propertiesPanelOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
            {propertiesPanelOpen && rightPanel}
          </div>
        )}
      </div>
    </div>
  );
}
