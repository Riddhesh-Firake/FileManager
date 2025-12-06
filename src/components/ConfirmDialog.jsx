import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel', isDangerous = true }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md mx-4 bg-white border-2 border-[#191A23] rounded-2xl shadow-[8px_8px_0_#191A23] p-5 sm:p-6"
          >
            <div className="flex items-start gap-4 mb-4">
              {isDangerous && (
                <div className="w-10 h-10 bg-red-100 border-2 border-[#191A23] rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{message}</p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 sm:flex-initial px-4 py-3 font-bold border-2 border-[#191A23] rounded-xl hover:bg-gray-100 transition-colors"
              >
                {cancelText}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 sm:flex-initial px-4 py-3 font-bold rounded-xl shadow-[2px_2px_0_#191A23] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all border-2 border-[#191A23] ${
                  isDangerous ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#191A23] text-white'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
