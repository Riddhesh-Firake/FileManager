import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { List, Grid } from 'lucide-react';
import FileList from '../components/FileList';

const Shared = () => {
  const [sharedFiles, setSharedFiles] = useState([]);
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    const fetchShared = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get('http://localhost:5000/api/files/shared', { headers: { 'x-auth-token': token } });
        setSharedFiles(res.data);
      } catch (err) { console.error(err); }
    };
    fetchShared();
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2"><span className="font-bold text-lg">Shared With Me</span><span className="bg-[#B9FF66] border-2 border-[#191A23] text-xs px-2 py-0.5 rounded-full font-bold">{sharedFiles.length}</span></div>
        <div className="flex gap-2"><button onClick={() => setViewMode('list')} className={`p-2 rounded-lg border-2 border-[#191A23] ${viewMode === 'list' ? 'bg-[#191A23] text-white shadow-[2px_2px_0_#B9FF66]' : 'bg-white'}`}><List size={20} /></button><button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg border-2 border-[#191A23] ${viewMode === 'grid' ? 'bg-[#191A23] text-white shadow-[2px_2px_0_#B9FF66]' : 'bg-white'}`}><Grid size={20} /></button></div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <FileList files={sharedFiles} viewMode={viewMode} onAction={() => {}} />
      </div>
    </div>
  );
};

export default Shared;