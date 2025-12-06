import React, { useState, useEffect } from 'react';
import { List, Grid } from 'lucide-react';
import FileList from '../components/FileList';
import axios from 'axios';

const Recent = () => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [viewMode, setViewMode] = useState('list');

  // Fetch recent folders and files
  useEffect(() => {
    const fetchRecentItems = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const [foldersRes, filesRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/folders/recent`, {
            headers: { 'x-auth-token': token }
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/files/recent`, {
            headers: { 'x-auth-token': token }
          })
        ]);
        
        setFolders(foldersRes.data);
        setFiles(filesRes.data);
      } catch (err) {
        console.error('Error fetching recent items:', err);
      }
    };

    fetchRecentItems();
  }, []);

  // Combine and sort folders and files by lastAccessed
  const recentItems = [
    ...folders.map(f => ({ ...f, type: 'folder' })),
    ...files.map(f => ({ ...f, type: 'file' }))
  ]
    .sort((a, b) => {
      const aDate = new Date(a.lastAccessed || a.updatedAt);
      const bDate = new Date(b.lastAccessed || b.updatedAt);
      return bDate - aDate;
    })
    .slice(0, 10);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">Recent</span>
          <span className="bg-[#B9FF66] border-2 border-[#191A23] text-xs px-2 py-0.5 rounded-full font-bold">
            {recentItems.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('list')} 
            className={`p-2 rounded-lg border-2 border-[#191A23] ${viewMode === 'list' ? 'bg-[#191A23] text-white shadow-[2px_2px_0_#B9FF66]' : 'bg-white'}`}
          >
            <List size={20} />
          </button>
          <button 
            onClick={() => setViewMode('grid')} 
            className={`p-2 rounded-lg border-2 border-[#191A23] ${viewMode === 'grid' ? 'bg-[#191A23] text-white shadow-[2px_2px_0_#B9FF66]' : 'bg-white'}`}
          >
            <Grid size={20} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <FileList 
          files={recentItems.filter(item => item.type === 'file')} 
          folders={recentItems.filter(item => item.type === 'folder')}
          viewMode={viewMode} 
          onAction={() => {}} 
        />
      </div>
    </div>
  );
};

export default Recent;