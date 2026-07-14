import { Card } from '@/components/ui';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-6">Terms of Service</h1>
      <Card padding="lg" className="space-y-4 text-body text-sm leading-relaxed">
        <p>Last updated: January 1, 2024</p>
        <h2 className="text-lg font-semibold text-ink">1. Acceptance of Terms</h2>
        <p>By accessing or using Spice Garden&apos;s website and services, you agree to be bound by these Terms of Service.</p>
        <h2 className="text-lg font-semibold text-ink">2. Ordering and Payment</h2>
        <p>All orders are subject to availability and confirmation. Prices are in INR and include applicable taxes. Payment must be made at the time of ordering.</p>
        <h2 className="text-lg font-semibold text-ink">3. Delivery</h2>
        <p>Delivery times are estimates and not guaranteed. We are not responsible for delays caused by factors outside our control.</p>
        <h2 className="text-lg font-semibold text-ink">4. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
        <h2 className="text-lg font-semibold text-ink">5. Intellectual Property</h2>
        <p>All content on this website, including images, text, and logos, is the property of Spice Garden and may not be used without permission.</p>
        <h2 className="text-lg font-semibold text-ink">6. Limitation of Liability</h2>
        <p>Spice Garden shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.</p>
      </Card>
    </div>
  );
}
