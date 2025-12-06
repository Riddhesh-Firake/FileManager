import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { List, Grid } from 'lucide-react';
import { useFileContext } from '../context/FileContext';
import FileList from '../components/FileList';
import RenameDialog from '../components/RenameDialog';
import ShareDialog from '../components/ShareDialog';
import MoveDialog from '../components/MoveDialog';

const Shared = () => {
  const { 
    navigateToFolder, 
    renameFolder, 
    deleteFolder, 
    toggleFolderStar 
  } = useFileContext();
  const [sharedFiles, setSharedFiles] = useState([]);
  const [sharedFolders, setSharedFolders] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [renameFile, setRenameFile] = useState(null);
  const [renameTargetFolder, setRenameTargetFolder] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [shareTargetFolder, setShareTargetFolder] = useState(null);
  const [moveTarget, setMoveTarget] = useState(null);

  const fetchShared = async () => {
    const token = localStorage.getItem('token');
    try {
      const filesRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/files/shared`, { 
        headers: { 'x-auth-token': token } 
      });
      setSharedFiles(filesRes.data);
      
      const foldersRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/folders/shared`, { 
        headers: { 'x-auth-token': token } 
      });
      setSharedFolders(foldersRes.data);
    } catch (err) { 
      console.error('Error fetching shared items:', err); 
    }
  };

  useEffect(() => {
    fetchShared();
  }, []);

  const totalShared = sharedFiles.length + sharedFolders.length;

  const handleAction = async (action, item) => {
    const token = localStorage.getItem('token');
    const isFolder = item.name !== undefined;
    
    try {
      if (action === 'selectFolder') {
        navigateToFolder(item._id);
      } else if (action === 'download') {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/files/${item._id}/download`, { headers: { 'x-auth-token': token } });
        window.open(res.data.downloadUrl, '_blank');
      } else if (action === 'star') {
        if (isFolder) {
          await toggleFolderStar(item._id);
          fetchShared();
        } else {
          await axios.put(`${process.env.REACT_APP_API_URL}/api/files/${item._id}/star`, {}, { headers: { 'x-auth-token': token } });
          fetchShared();
        }
      } else if (action === 'delete') {
        if (isFolder) {
          if(window.confirm("Move folder and its contents to Trash?")) {
            await deleteFolder(item._id);
            fetchShared();
          }
        } else {
          if(window.confirm("Move to Trash?")) {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/files/${item._id}`, { headers: { 'x-auth-token': token } });
            fetchShared();
          }
        }
      } else if (action === 'rename') {
        if (isFolder) {
          setRenameTargetFolder(item);
        } else {
          setRenameFile(item);
        }
      } else if (action === 'share') {
        if (isFolder) {
          setShareTargetFolder(item);
        } else {
          setShareFile(item);
        }
      } else if (action === 'move') {
        setMoveTarget({ item, type: isFolder ? 'folder' : 'file' });
      }
    } catch(err) { 
      console.error('Action error:', err);
      alert("Action failed"); 
    }
  };

  const handleRenameSubmit = async (newName) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/files/${renameFile._id}`, { newName }, { headers: { 'x-auth-token': token } });
      setRenameFile(null); 
      fetchShared();
    } catch (err) {
      console.error('Rename error:', err);
      alert('Failed to rename file');
    }
  };

  const handleRenameFolderSubmit = async (newName) => {
    const result = await renameFolder(renameTargetFolder._id, newName);
    if (result.success) {
      setRenameTargetFolder(null);
      fetchShared();
    }
    // Error handling is done by the context with toast
  };

  const handleShareSubmit = async (email) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/files/${shareFile._id}/share`, { email }, { headers: { 'x-auth-token': token } });
      setShareFile(null); 
      alert(`Shared with ${email}`);
    } catch (err) {
      console.error('Share error:', err);
      alert('Failed to share file');
    }
  };

  const handleShareFolderSubmit = async (email) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/folders/${shareTargetFolder._id}/share`, { email }, { headers: { 'x-auth-token': token } });
      setShareTargetFolder(null); 
      alert(`Shared with ${email}`);
    } catch (err) {
      console.error('Share folder error:', err);
      alert('Failed to share folder');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Dialogs */}
      {renameFile && (
        <RenameDialog 
          isOpen={!!renameFile} 
          currentName={renameFile.fileName} 
          onClose={() => setRenameFile(null)} 
          onRename={handleRenameSubmit} 
        />
      )}
      {renameTargetFolder && (
        <RenameDialog 
          isOpen={!!renameTargetFolder} 
          currentName={renameTargetFolder.name} 
          onClose={() => setRenameTargetFolder(null)} 
          onRename={handleRenameFolderSubmit} 
        />
      )}
      {shareFile && (
        <ShareDialog 
          isOpen={!!shareFile} 
          fileName={shareFile.fileName} 
          onClose={() => setShareFile(null)} 
          onShare={handleShareSubmit} 
        />
      )}
      {shareTargetFolder && (
        <ShareDialog 
          isOpen={!!shareTargetFolder} 
          fileName={shareTargetFolder.name} 
          onClose={() => setShareTargetFolder(null)} 
          onShare={handleShareFolderSubmit} 
        />
      )}
      {moveTarget && (
        <MoveDialog 
          isOpen={!!moveTarget} 
          itemType={moveTarget.type}
          itemId={moveTarget.item._id}
          currentFolderId={null}
          onClose={() => setMoveTarget(null)} 
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2"><span className="font-bold text-lg">Shared With Me</span><span className="bg-[#B9FF66] border-2 border-[#191A23] text-xs px-2 py-0.5 rounded-full font-bold">{totalShared}</span></div>
        <div className="flex gap-2"><button onClick={() => setViewMode('list')} className={`p-2 rounded-lg border-2 border-[#191A23] ${viewMode === 'list' ? 'bg-[#191A23] text-white shadow-[2px_2px_0_#B9FF66]' : 'bg-white'}`}><List size={20} /></button><button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg border-2 border-[#191A23] ${viewMode === 'grid' ? 'bg-[#191A23] text-white shadow-[2px_2px_0_#B9FF66]' : 'bg-white'}`}><Grid size={20} /></button></div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <FileList files={sharedFiles} folders={sharedFolders} viewMode={viewMode} onAction={handleAction} />
      </div>
    </div>
  );
};

export default Shared;