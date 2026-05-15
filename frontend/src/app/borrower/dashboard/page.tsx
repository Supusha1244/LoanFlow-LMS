'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import Navbar from '@/components/layout/Navbar';
import { PlusCircle, FileText, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

export default function BorrowerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (!loading && user?.role !== 'borrower') { router.push('/'); return; }
    if (!loading && user) {
      api.get('/loans/my-loans').then(r => setLoans(r.data.loans)).catch(console.error).finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
    </div>
  );

  const activeLoans = loans.filter(l => l.status === 'disbursed').length;
  const pendingLoans = loans.filter(l => ['applied', 'sanctioned'].includes(l.status)).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
            <p className="text-gray-500 mt-1">Manage your loan applications</p>
          </div>
          <Link href="/borrower/apply" className="btn-primary flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Apply for Loan
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{loans.length}</p>
            <p className="text-sm text-gray-500">Total Applications</p>
          </div>
          <div className="card text-center">
            <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{pendingLoans}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <div className="card text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{activeLoans}</p>
            <p className="text-sm text-gray-500">Active Loans</p>
          </div>
        </div>

        {/* Loan list */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">My Applications</h2>
          {loans.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No loan applications yet.</p>
              <Link href="/borrower/apply" className="btn-primary inline-flex items-center gap-2 mt-4">
                <PlusCircle className="w-4 h-4" /> Apply Now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Loan Amount</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Tenure</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Total Repayment</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Applied On</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map(loan => (
                    <tr key={loan._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2 font-semibold text-gray-900">{formatCurrency(loan.loanAmount)}</td>
                      <td className="py-3 px-2 text-gray-600">{loan.tenure} days</td>
                      <td className="py-3 px-2 text-gray-700">{formatCurrency(loan.totalRepayment)}</td>
                      <td className="py-3 px-2"><StatusBadge status={loan.status} /></td>
                      <td className="py-3 px-2 text-gray-500">{formatDate(loan.createdAt)}</td>
                      <td className="py-3 px-2 text-gray-700">{formatCurrency(loan.totalPaid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
