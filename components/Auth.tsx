import React, { useState } from 'react';
import { storage } from '../services/storage';
import { BrainCircuit, Loader2, ArrowRight, UserCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate network delay for better UX
    setTimeout(() => {
      const user = storage.login(username);
      onLogin(user);
      setLoading(false);
    }, 800);
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
            <h2 className="text-xl font-bold text-slate-800">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Enter a username to access your workspace</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all text-slate-900"
                placeholder="e.g. student1"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-medium py-3.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-200 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                </>
            )}
          </button>
        </form>
        
        <p className="text-xs text-center text-slate-400 mt-6">
            Data is saved automatically to this browser.
        </p>
      </div>
    </div>
  );
};

export default Auth;