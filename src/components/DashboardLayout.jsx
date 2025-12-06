import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFileContext } from '../context/FileContext';
import { Upload, Menu, Search, CheckCircle, AlertCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import Breadcrumb from './Breadcrumb';
import { ToastContainer } from './Toast';
import ConfirmDialog from './ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';

// Utility functions for localStorage preview management
const PREVIEW_STORAGE_KEY = 'filePreviews';

function savePreviewToLocal(fileId, previewData) {
  let previews = JSON.parse(localStorage.getItem(PREVIEW_STORAGE_KEY) || '{}');
  previews[fileId] = previewData;
  localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(previews));
}

function getPreviewFromLocal(fileId) {
  const previews = JSON.parse(localStorage.getItem(PREVIEW_STORAGE_KEY) || '{}');
  return previews[fileId] || null;
}

const DashboardLayout = ({ children }) => {
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, storage, uploadQueue, setUploadQueue, triggerUpload, fileInputRef, uploadFiles, toasts, removeToast, retry } = useFileContext();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUploadHovered, setIsUploadHovered] = useState(false); // State for smooth button animation
  const [previews, setPreviews] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  // Load previews from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(PREVIEW_STORAGE_KEY);
    if (stored) {
      setPreviews(JSON.parse(stored));
    }
  }, []);

  // Function to handle preview generation and storage
  const handlePreview = (fileId, previewData) => {
    savePreviewToLocal(fileId, previewData);
    setPreviews(prev => ({ ...prev, [fileId]: previewData }));
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ...NavItem removed, now handled in Sidebar

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F3F3F3] text-[#191A23] font-sans relative">
      
      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Log Out?"
        message="Are you sure you want to log out of your account?"
        confirmText="Log Out"
        isDangerous={false}
      />
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} onRetry={retry} />
      
      {/* Hidden File Input */}
      <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => uploadFiles(e.target.files)} />

      {/* Upload Progress Toast */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }} 
            className="fixed bottom-20 right-4 md:bottom-24 md:right-8 w-[calc(100vw-2rem)] max-w-80 bg-white border-2 border-[#191A23] rounded-xl shadow-[4px_4px_0_#191A23] overflow-hidden z-[60]"
          >
            <div className="bg-[#B9FF66] border-b-2 border-[#191A23] px-4 py-3 flex justify-between items-center">
              <span className="font-bold text-sm text-[#191A23]">Uploading ({uploadQueue.length})</span>
              {uploadQueue.every(i => i.status !== 'uploading') && (
                <button onClick={() => setUploadQueue([])} className="text-xs font-bold hover:underline">Close</button>
              )}
            </div>
            <div className="max-h-60 overflow-y-auto p-3 space-y-3">
              {uploadQueue.map(item => (
                <div key={item.id} className="text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="truncate w-3/4 font-bold">{item.name}</span>
                    {item.status === 'success' ? <CheckCircle size={16} className="text-green-600"/> : 
                     item.status === 'error' ? <AlertCircle size={16} className="text-red-600"/> : 
                     <span className="text-xs font-bold">{item.progress}%</span>}
                  </div>
                  <div className="w-full h-3 bg-gray-200 border-2 border-[#191A23] rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${item.status === 'error' ? 'bg-red-500' : 'bg-[#191A23]'}`} 
                      style={{ width: `${item.progress}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
  layout
  layoutTransition={{ duration: 0.22, ease: "easeInOut" }}
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  whileTap={{ scale: 0.96 }}
  onMouseEnter={() => setIsUploadHovered(true)}
  onMouseLeave={() => setIsUploadHovered(false)}
  onClick={triggerUpload}
  transition={{
    type: "spring",
    stiffness: 260,
    damping: 30,
    mass: 0.6,
  }}
  className="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-[#191A23] text-white h-12 md:h-14 rounded-full border-2 border-[#191A23] shadow-[4px_4px_0_#B9FF66] hover:shadow-[2px_2px_0_#B9FF66] transition-shadow z-[55] flex items-center justify-center overflow-hidden px-3 md:px-4"
>
  <motion.div layout className="flex items-center gap-2">
    <Upload size={20} className="md:w-6 md:h-6" />
    <AnimatePresence initial={false}>
      {isUploadHovered && (
        <motion.span
          key="upload-label"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "auto", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
          className="font-bold whitespace-nowrap overflow-hidden hidden md:inline"
        >
          Upload New
        </motion.span>
      )}
    </AnimatePresence>
  </motion.div>
</motion.button>


      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* SIDEBAR */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        storage={storage}
        user={user}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300">
        <header className="h-16 md:h-20 bg-white border-b-2 border-[#191A23] px-3 md:px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 border-2 border-[#191A23] rounded-lg bg-[#B9FF66] shadow-[2px_2px_0_#191A23]">
              <Menu size={20} />
            </button>
            <h1 className="text-xl md:text-2xl font-bold hidden sm:block">Dashboard</h1>
          </div>

          <div className="flex-1 max-w-lg mx-3 md:mx-6 relative hidden md:block">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search your files..."
              className="w-full pl-12 pr-4 py-3 bg-[#F3F3F3] border-2 border-[#191A23] rounded-full focus:outline-none focus:shadow-[4px_4px_0_#191A23] transition-shadow placeholder-gray-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Account Details Dropdown */}
            <div className="relative">
              <div
                className="w-10 h-10 bg-[#B9FF66] rounded-full flex items-center justify-center border-2 border-[#191A23] cursor-pointer hover:shadow-[2px_2px_0_#191A23] transition-shadow"
                onClick={() => setShowAccountDetails((prev) => !prev)}
                title="Account details"
              >
                <span className="font-bold">{user.name?.[0] || 'U'}</span>
              </div>
              {showAccountDetails && (
                <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-[#191A23] rounded-xl shadow-lg p-4 z-50 animate-fade-in">
                  <h3 className="font-bold text-lg mb-2">Account Details</h3>
                  <div className="mb-2"><span className="font-semibold">Name:</span> {user.name || 'Unknown'}</div>
                  <div className="mb-2"><span className="font-semibold">Email:</span> {user.email || 'Unknown'}</div>
                  <div className="mb-2"><span className="font-semibold">Storage Used:</span> {formatBytes(storage.used)} / {formatBytes(storage.limit)}</div>
                  <button
                    className="mt-2 px-4 py-2 bg-[#191A23] text-white border-2 border-[#191A23] rounded-lg font-bold hover:bg-red-600 hover:border-red-600 transition-colors shadow-[2px_2px_0_#191A23] hover:shadow-[2px_2px_0_#B9FF66]"
                    onClick={() => { setShowAccountDetails(false); setShowLogoutConfirm(true); }}
                  >Log Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden p-3 sm:p-4 md:p-6 lg:p-8 bg-white/50 relative">
           <div className="w-full h-full overflow-y-auto pr-1 md:pr-2">
             {/* Breadcrumb Navigation */}
             <Breadcrumb />
             
             {/* Pass searchTerm and setSearchTerm as props to children */}
             {React.cloneElement(children, { searchTerm, setSearchTerm })}
             {/* ...existing code... */}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;