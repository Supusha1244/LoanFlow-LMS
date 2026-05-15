import mongoose, { Document, Schema } from 'mongoose';

export type LoanStatus = 'applied' | 'sanctioned' | 'disbursed' | 'closed' | 'rejected';
export type EmploymentMode = 'salaried' | 'self-employed' | 'unemployed';

export interface ILoan extends Document {
  _id: mongoose.Types.ObjectId;
  borrower: mongoose.Types.ObjectId;
  // Personal Details
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  // Loan Details
  loanAmount: number;
  tenure: number; // in days
  interestRate: number; // 12% p.a.
  simpleInterest: number;
  totalRepayment: number;
  // Status
  status: LoanStatus;
  rejectionReason?: string;
  // Salary slip
  salarySlipUrl?: string;
  salarySlipOriginalName?: string;
  // Tracking
  sanctionedBy?: mongoose.Types.ObjectId;
  sanctionedAt?: Date;
  disbursedBy?: mongoose.Types.ObjectId;
  disbursedAt?: Date;
  closedAt?: Date;
  // Payment tracking
  totalPaid: number;
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoan>(
  {
    borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    pan: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    monthlySalary: { type: Number, required: true },
    employmentMode: {
      type: String,
      enum: ['salaried', 'self-employed', 'unemployed'],
      required: true,
    },
    loanAmount: { type: Number, required: true, min: 50000, max: 500000 },
    tenure: { type: Number, required: true, min: 30, max: 365 },
    interestRate: { type: Number, default: 12 },
    simpleInterest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    status: {
      type: String,
      enum: ['applied', 'sanctioned', 'disbursed', 'closed', 'rejected'],
      default: 'applied',
    },
    rejectionReason: { type: String },
    salarySlipUrl: { type: String },
    salarySlipOriginalName: { type: String },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
    totalPaid: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ILoan>('Loan', loanSchema);
