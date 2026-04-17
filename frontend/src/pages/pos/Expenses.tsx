import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Trash2, Plus, Calendar, Filter, List, LayoutGrid, Pencil, X } from 'lucide-react';
import { api } from '@/lib/api';
import { usePosRealtimeScopes } from '@/hooks/use-pos-realtime';
import { useSubmitLock } from '@/hooks/use-submit-lock';

type ExpenseCategory = 'supplies' | 'utilities' | 'rent' | 'wages' | 'maintenance' | 'other';
type PaymentMethod = 'cash' | 'bank' | 'check';
type PaymentStatus = 'paid' | 'unpaid' | 'half';

interface Expense {
  id?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes: string;
  vendor: string;
  receiptFile?: string;
}

interface ExpensesResponse {
  items: Expense[];
  pagination?: {
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const categoryColors: Record<ExpenseCategory, string> = {
  supplies: 'bg-primary/10 text-primary border-primary/20',
  utilities: 'bg-warning/10 text-warning border-warning/20',
  rent: 'bg-destructive/10 text-destructive border-destructive/20',
  wages: 'bg-success/10 text-success border-success/20',
  maintenance: 'bg-secondary/10 text-secondary border-secondary/20',
  other: 'bg-muted text-muted-foreground border-border',
};

const categoryLabels: Record<ExpenseCategory, string> = {
  supplies: 'Supplies',
  utilities: 'Utilities',
  rent: 'Rent',
  wages: 'Wages',
  maintenance: 'Maintenance',
  other: 'Other',
};

const paymentStatusLabel: Record<PaymentStatus, string> = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  half: 'Half Paid',
};

const paymentStatusCardColors: Record<PaymentStatus, string> = {
  paid: 'border-success/40 bg-success/5',
  half: 'border-warning/40 bg-warning/5',
  unpaid: 'border-destructive/40 bg-destructive/5',
};

export default function Expenses() {
  const { isLocked, runLocked } = useSubmitLock();
  const getDefaultForm = useCallback(
    (): Expense => ({
      category: 'supplies',
      description: '',
      amount: 0,
      paymentStatus: 'paid',
      paidAmount: 0,
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
      vendor: '',
    }),
    []
  );
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [form, setForm] = useState<Expense>(getDefaultForm);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [selectedReceiptFileName, setSelectedReceiptFileName] = useState<string>('');
  const [selectedReceiptIsImage, setSelectedReceiptIsImage] = useState(false);
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const uploadHost = apiBase.replace(/\/api$/, '');
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ hasNext: false, hasPrev: false });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchExpenses = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12', from: startDate, to: endDate });
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      const response = await api<ExpensesResponse>(`/expenses?${params.toString()}`);
      setExpenses(response.items || []);
      setMeta({ hasNext: response.pagination?.hasNext || false, hasPrev: response.pagination?.hasPrev || false });
    } catch (error) {
      toast.error('Failed to load expenses');
    }
  }, [page, startDate, endDate, categoryFilter]);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, categoryFilter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  usePosRealtimeScopes(['expenses', 'dashboard'], () => {
    void fetchExpenses();
  });

  const getReceiptUrl = (filePath: string) => {
    if (!filePath) return '';
    return filePath.startsWith('http') ? filePath : `${uploadHost}${filePath}`;
  };

  const isImageReceipt = (filePath: string) => /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(filePath);
  const isPdfReceipt = (filePath: string) => /\.pdf$/i.test(filePath);

  const openReceiptPreview = (filePath: string, name: string) => {
    setSelectedReceiptUrl(getReceiptUrl(filePath));
    setSelectedReceiptFileName(name || 'Receipt Preview');
    setSelectedReceiptIsImage(isImageReceipt(filePath));
  };

  const closeReceiptPreview = () => {
    setSelectedReceiptUrl(null);
    setSelectedReceiptFileName('');
    setSelectedReceiptIsImage(false);
  };

  const openCreateForm = () => {
    setEditingExpenseId(null);
    setForm(getDefaultForm());
    setReceiptFile(null);
    setShowForm(true);
  };

  const openEditForm = (expense: Expense) => {
    setEditingExpenseId(expense.id || null);
    setForm({
      ...expense,
      paymentDate: expense.paymentDate ? String(expense.paymentDate).split('T')[0] : new Date().toISOString().split('T')[0],
      paymentStatus: expense.paymentStatus || 'paid',
      paidAmount: Number(expense.paidAmount || 0),
    });
    setReceiptFile(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingExpenseId(null);
    setReceiptFile(null);
    setForm(getDefaultForm());
  };

  const handleSubmit = async () => {
    if (!form.description || form.amount <= 0) {
      toast.error('Please fill all required fields');
      return;
    }
    await runLocked('expense-submit', async () => {
      const body = new FormData();
      body.append('category', form.category);
      body.append('description', form.description);
      body.append('amount', String(form.amount));
      body.append('paymentStatus', form.paymentStatus);
      body.append('paidAmount', String(form.paidAmount));
      body.append('paymentMethod', form.paymentMethod);
      body.append('paymentDate', form.paymentDate);
      body.append('notes', form.notes);
      body.append('vendor', form.vendor);
      if (receiptFile) body.append('receiptFile', receiptFile);

      await api(editingExpenseId ? `/expenses/${editingExpenseId}` : '/expenses', {
        method: editingExpenseId ? 'PATCH' : 'POST',
        body,
      });
      toast.success(editingExpenseId ? 'Expense updated' : 'Expense added');
      closeForm();
      fetchExpenses();
    }).catch(() => {
      toast.error(editingExpenseId ? 'Failed to update expense' : 'Failed to add expense');
    });
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id || !confirm('Delete this expense?')) return;
    try {
      await api(`/expenses/${id}`, { method: 'DELETE' });
      toast.success('Expense deleted');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track and manage business expenses.</p>
        </div>
        <button
          onClick={openCreateForm}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium flex items-center gap-2 hover:bg-secondary transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 items-center bg-card border border-border rounded-xl p-2">
          <label className="text-xs font-medium text-muted-foreground">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-background border border-border rounded-lg px-2 py-1 text-xs"
          />
          <label className="text-xs font-medium text-muted-foreground">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-background border border-border rounded-lg px-2 py-1 text-xs"
          />
        </div>

        <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
          {(['all', 'supplies', 'utilities', 'rent', 'wages', 'maintenance', 'other'] as const).map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${categoryFilter === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {c === 'all' ? 'All' : categoryLabels[c as ExpenseCategory]}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
          {([
            { value: 'grid', label: 'Grid', icon: LayoutGrid },
            { value: 'list', label: 'List', icon: List },
          ] as const).map(mode => (
            <button
              key={mode.value}
              onClick={() => setViewMode(mode.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === mode.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <span className="inline-flex items-center gap-1">
                <mode.icon className="w-3.5 h-3.5" />
                {mode.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="pos-card">
          <p className="text-xs text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-bold text-foreground mt-1">Rs. {totalExpense.toLocaleString()}</p>
        </div>
        <div className="pos-card">
          <p className="text-xs text-muted-foreground">Expense Count</p>
          <p className="text-2xl font-bold text-foreground mt-1">{expenses.length}</p>
        </div>
        <div className="pos-card">
          <p className="text-xs text-muted-foreground">Average Expense</p>
          <p className="text-2xl font-bold text-foreground mt-1">Rs. {expenses.length ? Math.round(totalExpense / expenses.length).toLocaleString() : 0}</p>
        </div>
      </div>

      {/* Expenses */}
      {viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenses.map((expense, i) => (
            <div
              key={expense.id || i}
              className={`pos-card space-y-3 border ${paymentStatusCardColors[expense.paymentStatus || 'paid']}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-foreground text-sm">{expense.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{categoryLabels[expense.category]} • {expense.vendor}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border font-medium ${categoryColors[expense.category]}`}>
                  {categoryLabels[expense.category]}
                </span>
              </div>
              <div className="text-lg font-bold text-foreground">Rs. {expense.amount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>📅 {new Date(expense.paymentDate).toLocaleDateString()}</p>
                <p>💳 {expense.paymentMethod}</p>
                <p>📌 {paymentStatusLabel[expense.paymentStatus || 'paid']} {expense.paymentStatus === 'half' ? `• Paid Rs. ${(expense.paidAmount || 0).toLocaleString()}` : ''}</p>
                {expense.notes && <p>📝 {expense.notes}</p>}
                {expense.receiptFile && (
                  <button
                    type="button"
                    onClick={() => openReceiptPreview(expense.receiptFile!, expense.description)}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    Preview Receipt
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openEditForm(expense)}
                  className="py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/15 transition-colors flex items-center justify-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/15 transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pos-card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Description</th>
                <th className="px-3 py-3 font-medium">Vendor</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Payment</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Receipt</th>
                <th className="px-3 py-3 font-medium text-right">Amount</th>
                <th className="px-3 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, i) => (
                <tr key={expense.id || i} className="border-b border-border/50 last:border-0 hover:bg-muted/10">
                  <td className="px-3 py-3 text-sm text-foreground">{categoryLabels[expense.category]}</td>
                  <td className="px-3 py-3 text-sm text-foreground">{expense.description}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{expense.vendor}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{new Date(expense.paymentDate).toLocaleDateString()}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{expense.paymentMethod}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">
                    {paymentStatusLabel[expense.paymentStatus || 'paid']}
                    {expense.paymentStatus === 'half' ? ` (Rs. ${(expense.paidAmount || 0).toLocaleString()})` : ''}
                  </td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">
                    {expense.receiptFile ? (
                      <button
                        type="button"
                        onClick={() => openReceiptPreview(expense.receiptFile!, expense.description)}
                        className="text-primary underline"
                      >
                        Preview
                      </button>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-foreground">Rs. {expense.amount.toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(expense)}
                        className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/15 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="rounded-lg bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/15 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <p className="font-semibold text-foreground">{selectedReceiptFileName}</p>
                <p className="text-xs text-muted-foreground">Preview on the same screen</p>
              </div>
              <button
                type="button"
                onClick={closeReceiptPreview}
                className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
              >
                Close
              </button>
            </div>
            <div className="max-h-[calc(90vh-70px)] overflow-auto p-5">
              {selectedReceiptIsImage ? (
                <img
                  src={selectedReceiptUrl}
                  alt="Receipt Preview"
                  className="mx-auto max-h-[80vh] w-full max-w-full rounded-2xl object-contain"
                />
              ) : isPdfReceipt(selectedReceiptUrl) ? (
                <iframe
                  src={selectedReceiptUrl}
                  title="Receipt Preview"
                  className="h-[80vh] w-full rounded-2xl border border-border"
                />
              ) : (
                <div className="rounded-2xl border border-border bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                  Preview not available for this file type.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Close expense form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
            />
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value as ExpenseCategory })}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
            >
              {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input
              type="number"
              placeholder="Amount (Rs)"
              value={form.amount}
              onChange={e => {
                const amount = Number(e.target.value);
                const nextAmount = Number.isFinite(amount) ? amount : 0;
                setForm(prev => ({
                  ...prev,
                  amount: nextAmount,
                  paidAmount:
                    prev.paymentStatus === 'paid'
                      ? nextAmount
                      : prev.paymentStatus === 'unpaid'
                        ? 0
                        : Math.min(prev.paidAmount, Math.max(0, nextAmount)),
                }));
              }}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
            />
            <select
              value={form.paymentStatus}
              onChange={e => {
                const paymentStatus = e.target.value as PaymentStatus;
                setForm(prev => ({
                  ...prev,
                  paymentStatus,
                  paidAmount:
                    paymentStatus === 'paid'
                      ? prev.amount
                      : paymentStatus === 'unpaid'
                        ? 0
                        : prev.paidAmount > 0
                          ? Math.min(prev.paidAmount, Math.max(0, prev.amount))
                          : Math.max(0, prev.amount) / 2,
                }));
              }}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
            >
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="half">Half Paid</option>
            </select>
            {form.paymentStatus === 'half' && (
              <input
                type="number"
                placeholder="Paid Amount (Rs)"
                value={form.paidAmount}
                min={0}
                max={form.amount || 0}
                onChange={e =>
                  setForm({
                    ...form,
                    paidAmount: Math.min(Math.max(0, Number(e.target.value) || 0), Math.max(0, form.amount)),
                  })
                }
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
              />
            )}
            <input
              type="text"
              placeholder="Vendor"
              value={form.vendor}
              onChange={e => setForm({ ...form, vendor: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={form.paymentDate}
              onChange={e => setForm({ ...form, paymentDate: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
            />
              {receiptFile && <p className="text-xs text-muted-foreground">Selected: {receiptFile.name}</p>}
            <select
              value={form.paymentMethod}
              onChange={e => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="check">Check</option>
            </select>
            <textarea
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
            />
            <label className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="text-xs font-medium text-foreground">Upload receipt image</span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
                className="file:border-0 file:bg-primary/10 file:text-primary file:px-3 file:py-2 file:rounded-xl file:font-medium text-sm text-foreground"
              />
              {receiptFile && <p className="text-xs text-muted-foreground">Selected: {receiptFile.name}</p>}
            </label>
            <div className="flex gap-2">
              <button
                onClick={closeForm}
                className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLocked('expense-submit')}
                className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-secondary"
              >
                {isLocked('expense-submit') ? 'Saving...' : editingExpenseId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
