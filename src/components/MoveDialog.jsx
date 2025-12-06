import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, X, Folder, Search, Home } from 'lucide-react';
import { useFileContext } from '../context/FileContext';

const MoveDialog = ({ isOpen, onClose, itemType, itemId, currentFolderId }) => {
  const { getFolderTree, moveFile, moveFolder } = useFileContext();
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen, itemId, itemType]);

  const loadFolders = async () => {
    setLoading(true);
    setError('');
    try {
      // For folder moves, exclude the folder itself and its descendants
      const excludeId = itemType === 'folder' ? itemId : null;
      const folderList = await getFolderTree(excludeId);
      setFolders(folderList);
    } catch (err) {
      setError('Failed to load folders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const buildFolderHierarchy = (folders) => {
    const folderMap = new Map();
    const rootFolders = [];

    // Create a map of all folders
    folders.forEach(folder => {
      folderMap.set(folder._id, { ...folder, children: [] });
    });

    // Build the hierarchy
    folders.forEach(folder => {
      const folderNode = folderMap.get(folder._id);
      if (folder.parentFolder && folderMap.has(folder.parentFolder)) {
        folderMap.get(folder.parentFolder).children.push(folderNode);
      } else {
        rootFolders.push(folderNode);
      }
    });

    return rootFolders;
  };

  const filterFolders = (folders, query) => {
    if (!query.trim()) return folders;
    
    const lowerQuery = query.toLowerCase();
    
    const matchesQuery = (folder) => {
      return folder.name.toLowerCase().includes(lowerQuery);
    };

    const filterRecursive = (folder) => {
      const matches = matchesQuery(folder);
      const filteredChildren = folder.children
        .map(child => filterRecursive(child))
        .filter(child => child !== null);

      if (matches || filteredChildren.length > 0) {
        return { ...folder, children: filteredChildren };
      }
      return null;
    };

    return folders
      .map(folder => filterRecursive(folder))
      .filter(folder => folder !== null);
  };

  const handleMove = async () => {
    setLoading(true);
    setError('');

    try {
      let result;
      if (itemType === 'file') {
        result = await moveFile(itemId, selectedFolder);
      } else {
        result = await moveFolder(itemId, selectedFolder);
      }

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to move item');
      }
    } catch (err) {
      setError('Failed to move item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const FolderTreeItem = ({ folder, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(depth < 2); // Auto-expand first 2 levels
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolder === folder._id;

    return (
      <div>
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
            isSelected
              ? 'bg-[#B9FF66] border-2 border-[#191A23] shadow-[2px_2px_0_#191A23]'
              : 'hover:bg-gray-100 border-2 border-transparent'
          }`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
          onClick={() => setSelectedFolder(folder._id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="w-4 h-4 flex items-center justify-center text-[#191A23] hover:bg-gray-200 rounded"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          <Folder size={16} className="text-[#191A23]" />
          <span className="text-sm font-medium truncate">{folder.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {folder.children.map(child => (
              <FolderTreeItem key={child._id} folder={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const hierarchy = buildFolderHierarchy(folders);
  const filteredHierarchy = filterFolders(hierarchy, searchQuery);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white border-2 border-[#191A23] rounded-2xl shadow-[8px_8px_0_#191A23] p-6"
          >
            <button
              onClick={onClose}
              className="absolute -top-4 -right-4 w-10 h-10 bg-[#B9FF66] rounded-full border-2 border-[#191A23] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer z-10"
            >
              <X size={20} className="text-[#191A23]" />
            </button>

            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FolderOpen size={20} /> Move {itemType === 'file' ? 'File' : 'Folder'}
            </h3>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[#191A23] focus:outline-none focus:shadow-[2px_2px_0_#191A23] bg-[#F3F3F3] focus:bg-white"
              />
            </div>

            {/* Root Option */}
            <div
              className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                selectedFolder === null
                  ? 'bg-[#B9FF66] border-2 border-[#191A23] shadow-[2px_2px_0_#191A23]'
                  : 'hover:bg-gray-100 border-2 border-transparent'
              }`}
              onClick={() => setSelectedFolder(null)}
            >
              <Home size={16} className="text-[#191A23]" />
              <span className="text-sm font-medium">My Files (Root)</span>
            </div>

            {/* Folder Tree */}
            <div className="max-h-96 overflow-y-auto border-2 border-[#191A23] rounded-xl p-2 bg-[#F3F3F3]">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading folders...</div>
              ) : filteredHierarchy.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No folders match your search' : 'No folders available'}
                </div>
              ) : (
                filteredHierarchy.map(folder => (
                  <FolderTreeItem key={folder._id} folder={folder} depth={0} />
                ))
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 border-2 border-red-500 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 font-bold border-2 border-transparent hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMove}
                disabled={loading}
                className="flex-1 bg-[#191A23] text-white font-bold py-3 rounded-xl shadow-[2px_2px_0_#191A23] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all border-2 border-[#191A23] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Moving...' : 'Move Here'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MoveDialog;
