'use client';
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { Settings, Save, RefreshCw, Database, Mail, Bell, Shield, Globe, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { addToast } = useToastStore();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="System" title="Settings" />
      <div className="divider-heavy" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} />
            <h2 className="text-display-xs font-sans">General</h2>
          </div>
          <div className="divider mb-4" />
          <div className="space-y-4">
            <Input label="Platform Name" defaultValue="NexaROS" />
            <Input label="Support Email" defaultValue="support@nexaros.com" />
            <Input label="Default Currency" defaultValue="INR" />
            <Select
              label="Default Timezone"
              value="Asia/Kolkata"
              options={[{ value: 'Asia/Kolkata', label: 'IST (UTC+5:30)' }, { value: 'UTC', label: 'UTC' }]}
            />
            <Button onClick={() => addToast('Settings saved', 'success')}>
              <Save size={14} /> Save Changes
            </Button>
          </div>
        </Card>

        {/* Email Settings */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Mail size={16} />
            <h2 className="text-display-xs font-sans">Email</h2>
          </div>
          <div className="divider mb-4" />
          <div className="space-y-4">
            <Input label="SMTP Host" defaultValue="smtp.nexaros.com" />
            <Input label="SMTP Port" defaultValue="587" />
            <Input label="From Name" defaultValue="NexaROS" />
            <Input label="From Email" defaultValue="noreply@nexaros.com" />
            <Button onClick={() => addToast('Email settings saved', 'success')}>
              <Save size={14} /> Save Changes
            </Button>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} />
            <h2 className="text-display-xs font-sans">Notifications</h2>
          </div>
          <div className="divider mb-4" />
          <div className="space-y-4">
            {[
              { label: 'New tenant registration', enabled: true },
              { label: 'Payment failures', enabled: true },
              { label: 'Subscription expirations', enabled: true },
              { label: 'Support ticket creation', enabled: true },
              { label: 'Security alerts', enabled: true },
              { label: 'Daily summary email', enabled: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-body-sm font-sans">{item.label}</span>
                <Badge variant={item.enabled ? 'filled' : 'outline'}>
                  {item.enabled ? 'On' : 'Off'}
                </Badge>
              </div>
            ))}
            <Button onClick={() => addToast('Notification settings saved', 'success')}>
              <Save size={14} /> Save Changes
            </Button>
          </div>
        </Card>

        {/* Security Settings */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} />
            <h2 className="text-display-xs font-sans">Security</h2>
          </div>
          <div className="divider mb-4" />
          <div className="space-y-4">
            <Input label="JWT Expiry (seconds)" defaultValue="3600" hint="1 hour default" />
            <Input label="Refresh Token Expiry (seconds)" defaultValue="86400" hint="24 hours default" />
            <Input label="Max Login Attempts" defaultValue="5" />
            <Input label="Lockout Duration (minutes)" defaultValue="30" />
            <Button onClick={() => addToast('Security settings saved', 'success')}>
              <Save size={14} /> Save Changes
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
