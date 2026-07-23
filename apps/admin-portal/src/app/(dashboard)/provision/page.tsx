'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { loadRazorpayScript, openRazorpayCheckout } from '@/lib/razorpay';
import { useToastStore } from '@/stores/ui.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Building2, User, CreditCard, Settings, Loader2, CheckCircle2,
  ArrowRight, ArrowLeft, Copy, Printer, RotateCcw, Tag,
  AlertCircle, Rocket, Calculator, Percent, PartyPopper,
  Shield, Clock, Globe, Zap, Crown, Star, ExternalLink,
  FileText, Download, Eye, EyeOff, ChevronRight, Check,
  Sparkles, Lock, Wallet, Building, ArrowUpRight, GitBranch,
} from 'lucide-react';

const STORAGE_KEY = 'nexaros_provision_draft_v2';

const STEPS = [
  { id: 0, label: 'Type', icon: Building },
  { id: 1, label: 'Restaurant', icon: Building2 },
  { id: 2, label: 'Owner', icon: User },
  { id: 3, label: 'Settings', icon: Settings },
  { id: 4, label: 'Plan & Payment', icon: CreditCard },
  { id: 5, label: 'Provisioning', icon: Rocket },
  { id: 6, label: 'Done', icon: CheckCircle2 },
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

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
  'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles',
  'Australia/Sydney', 'Africa/Cairo',
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

const COUNTRIES = [
  'India', 'UAE', 'United States', 'United Kingdom', 'Singapore',
  'Australia', 'Canada', 'Germany', 'France', 'Japan',
];

interface FormData {
  restaurantName: string; phone: string; email: string; address: string;
  city: string; state: string; country: string; cuisineType: string;
  gstNumber: string; timezone: string; currency: string; subdomain: string;
  ownerName: string; ownerEmail: string; ownerPhone: string;
  password: string; autoGeneratePassword: boolean;
  planId: string; billingCycle: string; couponCode: string; customAmount: string;
}

type ProvisionMode = 'new_business' | 'add_branch';

interface OwnerCheckResult {
  exists: boolean;
  owner?: { id: string; name: string; email: string; phone: string | null; tenants: { id: string; name: string; slug: string; subdomain: string | null; branches: { id: string; name: string; displayName: string | null }[] }[] };
}

interface PricingResult {
  plan: { id: string; name: string; slug: string; billingCycle: string };
  subtotal: number; discountAmount: number; discountType: string | null;
  couponCode: string | null; taxRate: number; taxAmount: number;
  totalAmount: number; yearlyPrice: number | null;
  monthlyEquivalent: number | null; savingsPercent: number;
}

interface PreviewResult {
  requestId: string;
  restaurant: { name: string; slug: string; subdomain: string; address: string; city: string; state: string; country: string; cuisineType: string; phone: string; email: string; timezone: string; currency: string; };
  owner: { name: string; email: string; phone: string; };
  branch: { name: string; address: string; };
  subscription: { plan: string; planId: string | null; billingCycle: string; isFree: boolean; trialDays: number; trialEndsAt: string; status: string; };
  payment: { required: boolean; status: string; provider: string; amount: number; currency: string; };
  modules: Record<string, boolean>;
  moduleCount: number;
  resources: { permissions: number; roles: number; categories: number; tables: number; shifts: number; membershipTiers: number; taxRates: number; featureFlags: number; settings: number; };
  estimatedTime: string;
}

interface ProvisionResult {
  success: boolean;
  restaurant: { id: string; name: string; slug: string; subdomain: string; city: string; country: string; timezone: string; currency: string; };
  branch: { id: string; name: string };
  owner: { id: string; name: string; email: string; password: string; };
  subscription: { id: string; plan: string; status: string; trialEndsAt: string; } | null;
  provisioning: { permissions: number; featureFlags: number; settings: number; taxSettings: number; membershipTiers: number; shifts: number; categories: number; tables: number; };
}

const emptyForm: FormData = {
  restaurantName: '', phone: '', email: '', address: '', city: '',
  state: 'Karnataka', country: 'India', cuisineType: '', gstNumber: '',
  timezone: 'Asia/Kolkata', currency: 'INR', subdomain: '',
  ownerName: '', ownerEmail: '', ownerPhone: '',
  password: '', autoGeneratePassword: true,
  planId: '', billingCycle: 'MONTHLY', couponCode: '', customAmount: '',
};

const PROVISIONING_STEPS = [
  { key: 'validating', label: 'Validating inputs', icon: Shield },
  { key: 'tenant', label: 'Creating restaurant', icon: Building2 },
  { key: 'branch', label: 'Setting up branch', icon: Building },
  { key: 'permissions', label: 'Configuring permissions', icon: Lock },
  { key: 'roles', label: 'Creating roles', icon: User },
  { key: 'owner', label: 'Creating owner account', icon: User },
  { key: 'staff', label: 'Linking staff record', icon: User },
  { key: 'subscription', label: 'Activating subscription', icon: CreditCard },
  { key: 'website', label: 'Generating website config', icon: Globe },
  { key: 'categories', label: 'Creating menu categories', icon: FileText },
  { key: 'tables', label: 'Setting up tables', icon: Building2 },
  { key: 'shifts', label: 'Configuring shifts', icon: Clock },
  { key: 'membership', label: 'Creating membership tiers', icon: Crown },
  { key: 'tax', label: 'Setting up tax rates', icon: Calculator },
  { key: 'featureflags', label: 'Enabling feature flags', icon: Zap },
  { key: 'settings', label: 'Applying settings', icon: Settings },
  { key: 'completed', label: 'Provisioning complete', icon: CheckCircle2 },
];

const CUSTOMER_SITE_URL = process.env.NEXT_PUBLIC_CUSTOMER_SITE_URL || 'http://localhost:3001';

const PLAN_FEATURES: Record<string, { features: string[]; highlights: string[] }> = {
  default: {
    features: ['Unlimited Menu', 'QR Ordering', 'Basic Dashboard', 'Basic Reports', 'Email Notifications'],
    highlights: [],
  },
  developer: {
    features: ['Everything in Free', 'Unlimited Staff', 'Inventory Management', 'Kitchen Display', 'POS System', 'Supplier Management'],
    highlights: ['Kitchen Display', 'POS'],
  },
  professional: {
    features: ['Everything in Developer', 'AI Features', 'Advanced Analytics', 'Custom Reports', 'Loyalty Program', 'Coupon Engine', 'Campaign Manager', 'CRM'],
    highlights: ['AI Features', 'Analytics'],
  },
  enterprise: {
    features: ['Unlimited Everything', 'White Label', 'Multi-Branch', 'Dedicated Support', 'Custom Integrations', 'SLA Guarantee', 'Priority Queue', 'API Access'],
    highlights: ['White Label', 'Multi-Branch'],
  },
};

export default function ProvisionPage() {
  const [step, setStep] = useState(0);
  const [subStep, setSubStep] = useState<'select' | 'preview'>('select');
  const [form, setForm] = useState<FormData>(emptyForm);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [provisioningStep, setProvisioningStep] = useState(0);
  const [provisioningMessage, setProvisioningMessage] = useState('');
  const [completedProvisionSteps, setCompletedProvisionSteps] = useState<string[]>([]);
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmedPreview, setConfirmedPreview] = useState(false);
  const [retryEmail, setRetryEmail] = useState('');
  const [retryPhone, setRetryPhone] = useState('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [mode, setMode] = useState<ProvisionMode>('new_business');
  const [existingTenantId, setExistingTenantId] = useState('');
  const [branchName, setBranchName] = useState('');
  const [ownerCheck, setOwnerCheck] = useState<OwnerCheckResult | null>(null);
  const [checkingOwner, setCheckingOwner] = useState(false);
  const router = useRouter();
  const { addToast } = useToastStore();

  const { data: plansData, isLoading: plansLoading, error: plansError, refetch: refetchPlans } = useQuery({
    queryKey: ['provisioning-plans-v2'],
    queryFn: async () => {
      const data = await adminApi.getProvisionPlans();
      return data;
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  const plans: any[] = Array.isArray(plansData) ? plansData : (plansData?.plans || []);

  const saveDraft = useCallback((data: FormData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, draftId }));
    }
  }, [draftId]);

  const loadDraft = useCallback(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setForm(parsed);
          if (parsed.draftId) setDraftId(parsed.draftId);
        } catch {}
      }
    }
  }, []);

  useEffect(() => { loadDraft(); }, [loadDraft]);
  useEffect(() => { if (step < 5) saveDraft(form); }, [form, step, saveDraft]);
  useEffect(() => { return () => { if (pollingRef.current) clearInterval(pollingRef.current); }; }, []);

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const autoSubdomain = form.restaurantName.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const selectedPlan = plans.find((p: any) => p.id === form.planId);
  const isPaidPlan = selectedPlan && Number(selectedPlan.price) > 0;
  const isFreePlan = selectedPlan && Number(selectedPlan.price) === 0;
  const isEnterprisePlan = selectedPlan?.slug === 'enterprise';
  const isCustomPlan = !!selectedPlan && (selectedPlan.isCustom || (selectedPlan.slug || '').toLowerCase().includes('enterprise') || (selectedPlan.name || '').toLowerCase().includes('custom'));
  const customAmountNum = Number(form.customAmount || '0');
  const isPaidCustomPlan = isCustomPlan && customAmountNum > 0;

  const canNext = () => {
    if (step === 0) return !!mode;
    if (step === 1) {
      if (mode === 'add_branch') return !!existingTenantId;
      return form.restaurantName.trim().length > 0;
    }
    if (step === 2) {
      if (mode === 'add_branch') return branchName.trim().length > 0;
      return form.ownerName.trim().length > 0 && form.ownerEmail.trim().length > 0;
    }
    if (step === 3) return true;
    if (step === 4) {
      if (subStep === 'select') {
        if (!form.planId) return false;
        if (isCustomPlan && !(customAmountNum > 0)) return false;
        return true;
      }
      if (subStep === 'preview') return confirmedPreview;
      return false;
    }
    return false;
  };

  const { mutate: calcPrice, data: calcData } = useMutation({
    mutationFn: (data: { planId: string; couponCode?: string; billingCycle?: string; customAmount?: number }) =>
      adminApi.calculateProvisionPrice(data),
    onSuccess: (data: PricingResult) => setPricing(data),
    onError: () => setPricing(null),
  });

  useEffect(() => {
    if (form.planId) {
      calcPrice({ planId: form.planId, couponCode: form.couponCode || undefined, billingCycle: form.billingCycle, customAmount: isCustomPlan && customAmountNum > 0 ? customAmountNum : undefined });
    }
  }, [form.planId, form.billingCycle, form.couponCode, isCustomPlan, customAmountNum, calcPrice]);

  const handleValidateCoupon = async () => {
    if (!form.couponCode.trim() || !form.planId) return;
    setCouponError(''); setCouponSuccess('');
    try {
      const result: any = await adminApi.validateProvisionCoupon({
        couponCode: form.couponCode.trim(), planId: form.planId, billingCycle: form.billingCycle,
      });
      setCouponSuccess(`Coupon "${result.code}" applied — ₹${result.discountAmount} off`);
      calcPrice({ planId: form.planId, couponCode: form.couponCode, billingCycle: form.billingCycle });
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon');
    }
  };

  const createDraftPayload = () => ({
    restaurantName: form.restaurantName.trim(),
    phone: form.phone, email: form.email,
    address: form.address, city: form.city,
    state: form.state, country: form.country,
    cuisineType: form.cuisineType, gstNumber: form.gstNumber,
    timezone: form.timezone, currency: form.currency,
    subdomain: form.subdomain || autoSubdomain,
    ownerName: form.ownerName.trim(),
    ownerEmail: form.ownerEmail.trim(),
    ownerPhone: form.ownerPhone,
    password: form.autoGeneratePassword ? undefined : form.password,
    autoGenPassword: form.autoGeneratePassword,
    planId: form.planId, billingCycle: form.billingCycle,
    customAmount: isCustomPlan && customAmountNum > 0 ? customAmountNum : undefined,
    couponCode: form.couponCode || undefined,
    mode,
    existingTenantId: mode === 'add_branch' ? existingTenantId : undefined,
    branchName: mode === 'add_branch' ? branchName.trim() : undefined,
  });

  const handleCheckOwner = async (email: string) => {
    if (!email || !email.includes('@')) { setOwnerCheck(null); return; }
    setCheckingOwner(true);
    try {
      const result: OwnerCheckResult = await adminApi.checkOwner(email.trim());
      setOwnerCheck(result);
      if (result.exists && result.owner?.tenants?.length) {
        setExistingTenantId(result.owner.tenants[0].id);
      } else {
        setExistingTenantId('');
      }
    } catch {
      setOwnerCheck(null);
    } finally {
      setCheckingOwner(false);
    }
  };

  const createNewDraft = async () => {
    const draftResult: any = await adminApi.createProvisionDraft(createDraftPayload());
    setDraftId(draftResult.id);
    return draftResult.id as string;
  };

  const loadPreview = async () => {
    try {
      let currentDraftId = draftId;

      if (currentDraftId) {
        try {
          const previewResult: any = await adminApi.previewProvisioning(currentDraftId);
          setPreview(previewResult);
          setSubStep('preview');
          setConfirmedPreview(false);
          return;
        } catch {
          setDraftId(null);
          if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
          currentDraftId = null;
        }
      }

      currentDraftId = await createNewDraft();
      const previewResult: any = await adminApi.previewProvisioning(currentDraftId);
      setPreview(previewResult);
      setSubStep('preview');
      setConfirmedPreview(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to load preview', 'error');
    }
  };

  const startProvisioning = async () => {
    setStep(5);
    setProvisioningStep(0);
    setProvisioningMessage('Initializing...');
    setCompletedProvisionSteps([]);

    try {
      let currentDraftId = draftId;

      if (isPaidPlan || isPaidCustomPlan) {
        setProvisioningMessage('Validating...');
        const validation: any = await adminApi.validatePreProvision(currentDraftId!);
        if (!validation.valid) {
          const emailIssue = validation.issues?.find((i: any) => i.field === 'ownerEmail');
          if (emailIssue) {
            addToast(emailIssue.message, 'error');
            setStep(4); setSubStep('select');
            return;
          }
          const nameIssue = validation.issues?.find((i: any) => i.field === 'restaurantName');
          if (nameIssue) {
            addToast(nameIssue.message, 'error');
            setStep(4); setSubStep('select');
            return;
          }
        }

        setIsProcessingPayment(true);
        setProvisioningMessage('Creating payment order...');

        const orderResult: any = await adminApi.createProvisionPaymentOrder({
          requestId: currentDraftId!, paymentProvider: 'razorpay',
        });

        await loadRazorpayScript();
        setProvisioningMessage('Opening payment gateway...');

        const paymentResponse = await openRazorpayCheckout({
          amount: orderResult.amount,
          currency: orderResult.currency || 'INR',
          name: 'NexaROS',
          description: `${selectedPlan?.name} — ${form.billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly'}`,
          orderId: orderResult.orderId,
          prefill: { name: form.ownerName, email: form.ownerEmail, contact: form.ownerPhone },
        });

        if (!paymentResponse) {
          addToast('Payment cancelled. No restaurant was created.', 'info');
          setStep(4); setSubStep('select');
          setIsProcessingPayment(false);
          return;
        }

        setProvisioningMessage('Verifying payment...');
        await adminApi.verifyProvisionPayment({
          requestId: currentDraftId!,
          paymentOrderId: paymentResponse.razorpay_order_id,
          paymentId: paymentResponse.razorpay_payment_id,
          paymentSignature: paymentResponse.razorpay_signature,
        });

        setIsProcessingPayment(false);
      }

      setProvisioningMessage('Provisioning restaurant...');
      const execResult: any = await adminApi.executeProvisioning({ requestId: currentDraftId! });
      setResult(execResult);
      setProvisioningStep(PROVISIONING_STEPS.length - 1);
      setProvisioningMessage('Done!');
      setCompletedProvisionSteps(PROVISIONING_STEPS.map(s => s.key));
      setStep(6);
      if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
      addToast('Restaurant provisioned successfully!', 'success');
    } catch (err: any) {
      const msg = err.message || 'Provisioning failed';
      setProvisioningMessage(`Failed: ${msg}`);
      const isConflict = msg.toLowerCase().includes('email already exists') || msg.toLowerCase().includes('unique constraint') || msg.toLowerCase().includes('phone');
      const isPaidFailed = (isPaidPlan || isPaidCustomPlan) && draftId;

      if (isPaidFailed) {
        addToast(`Provisioning failed but payment was captured. ${isConflict ? 'Change the owner email/phone and retry — no new payment needed.' : 'Please try again.'}`, 'error');
        setRetryEmail(form.ownerEmail);
        setRetryPhone(form.ownerPhone);
        setStep(7);
      } else {
        addToast(msg, 'error');
        setTimeout(() => { setStep(4); setSubStep('preview'); }, 3000);
      }
    }
  };

  const retryWithUpdatedEmail = async (newEmail: string, newPhone?: string) => {
    if (!draftId) return;
    try {
      setProvisioningMessage('Updating and retrying...');
      const updateData: Record<string, any> = {
        ownerEmail: newEmail,
        email: newEmail,
        ownerName: form.ownerName,
        restaurantName: form.restaurantName,
      };
      if (newPhone !== undefined) updateData.ownerPhone = newPhone;
      await adminApi.updateProvisionDraft(draftId, updateData);
      setForm((prev) => ({ ...prev, ownerEmail: newEmail, email: newEmail, ...(newPhone !== undefined ? { ownerPhone: newPhone } : {}) }));
      setProvisioningStep(0);
      setCompletedProvisionSteps([]);
      setStep(5);
      const execResult: any = await adminApi.executeProvisioning({ requestId: draftId });
      setResult(execResult);
      setProvisioningStep(PROVISIONING_STEPS.length - 1);
      setProvisioningMessage('Done!');
      setCompletedProvisionSteps(PROVISIONING_STEPS.map(s => s.key));
      setStep(6);
      if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
      addToast('Restaurant provisioned successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Retry failed', 'error');
      setProvisioningMessage(`Failed again: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePrint = () => {
    if (!result) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>NexaROS Credentials</title>
    <style>body{font-family:monospace;padding:40px;color:#000}h1{font-size:24px}h3{font-size:14px;text-transform:uppercase;border-bottom:1px solid #ccc;padding-bottom:5px;margin-top:20px}
    .pw{font-size:24px;font-weight:bold;letter-spacing:3px;background:#f5f5f5;border:2px solid #000;padding:15px;text-align:center;margin:10px 0}
    .row{display:flex;justify-content:space-between;padding:4px 0;font-size:14px}
    .label{color:#666}.value{font-weight:bold}
    .note{background:#fffde7;border:1px solid #f0e68c;padding:10px;font-size:12px;margin-top:15px}
    .summary{background:#f0f8ff;border:1px solid #b0d4f1;padding:10px;font-size:12px;margin-top:15px}</style></head><body>
    <h1>NexaROS — Restaurant Credentials</h1>
    <h3>Restaurant</h3>
    <div class="row"><span class="label">Name</span><span class="value">${result.restaurant.name}</span></div>
    <div class="row"><span class="label">ID</span><span class="value">${result.restaurant.id}</span></div>
    <div class="row"><span class="label">Website</span><span class="value">${CUSTOMER_SITE_URL}/${result.restaurant.slug}</span></div>
    <h3>Subscription</h3>
    <div class="row"><span class="label">Plan</span><span class="value">${result.subscription?.plan || 'N/A'}</span></div>
    <div class="row"><span class="label">Status</span><span class="value">${result.subscription?.status || 'N/A'}</span></div>
    <h3>Login Credentials</h3>
    <div class="row"><span class="label">Email</span><span class="value">${result.owner.email}</span></div>
    <div class="pw">${result.owner.password}</div>
    <div class="summary"><strong>Provisioned:</strong> ${result.provisioning.permissions} Permissions, ${result.provisioning.categories} Categories, ${result.provisioning.tables} Tables</div>
    <div class="note"><strong>Keep safe.</strong> Change password after first login.</div></body></html>`);
    w.document.close(); w.print();
  };

  const reset = () => {
    setForm(emptyForm); setResult(null); setPreview(null);
    setDraftId(null); setStep(0); setSubStep('select');
    setPricing(null); setCouponError(''); setCouponSuccess('');
    setProvisioningStep(0); setCompletedProvisionSteps([]);
    setConfirmedPreview(false);
    setMode('new_business'); setExistingTenantId(''); setBranchName('');
    setOwnerCheck(null); setCheckingOwner(false);
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  };

  const getPlanFeatures = (plan: any) => {
    const key = plan.slug?.toLowerCase() || 'default';
    return PLAN_FEATURES[key] || PLAN_FEATURES.default;
  };

  const getPlanIcon = (plan: any) => {
    const slug = plan.slug?.toLowerCase() || '';
    if (slug.includes('enterprise')) return Crown;
    if (slug.includes('professional') || slug.includes('pro')) return Star;
    if (slug.includes('developer') || slug.includes('dev')) return Zap;
    return Sparkles;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-display-lg tracking-tight">Create Restaurant</h1>
        <p className="text-body text-body-lg mt-2 font-body text-ink/60">
          7-step provisioning — create a new business or add a branch to an existing one, with payment before creation, live progress, and full rollback on failure.
        </p>
      </div>
      <div className="h-[2px] w-full bg-ink mb-8" />

      {/* Stepper */}
      <div className="flex items-center gap-1 sm:gap-2 mb-10">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const label = s.id === 2 && mode === 'add_branch' ? 'Branch' : s.label;
          return (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-caption font-bold border-2 transition-all duration-300 ${
                  step > s.id ? 'bg-ink text-canvas border-ink' :
                  step === s.id ? 'bg-ink text-canvas border-ink scale-110 shadow-lg' :
                  'bg-canvas text-ink/40 border-hairline'
                }`}>
                  {step > s.id ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <span className={`text-[10px] sm:text-body-sm font-sans hidden md:inline transition-colors ${
                  step >= s.id ? 'text-ink font-semibold' : 'text-ink/40'
                }`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-[2px] transition-colors duration-500 ${
                  step > s.id ? 'bg-ink' : 'bg-hairline'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 0: Provisioning Type */}
      {/* ═══════════════════════════════════════════════ */}
      {step === 0 && (
        <Card className="p-8 border-2 border-hairline">
          <div className="flex items-center gap-3 mb-6">
            <Building size={24} className="text-ink" />
            <div>
              <h2 className="font-display text-display-sm">What are you setting up?</h2>
              <p className="text-caption font-sans text-ink/50 mt-0.5">Choose how this restaurant should be provisioned</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => setMode('new_business')}
              className={`text-left border-2 p-6 transition-all duration-200 ${mode === 'new_business' ? 'border-ink bg-ink text-canvas shadow-xl' : 'border-hairline hover:border-ink/50 bg-canvas hover:shadow-md'}`}>
              <Building2 size={28} className={mode === 'new_business' ? 'text-canvas' : 'text-ink'} />
              <h3 className={`font-display text-body-lg font-bold mt-3 ${mode === 'new_business' ? 'text-canvas' : 'text-ink'}`}>New Business</h3>
              <p className={`text-caption font-sans mt-1 ${mode === 'new_business' ? 'text-canvas/70' : 'text-ink/50'}`}>
                Create a brand-new restaurant with its own owner account, subscription, and primary branch.
              </p>
              <div className={`mt-4 text-caption font-sans font-semibold flex items-center gap-1 ${mode === 'new_business' ? 'text-canvas' : 'text-ink'}`}>
                Get started <ChevronRight size={12} />
              </div>
            </button>

            <button onClick={() => setMode('add_branch')}
              className={`text-left border-2 p-6 transition-all duration-200 ${mode === 'add_branch' ? 'border-ink bg-ink text-canvas shadow-xl' : 'border-hairline hover:border-ink/50 bg-canvas hover:shadow-md'}`}>
              <GitBranch size={28} className={mode === 'add_branch' ? 'text-canvas' : 'text-ink'} />
              <h3 className={`font-display text-body-lg font-bold mt-3 ${mode === 'add_branch' ? 'text-canvas' : 'text-ink'}`}>Add Branch</h3>
              <p className={`text-caption font-sans mt-1 ${mode === 'add_branch' ? 'text-canvas/70' : 'text-ink/50'}`}>
                Add a new branch/location to an existing business. The owner is linked automatically — no new login needed.
              </p>
              <div className={`mt-4 text-caption font-sans font-semibold flex items-center gap-1 ${mode === 'add_branch' ? 'text-canvas' : 'text-ink'}`}>
                Add to existing <ChevronRight size={12} />
              </div>
            </button>
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 1: Restaurant (or Select Existing for Add Branch) */}
      {/* ═══════════════════════════════════════════════ */}
      {step === 1 && mode === 'add_branch' && (
        <Card className="p-8 border-2 border-hairline">
          <div className="flex items-center gap-3 mb-6">
            <GitBranch size={24} className="text-ink" />
            <div>
              <h2 className="font-display text-display-sm">Select Existing Business</h2>
              <p className="text-caption font-sans text-ink/50 mt-0.5">Enter the owner's email to find their businesses</p>
            </div>
          </div>
          <div className="space-y-5">
            <Input label="Owner Email *" type="email" placeholder="owner@business.com" value={form.ownerEmail}
              onChange={(e) => { set('ownerEmail', e.target.value); handleCheckOwner(e.target.value); }} required />
            {checkingOwner && (
              <div className="flex items-center gap-2 text-caption font-sans text-ink/50">
                <Loader2 size={14} className="animate-spin" /> Checking existing businesses...
              </div>
            )}
            {ownerCheck && !ownerCheck.exists && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded">
                <p className="text-body font-sans text-amber-800 font-semibold">No business found for this email</p>
                <p className="text-caption font-sans text-amber-700">
                  This owner doesn't have a business yet. Switch to <strong>New Business</strong> to create one.
                </p>
              </div>
            )}
            {ownerCheck?.exists && ownerCheck.owner?.tenants?.length ? (
              <div className="space-y-2">
                <label className="block text-body-sm font-sans font-semibold text-ink mb-1">Business *</label>
                {ownerCheck.owner.tenants.map((t) => (
                  <button key={t.id} onClick={() => setExistingTenantId(t.id)}
                    className={`w-full text-left border-2 p-4 flex items-center justify-between transition-all ${existingTenantId === t.id ? 'border-ink bg-ink/5' : 'border-hairline hover:border-ink/40'}`}>
                    <div>
                      <p className="font-semibold text-body font-sans text-ink">{t.name}</p>
                      <p className="text-caption font-sans text-ink/50">{t.branches.length} branch(es) · {t.slug}</p>
                    </div>
                    {existingTenantId === t.id && <Check size={18} className="text-ink" />}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 1: Restaurant (New Business) */}
      {/* ═══════════════════════════════════════════════ */}
      {step === 1 && mode === 'new_business' && (
        <Card className="p-8 border-2 border-hairline">
          <div className="flex items-center gap-3 mb-6">
            <Building2 size={24} className="text-ink" />
            <div>
              <h2 className="font-display text-display-sm">Restaurant Details</h2>
              <p className="text-caption font-sans text-ink/50 mt-0.5">Basic information about the restaurant</p>
            </div>
          </div>
          <div className="space-y-5">
            <Input label="Restaurant Name *" placeholder="e.g. Royal Kitchen" value={form.restaurantName}
              onChange={(e) => set('restaurantName', e.target.value)} required />
            {autoSubdomain && (
              <div className="bg-canvas-soft p-3 border border-hairline flex items-center gap-2">
                <Globe size={14} className="text-ink/40" />
                <span className="text-caption font-sans text-ink/60">
                  Website: <span className="font-mono font-semibold text-ink">{CUSTOMER_SITE_URL}/{autoSubdomain}</span>
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="Phone" type="tel" placeholder="9876543210" value={form.phone}
                onChange={(e) => set('phone', e.target.value)} />
              <Input label="Email" type="email" placeholder="info@restaurant.com" value={form.email}
                onChange={(e) => set('email', e.target.value)} />
            </div>
            <Input label="Address" placeholder="123 MG Road, near City Mall" value={form.address}
              onChange={(e) => set('address', e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="City" placeholder="Bangalore" value={form.city}
                onChange={(e) => set('city', e.target.value)} />
              <div>
                <label className="block text-body-sm font-sans font-semibold text-ink mb-2">State</label>
                <select className="w-full h-10 px-3 border-2 border-ink bg-canvas text-body font-sans focus:outline-none"
                  value={form.state} onChange={(e) => set('state', e.target.value)}>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-body-sm font-sans font-semibold text-ink mb-2">Cuisine Type</label>
                <select className="w-full h-10 px-3 border-2 border-ink bg-canvas text-body font-sans focus:outline-none"
                  value={form.cuisineType} onChange={(e) => set('cuisineType', e.target.value)}>
                  <option value="">Select cuisine</option>
                  {CUISINE_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input label="GST Number" placeholder="Optional" value={form.gstNumber}
                onChange={(e) => set('gstNumber', e.target.value)} />
            </div>
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 2: Owner (New Business) OR Branch Details (Add Branch) */}
      {/* ═══════════════════════════════════════════════ */}
      {step === 2 && mode === 'add_branch' && (
        <Card className="p-8 border-2 border-hairline">
          <div className="flex items-center gap-3 mb-6">
            <GitBranch size={24} className="text-ink" />
            <div>
              <h2 className="font-display text-display-sm">New Branch Details</h2>
              <p className="text-caption font-sans text-ink/50 mt-0.5">
                This branch will be added to <span className="font-semibold text-ink">{ownerCheck?.owner?.tenants?.find(t => t.id === existingTenantId)?.name || 'the selected business'}</span>
              </p>
            </div>
          </div>
          <div className="space-y-5">
            <Input label="Branch Name *" placeholder="e.g. Royal Kitchen — Indiranagar" value={branchName}
              onChange={(e) => setBranchName(e.target.value)} required />
            <Input label="Branch Address" placeholder="123 MG Road, near City Mall" value={form.address}
              onChange={(e) => set('address', e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="City" placeholder="Bangalore" value={form.city}
                onChange={(e) => set('city', e.target.value)} />
              <div>
                <label className="block text-body-sm font-sans font-semibold text-ink mb-2">State</label>
                <select className="w-full h-10 px-3 border-2 border-ink bg-canvas text-body font-sans focus:outline-none"
                  value={form.state} onChange={(e) => set('state', e.target.value)}>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-canvas-soft p-4 border border-hairline">
              <p className="text-caption font-sans text-ink/60">
                The existing owner <span className="font-semibold text-ink">{form.ownerEmail}</span> will be automatically linked to this branch as OWNER. No new account or password is required.
              </p>
            </div>
          </div>
        </Card>
      )}

      {step === 2 && mode === 'new_business' && (
        <Card className="p-8 border-2 border-hairline">
          <div className="flex items-center gap-3 mb-6">
            <User size={24} className="text-ink" />
            <div>
              <h2 className="font-display text-display-sm">Owner Account</h2>
              <p className="text-caption font-sans text-ink/50 mt-0.5">Primary administrator for this restaurant</p>
            </div>
          </div>
          <div className="space-y-5">
            <Input label="Owner Full Name *" placeholder="Ravi Kumar" value={form.ownerName}
              onChange={(e) => set('ownerName', e.target.value)} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="Owner Email *" type="email" placeholder="ravi@gmail.com" value={form.ownerEmail}
                onChange={(e) => set('ownerEmail', e.target.value)} required />
              <Input label="Owner Phone" type="tel" placeholder="9876543210" value={form.ownerPhone}
                onChange={(e) => set('ownerPhone', e.target.value)} />
            </div>
            <div className="border-2 border-hairline p-5">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input type="checkbox" className="w-4 h-4 border-2 border-ink accent-ink"
                  checked={form.autoGeneratePassword} onChange={(e) => set('autoGeneratePassword', e.target.checked)} />
                <span className="text-body-sm font-sans font-semibold text-ink">Auto-generate password (recommended)</span>
              </label>
              {!form.autoGeneratePassword && (
                <Input label="Set Password" type="password" placeholder="Strong password" value={form.password}
                  onChange={(e) => set('password', e.target.value)} />
              )}
              {form.autoGeneratePassword && (
                <p className="text-caption font-sans text-ink/50">A strong 12-character password will be generated.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 3: Settings */}
      {/* ═══════════════════════════════════════════════ */}
      {step === 3 && (
        <Card className="p-8 border-2 border-hairline">
          <div className="flex items-center gap-3 mb-6">
            <Settings size={24} className="text-ink" />
            <div>
              <h2 className="font-display text-display-sm">Regional Settings</h2>
              <p className="text-caption font-sans text-ink/50 mt-0.5">Configure timezone, currency, and region</p>
            </div>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-body-sm font-sans font-semibold text-ink mb-2">Country</label>
                <select className="w-full h-10 px-3 border-2 border-ink bg-canvas text-body font-sans focus:outline-none"
                  value={form.country} onChange={(e) => set('country', e.target.value)}>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-body-sm font-sans font-semibold text-ink mb-2">Timezone</label>
                <select className="w-full h-10 px-3 border-2 border-ink bg-canvas text-body font-sans focus:outline-none"
                  value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
                  {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-body-sm font-sans font-semibold text-ink mb-2">Currency</label>
                <select className="w-full h-10 px-3 border-2 border-ink bg-canvas text-body font-sans focus:outline-none"
                  value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>)}
                </select>
              </div>
              <Input label="Custom Subdomain" placeholder={autoSubdomain || 'auto-generated'}
                value={form.subdomain} onChange={(e) => set('subdomain', e.target.value)} />
            </div>
            <div className="bg-canvas-soft p-5 border border-hairline">
              <p className="text-caption font-sans font-semibold text-ink mb-3">Auto-provisioned resources:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  'Tenant + Branch', 'Owner + Staff', '140 Permissions', '6 Roles',
                  'Subscription', 'Website Config', '8 Menu Categories', '10 Tables',
                  '3 Shifts', '3 Membership Tiers', '4 Tax Rates', 'Feature Flags',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-caption font-sans text-ink/60">
                    <Check size={12} className="text-green-600 shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 4: Plan & Payment */}
      {/* ═══════════════════════════════════════════════ */}
      {step === 4 && subStep === 'select' && (
        <div className="space-y-6">
          <Card className="p-8 border-2 border-hairline">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard size={24} className="text-ink" />
              <div>
                <h2 className="font-display text-display-sm">Plan & Payment</h2>
                <p className="text-caption font-sans text-ink/50 mt-0.5">
                  Choose a subscription plan. Free plans begin immediately. Paid plans require successful payment before provisioning.
                </p>
              </div>
            </div>
          </Card>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => set('billingCycle', 'MONTHLY')}
              className={`px-5 py-2.5 text-body-sm font-sans font-semibold border-2 transition-all ${
                form.billingCycle === 'MONTHLY' ? 'border-ink bg-ink text-canvas' : 'border-hairline text-ink hover:border-ink/50'
              }`}>Monthly</button>
            <button onClick={() => set('billingCycle', 'YEARLY')}
              className={`px-5 py-2.5 text-body-sm font-sans font-semibold border-2 transition-all relative ${
                form.billingCycle === 'YEARLY' ? 'border-ink bg-ink text-canvas' : 'border-hairline text-ink hover:border-ink/50'
              }`}>
              Yearly
              <span className="absolute -top-2.5 -right-2 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">SAVE 20%</span>
            </button>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((plan: any) => {
              const price = form.billingCycle === 'YEARLY' && Number(plan.price) > 0
                ? Math.round(Number(plan.price) * 10) : Number(plan.price);
              const monthlyEquiv = form.billingCycle === 'YEARLY' && Number(plan.price) > 0
                ? Number(plan.price) : null;
              const isSelected = form.planId === plan.id;
              const PlanIcon = getPlanIcon(plan);
              const { features, highlights } = getPlanFeatures(plan);
              const isFree = Number(plan.price) === 0;
              const isEnt = plan.slug?.toLowerCase().includes('enterprise');

              return (
                <button key={plan.id} onClick={() => set('planId', plan.id)}
                  className={`text-left border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-ink bg-ink text-canvas ring-2 ring-ink ring-offset-2 shadow-xl scale-[1.02]'
                      : 'border-hairline hover:border-ink/50 bg-canvas hover:shadow-md'
                  }`}>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <PlanIcon size={20} className={isSelected ? 'text-canvas' : 'text-ink'} />
                        <div>
                          <h3 className={`font-display text-body-lg font-bold ${isSelected ? 'text-canvas' : 'text-ink'}`}>{plan.name}</h3>
                          {isFree && <span className="text-[10px] font-sans font-bold bg-green-500 text-white px-1.5 py-0.5 rounded">FREE</span>}
                          {isEnt && <span className="text-[10px] font-sans font-bold bg-purple-500 text-white px-1.5 py-0.5 rounded ml-1">CUSTOM</span>}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-canvas text-ink flex items-center justify-center">
                          <Check size={14} />
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      {isEnt ? (
                        <div>
                          <span className={`font-display text-xl font-bold ${isSelected ? 'text-canvas' : 'text-ink'}`}>Custom Pricing</span>
                          <p className={`text-caption font-sans ${isSelected ? 'text-canvas/70' : 'text-ink/50'}`}>Contact Sales</p>
                        </div>
                      ) : (
                        <div>
                          <span className={`font-display text-2xl font-bold ${isSelected ? 'text-canvas' : 'text-ink'}`}>
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                          <span className={`text-body-sm font-sans ${isSelected ? 'text-canvas/70' : 'text-ink/50'}`}>
                            /{form.billingCycle === 'YEARLY' ? 'yr' : 'mo'}
                          </span>
                          {monthlyEquiv && (
                            <p className={`text-caption font-sans ${isSelected ? 'text-canvas/60' : 'text-ink/40'}`}>
                              ₹{monthlyEquiv.toLocaleString('en-IN')}/mo equivalent
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <p className={`text-caption font-sans mb-3 ${isSelected ? 'text-canvas/60' : 'text-ink/50'}`}>
                      {plan.trialDays}-Day Trial • {plan.maxBranches === 1 ? '1 Branch' : `${plan.maxBranches} Branches`} • {plan.maxStaff} Staff
                    </p>

                    <div className="space-y-1.5">
                      {features.slice(0, 5).map((f) => (
                        <div key={f} className="flex items-center gap-1.5">
                          <Check size={12} className={isSelected ? 'text-canvas/80' : 'text-green-600'} />
                          <span className={`text-caption font-sans ${isSelected ? 'text-canvas/80' : 'text-ink/70'}`}>{f}</span>
                          {highlights.includes(f) && (
                            <span className={`text-[9px] font-bold px-1 ${isSelected ? 'bg-canvas/20 text-canvas' : 'bg-ink/10 text-ink'}`}>PRO</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={`px-5 py-3 border-t ${isSelected ? 'border-canvas/20' : 'border-hairline'}`}>
                    <span className={`text-caption font-sans font-semibold flex items-center gap-1 ${
                      isSelected ? 'text-canvas' : 'text-ink'
                    }`}>
                      {isSelected ? 'Selected' : 'Select'} <ChevronRight size={12} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom / Enterprise Plan — enter the negotiated price */}
          {isCustomPlan && (
            <Card className="p-6 border-2 border-hairline">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={18} className="text-ink" />
                <h3 className="font-display text-body-lg font-bold text-ink">Custom Plan Pricing</h3>
              </div>
              <p className="text-caption font-sans text-body mb-4">
                As the platform owner, enter the agreed amount for this restaurant. Payment is collected via Razorpay before the restaurant is created.
              </p>
              <div className="max-w-xs">
                <label className="block text-caption font-sans font-semibold text-ink mb-1.5">Subscription Amount (₹)</label>
                <Input
                  type="number"
                  min={1}
                  value={form.customAmount}
                  onChange={(e) => set('customAmount', e.target.value)}
                  placeholder="e.g. 25000"
                />
                {isPaidCustomPlan && (
                  <p className="text-caption font-sans text-body mt-2">
                    ₹{customAmountNum.toLocaleString('en-IN')} will be charged via Razorpay ({form.billingCycle === 'YEARLY' ? 'yearly' : 'monthly'}).
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Loading State */}
          {plans.length === 0 && plansLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border-2 border-hairline p-5">
                  <div className="skeleton h-6 w-24 mb-4" />
                  <div className="skeleton h-10 w-32 mb-3" />
                  <div className="skeleton h-3 w-full mb-2" />
                  <div className="skeleton h-3 w-3/4 mb-2" />
                  <div className="skeleton h-3 w-2/3 mb-2" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {plans.length === 0 && !plansLoading && plansError && (
            <Card className="p-10 text-center">
              <AlertCircle size={32} className="mx-auto mb-4 text-danger" />
              <p className="text-body font-sans font-bold text-ink mb-2">Unable to load plans</p>
              <p className="text-caption font-sans text-body mb-6 max-w-md mx-auto">
                The backend server is not responding. Please ensure the backend is running on port 4000, then try again.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" onClick={() => refetchPlans()} className="gap-2">
                  <RotateCcw size={14} /> Retry Connection
                </Button>
                <Button variant="outline" onClick={() => addToast('Backend needs to be running on localhost:4000', 'info')}>
                  Check Backend
                </Button>
              </div>
            </Card>
          )}

          {/* Empty State (API returned but no plans configured) */}
          {plans.length === 0 && !plansLoading && !plansError && (
            <Card className="p-10 text-center">
              <CreditCard size={32} className="mx-auto mb-4 text-body" />
              <p className="text-body font-sans font-bold text-ink mb-2">No plans available</p>
              <p className="text-caption font-sans text-body mb-4">
                Subscription plans have not been configured yet. Please seed plans in the database.
              </p>
            </Card>
          )}

          {/* Coupon */}
          {form.planId && !isEnterprisePlan && (
            <Card className="p-5 border-2 border-hairline">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={16} className="text-ink" />
                <span className="text-body-sm font-sans font-semibold">Have a coupon?</span>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Enter coupon code" value={form.couponCode}
                  onChange={(e) => { set('couponCode', e.target.value.toUpperCase()); setCouponError(''); setCouponSuccess(''); }} />
                <Button variant="outline" onClick={handleValidateCoupon} className="shrink-0">Apply</Button>
              </div>
              {couponError && <p className="text-caption font-sans text-red-600 flex items-center gap-1 mt-2"><AlertCircle size={14} /> {couponError}</p>}
              {couponSuccess && <p className="text-caption font-sans text-green-600 flex items-center gap-1 mt-2"><CheckCircle2 size={14} /> {couponSuccess}</p>}
            </Card>
          )}

          {/* Pricing Summary */}
          {pricing && form.planId && (
            <Card className="p-6 border-2 border-ink">
              <h3 className="text-body-sm font-sans font-bold flex items-center gap-2 mb-4">
                <Calculator size={16} /> Order Summary
              </h3>
              <div className="space-y-3 text-body font-sans">
                <div className="flex justify-between">
                  <span className="text-ink/70">{pricing.plan.name} ({pricing.plan.billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly'})</span>
                  <span className="font-semibold">₹{pricing.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1"><Percent size={14} /> Coupon: {pricing.couponCode}</span>
                    <span className="font-semibold">-₹{pricing.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink/60">
                  <span>GST ({pricing.taxRate}%)</span>
                  <span className="font-semibold">₹{pricing.taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-[2px] w-full bg-ink" />
                <div className="flex justify-between text-body-lg font-bold">
                  <span>Total</span>
                  <span>{pricing.totalAmount === 0 ? 'Free' : `₹${pricing.totalAmount.toLocaleString('en-IN')}`}</span>
                </div>
                {pricing.savingsPercent > 0 && (
                  <p className="text-caption font-sans text-green-600 font-semibold flex items-center gap-1">
                    <Sparkles size={14} /> You save {pricing.savingsPercent}% with yearly billing!
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Free Plan Notice */}
          {isFreePlan && form.planId && (
            <Card className="p-5 border-2 border-green-300 bg-green-50">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-green-600" />
                <div>
                  <p className="text-body font-sans font-semibold text-green-800">No payment required</p>
                  <p className="text-caption font-sans text-green-600">This restaurant will start on a free trial. Continue to provisioning preview.</p>
                </div>
              </div>
            </Card>
          )}

          {/* Enterprise CTA (only when no custom amount entered yet) */}
          {isEnterprisePlan && form.planId && !isPaidCustomPlan && (
            <Card className="p-5 border-2 border-purple-300 bg-purple-50">
              <div className="flex items-center gap-3">
                <Crown size={20} className="text-purple-600" />
                <div>
                  <p className="text-body font-sans font-semibold text-purple-800">Enterprise — Custom Pricing</p>
                  <p className="text-caption font-sans text-purple-600">Contact our sales team for a custom quote tailored to your needs.</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 4b: Provisioning Preview */}
      {/* ═══════════════════════════════════════════════ */}
      {step === 4 && subStep === 'preview' && preview && (
        <div className="space-y-6">
          <Card className="p-8 border-2 border-ink">
            <div className="flex items-center gap-3 mb-6">
              <Eye size={24} className="text-ink" />
              <div>
                <h2 className="font-display text-display-sm">Provisioning Preview</h2>
                <p className="text-caption font-sans text-ink/50 mt-0.5">
                  Review all details before provisioning. No resources will be created until you confirm.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Restaurant */}
              <div className="space-y-3">
                <h3 className="text-caption font-sans font-bold tracking-wider uppercase text-ink/60 flex items-center gap-2">
                  <Building2 size={14} /> Restaurant
                </h3>
                <div className="space-y-1.5 text-body font-sans">
                  <p><span className="text-ink/50">Name:</span> <span className="font-semibold">{preview.restaurant.name}</span></p>
                  <p><span className="text-ink/50">URL:</span> <span className="font-semibold font-mono text-body-sm">{preview.restaurant.subdomain}</span></p>
                  <p><span className="text-ink/50">City:</span> <span className="font-semibold">{preview.restaurant.city}</span></p>
                  <p><span className="text-ink/50">Country:</span> <span className="font-semibold">{preview.restaurant.country}</span></p>
                  <p><span className="text-ink/50">Cuisine:</span> <span className="font-semibold">{preview.restaurant.cuisineType}</span></p>
                  <p><span className="text-ink/50">Timezone:</span> <span className="font-semibold">{preview.restaurant.timezone}</span></p>
                </div>
              </div>

              {/* Owner */}
              <div className="space-y-3">
                <h3 className="text-caption font-sans font-bold tracking-wider uppercase text-ink/60 flex items-center gap-2">
                  <User size={14} /> Owner
                </h3>
                <div className="space-y-1.5 text-body font-sans">
                  <p><span className="text-ink/50">Name:</span> <span className="font-semibold">{preview.owner.name}</span></p>
                  <p><span className="text-ink/50">Email:</span> <span className="font-semibold">{preview.owner.email}</span></p>
                  <p><span className="text-ink/50">Phone:</span> <span className="font-semibold">{preview.owner.phone}</span></p>
                </div>
              </div>

              {/* Subscription */}
              <div className="space-y-3">
                <h3 className="text-caption font-sans font-bold tracking-wider uppercase text-ink/60 flex items-center gap-2">
                  <CreditCard size={14} /> Subscription
                </h3>
                <div className="space-y-1.5 text-body font-sans">
                  <p><span className="text-ink/50">Plan:</span> <span className="font-semibold">{preview.subscription.plan}</span></p>
                  <p><span className="text-ink/50">Cycle:</span> <span className="font-semibold">{preview.subscription.billingCycle}</span></p>
                  <p><span className="text-ink/50">Status:</span> <span className="font-semibold">{preview.subscription.status}</span></p>
                  <p><span className="text-ink/50">Trial:</span> <span className="font-semibold">{preview.subscription.trialDays} days</span></p>
                  <p><span className="text-ink/50">Expires:</span> <span className="font-semibold">{new Date(preview.subscription.trialEndsAt).toLocaleDateString('en-IN')}</span></p>
                </div>
              </div>

              {/* Payment */}
              <div className="space-y-3">
                <h3 className="text-caption font-sans font-bold tracking-wider uppercase text-ink/60 flex items-center gap-2">
                  <Wallet size={14} /> Payment
                </h3>
                <div className="space-y-1.5 text-body font-sans">
                  <p><span className="text-ink/50">Required:</span> <span className="font-semibold">{preview.payment.required ? 'Yes' : 'No (Free Plan)'}</span></p>
                  {preview.payment.required && (
                    <>
                      <p><span className="text-ink/50">Status:</span> <span className="font-semibold text-green-600">{preview.payment.status}</span></p>
                      <p><span className="text-ink/50">Amount:</span> <span className="font-semibold">₹{preview.payment.amount.toLocaleString('en-IN')}</span></p>
                      <p><span className="text-ink/50">Provider:</span> <span className="font-semibold capitalize">{preview.payment.provider}</span></p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="h-[2px] w-full bg-hairline my-6" />

            {/* Enabled Modules */}
            <h3 className="text-caption font-sans font-bold tracking-wider uppercase text-ink/60 mb-3 flex items-center gap-2">
              <Zap size={14} /> Enabled Modules ({preview.moduleCount})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {Object.entries(preview.modules).filter(([, v]) => v).map(([key]) => (
                <div key={key} className="flex items-center gap-1.5 text-caption font-sans text-ink/70 bg-canvas-soft px-2 py-1">
                  <Check size={10} className="text-green-600 shrink-0" /> {key}
                </div>
              ))}
            </div>

            {/* Resources */}
            <h3 className="text-caption font-sans font-bold tracking-wider uppercase text-ink/60 mb-3 flex items-center gap-2">
              <Shield size={14} /> Resources to Provision
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Permissions', value: preview.resources.permissions },
                { label: 'Roles', value: preview.resources.roles },
                { label: 'Categories', value: preview.resources.categories },
                { label: 'Tables', value: preview.resources.tables },
                { label: 'Shifts', value: preview.resources.shifts },
                { label: 'Membership Tiers', value: preview.resources.membershipTiers },
                { label: 'Tax Rates', value: preview.resources.taxRates },
                { label: 'Feature Flags', value: preview.resources.featureFlags },
                { label: 'Settings', value: preview.resources.settings },
              ].map((r) => (
                <div key={r.label} className="bg-canvas-soft p-3 border border-hairline text-center">
                  <div className="font-display text-body-lg font-bold text-ink">{r.value}</div>
                  <div className="text-[10px] font-sans text-ink/50 uppercase tracking-wider">{r.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-canvas-soft p-3 border border-hairline flex items-center gap-2 text-caption font-sans text-ink/60 mb-6">
              <Clock size={14} /> Estimated provisioning time: <span className="font-semibold text-ink">{preview.estimatedTime}</span>
            </div>

            {/* Confirmation */}
            <div className="border-2 border-ink p-5 bg-canvas-secondary">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 mt-0.5 border-2 border-ink accent-ink"
                  checked={confirmedPreview} onChange={(e) => setConfirmedPreview(e.target.checked)} />
                <div>
                  <span className="text-body font-sans font-semibold text-ink block">
                    I confirm these details are correct.
                  </span>
                  <span className="text-caption font-sans text-ink/50">
                    This will {preview.payment.required && preview.payment.status !== 'CAPTURED' ? 'initiate payment and ' : ''}create the restaurant and all resources atomically.
                    {preview.payment.required && preview.payment.status === 'CAPTURED' ? ' Payment has already been verified.' : ''}
                  </span>
                </div>
              </label>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 5: Live Provisioning */}
      {/* ═══════════════════════════════════════════════ */}
      {step === 5 && (
        <Card className="p-8 border-2 border-ink">
          <div className="flex items-center gap-3 mb-6">
            <Rocket size={24} className="text-ink animate-pulse" />
            <div>
              <h2 className="font-display text-display-sm">
                {isProcessingPayment ? 'Processing Payment...' : 'Provisioning Restaurant...'}
              </h2>
              <p className="text-caption font-sans text-ink/50 mt-0.5">
                {isProcessingPayment
                  ? 'Please complete the payment in the gateway window.'
                  : 'Creating all resources atomically. This will take ~15 seconds.'}
              </p>
            </div>
          </div>

          {isProcessingPayment && (
            <div className="bg-canvas-soft p-4 border border-hairline mb-6 flex items-center gap-3">
              <Loader2 size={20} className="animate-spin text-ink" />
              <span className="text-body font-sans">{provisioningMessage}</span>
            </div>
          )}

          <div className="space-y-1">
            {PROVISIONING_STEPS.map((s, i) => {
              const StepIcon = s.icon;
              const isCompleted = completedProvisionSteps.includes(s.key);
              const isCurrent = !isCompleted && (provisioningMessage.toLowerCase().includes(s.key) ||
                (i === provisioningStep && !isCompleted));
              const isFailed = provisioningMessage.startsWith('Failed') && i === provisioningStep;

              return (
                <div key={s.key}
                  className={`flex items-center gap-3 p-3 rounded transition-all duration-300 ${
                    isCompleted ? 'bg-green-50' :
                    isCurrent ? 'bg-canvas-soft border-l-4 border-ink' :
                    isFailed ? 'bg-red-50 border-l-4 border-red-500' :
                    'opacity-30'
                  }`}>
                  <div className={`w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded transition-all ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-ink text-canvas' :
                    'bg-hairline text-ink/40'
                  }`}>
                    {isCompleted ? <Check size={12} /> : <StepIcon size={12} />}
                  </div>
                  <span className={`text-body font-sans flex-1 ${
                    isCompleted ? 'text-green-700' :
                    isCurrent ? 'text-ink font-semibold' :
                    'text-ink/40'
                  }`}>{s.label}</span>
                  {isCurrent && !isCompleted && <Loader2 size={14} className="animate-spin text-ink" />}
                  {isCompleted && <span className="text-[10px] font-sans font-bold text-green-600 uppercase">Done</span>}
                </div>
              );
            })}
          </div>

          {provisioningMessage.startsWith('Failed') && (
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={16} className="text-red-600" />
                <p className="text-body font-sans text-red-700 font-semibold">Provisioning Failed</p>
              </div>
              <p className="text-caption font-sans text-red-600">{provisioningMessage}</p>
              <p className="text-caption font-sans text-red-500 mt-2">Redirecting back in 3 seconds...</p>
            </div>
          )}
        </Card>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 6: Success */}
      {/* ═══════════════════════════════════════════════ */}
      {step === 6 && result && (
        <div className="space-y-6">
          <Card className="p-8 border-2 border-ink">
            <div className="flex items-center gap-3 mb-6">
              <PartyPopper size={28} className="text-ink" />
              <div>
                <h2 className="font-display text-display-sm">Restaurant Created Successfully!</h2>
                <p className="text-caption font-sans text-ink/50 mt-0.5">
                  ID: <span className="font-mono">{result.restaurant.id}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-caption font-sans font-bold tracking-wider uppercase text-ink/60 mb-3 flex items-center gap-2">
                    <Building2 size={14} /> Restaurant
                  </h3>
                  <div className="space-y-1.5 text-body font-sans">
                    <p><span className="text-ink/50">Name:</span> <span className="font-semibold">{result.restaurant.name}</span></p>
                    <p><span className="text-ink/50">Slug:</span> <span className="font-mono text-body-sm">{result.restaurant.slug}</span></p>
                    <p><span className="text-ink/50">Website:</span> <span className="font-mono text-body-sm">{CUSTOMER_SITE_URL}/{result.restaurant.slug}</span></p>
                    {result.restaurant.city && <p><span className="text-ink/50">City:</span> <span className="font-semibold">{result.restaurant.city}</span></p>}
                    <p><span className="text-ink/50">Timezone:</span> <span className="font-semibold">{result.restaurant.timezone}</span></p>
                    <p><span className="text-ink/50">Currency:</span> <span className="font-semibold">{result.restaurant.currency}</span></p>
                  </div>
                </div>

                <div>
                  <h3 className="text-caption font-sans font-bold tracking-wider uppercase text-ink/60 mb-3 flex items-center gap-2">
                    <CreditCard size={14} /> Subscription
                  </h3>
                  <div className="space-y-1.5 text-body font-sans">
                    {result.subscription && (
                      <>
                        <p><span className="text-ink/50">Plan:</span> <span className="font-semibold">{result.subscription.plan}</span></p>
                        <p><span className="text-ink/50">Status:</span>
                          <span className={`font-semibold ml-1 ${result.subscription.status === 'TRIAL' ? 'text-blue-600' : 'text-green-600'}`}>
                            {result.subscription.status}
                          </span>
                        </p>
                        <p><span className="text-ink/50">Trial Ends:</span> <span className="font-semibold">{new Date(result.subscription.trialEndsAt).toLocaleDateString('en-IN')}</span></p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-caption font-sans font-bold tracking-wider uppercase text-ink/60 mb-3 flex items-center gap-2">
                    <Shield size={14} /> Provisioned Resources
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Permissions', val: result.provisioning.permissions },
                      { label: 'Feature Flags', val: result.provisioning.featureFlags },
                      { label: 'Settings', val: result.provisioning.settings },
                      { label: 'Tax Rates', val: result.provisioning.taxSettings },
                      { label: 'Membership Tiers', val: result.provisioning.membershipTiers },
                      { label: 'Shifts', val: result.provisioning.shifts },
                      { label: 'Categories', val: result.provisioning.categories },
                      { label: 'Tables', val: result.provisioning.tables },
                    ].map((r) => (
                      <div key={r.label} className="bg-canvas-soft px-3 py-2 border border-hairline">
                        <span className="font-display text-body-lg font-bold">{r.val}</span>
                        <span className="text-[10px] font-sans text-ink/50 block">{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[2px] w-full bg-hairline my-6" />

            {mode === 'add_branch' ? (
              <div className="bg-canvas-soft p-6 border-2 border-ink">
                <div className="flex items-center gap-3 mb-2">
                  <GitBranch size={20} className="text-ink" />
                  <h3 className="text-caption font-sans font-bold tracking-wider uppercase text-ink/60">Branch Added</h3>
                </div>
                <p className="text-body font-sans text-ink/70">
                  The new branch <span className="font-semibold text-ink">{result.branch.name}</span> was added to{' '}
                  <span className="font-semibold text-ink">{result.restaurant.name}</span>.
                  The existing owner <span className="font-mono text-body-sm">{result.owner?.email || form.ownerEmail}</span> has been linked to this branch automatically and can manage it using their existing login.
                </p>
              </div>
            ) : (
              <>
            <h3 className="text-caption font-sans font-bold tracking-wider uppercase text-ink/60 mb-4 flex items-center gap-2">
              <Lock size={14} /> Login Credentials
            </h3>
            <div className="bg-canvas-secondary p-6 border-2 border-ink">
              <div className="space-y-3">
                {[
                  { label: 'Email', value: result.owner.email, key: 'email' },
                  { label: 'Password', value: result.owner.password, key: 'password', bold: true },
                  { label: 'Website', value: `${CUSTOMER_SITE_URL}/${result.restaurant.slug}`, key: 'url' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-body font-sans text-ink/60">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono ${item.bold ? 'font-bold text-body-lg tracking-wider' : 'font-semibold text-body-sm'}`}>{item.value}</span>
                      <button onClick={() => copyToClipboard(item.value, item.key)}
                        className="p-1 hover:bg-ink hover:text-canvas transition-colors rounded">
                        <Copy size={14} />
                      </button>
                      {copied === item.key && <span className="text-[10px] font-sans text-green-600">Copied!</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
              </>
            )}
          </Card>

          <div className="flex items-center gap-3 flex-wrap">
            {mode === 'new_business' && (
              <Button onClick={handlePrint} className="gap-2">
                <Printer size={16} /> Print Credentials
              </Button>
            )}
            {mode === 'new_business' && (
              <Button variant="outline" onClick={() => copyToClipboard(
                `NexaROS Login\nRestaurant: ${result.restaurant.name}\nWebsite: ${CUSTOMER_SITE_URL}/${result.restaurant.slug}\nEmail: ${result.owner.email}\nPassword: ${result.owner.password}`,
                'all'
              )} className="gap-2">
                <Copy size={16} /> {copied === 'all' ? 'Copied!' : 'Copy All'}
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push('/tenants')} className="gap-2">
              <ExternalLink size={16} /> Open Restaurants
            </Button>
            <Button variant="ghost" onClick={reset} className="gap-2 ml-auto">
              <RotateCcw size={16} /> Create Another
            </Button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 7: Retry After Payment (Email Conflict) */}
      {/* ═══════════════════════════════════════════════ */}
      {step === 7 && (
        <Card className="p-8 border-2 border-amber-400">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle size={28} className="text-amber-600" />
            <div>
              <h2 className="font-display text-display-sm">Payment Captured — Provisioning Failed</h2>
              <p className="text-caption font-sans text-ink/50 mt-0.5">
                {pricing ? `Your payment of ₹${pricing.totalAmount.toLocaleString('en-IN')} was successful but the restaurant could not be created.` : 'Your payment was captured successfully but the restaurant could not be created.'}
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded mb-6">
            <p className="text-body font-sans text-amber-800 font-semibold mb-1">
              The owner email <span className="font-mono">{form.ownerEmail}</span> is already registered.
            </p>
            <p className="text-caption font-sans text-amber-700">
              Change the email below and retry — <strong>no additional payment needed</strong>.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-caption font-sans font-bold tracking-wider uppercase text-ink/60 block mb-2">New Owner Email</label>
              <input
                type="email"
                value={retryEmail}
                onChange={(e) => setRetryEmail(e.target.value)}
                placeholder="Enter a different email address"
                className="w-full px-4 py-3 bg-canvas border border-hairline rounded text-body font-sans focus:outline-none focus:ring-2 focus:ring-ink/20"
              />
            </div>
            <div>
              <label className="text-caption font-sans font-bold tracking-wider uppercase text-ink/60 block mb-2">Owner Phone (leave blank to keep current)</label>
              <input
                type="tel"
                value={retryPhone}
                onChange={(e) => setRetryPhone(e.target.value)}
                placeholder={form.ownerPhone || 'Enter phone number'}
                className="w-full px-4 py-3 bg-canvas border border-hairline rounded text-body font-sans focus:outline-none focus:ring-2 focus:ring-ink/20"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => { if (retryEmail && retryEmail.includes('@')) retryWithUpdatedEmail(retryEmail, retryPhone || undefined); }}
                disabled={!retryEmail || !retryEmail.includes('@') || provisioningMessage.includes('retrying')}
                isLoading={provisioningMessage.includes('retrying')}
                className="gap-2">
                <Rocket size={16} /> Retry Provisioning
              </Button>
              <Button variant="outline" onClick={reset} className="gap-2">
                <RotateCcw size={16} /> Start Over
              </Button>
            </div>
          </div>

          {provisioningMessage.includes('Failed again') && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-caption font-sans text-red-700">{provisioningMessage}</p>
            </div>
          )}
        </Card>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* Navigation */}
      {/* ═══════════════════════════════════════════════ */}
      {step >= 0 && step <= 4 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-hairline">
          <Button variant="ghost" onClick={() => {
            if (step === 0) return;
            if (subStep === 'preview') { setSubStep('select'); }
            else { setStep((s) => s - 1); }
          }} className="gap-2" disabled={step === 0}>
            <ArrowLeft size={16} /> Back
          </Button>

          {step < 4 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="gap-2">
              Next <ArrowRight size={16} />
            </Button>
          ) : subStep === 'select' ? (
            <Button onClick={loadPreview} disabled={!canNext()} className="gap-2">
              {isPaidCustomPlan ? 'Review & Confirm' : isEnterprisePlan ? 'Contact Sales' : 'Review & Confirm'} <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={startProvisioning} disabled={!confirmedPreview || isProcessingPayment}
              isLoading={isProcessingPayment} className="gap-2">
              {isProcessingPayment ? 'Processing...' : (isPaidPlan || isPaidCustomPlan) ? (
                <>Pay & Provision <CreditCard size={16} /></>
              ) : (
                <><Rocket size={16} /> Provision Restaurant</>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
