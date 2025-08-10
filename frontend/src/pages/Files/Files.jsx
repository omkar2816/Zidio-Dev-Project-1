import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FileSpreadsheet, Trash2 } from 'lucide-react';
import { removeRecentFile, fetchUploadedFiles, deleteUploadedFile } from '../../store/slices/analyticsSlice';
import toast from 'react-hot-toast';

const Files = () => {
  const dispatch = useDispatch();
  const { recentFiles } = useSelector((state) => state.analytics);

  useEffect(() => {
    dispatch(fetchUploadedFiles());
  }, [dispatch]);

  const handleDelete = async (file) => {
    try {
      if (file.id) {
        await dispatch(deleteUploadedFile(file.id)).unwrap();
        toast.success('File deleted', { position: 'bottom-center' });
      } else {
        // Fallback for legacy entries without id
        dispatch(removeRecentFile(file.uploadedAt));
        toast.success('File removed from list', { position: 'bottom-center' });
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to delete file', { position: 'bottom-center' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Excel Files</h2>
        {recentFiles && recentFiles.length > 0 ? (
          <div className="space-y-3">
            {recentFiles.map((file) => (
              <div key={file.id || file.uploadedAt} className="flex items-center justify-between p-3 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 rounded bg-green-100 dark:bg-green-900/20">
                    <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[50vw] sm:max-w-[40vw]">{file.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                    {new Date(file.uploadedAt).toLocaleString()}
                  </div>
                  <button
                    aria-label="Delete file from list"
                    onClick={() => handleDelete(file)}
                    className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                    title="Remove from list"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">No data available.</div>
        )}
      </div>
    </div>
  );
};

export default Files;


