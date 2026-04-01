import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import heroBanner from '@/assets/hero-banner.jpg';
import staffAdmin from '@/assets/staff-admin.png';
import staffCashier from '@/assets/staff-cashier.png';
import staffWaiter from '@/assets/staff-waiter.png';
import Logo from '@/components/branding/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const err = await login(email, password);
    if (err) setError(err);
    else navigate('/pos');
  };

  const quickLogin = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
    setError('');
  };

  const quickUsers = [
    { label: 'Superadmin', em: 'superadmin@shirazre.com', pw: 'super123', color: 'bg-primary/10 text-primary border-primary/20', avatar: staffAdmin },
    { label: 'Hassaan shb', em: 'hassaan@shirazre.com', pw: 'hassaan123', color: 'bg-secondary/20 text-secondary-foreground border-secondary/30', avatar: staffAdmin },
    { label: 'Fahad shb', em: 'fahad@shirazre.com', pw: 'fahad123', color: 'bg-accent/30 text-accent-foreground border-accent/40', avatar: staffWaiter },
    { label: 'Cashier', em: 'cashier@shirazre.com', pw: 'cashier123', color: 'bg-success/10 text-success border-success/20', avatar: staffCashier },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBanner} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-deep-brown/80 via-deep-brown/70 to-deep-brown/90" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-card/95 backdrop-blur-xl rounded-3xl p-8 space-y-6" style={{ boxShadow: 'var(--shadow-elevated)' }}>
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center">
              <Logo size={48} className="text-foreground" textClassName="text-3xl text-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">POS System Login</p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-secondary transition-colors">
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          </form>

          {/* Quick login */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground text-center mb-3">Quick Login (Demo)</p>
            <div className="grid grid-cols-4 gap-2">
              {quickUsers.map(q => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => quickLogin(q.em, q.pw)}
                  className={`py-3 rounded-xl text-xs font-medium border ${q.color} hover:opacity-80 transition-opacity flex flex-col items-center gap-1.5`}
                >
                  <img src={q.avatar} alt={q.label} className="w-10 h-10 rounded-full object-cover" loading="lazy" width={40} height={40} />
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
