export type UserRole = 'admin' | 'sales' | 'sanction' | 'disbursement' | 'collection' | 'borrower';
export type LoanStatus = 'applied' | 'sanctioned' | 'disbursed' | 'closed' | 'rejected';
export type EmploymentMode = 'salaried' | 'self-employed' | 'unemployed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Loan {
  _id: string;
  borrower: { _id: string; name: string; email: string } | string;
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  loanAmount: number;
  tenure: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  status: LoanStatus;
  rejectionReason?: string;
  salarySlipUrl?: string;
  salarySlipOriginalName?: string;
  sanctionedBy?: { name: string } | string;
  sanctionedAt?: string;
  disbursedBy?: { name: string } | string;
  disbursedAt?: string;
  closedAt?: string;
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  loan: string;
  borrower: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  recordedBy: { name: string } | string;
  createdAt: string;
}
