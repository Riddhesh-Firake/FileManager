import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, FileText, Image as ImageIcon, File } from 'lucide-react';

const FileThumbnail = ({ file, size = 'normal' }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Only fetch if it's an image and NOT deleted (trash items might not need preview)
    if (file.fileType?.includes('image') && !file.isDeleted) {
      // Try to get cached preview from localStorage
      const previews = JSON.parse(localStorage.getItem('filePreviews') || '{}');
      if (previews[file._id]) {
        setImageUrl(previews[file._id]);
        setLoading(false);
      } else {
        const fetchImage = async () => {
          try {
            const token = localStorage.getItem('token');
            // Fetch the signed URL from the backend
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/files/${file._id}/download`, {
              headers: { 'x-auth-token': token }
            });
            if (isMounted) {
              setImageUrl(res.data.downloadUrl);
              setLoading(false);
              // Cache the preview URL in localStorage
              previews[file._id] = res.data.downloadUrl;
              localStorage.setItem('filePreviews', JSON.stringify(previews));
            }
          } catch (err) {
            if (isMounted) {
              setError(true);
              setLoading(false);
            }
          }
        };
        fetchImage();
      }
    } else {
      setLoading(false);
    }

    return () => { isMounted = false; };
  }, [file._id, file.fileType, file.isDeleted]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }

  if (imageUrl && !error) {
    return (
      <img 
        src={imageUrl} 
        alt={file.fileName}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    );
  }

  // Fallback Icons based on type
  const iconSize = size === 'large' ? 48 : 24;
  
  if (file.fileType?.includes('pdf')) return <FileText size={iconSize} className="text-[#191A23]" />;
  if (file.fileType?.includes('image')) return <ImageIcon size={iconSize} className="text-gray-400" />; 
  return <File size={iconSize} className="text-[#191A23]" />;
};

export default FileThumbnail;