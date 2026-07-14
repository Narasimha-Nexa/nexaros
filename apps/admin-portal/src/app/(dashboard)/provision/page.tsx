'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useToastStore } from '@/stores/ui.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Building2,
  User,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Printer,
  RotateCcw,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Restaurant', icon: Building2 },
  { id: 2, label: 'Owner', icon: User },
  { id: 3, label: 'Plan', icon: CreditCard },
  { id: 4, label: 'Done', icon: CheckCircle2 },
];

const CUISINE_TYPES = [
  'South Indian', 'North Indian', 'Chinese', 'Continental', 'Mughlai',
  'Fast Food', 'Biryani', 'Chaat', 'Bakery', 'Cafe', 'Fine Dining',
  'Multi-Cuisine', 'Pure Veg', 'Non-Veg', 'Seafood', 'Other',
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
];

interface FormData {
  restaurantName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  cuisineType: string;
  gstNumber: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  password: string;
  autoGeneratePassword: boolean;
  planId: string;
}

interface ProvisionResult {
  restaurant: { id: string; name: string; slug: string; address: string; city: string; state: string };
  branch: { id: string; name: string };
  owner: { id: string; name: string; email: string; phone: string; password: string };
  subscription: { id: string; plan: string; status: string; trialEndsAt: string } | null;
}

const emptyForm: FormData = {
  restaurantName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: 'Karnataka',
  cuisineType: '',
  gstNumber: '',
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  password: '',
  autoGeneratePassword: true,
  planId: '',
};

export default function ProvisionPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const router = useRouter();
  const { addToast } = useToastStore();

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => adminApi.getPlans(),
  });

  const plans = plansData?.plans || [];

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canNext = () => {
    if (step === 1) return form.restaurantName.trim().length > 0;
    if (step === 2) return form.ownerName.trim().length > 0 && form.ownerEmail.trim().length > 0;
    if (step === 3) return true;
    return false;
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const payload: any = {
        restaurantName: form.restaurantName.trim(),
        ownerName: form.ownerName.trim(),
        ownerEmail: form.ownerEmail.trim(),
      };
      if (form.phone) payload.phone = form.phone.trim();
      if (form.ownerPhone) payload.ownerPhone = form.ownerPhone.trim();
      if (!form.autoGeneratePassword && form.password) payload.password = form.password;
      if (form.address) payload.address = form.address.trim();
      if (form.city) payload.city = form.city.trim();
      if (form.state) payload.state = form.state;
      if (form.cuisineType) payload.cuisineType = form.cuisineType;
      if (form.gstNumber) payload.gstNumber = form.gstNumber.trim();
      if (form.planId) payload.planId = form.planId;

      const res = await adminApi.provisionTenant(payload);
      setResult(res);
      setStep(4);
      addToast('Restaurant created successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to create restaurant', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !result) return;
    printWindow.document.write(`
      <html><head><title>NexaROS Login Credentials</title>
      <style>
        body { font-family: monospace; padding: 40px; color: #000; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
        .header h1 { font-size: 24px; margin: 0; }
        .header p { color: #666; margin: 5px 0 0; }
        .section { margin-bottom: 20px; }
        .section h3 { font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
        .label { color: #666; }
        .value { font-weight: bold; }
        .password-box { background: #f5f5f5; border: 2px solid #000; padding: 15px; margin: 15px 0; text-align: center; }
        .password-box .pw { font-size: 24px; font-weight: bold; letter-spacing: 3px; }
        .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 11px; color: #999; text-align: center; }
        .note { background: #fffde7; border: 1px solid #f0e68c; padding: 10px; font-size: 12px; margin-top: 15px; }
      </style></head><body>
      <div class="header">
        <h1>NexaROS</h1>
        <p>Restaurant Login Credentials</p>
      </div>
      <div class="section">
        <h3>Restaurant</h3>
        <div class="row"><span class="label">Name</span><span class="value">${result.restaurant.name}</span></div>
        <div class="row"><span class="label">City</span><span class="value">${result.restaurant.city || 'N/A'}</span></div>
        <div class="row"><span class="label">Plan</span><span class="value">${result.subscription?.plan || 'N/A'}</span></div>
      </div>
      <div class="section">
        <h3>Login Credentials</h3>
        <div class="row"><span class="label">Email</span><span class="value">${result.owner.email}</span></div>
        <div class="password-box">
          <div style="font-size:12px;color:#666;margin-bottom:5px;">PASSWORD</div>
          <div class="pw">${result.owner.password}</div>
        </div>
      </div>
      <div class="note">
        <strong>Important:</strong> Please keep these credentials safe. Change the password after first login.
      </div>
      <div class="footer">Generated by NexaROS Admin Portal — ${new Date().toLocaleString('en-IN')}</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const reset = () => {
    setForm(emptyForm);
    setResult(null);
    setStep(1);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-display-lg">Create Restaurant</h1>
        <p className="text-body text-body-lg mt-2 font-body">
          Set up a new restaurant with owner account in one step. The owner just needs to log in.
        </p>
      </div>

      <div className="h-[2px] w-full bg-ink mb-8" />

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 flex items-center justify-center text-caption font-bold border-2 transition-colors ${
                  step >= s.id
                    ? 'bg-ink text-canvas border-ink'
                    : 'bg-canvas text-body border-hairline'
                }`}
              >
                {step > s.id ? <CheckCircle2 size={16} /> : s.id}
              </div>
              <span
                className={`text-body-sm font-sans hidden sm:inline ${
                  step >= s.id ? 'text-ink font-semibold' : 'text-body'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] ${step > s.id ? 'bg-ink' : 'bg-hairline'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Restaurant */}
      {step === 1 && (
        <Card className="p-8">
          <h2 className="font-display text-display-sm mb-6">Restaurant Details</h2>
          <div className="space-y-5">
            <Input
              label="Restaurant Name *"
              placeholder="e.g. Royal Kitchen"
              value={form.restaurantName}
              onChange={(e) => set('restaurantName', e.target.value)}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Phone"
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                placeholder="e.g. info@royalkitchen.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
            <Input
              label="Address"
              placeholder="e.g. 123 MG Road, near City Mall"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="City"
                placeholder="e.g. Bangalore"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
              <div>
                <label className="block text-body-sm font-sans font-semibold text-ink mb-2">State</label>
                <select
                  className="w-full h-10 px-3 border-2 border-ink bg-canvas text-body font-sans focus:outline-none"
                  value={form.state}
                  onChange={(e) => set('state', e.target.value)}
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-body-sm font-sans font-semibold text-ink mb-2">Cuisine Type</label>
                <select
                  className="w-full h-10 px-3 border-2 border-ink bg-canvas text-body font-sans focus:outline-none"
                  value={form.cuisineType}
                  onChange={(e) => set('cuisineType', e.target.value)}
                >
                  <option value="">Select cuisine</option>
                  {CUISINE_TYPES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <Input
                label="GST Number"
                placeholder="Optional"
                value={form.gstNumber}
                onChange={(e) => set('gstNumber', e.target.value)}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Owner */}
      {step === 2 && (
        <Card className="p-8">
          <h2 className="font-display text-display-sm mb-6">Owner Account</h2>
          <div className="space-y-5">
            <Input
              label="Owner Full Name *"
              placeholder="e.g. Ravi Kumar"
              value={form.ownerName}
              onChange={(e) => set('ownerName', e.target.value)}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Owner Email *"
                type="email"
                placeholder="e.g. ravi@gmail.com"
                value={form.ownerEmail}
                onChange={(e) => set('ownerEmail', e.target.value)}
                required
              />
              <Input
                label="Owner Phone"
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.ownerPhone}
                onChange={(e) => set('ownerPhone', e.target.value)}
              />
            </div>
            <div className="border-2 border-hairline p-5">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  className="w-4 h-4 border-2 border-ink accent-ink"
                  checked={form.autoGeneratePassword}
                  onChange={(e) => set('autoGeneratePassword', e.target.checked)}
                />
                <span className="text-body-sm font-sans font-semibold text-ink">
                  Auto-generate password (recommended)
                </span>
              </label>
              {!form.autoGeneratePassword && (
                <Input
                  label="Set Password"
                  type="password"
                  placeholder="Enter a strong password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                />
              )}
              {form.autoGeneratePassword && (
                <p className="text-caption font-sans text-body">
                  A strong 12-character password will be generated. You can share it with the owner after creation.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Plan */}
      {step === 3 && (
        <Card className="p-8">
          <h2 className="font-display text-display-sm mb-6">Select Plan</h2>
          <p className="text-body font-body mb-6">
            Choose a subscription plan for this restaurant. They start with a free trial.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((plan: any) => (
              <button
                key={plan.id}
                onClick={() => set('planId', plan.id)}
                className={`text-left p-5 border-2 transition-colors ${
                  form.planId === plan.id
                    ? 'border-ink bg-ink text-canvas'
                    : 'border-hairline hover:border-ink'
                }`}
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-display text-body-lg font-bold">{plan.name}</span>
                  <span className="font-sans text-body-sm">
                    ₹{Number(plan.price).toLocaleString('en-IN')}/{plan.billingCycle === 'YEARLY' ? 'yr' : 'mo'}
                  </span>
                </div>
                <div className="text-caption font-sans opacity-70">
                  {plan.maxBranches === 1 ? '1 Branch' : `${plan.maxBranches} Branches`} • {plan.maxStaff} Staff • {plan.trialDays}d trial
                </div>
              </button>
            ))}
            {plans.length === 0 && (
              <div className="col-span-2 text-center py-10 text-body font-sans">
                No plans found. Using Starter plan by default.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Step 4: Success */}
      {step === 4 && result && (
        <div className="space-y-6">
          <Card className="p-8 border-2 border-ink">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 size={28} className="text-ink" />
              <h2 className="font-display text-display-sm">Restaurant Created!</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-caption font-sans font-bold tracking-wider uppercase text-body mb-3">Restaurant</h3>
                <div className="space-y-2 text-body font-sans">
                  <p><span className="text-body">Name:</span> <span className="font-semibold">{result.restaurant.name}</span></p>
                  <p><span className="text-body">Slug:</span> <span className="font-semibold font-mono text-body-sm">{result.restaurant.slug}</span></p>
                  {result.restaurant.city && <p><span className="text-body">City:</span> <span className="font-semibold">{result.restaurant.city}</span></p>}
                </div>
              </div>

              <div>
                <h3 className="text-caption font-sans font-bold tracking-wider uppercase text-body mb-3">Subscription</h3>
                <div className="space-y-2 text-body font-sans">
                  {result.subscription && (
                    <>
                      <p><span className="text-body">Plan:</span> <span className="font-semibold">{result.subscription.plan}</span></p>
                      <p><span className="text-body">Status:</span> <span className="font-semibold">Trial (14 days)</span></p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="h-[2px] w-full bg-hairline my-6" />

            <h3 className="text-caption font-sans font-bold tracking-wider uppercase text-body mb-4">Login Credentials</h3>
            <div className="bg-canvas-secondary p-6 border-2 border-ink">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body font-sans text-body">Email</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{result.owner.email}</span>
                    <button
                      onClick={() => copyToClipboard(result.owner.email, 'email')}
                      className="p-1 hover:bg-ink hover:text-canvas transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                    {copied === 'email' && <span className="text-caption font-sans text-body">Copied!</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body font-sans text-body">Password</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-body-lg tracking-wider">{result.owner.password}</span>
                    <button
                      onClick={() => copyToClipboard(result.owner.password, 'password')}
                      className="p-1 hover:bg-ink hover:text-canvas transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                    {copied === 'password' && <span className="text-caption font-sans text-body">Copied!</span>}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-caption font-sans text-body mt-4">
              Share these credentials with the restaurant owner. They can log in at the NexaROS app with these details.
            </p>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={handlePrint} className="gap-2">
              <Printer size={16} /> Print Credentials
            </Button>
            <Button variant="outline" onClick={() => copyToClipboard(
              `NexaROS Login\nEmail: ${result.owner.email}\nPassword: ${result.owner.password}`,
              'all'
            )} className="gap-2">
              <Copy size={16} /> {copied === 'all' ? 'Copied!' : 'Copy All'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/tenants')} className="gap-2">
              View All Restaurants
            </Button>
            <Button variant="ghost" onClick={reset} className="gap-2 ml-auto">
              <RotateCcw size={16} /> Create Another
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 4 && (
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="gap-2"
          >
            <ArrowLeft size={16} /> Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="gap-2">
              Next <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleCreate} isLoading={isCreating} className="gap-2">
              <CheckCircle2 size={16} /> Create Restaurant
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
