import { useState } from 'react';
import { Building2, Link2, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function FBRIntegration() {
  const [ntn, setNtn] = useState('1234567-8');
  const [posId, setPosId] = useState('SRZ-POS-001');
  const [sandbox, setSandbox] = useState(true);
  const [linked, setLinked] = useState(false);

  const sync = () => {
    setLinked(true);
    toast.success('FBR POS sync simulated — replace with live API credentials');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">FBR POS integration</h1>
        <p className="text-sm text-muted-foreground">Federal Board of Revenue (Pakistan) digital invoicing linkage for retail POS.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="pos-card space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Business registration
          </h3>
          <div>
            <label className="text-xs text-muted-foreground">NTN / STRN</label>
            <input value={ntn} onChange={e => setNtn(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Registered POS ID</label>
            <input value={posId} onChange={e => setPosId(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sandbox} onChange={e => setSandbox(e.target.checked)} className="rounded" />
            Sandbox / test environment
          </label>
        </div>

        <div className="pos-card space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" /> Connection status
          </h3>
          <div className={`rounded-xl p-4 border ${linked ? 'border-success/40 bg-success/5' : 'border-border bg-muted/30'}`}>
            <div className="flex items-center gap-2 text-sm">
              {linked ? <ShieldCheck className="w-5 h-5 text-success" /> : <ShieldCheck className="w-5 h-5 text-muted-foreground" />}
              <span className="font-medium text-foreground">{linked ? 'Linked (demo)' : 'Not linked — configure API keys'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Production requires FBR-approved POS credentials and secure certificate storage.</p>
          </div>
          <button
            type="button"
            onClick={sync}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Test connection / sync
          </button>
        </div>
      </div>
    </div>
  );
}
