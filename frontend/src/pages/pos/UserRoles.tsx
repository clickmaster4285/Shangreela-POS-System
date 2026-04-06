import { useState } from 'react';
import { Shield, User } from 'lucide-react';

type Role = 'superadmin' | 'hassaan' | 'fahad' | 'cashier';

const ROLE_LABELS: Record<Role, string> = {
  superadmin: 'Superadmin',
  hassaan: 'Hassaan shb',
  fahad: 'Fahad shb',
  cashier: 'Cashier',
};

interface StaffMember {
  id: string;
  name: string;
  role: Role;
  email: string;
  active: boolean;
}

const initialStaff: StaffMember[] = [
  { id: '1', name: 'Superadmin', role: 'superadmin', email: 'superadmin@shirazre.com', active: true },
  { id: '2', name: 'Hassaan shb', role: 'hassaan', email: 'hassaan@shirazre.com', active: true },
  { id: '3', name: 'Fahad shb', role: 'fahad', email: 'fahad@shirazre.com', active: true },
  { id: '4', name: 'Cashier', role: 'cashier', email: 'cashier@shirazre.com', active: true },
];

const roleAccess: Record<Role, string[]> = {
  superadmin: ['Full POS', 'Integrations', 'FBR', 'Reports', 'Users', 'HR & payroll'],
  hassaan: ['Full POS', 'Outdoor delivery reports', 'Shifts', 'Tax & FBR'],
  fahad: ['Full POS', 'Outdoor delivery reports', 'Shifts', 'Tax & FBR'],
  cashier: ['POS terminal', 'Orders', 'Tables', 'Billing', 'Delivery', 'Gift & loyalty'],
};

const roleBadge: Record<Role, string> = {
  superadmin: 'bg-primary/10 text-primary',
  hassaan: 'bg-secondary/20 text-secondary-foreground',
  fahad: 'bg-accent/30 text-accent-foreground',
  cashier: 'bg-success/10 text-success',
};

export default function UserRoles() {
  const [staff] = useState<StaffMember[]>(initialStaff);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">User roles</h1>
        <p className="text-sm text-muted-foreground">Reference overview — live accounts are managed under Users & permissions.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['superadmin', 'hassaan', 'fahad', 'cashier'] as Role[]).map(role => (
          <div key={role} className="pos-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{ROLE_LABELS[role]}</p>
                <p className="text-xs text-muted-foreground">{staff.filter(s => s.role === role).length} staff</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {roleAccess[role].map(a => (
                <span key={a} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {a}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pos-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-3 px-2 font-medium">Name</th>
              <th className="py-3 px-2 font-medium">Email</th>
              <th className="py-3 px-2 font-medium">Role</th>
              <th className="py-3 px-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id} className="border-b border-border/50 last:border-0">
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{s.name}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-muted-foreground">{s.email}</td>
                <td className="py-3 px-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge[s.role]}`}>{ROLE_LABELS[s.role]}</span>
                </td>
                <td className="py-3 px-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}
                  >
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
