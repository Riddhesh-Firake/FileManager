import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Files, Clock, Star, Trash2, Upload, Menu, X, Search, Users, 
  FileText, Image as ImageIcon, SortAsc, Loader2, Download, Edit2, Eye,
  ChevronLeft, ChevronRight, Grid, List, CheckCircle, AlertCircle, File,
  MoreVertical, RefreshCcw, Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RenameDialog from '../components/RenameDialog';

// --- INTERNAL COMPONENT: File Thumbnail ---
const FileThumbnail = ({ file, size = 'normal' }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (file.fileType?.includes('image') && !file.isDeleted) {
      const fetchImage = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`http://localhost:5000/api/files/${file._id}/download`, {
            headers: { 'x-auth-token': token }
          });
          if (isMounted) {
            setImageUrl(res.data.downloadUrl);
            setLoading(false);
          }
        } catch (err) {
          if (isMounted) {
            setError(true);
            setLoading(false);
          }
        }
      };
      fetchImage();
    } else {
      setLoading(false);
    }

    return () => { isMounted = false; };
  }, [file._id, file.fileType, file.isDeleted]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }

  if (imageUrl && !error) {
    return (
      <img 
        src={imageUrl} 
        alt={file.fileName}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    );
  }

  if (file.fileType?.includes('pdf')) return <FileText size={size === 'large' ? 48 : 24} className="text-[#191A23]" />;
  if (file.fileType?.includes('image')) return <ImageIcon size={size === 'large' ? 48 : 24} className="text-gray-400" />; 
  return <File size={size === 'large' ? 48 : 24} className="text-[#191A23]" />;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [currentView, setCurrentView] = useState('my-files'); 
  const [viewMode, setViewMode] = useState('list');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUploadHovered, setIsUploadHovered] = useState(false);
  
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [storage, setStorage] = useState({ used: 0, limit: 262144000 });
  const [user, setUser] = useState({ name: 'User', email: '' });
  const [loadingFiles, setLoadingFiles] = useState(true);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadQueue, setUploadQueue] = useState([]); 
  const fileInputRef = useRef(null);
  const [renameFile, setRenameFile] = useState(null);

  // --- INITIAL LOAD ---
  const fetchFiles = async () => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);

    if (!token) return navigate('/login');

    try {
      const res = await axios.get('http://localhost:5000/api/files', {
        headers: { 'x-auth-token': token }
      });
      setFiles(res.data.files);
      setStorage({
        used: res.data.storage.storageUsed,
        limit: res.data.storage.storageLimit
      });
    } catch (err) {
      console.error(err);
      if(err.response?.status === 401) navigate('/login');
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // --- VIEW LOGIC & SEARCH ---
  useEffect(() => {
    let result = [];

    switch(currentView) {
      case 'my-files':
        result = files.filter(f => !f.isDeleted);
        break;
      case 'recent':
        result = files.filter(f => !f.isDeleted).sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 10);
        break;
      case 'starred':
        result = files.filter(f => !f.isDeleted && f.isStarred);
        break;
      case 'trash':
        result = files.filter(f => f.isDeleted);
        break;
      case 'shared':
        result = [];
        break;
      default:
        result = files.filter(f => !f.isDeleted);
    }

    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase().trim();
      result = result.filter(f => f.fileName.toLowerCase().includes(lowerQ));
    }

    setFilteredFiles(result);
  }, [currentView, files, searchQuery]);

  // --- UPLOAD LOGIC ---
  const handleUploadFiles = async (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;

    const totalSize = newFiles.reduce((acc, file) => acc + file.size, 0);
    if (storage.used + totalSize > storage.limit) {
      alert("Storage limit exceeded! Upload cancelled.");
      return;
    }

    const newQueueItems = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      progress: 0,
      status: 'uploading',
      fileObject: file
    }));

    setUploadQueue(prev => [...prev, ...newQueueItems]);
    newQueueItems.forEach(item => uploadSingleFile(item));
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadSingleFile = async (queueItem) => {
    const formData = new FormData();
    formData.append('file', queueItem.fileObject);
    const token = localStorage.getItem('token');

    try {
      await axios.post('http://localhost:5000/api/files/upload', formData, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadQueue(prev => prev.map(i => 
            i.id === queueItem.id ? { ...i, progress: percentCompleted } : i
          ));
        }
      });

      setUploadQueue(prev => prev.map(i => 
        i.id === queueItem.id ? { ...i, status: 'success', progress: 100 } : i
      ));
      
      fetchFiles();

      setTimeout(() => {
        setUploadQueue(prev => prev.filter(i => i.id !== queueItem.id));
      }, 3000);

    } catch (err) {
      setUploadQueue(prev => prev.map(i => 
        i.id === queueItem.id ? { ...i, status: 'error', progress: 0 } : i
      ));
    }
  };

  // --- FILE ACTIONS ---
  const handleToggleStar = async (fileId, e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5000/api/files/${fileId}/star`, {}, { headers: { 'x-auth-token': token } });
      fetchFiles();
    } catch(err) {
      console.error(err);
    }
  };

  const handleSoftDelete = async (fileId, e) => {
    if(e) e.stopPropagation();
    if(!window.confirm("Move to Trash?")) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/files/${fileId}`, { headers: { 'x-auth-token': token } });
      fetchFiles();
      if (selectedFile?._id === fileId) setSelectedFile(null);
    } catch(err) {
      alert("Action failed");
    }
  };

  const handleRestore = async (fileId, e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5000/api/files/${fileId}/restore`, {}, { headers: { 'x-auth-token': token } });
      fetchFiles();
    } catch(err) {
      alert("Restore failed");
    }
  };

  const handlePermanentDelete = async (fileId, e) => {
    e.stopPropagation();
    if(!window.confirm("Permanently delete? This cannot be undone.")) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/files/${fileId}/permanent`, { headers: { 'x-auth-token': token } });
      fetchFiles();
      if (selectedFile?._id === fileId) setSelectedFile(null);
    } catch(err) {
      alert("Delete failed");
    }
  };

  const handleRenameInit = (file, e) => {
    if(e) e.stopPropagation();
    setRenameFile(file);
  };

  const handleRenameSubmit = async (newName) => {
    if (!renameFile) return;
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5000/api/files/${renameFile._id}`, 
        { newName },
        { headers: { 'x-auth-token': token } }
      );
      setRenameFile(null); 
      fetchFiles(); 
      if (selectedFile?._id === renameFile._id) {
        setSelectedFile(prev => ({...prev, fileName: newName}));
      }
    } catch (err) {
      alert("Rename failed");
    }
  };

  const handleDownload = async (fileId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`http://localhost:5000/api/files/${fileId}/download`, {
        headers: { 'x-auth-token': token }
      });
      window.open(res.data.downloadUrl, '_blank');
    } catch (err) {
      alert("Could not generate download link.");
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // --- HELPER FUNCTIONS ---
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPageTitle = () => {
    if(currentView === 'my-files') return 'My Files';
    if(currentView === 'recent') return 'Recent Files';
    if(currentView === 'shared') return 'Shared With Me';
    if(currentView === 'starred') return 'Starred';
    if(currentView === 'trash') return 'Trash';
    return 'Dashboard';
  };

  // --- NAV ITEM COMPONENT ---
  const NavItem = ({ id, label, icon: Icon }) => {
    const isActive = currentView === id;
    
    return (
      <motion.div 
        layout
        onClick={() => { setCurrentView(id); if(window.innerWidth < 768) setSidebarOpen(false); }} 
        className={`
          flex items-center cursor-pointer transition-all duration-200 border-2
          ${isCollapsed ? 'justify-center w-12 h-12 px-0' : 'w-full px-4 py-3 gap-3'}
          ${isActive 
            ? 'bg-[#F3F3F3] border-[#191A23] shadow-[2px_2px_0_#191A23] text-[#191A23]' 
            : 'border-transparent hover:border-[#191A23] hover:bg-[#F3F3F3] text-gray-500 hover:shadow-[2px_2px_0_#191A23]'
          }
          rounded-xl
        `}
        transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
      >
        <Icon size={20} className="flex-shrink-0" />
        
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.span 
              key={`nav-${id}`}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="font-bold whitespace-nowrap overflow-hidden"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const storagePercentage = Math.min((storage.used / storage.limit) * 100, 100);

  return (
    <div className="w-full h-screen overflow-hidden flex bg-[#F3F3F3] text-[#191A23] font-sans">
      
      {renameFile && (
        <RenameDialog 
          isOpen={!!renameFile} 
          currentName={renameFile.fileName} 
          onClose={() => setRenameFile(null)} 
          onRename={handleRenameSubmit} 
        />
      )}

      {/* UPLOAD PROGRESS */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 w-80 bg-white border-2 border-[#191A23] rounded-xl shadow-[4px_4px_0_#191A23] overflow-hidden z-50"
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

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* SIDEBAR */}
      <motion.aside 
        layout
        className={`
          bg-white border-r-2 border-[#191A23] flex flex-col justify-between 
          fixed md:relative z-40 h-full
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        animate={{ width: isCollapsed ? 88 : 260 }} 
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 28,
          mass: 0.8,
        }}
        style={{ willChange: "width" }}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-24 bg-white border-2 border-[#191A23] rounded-full p-1.5 shadow-[2px_2px_0_#191A23] hidden md:block z-50 hover:bg-[#B9FF66] transition-colors"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ChevronRight size={16} />
          </motion.div>
        </button>

        <div>
          {/* Logo */}
          <motion.div 
            layout
            className="h-20 flex items-center border-b-2 border-[#191A23] bg-[#B9FF66] cursor-pointer"
            onClick={() => navigate('/')}
            transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
          >
            <motion.div 
              layout
              className="w-8 h-8 bg-white border-2 border-[#191A23] rounded flex items-center justify-center flex-shrink-0"
              animate={{ marginLeft: isCollapsed ? "auto" : "24px", marginRight: isCollapsed ? "auto" : "12px" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <span className="font-bold text-lg">P</span>
            </motion.div>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.span
                  key="logo-text"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden"
                >
                  Positivus
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="p-4 space-y-4">
            {/* Upload Button */}
            <motion.button 
              layout
              onClick={() => fileInputRef.current.click()}
              className="w-full bg-[#191A23] text-white font-bold rounded-xl flex items-center justify-center h-12 transition-all shadow-[4px_4px_0_#191A23] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#191A23] border-2 border-[#191A23]"
              transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
            >
              <Upload size={20} />
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.span
                    key="upload-text"
                    initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                    animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
                    exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    Upload New
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleUploadFiles} 
            />

            <nav className="space-y-2">
              <NavItem id="my-files" label="My Files" icon={Files} />
              <NavItem id="recent" label="Recent" icon={Clock} />
              <NavItem id="shared" label="Shared" icon={Users} />
              <NavItem id="starred" label="Starred" icon={Star} />
              <NavItem id="trash" label="Trash" icon={Trash2} />
            </nav>
          </div>
        </div>

        {/* Storage Widget */}
        <AnimatePresence initial={false} mode="wait">
          {!isCollapsed && (
            <motion.div 
              key="storage-widget"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-6 border-t-2 border-[#191A23] bg-[#F3F3F3] overflow-hidden"
            >
              <div className="flex justify-between items-end mb-2">
                <span className="font-bold text-sm">Storage</span>
                <span className="text-xs font-bold text-gray-500">{storagePercentage.toFixed(0)}% used</span>
              </div>
              <div className="w-full h-4 bg-white border-2 border-[#191A23] rounded-full overflow-hidden mb-2">
                <div className="h-full bg-[#B9FF66] border-r-2 border-[#191A23]" style={{ width: `${storagePercentage}%` }}></div>
              </div>
              <p className="text-xs text-gray-600 font-medium">{formatBytes(storage.used)} of {formatBytes(storage.limit)} used</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* User Profile (Collapsed) */}
        <AnimatePresence initial={false} mode="wait">
          {isCollapsed && (
            <motion.div
              key="user-avatar"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-4 border-t-2 border-[#191A23] bg-[#F3F3F3] flex justify-center overflow-hidden"
            >
              <div className="w-10 h-10 rounded-full bg-[#B9FF66] border-2 border-[#191A23] flex items-center justify-center font-bold">
                {user.name?.[0] || 'U'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* HEADER */}
        <header className="h-16 md:h-20 bg-white border-b-2 border-[#191A23] px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 border-2 border-[#191A23] rounded-lg bg-[#B9FF66] shadow-[2px_2px_0_#191A23] flex-shrink-0">
              <Menu size={20} />
            </button>
            <h1 className="text-lg md:text-2xl font-bold truncate">{getPageTitle()}</h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-4 md:mx-6 relative hidden sm:block">
            <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..." 
              className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base bg-[#F3F3F3] border-2 border-[#191A23] rounded-full focus:outline-none focus:shadow-[4px_4px_0_#191A23] transition-shadow placeholder-gray-500 font-medium" 
            />
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 md:gap-4">
            {!isCollapsed && (
              <div className="text-right hidden lg:block">
                <p className="font-bold text-sm leading-tight">{user.name}</p>
                <p className="text-xs text-gray-500 font-bold">Free Plan</p>
              </div>
            )}
            <div 
              className="w-8 h-8 md:w-10 md:h-10 bg-[#B9FF66] rounded-full flex items-center justify-center border-2 border-[#191A23] cursor-pointer hover:shadow-[2px_2px_0_#191A23] transition-shadow flex-shrink-0"
              onClick={() => { if(window.confirm('Log out?')) { localStorage.removeItem('token'); navigate('/login'); } }}
              title="Click to Log Out"
            >
              <span className="font-bold text-sm md:text-base">{user.name?.[0] || 'U'}</span>
            </div>
          </div>
        </header>

        {/* CONTENT + RIGHT PANEL WRAPPER */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* File List Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base md:text-lg">{getPageTitle()}</span>
                <span className="bg-[#B9FF66] border-2 border-[#191A23] text-xs px-2 py-0.5 rounded-full font-bold">{filteredFiles.length}</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg border-2 border-[#191A23] transition-all ${viewMode === 'list' ? 'bg-[#191A23] text-white shadow-[2px_2px_0_#B9FF66]' : 'bg-white hover:bg-[#F3F3F3]'}`}
                >
                  <List size={18} className="md:w-5 md:h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg border-2 border-[#191A23] transition-all ${viewMode === 'grid' ? 'bg-[#191A23] text-white shadow-[2px_2px_0_#B9FF66]' : 'bg-white hover:bg-[#F3F3F3]'}`}
                >
                  <Grid size={18} className="md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            {loadingFiles ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Loader2 size={40} className="animate-spin mb-4 text-[#191A23]" />
                <p className="font-bold">Loading your files...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-400 rounded-2xl bg-white/50">
                <div className="bg-gray-100 p-4 rounded-full mb-4 border-2 border-[#191A23]">
                  <Upload size={32} className="text-[#191A23]" />
                </div>
                <p className="text-[#191A23] font-bold text-lg">No files found.</p>
                <p className="text-gray-500 font-medium text-sm md:text-base">
                  {currentView === 'shared' ? 'Sharing functionality is coming soon!' : 'Upload a file to get started.'}
                </p>
              </div>
            ) : (
              <>
                {/* LIST VIEW */}
                {viewMode === 'list' && (
                  <>
                    {/* Desktop Table (lg+) */}
                    <div className="hidden lg:block bg-white border-2 border-[#191A23] rounded-2xl overflow-hidden shadow-[4px_4px_0_#191A23]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#191A23] text-white border-b-2 border-[#191A23] text-xs uppercase font-bold tracking-wider">
                            <th className="p-4 pl-6">Name</th>
                            <th className="p-4">Date Modified</th>
                            <th className="p-4">Size</th>
                            <th className="p-4 text-right pr-6">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFiles.map(file => (
                            <tr 
                              key={file._id} 
                              onClick={() => setSelectedFile(file)}
                              className={`
                                border-b-2 border-gray-100 hover:bg-[#B9FF66]/20 transition-colors cursor-pointer group last:border-b-0
                                ${selectedFile?._id === file._id ? 'bg-[#B9FF66]/30' : ''}
                              `}
                            >
                              <td className="p-4 pl-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 min-w-[3rem] bg-white border-2 border-[#191A23] rounded-lg overflow-hidden flex items-center justify-center">
                                    <FileThumbnail file={file} />
                                  </div>
                                  <span className="font-bold text-sm truncate max-w-[300px]">{file.fileName}</span>
                                </div>
                              </td>
                              <td className="p-4 text-sm font-medium text-gray-600">
                                {new Date(file.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-4 text-sm font-medium text-gray-600">{formatBytes(file.fileSize)}</td>
                              <td className="p-4 text-right pr-6">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {currentView === 'trash' ? (
                                    <>
                                      <button onClick={(e) => handleRestore(file._id, e)} className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]" title="Restore"><RefreshCcw size={14}/></button>
                                      <button onClick={(e) => handlePermanentDelete(file._id, e)} className="p-2 bg-red-100 border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] text-red-600" title="Delete Forever"><Ban size={14}/></button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={(e) => handleToggleStar(file._id, e)} className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] transition-all"><Star size={14} className={file.isStarred ? "fill-yellow-400 text-yellow-400" : ""} /></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDownload(file._id); }} className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] transition-all"><Download size={14} /></button>
                                      <button onClick={(e) => handleRenameInit(file, e)} className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] transition-all"><Edit2 size={14} /></button>
                                      <button onClick={(e) => handleSoftDelete(file._id, e)} className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] hover:bg-red-100 transition-all text-red-600"><Trash2 size={14} /></button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Tablet Scroll (md-lg) */}
                    <div className="hidden md:block lg:hidden bg-white border-2 border-[#191A23] rounded-2xl overflow-x-auto shadow-[4px_4px_0_#191A23]">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-[#191A23] text-white border-b-2 border-[#191A23] text-xs uppercase font-bold tracking-wider">
                            <th className="p-3 pl-4">Name</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Size</th>
                            <th className="p-3 text-right pr-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFiles.map(file => (
                            <tr 
                              key={file._id} 
                              onClick={() => setSelectedFile(file)}
                              className={`
                                border-b-2 border-gray-100 active:bg-[#B9FF66]/20 transition-colors cursor-pointer group last:border-b-0
                                ${selectedFile?._id === file._id ? 'bg-[#B9FF66]/30' : ''}
                              `}
                            >
                              <td className="p-3 pl-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 min-w-[2.5rem] bg-white border-2 border-[#191A23] rounded-lg overflow-hidden flex items-center justify-center">
                                    <FileThumbnail file={file} />
                                  </div>
                                  <span className="font-bold text-xs truncate max-w-[180px]">{file.fileName}</span>
                                </div>
                              </td>
                              <td className="p-3 text-xs font-medium text-gray-600 whitespace-nowrap">
                                {new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </td>
                              <td className="p-3 text-xs font-medium text-gray-600 whitespace-nowrap">{formatBytes(file.fileSize)}</td>
                              <td className="p-3 text-right pr-4">
                                <div className="flex justify-end gap-1.5">
                                  {currentView === 'trash' ? (
                                    <>
                                      <button onClick={(e) => handleRestore(file._id, e)} className="p-1.5 bg-white border-2 border-[#191A23] rounded-lg active:shadow-[2px_2px_0_#191A23]" title="Restore"><RefreshCcw size={12}/></button>
                                      <button onClick={(e) => handlePermanentDelete(file._id, e)} className="p-1.5 bg-red-100 border-2 border-[#191A23] rounded-lg active:shadow-[2px_2px_0_#191A23] text-red-600" title="Delete Forever"><Ban size={12}/></button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={(e) => handleToggleStar(file._id, e)} className="p-1.5 bg-white border-2 border-[#191A23] rounded-lg active:shadow-[2px_2px_0_#191A23]"><Star size={12} className={file.isStarred ? "fill-yellow-400 text-yellow-400" : ""} /></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDownload(file._id); }} className="p-1.5 bg-white border-2 border-[#191A23] rounded-lg active:shadow-[2px_2px_0_#191A23]"><Download size={12} /></button>
                                      <button onClick={(e) => handleRenameInit(file, e)} className="p-1.5 bg-white border-2 border-[#191A23] rounded-lg active:shadow-[2px_2px_0_#191A23]"><Edit2 size={12} /></button>
                                      <button onClick={(e) => handleSoftDelete(file._id, e)} className="p-1.5 bg-white border-2 border-[#191A23] rounded-lg active:shadow-[2px_2px_0_#191A23] active:bg-red-100 text-red-600"><Trash2 size={12} /></button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                      {filteredFiles.map(file => (
                        <motion.div
                          key={file._id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => setSelectedFile(file)}
                          className={`
                            bg-white border-2 border-[#191A23] rounded-2xl p-4 shadow-[4px_4px_0_#191A23] 
                            active:shadow-[2px_2px_0_#191A23] active:translate-x-[2px] active:translate-y-[2px]
                            transition-all cursor-pointer
                            ${selectedFile?._id === file._id ? 'bg-[#B9FF66]/30 ring-2 ring-[#B9FF66]' : ''}
                          `}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-14 h-14 min-w-[3.5rem] bg-white border-2 border-[#191A23] rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                              <FileThumbnail file={file} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm line-clamp-2 mb-1 break-words">{file.fileName}</h3>
                              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                <span className="whitespace-nowrap">{formatBytes(file.fileSize)}</span>
                                <span className="text-gray-400">•</span>
                                <span className="whitespace-nowrap">{new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-3 border-t-2 border-gray-100">
                            {currentView === 'trash' ? (
                              <>
                                <button 
                                  onClick={(e) => handleRestore(file._id, e)} 
                                  className="py-2.5 px-3 bg-white border-2 border-[#191A23] rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-[2px_2px_0_#191A23] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                >
                                  <RefreshCcw size={14}/>
                                  <span>Restore</span>
                                </button>
                                <button 
                                  onClick={(e) => handlePermanentDelete(file._id, e)} 
                                  className="py-2.5 px-3 bg-red-100 border-2 border-[#191A23] rounded-lg font-bold text-xs text-red-600 flex items-center justify-center gap-2 shadow-[2px_2px_0_#191A23] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                >
                                  <Ban size={14}/>
                                  <span>Delete</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDownload(file._id); }} 
                                  className="py-2.5 px-3 bg-[#B9FF66] border-2 border-[#191A23] rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-[2px_2px_0_#191A23] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                >
                                  <Download size={14} />
                                  <span>Download</span>
                                </button>
                                <button 
                                  onClick={(e) => handleToggleStar(file._id, e)} 
                                  className="py-2.5 px-3 bg-white border-2 border-[#191A23] rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-[2px_2px_0_#191A23] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                >
                                  <Star size={14} className={file.isStarred ? "fill-yellow-400 text-yellow-400" : ""} />
                                  <span>{file.isStarred ? 'Starred' : 'Star'}</span>
                                </button>
                                <button 
                                  onClick={(e) => handleRenameInit(file, e)} 
                                  className="py-2.5 px-3 bg-white border-2 border-[#191A23] rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-[2px_2px_0_#191A23] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                >
                                  <Edit2 size={14} />
                                  <span>Rename</span>
                                </button>
                                <button 
                                  onClick={(e) => handleSoftDelete(file._id, e)} 
                                  className="py-2.5 px-3 bg-white border-2 border-[#191A23] rounded-lg font-bold text-xs text-red-600 flex items-center justify-center gap-2 shadow-[2px_2px_0_#191A23] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                >
                                  <Trash2 size={14} />
                                  <span>Delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}

                {/* GRID VIEW */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {filteredFiles.map(file => (
                      <div 
                        key={file._id}
                        onClick={() => setSelectedFile(file)}
                        className={`
                          bg-white border-2 rounded-xl p-3 md:p-4 cursor-pointer transition-all hover:shadow-[4px_4px_0_#191A23] hover:-translate-y-1 flex flex-col gap-2 md:gap-3 relative group
                          ${selectedFile?._id === file._id ? 'border-[#B9FF66] ring-2 ring-[#B9FF66]' : 'border-[#191A23]'}
                        `}
                      >
                        <div className="aspect-square bg-gray-100 border-2 border-[#191A23] rounded-lg flex items-center justify-center overflow-hidden relative">
                          <FileThumbnail file={file} size="large" />
                          
                          <div className="absolute inset-0 bg-[#191A23]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             {currentView === 'trash' ? (
                                <button onClick={(e) => handleRestore(file._id, e)} className="p-2 bg-white border-2 border-black rounded-full hover:bg-[#B9FF66]"><RefreshCcw size={16}/></button>
                             ) : (
                                <>
                                  <button onClick={(e) => handleToggleStar(file._id, e)} className="p-2 bg-white border-2 border-black rounded-full hover:bg-[#B9FF66]"><Star size={16} className={file.isStarred ? "fill-yellow-400 text-yellow-400" : ""}/></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDownload(file._id); }} className="p-2 bg-white border-2 border-black rounded-full hover:bg-[#B9FF66]"><Download size={16}/></button>
                                </>
                             )}
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-xs md:text-sm truncate mb-1" title={file.fileName}>{file.fileName}</p>
                          <p className="text-xs font-medium text-gray-500">{formatBytes(file.fileSize)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>

          {/* RIGHT PANEL */}
          <AnimatePresence>
            {selectedFile && (
              <motion.aside 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-80 bg-white border-l-2 border-[#191A23] h-full shadow-[-4px_0_0_rgba(0,0,0,0.05)] flex flex-col z-30 fixed md:relative right-0"
              >
                <div className="p-4 border-b-2 border-[#191A23] flex justify-between items-center bg-[#F3F3F3]">
                  <span className="font-bold">File Details</span>
                  <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-white border-2 border-transparent hover:border-[#191A23] rounded-full transition-all"><X size={20} /></button>
                </div>
                
                <div className="p-6 flex flex-col items-center border-b-2 border-[#191A23]">
                  <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-4 border-2 border-[#191A23] shadow-[4px_4px_0_#191A23] overflow-hidden">
                    <FileThumbnail file={selectedFile} size="large" />
                  </div>
                  <h3 className="font-bold text-center break-all line-clamp-2 text-lg">{selectedFile.fileName}</h3>
                  <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-wide">{selectedFile.fileType || 'Unknown Type'}</p>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Information</label>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-500">Size</span>
                        <span className="font-bold text-[#191A23]">{formatBytes(selectedFile.fileSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-500">Created</span>
                        <span className="font-bold text-[#191A23]">
                          {new Date(selectedFile.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-500">Status</span>
                        <span className="font-bold text-[#191A23]">
                          {selectedFile.isDeleted ? 'Trash' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {!selectedFile.isDeleted && (
                  <div className="p-4 border-t-2 border-[#191A23] grid grid-cols-2 gap-3 bg-[#F3F3F3]">
                    <button 
                      onClick={() => handleDownload(selectedFile._id)}
                      className="flex items-center justify-center gap-2 py-3 bg-[#191A23] text-white rounded-xl text-sm font-bold shadow-[2px_2px_0_#B9FF66] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all border-2 border-[#191A23]"
                    >
                      <Download size={16} /> Download
                    </button>
                    <button 
                      onClick={(e) => handleRenameInit(selectedFile, e)}
                      className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-[#191A23] rounded-xl text-sm font-bold shadow-[2px_2px_0_#191A23] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                    >
                      <Edit2 size={16} /> Rename
                    </button>
                  </div>
                )}
              </motion.aside>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* FLOATING ACTION BUTTON */}
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
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-[#191A23] text-white h-12 md:h-14 rounded-full border-2 border-[#191A23] shadow-[4px_4px_0_#B9FF66] hover:shadow-[2px_2px_0_#B9FF66] transition-shadow z-[55] flex items-center justify-center overflow-hidden px-4"
      >
        <motion.div layout className="flex items-center gap-2">
          <Upload size={20} className="md:w-6 md:h-6" />
          <AnimatePresence initial={false}>
            {isUploadHovered && (
              <motion.span
                key="fab-text"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="font-bold whitespace-nowrap overflow-hidden hidden md:block"
              >
                Upload New
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.button>
    </div>
  );
};

export default DashboardPage;
