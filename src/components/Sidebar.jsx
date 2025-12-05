import React from 'react';
import { motion } from 'framer-motion';
import { Files, Clock, Star, Trash2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ isCollapsed, setIsCollapsed, sidebarOpen, setSidebarOpen, storage, user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const NavItem = ({ path, label, icon: Icon }) => {
    const isActive = location.pathname === path;
    return (
      <motion.div 
        onClick={() => { navigate(path); if(window.innerWidth < 768) setSidebarOpen(false); }} 
        className={`
          flex items-center cursor-pointer transition-all duration-200 border-2
          ${isCollapsed ? 'justify-center w-12 h-12 px-0' : 'w-full px-4 py-3 gap-3'}
          ${isActive 
            ? 'bg-[#F3F3F3] border-[#191A23] shadow-[2px_2px_0_#191A23] text-[#191A23]' 
            : 'border-transparent hover:border-[#191A23] hover:bg-[#F3F3F3] text-gray-500 hover:shadow-[2px_2px_0_#191A23]'
          }
          rounded-xl
        `}
      >
        <Icon size={20} weight={isActive ? "fill" : "bold"} className="flex-shrink-0" />
        {!isCollapsed && (
          <span className="font-bold whitespace-nowrap overflow-hidden">
            {label}
          </span>
        )}
      </motion.div>
    );
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.aside 
      className={`
        bg-white border-r-2 border-[#191A23] flex flex-col justify-between 
        fixed md:relative z-50 h-full flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} 
      animate={{ width: isCollapsed ? 88 : 260 }} 
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Toggle Button */}
      <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-7 bg-white border-2 border-[#191A23] rounded-full p-1.5 shadow-[2px_2px_0_#191A23] hidden md:block z-50 hover:bg-[#B9FF66] transition-colors"
      >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div>
        {/* Logo */}
        <div 
          className={`
            h-20 flex items-center border-b-2 border-[#191A23] bg-[#B9FF66] cursor-pointer transition-all
            ${isCollapsed ? 'justify-center px-0' : 'px-6 gap-3'}
          `}
          onClick={() => navigate('/')}
        >
           <div className="w-8 h-8 bg-white border-2 border-[#191A23] rounded flex items-center justify-center flex-shrink-0">
             <span className="font-bold text-lg">P</span>
           </div>
           {!isCollapsed && <span className="text-xl font-bold tracking-tight overflow-hidden whitespace-nowrap">Positivus</span>}
        </div>

        <div className={`p-4 space-y-4 ${isCollapsed ? 'px-3' : ''}`}>
          {/* Nav */}
          <nav className="space-y-2">
            <NavItem path="/dashboard/my-files" label="My Files" icon={Files} />
            <NavItem path="/dashboard/recent" label="Recent" icon={Clock} />
            <NavItem path="/dashboard/shared" label="Shared" icon={Users} />
            <NavItem path="/dashboard/starred" label="Starred" icon={Star} />
            <NavItem path="/dashboard/trash" label="Trash" icon={Trash2} />
          </nav>
        </div>
      </div>

      {/* Storage Widget */}
      {!isCollapsed && (
          <div className="p-6 border-t-2 border-[#191A23] bg-[#F3F3F3]">
            <div className="flex justify-between items-end mb-2">
              <span className="font-bold text-sm">Storage</span>
              <span className="text-xs font-bold text-gray-500">{Math.min((storage.used / storage.limit) * 100, 100).toFixed(0)}% used</span>
            </div>
            <div className="w-full h-4 bg-white border-2 border-[#191A23] rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-[#B9FF66] border-r-2 border-[#191A23]" 
                style={{ width: `${Math.min((storage.used / storage.limit) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 font-medium">{formatBytes(storage.used)} of {formatBytes(storage.limit)}</p>
          </div>
      )}
    </motion.aside>
  );
};

export default Sidebar;
