export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  department: string;
  joinDate: string;
  salary: number;
  status: 'active' | 'inactive';
  avatar?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'leave';
  hoursWorked: number;
  lateMinutes: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'sick' | 'casual' | 'annual' | 'emergency';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  month: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  lateFines: number;
  netSalary: number;
  status: 'pending' | 'paid';
  paidOn?: string;
}

export interface LeaveBalance {
  employeeId: string;
  sick: number;
  casual: number;
  annual: number;
  emergency: number;
}

export interface ShiftBlock {
  id: string;
  label: string;
  start: string;
  end: string;
  supervisorName: string;
  staffCount: number;
  notes?: string;
}

const today = new Date().toISOString().split('T')[0];

export const defaultEmployees: Employee[] = [
  { id: '1', employeeId: 'EMP-001', name: 'Muhammad Ali', phone: '0300-1111111', email: 'ali@shirazre.com', role: 'Head Chef', department: 'Kitchen', joinDate: '2022-01-15', salary: 80000, status: 'active' },
  { id: '2', employeeId: 'EMP-002', name: 'Ahmed Hassan', phone: '0301-2222222', email: 'ahmed@shirazre.com', role: 'Sous Chef', department: 'Kitchen', joinDate: '2022-06-01', salary: 55000, status: 'active' },
  { id: '3', employeeId: 'EMP-003', name: 'Fatima Noor', phone: '0302-3333333', email: 'fatima@shirazre.com', role: 'Cashier', department: 'Front', joinDate: '2023-02-10', salary: 35000, status: 'active' },
  { id: '4', employeeId: 'EMP-004', name: 'Usman Khan', phone: '0303-4444444', email: 'usman@shirazre.com', role: 'Waiter', department: 'Front', joinDate: '2023-05-20', salary: 28000, status: 'active' },
  { id: '5', employeeId: 'EMP-005', name: 'Sara Malik', phone: '0304-5555555', email: 'sara@shirazre.com', role: 'Waiter', department: 'Front', joinDate: '2023-07-15', salary: 28000, status: 'active' },
  { id: '6', employeeId: 'EMP-006', name: 'Bilal Raza', phone: '0305-6666666', email: 'bilal@shirazre.com', role: 'BBQ Chef', department: 'Kitchen', joinDate: '2022-09-01', salary: 50000, status: 'active' },
  { id: '7', employeeId: 'EMP-007', name: 'Ayesha Tariq', phone: '0306-7777777', email: 'ayesha@shirazre.com', role: 'Manager', department: 'Management', joinDate: '2021-11-01', salary: 90000, status: 'active' },
  { id: '8', employeeId: 'EMP-008', name: 'Zain Aslam', phone: '0307-8888888', email: 'zain@shirazre.com', role: 'Helper', department: 'Kitchen', joinDate: '2024-01-10', salary: 22000, status: 'active' },
  { id: '9', employeeId: 'EMP-009', name: 'Hamza Shah', phone: '0308-9999999', email: 'hamza@shirazre.com', role: 'Delivery Boy', department: 'Front', joinDate: '2024-03-01', salary: 25000, status: 'active' },
  { id: '10', employeeId: 'EMP-010', name: 'Nadia Iqbal', phone: '0309-0000000', email: 'nadia@shirazre.com', role: 'Tandoor Chef', department: 'Kitchen', joinDate: '2023-01-15', salary: 40000, status: 'active' },
];

export const defaultAttendance: AttendanceRecord[] = [
  { id: '1', employeeId: '1', date: today, checkIn: '08:00', checkOut: '17:00', status: 'present', hoursWorked: 9, lateMinutes: 0 },
  { id: '2', employeeId: '2', date: today, checkIn: '08:15', checkOut: '17:00', status: 'late', hoursWorked: 8.75, lateMinutes: 15 },
  { id: '3', employeeId: '3', date: today, checkIn: '09:00', checkOut: '18:00', status: 'present', hoursWorked: 9, lateMinutes: 0 },
  { id: '4', employeeId: '4', date: today, checkIn: '10:30', checkOut: '', status: 'late', hoursWorked: 0, lateMinutes: 30 },
  { id: '5', employeeId: '5', date: today, status: 'leave', hoursWorked: 0, lateMinutes: 0 },
  { id: '6', employeeId: '6', date: today, checkIn: '07:55', checkOut: '16:00', status: 'present', hoursWorked: 8, lateMinutes: 0 },
  { id: '7', employeeId: '7', date: today, checkIn: '08:00', checkOut: '18:00', status: 'present', hoursWorked: 10, lateMinutes: 0 },
  { id: '8', employeeId: '8', date: today, status: 'absent', hoursWorked: 0, lateMinutes: 0 },
  { id: '9', employeeId: '9', date: today, checkIn: '11:00', checkOut: '', status: 'present', hoursWorked: 0, lateMinutes: 0 },
  { id: '10', employeeId: '10', date: today, checkIn: '06:00', checkOut: '15:00', status: 'present', hoursWorked: 9, lateMinutes: 0 },
];

export const defaultLeaveRequests: LeaveRequest[] = [
  { id: '1', employeeId: '5', type: 'casual', startDate: today, endDate: today, reason: 'Personal work', status: 'approved', appliedOn: today },
  { id: '2', employeeId: '8', type: 'sick', startDate: today, endDate: today, reason: 'Fever', status: 'pending', appliedOn: today },
];

export const defaultLeaveBalances: LeaveBalance[] = [
  { employeeId: '1', sick: 10, casual: 8, annual: 14, emergency: 3 },
  { employeeId: '2', sick: 10, casual: 7, annual: 14, emergency: 3 },
  { employeeId: '3', sick: 8, casual: 6, annual: 10, emergency: 2 },
  { employeeId: '4', sick: 8, casual: 5, annual: 10, emergency: 2 },
  { employeeId: '5', sick: 8, casual: 4, annual: 10, emergency: 2 },
  { employeeId: '6', sick: 10, casual: 8, annual: 14, emergency: 3 },
  { employeeId: '7', sick: 12, casual: 10, annual: 18, emergency: 4 },
  { employeeId: '8', sick: 6, casual: 5, annual: 8, emergency: 2 },
  { employeeId: '9', sick: 6, casual: 5, annual: 8, emergency: 2 },
  { employeeId: '10', sick: 8, casual: 6, annual: 10, emergency: 2 },
];

export const defaultShifts: ShiftBlock[] = [
  { id: '1', label: 'Opening', start: '08:00', end: '16:00', supervisorName: 'Hassaan shb', staffCount: 6, notes: 'Floor + outdoor prep' },
  { id: '2', label: 'Evening', start: '16:00', end: '00:00', supervisorName: 'Fahad shb', staffCount: 8, notes: 'Peak dining + delivery' },
  { id: '3', label: 'Night close', start: '00:00', end: '03:00', supervisorName: 'Fahad shb', staffCount: 3, notes: 'Stock lock & cash drop' },
];

export const defaultSalaryRecords: SalaryRecord[] = defaultEmployees.map((emp, i) => ({
  id: String(i + 1),
  employeeId: emp.id,
  month: new Date().toISOString().slice(0, 7),
  baseSalary: emp.salary,
  bonus: 0,
  deductions: 0,
  lateFines: 0,
  netSalary: emp.salary,
  status: 'pending' as const,
}));
