import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, RefreshCw, KeyRound, ArrowLeft, ShieldAlert, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from './Toast';

interface AdminPanelProps {
  onBack: () => void;
}

interface UserRecord {
  username: string;
  role: string;
  createdAt: string;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        throw new Error('Failed to retrieve user list.');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching users.');
      toast.error('Could not fetch user registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setResetting(true);
    setResetMessage('');

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUsername: selectedUser.username,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }

      setResetMessage(`Successfully reset password for ${selectedUser.username}!`);
      toast.success(`Password updated for ${selectedUser.username}.`);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResetting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-6 p-6 sm:p-10 w-full bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2.5rem] border border-slate-900/60 shadow-2xl relative overflow-hidden font-sans min-h-[580px]"
    >
      <div className="absolute w-[450px] h-[450px] rounded-full bg-red-500/5 blur-[120px] top-10 left-10 pointer-events-none"></div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 text-slate-400 hover:text-white rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-amber-500 w-5 h-5 animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase leading-none font-sans">
                Admin Security Desk
              </h2>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">
              Secure Cloud Firestore Database Control & Credentials Overrides
            </p>
          </div>
        </div>

        <button
          onClick={fetchUsers}
          className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>REFRESH DIRECTORY</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 items-start">
        
        {/* User Directory Table (Lefthand Column) */}
        <div className="lg:col-span-2 flex flex-col bg-slate-950 border border-slate-850 rounded-2xl p-4 sm:p-6 shadow-lg min-h-[420px]">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Users size={14} className="text-amber-500" />
              <span>User Accounts ({filteredUsers.length})</span>
            </h3>
            
            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search usernames..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 text-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600 font-medium font-sans"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2.5">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">Loading Accounts Registry...</span>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-red-400 gap-2 p-6 border border-dashed border-red-950 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
              <span className="text-xs font-bold">{error}</span>
              <button
                onClick={fetchUsers}
                className="mt-2 text-[10px] font-bold text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs py-14">
              No registered player records found matching "{searchQuery}".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-450 uppercase text-[9px] font-black tracking-widest">
                    <th className="pb-3 pl-2">Username</th>
                    <th className="pb-3">Security Level</th>
                    <th className="pb-3">Registered At</th>
                    <th className="pb-3 text-right pr-2">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.username}
                      className={`hover:bg-slate-900/40 transition-colors group ${
                        selectedUser?.username === u.username ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-3 pl-2 font-black text-slate-200">{u.username}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                          u.role === 'admin'
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-[10px]">
                        {new Date(u.createdAt).toLocaleDateString()} {new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 text-right pr-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setNewPassword('');
                            setResetMessage('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase text-amber-500 border border-amber-500/15 group-hover:border-amber-500/40 hover:bg-amber-500/10 transition-colors cursor-pointer"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Credentials Reset Desk (Righthand Column) */}
        <div className="flex flex-col bg-slate-950 border border-slate-850 rounded-2xl p-4 sm:p-6 shadow-lg min-h-[420px]">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-5">
            <KeyRound size={14} className="text-amber-500" />
            <span>Credentials Override Desk</span>
          </h3>

          <AnimatePresence mode="wait">
            {selectedUser ? (
              <motion.div
                key="active-reset"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col gap-4"
              >
                <div className="bg-slate-900 border border-slate-850 rounded-xl p-4">
                  <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest block mb-0.5">Selected Account</span>
                  <span className="text-base font-extrabold text-white block">{selectedUser.username}</span>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded mt-1.5">
                    Role: {selectedUser.role}
                  </span>
                </div>

                <form onSubmit={handleResetPassword} className="flex flex-col gap-4 mt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all placeholder:text-slate-650 font-medium font-sans"
                      required
                    />
                  </div>

                  {resetMessage && (
                    <div className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-[11px] font-semibold flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{resetMessage}</span>
                    </div>
                  )}

                  <div className="flex gap-2.5 mt-2">
                    <button
                      type="submit"
                      disabled={resetting}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-yellow-700 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {resetting ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Syncing...</span>
                        </>
                      ) : (
                        <span>OVERRIDE PASSWORD</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="px-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                    >
                      CLEAR
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="no-select"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-850 rounded-2xl"
              >
                <Users size={28} className="text-slate-700 mb-2.5" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Select a Player</p>
                <p className="text-[10px] text-slate-550 leading-relaxed mt-1 max-w-[180px]">
                  Click the "Select" button on any user in the directory grid to reset their login credentials directly.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}
