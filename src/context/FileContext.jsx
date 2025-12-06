import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';

const FileContext = createContext();

export const useFileContext = () => useContext(FileContext);

export const FileProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [storage, setStorage] = useState({ used: 0, limit: 262144000 });
  const [user, setUser] = useState({ name: 'User', email: '' });
  const [loading, setLoading] = useState(true);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [operationLoading, setOperationLoading] = useState({});
  
  // Ref for the hidden file input
  const fileInputRef = useRef(null);
  
  // Toast notifications
  const { toasts, addToast, removeToast, retry } = useToast();

  const fetchFiles = useCallback(async (showError = false) => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);

    if (!token) {
        setLoading(false);
        return;
    }

    try {
      setLoading(true);
      
      // Fetch files
      const filesRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/files`, {
        headers: { 'x-auth-token': token }
      });
      setFiles(filesRes.data.files);
      setStorage({
        used: filesRes.data.storage.storageUsed,
        limit: filesRes.data.storage.storageLimit
      });
      
      // Fetch folders
      const foldersRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/folders`, {
        headers: { 'x-auth-token': token }
      });
      setFolders(foldersRes.data);
    } catch (err) {
      console.error(err);
      if (showError) {
        addToast('Failed to load files. Please try again.', 'error', () => fetchFiles(true));
      }
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Upload Logic
  const uploadFiles = async (fileList) => {
    const newFiles = Array.from(fileList);
    if (newFiles.length === 0) return;

    const totalSize = newFiles.reduce((acc, file) => acc + file.size, 0);
    if (storage.used + totalSize > storage.limit) {
      addToast("Storage limit exceeded! Upload cancelled.", 'error');
      return;
    }

    const newQueueItems = newFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      name: file.name,
      progress: 0,
      status: 'uploading',
      fileObject: file,
      retryCount: 0
    }));

    setUploadQueue(prev => [...prev, ...newQueueItems]);
    newQueueItems.forEach(item => processUpload(item));
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processUpload = async (queueItem, isRetry = false) => {
    const formData = new FormData();
    formData.append('file', queueItem.fileObject);
    
    // Add parent folder if we're in a folder context
    if (currentFolder) {
      formData.append('parentFolder', currentFolder);
    }
    
    const token = localStorage.getItem('token');

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/files/upload`, formData, {
        headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          const percent = Math.round((ev.loaded * 100) / ev.total);
          setUploadQueue(prev => prev.map(i => i.id === queueItem.id ? { ...i, progress: percent } : i));
        }
      });
      setUploadQueue(prev => prev.map(i => i.id === queueItem.id ? { ...i, status: 'success', progress: 100 } : i));
      fetchFiles(); // Refresh list
      setTimeout(() => setUploadQueue(prev => prev.filter(i => i.id !== queueItem.id)), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Upload failed';
      
      // Retry logic: auto-retry up to 2 times for network errors
      if (!isRetry && queueItem.retryCount < 2 && (!err.response || err.response.status >= 500)) {
        const updatedItem = { ...queueItem, retryCount: queueItem.retryCount + 1 };
        setUploadQueue(prev => prev.map(i => i.id === queueItem.id ? { ...i, status: 'retrying' } : i));
        
        // Wait 1 second before retrying
        setTimeout(() => {
          processUpload(updatedItem, true);
        }, 1000);
      } else {
        setUploadQueue(prev => prev.map(i => i.id === queueItem.id ? { ...i, status: 'error', progress: 0 } : i));
        addToast(`Failed to upload ${queueItem.name}: ${errorMsg}`, 'error', () => {
          setUploadQueue(prev => prev.filter(i => i.id !== queueItem.id));
          processUpload({ ...queueItem, retryCount: 0 });
        });
      }
    }
  };

  // Trigger File Input Click
  const triggerUpload = () => {
    if(fileInputRef.current) fileInputRef.current.click();
  };

  // Create Folder
  const createFolder = async (name, parentId = null) => {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, error: 'Not authenticated' };

    const operationId = 'createFolder';
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    // Optimistic update
    const tempFolder = {
      _id: `temp-${Date.now()}`,
      name,
      parentFolder: parentId || currentFolder,
      isStarred: false,
      isDeleted: false,
      createdAt: new Date(),
      itemCount: 0,
      user: user._id
    };
    
    setFolders(prev => [...prev, tempFolder]);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/folders`,
        { name, parentFolder: parentId || currentFolder },
        { headers: { 'x-auth-token': token } }
      );
      
      // Replace temp folder with real one
      setFolders(prev => prev.map(f => f._id === tempFolder._id ? res.data : f));
      addToast(`Folder "${name}" created successfully`, 'success');
      return { success: true, folder: res.data };
    } catch (err) {
      console.error('Create folder error:', err);
      const errorMsg = err.response?.data?.msg || 'Failed to create folder';
      
      // Rollback optimistic update
      setFolders(prev => prev.filter(f => f._id !== tempFolder._id));
      
      addToast(errorMsg, 'error', () => createFolder(name, parentId));
      return { success: false, error: errorMsg };
    } finally {
      setOperationLoading(prev => ({ ...prev, [operationId]: false }));
    }
  };

  // Navigate to Folder
  const navigateToFolder = async (folderId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const operationId = `navigate-${folderId}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    try {
      setLoading(true);
      setCurrentFolder(folderId);
      
      // Fetch folder details to update path
      const folderRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/folders/${folderId}`,
        { headers: { 'x-auth-token': token } }
      );
      
      // Build folder path by traversing up the tree
      const path = [];
      let currentFolderData = folderRes.data;
      
      while (currentFolderData) {
        path.unshift({
          id: currentFolderData._id,
          name: currentFolderData.name
        });
        
        if (currentFolderData.parentFolder) {
          const parentRes = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/folders/${currentFolderData.parentFolder}`,
            { headers: { 'x-auth-token': token } }
          );
          currentFolderData = parentRes.data;
        } else {
          currentFolderData = null;
        }
      }
      
      setFolderPath(path);
      
      // Fetch folder contents
      const contentsRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/folders/${folderId}/contents`,
        { headers: { 'x-auth-token': token } }
      );
      
      setFolders(contentsRes.data.folders);
      setFiles(contentsRes.data.files);
    } catch (err) {
      console.error('Navigate to folder error:', err);
      const errorMsg = err.response?.data?.msg || 'Failed to open folder';
      addToast(errorMsg, 'error', () => navigateToFolder(folderId));
    } finally {
      setLoading(false);
      setOperationLoading(prev => ({ ...prev, [operationId]: false }));
    }
  };

  // Navigate to Root
  const navigateToRoot = () => {
    setCurrentFolder(null);
    setFolderPath([]);
    fetchFiles();
  };

  // Move File
  const moveFile = async (fileId, destinationFolderId) => {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, error: 'Not authenticated' };

    const operationId = `moveFile-${fileId}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    // Store original state for rollback
    const originalFile = files.find(f => f._id === fileId);
    
    // Optimistic update - remove file from current view
    setFiles(prev => prev.filter(f => f._id !== fileId));

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/files/${fileId}/move`,
        { destinationFolderId },
        { headers: { 'x-auth-token': token } }
      );
      
      addToast('File moved successfully', 'success');
      
      // Refresh current view
      if (currentFolder) {
        await navigateToFolder(currentFolder);
      } else {
        await fetchFiles();
      }
      
      return { success: true };
    } catch (err) {
      console.error('Move file error:', err);
      const errorMsg = err.response?.data?.msg || 'Failed to move file';
      
      // Rollback optimistic update
      if (originalFile) {
        setFiles(prev => [...prev, originalFile]);
      }
      
      addToast(errorMsg, 'error', () => moveFile(fileId, destinationFolderId));
      return { success: false, error: errorMsg };
    } finally {
      setOperationLoading(prev => ({ ...prev, [operationId]: false }));
    }
  };

  // Move Folder
  const moveFolder = async (folderId, destinationFolderId) => {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, error: 'Not authenticated' };

    const operationId = `moveFolder-${folderId}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    // Store original state for rollback
    const originalFolder = folders.find(f => f._id === folderId);
    
    // Optimistic update - remove folder from current view
    setFolders(prev => prev.filter(f => f._id !== folderId));

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/folders/${folderId}/move`,
        { destinationFolderId },
        { headers: { 'x-auth-token': token } }
      );
      
      addToast('Folder moved successfully', 'success');
      
      // Refresh current view
      if (currentFolder) {
        await navigateToFolder(currentFolder);
      } else {
        await fetchFiles();
      }
      
      return { success: true };
    } catch (err) {
      console.error('Move folder error:', err);
      const errorMsg = err.response?.data?.msg || 'Failed to move folder';
      
      // Rollback optimistic update
      if (originalFolder) {
        setFolders(prev => [...prev, originalFolder]);
      }
      
      addToast(errorMsg, 'error', () => moveFolder(folderId, destinationFolderId));
      return { success: false, error: errorMsg };
    } finally {
      setOperationLoading(prev => ({ ...prev, [operationId]: false }));
    }
  };

  // Rename Folder
  const renameFolder = async (folderId, newName) => {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, error: 'Not authenticated' };

    const operationId = `renameFolder-${folderId}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    // Store original state for rollback
    const originalFolder = folders.find(f => f._id === folderId);
    const originalPath = [...folderPath];
    
    // Optimistic update
    setFolders(prev => prev.map(f => f._id === folderId ? { ...f, name: newName } : f));
    setFolderPath(prev => prev.map(f => f.id === folderId ? { ...f, name: newName } : f));

    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/folders/${folderId}`,
        { newName },
        { headers: { 'x-auth-token': token } }
      );
      
      // Update with server response
      setFolders(prev => prev.map(f => f._id === folderId ? res.data : f));
      addToast('Folder renamed successfully', 'success');
      
      return { success: true, folder: res.data };
    } catch (err) {
      console.error('Rename folder error:', err);
      const errorMsg = err.response?.data?.msg || 'Failed to rename folder';
      
      // Rollback optimistic update
      if (originalFolder) {
        setFolders(prev => prev.map(f => f._id === folderId ? originalFolder : f));
      }
      setFolderPath(originalPath);
      
      addToast(errorMsg, 'error', () => renameFolder(folderId, newName));
      return { success: false, error: errorMsg };
    } finally {
      setOperationLoading(prev => ({ ...prev, [operationId]: false }));
    }
  };

  // Delete Folder
  const deleteFolder = async (folderId) => {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, error: 'Not authenticated' };

    const operationId = `deleteFolder-${folderId}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    // Store original state for rollback
    const originalFolder = folders.find(f => f._id === folderId);
    
    // Optimistic update
    setFolders(prev => prev.filter(f => f._id !== folderId));

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/folders/${folderId}`,
        { headers: { 'x-auth-token': token } }
      );
      
      addToast('Folder deleted successfully', 'success');
      return { success: true };
    } catch (err) {
      console.error('Delete folder error:', err);
      const errorMsg = err.response?.data?.msg || 'Failed to delete folder';
      
      // Rollback optimistic update
      if (originalFolder) {
        setFolders(prev => [...prev, originalFolder]);
      }
      
      addToast(errorMsg, 'error', () => deleteFolder(folderId));
      return { success: false, error: errorMsg };
    } finally {
      setOperationLoading(prev => ({ ...prev, [operationId]: false }));
    }
  };

  // Restore Folder
  const restoreFolder = async (folderId) => {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, error: 'Not authenticated' };

    const operationId = `restoreFolder-${folderId}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/folders/${folderId}/restore`,
        {},
        { headers: { 'x-auth-token': token } }
      );
      
      addToast('Folder restored successfully', 'success');
      
      // Refresh files and folders
      await fetchFiles();
      
      return { success: true };
    } catch (err) {
      console.error('Restore folder error:', err);
      const errorMsg = err.response?.data?.msg || 'Failed to restore folder';
      
      addToast(errorMsg, 'error', () => restoreFolder(folderId));
      return { success: false, error: errorMsg };
    } finally {
      setOperationLoading(prev => ({ ...prev, [operationId]: false }));
    }
  };

  // Toggle Folder Star
  const toggleFolderStar = async (folderId) => {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, error: 'Not authenticated' };

    const operationId = `toggleFolderStar-${folderId}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    // Store original state for rollback
    const originalFolder = folders.find(f => f._id === folderId);
    
    // Optimistic update
    setFolders(prev => prev.map(f => 
      f._id === folderId ? { ...f, isStarred: !f.isStarred } : f
    ));

    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/folders/${folderId}/star`,
        {},
        { headers: { 'x-auth-token': token } }
      );
      
      // Update with server response
      setFolders(prev => prev.map(f => f._id === folderId ? res.data : f));
      
      const action = res.data.isStarred ? 'starred' : 'unstarred';
      addToast(`Folder ${action} successfully`, 'success');
      
      return { success: true, folder: res.data };
    } catch (err) {
      console.error('Toggle folder star error:', err);
      const errorMsg = err.response?.data?.msg || 'Failed to toggle folder star';
      
      // Rollback optimistic update
      if (originalFolder) {
        setFolders(prev => prev.map(f => f._id === folderId ? originalFolder : f));
      }
      
      addToast(errorMsg, 'error', () => toggleFolderStar(folderId));
      return { success: false, error: errorMsg };
    } finally {
      setOperationLoading(prev => ({ ...prev, [operationId]: false }));
    }
  };

  // Get Folder Tree (for move dialog)
  const getFolderTree = async (excludeFolderId = null) => {
    const token = localStorage.getItem('token');
    if (!token) return [];

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/folders`,
        { headers: { 'x-auth-token': token } }
      );
      
      const allFolders = res.data;
      
      // If excluding a folder, filter out that folder and its descendants
      if (excludeFolderId) {
        const excludedIds = new Set([excludeFolderId]);
        
        // Find all descendants recursively
        const findDescendants = (parentId) => {
          allFolders.forEach(folder => {
            if (folder.parentFolder === parentId && !excludedIds.has(folder._id)) {
              excludedIds.add(folder._id);
              findDescendants(folder._id);
            }
          });
        };
        
        findDescendants(excludeFolderId);
        
        return allFolders.filter(f => !excludedIds.has(f._id) && !f.isDeleted);
      }
      
      return allFolders.filter(f => !f.isDeleted);
    } catch (err) {
      console.error('Get folder tree error:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return (
    <FileContext.Provider value={{ 
      files, 
      folders,
      storage, 
      user, 
      loading, 
      uploadQueue, 
      setUploadQueue,
      fetchFiles,
      uploadFiles,
      triggerUpload,
      fileInputRef,
      currentFolder,
      setCurrentFolder,
      folderPath,
      createFolder,
      navigateToFolder,
      navigateToRoot,
      moveFile,
      moveFolder,
      renameFolder,
      deleteFolder,
      restoreFolder,
      toggleFolderStar,
      getFolderTree,
      operationLoading,
      toasts,
      removeToast,
      retry
    }}>
      {children}
    </FileContext.Provider>
  );
};