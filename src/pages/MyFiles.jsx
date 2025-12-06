import React from 'react';
import axios from 'axios';
import { List, Grid, FolderPlus } from 'lucide-react';
import { useFileContext } from '../context/FileContext';
import FileList from '../components/FileList';
import RenameDialog from '../components/RenameDialog';
import ShareDialog from '../components/ShareDialog';
import CreateFolderDialog from '../components/CreateFolderDialog';
import MoveDialog from '../components/MoveDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import FileDetailsPanel from '../components/FileDetailsPanel';

const MyFiles = ({ searchTerm = '', setSearchTerm }) => {
  const { 
    files, 
    folders, 
    currentFolder, 
    fetchFiles, 
    navigateToFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    toggleFolderStar
  } = useFileContext();
  const [viewMode, setViewMode] = React.useState('list');
  const [renameFile, setRenameFile] = React.useState(null);
  const [shareFile, setShareFile] = React.useState(null);
  const [showCreateFolder, setShowCreateFolder] = React.useState(false);
  const [renameTargetFolder, setRenameTargetFolder] = React.useState(null);
  const [shareTargetFolder, setShareTargetFolder] = React.useState(null);
  const [moveTarget, setMoveTarget] = React.useState(null);
  const [confirmDialog, setConfirmDialog] = React.useState({ isOpen: false, action: null, item: null });
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [selectedFolder, setSelectedFolder] = React.useState(null);

  // Filter files and folders by currentFolder
  const myFiles = files.filter(f => 
    !f.isDeleted && 
    (currentFolder ? f.parentFolder === currentFolder : !f.parentFolder)
  );
  const myFolders = folders.filter(f => 
    !f.isDeleted && 
    (currentFolder ? f.parentFolder === currentFolder : !f.parentFolder)
  );

  // Filter by search term
  const filteredFiles = myFiles.filter(f =>
    f.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredFolders = myFolders.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = async (action, item) => {
    const token = localStorage.getItem('token');
    
    // Check if item is a folder (has 'name' property) or file (has 'fileName' property)
    const isFolder = item.name !== undefined;
    
    try {
      if (action === 'select') {
        // Open details panel for file
        setSelectedFile(item);
        setSelectedFolder(null);
      } else if (action === 'selectFolder') {
        // Navigate into folder
        navigateToFolder(item._id);
      } else if (action === 'download') {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/files/${item._id}/download`, { headers: { 'x-auth-token': token } });
        window.open(res.data.downloadUrl, '_blank');
      } else if (action === 'star') {
        if (isFolder) {
          await toggleFolderStar(item._id);
        } else {
          await axios.put(`${process.env.REACT_APP_API_URL}/api/files/${item._id}/star`, {}, { headers: { 'x-auth-token': token } });
          fetchFiles();
        }
      } else if (action === 'delete') {
        setConfirmDialog({ 
          isOpen: true, 
          action: 'delete', 
          item, 
          type: isFolder ? 'folder' : 'file' 
        });
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
    await axios.put(`${process.env.REACT_APP_API_URL}/api/files/${renameFile._id}`, { newName }, { headers: { 'x-auth-token': token } });
    setRenameFile(null); fetchFiles();
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

  const handleCreateFolder = async (name) => {
    const result = await createFolder(name);
    if (result.success) {
      setShowCreateFolder(false);
    }
    // Error handling is done by the context with toast
  };

  const handleRenameFolderSubmit = async (newName) => {
    const result = await renameFolder(renameTargetFolder._id, newName);
    if (result.success) {
      setRenameTargetFolder(null);
    }
    // Error handling is done by the context with toast
  };

  const handleConfirmDelete = async () => {
    const { item, type } = confirmDialog;
    const token = localStorage.getItem('token');
    
    try {
      if (type === 'folder') {
        await deleteFolder(item._id);
      } else {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/files/${item._id}`, { headers: { 'x-auth-token': token } });
        fetchFiles();
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete');
    }
  };

  const totalItems = filteredFiles.length + filteredFolders.length;
  const isEmpty = totalItems === 0;

  const handleDetailsPanelAction = (action, item) => {
    // Close the details panel first
    setSelectedFile(null);
    setSelectedFolder(null);
    // Then perform the action
    handleAction(action, item);
  };

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${(selectedFile || selectedFolder) ? 'mr-0 md:mr-96' : ''}`}>
      {/* File Details Panel */}
      <FileDetailsPanel
        file={selectedFile}
        folder={selectedFolder}
        isOpen={!!(selectedFile || selectedFolder)}
        onClose={() => { setSelectedFile(null); setSelectedFolder(null); }}
        onAction={handleDetailsPanelAction}
      />
      
      {/* Dialogs */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null, item: null })}
        onConfirm={handleConfirmDelete}
        title="Move to Trash?"
        message={`This ${confirmDialog.type} will be moved to trash. You can restore it later.`}
        confirmText="Move to Trash"
        isDangerous={true}
      />
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
          currentFolderId={currentFolder}
          onClose={() => setMoveTarget(null)} 
        />
      )}
      {showCreateFolder && (
        <CreateFolderDialog 
          isOpen={showCreateFolder} 
          onClose={() => setShowCreateFolder(false)} 
          onCreate={handleCreateFolder} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base md:text-lg">My Files</span>
          <span className="bg-[#B9FF66] border-2 border-[#191A23] text-xs px-2 py-0.5 rounded-full font-bold">
            {totalItems}
          </span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowCreateFolder(true)} 
            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-[#B9FF66] border-2 border-[#191A23] rounded-lg font-bold hover:shadow-[2px_2px_0_#191A23] transition-all flex-1 sm:flex-initial"
          >
            <FolderPlus size={18} className="md:w-5 md:h-5" />
            <span className="text-sm md:text-base">Create Folder</span>
          </button>
          <button 
            onClick={() => setViewMode('list')} 
            className={`p-2 rounded-lg border-2 border-[#191A23] ${viewMode === 'list' ? 'bg-[#191A23] text-white shadow-[2px_2px_0_#B9FF66]' : 'bg-white'}`}
          >
            <List size={18} className="md:w-5 md:h-5" />
          </button>
          <button 
            onClick={() => setViewMode('grid')} 
            className={`p-2 rounded-lg border-2 border-[#191A23] ${viewMode === 'grid' ? 'bg-[#191A23] text-white shadow-[2px_2px_0_#B9FF66]' : 'bg-white'}`}
          >
            <Grid size={18} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-400 rounded-2xl bg-white/50">
            <FolderPlus size={48} className="text-gray-400 mb-4" />
            <p className="text-[#191A23] font-bold text-lg mb-2">This folder is empty</p>
            <p className="text-gray-600 text-sm mb-4">Create a folder or upload files to get started</p>
            <button 
              onClick={() => setShowCreateFolder(true)} 
              className="px-6 py-2 bg-[#B9FF66] border-2 border-[#191A23] rounded-lg font-bold hover:shadow-[2px_2px_0_#191A23] transition-all"
            >
              Create Folder
            </button>
          </div>
        ) : (
          <FileList 
            files={filteredFiles} 
            folders={filteredFolders}
            viewMode={viewMode} 
            onAction={handleAction} 
          />
        )}
      </div>
      </div>
    </div>
  );
};

export default MyFiles;