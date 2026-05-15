'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import Navbar from '@/components/layout/Navbar';
import { Send, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DisbursementDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLoans = () => {
    api.get('/loans?status=sanctioned').then(r => setLoans(r.data.loans)).catch(console.error).finally(() => setFetching(false));
  };

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (!loading && user && !['disbursement', 'admin'].includes(user.role)) { router.push('/'); return; }
    if (!loading && user) fetchLoans();
  }, [user, loading, router]);

  const handleDisburse = async (loanId: string) => {
    setActionLoading(loanId);
    try {
      await api.patch(`/loans/${loanId}/disburse`);
      toast.success('Loan disbursed successfully!');
      fetchLoans();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Disbursement failed.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Disbursement Module</h1>
        <p className="text-gray-500 mb-6">Release funds for sanctioned loans</p>
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Sanctioned Loans ({loans.length})</h2>
          {loans.length === 0 ? (
            <div className="text-center py-12"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No sanctioned loans pending disbursement.</p></div>
          ) : (
            <div className="space-y-4">
              {loans.map(loan => {
                const borrower = typeof loan.borrower === 'object' ? loan.borrower : { name: 'N/A', email: '' };
                const sanctionedBy = typeof loan.sanctionedBy === 'object' && loan.sanctionedBy ? loan.sanctionedBy.name : 'N/A';
                return (
                  <div key={loan._id} className="border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{loan.fullName}</h3>
                        <StatusBadge status={loan.status} />
                      </div>
                      <p className="text-sm text-gray-500">{borrower.email}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div><p className="text-xs text-gray-400">Loan Amount</p><p className="font-semibold text-gray-800">{formatCurrency(loan.loanAmount)}</p></div>
                        <div><p className="text-xs text-gray-400">Total Repayment</p><p className="font-semibold text-gray-800">{formatCurrency(loan.totalRepayment)}</p></div>
                        <div><p className="text-xs text-gray-400">Tenure</p><p className="font-semibold text-gray-800">{loan.tenure} days</p></div>
                        <div><p className="text-xs text-gray-400">Sanctioned By</p><p className="font-semibold text-gray-800">{sanctionedBy}</p></div>
                      </div>
                      <p className="text-xs text-gray-400">Sanctioned: {loan.sanctionedAt ? formatDate(loan.sanctionedAt) : 'N/A'}</p>
                    </div>
                    <button onClick={() => handleDisburse(loan._id)} disabled={actionLoading === loan._id} className="btn-primary flex items-center gap-2 shrink-0">
                      {actionLoading === loan._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Disburse Loan
                    </button>
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
