import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel, 
  AlertDialogAction 
} from '@/components/ui/alert-dialog';
import { useOrderStore } from '@/stores/pos/orderStore';
import { api } from '@/lib/api/api';
import { toast } from 'sonner';

interface CancelOrderDialogProps {
  onSuccess: () => void;
}

export function CancelOrderDialog({ onSuccess }: CancelOrderDialogProps) {
  const { cancellingOrderId, setCancellingOrderId } = useOrderStore();

  const handleConfirm = async () => {
    if (!cancellingOrderId) return;
    try {
      await api(`/orders/${cancellingOrderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      });
      toast.success('Order cancelled');
      setCancellingOrderId(null);
      onSuccess();
    } catch {
      toast.error('Failed to cancel order');
    }
  };

  return (
    <AlertDialog open={!!cancellingOrderId} onOpenChange={(open) => !open && setCancellingOrderId(null)}>
      <AlertDialogContent className="rounded-3xl border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Cancel Order</AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-medium text-muted-foreground">
            Are you sure you want to cancel this order? This action will remove it from the active list and cannot be reversed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3 mt-4">
          <AlertDialogCancel className="rounded-xl border-border font-bold uppercase tracking-widest text-[10px]">Go Back</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="rounded-xl bg-destructive text-destructive-foreground font-black uppercase tracking-widest text-[10px] hover:bg-destructive/90"
          >
            Confirm Cancellation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

