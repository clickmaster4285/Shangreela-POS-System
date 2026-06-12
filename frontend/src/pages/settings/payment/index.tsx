import { CreditCard, QrCode, Save, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api, getBackendOrigin, getToken } from '@/lib/api/api';
import { usePosRealtimeScopes } from '@/hooks/pos/use-pos-realtime';
import type { ReceiptPaymentDetails } from '@/utils/pos/printReceipt';

const resolveUploadUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${getBackendOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
};

export default function PaymentDetailsSettings() {
  const [config, setConfig] = useState<ReceiptPaymentDetails>({
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    iban: '',
    easypaisaNumber: '',
    easypaisaAccountName: '',
    bankQrImageUrl: '',
    easypaisaQrImageUrl: '',
    showBankOnReceipt: true,
    showEasypaisaOnReceipt: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'bank' | 'easypaisa' | null>(null);
  const [removing, setRemoving] = useState<'bank' | 'easypaisa' | null>(null);
  const bankQrRef = useRef<HTMLInputElement>(null);
  const easypaisaQrRef = useRef<HTMLInputElement>(null);

  const bankOn = config.showBankOnReceipt !== false;
  const easypaisaOn = config.showEasypaisaOnReceipt !== false;
  const bothOn = bankOn && easypaisaOn;

  const setBothOnReceipt = (enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      showBankOnReceipt: enabled,
      showEasypaisaOnReceipt: enabled,
    }));
  };

  const loadConfig = useCallback(() => {
    api<ReceiptPaymentDetails>('/settings/payment').then(setConfig).catch(() => {});
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  usePosRealtimeScopes(['settings'], loadConfig);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const saved = await api<ReceiptPaymentDetails>('/settings/payment', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      setConfig(saved);
      toast.success('Payment details saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save payment details');
    } finally {
      setSaving(false);
    }
  };

  const uploadQr = async (type: 'bank' | 'easypaisa', file: File) => {
    setUploading(type);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('qrImage', file);
      const token = getToken();
      const response = await fetch(`${getBackendOrigin()}/api/settings/payment/qr`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.message || 'QR upload failed');
      setConfig(body as ReceiptPaymentDetails);
      toast.success(`${type === 'bank' ? 'Bank' : 'EasyPaisa'} QR updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'QR upload failed');
    } finally {
      setUploading(null);
    }
  };

  const removeQr = async (type: 'bank' | 'easypaisa') => {
    setRemoving(type);
    try {
      const saved = await api<ReceiptPaymentDetails>(`/settings/payment/qr?type=${type}`, {
        method: 'DELETE',
      });
      setConfig(saved);
      toast.success(`${type === 'bank' ? 'Bank' : 'EasyPaisa'} QR removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove QR');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Payment details</h1>
        <p className="text-sm text-muted-foreground">
          Bank and EasyPaisa details shown on every printed bill. Upload QR codes for customers to scan and pay.
        </p>
      </div>

      <div className="pos-card p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={bothOn}
            onChange={(e) => setBothOnReceipt(e.target.checked)}
            className="w-4 h-4 text-primary border-border rounded focus:ring-primary/30"
          />
          Show payment details on every bill
        </label>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="pos-card p-4 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">Bank details</h3>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={bankOn}
                onChange={(e) => setConfig((prev) => ({ ...prev, showBankOnReceipt: e.target.checked }))}
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary/30"
              />
              Show on bills
            </label>
          </div>
          <input value={config.bankName || ''} onChange={(e) => setConfig((p) => ({ ...p, bankName: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="Bank name" />
          <input value={config.accountTitle || ''} onChange={(e) => setConfig((p) => ({ ...p, accountTitle: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="Account title" />
          <input value={config.accountNumber || ''} onChange={(e) => setConfig((p) => ({ ...p, accountNumber: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="Account number" />
          <input value={config.iban || ''} onChange={(e) => setConfig((p) => ({ ...p, iban: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="IBAN" />
          <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-3">
            {config.bankQrImageUrl ? (
              <div className="relative mx-auto w-28 h-28">
                <img src={resolveUploadUrl(config.bankQrImageUrl)} alt="Bank QR" className="w-full h-full object-contain border border-border rounded-lg bg-white p-1" />
                <button
                  type="button"
                  title="Remove bank QR"
                  disabled={removing === 'bank'}
                  onClick={() => void removeQr('bank')}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90 disabled:opacity-60"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="mx-auto w-28 h-28 rounded-lg border border-border bg-muted/30 flex items-center justify-center">
                <QrCode className="w-8 h-8 text-muted-foreground/40" />
              </div>
            )}
            <input ref={bankQrRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadQr('bank', file);
              e.target.value = '';
            }} />
            <button
              type="button"
              disabled={uploading === 'bank'}
              onClick={() => bankQrRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-bold uppercase tracking-wider hover:bg-muted/80 disabled:opacity-60"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading === 'bank' ? 'Uploading...' : 'Upload bank QR'}
            </button>
          </div>
        </div>

        <div className="pos-card p-4 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">EasyPaisa details</h3>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={easypaisaOn}
                onChange={(e) => setConfig((prev) => ({ ...prev, showEasypaisaOnReceipt: e.target.checked }))}
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary/30"
              />
              Show on bills
            </label>
          </div>
          <input value={config.easypaisaAccountName || ''} onChange={(e) => setConfig((p) => ({ ...p, easypaisaAccountName: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="Account / merchant name" />
          <input value={config.easypaisaNumber || ''} onChange={(e) => setConfig((p) => ({ ...p, easypaisaNumber: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="Mobile number" />
          <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-3">
            {config.easypaisaQrImageUrl ? (
              <div className="relative mx-auto w-28 h-28">
                <img src={resolveUploadUrl(config.easypaisaQrImageUrl)} alt="EasyPaisa QR" className="w-full h-full object-contain border border-border rounded-lg bg-white p-1" />
                <button
                  type="button"
                  title="Remove EasyPaisa QR"
                  disabled={removing === 'easypaisa'}
                  onClick={() => void removeQr('easypaisa')}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90 disabled:opacity-60"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="mx-auto w-28 h-28 rounded-lg border border-border bg-muted/30 flex items-center justify-center">
                <QrCode className="w-8 h-8 text-muted-foreground/40" />
              </div>
            )}
            <input ref={easypaisaQrRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadQr('easypaisa', file);
              e.target.value = '';
            }} />
            <button
              type="button"
              disabled={uploading === 'easypaisa'}
              onClick={() => easypaisaQrRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-bold uppercase tracking-wider hover:bg-muted/80 disabled:opacity-60"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading === 'easypaisa' ? 'Uploading...' : 'Upload EasyPaisa QR'}
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={() => void saveConfig()}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save payment settings'}
      </button>
    </div>
  );
}
