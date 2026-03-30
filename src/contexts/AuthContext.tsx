import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Role = 'superadmin' | 'hassaan' | 'fahad' | 'cashier';

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: 'Superadmin',
  hassaan: 'Hassaan shb',
  fahad: 'Fahad shb',
  cashier: 'Cashier',
};

export const MANAGER_ROLES: Role[] = ['superadmin', 'hassaan', 'fahad'];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export type PageKey =
  | 'dashboard'
  | 'terminal'
  | 'orders'
  | 'tables'
  | 'kitchen'
  | 'billing'
  | 'menu'
  | 'reports'
  | 'users'
  | 'inventory'
  | 'hr'
  | 'delivery'
  | 'analytics'
  | 'printers'
  | 'postabs'
  | 'giftcards'
  | 'fbr'
  | 'tax'
  | 'mobileapp'
  | 'outdoordelivery';

export type ActionKey =
  | 'apply_discount'
  | 'void_order'
  | 'edit_menu'
  | 'print_bill'
  | 'hold_order'
  | 'change_table_status';

export type DataKey = 'view_revenue' | 'view_all_orders' | 'view_reports' | 'view_staff';

export interface RolePermissions {
  pageAccess: PageKey[];
  actionPermissions: ActionKey[];
  dataVisibility: DataKey[];
}

export type PermissionsConfig = Record<Role, RolePermissions>;

const ALL_PAGE_KEYS: PageKey[] = [
  'dashboard',
  'terminal',
  'orders',
  'tables',
  'kitchen',
  'billing',
  'menu',
  'reports',
  'users',
  'inventory',
  'hr',
  'delivery',
  'analytics',
  'printers',
  'postabs',
  'giftcards',
  'fbr',
  'tax',
  'mobileapp',
  'outdoordelivery',
];

const MANAGER_ACTIONS: ActionKey[] = [
  'apply_discount',
  'void_order',
  'edit_menu',
  'print_bill',
  'hold_order',
  'change_table_status',
];

const MANAGER_DATA: DataKey[] = ['view_revenue', 'view_all_orders', 'view_reports', 'view_staff'];

const DEFAULT_PERMISSIONS: PermissionsConfig = {
  superadmin: {
    pageAccess: [...ALL_PAGE_KEYS],
    actionPermissions: [...MANAGER_ACTIONS],
    dataVisibility: [...MANAGER_DATA],
  },
  hassaan: {
    pageAccess: [...ALL_PAGE_KEYS],
    actionPermissions: [...MANAGER_ACTIONS],
    dataVisibility: [...MANAGER_DATA],
  },
  fahad: {
    pageAccess: [...ALL_PAGE_KEYS],
    actionPermissions: [...MANAGER_ACTIONS],
    dataVisibility: [...MANAGER_DATA],
  },
  cashier: {
    pageAccess: ['terminal', 'orders', 'tables', 'billing', 'delivery', 'giftcards'],
    actionPermissions: ['print_bill', 'apply_discount', 'hold_order', 'change_table_status'],
    dataVisibility: ['view_all_orders'],
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

function migrateRole(r: string): Role {
  const map: Record<string, Role> = {
    admin: 'superadmin',
    superadmin: 'superadmin',
    hassaan: 'hassaan',
    fahad: 'fahad',
    cashier: 'cashier',
    hr: 'hassaan',
    waiter: 'fahad',
  };
  return map[r] ?? 'cashier';
}

function upgradeLegacyUser(u: User): User {
  const normalizedEmail = normalizeEmail(u.email);
  const role = migrateRole(u.role as string);

  if (
    role === 'superadmin' &&
    (normalizedEmail === 'admin@shirazre.com' ||
      normalizedEmail === 'admin@shiraz.com' ||
      u.name === 'Admin User')
  ) {
    return {
      ...u,
      name: 'Superadmin',
      email: 'superadmin@shirazre.com',
      role,
    };
  }

  return { ...u, email: normalizedEmail, role };
}

function normalizeUsers(input: User[]): User[] {
  return input.map(u => upgradeLegacyUser(u));
}

function withDomainAliases(input: Record<string, Credential>) {
  const out: Record<string, Credential> = { ...input };
  for (const [email, cred] of Object.entries(input)) {
    if (email.endsWith('@shiraz.com')) out[email.replace(/@shiraz\.com$/, '@shirazre.com')] = cred;
    if (email.endsWith('@shirazre.com')) out[email.replace(/@shirazre\.com$/, '@shiraz.com')] = cred;
  }
  return out;
}

const DEFAULT_USERS: User[] = [
  { id: '1', name: 'Superadmin', email: 'superadmin@shirazre.com', role: 'superadmin', avatar: '' },
  { id: '2', name: 'Hassaan shb', email: 'hassaan@shirazre.com', role: 'hassaan', avatar: '' },
  { id: '3', name: 'Fahad shb', email: 'fahad@shirazre.com', role: 'fahad', avatar: '' },
  { id: '4', name: 'Cashier', email: 'cashier@shirazre.com', role: 'cashier', avatar: '' },
];

const CREDENTIALS: Record<string, Credential> = {
  'superadmin@shirazre.com': { password: 'super123', userId: '1' },
  'hassaan@shirazre.com': { password: 'hassaan123', userId: '2' },
  'fahad@shirazre.com': { password: 'fahad123', userId: '3' },
  'cashier@shirazre.com': { password: 'cashier123', userId: '4' },
  // Legacy demo logins (map to migrated users if still in storage)
  'admin@shirazre.com': { password: 'admin123', userId: '1' },
};

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function mergeRolePermissions(base: RolePermissions, saved?: Partial<RolePermissions> | null): RolePermissions {
  if (!saved?.pageAccess?.length) return base;
  const extraPages = base.pageAccess.filter(p => !saved.pageAccess!.includes(p));
  const extraActions = base.actionPermissions.filter(a => !(saved.actionPermissions ?? []).includes(a));
  const extraData = base.dataVisibility.filter(d => !(saved.dataVisibility ?? []).includes(d));
  return {
    pageAccess: uniq([...saved.pageAccess, ...extraPages]) as PageKey[],
    actionPermissions: uniq([...(saved.actionPermissions ?? []), ...extraActions]) as ActionKey[],
    dataVisibility: uniq([...(saved.dataVisibility ?? []), ...extraData]) as DataKey[],
  };
}

function migratePermissionsFromStorage(parsed: Record<string, RolePermissions>): PermissionsConfig {
  const remapped: Record<string, RolePermissions> = { ...parsed };
  if (parsed.admin && !parsed.superadmin) {
    remapped.superadmin = parsed.admin;
    delete remapped.admin;
  }
  if (parsed.hr && !parsed.hassaan) remapped.hassaan = parsed.hr;
  if (parsed.waiter && !parsed.fahad) remapped.fahad = parsed.waiter;

  const roles: Role[] = ['superadmin', 'hassaan', 'fahad', 'cashier'];
  const out = { ...DEFAULT_PERMISSIONS };
  for (const role of roles) {
    const saved = remapped[role];
    out[role] = mergeRolePermissions(DEFAULT_PERMISSIONS[role], saved);
  }
  return out;
}

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
      if (parsed && parsed.id && parsed.email && parsed.role) {
        return upgradeLegacyUser(parsed as User);
      }
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
    if (saved) return normalizeUsers(JSON.parse(saved));
    return DEFAULT_USERS;
  });

  const [permissions, setPermissions] = useState<PermissionsConfig>(() => {
    const saved =
      localStorage.getItem(STORAGE_KEYS.permissions) ??
      localStorage.getItem('Shiraz_permissions') ??
      localStorage.getItem('Shiraz Restaurant_permissions');
    if (!saved) return DEFAULT_PERMISSIONS;
    try {
      return migratePermissionsFromStorage(JSON.parse(saved));
    } catch {
      return DEFAULT_PERMISSIONS;
    }
  });

  const [creds, setCreds] = useState<Record<string, Credential>>(() => {
    const saved =
      localStorage.getItem(STORAGE_KEYS.creds) ??
      localStorage.getItem('Shiraz_creds') ??
      localStorage.getItem('Shiraz Restaurant_creds');
    const fromStorage = saved ? withDomainAliases(normalizeCreds(JSON.parse(saved))) : {};
    return { ...CREDENTIALS, ...fromStorage };
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.user);
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.permissions, JSON.stringify(permissions));
  }, [permissions]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.creds, JSON.stringify(creds));
  }, [creds]);

  const login = (email: string, password: string): string | null => {
    const cred = creds[normalizeEmail(email)];
    if (!cred || cred.password !== password) return 'Invalid email or password';
    const foundUser = users.find(u => u.id === cred.userId);
    if (!foundUser) return 'User not found';
    setUser(upgradeLegacyUser(foundUser));
    return null;
  };

  const logout = () => setUser(null);

  const currentPermissions = user ? permissions[user.role] : null;

  const hasPageAccess = (page: PageKey) => {
    if (!user) return false;
    if (MANAGER_ROLES.includes(user.role)) return true;
    return permissions[user.role].pageAccess.includes(page);
  };

  const hasAction = (action: ActionKey) => {
    if (!user) return false;
    if (MANAGER_ROLES.includes(user.role)) return true;
    return permissions[user.role].actionPermissions.includes(action);
  };

  const hasDataAccess = (data: DataKey) => {
    if (!user) return false;
    if (MANAGER_ROLES.includes(user.role)) return true;
    return permissions[user.role].dataVisibility.includes(data);
  };

  const updatePermissions = (config: PermissionsConfig) => setPermissions(config);

  const addUser = (newUser: Omit<User, 'id'>, password: string) => {
    const id = Date.now().toString();
    const u = { ...newUser, id, email: normalizeEmail(newUser.email), role: migrateRole(newUser.role) };
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
    <AuthContext.Provider
      value={{
        user,
        users,
        permissions,
        login,
        logout,
        hasPageAccess,
        hasAction,
        hasDataAccess,
        updatePermissions,
        addUser,
        removeUser,
        currentPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
