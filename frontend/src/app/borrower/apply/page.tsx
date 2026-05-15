'use client';
import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { calculateLoan, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import { CheckCircle, AlertCircle, Upload, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

const STEPS = ['Personal Details', 'Upload Salary Slip', 'Loan Configuration'];

export default function ApplyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [breErrors, setBreErrors] = useState<string[]>([]);
  const [breChecking, setBreChecking] = useState(false);

  // Step 1 data
  const [fullName, setFullName] = useState('');
  const [pan, setPan] = useState('');
  const [dob, setDob] = useState('');
  const [salary, setSalary] = useState('');
  const [employment, setEmployment] = useState('salaried');

  // Step 2 data
  const [file, setFile] = useState<File | null>(null);
  const [salarySlipUrl, setSalarySlipUrl] = useState('');
  const [salarySlipOriginalName, setSalarySlipOriginalName] = useState('');
  const [uploading, setUploading] = useState(false);

  // Step 3 data
  const [loanAmount, setLoanAmount] = useState(100000);
  const [tenure, setTenure] = useState(180);

  const { simpleInterest, totalRepayment } = calculateLoan(loanAmount, tenure);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (!loading && user?.role !== 'borrower') router.push('/');
  }, [user, loading, router]);

  const checkBRE = async () => {
    setBreChecking(true);
    setBreErrors([]);
    try {
      const res = await api.post('/loans/check-eligibility', {
        dateOfBirth: dob,
        monthlySalary: Number(salary),
        pan,
        employmentMode: employment,
      });
      if (res.data.passed) {
        toast.success('Eligibility check passed!');
        setStep(1);
      } else {
        setBreErrors(res.data.errors);
      }
    } catch {
      toast.error('Failed to check eligibility.');
    } finally {
      setBreChecking(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a file first.'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('salarySlip', file);
      const res = await api.post('/upload/salary-slip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSalarySlipUrl(res.data.url);
      setSalarySlipOriginalName(res.data.originalName);
      toast.success('File uploaded successfully!');
      setStep(2);
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleApply = async () => {
    setSubmitting(true);
    try {
      await api.post('/loans/apply', {
        fullName, pan: pan.toUpperCase(), dateOfBirth: dob,
        monthlySalary: Number(salary), employmentMode: employment,
        loanAmount, tenure,
        salarySlipUrl, salarySlipOriginalName,
      });
      toast.success('Loan application submitted successfully!');
      router.push('/borrower/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: string[] } } };
      if (e?.response?.data?.errors) {
        e.response.data.errors.forEach((er: string) => toast.error(er));
      } else {
        toast.error(e?.response?.data?.message || 'Application failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => router.push('/borrower/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Apply for a Loan</h1>

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`ml-2 text-xs font-medium ${i === step ? 'text-blue-600' : 'text-gray-400'} hidden sm:inline`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card">
          {/* STEP 0 - Personal Details */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Personal Details & Eligibility</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input className="input-field" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Rahul Kumar Sharma" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                  <input className="input-field uppercase" value={pan} onChange={e => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" className="input-field" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (₹)</label>
                  <input type="number" className="input-field" value={salary} onChange={e => setSalary(e.target.value)} placeholder="50000" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Mode</label>
                  <select className="input-field" value={employment} onChange={e => setEmployment(e.target.value)}>
                    <option value="salaried">Salaried</option>
                    <option value="self-employed">Self-Employed</option>
                    <option value="unemployed">Unemployed</option>
                  </select>
                </div>
              </div>

              {breErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700 mb-1">Eligibility Check Failed</p>
                      {breErrors.map((e, i) => <p key={i} className="text-sm text-red-600">• {e}</p>)}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={checkBRE}
                disabled={!fullName || !pan || !dob || !salary || breChecking}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {breChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {breChecking ? 'Checking Eligibility...' : 'Check Eligibility & Continue'}
              </button>
            </div>
          )}

          {/* STEP 1 - Upload Salary Slip */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Upload Salary Slip</h2>
              <p className="text-sm text-gray-500">Please upload your latest salary slip (PDF/JPG/PNG, max 5MB)</p>
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'}`}>
                <Upload className={`w-10 h-10 mx-auto mb-3 ${file ? 'text-green-500' : 'text-gray-400'}`} />
                {file ? (
                  <div>
                    <p className="font-medium text-green-700">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    <button onClick={() => setFile(null)} className="text-red-500 text-sm mt-2 hover:underline">Remove</button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">Drag & drop or click to upload</p>
                    <label className="btn-primary inline-block cursor-pointer">
                      Choose File
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                )}
              </div>
              {salarySlipUrl && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" /> Uploaded: {salarySlipOriginalName}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-secondary flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Uploading...' : 'Upload & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 - Loan Config */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Configure Your Loan</h2>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Loan Amount</label>
                  <span className="text-blue-600 font-bold text-lg">{formatCurrency(loanAmount)}</span>
                </div>
                <input
                  type="range" min={50000} max={500000} step={5000}
                  value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>₹50,000</span><span>₹5,00,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Tenure</label>
                  <span className="text-blue-600 font-bold text-lg">{tenure} days</span>
                </div>
                <input
                  type="range" min={30} max={365} step={5}
                  value={tenure} onChange={e => setTenure(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>30 days</span><span>365 days</span>
                </div>
              </div>

              {/* Live calculation */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-blue-800">Loan Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-gray-500">Principal</p>
                    <p className="font-bold text-gray-900">{formatCurrency(loanAmount)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-gray-500">Interest (12% p.a.)</p>
                    <p className="font-bold text-orange-600">{formatCurrency(simpleInterest)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-gray-500">Tenure</p>
                    <p className="font-bold text-gray-900">{tenure} days</p>
                  </div>
                  <div className="bg-blue-600 rounded-lg p-3">
                    <p className="text-blue-100">Total Repayment</p>
                    <p className="font-bold text-white text-lg">{formatCurrency(totalRepayment)}</p>
                  </div>
                </div>
                <p className="text-xs text-blue-600">Formula: SI = (P × 12 × {tenure}) / (365 × 100)</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleApply} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
