import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, File, Calendar, HardDrive, User, Star, Download, Edit2, Share2, Trash2, FolderInput, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

const FileDetailsPanel = ({ file, folder, isOpen, onClose, onAction }) => {
  const item = file || folder;
  const isFolder = !!folder;
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    if (file && file.fileType?.includes('image') && !file.isDeleted) {
      setImageLoading(true);
      const fetchImage = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/files/${file._id}/download`, {
            headers: { 'x-auth-token': token }
          });
          setImageUrl(res.data.downloadUrl);
        } catch (err) {
          console.error('Failed to load image:', err);
        } finally {
          setImageLoading(false);
        }
      };
      fetchImage();
    } else {
      setImageUrl(null);
    }
  }, [file]);

  if (!item) return null;

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white border-l-2 border-[#191A23] shadow-[-4px_0_0_#191A23] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-[#191A23] bg-[#B9FF66]">
              <h3 className="font-bold text-lg">Details</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg border-2 border-[#191A23] bg-white hover:bg-red-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Preview */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-full aspect-square max-w-xs bg-gray-100 border-2 border-[#191A23] rounded-xl overflow-hidden flex items-center justify-center">
                  {isFolder ? (
                    <div className="w-full h-full flex items-center justify-center bg-[#B9FF66]/20">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                        <path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="#B9FF66" stroke="#191A23" strokeWidth="2"/>
                      </svg>
                    </div>
                  ) : imageUrl && file.fileType?.includes('image') ? (
                    <img 
                      src={imageUrl} 
                      alt={file.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : imageLoading ? (
                    <div className="text-gray-400">Loading...</div>
                  ) : (
                    <ImageIcon size={64} className="text-gray-400" />
                  )}
                </div>
                <h4 className="font-bold text-center break-words w-full px-2">
                  {isFolder ? folder.name : file.fileName}
                </h4>
              </div>

              {/* Information */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-[#F3F3F3] border-2 border-[#191A23] rounded-lg">
                  <File size={20} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-bold mb-1">Type</p>
                    <p className="font-medium break-words">
                      {isFolder ? 'Folder' : file.fileType || 'Unknown'}
                    </p>
                  </div>
                </div>

                {!isFolder && (
                  <div className="flex items-start gap-3 p-3 bg-[#F3F3F3] border-2 border-[#191A23] rounded-lg">
                    <HardDrive size={20} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-bold mb-1">Size</p>
                      <p className="font-medium">{formatBytes(file.fileSize)}</p>
                    </div>
                  </div>
                )}

                {isFolder && (
                  <div className="flex items-start gap-3 p-3 bg-[#F3F3F3] border-2 border-[#191A23] rounded-lg">
                    <File size={20} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-bold mb-1">Items</p>
                      <p className="font-medium">{folder.itemCount || 0} items</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 bg-[#F3F3F3] border-2 border-[#191A23] rounded-lg">
                  <Calendar size={20} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-bold mb-1">Created</p>
                    <p className="font-medium text-sm">{formatDate(item.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[#F3F3F3] border-2 border-[#191A23] rounded-lg">
                  <User size={20} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-bold mb-1">Owner</p>
                    <p className="font-medium">You</p>
                  </div>
                </div>

                {item.isStarred && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border-2 border-[#191A23] rounded-lg">
                    <Star size={20} className="fill-yellow-400 text-yellow-400" />
                    <p className="font-bold text-sm">Starred</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-bold mb-3">ACTIONS</p>
                
                <button
                  onClick={() => { onAction('star', item); }}
                  className="w-full flex items-center gap-3 p-3 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] transition-all font-bold"
                >
                  <Star size={18} className={item.isStarred ? "fill-yellow-400 text-yellow-400" : ""} />
                  {item.isStarred ? 'Unstar' : 'Star'}
                </button>

                {!isFolder && (
                  <button
                    onClick={() => { onAction('download', item); }}
                    className="w-full flex items-center gap-3 p-3 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] transition-all font-bold"
                  >
                    <Download size={18} />
                    Download
                  </button>
                )}

                <button
                  onClick={() => { onAction('move', item); }}
                  className="w-full flex items-center gap-3 p-3 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] transition-all font-bold"
                >
                  <FolderInput size={18} />
                  Move
                </button>

                <button
                  onClick={() => { onAction('rename', item); }}
                  className="w-full flex items-center gap-3 p-3 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] transition-all font-bold"
                >
                  <Edit2 size={18} />
                  Rename
                </button>

                <button
                  onClick={() => { onAction('share', item); }}
                  className="w-full flex items-center gap-3 p-3 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] transition-all font-bold"
                >
                  <Share2 size={18} />
                  Share
                </button>

                <button
                  onClick={() => { onAction('delete', item); }}
                  className="w-full flex items-center gap-3 p-3 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] hover:bg-red-50 transition-all font-bold text-red-600"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FileDetailsPanel;
