import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about NexaROS — the AI-powered restaurant operating system.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl text-gray-900">NexaROS</span>
          </a>
          <a href="/" className="text-sm text-gray-600 hover:text-gray-900">Back to Home</a>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">About NexaROS</h1>
        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            NexaROS is an AI-powered restaurant operating system designed for modern restaurants of all sizes. 
            From small cafés to multi-branch restaurant chains, NexaROS provides the tools you need to 
            manage every aspect of your business efficiently.
          </p>
          <h2 className="text-2xl font-bold mt-10 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            To make restaurant management accessible, affordable, and intelligent. We believe that technology 
            should empower restaurant owners and staff, not complicate their lives. That&apos;s why NexaROS is 
            built with an offline-first architecture, ensuring you never lose data even when the internet goes down.
          </p>
          <h2 className="text-2xl font-bold mt-10 mb-4">Why Offline-First?</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Restaurants can&apos;t afford downtime. When the internet connection is unstable, your POS, kitchen 
            display, and printers should still work seamlessly. NexaROS stores all critical data locally on 
            your devices and syncs automatically when connectivity returns. This means:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>Orders are never lost — saved instantly to local storage</li>
            <li>KOTs print even without internet</li>
            <li>Payments are recorded offline and synced later</li>
            <li>All devices stay in sync when connectivity returns</li>
          </ul>
          <h2 className="text-2xl font-bold mt-10 mb-4">Built for India</h2>
          <p className="text-gray-600 leading-relaxed">
            NexaROS supports Indian numbering (lakhs/crores), GST invoicing, UPI payments, and multiple 
            Indian languages (Hindi, Kannada, Telugu, Tamil, Malayalam). Your data stays in India-compliant 
            infrastructure.
          </p>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white font-semibold mb-2">NexaROS</p>
          <p className="text-sm">AI-Powered Restaurant Operating System</p>
        </div>
      </footer>
    </div>
  );
}
