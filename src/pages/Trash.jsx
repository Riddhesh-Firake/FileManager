import React, { useState } from 'react';
import axios from 'axios';
import { List, Grid } from 'lucide-react';
import { useFileContext } from '../context/FileContext';
import FileList from '../components/FileList';

const Trash = () => {
  const { files, folders, fetchFiles, restoreFolder } = useFileContext();
  const [viewMode, setViewMode] = useState('list');

  const trashFiles = files.filter(f => f.isDeleted);
  const trashFolders = folders.filter(f => f.isDeleted);
  const totalTrash = trashFiles.length + trashFolders.length;

  const handleAction = async (action, item) => {
    const token = localStorage.getItem('token');
    
    // Check if item is a folder (has 'name' property) or file (has 'fileName' property)
    const isFolder = item.name !== undefined;
    
    try {
      if (action === 'restore') {
        if (isFolder) {
          const result = await restoreFolder(item._id);
          if (result.success) {
            fetchFiles();
          }
          // Error handling is done by the context with toast
        } else {
          await axios.put(`${process.env.REACT_APP_API_URL}/api/files/${item._id}/restore`, {}, { headers: { 'x-auth-token': token } });
          fetchFiles();
        }
      } else if (action === 'permanentDelete') {
        if(window.confirm("Permanently Delete? This cannot be undone!")) {
          if (isFolder) {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/folders/${item._id}/permanent`, { headers: { 'x-auth-token': token } });
          } else {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/files/${item._id}/permanent`, { headers: { 'x-auth-token': token } });
          }
          fetchFiles();
        }
      }
    } catch(err) { 
      console.error('Action failed:', err);
      // Error is logged, user will see toast from context if applicable
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2"><span className="font-bold text-lg text-red-600">Trash</span><span className="bg-red-100 text-red-600 border-2 border-[#191A23] text-xs px-2 py-0.5 rounded-full font-bold">{totalTrash}</span></div>
        <div className="flex gap-2"><button onClick={() => setViewMode('list')} className={`p-2 rounded-lg border-2 border-[#191A23] ${viewMode === 'list' ? 'bg-[#191A23] text-white shadow-[2px_2px_0_#B9FF66]' : 'bg-white'}`}><List size={20} /></button><button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg border-2 border-[#191A23] ${viewMode === 'grid' ? 'bg-[#191A23] text-white shadow-[2px_2px_0_#B9FF66]' : 'bg-white'}`}><Grid size={20} /></button></div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <FileList files={trashFiles} folders={trashFolders} viewMode={viewMode} onAction={handleAction} showRestore={true} />
      </div>
    </div>
  );
};

export default Trash;