import { Card } from '@/components/ui';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-6">Privacy Policy</h1>
      <Card padding="lg" className="space-y-4 text-body text-sm leading-relaxed">
        <p>Last updated: January 1, 2024</p>
        <h2 className="text-lg font-semibold text-ink">1. Information We Collect</h2>
        <p>We collect information you provide directly to us, including your name, email address, phone number, delivery address, and payment information when you place an order or make a reservation.</p>
        <h2 className="text-lg font-semibold text-ink">2. How We Use Your Information</h2>
        <p>We use your information to process orders, send order updates, improve our services, and send promotional offers with your consent.</p>
        <h2 className="text-lg font-semibold text-ink">3. Data Security</h2>
        <p>We implement industry-standard security measures to protect your personal information. All payment transactions are encrypted using SSL technology.</p>
        <h2 className="text-lg font-semibold text-ink">4. Third-Party Services</h2>
        <p>We may share your information with delivery partners, payment processors, and analytics providers to facilitate our services.</p>
        <h2 className="text-lg font-semibold text-ink">5. Your Rights</h2>
        <p>You have the right to access, update, or delete your personal information at any time by contacting us.</p>
        <h2 className="text-lg font-semibold text-ink">6. Contact</h2>
        <p>For privacy-related inquiries, please contact us at hello@spicegarden.com or call +91 1800-123-4567.</p>
      </Card>
    </div>
  );
}
