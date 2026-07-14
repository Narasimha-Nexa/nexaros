'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { TENANT_INFO } from '@/lib/data/mock-data';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-2">Contact Us</h1>
        <p className="text-body">We&apos;d love to hear from you. Get in touch with us.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          {submitted ? (
            <Card className="p-8 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-ink mb-2">Message Sent!</h2>
              <p className="text-body mb-4">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
              <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}>
                Send Another Message
              </Button>
            </Card>
          ) : (
            <Card>
              <h2 className="font-semibold text-ink text-lg mb-4">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="text" placeholder="Your Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-4 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30" />
                  <input type="email" placeholder="Your Email *" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-4 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30" />
                </div>
                <input type="tel" placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30" />
                <input type="text" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30" />
                <textarea placeholder="Your Message *" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30 resize-none" />
                <Button type="submit" className="w-full gap-2"><Send size={18} /> Send Message</Button>
              </form>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-ink text-lg mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div><p className="font-medium text-ink text-sm">Address</p><p className="text-body text-sm">{TENANT_INFO.address}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div><p className="font-medium text-ink text-sm">Phone</p><a href={`tel:${TENANT_INFO.phone}`} className="text-body text-sm hover:text-link">{TENANT_INFO.phone}</a></div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div><p className="font-medium text-ink text-sm">Email</p><a href={`mailto:${TENANT_INFO.email}`} className="text-body text-sm hover:text-link">{TENANT_INFO.email}</a></div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div><p className="font-medium text-ink text-sm">Hours</p><p className="text-body text-sm">Mon-Fri: {TENANT_INFO.openingHours.weekdays}<br />Sat-Sun: {TENANT_INFO.openingHours.weekends}</p></div>
              </div>
            </div>
          </Card>

          <Card className="h-[250px] overflow-hidden p-0">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.5!2d77.5946!3d12.9716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDU4JzE3LjgiTiA3N8KwMzUnNDAuNSJF!5e0!3m2!1sen!2sin!4v1" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" title="Spice Garden Location" />
          </Card>
        </div>
      </div>
    </div>
  );
}
