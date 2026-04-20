import React from 'react';

interface BillingStatsProps {
  filteredOrdersCount: number;
  totalOrdersCount: number;
  filteredPendingCount: number;
  totalPendingCount: number;
  filteredPaidCount: number;
  totalPaidCount: number;
  isFilterActive: boolean;
}

export const BillingStats: React.FC<BillingStatsProps> = ({
  filteredOrdersCount,
  totalOrdersCount,
  filteredPendingCount,
  totalPendingCount,
  filteredPaidCount,
  totalPaidCount,
  isFilterActive,
}) => {
  return (
    <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="pos-card">
        <p className="text-xs text-muted-foreground">Total Bills</p>
        <p className="text-2xl font-bold text-foreground mt-1">
          {filteredOrdersCount}
          {isFilterActive && totalOrdersCount !== filteredOrdersCount ? ` / ${totalOrdersCount}` : ''}
        </p>
      </div>
      <div className="pos-card">
        <p className="text-xs text-muted-foreground">Pending</p>
        <p className="text-2xl font-bold text-warning mt-1">
          {filteredPendingCount}
          {isFilterActive && totalPendingCount !== filteredPendingCount ? ` / ${totalPendingCount}` : ''}
        </p>
      </div>
      <div className="pos-card">
        <p className="text-xs text-muted-foreground">Paid</p>
        <p className="text-2xl font-bold text-success mt-1">
          {filteredPaidCount}
          {isFilterActive && totalPaidCount !== filteredPaidCount ? ` / ${totalPaidCount}` : ''}
        </p>
      </div>
    </div>
  );
};
