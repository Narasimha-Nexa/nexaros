import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'NexaROS documentation — guides, API reference, and troubleshooting.',
};

export default function DocsPage() {
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
        <h1 className="text-4xl font-bold mb-6">Documentation</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {sections.map((section) => (
            <div key={section.title} className="p-6 bg-gray-50 rounded-2xl hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-2xl mb-3">{section.icon}</div>
              <h2 className="font-semibold text-lg mb-2">{section.title}</h2>
              <p className="text-sm text-gray-500">{section.desc}</p>
              <ul className="mt-3 space-y-1">
                {section.topics.map((topic) => (
                  <li key={topic} className="text-sm text-blue-600 hover:underline">{topic}</li>
                ))}
              </ul>
            </div>
          ))}
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

const sections = [
  { icon: '🚀', title: 'Getting Started', desc: 'Set up your restaurant in minutes.', topics: ['Installation Guide', 'First-time Setup', 'Adding Menu Items', 'Configuring Printers'] },
  { icon: '📖', title: 'User Guides', desc: 'Learn how to use every feature.', topics: ['POS Basics', 'Order Management', 'Kitchen Display', 'Inventory Management'] },
  { icon: '🔌', title: 'API Reference', desc: 'Integrate and extend NexaROS.', topics: ['Authentication', 'Menu API', 'Orders API', 'WebSocket Events'] },
  { icon: '🛠️', title: 'Troubleshooting', desc: 'Solve common issues.', topics: ['Printer Not Working', 'Sync Issues', 'Payment Errors', 'Login Problems'] },
  { icon: '📦', title: 'Hardware Setup', desc: 'Configure printers and scanners.', topics: ['Printer Installation (ESC/POS)', 'Barcode Scanner Setup', 'Cash Drawer Configuration', 'Network Requirements'] },
  { icon: '❓', title: 'FAQ', desc: 'Frequently asked questions.', topics: ['Pricing & Plans', 'Data Security', 'Multi-Branch Setup', 'Offline Mode'] },
];
