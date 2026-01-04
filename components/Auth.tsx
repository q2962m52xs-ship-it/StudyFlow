import React, { useState } from 'react';
import { signInWithPopup, signInAnonymously } from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import { BrainCircuit, Loader2, User } from 'lucide-react';

const Auth: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError('Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error(err);
      setError('Failed to sign in as guest.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary-200">
          <BrainCircuit className="text-white w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Study Flow</h1>
        <p className="text-slate-500 mt-2">Your academic productivity hub</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-800">Welcome</h2>
            <p className="text-slate-500 text-sm">Sign in to sync your tasks and schedule</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border border-slate-200 text-slate-700 font-medium py-3.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-3 relative"
          >
             {/* Google G Logo SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink-0 mx-4 text-slate-300 text-xs font-medium uppercase">Or</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <button
            onClick={handleGuestSignIn}
            disabled={loading}
            className="w-full bg-slate-900 text-white font-medium py-3.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                    <User className="w-5 h-5" />
                    Continue as Guest
                </>
            )}
          </button>
        </div>

        {error && (
            <div className="mt-6 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium text-center">
              {error}
            </div>
        )}
        
        <p className="text-xs text-center text-slate-400 mt-8">
            Guest accounts are temporary. Sign in with Google to save your data permanently.
        </p>
      </div>
    </div>
  );
};

export default Auth;