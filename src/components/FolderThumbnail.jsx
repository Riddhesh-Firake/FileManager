import React from 'react';
import { Folder, Star, Edit2, Trash2, Share2, Move, RefreshCcw, Ban, Loader2, MoreVertical } from 'lucide-react';
import { useFileContext } from '../context/FileContext';

const FolderThumbnail = ({ 
  folder, 
  onClick, 
  onAction, 
  showRestore = false,
  viewMode = 'grid' 
}) => {
  const { operationLoading } = useFileContext();
  
  // Check if any operation is loading for this folder
  const isLoading = Object.keys(operationLoading).some(key => 
    key.includes(folder._id) && operationLoading[key]
  );
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString();
  };

  // Calculate item count (files + subfolders)
  const itemCount = folder.itemCount || 0;

  // Action buttons for grid view
  const GridActions = () => (
    <div className="absolute inset-0 bg-[#191A23]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 px-2">
      <div className="flex flex-wrap justify-center gap-2">
        {showRestore ? (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); onAction('restore', folder); }} 
              className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]" 
              title="Restore"
            >
              <RefreshCcw size={14}/>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onAction('permanentDelete', folder); }} 
              className="p-2 bg-red-100 border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] text-red-600" 
              title="Delete Forever"
            >
              <Ban size={14}/>
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); onAction('star', folder); }} 
              className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]"
              title="Star"
            >
              <Star size={14} className={folder.isStarred ? "fill-yellow-400 text-yellow-400" : ""} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onAction('rename', folder); }} 
              className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]"
              title="Rename"
            >
              <Edit2 size={14}/>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onAction('move', folder); }} 
              className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]"
              title="Move"
            >
              <Move size={14}/>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onAction('share', folder); }} 
              className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]"
              title="Share"
            >
              <Share2 size={14}/>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onAction('delete', folder); }} 
              className="p-2 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] hover:bg-red-100 text-red-600"
              title="Delete"
            >
              <Trash2 size={14}/>
            </button>
          </>
        )}
      </div>
    </div>
  );

  // Action buttons for list view
  const ListActions = () => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    
    return (
      <div className="flex justify-end gap-0.5 sm:gap-1 items-center">
        {!isExpanded ? (
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsExpanded(true);
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
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); onAction('restore', folder); }} 
                className="p-1 sm:p-1.5 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]" 
                title="Restore"
              >
                <RefreshCcw size={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3"/>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); onAction('permanentDelete', folder); }} 
                className="p-1 sm:p-1.5 bg-red-100 border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] text-red-600" 
                title="Delete Forever"
              >
                <Ban size={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3"/>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); onAction('star', folder); }} 
                className="p-1 sm:p-1.5 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]"
                title="Star"
              >
                <Star size={12} className={folder.isStarred ? "fill-yellow-400 text-yellow-400 w-2.5 h-2.5 sm:w-3 sm:h-3" : "w-2.5 h-2.5 sm:w-3 sm:h-3"} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); onAction('rename', folder); }} 
                className="p-1 sm:p-1.5 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]"
                title="Rename"
              >
                <Edit2 size={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3"/>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); onAction('move', folder); }} 
                className="p-1 sm:p-1.5 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]"
                title="Move"
              >
                <Move size={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3"/>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); onAction('share', folder); }} 
                className="p-1 sm:p-1.5 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23]"
                title="Share"
              >
                <Share2 size={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3"/>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); onAction('delete', folder); }} 
                className="p-1 sm:p-1.5 bg-white border-2 border-[#191A23] rounded-lg hover:shadow-[2px_2px_0_#191A23] hover:bg-red-100 text-red-600"
                title="Delete"
              >
                <Trash2 size={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3"/>
              </button>
            </>
          )}
          </div>
        )}
      </div>
    );
  };

  // Grid view rendering
  if (viewMode === 'grid') {
    return (
      <div 
        onClick={isLoading ? undefined : onClick}
        className={`bg-white border-2 rounded-xl p-4 transition-all flex flex-col gap-3 relative group border-[#191A23] ${
          isLoading ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:shadow-[4px_4px_0_#191A23] hover:-translate-y-1'
        }`}
      >
        <div className="aspect-square bg-[#B9FF66] border-2 border-[#191A23] rounded-lg flex items-center justify-center overflow-hidden relative">
          {isLoading ? (
            <Loader2 size={48} className="text-[#191A23] animate-spin" />
          ) : (
            <Folder size={48} className="text-[#191A23]" />
          )}
          {!isLoading && <GridActions />}
        </div>
        <div>
          <p className="font-bold text-sm truncate mb-1">{folder.name}</p>
          <p className="text-xs font-medium text-gray-500">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
          <p className="text-xs text-gray-400">Created: {formatDate(folder.createdAt)}</p>
        </div>
      </div>
    );
  }

  // List view rendering
  return (
    <tr 
      onClick={isLoading ? undefined : onClick} 
      className={`border-b-2 border-gray-100 transition-colors group ${
        isLoading ? 'opacity-60 cursor-wait' : 'hover:bg-[#B9FF66]/20 cursor-pointer'
      }`}
    >
      <td className="p-1.5 sm:p-2 md:p-3 pl-2 sm:pl-3 md:pl-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 min-w-[2rem] sm:min-w-[2.5rem] md:min-w-[3rem] bg-[#B9FF66] border-2 border-[#191A23] rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
            {isLoading ? (
              <Loader2 size={16} className="text-[#191A23] animate-spin sm:w-5 sm:h-5 md:w-6 md:h-6" />
            ) : (
              <Folder size={16} className="text-[#191A23] sm:w-5 sm:h-5 md:w-6 md:h-6" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[10px] sm:text-xs md:text-sm truncate">{folder.name}</span>
            <span className="text-[9px] sm:text-xs text-gray-500">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          </div>
        </div>
      </td>
      <td className="p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs font-medium text-gray-600 hidden lg:table-cell">
        {formatDate(folder.createdAt)}
      </td>
      <td className="p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs font-medium text-gray-600 hidden xl:table-cell">
        {formatDateTime(folder.updatedAt || folder.createdAt)}
      </td>
      <td className="p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs font-medium text-gray-600 hidden md:table-cell">—</td>
      <td className="p-1.5 sm:p-2 md:p-3 text-right pr-2 sm:pr-3 md:pr-4">
        {!isLoading && <ListActions />}
      </td>
    </tr>
  );
};

export default FolderThumbnail;
