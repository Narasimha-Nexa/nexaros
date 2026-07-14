import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'NexaROS Terms of Service — rules and guidelines for using our restaurant operating system platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <div className="pt-32 pb-20 px-6 max-w-[768px] mx-auto">
        <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] text-sm font-semibold tracking-wide uppercase mb-6" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
          Legal
        </div>
        <h1 className="reveal reveal-delay-1 text-[32px] md:text-[48px] font-extrabold leading-tight mb-2" style={{ color: 'var(--text-primary)' }}>Terms of Service</h1>
        <p className="reveal reveal-delay-2 text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Last updated: July 13, 2026</p>

        <div className="reveal reveal-delay-3 space-y-8">
          {[
            { title: '1. Acceptance of Terms', content: 'By accessing or using NexaROS, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.' },
            { title: '2. Description of Service', content: 'NexaROS is a restaurant operating system that provides POS, order management, kitchen display, inventory management, analytics, and related services. The Service is provided "as is" and "as available."' },
            { title: '3. Account Registration', content: 'You must provide accurate and complete information when registering. You are responsible for maintaining the confidentiality of your account. You must be at least 18 years old to use the Service. One account per restaurant entity.' },
            { title: '4. Acceptable Use', content: 'You agree not to: use the Service for any unlawful purpose; attempt to gain unauthorized access to any part of the Service; interfere with or disrupt the Service or servers; reverse engineer, decompile, or disassemble any part of the Service; use the Service to transmit spam, malware, or other harmful content.' },
            { title: '5. Payment Terms', content: 'Paid plans are billed monthly or annually in advance. All payments are processed through Razorpay. 7-day money-back guarantee on all paid plans. We reserve the right to change pricing with 30 days\' notice.' },
            { title: '6. Data & Intellectual Property', content: 'You retain all rights to your data. We retain all rights to the Service, software, and intellectual property. You grant us a limited license to process your data as necessary to provide the Service.' },
            { title: '7. Limitation of Liability', content: 'To the maximum extent permitted by law, NexaROS shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.' },
            { title: '8. Termination', content: 'You may cancel your account at any time. We may suspend or terminate your access for violation of these Terms. Upon termination, your data will be retained for 30 days and then deleted.' },
            { title: '9. Governing Law', content: 'These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, India.' },
            { title: '10. Changes', content: 'We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.' },
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
