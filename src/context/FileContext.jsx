import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';

const FileContext = createContext();

export const useFileContext = () => useContext(FileContext);

export const FileProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const [storage, setStorage] = useState({ used: 0, limit: 262144000 });
  const [user, setUser] = useState({ name: 'User', email: '' });
  const [loading, setLoading] = useState(true);
  const [uploadQueue, setUploadQueue] = useState([]);
  
  // Ref for the hidden file input
  const fileInputRef = useRef(null);

  const fetchFiles = async () => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);

    if (!token) {
        setLoading(false);
        return;
    }

    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Upload Logic
  const uploadFiles = async (fileList) => {
    const newFiles = Array.from(fileList);
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
    newQueueItems.forEach(item => processUpload(item));
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processUpload = async (queueItem) => {
    const formData = new FormData();
    formData.append('file', queueItem.fileObject);
    const token = localStorage.getItem('token');

    try {
      await axios.post('http://localhost:5000/api/files/upload', formData, {
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
      setUploadQueue(prev => prev.map(i => i.id === queueItem.id ? { ...i, status: 'error', progress: 0 } : i));
    }
  };

  // Trigger File Input Click
  const triggerUpload = () => {
    if(fileInputRef.current) fileInputRef.current.click();
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <FileContext.Provider value={{ 
      files, 
      storage, 
      user, 
      loading, 
      uploadQueue, 
      setUploadQueue,
      fetchFiles,
      uploadFiles,
      triggerUpload,
      fileInputRef 
    }}>
      {children}
    </FileContext.Provider>
  );
};