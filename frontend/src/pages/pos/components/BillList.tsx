import React from 'react';
import { Printer } from 'lucide-react';
import type { Order, TableInfo } from '@/data/mockData';

interface BillListProps {
  billsByDay: { dayKey: string; dayLabel: string; orders: (Order & { dbId?: string })[] }[];
  selectedOrderId?: string;
  onSelectOrder: (order: Order & { dbId?: string }) => void;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  tableMap: Map<number, TableInfo>;
  grandTotalForBillCard: (o: Order & { dbId?: string }) => number;
  getStatusBadgeClass: (o: Order & { printed?: boolean }) => string;
  getBillStatusLabel: (o: Order & { printed?: boolean }) => string;
  formatOrderDateTime: (date: string) => string;
}

export const BillList: React.FC<BillListProps> = ({
  billsByDay,
  selectedOrderId,
  onSelectOrder,
  hasMore,
  loading,
  onLoadMore,
  tableMap,
  grandTotalForBillCard,
  getStatusBadgeClass,
  getBillStatusLabel,
  formatOrderDateTime,
}) => {
  return (
    <div className="pos-card flex min-h-0 flex-col overflow-hidden p-3.5 shadow-sm">
      <h3 className="mb-3 shrink-0 px-1 font-semibold text-sm text-foreground">Bills by day</h3>
      
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-thin">
        {billsByDay.map(group => (
          <div key={group.dayKey} className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 border-b border-border/60 pb-1">
              {group.dayLabel}
            </p>
            {group.orders.map(o => (
              <button key={o.id} onClick={() => onSelectOrder(o)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedOrderId === o.id
                    ? 'bg-primary/10 border-primary/30 shadow-sm ring-1 ring-primary/15'
                    : 'bg-muted/30 border-border hover:bg-muted/60 hover:border-primary/30'
                }`}
              >
                <div className="flex justify-between gap-4">
                  <span className="font-medium text-sm text-foreground">{o.id}</span>
                  <div className="text-right">
                    <p className="text-xs text-foreground font-bold uppercase tracking-[0.2em]">Bill</p>
                    <p className="text-base font-bold text-foreground">Rs. {grandTotalForBillCard(o).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{formatOrderDateTime(o.createdAt)}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground capitalize">{o.type}</span>
                  {o.table && (
                    <>
                      <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                        {tableMap.get(o.table)?.name || `Table ${o.table}`}
                      </span>
                      {tableMap.get(o.table)?.floorId && (
                        <span className="bg-secondary/20 text-secondary px-2 py-0.5 rounded-full text-xs font-bold">
                          {tableMap.get(o.table)?.floorId}
                        </span>
                      )}
                    </>
                  )}
                </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${getStatusBadgeClass(o)}`}>
                    {getBillStatusLabel(o)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ))}
        {hasMore && (
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-50"
           >
            {loading ? 'Loading...' : 'Load More Bills'}
          </button>
        )}
        {billsByDay.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Printer className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No orders found for the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
