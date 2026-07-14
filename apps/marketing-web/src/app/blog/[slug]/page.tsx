import type { Metadata } from 'next';
import Link from 'next/link';

const blogPosts: Record<string, { title: string; date: string; readTime: string; content: string }> = {
  'offline-first-restaurants': {
    title: 'Why Offline-First is Critical for Restaurants',
    date: 'Jul 10, 2026',
    readTime: '5 min',
    content: `
Internet downtime shouldn't mean business downtime. In India, where internet connectivity can be unreliable, restaurants cannot afford to lose orders or revenue because their POS system went offline.

## The Problem with Cloud-Only POS

Most modern POS systems are cloud-based. They require a constant internet connection to function. When the internet goes down:

- Orders can't be placed
- KOTs can't be printed
- Payments can't be processed
- Data is lost if not cached properly

For a restaurant doing ₹50,000/day in revenue, even 30 minutes of downtime costs ₹1,000+ in lost sales.

## What Offline-First Means

Offline-first is different from offline-capable:

- **Offline-capable**: App works online, degrades gracefully offline
- **Offline-first**: App works primarily offline, syncs when online

NexaROS stores all critical data in local SQLite on your device. Orders, KOTs, payments — everything works without internet. When connectivity returns, data syncs automatically to the cloud.

## How NexaROS Handles Offline

1. **Local SQLite Database**: All data stored on-device using Drift ORM
2. **Sync Queue**: Changes queued and uploaded when online
3. **Conflict Resolution**: Last-write-wins with server timestamps
4. **KOT Printing**: Prints from local data, no internet needed
5. **Payment Recording**: Cash and UPI payments recorded offline

## Real-World Impact

Restaurants using NexaROS report:
- Zero order loss during internet outages
- 99.9% uptime for POS operations
- Faster order processing (local data is instant)
- Peace of mind during monsoon season

## Conclusion

If you're choosing a POS system, make sure it's offline-first. Your restaurant can't afford to wait for the internet to come back.
    `,
  },
  'gst-invoicing-guide': {
    title: 'Complete Guide to GST Invoicing for Restaurants',
    date: 'Jul 5, 2026',
    readTime: '8 min',
    content: `
Everything you need to know about GST invoicing, tax rates, and compliance for Indian restaurants.

## GST Rates for Restaurants

| Service Type | GST Rate |
|---|---|
| Restaurant services (non-AC) | 5% (no ITC) |
| Restaurant services (AC) | 5% (no ITC) |
| Food delivery via apps | 5% |
| Catering services | 18% |
| Takeaway | 5% |

## What Your Invoice Must Include

1. Supplier name, address, and GSTIN
2. Invoice number (sequential)
3. Date of issue
4. Customer name and address (B2B)
5. HSN code for food items
6. Description of goods/services
7. Quantity and unit
8. Total value before tax
9. Taxable value after discounts
10. GST rate and amount (CGST + SGST or IGST)
11. Place of supply
12. Whether tax is payable on reverse charge

## CGST vs SGST vs IGST

- **Intra-state**: CGST + SGST (e.g., 2.5% + 2.5% = 5%)
- **Inter-state**: IGST (e.g., 5% IGST)

## How NexaROS Handles GST

NexaROS automatically:
- Calculates CGST/SGST/IGST based on place of supply
- Generates GST-compliant invoices
- Supports HSN codes for menu items
- Exports invoices in GST format
- Handles discounts and adjustments correctly
    `,
  },
  'qr-ordering-revenue': {
    title: 'How QR Ordering Can Increase Your Revenue',
    date: 'Jun 28, 2026',
    readTime: '4 min',
    content: `
QR code ordering is transforming the dining experience. See how restaurants are increasing order values by 20%+.

## What is QR Ordering?

Customers scan a QR code at their table, which opens your digital menu in their phone browser. They browse, add items to cart, and place orders directly. No app download required.

## Revenue Impact

Restaurants using QR ordering report:
- **20-30% higher average order value**: Customers browse longer and add more items
- **15% faster table turnover**: Orders reach kitchen instantly
- **Reduced staffing needs**: Fewer servers needed for order-taking
- **Better customer experience**: No waiting for server attention

## How It Works with NexaROS

1. Generate QR codes for each table
2. Customer scans QR → opens digital menu
3. Browses menu with photos and descriptions
4. Adds items to cart → places order
5. Order appears on POS and kitchen display instantly
6. Customer tracks order status in real-time

## Best Practices

- Use high-quality QR codes (laminated cards work best)
- Include table number in the QR code
- Add a brief instruction on the QR card
- Keep your digital menu updated with photos
- Offer both QR ordering and traditional ordering
    `,
  },
  'restaurant-tech-stack-2026': {
    title: 'The Ultimate Restaurant Tech Stack (2026)',
    date: 'Jun 20, 2026',
    readTime: '10 min',
    content: `
From POS to inventory management, here's the complete tech stack every restaurant needs in 2026.

## Essential Technology

### 1. Point of Sale (POS)
The heart of your restaurant operations. Modern POS systems handle orders, payments, and reporting.

### 2. Kitchen Display System (KDS)
Replaces paper KOTs with digital displays. Real-time order updates, timers, and status tracking.

### 3. Inventory Management
Track stock levels, manage suppliers, and auto-deduct inventory from orders.

### 4. Staff Management
Role-based access, shift scheduling, attendance tracking, and performance metrics.

### 5. Customer-Facing Website
Digital menu, online ordering, and order tracking for your customers.

### 6. Analytics & Reporting
Daily sales, revenue breakdowns, item performance, and peak hours analysis.

## Nice-to-Have

- **CRM & Loyalty**: Customer databases and reward programs
- **Reservation System**: Table booking and management
- **Accounting Integration**: Tally, Zoho Books, etc.
- **Delivery Integration**: Swiggy, Zomato APIs

## The NexaROS Advantage

NexaROS provides all essential technology in one platform:
- POS, KDS, Inventory, Staff, Website, Analytics
- Offline-first architecture
- Multi-device support (desktop, tablet, mobile, TV)
- Built for Indian restaurants (GST, UPI, multi-language)
    `,
  },
  'multi-branch-management': {
    title: 'Managing Multi-Branch Restaurants Efficiently',
    date: 'Jun 15, 2026',
    readTime: '6 min',
    content: `
Tips and tools for restaurant owners managing multiple locations without the headache.

## Challenges of Multi-Branch

- Inconsistent menu across branches
- Different pricing at different locations
- Staff management across locations
- Inventory tracking per branch
- Consolidated reporting

## How NexaROS Solves This

### Centralized Menu Management
Update menu once, sync to all branches. Or customize per branch.

### Branch-Specific Settings
Each branch can have its own:
- Operating hours
- Tax rates
- Staff roles
- Printer configurations

### Consolidated Dashboard
View all branches from a single dashboard:
- Revenue comparison
- Order volume
- Staff performance
- Inventory levels

### Per-Branch Reporting
Detailed reports for each location with the ability to compare across branches.

## Best Practices

1. Start with a centralized menu, customize per branch as needed
2. Use role-based access to control what managers can see/do
3. Set up automated alerts for low stock at each branch
4. Review branch comparison reports weekly
5. Maintain consistent branding across all locations
    `,
  },
  'staff-scheduling-best-practices': {
    title: 'Staff Scheduling Best Practices',
    date: 'Jun 8, 2026',
    readTime: '5 min',
    content: `
Optimize your staff schedules with these proven strategies and reduce labor costs.

## Why Scheduling Matters

- Labor costs are typically 25-35% of restaurant revenue
- Overstaffing wastes money
- Understaffing hurts service quality
- Poor scheduling leads to staff burnout and turnover

## Strategies

### 1. Analyze Peak Hours
Use your POS data to identify busiest hours. Schedule more staff during peaks, fewer during slow periods.

### 2. Create Shift Templates
Standardize shifts (morning, afternoon, evening, split) and reuse them weekly.

### 3. Cross-Train Staff
Train staff to handle multiple roles. A server who can also help in the kitchen is more valuable.

### 4. Use Technology
NexaROS's staff management module handles:
- Shift creation and assignment
- Clock in/out with PIN
- Attendance tracking
- Overtime calculations

### 5. Communicate Clearly
Publish schedules at least 2 weeks in advance. Use a shared system so everyone can see their shifts.

## Reducing Labor Costs

- Match staffing to demand patterns
- Use part-time staff for peak hours
- Eliminate no-shows with accountability tracking
- Reduce overtime with better planning
    `,
  },
};

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts[slug];
  if (!post) return { title: 'Post Not Found' };
  return { title: post.title, description: post.content.slice(0, 160).trim() };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Post Not Found</h1>
          <Link href="/blog" className="font-medium" style={{ color: 'var(--accent)' }}>Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <article className="pt-32 pb-20 px-6 max-w-[768px] mx-auto">
        <Link href="/blog" className="text-sm font-medium mb-6 inline-block" style={{ color: 'var(--accent)' }}>&larr; Back to Blog</Link>
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{post.title}</h1>
        <div className="flex items-center gap-4 text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readTime} read</span>
        </div>
        <div className="space-y-4">
          {post.content.split('\n').map((line, i) => {
            if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-10 mb-4" style={{ color: 'var(--text-primary)' }}>{line.slice(3)}</h2>;
            if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-semibold mt-8 mb-3" style={{ color: 'var(--text-primary)' }}>{line.slice(4)}</h3>;
            if (line.startsWith('| ')) {
              const cells = line.split('|').filter(Boolean).map((c) => c.trim());
              if (cells.every((c) => c.match(/^[-:]+$/))) return null;
              return (
                <div key={i} className="flex gap-4 py-2 text-sm" style={{ borderBottom: '1px solid var(--border)' }}>
                  {cells.map((cell, j) => <span key={j} className={j === 0 ? 'font-medium' : ''} style={{ color: j === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{cell}</span>)}
                </div>
              );
            }
            if (line.startsWith('- **')) {
              const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)$/);
              if (match) return <li key={i} className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>{match[1]}</strong>: {match[2]}</li>;
            }
            if (line.startsWith('- ')) return <li key={i} className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{line.slice(2)}</li>;
            if (line.match(/^\d+\./)) return <li key={i} className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{line.replace(/^\d+\.\s*/, '')}</li>;
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{line}</p>;
          })}
        </div>
      </article>
    </div>
  );
}
