import { useEffect, useState } from 'react';
import { Gift, Star, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

type GiftCard = { id: string; code: string; balance: number; issued: string; status: 'active' | 'redeemed' | 'expired' };
type LoyaltyMember = { id: string; name: string; phone: string; points: number; tier: string };

export default function GiftLoyaltyCards() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyMember[]>([]);
  const [q, setQ] = useState('');

  const load = () => {
    Promise.all([api<{ items: GiftCard[] }>('/gift-cards'), api<{ items: LoyaltyMember[] }>('/loyalty/members')]).then(([g, l]) => {
      setGiftCards(g.items);
      setLoyalty(l.items);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const filteredLoyalty = loyalty.filter(m => m.name.toLowerCase().includes(q.toLowerCase()) || m.phone.includes(q));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Gift cards & loyalty</h1>
        <p className="text-sm text-muted-foreground">Issue gift cards and track loyalty points at checkout (POS terminal).</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="pos-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" /> Gift cards
            </h3>
            <button
              type="button"
              onClick={() => {
                const code = `GC-${Math.floor(Math.random() * 9000 + 1000)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
                api('/gift-cards', { method: 'POST', body: JSON.stringify({ code, balance: 5000, issued: new Date().toISOString().slice(0, 10), status: 'active' }) })
                  .then(() => {
                    toast.success('Gift card issued');
                    load();
                  })
                  .catch(() => toast.error('Failed to issue gift card'));
              }}
              className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New card
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 font-medium">Code</th>
                  <th className="py-2 font-medium text-right">Balance (Rs)</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {giftCards.map(g => (
                  <tr key={g.id} className="border-b border-border/50">
                    <td className="py-2 font-mono text-xs">{g.code}</td>
                    <td className="py-2 text-right font-medium">{g.balance.toLocaleString()}</td>
                    <td className="py-2 capitalize text-muted-foreground">{g.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pos-card space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" /> Loyalty members
            </h3>
            <div className="relative flex-1 max-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-border bg-background text-xs"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Earn 1 point per Rs 100 spent. Gold: 5% discount on bill.</p>
          <div className="space-y-2">
            {filteredLoyalty.map(m => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                <div>
                  <p className="font-medium text-foreground text-sm">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{m.points} pts</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{m.tier}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
