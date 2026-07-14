'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { Save, RefreshCw, Globe, Mail, Bell, Shield } from 'lucide-react';

interface Setting {
  id: string;
  key: string;
  value: any;
  description?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const { addToast } = useToastStore();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [settingsRes, maintenanceRes] = await Promise.all([
        adminApi.getSettings().catch(() => null),
        adminApi.getMaintenanceMode().catch(() => null),
      ]);
      if (settingsRes) {
        const data = settingsRes.data || settingsRes.settings || settingsRes;
        setSettings(Array.isArray(data) ? data : Object.entries(data).map(([key, value]) => ({ id: key, key, value })));
      }
      if (maintenanceRes) {
        setMaintenanceMode(maintenanceRes.enabled || false);
        setMaintenanceMessage(maintenanceRes.message || '');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const getSettingValue = (key: string) => {
    const setting = settings.find((s) => s.key === key);
    return setting?.value ?? '';
  };

  const handleSaveSetting = async (key: string, value: string, description?: string) => {
    setSaving(true);
    try {
      await adminApi.setSetting(key, value, description);
      addToast(`${key} updated`, 'success');
      fetchSettings();
    } catch (err: any) {
      addToast(err.message || `Failed to update ${key}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMaintenance = async () => {
    setSaving(true);
    try {
      await adminApi.setMaintenanceMode(maintenanceMode, maintenanceMessage);
      addToast('Maintenance mode updated', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update maintenance mode', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System"
        title="Settings"
        actions={<Button variant="outline" size="sm" onClick={fetchSettings}><RefreshCw size={14} /> Refresh</Button>}
      />
      <div className="divider-heavy" />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Card key={i} className="h-64 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} />
              <h2 className="text-display-xs font-sans">General</h2>
            </div>
            <div className="divider mb-4" />
            <div className="space-y-4">
              <Input label="Platform Name" defaultValue={getSettingValue('platform_name') || 'NexaROS'} />
              <Input label="Support Email" defaultValue={getSettingValue('support_email') || 'support@nexaros.com'} />
              <Input label="Default Currency" defaultValue={getSettingValue('default_currency') || 'INR'} />
              <Select
                label="Default Timezone"
                value={getSettingValue('default_timezone') || 'Asia/Kolkata'}
                options={[{ value: 'Asia/Kolkata', label: 'IST (UTC+5:30)' }, { value: 'UTC', label: 'UTC' }]}
              />
              <Button onClick={() => handleSaveSetting('platform_name', 'NexaROS', 'Platform display name')} isLoading={saving}>
                <Save size={14} /> Save Changes
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Mail size={16} />
              <h2 className="text-display-xs font-sans">Email</h2>
            </div>
            <div className="divider mb-4" />
            <div className="space-y-4">
              <Input label="SMTP Host" defaultValue={getSettingValue('smtp_host') || 'smtp.nexaros.com'} />
              <Input label="SMTP Port" defaultValue={getSettingValue('smtp_port') || '587'} />
              <Input label="From Name" defaultValue={getSettingValue('email_from_name') || 'NexaROS'} />
              <Input label="From Email" defaultValue={getSettingValue('email_from_address') || 'noreply@nexaros.com'} />
              <Button onClick={() => handleSaveSetting('smtp_host', getSettingValue('smtp_host') || 'smtp.nexaros.com', 'SMTP server host')} isLoading={saving}>
                <Save size={14} /> Save Changes
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Bell size={16} />
              <h2 className="text-display-xs font-sans">Notifications</h2>
            </div>
            <div className="divider mb-4" />
            <div className="space-y-4">
              {[
                { key: 'notify_new_registration', label: 'New tenant registration', defaultVal: true },
                { key: 'notify_payment_failure', label: 'Payment failures', defaultVal: true },
                { key: 'notify_expiration', label: 'Subscription expirations', defaultVal: true },
                { key: 'notify_ticket', label: 'Support ticket creation', defaultVal: true },
                { key: 'notify_security', label: 'Security alerts', defaultVal: true },
                { key: 'notify_daily_summary', label: 'Daily summary email', defaultVal: false },
              ].map((item) => {
                const val = getSettingValue(item.key);
                const enabled = val !== '' ? !!val : item.defaultVal;
                return (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-body-sm font-sans">{item.label}</span>
                    <Badge variant={enabled ? 'filled' : 'outline'}>{enabled ? 'On' : 'Off'}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} />
              <h2 className="text-display-xs font-sans">Security</h2>
            </div>
            <div className="divider mb-4" />
            <div className="space-y-4">
              <Input label="JWT Expiry (seconds)" defaultValue={getSettingValue('jwt_expiry') || '3600'} hint="1 hour default" />
              <Input label="Refresh Token Expiry (seconds)" defaultValue={getSettingValue('refresh_token_expiry') || '86400'} hint="24 hours default" />
              <Input label="Max Login Attempts" defaultValue={getSettingValue('max_login_attempts') || '5'} />
              <Input label="Lockout Duration (minutes)" defaultValue={getSettingValue('lockout_duration') || '30'} />
              <Button onClick={() => handleSaveSetting('max_login_attempts', getSettingValue('max_login_attempts') || '5', 'Max login attempts before lockout')} isLoading={saving}>
                <Save size={14} /> Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-display-xs font-sans">Maintenance Mode</h2>
            <p className="text-body-sm text-body font-sans">Disable platform access for non-admin users</p>
          </div>
          <Badge variant={maintenanceMode ? 'filled' : 'outline'}>{maintenanceMode ? 'Active' : 'Inactive'}</Badge>
        </div>
        <div className="divider mb-4" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-sans">Enable Maintenance Mode</span>
            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`w-12 h-6 rounded-none border ${maintenanceMode ? 'bg-ink border-ink' : 'bg-transparent border-hairline'} transition-colors`}
            >
              <div className={`w-5 h-5 transition-transform ${maintenanceMode ? 'translate-x-[25px] bg-white' : 'translate-x-[1px] bg-body'}`} />
            </button>
          </div>
          <Input label="Maintenance Message" value={maintenanceMessage} onChange={(e) => setMaintenanceMessage(e.target.value)} placeholder="We'll be back soon!" />
          <Button onClick={handleSaveMaintenance} isLoading={saving}>
            <Save size={14} /> Update Maintenance Mode
          </Button>
        </div>
      </Card>
    </div>
  );
}
