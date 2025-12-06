import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, X, Loader2 } from 'lucide-react';

const CreateFolderDialog = ({ isOpen, onClose, onCreate }) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const validateFolderName = (name) => {
    // Check if empty or only whitespace
    if (!name || name.trim() === '') {
      return 'Folder name cannot be empty';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const validationError = validateFolderName(folderName);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Clear error and call onCreate
    setError('');
    setIsCreating(true);
    
    try {
      await onCreate(folderName.trim());
      // Reset form on success
      setFolderName('');
    } catch (err) {
      // Error is handled by the context
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    setError('');
    onClose();
  };

  const handleInputChange = (e) => {
    setFolderName(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
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
            onClick={handleClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm mx-4 bg-white border-2 border-[#191A23] rounded-2xl shadow-[8px_8px_0_#191A23] p-5 sm:p-6"
          >
            <button 
              onClick={handleClose}
              className="absolute -top-4 -right-4 w-10 h-10 bg-[#B9FF66] rounded-full border-2 border-[#191A23] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer z-10"
            >
              <X size={20} className="text-[#191A23]" />
            </button>
            
            <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
              <FolderPlus size={20} /> Create Folder
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input 
                  type="text" 
                  value={folderName}
                  onChange={handleInputChange}
                  placeholder="Enter folder name"
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    error ? 'border-red-500' : 'border-[#191A23]'
                  } focus:outline-none focus:shadow-[2px_2px_0_#191A23] bg-[#F3F3F3] focus:bg-white`}
                  autoFocus
                />
                {error && (
                  <p className="text-red-500 text-sm mt-2 font-medium">
                    {error}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={handleClose} 
                  disabled={isCreating}
                  className="flex-1 py-3 font-bold border-2 border-transparent hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="flex-1 bg-[#191A23] text-white font-bold py-3 rounded-xl shadow-[2px_2px_0_#191A23] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all border-2 border-[#191A23] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateFolderDialog;
