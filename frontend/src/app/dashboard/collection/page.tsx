'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Loan, Payment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import Navbar from '@/components/layout/Navbar';
import { DollarSign, Loader2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CollectionDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [payments, setPayments] = useState<Record<string, Payment[]>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [form, setForm] = useState({ utrNumber: '', amount: '', paymentDate: '' });

  const fetchLoans = () => {
    api.get('/loans?status=disbursed').then(r => setLoans(r.data.loans)).catch(console.error).finally(() => setFetching(false));
  };

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (!loading && user && !['collection', 'admin'].includes(user.role)) { router.push('/'); return; }
    if (!loading && user) fetchLoans();
  }, [user, loading, router]);

  const loadPayments = async (loanId: string) => {
    if (payments[loanId]) return;
    try {
      const res = await api.get(`/payments/loan/${loanId}`);
      setPayments(prev => ({ ...prev, [loanId]: res.data.payments }));
    } catch { /* ignore */ }
  };

  const toggleExpand = (loanId: string) => {
    if (expandedLoan === loanId) { setExpandedLoan(null); return; }
    setExpandedLoan(loanId);
    loadPayments(loanId);
  };

  const handlePayment = async (loan: Loan) => {
    if (!form.utrNumber || !form.amount || !form.paymentDate) { toast.error('All fields are required.'); return; }
    setSubmitting(loan._id);
    try {
      const res = await api.post('/payments', {
        loanId: loan._id,
        utrNumber: form.utrNumber,
        amount: Number(form.amount),
        paymentDate: form.paymentDate,
      });
      toast.success(res.data.message);
      setForm({ utrNumber: '', amount: '', paymentDate: '' });
      // Refresh payments and loans
      setPayments(prev => ({ ...prev, [loan._id]: [] }));
      fetchLoans();
      loadPayments(loan._id);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Payment failed.');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Collection Module</h1>
        <p className="text-gray-500 mb-6">Record borrower repayments</p>
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Active Loans ({loans.length})</h2>
          {loans.length === 0 ? (
            <div className="text-center py-12"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No active (disbursed) loans.</p></div>
          ) : (
            <div className="space-y-4">
              {loans.map(loan => {
                const borrower = typeof loan.borrower === 'object' ? loan.borrower : { name: 'N/A', email: '' };
                const outstanding = loan.totalRepayment - loan.totalPaid;
                const progressPct = Math.min((loan.totalPaid / loan.totalRepayment) * 100, 100);
                const isExpanded = expandedLoan === loan._id;
                return (
                  <div key={loan._id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{loan.fullName}</h3>
                            <StatusBadge status={loan.status} />
                          </div>
                          <p className="text-sm text-gray-500">{borrower.email}</p>
                          <div className="grid grid-cols-3 gap-3 mt-3">
                            <div><p className="text-xs text-gray-400">Total Repayment</p><p className="font-semibold text-gray-800">{formatCurrency(loan.totalRepayment)}</p></div>
                            <div><p className="text-xs text-gray-400">Paid</p><p className="font-semibold text-green-600">{formatCurrency(loan.totalPaid)}</p></div>
                            <div><p className="text-xs text-gray-400">Outstanding</p><p className="font-semibold text-orange-600">{formatCurrency(outstanding)}</p></div>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Progress</span><span>{progressPct.toFixed(1)}%</span></div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                            </div>
                          </div>
                        </div>
                        <button onClick={() => toggleExpand(loan._id)} className="btn-secondary flex items-center gap-2 shrink-0 self-start">
                          {isExpanded ? <><ChevronUp className="w-4 h-4" /> Hide</> : <><ChevronDown className="w-4 h-4" /> Record Payment</>}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-gray-50 border-t border-gray-100 p-5 space-y-4">
                        {/* Record payment form */}
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">Record New Payment</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">UTR Number *</label>
                              <input className="input-field text-sm" value={form.utrNumber} onChange={e => setForm(f => ({ ...f, utrNumber: e.target.value }))} placeholder="UTR123456789" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹) *</label>
                              <input type="number" className="input-field text-sm" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder={String(Math.round(outstanding))} max={outstanding} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date *</label>
                              <input type="date" className="input-field text-sm" value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} max={new Date().toISOString().split('T')[0]} />
                            </div>
                          </div>
                          <button onClick={() => handlePayment(loan)} disabled={submitting === loan._id} className="btn-primary mt-3 flex items-center gap-2">
                            {submitting === loan._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                            {submitting === loan._id ? 'Recording...' : 'Record Payment'}
                          </button>
                        </div>

                        {/* Payment history */}
                        {payments[loan._id] && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Payment History</h4>
                            {payments[loan._id].length === 0 ? (
                              <p className="text-sm text-gray-400">No payments recorded yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {payments[loan._id].map(p => (
                                  <div key={p._id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-gray-100">
                                    <div>
                                      <p className="text-sm font-medium text-gray-800">{formatCurrency(p.amount)}</p>
                                      <p className="text-xs text-gray-500 font-mono">UTR: {p.utrNumber}</p>
                                    </div>
                                    <p className="text-xs text-gray-400">{formatDate(p.paymentDate)}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
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
