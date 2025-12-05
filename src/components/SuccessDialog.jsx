import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const SuccessDialog = ({ isOpen, onClose, title = "Success!", message }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />

          {/* Dialog Box */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white border-2 border-[#191A23] rounded-2xl shadow-[8px_8px_0_#191A23] p-6 overflow-hidden"
          >
            {/* Decorative Corner */}
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-[#B9FF66] rounded-full border-2 border-[#191A23]"></div>

            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 bg-[#B9FF66] rounded-full border-2 border-[#191A23] flex items-center justify-center mb-4 shadow-[2px_2px_0_#191A23]">
                <CheckCircle size={32} className="text-[#191A23]" strokeWidth={2.5} />
              </div>
              
              <h3 className="text-2xl font-bold text-[#191A23] mb-2">{title}</h3>
              <p className="text-gray-600 mb-6 font-medium leading-relaxed">{message}</p>

              <button
                onClick={onClose}
                className="w-full bg-[#191A23] text-white font-bold py-3 rounded-xl shadow-[4px_4px_0_#191A23] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#191A23] transition-all border-2 border-[#191A23]"
              >
                Continue to Login
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SuccessDialog;