
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

interface Account {
  email: string;
  password: string;
  profile: UserProfile;
}

const YEAR_SEMESTER_MAP: Record<string, string[]> = {
  '1st Year': ['1st Semester', '2nd Semester'],
  '2nd Year': ['3rd Semester', '4th Semester'],
  '3rd Year': ['5th Semester', '6th Semester'],
  '4th Year': ['7th Semester', '8th Semester'],
};

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile fields for Registration
  const [regName, setRegName] = useState('');
  const [regCollege, setRegCollege] = useState('');
  const [regYear, setRegYear] = useState('1st Year');
  const [regSem, setRegSem] = useState('1st Semester');

  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem('unihub_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('unihub_accounts', JSON.stringify(accounts));
  }, [accounts]);

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate delay
    setTimeout(() => {
      if (isLogin) {
        const account = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
        if (!account) {
          setError('No account found with this email. Please register first.');
          setLoading(false);
          return;
        }
        if (account.password !== password) {
          setError('Incorrect password.');
          setLoading(false);
          return;
        }
        onAuthSuccess(account.profile);
      } else {
        if (accounts.some(a => a.email.toLowerCase() === email.toLowerCase())) {
          setError('Email already registered. Try logging in.');
          setLoading(false);
          return;
        }

        const newProfile: UserProfile = {
          name: regName,
          college: regCollege,
          year: regYear,
          semester: regSem,
          classSection: '',
          isSetupComplete: false, // Force onboarding
          attendanceThreshold: 75
        };

        const newAccount: Account = {
          email,
          password,
          profile: newProfile
        };

        setAccounts([...accounts, newAccount]);
        onAuthSuccess(newProfile);
      }
      setLoading(false);
    }, 800);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  const availableSemesters = YEAR_SEMESTER_MAP[regYear] || [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className={`w-full ${isLogin ? 'max-w-md' : 'max-w-2xl'} bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-indigo-100 dark:shadow-none overflow-hidden border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-500 transition-all`}>
        <div className="bg-indigo-600 p-8 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <i className="fa-solid fa-graduation-cap text-3xl"></i>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isLogin ? 'Welcome Back to UniHub' : 'Create Your UniHub Account'}
            </h1>
            <p className="text-indigo-100 text-sm mt-1">
              {isLogin ? 'Your Personal Academic Command Center' : 'Join thousands of students managing their academic life'}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-3">
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleAction} className="space-y-4">
            <div className={`grid grid-cols-1 ${!isLogin ? 'md:grid-cols-2' : ''} gap-4`}>
              <div className={!isLogin ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                <input 
                  type="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              {!isLogin && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                    <input 
                      type="text" required
                      value={regName} onChange={(e) => setRegName(e.target.value)}
                      placeholder="Alex Johnson"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">College/University</label>
                    <input 
                      type="text" required
                      value={regCollege} onChange={(e) => setRegCollege(e.target.value)}
                      placeholder="Institute of Technology"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Year</label>
                      <select 
                        value={regYear} 
                        onChange={(e) => {
                          setRegYear(e.target.value);
                          setRegSem(YEAR_SEMESTER_MAP[e.target.value][0]);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {Object.keys(YEAR_SEMESTER_MAP).map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Semester</label>
                      <select 
                        value={regSem} 
                        onChange={(e) => setRegSem(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {availableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className={!isLogin ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95 mt-2 flex items-center justify-center gap-2"
            >
              {loading && <i className="fa-solid fa-spinner fa-spin"></i>}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={toggleMode}
              className="ml-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              {isLogin ? 'Register Now' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
