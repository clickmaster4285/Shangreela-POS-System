import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, Users, Phone, User } from 'lucide-react';
import { toast } from 'sonner';

export default function Reservation() {
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '', guests: '2' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Reservation request submitted! We will confirm shortly.');
    setForm({ name: '', phone: '', date: '', time: '', guests: '2' });
  };

  const inputClass = "w-full bg-card border border-border rounded-xl px-4 py-3 pl-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  return (
    <section id="reservation" className="section-padding bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <p className="text-primary font-sans text-sm tracking-[0.2em] uppercase mb-3">Reservations</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">Reserve Your Table</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Secure your royal dining experience. We recommend booking in advance for weekend evenings.</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="glass-card-elevated p-6 sm:p-8 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
              <input className={inputClass} placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
              <input className={inputClass} placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
            </div>
            <div className="relative">
              <CalendarDays className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
              <input type="date" className={inputClass} value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
            </div>
            <div className="relative">
              <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
              <input type="time" className={inputClass} value={form.time} onChange={e => setForm({...form, time: e.target.value})} required />
            </div>
          </div>
          <div className="relative">
            <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
            <select className={inputClass} value={form.guests} onChange={e => setForm({...form, guests: e.target.value})}>
              {[1,2,3,4,5,6,7,8,10,12].map(n => <option key={n} value={n}>{n} Guest{n>1?'s':''}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium text-sm hover:bg-secondary transition-colors">
            Reserve Now
          </button>
        </motion.form>
      </div>
    </section>
  );
}
