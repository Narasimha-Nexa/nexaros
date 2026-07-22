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

  const [generalName, setGeneralName] = useState('');
  const [generalEmail, setGeneralEmail] = useState('');
  const [generalCurrency, setGeneralCurrency] = useState('');
  const [generalTimezone, setGeneralTimezone] = useState('Asia/Kolkata');

  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [emailFromName, setEmailFromName] = useState('');
  const [emailFromAddress, setEmailFromAddress] = useState('');

  const [jwtExpiry, setJwtExpiry] = useState('');
  const [refreshTokenExpiry, setRefreshTokenExpiry] = useState('');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('');
  const [lockoutDuration, setLockoutDuration] = useState('');

  const [notifications, setNotifications] = useState<Record<string, boolean>>({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [settingsRes, maintenanceRes] = await Promise.all([
        adminApi.getSettings().catch(() => null),
        adminApi.getMaintenanceMode().catch(() => null),
      ]);
      if (settingsRes) {
        const data = settingsRes.data || settingsRes.settings || settingsRes;
        const arr = Array.isArray(data) ? data : Object.entries(data).map(([key, value]) => ({ id: key, key, value }));
        setSettings(arr);
        const get = (k: string) => arr.find((s: Setting) => s.key === k)?.value ?? '';
        setGeneralName(get('platform_name'));
        setGeneralEmail(get('support_email'));
        setGeneralCurrency(get('default_currency'));
        setGeneralTimezone(get('default_timezone') || 'Asia/Kolkata');
        setSmtpHost(get('smtp_host'));
        setSmtpPort(get('smtp_port'));
        setEmailFromName(get('email_from_name'));
        setEmailFromAddress(get('email_from_address'));
        setJwtExpiry(get('jwt_expiry'));
        setRefreshTokenExpiry(get('refresh_token_expiry'));
        setMaxLoginAttempts(get('max_login_attempts'));
        setLockoutDuration(get('lockout_duration'));
        const notifKeys = ['notify_new_registration', 'notify_payment_failure', 'notify_expiration', 'notify_ticket', 'notify_security', 'notify_daily_summary'];
        const notifDefaults: Record<string, boolean> = { notify_new_registration: true, notify_payment_failure: true, notify_expiration: true, notify_ticket: true, notify_security: true, notify_daily_summary: false };
        const notifState: Record<string, boolean> = {};
        for (const k of notifKeys) { const v = get(k); notifState[k] = v !== '' ? !!v : notifDefaults[k]; }
        setNotifications(notifState);
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

  const handleSaveSettings = async (entries: Array<{ key: string; value: string; description?: string }>) => {
    setSaving(true);
    try {
      await Promise.all(entries.map((e) => adminApi.setSetting(e.key, e.value, e.description)));
      addToast('Settings updated', 'success');
      fetchSettings();
    } catch (err: any) {
      addToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotification = async (key: string, enabled: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: enabled }));
    try {
      await adminApi.setSetting(key, String(enabled), `${key} notification toggle`);
      addToast('Notification preference updated', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update notification', 'error');
      setNotifications((prev) => ({ ...prev, [key]: !enabled }));
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
          {[...Array(4)].map((_, i) => <Card key={i}><div className="skeleton h-64 w-full" /></Card>)}
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
              <Input label="Platform Name" value={generalName} onChange={(e) => setGeneralName(e.target.value)} />
              <Input label="Support Email" value={generalEmail} onChange={(e) => setGeneralEmail(e.target.value)} />
              <Input label="Default Currency" value={generalCurrency} onChange={(e) => setGeneralCurrency(e.target.value)} />
              <Select
                label="Default Timezone"
                value={generalTimezone}
                onChange={(e: any) => setGeneralTimezone(typeof e === 'string' ? e : e.target.value)}
                options={[{ value: 'Asia/Kolkata', label: 'IST (UTC+5:30)' }, { value: 'UTC', label: 'UTC' }]}
              />
              <Button onClick={() => handleSaveSettings([
                { key: 'platform_name', value: generalName, description: 'Platform display name' },
                { key: 'support_email', value: generalEmail, description: 'Support contact email' },
                { key: 'default_currency', value: generalCurrency, description: 'Default currency code' },
                { key: 'default_timezone', value: generalTimezone, description: 'Default timezone' },
              ])} isLoading={saving}>
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
              <Input label="SMTP Host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
              <Input label="SMTP Port" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
              <Input label="From Name" value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} />
              <Input label="From Email" value={emailFromAddress} onChange={(e) => setEmailFromAddress(e.target.value)} />
              <Button onClick={() => handleSaveSettings([
                { key: 'smtp_host', value: smtpHost, description: 'SMTP server host' },
                { key: 'smtp_port', value: smtpPort, description: 'SMTP server port' },
                { key: 'email_from_name', value: emailFromName, description: 'Email sender name' },
                { key: 'email_from_address', value: emailFromAddress, description: 'Email sender address' },
              ])} isLoading={saving}>
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
                const enabled = notifications[item.key] ?? item.defaultVal;
                return (
                  <div key={item.key} className="flex items-center justify-between py-1.5">
                    <span className="text-body-sm font-sans">{item.label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => handleSaveNotification(item.key, !enabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-ink ${
                        enabled ? 'bg-ink border-ink' : 'bg-canvas-soft border-hairline'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                          enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                        }`}
                      />
                    </button>
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
              <Input label="JWT Expiry (seconds)" value={jwtExpiry} onChange={(e) => setJwtExpiry(e.target.value)} hint="1 hour default" />
              <Input label="Refresh Token Expiry (seconds)" value={refreshTokenExpiry} onChange={(e) => setRefreshTokenExpiry(e.target.value)} hint="24 hours default" />
              <Input label="Max Login Attempts" value={maxLoginAttempts} onChange={(e) => setMaxLoginAttempts(e.target.value)} />
              <Input label="Lockout Duration (minutes)" value={lockoutDuration} onChange={(e) => setLockoutDuration(e.target.value)} />
              <Button onClick={() => handleSaveSettings([
                { key: 'jwt_expiry', value: jwtExpiry, description: 'JWT token expiry in seconds' },
                { key: 'refresh_token_expiry', value: refreshTokenExpiry, description: 'Refresh token expiry in seconds' },
                { key: 'max_login_attempts', value: maxLoginAttempts, description: 'Max login attempts before lockout' },
                { key: 'lockout_duration', value: lockoutDuration, description: 'Account lockout duration in minutes' },
              ])} isLoading={saving}>
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
              type="button"
              role="switch"
              aria-checked={maintenanceMode}
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-ink ${
                maintenanceMode ? 'bg-ink border-ink' : 'bg-canvas-soft border-hairline'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                  maintenanceMode ? 'translate-x-[22px]' : 'translate-x-[2px]'
                }`}
              />
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
