import { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, Clock, UserPlus, FileText, Award, CheckCircle, XCircle, Search, ChevronDown, ChevronUp, Timer } from 'lucide-react';
import {
  defaultEmployees,
  defaultAttendance,
  defaultLeaveRequests,
  defaultLeaveBalances,
  defaultSalaryRecords,
  defaultShifts,
  type Employee,
  type AttendanceRecord,
  type LeaveRequest,
  type LeaveBalance,
  type SalaryRecord,
  type ShiftBlock,
} from '@/data/hrData';
import { toast } from 'sonner';

type Tab = 'employees' | 'attendance' | 'shifts' | 'leaves' | 'salary';

export default function HRManagement() {
  const [tab, setTab] = useState<Tab>('employees');
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('Shiraz Restaurant_employees');
    return saved ? JSON.parse(saved) : defaultEmployees;
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('Shiraz Restaurant_attendance');
    return saved ? JSON.parse(saved) : defaultAttendance;
  });
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('Shiraz Restaurant_leaves');
    return saved ? JSON.parse(saved) : defaultLeaveRequests;
  });
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(() => {
    const saved = localStorage.getItem('Shiraz Restaurant_leave_balances');
    return saved ? JSON.parse(saved) : defaultLeaveBalances;
  });
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>(() => {
    const saved = localStorage.getItem('Shiraz Restaurant_salary');
    return saved ? JSON.parse(saved) : defaultSalaryRecords;
  });
  const [shifts] = useState<ShiftBlock[]>(defaultShifts);
  const [search, setSearch] = useState('');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [showSalaryAdjust, setShowSalaryAdjust] = useState<string | null>(null);
  const [adjustBonus, setAdjustBonus] = useState('');
  const [adjustDeduction, setAdjustDeduction] = useState('');
  const [adjustLateFine, setAdjustLateFine] = useState('');

  useEffect(() => { localStorage.setItem('Shiraz Restaurant_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('Shiraz Restaurant_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('Shiraz Restaurant_leaves', JSON.stringify(leaveRequests)); }, [leaveRequests]);
  useEffect(() => { localStorage.setItem('Shiraz Restaurant_leave_balances', JSON.stringify(leaveBalances)); }, [leaveBalances]);
  useEffect(() => { localStorage.setItem('Shiraz Restaurant_salary', JSON.stringify(salaryRecords)); }, [salaryRecords]);

  const getEmployee = (id: string) => employees.find(e => e.id === id);

  const [newEmp, setNewEmp] = useState({ name: '', phone: '', email: '', role: '', department: 'Kitchen', salary: '' });

  const handleAddEmployee = () => {
    if (!newEmp.name || !newEmp.role || !newEmp.salary) return;
    const empId = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
    const emp: Employee = {
      id: Date.now().toString(),
      employeeId: empId,
      name: newEmp.name,
      phone: newEmp.phone,
      email: newEmp.email,
      role: newEmp.role,
      department: newEmp.department,
      joinDate: new Date().toISOString().split('T')[0],
      salary: parseInt(newEmp.salary),
      status: 'active',
    };
    setEmployees(prev => [...prev, emp]);
    setLeaveBalances(prev => [...prev, { employeeId: emp.id, sick: 8, casual: 6, annual: 10, emergency: 2 }]);
    setSalaryRecords(prev => [...prev, { id: Date.now().toString(), employeeId: emp.id, month: new Date().toISOString().slice(0, 7), baseSalary: emp.salary, bonus: 0, deductions: 0, lateFines: 0, netSalary: emp.salary, status: 'pending' }]);
    toast.success(`${emp.name} added as ${emp.role}`);
    setShowAddEmployee(false);
    setNewEmp({ name: '', phone: '', email: '', role: '', department: 'Kitchen', salary: '' });
  };

  const handleLeaveAction = (id: string, action: 'approved' | 'rejected') => {
    setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status: action } : l));
    toast.success(`Leave request ${action}`);
  };

  const handleSalaryAdjust = (empId: string) => {
    setSalaryRecords(prev => prev.map(s => {
      if (s.employeeId !== empId) return s;
      const bonus = parseInt(adjustBonus) || 0;
      const deductions = parseInt(adjustDeduction) || 0;
      const lateFines = parseInt(adjustLateFine) || 0;
      return { ...s, bonus, deductions, lateFines, netSalary: s.baseSalary + bonus - deductions - lateFines };
    }));
    toast.success('Salary adjustments saved');
    setShowSalaryAdjust(null);
    setAdjustBonus('');
    setAdjustDeduction('');
    setAdjustLateFine('');
  };

  const handleMarkPaid = (empId: string) => {
    setSalaryRecords(prev => prev.map(s => s.employeeId === empId ? { ...s, status: 'paid', paidOn: new Date().toISOString().split('T')[0] } : s));
    toast.success('Salary marked as paid');
  };

  const filteredEmployees = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.employeeId.toLowerCase().includes(search.toLowerCase()));

  const todayAttendance = attendance;
  const presentCount = todayAttendance.filter(a => a.status === 'present').length;
  const lateCount = todayAttendance.filter(a => a.status === 'late').length;
  const absentCount = todayAttendance.filter(a => a.status === 'absent').length;
  const totalSalary = salaryRecords.reduce((sum, s) => sum + s.netSalary, 0);

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'employees', label: 'Employees', icon: Users },
    { key: 'attendance', label: 'Attendance', icon: Calendar },
    { key: 'shifts', label: 'Shifts', icon: Timer },
    { key: 'leaves', label: 'Leaves', icon: FileText },
    { key: 'salary', label: 'Payroll', icon: DollarSign },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-serif text-xl font-bold text-foreground">HR, shifts & payroll</h1>
        <button onClick={() => setShowAddEmployee(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-secondary transition-colors">
          <UserPlus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="w-3.5 h-3.5" /> Total Staff</div>
          <p className="text-2xl font-bold text-foreground">{employees.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 text-primary text-xs mb-1"><CheckCircle className="w-3.5 h-3.5" /> Present Today</div>
          <p className="text-2xl font-bold text-primary">{presentCount}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 text-warning text-xs mb-1"><Clock className="w-3.5 h-3.5" /> Late</div>
          <p className="text-2xl font-bold text-warning">{lateCount}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><DollarSign className="w-3.5 h-3.5" /> Monthly Payroll</div>
          <p className="text-2xl font-bold text-foreground">Rs {totalSalary.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Employees Tab */}
      {tab === 'employees' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..." className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-sm" />
          </div>
          <div className="grid gap-2">
            {filteredEmployees.map(emp => {
              const expanded = expandedEmployee === emp.id;
              const bal = leaveBalances.find(l => l.employeeId === emp.id);
              return (
                <div key={emp.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <button onClick={() => setExpandedEmployee(expanded ? null : emp.id)} className="w-full p-4 flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{emp.name.split(' ').map(n => n[0]).join('')}</div>
                      <div>
                        <p className="font-medium text-foreground">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.employeeId} • {emp.role} • {emp.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${emp.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{emp.status}</span>
                      {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {expanded && (
                    <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-3">
                        <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground font-medium">{emp.phone}</span></div>
                        <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground font-medium">{emp.email}</span></div>
                        <div><span className="text-muted-foreground">Join Date:</span> <span className="text-foreground font-medium">{emp.joinDate}</span></div>
                        <div><span className="text-muted-foreground">Salary:</span> <span className="text-foreground font-medium">Rs {emp.salary.toLocaleString()}</span></div>
                      </div>
                      {bal && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">Leave Balances</p>
                          <div className="flex gap-2 flex-wrap">
                            <span className="text-xs bg-muted px-2 py-1 rounded-lg">Sick: {bal.sick}</span>
                            <span className="text-xs bg-muted px-2 py-1 rounded-lg">Casual: {bal.casual}</span>
                            <span className="text-xs bg-muted px-2 py-1 rounded-lg">Annual: {bal.annual}</span>
                            <span className="text-xs bg-muted px-2 py-1 rounded-lg">Emergency: {bal.emergency}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {tab === 'attendance' && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Today's Attendance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Present: {presentCount} • Late: {lateCount} • Absent: {absentCount} • On Leave: {todayAttendance.filter(a => a.status === 'leave').length}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Check In</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Check Out</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Hours</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Late (min)</th>
                </tr>
              </thead>
              <tbody>
                {todayAttendance.map(a => {
                  const emp = getEmployee(a.employeeId);
                  if (!emp) return null;
                  const statusColors: Record<string, string> = {
                    present: 'bg-primary/10 text-primary', late: 'bg-warning/10 text-warning',
                    absent: 'bg-destructive/10 text-destructive', leave: 'bg-muted text-muted-foreground', 'half-day': 'bg-orange-100 text-orange-700'
                  };
                  return (
                    <tr key={a.id} className="border-b border-border/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.role}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[a.status]}`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{a.checkIn || '—'}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{a.checkOut || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">{a.hoursWorked || '—'}</td>
                      <td className={`px-4 py-3 text-right font-medium ${a.lateMinutes > 0 ? 'text-warning' : 'text-muted-foreground'}`}>{a.lateMinutes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shifts Tab */}
      {tab === 'shifts' && (
        <div className="grid gap-3 md:grid-cols-3">
          {shifts.map(s => (
            <div key={s.id} className="bg-card rounded-2xl border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{s.label}</h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {s.start} – {s.end}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Supervisor: <span className="font-medium text-foreground">{s.supervisorName}</span>
              </p>
              <p className="text-xs text-muted-foreground">Staff on shift: {s.staffCount}</p>
              {s.notes && <p className="text-xs text-primary/80">{s.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Leaves Tab */}
      {tab === 'leaves' && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Leave Requests</h3>
          {leaveRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No leave requests</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {leaveRequests.map(lr => {
                const emp = getEmployee(lr.employeeId);
                const statusColors: Record<string, string> = { pending: 'bg-warning/10 text-warning', approved: 'bg-primary/10 text-primary', rejected: 'bg-destructive/10 text-destructive' };
                return (
                  <div key={lr.id} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-medium text-foreground">{emp?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground capitalize">{lr.type} leave • {lr.startDate} to {lr.endDate}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{lr.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[lr.status]}`}>{lr.status}</span>
                      {lr.status === 'pending' && (
                        <>
                          <button onClick={() => handleLeaveAction(lr.id, 'approved')} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => handleLeaveAction(lr.id, 'rejected')} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><XCircle className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Salary Tab */}
      {tab === 'salary' && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Monthly Payroll — {new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Base</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Bonus</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Deductions</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Late Fines</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Net Salary</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaryRecords.map(s => {
                  const emp = getEmployee(s.employeeId);
                  if (!emp) return null;
                  return (
                    <tr key={s.id} className="border-b border-border/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.role}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">Rs {s.baseSalary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-primary font-medium">{s.bonus > 0 ? `+${s.bonus.toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-3 text-right text-destructive font-medium">{s.deductions > 0 ? `-${s.deductions.toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-3 text-right text-warning font-medium">{s.lateFines > 0 ? `-${s.lateFines.toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">Rs {s.netSalary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'paid' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setShowSalaryAdjust(s.employeeId); setAdjustBonus(String(s.bonus || '')); setAdjustDeduction(String(s.deductions || '')); setAdjustLateFine(String(s.lateFines || '')); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Adjust"><Award className="w-3.5 h-3.5" /></button>
                          {s.status === 'pending' && (
                            <button onClick={() => handleMarkPaid(s.employeeId)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" title="Mark Paid"><CheckCircle className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-muted/50">
                  <td className="px-4 py-3 font-bold text-foreground" colSpan={5}>Total Payroll</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">Rs {totalSalary.toLocaleString()}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-foreground/30 flex items-center justify-center z-50 p-4" onClick={() => setShowAddEmployee(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-foreground">Add Employee</h3>
            <input value={newEmp.name} onChange={e => setNewEmp(p => ({ ...p, name: e.target.value }))} placeholder="Full name" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input value={newEmp.phone} onChange={e => setNewEmp(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="bg-background border border-border rounded-xl px-3 py-2 text-sm" />
              <input value={newEmp.email} onChange={e => setNewEmp(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="bg-background border border-border rounded-xl px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={newEmp.role} onChange={e => setNewEmp(p => ({ ...p, role: e.target.value }))} placeholder="Role (e.g. Waiter)" className="bg-background border border-border rounded-xl px-3 py-2 text-sm" />
              <select value={newEmp.department} onChange={e => setNewEmp(p => ({ ...p, department: e.target.value }))} className="bg-background border border-border rounded-xl px-3 py-2 text-sm">
                <option value="Kitchen">Kitchen</option>
                <option value="Front">Front</option>
                <option value="Management">Management</option>
              </select>
            </div>
            <input type="number" value={newEmp.salary} onChange={e => setNewEmp(p => ({ ...p, salary: e.target.value }))} placeholder="Monthly salary (Rs)" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddEmployee(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={handleAddEmployee} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-secondary">Add Employee</button>
            </div>
          </div>
        </div>
      )}

      {/* Salary Adjust Modal */}
      {showSalaryAdjust && (
        <div className="fixed inset-0 bg-foreground/30 flex items-center justify-center z-50 p-4" onClick={() => setShowSalaryAdjust(null)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-foreground">Adjust Salary — {getEmployee(showSalaryAdjust)?.name}</h3>
            <div>
              <label className="text-xs text-muted-foreground">Bonus (Rs)</label>
              <input type="number" value={adjustBonus} onChange={e => setAdjustBonus(e.target.value)} placeholder="0" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Deductions (Rs)</label>
              <input type="number" value={adjustDeduction} onChange={e => setAdjustDeduction(e.target.value)} placeholder="0" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Late Fines (Rs)</label>
              <input type="number" value={adjustLateFine} onChange={e => setAdjustLateFine(e.target.value)} placeholder="0" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm mt-1" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowSalaryAdjust(null)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={() => handleSalaryAdjust(showSalaryAdjust)} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-secondary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
