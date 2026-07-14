import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'NexaROS Privacy Policy — how we collect, use, and protect your restaurant data. Data stored in India, never shared.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <div className="pt-32 pb-20 px-6 max-w-[768px] mx-auto">
        <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
          Legal
        </div>
        <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-2" style={{ color: 'var(--text-primary)' }}>Privacy Policy</h1>
        <p className="reveal reveal-delay-2 text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Last updated: July 13, 2026</p>

        <div className="reveal reveal-delay-3 space-y-8">
          {[
            { title: '1. Introduction', content: 'NexaROS ("we," "our," or "us") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our restaurant operating system, website, and related services (collectively, the "Service").' },
            { title: '2. Information We Collect', content: 'We collect information you provide directly: Account Information (name, email, phone, restaurant name, business details), Restaurant Data (menu items, orders, customer data, inventory, financial records), Payment Information (billing details processed through Razorpay — we do not store card numbers), and communications you send us (support requests, feedback).' },
            { title: '3. How We Use Your Information', content: 'To provide, maintain, and improve the Service; process transactions and send related information; send technical notices, updates, and security alerts; respond to your comments, questions, and customer service requests; and monitor and analyze usage patterns and trends.' },
            { title: '4. Data Security', content: 'We implement industry-standard security measures including TLS 1.3 encryption, AES-256 encrypted data storage, role-based access controls, multi-factor authentication for admins, and regular security audits. However, no method of transmission over the Internet is 100% secure.' },
            { title: '5. Data Ownership', content: 'You retain ownership of all data you enter into NexaROS. We do not sell, share, or monetize your restaurant data. You can export or delete your data at any time.' },
            { title: '6. Data Storage', content: 'Your data is stored on secure servers in India. We comply with applicable Indian data protection regulations. We retain your data for as long as your account is active or as needed to provide the Service.' },
            { title: '7. Third-Party Services', content: 'We use Razorpay for payment processing. Their use of your information is governed by their own privacy policy. We do not share your data with other third parties except as required by law.' },
            { title: '8. Cookies', content: 'We use essential cookies to maintain your session and authentication. We do not use tracking cookies or share cookie data with advertisers.' },
            { title: '9. Changes to This Policy', content: 'We may update this policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.' },
            { title: '10. Contact Us', content: 'If you have questions about this Privacy Policy, please contact us at privacy@nexaros.com.' },
          ].map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{section.title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{section.content}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
