import React from 'react';
import { Download, Edit2, Trash2, Star, RefreshCcw, Ban, Share2, MoreVertical, FolderInput } from 'lucide-react';
import FileThumbnail from './FileThumbnail';
import FolderThumbnail from './FolderThumbnail';
import ConfirmDialog from './ConfirmDialog';

const FileList = ({ files, folders = [], viewMode, onAction, showRestore = false }) => {
  const [expandedActions, setExpandedActions] = React.useState(null);
  const [confirmDialog, setConfirmDialog] = React.useState({ isOpen: false, action: null, item: null });
  
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (files.length === 0 && folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-400 rounded-2xl bg-white/50">
        <p className="text-[#191A23] font-bold text-lg">No items found.</p>
      </div>
    );
  }

  // Common Action Buttons
  const Actions = ({ file }) => {
    const isExpanded = expandedActions === file._id;
    
    return (
      <div className="flex justify-end gap-0.5 sm:gap-1 items-center">
        {!isExpanded ? (
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setExpandedActions(file._id);
            }} 
            className="p-1 sm:p-1.5 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]"
            title="Actions"
          >
            <MoreVertical size={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#191A23]" />
          </button>
        ) : (
          <div className="flex gap-0.5 sm:gap-1">
          {showRestore ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); setExpandedActions(null); onAction('restore', file); }} className="p-1 sm:p-1.5 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]" title="Restore"><RefreshCcw size={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3"/></button>
              <button onClick={(e) => { e.stopPropagation(); setExpandedActions(null); setConfirmDialog({ isOpen: true, action: 'permanentDelete', item: file, type: 'file' }); }} className="p-1 sm:p-1.5 bg-red-100 border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] text-red-600" title="Delete Forever"><Ban size={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3"/></button>
            </>
          ) : (
            <>
              <button onClick={(e) => { e.stopPropagation(); setExpandedActions(null); onAction('star', file); }} className="p-1 sm:p-1.5 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]" title="Star"><Star size={12} className={file.isStarred ? "fill-yellow-400 text-yellow-400 w-2.5 h-2.5 sm:w-3 sm:h-3" : "w-2.5 h-2.5 sm:w-3 sm:h-3"} /></button>
              <button onClick={(e) => { e.stopPropagation(); setExpandedActions(null); onAction('download', file); }} className="p-1 sm:p-1.5 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]" title="Download"><Download size={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3"/></button>
              <button onClick={(e) => { e.stopPropagation(); setExpandedActions(null); onAction('move', file); }} className="p-1 sm:p-1.5 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]" title="Move"><FolderInput size={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3"/></button>
              <button onClick={(e) => { e.stopPropagation(); setExpandedActions(null); onAction('rename', file); }} className="p-1 sm:p-1.5 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]" title="Rename"><Edit2 size={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3"/></button>
              <button onClick={(e) => { e.stopPropagation(); setExpandedActions(null); onAction('share', file); }} className="p-1 sm:p-1.5 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]" title="Share"><Share2 size={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3"/></button>
              <button onClick={(e) => { e.stopPropagation(); setExpandedActions(null); setConfirmDialog({ isOpen: true, action: 'delete', item: file, type: 'file' }); }} className="p-1 sm:p-1.5 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] hover:bg-red-100 text-red-600" title="Delete"><Trash2 size={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3"/></button>
            </>
          )}
          </div>
        )}
      </div>
    );
  };

  const handleConfirm = () => {
    if (confirmDialog.action && confirmDialog.item) {
      onAction(confirmDialog.action, confirmDialog.item);
    }
  };

  const getConfirmDialogProps = () => {
    const { action, type } = confirmDialog;
    
    if (action === 'permanentDelete') {
      return {
        title: 'Delete Forever?',
        message: `This ${type} will be permanently deleted and cannot be recovered.`,
        confirmText: 'Delete Forever',
        isDangerous: true
      };
    } else if (action === 'delete') {
      return {
        title: 'Move to Trash?',
        message: `This ${type} will be moved to trash. You can restore it later.`,
        confirmText: 'Move to Trash',
        isDangerous: true
      };
    }
    return {};
  };

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null, item: null })}
        onConfirm={handleConfirm}
        {...getConfirmDialogProps()}
      />
      
      {viewMode === 'list' ? (
        <div className="bg-white border-2 border-[#191A23] rounded-2xl shadow-[4px_4px_0_#191A23] overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#191A23] text-white border-b-2 border-[#191A23] text-[10px] sm:text-xs uppercase font-bold tracking-tight">
                <th className="p-1.5 sm:p-2 md:p-3 pl-2 sm:pl-3 md:pl-4 w-[45%] sm:w-auto">Name</th>
                <th className="p-1.5 sm:p-2 md:p-3 hidden lg:table-cell w-[15%]">Date</th>
                <th className="p-1.5 sm:p-2 md:p-3 hidden xl:table-cell w-[18%]">Modified</th>
                <th className="p-1.5 sm:p-2 md:p-3 hidden md:table-cell w-[12%]">Size</th>
                <th className="p-1.5 sm:p-2 md:p-3 text-right pr-2 sm:pr-3 md:pr-4 w-[55%] sm:w-[30%] md:w-auto">Actions</th>
              </tr>
            </thead>
            <tbody>
              {folders.map(folder => (
                <FolderThumbnail
                  key={folder._id}
                  folder={folder}
                  onClick={() => onAction('selectFolder', folder)}
                  onAction={onAction}
                  showRestore={showRestore}
                  viewMode="list"
                />
              ))}
              {files.map(file => (
                <tr 
                  key={file._id} 
                  onClick={() => onAction('select', file)} 
                  className="border-b-2 border-gray-100 hover:bg-[#B9FF66]/20 transition-colors cursor-pointer group last:border-b-0"
                >
                  <td className="p-1.5 sm:p-2 md:p-3 pl-2 sm:pl-3 md:pl-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 min-w-[2rem] sm:min-w-[2.5rem] md:min-w-[3rem] bg-white border-2 border-[#191A23] rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                          <FileThumbnail file={file} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[10px] sm:text-xs md:text-sm truncate">{file.fileName}</span>
                        <span className="text-[9px] sm:text-xs text-gray-500 md:hidden">{formatBytes(file.fileSize)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs font-medium text-gray-600 hidden lg:table-cell">{new Date(file.createdAt).toLocaleDateString()}</td>
                  <td className="p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs font-medium text-gray-600 hidden xl:table-cell">{new Date(file.createdAt).toLocaleString()}</td>
                  <td className="p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs font-medium text-gray-600 hidden md:table-cell">{formatBytes(file.fileSize)}</td>
                  <td className="p-1.5 sm:p-2 md:p-3 text-right pr-2 sm:pr-3 md:pr-4"><Actions file={file} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
          {folders.map(folder => (
            <FolderThumbnail
              key={folder._id}
              folder={folder}
              onClick={() => onAction('selectFolder', folder)}
              onAction={onAction}
              showRestore={showRestore}
              viewMode="grid"
            />
          ))}
          {files.map(file => (
            <div 
              key={file._id} 
              onClick={() => onAction('select', file)}
              className="bg-white border-2 rounded-xl p-3 sm:p-4 cursor-pointer transition-all hover:shadow-[4px_4px_0_#191A23] hover:-translate-y-1 flex flex-col gap-2 sm:gap-3 relative group border-[#191A23]"
            >
              <div className="aspect-square bg-gray-100 border-2 border-[#191A23] rounded-lg flex items-center justify-center overflow-hidden relative">
                <FileThumbnail file={file} size="large" />
                <div className="absolute inset-0 bg-[#191A23]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 sm:gap-2 px-2">
                   <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                      <Actions file={file} />
                   </div>
                </div>
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm truncate mb-1">{file.fileName}</p>
                <p className="text-xs font-medium text-gray-500">{formatBytes(file.fileSize)}</p>
                <p className="text-xs text-gray-400 hidden sm:block">Added: {new Date(file.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default FileList;