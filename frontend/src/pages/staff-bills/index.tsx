import { useState, useMemo } from 'react';
import { Users, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatOrderDateTime, groupOrdersByCalendarDay } from '@/utils/common/formatOrderDateTime';
import { POSFilterBar } from '@/components/pos/POSFilterBar';
import { MAX_LIST_LIMIT } from '@/lib/api/paginatedFetch';
import type { PaginatedResponse } from '@/lib/api/api';
import { toast } from 'sonner';

type StaffSummary = {
  _id: string;
  name: string;
  role: string;
  pendingCount: number;
  pendingTotal: number;
  paidCount: number;
  paidTotal: number;
  lastOrderDate: string;
};

type StaffBill = {
  _id: string;
  code: string;
  type: string;
  total: number;
  status: string;
  staffBillPaid: boolean;
  createdAt: string;
  items: any[];
  staffMember?: { _id: string; name: string; role: string };
};

const formatPKR = (value: number) => `Rs. ${value.toLocaleString()}`;

export default function StaffBills() {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedCashier, setSelectedCashier] = useState('all');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('pending');
  const queryClient = useQueryClient();

  const floorsQuery = useQuery({
    queryKey: ['floors-list'],
    queryFn: () =>
      api<PaginatedResponse<{ key: string; name: string }>>(`/floors?page=1&limit=${MAX_LIST_LIMIT}`),
  });
  const floorsData = floorsQuery.data?.items ?? [];

  // Fetch HR employees for staff list
  const staffUsersQuery = useQuery({
    queryKey: ['hr-employees'],
    queryFn: () => api<PaginatedResponse<{ id: string; name: string; role: string; status: string }>>('/hr/employees?limit=100'),
  });
  const staffUsers = staffUsersQuery.data?.items?.filter(e => e.status !== 'inactive') ?? [];

  // Fetch staff summary
  const staffSummaryQuery = useQuery({
    queryKey: ['staff-summary'],
    queryFn: () => api<{ staff: StaffSummary[] }>('/orders/staff-summary'),
  });
  const staffSummary = staffSummaryQuery.data?.staff ?? [];

  // Fetch staff bills for selected staff
  const staffBillsQuery = useQuery({
    queryKey: ['staff-bills', selectedStaffId, statusFilter, startDate, endDate],
    queryFn: async () => {
      if (!selectedStaffId) return { items: [], pagination: { page: 1, pages: 0, total: 0, limit: 10 } };
      const params = new URLSearchParams({
        employeeId: selectedStaffId,
        status: statusFilter,
        from: startDate,
        to: endDate,
        limit: '100',
      });
      return api<PaginatedResponse<StaffBill>>(`/orders/staff-bills?${params.toString()}`);
    },
    enabled: !!selectedStaffId,
  });
  const staffBills = staffBillsQuery.data?.items ?? [];

  // Group bills by day
  const billsByDay = useMemo(() => {
    return groupOrdersByCalendarDay(staffBills.map(b => ({
      ...b,
      id: b.code,
      createdAt: b.createdAt || new Date().toISOString(),
    })));
  }, [staffBills]);

  const selectedStaff = staffSummary.find(s => s._id === selectedStaffId);

  const handleMarkPaid = async (orderId: string) => {
    try {
      await api(`/orders/${orderId}/mark-staff-paid`, { method: 'PATCH' });
      toast.success('Bill marked as paid');
      queryClient.invalidateQueries({ queryKey: ['staff-bills'] });
      queryClient.invalidateQueries({ queryKey: ['staff-summary'] });
    } catch (error) {
      toast.error('Failed to mark as paid');
    }
  };

  const totalPending = useMemo(() => staffSummary.reduce((s, st) => s + st.pendingTotal, 0), [staffSummary]);
  const totalPendingCount = useMemo(() => staffSummary.reduce((s, st) => s + st.pendingCount, 0), [staffSummary]);

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-0 flex-col gap-4 overflow-hidden">
      <div className="shrink-0">
        <h1 className="font-serif text-2xl font-bold text-foreground">Staff Bills</h1>
        <p className="text-sm text-muted-foreground">Track and manage bills assigned to staff members.</p>
      </div>

      <POSFilterBar
        searchQuery=""
        onSearchChange={() => {}}
        hideSearch={true}
        floors={floorsData}
        selectedFloor={selectedFloor}
        onFloorChange={setSelectedFloor}
        selectedCashier={selectedCashier}
        onCashierChange={setSelectedCashier}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
      />

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4 shrink-0">
        <div className="pos-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending Bills</p>
            <p className="font-serif text-xl font-bold text-foreground">{totalPendingCount}</p>
          </div>
        </div>
        <div className="pos-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Pending Amount</p>
            <p className="font-serif text-xl font-bold text-foreground">{formatPKR(totalPending)}</p>
          </div>
        </div>
        <div className="pos-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Staff Members</p>
            <p className="font-serif text-xl font-bold text-foreground">{staffSummary.length}</p>
          </div>
        </div>
      </div>

      {/* Main Content: 2-panel layout */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Left Panel - Staff List */}
        <div className="pos-card flex min-h-0 flex-col overflow-hidden p-4">
          <h3 className="mb-3 shrink-0 font-semibold text-sm text-foreground">Staff Members</h3>
          
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border mb-3 shrink-0">
            {(['pending', 'paid', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  statusFilter === f
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
            {staffSummary.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground/20 mb-4" />
                <h3 className="text-base font-bold text-foreground mb-2">No Staff Bills</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[260px]">
                  Assign orders to staff members from the Billing page to track their bills here.
                </p>
              </div>
            )}

            {staffSummary
              .filter(staff => {
                if (statusFilter === 'pending') return staff.pendingCount > 0;
                if (statusFilter === 'paid') return staff.paidCount > 0;
                return true;
              })
              .map(staff => (
                <button
                  key={staff._id}
                  onClick={() => setSelectedStaffId(staff._id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedStaffId === staff._id
                      ? 'bg-primary/10 border-primary/30 shadow-sm ring-1 ring-primary/15'
                      : 'bg-muted/30 border-border hover:bg-muted/60 hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{staff.name}</p>
                      <p className="text-[11px] text-muted-foreground">{staff.role}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    {staff.pendingCount > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-warning font-bold">Pending</span>
                        <span className="text-[10px] font-black text-warning">{staff.pendingCount}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] font-bold text-foreground">{formatPKR(staff.pendingTotal)}</span>
                      </div>
                    )}
                    {staff.paidCount > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-success font-bold">Paid</span>
                        <span className="text-[10px] font-black text-success">{staff.paidCount}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Right Panel - Selected Staff's Bills */}
        <div className="pos-card flex min-h-0 flex-col overflow-hidden p-4">
          {!selectedStaffId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <Users className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-serif font-bold text-foreground">Select a Staff Member</h3>
              <p className="text-sm text-muted-foreground max-w-[260px] mt-1 leading-relaxed">
                Click on a staff member from the list to view their bills.
              </p>
            </div>
          ) : (
            <>
              {/* Staff Header */}
              <div className="mb-4 shrink-0 border-b border-border pb-4">
                <h3 className="font-serif text-lg font-bold text-foreground">{selectedStaff?.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedStaff?.role}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-warning">Pending</p>
                    <p className="text-lg font-black text-foreground">{selectedStaff?.pendingCount ?? 0}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">{formatPKR(selectedStaff?.pendingTotal ?? 0)}</p>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-success">Paid</p>
                    <p className="text-lg font-black text-foreground">{selectedStaff?.paidCount ?? 0}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">{formatPKR(selectedStaff?.paidTotal ?? 0)}</p>
                  </div>
                </div>
              </div>

              {/* Bills List */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-thin">
                {billsByDay.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground/20 mb-4" />
                    <h3 className="text-base font-bold text-foreground mb-2">No bills found</h3>
                    <p className="text-[13px] text-muted-foreground">
                      No {statusFilter !== 'all' ? statusFilter : ''} bills for this staff member in the selected date range.
                    </p>
                  </div>
                )}

                {billsByDay.map(group => (
                  <div key={group.dayKey} className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 border-b border-border/60 pb-1">
                      {group.dayLabel}
                    </p>
                    {group.orders.map((bill: any) => (
                      <div
                        key={bill.id || bill._id}
                        className={`p-3 rounded-xl border transition-all ${
                          bill.staffBillPaid
                            ? 'bg-success/5 border-success/20'
                            : 'bg-warning/5 border-warning/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{bill.id || bill.code}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatOrderDateTime(bill.createdAt)} • <span className="capitalize">{bill.type}</span> • {bill.items?.length || 0} items
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">{formatPKR(bill.total)}</p>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              bill.staffBillPaid
                                ? 'bg-success/15 text-success'
                                : 'bg-warning/15 text-warning'
                            }`}>
                              {bill.staffBillPaid ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                        </div>
                        {!bill.staffBillPaid && (
                          <button
                            onClick={() => handleMarkPaid(bill._id)}
                            className="mt-2 w-full py-2 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-all active:scale-[0.98]"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
