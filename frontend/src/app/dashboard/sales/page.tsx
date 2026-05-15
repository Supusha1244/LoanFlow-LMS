'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import { Users, UserCheck, UserX } from 'lucide-react';

interface BorrowerWithStatus {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  hasApplied: boolean;
}

export default function SalesDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [borrowers, setBorrowers] = useState<BorrowerWithStatus[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (!loading && user && !['sales', 'admin'].includes(user.role)) { router.push('/'); return; }
    if (!loading && user) {
      api.get('/users/borrowers').then(r => setBorrowers(r.data.borrowers)).catch(console.error).finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" /></div>;

  const applied = borrowers.filter(b => b.hasApplied).length;
  const notApplied = borrowers.filter(b => !b.hasApplied).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sales Module</h1>
        <p className="text-gray-500 mb-6">Track registered borrowers and their application status</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center"><Users className="w-8 h-8 text-blue-500 mx-auto mb-2" /><p className="text-2xl font-bold">{borrowers.length}</p><p className="text-sm text-gray-500">Total Borrowers</p></div>
          <div className="card text-center"><UserCheck className="w-8 h-8 text-green-500 mx-auto mb-2" /><p className="text-2xl font-bold">{applied}</p><p className="text-sm text-gray-500">Applied</p></div>
          <div className="card text-center"><UserX className="w-8 h-8 text-orange-500 mx-auto mb-2" /><p className="text-2xl font-bold">{notApplied}</p><p className="text-sm text-gray-500">Not Applied</p></div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Borrower Leads</h2>
          {borrowers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No borrowers registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Registered On</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {borrowers.map(b => (
                    <tr key={b._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium text-gray-900">{b.name}</td>
                      <td className="py-3 px-2 text-gray-600">{b.email}</td>
                      <td className="py-3 px-2 text-gray-500">{formatDate(b.createdAt)}</td>
                      <td className="py-3 px-2">
                        {b.hasApplied
                          ? <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Applied</span>
                          : <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Not Applied</span>
                        }
                      </td>
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
