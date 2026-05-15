import { LoanStatus } from '@/types';

export default function StatusBadge({ status }: { status: LoanStatus }) {
  return <span className={`badge-${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}
