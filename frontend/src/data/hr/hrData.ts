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
