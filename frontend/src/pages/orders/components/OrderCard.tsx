import { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  User, 
  ChefHat, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Truck
} from 'lucide-react';
import { useOrderStore } from '@/stores/pos/orderStore';
import { TableInfo } from '@/data/pos/mockData';

interface OrderCardProps {
  order: any;
  onUpdateStatus: (id: string, status: string) => void;
  tables?: TableInfo[];
}

export const OrderCard = memo(({ order, onUpdateStatus, tables = [] }: OrderCardProps) => {
  const { setEditingOrder, setCancellingOrderId, setSwitchingTableOrder } = useOrderStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'preparing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ready': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'completed': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      case 'cancelled': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dine-in': return <MapPin className="w-3.5 h-3.5" />;
      case 'takeaway': return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'delivery': return <Truck className="w-3.5 h-3.5" />;
      default: return <ShoppingBag className="w-3.5 h-3.5" />;
    }
  };

  const getTableName = (tableIdentifier: number | string) => {
    // If it's a string and not a number, it's already a name
    if (typeof tableIdentifier === 'string' && isNaN(Number(tableIdentifier))) {
      return tableIdentifier;
    }
    const table = tables.find(t => t.id === Number(tableIdentifier));
    return table ? table.name : `Table ${tableIdentifier}`;
  };

  return (
    <div className="group bg-card rounded-2xl border border-border/50 p-4 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-foreground uppercase tracking-tight">#{order.id}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
            <Clock className="w-3 h-3" />
            {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : '—'}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditingOrder(order)}
            className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
            title="Edit Order"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <div className="relative group/menu">
            <button className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-all">
              <MoreVertical className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden">
               {order.status === 'pending' && (
                 <button 
                  onClick={() => onUpdateStatus(order.dbId, 'preparing')}
                  className="w-full px-4 py-2.5 text-xs text-left hover:bg-muted flex items-center gap-2 text-foreground font-semibold"
                 >
                   <ChefHat className="w-3.5 h-3.5" /> Start Preparing
                 </button>
               )}
               {order.status === 'preparing' && (
                 <button 
                  onClick={() => onUpdateStatus(order.dbId, 'ready')}
                  className="w-full px-4 py-2.5 text-xs text-left hover:bg-muted flex items-center gap-2 text-foreground font-semibold"
                 >
                   <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Ready
                 </button>
               )}
               {order.type === 'dine-in' && (
                 <button 
                  onClick={() => setSwitchingTableOrder(order)}
                  className="w-full px-4 py-2.5 text-xs text-left hover:bg-muted flex items-center gap-2 text-foreground font-semibold"
                 >
                   <RefreshCcw className="w-3.5 h-3.5" /> Switch Table
                 </button>
               )}
               <button 
                onClick={() => setCancellingOrderId(order.dbId)}
                className="w-full px-4 py-2.5 text-xs text-left hover:bg-red-500/10 text-red-500 flex items-center gap-2 font-bold"
               >
                 <Trash2 className="w-3.5 h-3.5" /> Cancel Order
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4 min-h-[4rem]">
        {order.items.slice(0, 2).map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0 w-5 h-5 rounded bg-muted flex items-center justify-center font-bold text-[10px]">{item.quantity}x</span>
              <span className="truncate font-semibold text-foreground">{item.menuItem.name}</span>
            </div>
            <span className="shrink-0 text-muted-foreground font-medium">Rs. {(item.menuItem.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        {order.items.length > 2 && (
          <p className="text-[10px] text-primary font-black uppercase tracking-widest pt-1">
            + {order.items.length - 2} more items
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-border/50 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 text-[10px] font-black text-primary uppercase tracking-widest w-fit">
            {getTypeIcon(order.type)}
            {order.type === 'dine-in' ? getTableName(order.table) : order.type}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold mt-1.5 ml-1">
            <User className="w-2.5 h-2.5" />
            {order.orderTaker || 'Cashier'}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">Total</p>
          <p className="text-sm font-black text-foreground tracking-tighter">Rs. {order.total.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
});

OrderCard.displayName = 'OrderCard';

