import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, X, RefreshCw } from 'lucide-react';

const Toast = ({ id, type, message, onClose, onRetry, duration = 5000 }) => {
  useEffect(() => {
    if (type !== 'error' || !onRetry) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, type, onRetry, duration, onClose]);

  const icons = {
    success: <CheckCircle size={20} className="text-green-600" />,
    error: <XCircle size={20} className="text-red-600" />,
    info: <AlertCircle size={20} className="text-blue-600" />
  };

  const bgColors = {
    success: 'bg-green-50',
    error: 'bg-red-50',
    info: 'bg-blue-50'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`${bgColors[type]} border-2 border-[#191A23] shadow-[4px_4px_0_#191A23] p-4 rounded-lg min-w-[300px] max-w-[400px]`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {icons[type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#191A23] break-words">
            {message}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onRetry && type === 'error' && (
            <button
              onClick={() => onRetry()}
              className="p-1 hover:bg-red-100 rounded transition-colors"
              title="Retry"
            >
              <RefreshCw size={16} className="text-[#191A23]" />
            </button>
          )}
          <button
            onClick={() => onClose(id)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Close"
          >
            <X size={16} className="text-[#191A23]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const ToastContainer = ({ toasts, onClose, onRetry }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={onClose}
            onRetry={toast.retryFn ? () => onRetry(toast.id) : null}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
