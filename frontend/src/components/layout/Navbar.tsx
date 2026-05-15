'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Building2, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const roleColor: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    sales: 'bg-green-100 text-green-700',
    sanction: 'bg-blue-100 text-blue-700',
    disbursement: 'bg-orange-100 text-orange-700',
    collection: 'bg-red-100 text-red-700',
    borrower: 'bg-gray-100 text-gray-700',
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">LMS</span>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-800">{user.name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleColor[user.role] || 'bg-gray-100 text-gray-700'}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50">
                <LogOut className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
