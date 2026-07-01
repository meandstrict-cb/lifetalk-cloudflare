import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, User, Sparkles, Loader2, KeyRound } from 'lucide-react';
import { toast } from './Toast';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (user: { username: string; role: string }) => void;
}

export function AuthModal({ onClose, onAuthSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (tab === 'signup') {
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters.');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
        setError('Username can only contain alphanumeric characters and underscores.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/signup';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      toast.success(tab === 'login' ? 'Successfully logged in! 🎉' : 'Account created successfully! 🚀');
      onAuthSuccess({ username: data.username, role: data.role });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl overflow-hidden font-sans"
      >
        <div className="absolute w-[200px] h-[200px] rounded-full bg-amber-500/5 blur-3xl -top-10 -right-10 pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center mb-6 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/5">
            <KeyRound size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-100 uppercase tracking-wide">
              {tab === 'login' ? 'Welcome Back' : 'Join LifeTalk Sim'}
            </h3>
            <p className="text-[11px] text-slate-450 mt-1 uppercase tracking-wider font-semibold">
              {tab === 'login' ? 'Access your cloud-synced progress' : 'Sync your profile metrics & dialogues to Firestore'}
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 bg-slate-950 border border-slate-850 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'login'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            LOG IN
          </button>
          <button
            onClick={() => { setTab('signup'); setError(''); }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'signup'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SIGN UP
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Username</label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 text-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none transition-all placeholder:text-slate-600 font-medium"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === 'login' ? 'Enter your password' : 'Minimum 6 characters'}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 text-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none transition-all placeholder:text-slate-600 font-medium"
                required
              />
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-rose-450 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-[11px] font-semibold leading-relaxed"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-yellow-700 disabled:opacity-50 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{tab === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</span>
            )}
          </button>
        </form>

        <p className="text-[10px] text-slate-500 text-center mt-6 uppercase tracking-wider font-semibold">
          {tab === 'login'
            ? "Don't have an account? Sign up to secure progress"
            : 'Sign up to keep metrics safely in sync with our database'}
        </p>
      </motion.div>
    </div>
  );
}
