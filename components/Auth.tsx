import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
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

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    const useFirebase = isFirebaseConfigured() && auth !== null;

    if (useFirebase) {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth!, provider);
        const user = userCredential.user;
        const uid = user.uid;

        const savedProfileStr = localStorage.getItem(`unihub_${uid}_profile`);
        let profile: UserProfile;
        if (savedProfileStr) {
          profile = JSON.parse(savedProfileStr);
        } else {
          profile = {
            name: user.displayName || user.email?.split('@')[0] || 'User',
            college: 'University Hub',
            year: '1st Year',
            semester: '1st Semester',
            classSection: '',
            isSetupComplete: false,
            attendanceThreshold: 75,
            avatarUrl: user.photoURL || undefined
          };
          localStorage.setItem(`unihub_${uid}_profile`, JSON.stringify(profile));
          await saveUserDataToFirestore(uid, 'unihub_profile', profile);
        }
        localStorage.setItem('unihub_active_uid', uid);
        onAuthSuccess(profile, uid);
      } catch (err: any) {
        console.error(err);
        let msg = err.message || 'Google sign-in failed.';
        if (err.code === 'auth/popup-closed-by-user') {
          msg = 'Sign-in popup was closed before completing.';
        } else if (err.code === 'auth/cancelled-popup-request') {
          msg = 'Sign-in request was cancelled.';
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    } else {
      setTimeout(() => {
        const googleUid = 'google_user_demo';
        let profile: UserProfile = {
          name: 'Google Student',
          college: 'University Hub',
          year: '1st Year',
          semester: '1st Semester',
          classSection: '',
          isSetupComplete: false,
          attendanceThreshold: 75
        };
        const savedProfileStr = localStorage.getItem(`unihub_${googleUid}_profile`);
        if (savedProfileStr) {
          profile = JSON.parse(savedProfileStr);
        } else {
          localStorage.setItem(`unihub_${googleUid}_profile`, JSON.stringify(profile));
        }
        onAuthSuccess(profile, googleUid);
        setLoading(false);
      }, 600);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccessMessage('');
    setLoading(true);

    const useFirebase = isFirebaseConfigured() && auth !== null;

    if (useFirebase) {
      try {
        await sendPasswordResetEmail(auth!, email);
        setResetSuccessMessage('Password reset email sent! Please check your inbox for instructions.');
      } catch (err: any) {
        console.error(err);
        let msg = err.message || 'Failed to send password reset email.';
        if (err.code === 'auth/user-not-found') {
          msg = 'No account found with this email address.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Please enter a valid email address.';
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    } else {
      // Sandbox fallback mode
      setTimeout(() => {
        const normalizedEmail = email.toLowerCase().trim();
        const accountIndex = accounts.findIndex(a => a.email.toLowerCase() === normalizedEmail);
        if (accountIndex === -1) {
          setError('No account found with this email address. Please check your email or register first.');
        } else {
          if (!newPassword) {
            setError('Please enter a new password to reset your account credentials.');
            setLoading(false);
            return;
          }
          const updatedAccounts = [...accounts];
          updatedAccounts[accountIndex] = {
            ...updatedAccounts[accountIndex],
            password: newPassword
          };
          setAccounts(updatedAccounts);
          setResetSuccessMessage('Password updated successfully! You can now sign in with your new password.');
          setPassword(newPassword);
        }
        setLoading(false);
      }, 600);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setError('');
    setResetSuccessMessage('');
  };

  const availableSemesters = YEAR_SEMESTER_MAP[regYear] || [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className={`w-full ${isLogin || isForgotPassword ? 'max-w-md' : 'max-w-2xl'} bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-indigo-100 dark:shadow-none overflow-hidden border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-500 transition-all`}>
        <div className="bg-indigo-600 py-4 px-6 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="mx-auto mb-2 flex justify-center">
              <img 
                src="/unihub-logo-3-1.png" 
                className="h-40 w-auto object-contain" 
                alt="UniHub Logo" 
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Your Account'}
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

          {isForgotPassword ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                {isFirebaseConfigured() && auth !== null
                  ? "Enter your email address and we will send you instructions to reset your password."
                  : "Enter your registered email address and set a new password to update your credentials."}
              </p>

              {resetSuccessMessage ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-2xl text-sm text-center flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-lg">
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                    <p className="font-medium">{resetSuccessMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setIsLogin(true);
                      setError('');
                      setResetSuccessMessage('');
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-arrow-left text-xs"></i>
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Email Address</label>
                    <input 
                      type="email" required
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@college.edu"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  {!(isFirebaseConfigured() && auth !== null) && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">New Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} required
                          value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
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
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading && <i className="fa-solid fa-spinner fa-spin"></i>}
                    {isFirebaseConfigured() && auth !== null ? 'Send Reset Link' : 'Reset Password'}
                  </button>

                  <div className="text-center pt-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setIsLogin(true);
                        setError('');
                      }}
                      className="text-sm font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                    >
                      Cancel & Return to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-4">
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Password</label>
                      {isLogin && (
                        <button 
                          type="button"
                          onClick={() => {
                            setIsForgotPassword(true);
                            setError('');
                            setResetSuccessMessage('');
                          }}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
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

              {/* Google Sign In Divider & Button */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-semibold tracking-wider">
                    Or continue with
                  </span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          )}

          {!isForgotPassword && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={toggleMode}
                className="ml-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                {isLogin ? 'Register Now' : 'Login'}
              </button>
            </p>
          )}

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


