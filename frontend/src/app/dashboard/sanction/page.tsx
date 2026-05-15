'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import Navbar from '@/components/layout/Navbar';
import { CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SanctionDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fetching, setFetching] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLoans = () => {
    api.get('/loans?status=applied').then(r => setLoans(r.data.loans)).catch(console.error).finally(() => setFetching(false));
  };

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (!loading && user && !['sanction', 'admin'].includes(user.role)) { router.push('/'); return; }
    if (!loading && user) fetchLoans();
  }, [user, loading, router]);

  const handleAction = async (loanId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectReason.trim()) { toast.error('Please provide a rejection reason.'); return; }
    setActionLoading(loanId);
    try {
      await api.patch(`/loans/${loanId}/sanction`, { action, rejectionReason: rejectReason });
      toast.success(action === 'approve' ? 'Loan sanctioned!' : 'Loan rejected.');
      setSelectedLoan(null);
      setRejectReason('');
      fetchLoans();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sanction Module</h1>
        <p className="text-gray-500 mb-6">Review and approve or reject loan applications</p>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Applications ({loans.length})</h2>
          {loans.length === 0 ? (
            <div className="text-center py-12"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No pending applications.</p></div>
          ) : (
            <div className="space-y-4">
              {loans.map(loan => {
                const borrower = typeof loan.borrower === 'object' ? loan.borrower : { name: 'N/A', email: '' };
                return (
                  <div key={loan._id} className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{loan.fullName}</h3>
                          <StatusBadge status={loan.status} />
                        </div>
                        <p className="text-sm text-gray-500">{borrower.email} • Applied: {formatDate(loan.createdAt)}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                          <div><p className="text-xs text-gray-400">Loan Amount</p><p className="font-semibold text-gray-800">{formatCurrency(loan.loanAmount)}</p></div>
                          <div><p className="text-xs text-gray-400">Tenure</p><p className="font-semibold text-gray-800">{loan.tenure} days</p></div>
                          <div><p className="text-xs text-gray-400">Total Repayment</p><p className="font-semibold text-gray-800">{formatCurrency(loan.totalRepayment)}</p></div>
                          <div><p className="text-xs text-gray-400">Salary</p><p className="font-semibold text-gray-800">{formatCurrency(loan.monthlySalary)}/mo</p></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><p className="text-xs text-gray-400">PAN</p><p className="text-sm font-mono text-gray-700">{loan.pan}</p></div>
                          <div><p className="text-xs text-gray-400">Employment</p><p className="text-sm text-gray-700 capitalize">{loan.employmentMode}</p></div>
                        </div>
                        {loan.salarySlipUrl && (
                          <a href={`${process.env.NEXT_PUBLIC_API_URL}${loan.salarySlipUrl}`} target="_blank" rel="noreferrer" className="text-blue-500 text-sm hover:underline">📄 View Salary Slip</a>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => handleAction(loan._id, 'approve')} disabled={actionLoading === loan._id} className="btn-primary flex items-center gap-2 justify-center">
                          {actionLoading === loan._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                        </button>
                        <button onClick={() => setSelectedLoan(selectedLoan === loan._id ? null : loan._id)} className="btn-danger flex items-center gap-2 justify-center">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                    {selectedLoan === loan._id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                        <textarea className="input-field" rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain reason for rejection..." />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => { setSelectedLoan(null); setRejectReason(''); }} className="btn-secondary text-sm">Cancel</button>
                          <button onClick={() => handleAction(loan._id, 'reject')} disabled={!rejectReason.trim() || actionLoading === loan._id} className="btn-danger text-sm flex items-center gap-1">
                            {actionLoading === loan._id ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Confirm Rejection
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
