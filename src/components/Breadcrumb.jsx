import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useFileContext } from '../context/FileContext';

const Breadcrumb = () => {
  const { folderPath, navigateToRoot, navigateToFolder } = useFileContext();

  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      {/* Root Level - My Files */}
      <button
        onClick={navigateToRoot}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#191A23] font-bold
          transition-all duration-200
          ${folderPath.length === 0
            ? 'bg-[#B9FF66] shadow-[2px_2px_0_#191A23]'
            : 'bg-white hover:bg-[#F3F3F3] hover:shadow-[2px_2px_0_#191A23]'
          }
        `}
      >
        <Home size={16} />
        <span>My Files</span>
      </button>

      {/* Folder Path */}
      {folderPath.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
          <button
            onClick={() => navigateToFolder(folder.id)}
            className={`
              px-4 py-2 rounded-lg border-2 border-[#191A23] font-bold
              transition-all duration-200 truncate max-w-xs
              ${index === folderPath.length - 1
                ? 'bg-[#B9FF66] shadow-[2px_2px_0_#191A23]'
                : 'bg-white hover:bg-[#F3F3F3] hover:shadow-[2px_2px_0_#191A23]'
              }
            `}
            title={folder.name}
          >
            {folder.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumb;
