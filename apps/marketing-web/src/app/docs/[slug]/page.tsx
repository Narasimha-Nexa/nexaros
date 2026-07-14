import type { Metadata } from 'next';
import Link from 'next/link';

const docs: Record<string, { title: string; sections: { heading: string; content: string }[] }> = {
  'getting-started': {
    title: 'Getting Started',
    sections: [
      { heading: 'Installation', content: 'Download NexaROS for your platform from the downloads page. We support Linux (.deb), Windows (.exe), macOS (.dmg), and Android (APK). Install like any regular application.' },
      { heading: 'First Launch', content: 'On first launch, the setup wizard will guide you through: 1) Creating your restaurant profile, 2) Setting up your first branch, 3) Adding menu categories and items, 4) Configuring tables, 5) Setting up printers.' },
      { heading: 'Adding Menu Items', content: 'Go to Menu > Categories to create categories (e.g., Starters, Main Course, Beverages). Then go to Menu > Items to add items under each category. Set price, tax rate, and availability.' },
      { heading: 'Configuring Printers', content: 'Connect your ESC/POS printer via USB or network. Go to Settings > Printers > Add Printer. The app will auto-detect network printers. Assign printers for receipts and KOTs.' },
      { heading: 'Taking Your First Order', content: 'Go to POS, select a table, add items, and confirm the order. The KOT will print automatically at the kitchen printer. Track order status on the Kitchen Display.' },
    ],
  },
  'pos-basics': {
    title: 'POS Basics',
    sections: [
      { heading: 'Creating an Order', content: '1. Select a table from the table grid, 2. Browse menu categories and tap items to add, 3. Adjust quantity or add notes, 4. Confirm the order. The order appears on the kitchen display instantly.' },
      { heading: 'Managing Tables', content: 'The table grid shows real-time status: Green (Free), Orange (Occupied), Blue (Order Ready), Purple (Billing). Tap a table to view its order, add items, or generate the bill.' },
      { heading: 'Processing Payments', content: 'When the customer is ready to pay, tap "Generate Bill" on the table. Choose payment method: Cash, UPI, Card, or Split. For UPI, show the QR code. For cash, the system calculates change.' },
      { heading: 'Split Bills', content: 'Tap "Split Bill" on the table. Choose: Split by Item (each person pays for their items), Split equally, or Custom split (enter amounts).' },
      { heading: 'Hold & Recall Orders', content: 'If a customer wants to delay ordering, tap "Hold" to save the current order. It appears in the Hold section. Tap "Recall" to bring it back.' },
    ],
  },
  'order-management': {
    title: 'Order Management',
    sections: [
      { heading: 'Order Status Flow', content: 'Orders follow this flow: PENDING > CONFIRMED > PREPARING > READY > SERVED > COMPLETED. Each status change is tracked and broadcast in real-time.' },
      { heading: 'Modifying Orders', content: 'You can add items to an order at any stage before COMPLETED. To remove items, long-press the item and select "Remove". Notes can be added to individual items.' },
      { heading: 'Canceling Orders', content: 'Only orders in PENDING or CONFIRMED status can be canceled. Go to the order, tap "Cancel", and select a reason. Cancelled orders are tracked for reporting.' },
      { heading: 'Order Types', content: 'NexaROS supports: Dine-In (table service), Takeaway (packaging), Delivery (third-party or self-delivery), QR Order (customer phone ordering).' },
    ],
  },
  'kitchen-display': {
    title: 'Kitchen Display System',
    sections: [
      { heading: 'Overview', content: 'The Kitchen Display System (KDS) shows orders in real-time on a TV or tablet screen. Orders appear with color coding: Red (new), Yellow (in progress), Green (ready).' },
      { heading: 'Sound Alerts', content: 'When a new order arrives, the KDS plays a sound alert. This ensures kitchen staff never miss an order, even during busy periods.' },
      { heading: 'Timer Tracking', content: 'Each order has a preparation timer. If an order takes longer than the expected prep time, the timer turns red and flashes to alert kitchen staff.' },
      { heading: 'Item-Level Status', content: 'Individual items within an order can be marked as ready. This is useful when some items take longer to prepare than others.' },
    ],
  },
  'inventory-management': {
    title: 'Inventory Management',
    sections: [
      { heading: 'Stock Items', content: 'Create inventory items with name, unit (kg, liters, pieces), current stock, minimum stock level, and cost price. Link inventory items to menu items for auto-deduction.' },
      { heading: 'Stock Movements', content: 'Track all stock changes: Purchase (in), Sale (out), Waste (out), Adjustment (in/out), Transfer (between branches). Every movement is logged with reason and timestamp.' },
      { heading: 'Low Stock Alerts', content: 'When stock falls below the minimum level, NexaROS sends an alert. Configure alert thresholds per item. Alerts appear on the dashboard and can be sent via email.' },
      { heading: 'Purchase Orders', content: 'Create purchase orders to suppliers. Track order status (Pending, Received, Cancelled). When stock is received, inventory is updated automatically.' },
    ],
  },
  'troubleshooting': {
    title: 'Troubleshooting',
    sections: [
      { heading: 'Printer Not Working', content: '1) Check printer is powered on and connected, 2) Verify IP address in Settings > Printers, 3) Print a test page, 4) Check printer queue for stuck jobs, 5) Restart the printer and app.' },
      { heading: 'Sync Issues', content: 'If data is not syncing: 1) Check internet connection, 2) Go to Settings > Sync > Force Sync, 3) Check sync queue for failed items, 4) Restart the app. Data is never lost — it stays in the sync queue.' },
      { heading: 'Payment Errors', content: 'For UPI payment issues: 1) Verify Razorpay credentials, 2) Check internet connection, 3) Try a different payment method, 4) Check Razorpay dashboard for transaction status.' },
      { heading: 'Login Problems', content: 'If you cannot log in: 1) Verify email and password, 2) Use "Forgot Password" to reset, 3) Check if your account is active, 4) Clear app cache and try again.' },
    ],
  },
};

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const doc = docs[slug];
  if (!doc) return { title: 'Doc Not Found' };
  return { title: doc.title, description: `Documentation for ${doc.title} — NexaROS restaurant operating system.` };
}

export default async function DocPage({ params }: { params: Params }) {
  const { slug } = await params;
  const doc = docs[slug];

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Document Not Found</h1>
          <Link href="/docs" className="font-medium" style={{ color: 'var(--accent)' }}>Back to Docs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <article className="pt-32 pb-20 px-6 max-w-[768px] mx-auto">
        <Link href="/docs" className="text-sm font-medium mb-6 inline-block" style={{ color: 'var(--accent)' }}>&larr; Back to Docs</Link>
        <h1 className="text-4xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>{doc.title}</h1>
        <div className="space-y-8">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{section.heading}</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{section.content}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
