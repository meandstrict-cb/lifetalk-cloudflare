import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Coins, 
  Zap, 
  Trophy, 
  ShieldCheck 
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'coins' | 'energy' | 'achievement' | 'shield';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

type ToastEventData = {
  message: string;
  type: ToastType;
  duration?: number;
};

// Global static toast helper
export const toast = {
  show: (message: string, type: ToastType = 'info', duration?: number) => {
    const event = new CustomEvent('app-toast', { detail: { message, type, duration } });
    window.dispatchEvent(event);
  },
  success: (message: string, duration?: number) => toast.show(message, 'success', duration),
  error: (message: string, duration?: number) => toast.show(message, 'error', duration),
  warning: (message: string, duration?: number) => toast.show(message, 'warning', duration),
  info: (message: string, duration?: number) => toast.show(message, 'info', duration),
  coins: (message: string, duration?: number) => toast.show(message, 'coins', duration),
  energy: (message: string, duration?: number) => toast.show(message, 'energy', duration),
  achievement: (message: string, duration?: number) => toast.show(message, 'achievement', duration),
  shield: (message: string, duration?: number) => toast.show(message, 'shield', duration),
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastEventData>;
      const { message, type, duration = 4500 } = customEvent.detail;
      const id = Math.random().toString(36).substring(2, 9);
      
      setToasts((prev) => [
        ...prev,
        { id, message, type, duration }
      ]);
    };

    window.addEventListener('app-toast', handleToastEvent);
    return () => window.removeEventListener('app-toast', handleToastEvent);
  }, []);

  // Toast theme styles
  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-slate-950/90 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
          icon: <CheckCircle2 className="text-emerald-400 w-5 h-5 flex-shrink-0 animate-pulse" />,
          title: 'Success',
          barBg: 'bg-emerald-500'
        };
      case 'error':
        return {
          bg: 'bg-slate-950/90 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]',
          icon: <AlertCircle className="text-rose-400 w-5 h-5 flex-shrink-0 animate-bounce" />,
          title: 'Error',
          barBg: 'bg-rose-500'
        };
      case 'warning':
        return {
          bg: 'bg-slate-950/90 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
          icon: <AlertTriangle className="text-amber-400 w-5 h-5 flex-shrink-0" />,
          title: 'Warning',
          barBg: 'bg-amber-500'
        };
      case 'coins':
        return {
          bg: 'bg-slate-950/90 border-yellow-500/35 shadow-[0_0_20px_rgba(234,179,8,0.2)]',
          icon: <Coins className="text-yellow-400 w-5 h-5 flex-shrink-0" />,
          title: 'Rewards Unlocked',
          barBg: 'bg-yellow-500'
        };
      case 'energy':
        return {
          bg: 'bg-slate-950/90 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
          icon: <Zap className="text-cyan-400 w-5 h-5 flex-shrink-0" />,
          title: 'Energy Refreshed',
          barBg: 'bg-cyan-500'
        };
      case 'achievement':
        return {
          bg: 'bg-slate-950/90 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]',
          icon: <Trophy className="text-purple-400 w-5 h-5 flex-shrink-0" />,
          title: 'Level Up!',
          barBg: 'bg-purple-500'
        };
      case 'shield':
        return {
          bg: 'bg-slate-950/90 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]',
          icon: <ShieldCheck className="text-blue-400 w-5 h-5 flex-shrink-0" />,
          title: 'Streak Freezed',
          barBg: 'bg-blue-500'
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-950/90 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]',
          icon: <Info className="text-indigo-400 w-5 h-5 flex-shrink-0" />,
          title: 'Information',
          barBg: 'bg-indigo-500'
        };
    }
  };

  return (
    <div id="toast-container" className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full sm:w-[380px] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toastItem) => {
          const styles = getStyles(toastItem.type);
          return (
            <ToastCard 
              key={toastItem.id} 
              item={toastItem} 
              styles={styles} 
              onRemove={removeToast} 
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
};

interface ToastCardProps {
  item: ToastItem;
  styles: ReturnType<typeof ToastContainer.prototype.getStyles>;
  onRemove: (id: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ item, styles, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(item.id);
    }, item.duration);

    return () => clearTimeout(timer);
  }, [item.id, item.duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-md p-4 flex gap-3 ${styles.bg}`}
    >
      <div className="mt-0.5">{styles.icon}</div>
      <div className="flex-1 flex flex-col gap-0.5 pr-4">
        <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
          {styles.title}
        </span>
        <p className="text-xs font-medium text-slate-100 leading-relaxed whitespace-pre-line">
          {item.message}
        </p>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-900/50"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress timer bar */}
      <motion.div 
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: item.duration / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-[3px] ${styles.barBg}`}
      />
    </motion.div>
  );
};
