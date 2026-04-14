import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setToken, type PaginatedResponse } from '@/lib/api';

export type Role = 'superadmin' | 'hassaan' | 'fahad' | 'cashier' | 'store_manager';

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: 'Superadmin',
  hassaan: 'Hassaan shb',
  fahad: 'Fahad shb',
  cashier: 'Cashier',
  store_manager: 'Store Manager',
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
  | 'expenses'
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
  'expenses',
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
  store_manager: {
    pageAccess: ['dashboard', 'terminal', 'orders', 'tables', 'kitchen', 'billing', 'inventory', 'reports', 'expenses', 'delivery', 'outdoordelivery'],
    actionPermissions: ['print_bill', 'apply_discount', 'hold_order', 'change_table_status', 'edit_menu'],
    dataVisibility: ['view_all_orders', 'view_reports', 'view_staff'],
  },
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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
    store_manager: 'store_manager',
    manager: 'store_manager',
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

const DEFAULT_USERS: User[] = [
  { id: '1', name: 'Superadmin', email: 'superadmin@shirazre.com', role: 'superadmin', avatar: '' },
  { id: '2', name: 'Hassaan shb', email: 'hassaan@shirazre.com', role: 'hassaan', avatar: '' },
  { id: '3', name: 'Fahad shb', email: 'fahad@shirazre.com', role: 'fahad', avatar: '' },
  { id: '4', name: 'Cashier', email: 'cashier@shirazre.com', role: 'cashier', avatar: '' },
];

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

  const roles: Role[] = ['superadmin', 'hassaan', 'fahad', 'cashier', 'store_manager'];
  const out = { ...DEFAULT_PERMISSIONS };
  for (const role of roles) {
    const saved = remapped[role];
    out[role] = mergeRolePermissions(DEFAULT_PERMISSIONS[role], saved);
  }
  return out;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  users: User[];
  permissions: PermissionsConfig;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  hasPageAccess: (page: PageKey) => boolean;
  hasAction: (action: ActionKey) => boolean;
  hasDataAccess: (data: DataKey) => boolean;
  updatePermissions: (config: PermissionsConfig) => Promise<void>;
  addUser: (user: Omit<User, 'id'>, password: string) => Promise<void>;
  updateUser: (id: string, updates: Partial<Omit<User, 'id'>> & { password?: string }) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  currentPermissions: RolePermissions | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const LEGACY_STORAGE_KEYS = ['shirazre_user', 'shirazre_permissions', 'shirazre_users', 'shirazre_creds'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [permissions, setPermissions] = useState<PermissionsConfig>(DEFAULT_PERMISSIONS);

  const clearLegacyStorage = () => {
    LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
  };

  const fetchSession = async () => {
    try {
      clearLegacyStorage();
      const me = await api<{ user: User; permissions: RolePermissions | null }>('/auth/me');
      setUser(upgradeLegacyUser(me.user));
      const all = await api<{ [key: string]: RolePermissions }>('/permissions');
      setPermissions(migratePermissionsFromStorage(all as Record<string, RolePermissions>));
      const u = await api<PaginatedResponse<User>>('/users?page=1&limit=200');
      setUsers(normalizeUsers(u.items));
    } catch (error) {
      console.error('Session fetch failed:', error);
      // If no token, clear user and any legacy user data
      if (!localStorage.getItem('shirazre_token')) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const payload = await api<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: normalizeEmail(email), password }),
      });
      setToken(payload.token);
      setUser(upgradeLegacyUser(payload.user));
      await fetchSession();
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Invalid email or password';
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearLegacyStorage();
    setUsers(DEFAULT_USERS);
    setPermissions(DEFAULT_PERMISSIONS);
  };

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

  const updatePermissions = async (config: PermissionsConfig) => {
    setPermissions(config);
    await api('/permissions', { method: 'PUT', body: JSON.stringify(config) });
  };

  const addUser = async (newUser: Omit<User, 'id'>, password: string) => {
    await api('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: newUser.name,
        email: normalizeEmail(newUser.email),
        role: migrateRole(newUser.role),
        password,
      }),
    });
    await fetchSession();
  };

  const updateUser = async (id: string, updates: Partial<Omit<User, 'id'>> & { password?: string }) => {
    await api(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...updates,
        email: updates.email ? normalizeEmail(updates.email) : undefined,
        role: updates.role ? migrateRole(updates.role) : undefined,
      }),
    });
    await fetchSession();
  };

  const removeUser = async (id: string) => {
    await api(`/users/${id}`, { method: 'DELETE' });
    await fetchSession();
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      users,
      permissions,
      login,
      logout,
      hasPageAccess,
      hasAction,
      hasDataAccess,
      updatePermissions,
      addUser,
      updateUser,
      removeUser,
      currentPermissions,
    }),
    [user, loading, users, permissions, currentPermissions]
  );

  return (
    <AuthContext.Provider
      value={value}
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
