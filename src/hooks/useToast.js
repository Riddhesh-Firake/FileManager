import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', retryFn = null) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type,
      retryFn
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const retry = useCallback((id) => {
    const toast = toasts.find(t => t.id === id);
    if (toast && toast.retryFn) {
      removeToast(id);
      toast.retryFn();
    }
  }, [toasts, removeToast]);

  return {
    toasts,
    addToast,
    removeToast,
    retry
  };
};
