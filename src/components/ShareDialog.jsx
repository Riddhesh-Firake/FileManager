import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, X } from 'lucide-react';

const ShareDialog = ({ isOpen, onClose, onShare, fileName }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      onShare(email);
      setEmail('');
    }
  };

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
            className="relative w-full max-w-sm mx-4 bg-white border-2 border-[#191A23] rounded-2xl shadow-[8px_8px_0_#191A23] p-5 sm:p-6"
          >
            <button 
              onClick={onClose}
              className="absolute -top-4 -right-4 w-10 h-10 bg-[#B9FF66] rounded-full border-2 border-[#191A23] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer z-10"
            >
              <X size={20} className="text-[#191A23]" />
            </button>
            
            <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
              <Share2 size={20} /> Share {fileName}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-4 py-3 rounded-xl border-2 border-[#191A23] mb-4 focus:outline-none focus:shadow-[2px_2px_0_#191A23] bg-[#F3F3F3] focus:bg-white"
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 py-3 font-bold border-2 border-transparent hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-[#191A23] text-white font-bold py-3 rounded-xl shadow-[2px_2px_0_#191A23] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all border-2 border-[#191A23]"
                >
                  Share
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShareDialog;
