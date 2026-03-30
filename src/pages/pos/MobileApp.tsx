import { Smartphone, QrCode, Bell, MapPin, CreditCard } from 'lucide-react';

const features = [
  { icon: MapPin, title: 'Table & outdoor orders', text: 'Wait staff and supervisors track floors and delivery handoff.' },
  { icon: CreditCard, title: 'Gift & loyalty', text: 'Scan cards and apply balances from the handheld flow.' },
  { icon: Bell, title: 'Shift alerts', text: 'Supervisors see collection summaries and outdoor delivery batches.' },
  { icon: QrCode, title: 'Secure login', text: 'Staff sign-in with role-aware access (Superadmin, Hassaan shb, Fahad shb, Cashier).' },
];

export default function MobileApp() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Mobile app</h1>
        <p className="text-sm text-muted-foreground">Companion app for managers, supervisors, and floor staff — pairs with this POS back office.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 items-start">
        <div className="pos-card p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Install & pairing</h3>
          <p className="text-xs text-muted-foreground max-w-sm">Publish to your enterprise store or distribute APK/IPA internally. Pair each device with outlet ID and API token from superadmin.</p>
          <div className="w-36 h-36 rounded-xl bg-muted flex items-center justify-center border border-dashed border-border">
            <QrCode className="w-16 h-16 text-muted-foreground" />
          </div>
          <p className="text-[10px] text-muted-foreground">Placeholder QR — replace with real download link</p>
        </div>

        <div className="space-y-3">
          {features.map(f => (
            <div key={f.title} className="pos-card p-4 flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground text-sm">{f.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
