import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, Bell, Info, X } from 'lucide-react';

// Toast component — renders at top-right
export default function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col space-y-3 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, []);

  const config = {
    success: { icon: <CheckCircle size={18} />, bg: 'bg-green-600', bar: 'bg-green-400' },
    error:   { icon: <AlertTriangle size={18} />, bg: 'bg-red-600', bar: 'bg-red-400' },
    info:    { icon: <Bell size={18} />, bg: 'bg-indigo-600', bar: 'bg-indigo-400' },
    warning: { icon: <Info size={18} />, bg: 'bg-yellow-600', bar: 'bg-yellow-400' },
  }[toast.type || 'info'];

  return (
    <div
      className={`pointer-events-auto flex items-start space-x-3 ${config.bg} text-white px-4 py-3 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden relative`}
      style={{ animation: 'slideInRight 0.3s ease-out' }}
    >
      <span className="flex-shrink-0 mt-0.5">{config.icon}</span>
      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-bold text-sm">{toast.title}</p>}
        <p className="text-sm opacity-90 leading-snug">{toast.message}</p>
      </div>
      <button onClick={onRemove} className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity">
        <X size={16} />
      </button>
      {/* Auto-dismiss progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${config.bar}`}
        style={{ animation: `shrink ${toast.duration || 4000}ms linear forwards` }}
      />
      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        @keyframes shrink { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
}
