import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center p-8 rounded-[24px]" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--success-light)' }}>
          <svg className="w-8 h-8" fill="none" stroke="var(--success)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Subscription Activated!</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Your restaurant is now set up with a NexaROS subscription. Download the app and start managing your restaurant today.
        </p>
        <div className="p-4 rounded-[16px] mb-6 text-left" style={{ background: 'var(--accent-light)' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--accent)' }}>Next Steps:</p>
          <ol className="text-sm space-y-1 ml-4 list-decimal" style={{ color: 'var(--accent)' }}>
            <li>Download the NexaROS app on your device</li>
            <li>Login with your email & password</li>
            <li>Set up your menu and tables</li>
            <li>Start taking orders!</li>
          </ol>
        </div>
        <Link href="/" className="inline-block text-sm" style={{ color: 'var(--text-muted)' }}>Back to Home</Link>
      </div>
    </div>
  );
}
