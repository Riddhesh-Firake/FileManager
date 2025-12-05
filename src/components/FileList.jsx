import React from 'react';
import { Download, Edit2, Trash2, Star, RefreshCcw, Ban, Share2 } from 'lucide-react';
import FileThumbnail from './FileThumbnail';

const FileList = ({ files, viewMode, onAction, showRestore = false }) => {
  
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-400 rounded-2xl bg-white/50">
        <p className="text-[#191A23] font-bold text-lg">No files found.</p>
      </div>
    );
  }

  // Common Action Buttons
  const Actions = ({ file }) => (
    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {showRestore ? (
        <>
          <button onClick={(e) => { e.stopPropagation(); onAction('restore', file); }} className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]" title="Restore"><RefreshCcw size={14}/></button>
          <button onClick={(e) => { e.stopPropagation(); onAction('permanentDelete', file); }} className="p-2 bg-red-100 border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] text-red-600" title="Delete Forever"><Ban size={14}/></button>
        </>
      ) : (
        <>
          <button onClick={(e) => { e.stopPropagation(); onAction('star', file); }} className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]"><Star size={14} className={file.isStarred ? "fill-yellow-400 text-yellow-400" : ""} /></button>
          <button onClick={(e) => { e.stopPropagation(); onAction('download', file); }} className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]"><Download size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); onAction('rename', file); }} className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]"><Edit2 size={14}/></button>
          <button onClick={(e) => { e.stopPropagation(); onAction('share', file); }} className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]"><Share2 size={14}/></button>
          <button onClick={(e) => { e.stopPropagation(); onAction('delete', file); }} className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] hover:bg-red-100 text-red-600"><Trash2 size={14}/></button>
        </>
      )}
    </div>
  );

  return (
    <>
      {viewMode === 'list' ? (
        <div className="bg-white border-2 border-[#191A23] rounded-2xl overflow-hidden shadow-[4px_4px_0_#191A23]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#191A23] text-white border-b-2 border-[#191A23] text-xs uppercase font-bold tracking-wider">
                <th className="p-4 pl-6">Name</th>
                <th className="p-4 hidden md:table-cell">Date Added</th>
                <th className="p-4 hidden md:table-cell">Date Modified</th>
                <th className="p-4">Size</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr 
                  key={file._id} 
                  onClick={() => onAction('select', file)} 
                  className="border-b-2 border-gray-100 hover:bg-[#B9FF66]/20 transition-colors cursor-pointer group last:border-b-0"
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 min-w-[3rem] bg-white border-2 border-[#191A23] rounded-lg overflow-hidden flex items-center justify-center">
                          <FileThumbnail file={file} />
                      </div>
                      <span className="font-bold text-sm truncate max-w-[200px]">{file.fileName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-600 hidden md:table-cell">{new Date(file.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-sm font-medium text-gray-600 hidden md:table-cell">{new Date(file.createdAt).toLocaleString()}</td>
                  <td className="p-4 text-sm font-medium text-gray-600">{formatBytes(file.fileSize)}</td>
                  <td className="p-4 text-right pr-6"><Actions file={file} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map(file => (
            <div 
              key={file._id} 
              onClick={() => onAction('select', file)}
              className="bg-white border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-[4px_4px_0_#191A23] hover:-translate-y-1 flex flex-col gap-3 relative group border-[#191A23]"
            >
              <div className="aspect-square bg-gray-100 border-2 border-[#191A23] rounded-lg flex items-center justify-center overflow-hidden relative">
                <FileThumbnail file={file} size="large" />
                <div className="absolute inset-0 bg-[#191A23]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 px-2">
                   <div className="flex flex-wrap justify-center gap-2">
                      <Actions file={file} />
                   </div>
                </div>
              </div>
              <div>
                <p className="font-bold text-sm truncate mb-1">{file.fileName}</p>
                <p className="text-xs font-medium text-gray-500">{formatBytes(file.fileSize)}</p>
                <p className="text-xs text-gray-400">Added: {new Date(file.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default FileList;