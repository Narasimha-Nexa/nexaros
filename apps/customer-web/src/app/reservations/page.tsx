'use client';

import { useState } from 'react';
import { CalendarDays, Clock, Users, Gift, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react';
import { Button, Card, Badge, Input, SectionHeader } from '@/components/ui';
import { cn, formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

const OCCASIONS = ['None', 'Birthday', 'Anniversary', 'Corporate Event', 'Date Night', 'Family Gathering', 'Other'];
const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20];

export default function ReservationsPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [occasion, setOccasion] = useState('None');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [requests, setRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await api.createReservation({ date, time, guestCount: guests, occasion, specialRequests: requests });
      setConfirmation(result);
      setConfirmed(true);
    } catch (e) {
      // handle error
    }
    setLoading(false);
  };

  if (confirmed && confirmation) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">Reservation Confirmed!</h1>
        <p className="text-body mb-6">Your table has been booked at Spice Garden</p>
        <Card className="p-6 text-left space-y-3 mb-6">
          <div className="flex justify-between text-sm"><span className="text-body">Date</span><span className="font-medium text-ink">{new Date(confirmation.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
          <div className="flex justify-between text-sm"><span className="text-body">Time</span><span className="font-medium text-ink">{confirmation.time}</span></div>
          <div className="flex justify-between text-sm"><span className="text-body">Guests</span><span className="font-medium text-ink">{confirmation.guestCount} guests</span></div>
          <div className="flex justify-between text-sm"><span className="text-body">Table</span><span className="font-medium text-ink">Table #{confirmation.tableNumber}</span></div>
          <div className="flex justify-between text-sm"><span className="text-body">Occasion</span><span className="font-medium text-ink">{confirmation.occasion || 'None'}</span></div>
        </Card>
        <p className="text-xs text-body mb-4">A confirmation has been sent to your phone and email.</p>
        <a href="/" className="inline-block"><Button variant="outline">Back to Home</Button></a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-2">Reserve a Table</h1>
        <p className="text-body">Book your experience at Spice Garden</p>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors', step >= s ? 'bg-ink text-white' : 'bg-hairline text-body')}>{s}</div>
            <span className={cn('text-sm hidden sm:inline', step >= s ? 'text-ink font-medium' : 'text-body')}>
              {s === 1 ? 'Details' : s === 2 ? 'Info' : 'Confirm'}
            </span>
            {s < 3 && <div className={cn('w-8 h-0.5', step > s ? 'bg-ink' : 'bg-hairline')} />}
          </div>
        ))}
      </div>

      <Card padding="lg" className="max-w-xl mx-auto">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-lg text-ink">Reservation Details</h2>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1.5">Date</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-body" size={18} />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-hairline text-ink focus:outline-none focus:border-ink/30" />
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1.5">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-body" size={18} />
                <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-hairline text-ink focus:outline-none focus:border-ink/30 appearance-none bg-white">
                  <option value="">Select time</option>
                  {['11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM','10:00 PM'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Guests */}
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1.5">Number of Guests</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-body" size={18} />
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-hairline text-ink focus:outline-none focus:border-ink/30 appearance-none bg-white">
                  {GUEST_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Occasion */}
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1.5">Occasion</label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 text-body" size={18} />
                <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-hairline text-ink focus:outline-none focus:border-ink/30 appearance-none bg-white">
                  {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <Button onClick={() => time && setStep(2)} disabled={!time} className="w-full">Continue</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-lg text-ink">Your Information</h2>

            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className="w-full px-4 py-2.5 rounded-xl border border-hairline text-ink focus:outline-none focus:border-ink/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1.5">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full px-4 py-2.5 rounded-xl border border-hairline text-ink focus:outline-none focus:border-ink/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1.5">Email (optional)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full px-4 py-2.5 rounded-xl border border-hairline text-ink focus:outline-none focus:border-ink/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1.5">Special Requests</label>
              <textarea value={requests} onChange={(e) => setRequests(e.target.value)} rows={3} placeholder="Any special requests? (e.g., dietary requirements, seating preference...)" className="w-full px-4 py-2.5 rounded-xl border border-hairline text-ink focus:outline-none focus:border-ink/30 resize-none" />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(3)} disabled={!name || !phone} className="flex-1">Review</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-lg text-ink">Confirm Reservation</h2>
            <div className="space-y-3 bg-hairline/50 rounded-xl p-4 text-sm">
              <div className="flex justify-between"><span className="text-body">Date</span><span className="font-medium text-ink">{new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              <div className="flex justify-between"><span className="text-body">Time</span><span className="font-medium text-ink">{time}</span></div>
              <div className="flex justify-between"><span className="text-body">Guests</span><span className="font-medium text-ink">{guests} guests</span></div>
              <div className="flex justify-between"><span className="text-body">Occasion</span><span className="font-medium text-ink">{occasion}</span></div>
              <div className="flex justify-between"><span className="text-body">Name</span><span className="font-medium text-ink">{name}</span></div>
              <div className="flex justify-between"><span className="text-body">Phone</span><span className="font-medium text-ink">{phone}</span></div>
              {requests && <div className="flex justify-between"><span className="text-body">Requests</span><span className="font-medium text-ink text-right max-w-[200px]">{requests}</span></div>}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button onClick={handleSubmit} loading={loading} className="flex-1">Confirm Booking</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
