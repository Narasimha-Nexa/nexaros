import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Camera, Globe, MessageCircle, AtSign } from 'lucide-react';
import { TENANT_INFO } from '@/lib/data/mock-data';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-sm">
                SG
              </div>
              <span className="font-bold text-lg">Spice Garden</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              {TENANT_INFO.description}
            </p>
            <div className="flex gap-2">
              {[Camera, Globe, MessageCircle, AtSign].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all"
                  aria-label="Social media"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/menu', label: 'Our Menu' },
                { href: '/offers', label: 'Offers' },
                { href: '/reservations', label: 'Reservations' },
                { href: '/gallery', label: 'Gallery' },
                { href: '/events', label: 'Events' },
                { href: '/blog', label: 'Blog' },
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/faq', label: 'FAQ' },
                { href: '/contact', label: 'Contact Us' },
                { href: '/privacy-policy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms of Service' },
                { href: '/refund-policy', label: 'Refund Policy' },
                { href: '/cancellation-policy', label: 'Cancellation Policy' },
                { href: '/cookie-policy', label: 'Cookie Policy' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Get in Touch</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-white/60" />
                <span className="text-sm text-white/60">{TENANT_INFO.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="shrink-0 text-white/60" />
                <a href={`tel:${TENANT_INFO.phone}`} className="text-sm text-white/60 hover:text-white transition-colors">
                  {TENANT_INFO.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="shrink-0 text-white/60" />
                <a href={`mailto:${TENANT_INFO.email}`} className="text-sm text-white/60 hover:text-white transition-colors">
                  {TENANT_INFO.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock size={16} className="mt-0.5 shrink-0 text-white/60" />
                <div className="text-sm text-white/60">
                  <p>Mon-Fri: {TENANT_INFO.openingHours.weekdays}</p>
                  <p>Sat-Sun: {TENANT_INFO.openingHours.weekends}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            &copy; {currentYear} Spice Garden. All rights reserved. Powered by{' '}
            <span className="text-white/60 font-medium">NexaROS</span>
          </p>
          <div className="flex items-center gap-4 text-sm text-white/40">
            <Link href="/privacy-policy" className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
            <Link href="/cookie-policy" className="hover:text-white/60 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
