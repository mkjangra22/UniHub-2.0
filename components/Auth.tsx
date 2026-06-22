import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { saveUserDataToFirestore } from '../services/dbService';

interface AuthProps {
  onAuthSuccess: (profile: UserProfile, userId: string) => void;
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

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const useFirebase = isFirebaseConfigured() && auth !== null;

    if (useFirebase) {
      try {
        if (isLogin) {
          // Firebase Login
          const userCredential = await signInWithEmailAndPassword(auth!, email, password);
          const uid = userCredential.user.uid;
          
          // Fetch user profile linked to this Firebase UID from localStorage
          const savedProfileStr = localStorage.getItem(`unihub_${uid}_profile`);
          let profile: UserProfile;
          if (savedProfileStr) {
            profile = JSON.parse(savedProfileStr);
          } else {
            // Fallback profile if Firestore is not connected
            profile = {
              name: email.split('@')[0],
              college: 'University Hub',
              year: '1st Year',
              semester: '1st Semester',
              classSection: '',
              isSetupComplete: false,
              attendanceThreshold: 75
            };
            localStorage.setItem(`unihub_${uid}_profile`, JSON.stringify(profile));
          }
          // Also set active user profile key for global app persistence
          localStorage.setItem('unihub_active_uid', uid);
          onAuthSuccess(profile, uid);
        } else {
          // Firebase Register
          const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
          const uid = userCredential.user.uid;

          const newProfile: UserProfile = {
            name: regName,
            college: regCollege,
            year: regYear,
            semester: regSem,
            classSection: '',
            isSetupComplete: false, // Force onboarding
            attendanceThreshold: 75
          };

          localStorage.setItem(`unihub_${uid}_profile`, JSON.stringify(newProfile));
          localStorage.setItem('unihub_active_uid', uid);
          await saveUserDataToFirestore(uid, 'unihub_profile', newProfile);
          onAuthSuccess(newProfile, uid);
        }
      } catch (err: any) {
        console.error(err);
        let msg = err.message || 'An error occurred during authentication.';
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          msg = 'Incorrect password or email.';
        } else if (err.code === 'auth/email-already-in-use') {
          msg = 'Email already registered. Try logging in.';
        } else if (err.code === 'auth/weak-password') {
          msg = 'Password should be at least 6 characters.';
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    } else {
      // Sandbox fallback mode (existing local accounts store logic)
      setTimeout(() => {
        const normalizedEmail = email.toLowerCase().trim();
        if (isLogin) {
          const account = accounts.find(a => a.email.toLowerCase() === normalizedEmail);
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

          // Try to fetch updated profile from localStorage
          const savedProfileStr = localStorage.getItem(`unihub_${normalizedEmail}_profile`);
          const profile = savedProfileStr ? JSON.parse(savedProfileStr) : account.profile;

          onAuthSuccess(profile, normalizedEmail);
        } else {
          if (accounts.some(a => a.email.toLowerCase() === normalizedEmail)) {
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
            email: normalizedEmail,
            password,
            profile: newProfile
          };

          setAccounts([...accounts, newAccount]);
          localStorage.setItem(`unihub_${normalizedEmail}_profile`, JSON.stringify(newProfile));
          onAuthSuccess(newProfile, normalizedEmail);
        }
        setLoading(false);
      }, 800);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  const availableSemesters = YEAR_SEMESTER_MAP[regYear] || [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className={`w-full ${isLogin ? 'max-w-md' : 'max-w-2xl'} bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-indigo-100 dark:shadow-none overflow-hidden border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-500 transition-all`}>
        <div className="bg-indigo-600 py-4 px-6 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="mx-auto mb-2 flex justify-center">
              <img 
                src="unihub-logo-3-1.png" 
                className="h-40 w-auto object-contain" 
                alt="UniHub Logo" 
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Your Account'}
            </h1>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        </div>

        <div className="py-6 px-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-3">
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleAction} className="space-y-3">
            <div className={`grid grid-cols-1 ${!isLogin ? 'md:grid-cols-2' : ''} gap-3`}>
              <div className={!isLogin ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Email Address</label>
                <input 
                  type="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              {!isLogin && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Full Name</label>
                    <input 
                      type="text" required
                      value={regName} onChange={(e) => setRegName(e.target.value)}
                      placeholder="your name"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">College/University</label>
                    <input 
                      type="text" required
                      value={regCollege} onChange={(e) => setRegCollege(e.target.value)}
                      placeholder="Institute"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Year</label>
                      <select 
                        value={regYear} 
                        onChange={(e) => {
                          setRegYear(e.target.value);
                          setRegSem(YEAR_SEMESTER_MAP[e.target.value][0]);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {Object.keys(YEAR_SEMESTER_MAP).map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Semester</label>
                      <select 
                        value={regSem} 
                        onChange={(e) => setRegSem(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {availableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className={!isLogin ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading && <i className="fa-solid fa-spinner fa-spin"></i>}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={toggleMode}
              className="ml-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              {isLogin ? 'Register Now' : 'Login'}
            </button>
          </p>

          {/* Configuration Mode Badge */}
          <div className="flex justify-center mt-4">
            <span className={`px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${
              isFirebaseConfigured() && auth !== null
                ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50'
                : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isFirebaseConfigured() && auth !== null ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
              }`}></span>
              {isFirebaseConfigured() && auth !== null ? 'Firebase Connected' : 'Sandbox Mode'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
