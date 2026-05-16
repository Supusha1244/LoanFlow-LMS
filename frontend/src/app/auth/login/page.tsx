'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Building2, Mail, Lock, Loader2, Users, ShieldCheck, BadgeCheck, Banknote, HandCoins, UserCircle } from 'lucide-react';

function getRedirectPath(role: string): string {
  switch (role) {
    case 'borrower':     return '/borrower/dashboard';
    case 'admin':        return '/dashboard/admin';
    case 'sales':        return '/dashboard/sales';
    case 'sanction':     return '/dashboard/sanction';
    case 'disbursement': return '/dashboard/disbursement';
    case 'collection':   return '/dashboard/collection';
    default:             return '/auth/login';
  }
}

const DEMO_USERS = [
  { role: 'Borrower',     email: 'borrower@lms.com',    password: 'Borrower@123',    Icon: UserCircle,  color: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',         desc: 'Apply for loans' },
  { role: 'Admin',        email: 'admin@lms.com',        password: 'Admin@123',        Icon: ShieldCheck, color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100', desc: 'Full system access' },
  { role: 'Sales',        email: 'sales@lms.com',        password: 'Sales@123',        Icon: Users,       color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',     desc: 'Track leads' },
  { role: 'Sanction',     email: 'sanction@lms.com',     password: 'Sanction@123',     Icon: BadgeCheck,  color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',         desc: 'Approve or reject loans' },
  { role: 'Disbursement', email: 'disburse@lms.com',     password: 'Disburse@123',     Icon: Banknote,    color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100', desc: 'Release funds' },
  { role: 'Collection',   email: 'collection@lms.com',   password: 'Collection@123',   Icon: HandCoins,   color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',             desc: 'Record payments' },
];

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      const stored = localStorage.getItem('lms_user');
      if (stored) {
        const u = JSON.parse(stored);
        router.push(getRedirectPath(u.role));
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid email or password.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    toast('Credentials filled! Click Sign In to continue ✅', { icon: '👆' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-3 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">LMS Portal</h1>
          <p className="text-gray-500 mt-1">Loan Management System</p>
        </div>

        <div className="card mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-5">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required className="input-field pl-10" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            New borrower?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">Create account</Link>
          </p>
        </div>

        <div className="card">
          <p className="text-sm font-semibold text-gray-700 mb-1">🧪 Demo Accounts</p>
          <p className="text-xs text-gray-400 mb-3">Click any card below → credentials auto-fill → then click Sign In</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_USERS.map(({ role, email: e, password: p, Icon, color, desc }) => (
              <button key={role} type="button" onClick={() => fillCredentials(e, p)}
                className={`flex items-start gap-2 p-3 rounded-xl border text-left transition-all cursor-pointer ${color}`}>
                <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold leading-tight">{role}</p>
                  <p className="text-xs opacity-70 leading-tight mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
