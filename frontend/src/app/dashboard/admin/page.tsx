'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import Navbar from '@/components/layout/Navbar';
import { Users, FileText, TrendingUp, CheckCircle, DollarSign, XCircle } from 'lucide-react';

interface Stats {
  totalBorrowers: number;
  applied: number;
  sanctioned: number;
  disbursed: number;
  closed: number;
  rejected: number;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (!loading && user?.role !== 'admin') { router.push('/'); return; }
    if (!loading && user) {
      Promise.all([
        api.get('/dashboard/stats'),
        api.get('/loans'),
      ]).then(([statsRes, loansRes]) => {
        setStats(statsRes.data);
        setLoans(loansRes.data.loans);
      }).catch(console.error).finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" /></div>;

  const MODULES = [
    { label: 'Sales', href: '/dashboard/sales', icon: Users, color: 'text-green-500', bg: 'bg-green-50', desc: 'Lead tracking' },
    { label: 'Sanction', href: '/dashboard/sanction', icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-50', desc: 'Review applications' },
    { label: 'Disbursement', href: '/dashboard/disbursement', icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'Release funds' },
    { label: 'Collection', href: '/dashboard/collection', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Record payments' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 mb-6">Full system overview</p>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Borrowers', value: stats.totalBorrowers, icon: Users, color: 'text-gray-500' },
              { label: 'Applied', value: stats.applied, icon: FileText, color: 'text-yellow-500' },
              { label: 'Sanctioned', value: stats.sanctioned, icon: CheckCircle, color: 'text-blue-500' },
              { label: 'Disbursed', value: stats.disbursed, icon: DollarSign, color: 'text-purple-500' },
              { label: 'Closed', value: stats.closed, icon: TrendingUp, color: 'text-green-500' },
              { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-500' },
            ].map(s => (
              <div key={s.label} className="card text-center py-4">
                <s.icon className={`w-6 h-6 mx-auto mb-1 ${s.color}`} />
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Module links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {MODULES.map(m => (
            <Link key={m.label} href={m.href} className={`card ${m.bg} border-0 hover:shadow-md transition-shadow`}>
              <m.icon className={`w-8 h-8 ${m.color} mb-2`} />
              <p className="font-semibold text-gray-800">{m.label}</p>
              <p className="text-xs text-gray-500">{m.desc}</p>
            </Link>
          ))}
        </div>

        {/* All loans */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">All Loans ({loans.length})</h2>
          {loans.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No loans yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Borrower</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Tenure</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Total Repay</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map(loan => {
                    const b = typeof loan.borrower === 'object' ? loan.borrower : { name: 'N/A', email: '' };
                    return (
                      <tr key={loan._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-2"><p className="font-medium text-gray-900">{loan.fullName}</p><p className="text-xs text-gray-400">{b.email}</p></td>
                        <td className="py-3 px-2 font-semibold">{formatCurrency(loan.loanAmount)}</td>
                        <td className="py-3 px-2">{loan.tenure}d</td>
                        <td className="py-3 px-2">{formatCurrency(loan.totalRepayment)}</td>
                        <td className="py-3 px-2"><StatusBadge status={loan.status} /></td>
                        <td className="py-3 px-2 text-gray-500">{formatDate(loan.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
