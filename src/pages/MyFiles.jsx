import React from 'react';
import axios from 'axios';
import { List, Grid } from 'lucide-react';
import { useFileContext } from '../context/FileContext';
import FileList from '../components/FileList';
import RenameDialog from '../components/RenameDialog';
import ShareDialog from '../components/ShareDialog';

const MyFiles = ({ searchTerm = '', setSearchTerm }) => {
  const { files, fetchFiles } = useFileContext();
  const [viewMode, setViewMode] = React.useState('list');
  const [renameFile, setRenameFile] = React.useState(null);
  const [shareFile, setShareFile] = React.useState(null);

  // Filter only active files
  const myFiles = files.filter(f => !f.isDeleted);
  // Filter files by search term
  const filteredFiles = myFiles.filter(f =>
    f.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = async (action, file) => {
    const token = localStorage.getItem('token');
    try {
      if (action === 'download') {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/files/${file._id}/download`, { headers: { 'x-auth-token': token } });
        window.open(res.data.downloadUrl, '_blank');
      } else if (action === 'star') {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/files/${file._id}/star`, {}, { headers: { 'x-auth-token': token } });
        fetchFiles();
      } else if (action === 'delete') {
        if(window.confirm("Move to Trash?")) {
          await axios.delete(`${process.env.REACT_APP_API_URL}/api/files/${file._id}`, { headers: { 'x-auth-token': token } });
          fetchFiles();
        }
      } else if (action === 'rename') {
        setRenameFile(file);
      } else if (action === 'share') {
        setShareFile(file);
      }
    } catch(err) { alert("Action failed"); }
  };

  const handleRenameSubmit = async (newName) => {
    const token = localStorage.getItem('token');
    await axios.put(`${process.env.REACT_APP_API_URL}/api/files/${renameFile._id}`, { newName }, { headers: { 'x-auth-token': token } });
    setRenameFile(null); fetchFiles();
  };

  const handleShareSubmit = async (email) => {
    const token = localStorage.getItem('token');
    await axios.post(`${process.env.REACT_APP_API_URL}/api/files/${shareFile._id}/share`, { email }, { headers: { 'x-auth-token': token } });
    setShareFile(null); alert(`Shared with ${email}`);
  };

  return (
    <div className="h-full flex flex-col">
      {renameFile && <RenameDialog isOpen={!!renameFile} currentName={renameFile.fileName} onClose={() => setRenameFile(null)} onRename={handleRenameSubmit} />}
      {shareFile && <ShareDialog isOpen={!!shareFile} fileName={shareFile.fileName} onClose={() => setShareFile(null)} onShare={handleShareSubmit} />}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">My Files</span>
          <span className="bg-[#B9FF66] border-2 border-[#191A23] text-xs px-2 py-0.5 rounded-full font-bold">{filteredFiles.length}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg border-2 border-[#191A23] ${viewMode === 'list' ? 'bg-[#191A23] text-white shadow-[2px_2px_0_#B9FF66]' : 'bg-white'}`}><List size={20} /></button>
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg border-2 border-[#191A23] ${viewMode === 'grid' ? 'bg-[#191A23] text-white shadow-[2px_2px_0_#B9FF66]' : 'bg-white'}`}><Grid size={20} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <FileList files={filteredFiles} viewMode={viewMode} onAction={handleAction} />
      </div>
    </div>
  );
};

export default MyFiles;