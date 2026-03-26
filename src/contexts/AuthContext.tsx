import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Role = 'admin' | 'cashier' | 'waiter' | 'hr';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export type PageKey = 'dashboard' | 'terminal' | 'orders' | 'tables' | 'kitchen' | 'billing' | 'menu' | 'reports' | 'users' | 'inventory' | 'hr' | 'delivery' | 'analytics';
export type ActionKey = 'apply_discount' | 'void_order' | 'edit_menu' | 'print_bill' | 'hold_order' | 'change_table_status';
export type DataKey = 'view_revenue' | 'view_all_orders' | 'view_reports' | 'view_staff';

export interface RolePermissions {
  pageAccess: PageKey[];
  actionPermissions: ActionKey[];
  dataVisibility: DataKey[];
}

export type PermissionsConfig = Record<Role, RolePermissions>;

const DEFAULT_PERMISSIONS: PermissionsConfig = {
  admin: {
    pageAccess: ['dashboard', 'terminal', 'orders', 'tables', 'kitchen', 'billing', 'menu', 'reports', 'users', 'inventory', 'hr', 'delivery', 'analytics'],
    actionPermissions: ['apply_discount', 'void_order', 'edit_menu', 'print_bill', 'hold_order', 'change_table_status'],
    dataVisibility: ['view_revenue', 'view_all_orders', 'view_reports', 'view_staff'],
  },
  cashier: {
    pageAccess: ['terminal', 'orders', 'billing'],
    actionPermissions: ['print_bill', 'apply_discount'],
    dataVisibility: ['view_all_orders'],
  },
  waiter: {
    pageAccess: ['terminal', 'orders', 'tables', 'delivery'],
    actionPermissions: ['hold_order', 'change_table_status'],
    dataVisibility: [],
  },
  hr: {
    pageAccess: ['dashboard', 'hr', 'reports'],
    actionPermissions: [],
    dataVisibility: ['view_staff', 'view_reports'],
  },
};

const STORAGE_KEYS = {
  user: 'shirazre_user',
  users: 'shirazre_users',
  permissions: 'shirazre_permissions',
  creds: 'shirazre_creds',
} as const;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

type Credential = { password: string; userId: string };

function normalizeCreds(input: Record<string, Credential>) {
  return Object.fromEntries(Object.entries(input).map(([email, v]) => [normalizeEmail(email), v]));
}

function normalizeUsers(input: User[]) {
  return input.map(u => ({ ...u, email: normalizeEmail(u.email) }));
}

function withDomainAliases(input: Record<string, Credential>) {
  const out: Record<string, Credential> = { ...input };

  for (const [email, cred] of Object.entries(input)) {
    // Preserve access if domain changed over time.
    if (email.endsWith('@shiraz.com')) out[email.replace(/@shiraz\.com$/, '@shirazre.com')] = cred;
    if (email.endsWith('@shirazre.com')) out[email.replace(/@shirazre\.com$/, '@shiraz.com')] = cred;
  }

  return out;
}

const DEFAULT_USERS: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@shirazre.com', role: 'admin', avatar: '' },
  { id: '2', name: 'John Cashier', email: 'cashier@shirazre.com', role: 'cashier', avatar: '' },
  { id: '3', name: 'Sarah Waiter', email: 'waiter@shirazre.com', role: 'waiter', avatar: '' },
  { id: '4', name: 'Ali HR', email: 'hr@shirazre.com', role: 'hr', avatar: '' },
];

const CREDENTIALS: Record<string, Credential> = {
  'admin@shirazre.com': { password: 'admin123', userId: '1' },
  'cashier@shirazre.com': { password: 'cashier123', userId: '2' },
  'waiter@shirazre.com': { password: 'waiter123', userId: '3' },
  'hr@shirazre.com': { password: 'hr123', userId: '4' },
};

interface AuthContextType {
  user: User | null;
  users: User[];
  permissions: PermissionsConfig;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  hasPageAccess: (page: PageKey) => boolean;
  hasAction: (action: ActionKey) => boolean;
  hasDataAccess: (data: DataKey) => boolean;
  updatePermissions: (config: PermissionsConfig) => void;
  addUser: (user: Omit<User, 'id'>, password: string) => void;
  removeUser: (id: string) => void;
  currentPermissions: RolePermissions | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved =
      localStorage.getItem(STORAGE_KEYS.user) ??
      localStorage.getItem('Shiraz_user') ??
      localStorage.getItem('Shiraz Restaurant_user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id && parsed.email && parsed.role) return { ...parsed, email: normalizeEmail(parsed.email) };
      localStorage.removeItem(STORAGE_KEYS.user);
      return null;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.user);
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved =
      localStorage.getItem(STORAGE_KEYS.users) ??
      localStorage.getItem('Shiraz_users') ??
      localStorage.getItem('Shiraz Restaurant_users');
    return saved ? normalizeUsers(JSON.parse(saved)) : DEFAULT_USERS;
  });

  const [permissions, setPermissions] = useState<PermissionsConfig>(() => {
    const saved =
      localStorage.getItem(STORAGE_KEYS.permissions) ??
      localStorage.getItem('Shiraz_permissions') ??
      localStorage.getItem('Shiraz Restaurant_permissions');
    return saved ? JSON.parse(saved) : DEFAULT_PERMISSIONS;
  });

  const [creds, setCreds] = useState<Record<string, Credential>>(() => {
    const saved =
      localStorage.getItem(STORAGE_KEYS.creds) ??
      localStorage.getItem('Shiraz_creds') ??
      localStorage.getItem('Shiraz Restaurant_creds');
    const fromStorage = saved ? withDomainAliases(normalizeCreds(JSON.parse(saved))) : {};
    // Ensure defaults exist, but keep any customized stored creds
    return { ...CREDENTIALS, ...fromStorage };
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.user);
  }, [user]);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.permissions, JSON.stringify(permissions)); }, [permissions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.creds, JSON.stringify(creds)); }, [creds]);

  const login = (email: string, password: string): string | null => {
    const cred = creds[normalizeEmail(email)];
    if (!cred || cred.password !== password) return 'Invalid email or password';
    const foundUser = users.find(u => u.id === cred.userId);
    if (!foundUser) return 'User not found';
    setUser(foundUser);
    return null;
  };

  const logout = () => setUser(null);

  const currentPermissions = user ? permissions[user.role] : null;

  const hasPageAccess = (page: PageKey) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions[user.role].pageAccess.includes(page);
  };

  const hasAction = (action: ActionKey) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions[user.role].actionPermissions.includes(action);
  };

  const hasDataAccess = (data: DataKey) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions[user.role].dataVisibility.includes(data);
  };

  const updatePermissions = (config: PermissionsConfig) => setPermissions(config);

  const addUser = (newUser: Omit<User, 'id'>, password: string) => {
    const id = Date.now().toString();
    const u = { ...newUser, id, email: normalizeEmail(newUser.email) };
    setUsers(prev => [...prev, u]);
    setCreds(prev => ({ ...prev, [normalizeEmail(newUser.email)]: { password, userId: id } }));
  };

  const removeUser = (id: string) => {
    const u = users.find(usr => usr.id === id);
    if (u) {
      setUsers(prev => prev.filter(usr => usr.id !== id));
      setCreds(prev => {
        const next = { ...prev };
        delete next[normalizeEmail(u.email)];
        return next;
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, users, permissions, login, logout, hasPageAccess, hasAction, hasDataAccess, updatePermissions, addUser, removeUser, currentPermissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
