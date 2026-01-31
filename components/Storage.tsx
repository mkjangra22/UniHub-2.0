
import React, { useState, useMemo } from 'react';
import { AcademicFile } from '../types';
import { FILE_CATEGORIES, CATEGORY_COLORS } from '../constants';
import FilePreviewModal from './FilePreviewModal';
import PasteTextModal from './PasteTextModal';

interface StorageProps {
  files: AcademicFile[];
  setFiles: React.Dispatch<React.SetStateAction<AcademicFile[]>>;
}

const Storage: React.FC<StorageProps> = ({ files, setFiles }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AcademicFile['category']>('other');
  const [previewFile, setPreviewFile] = useState<AcademicFile | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);

  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) return files;
    const term = searchTerm.toLowerCase();
    return files.filter(file => {
      const nameMatch = file.name.toLowerCase().includes(term);
      const categoryLabel = FILE_CATEGORIES.find(c => c.value === file.category)?.label.toLowerCase() || '';
      return nameMatch || categoryLabel.includes(term);
    });
  }, [files, searchTerm]);

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      const filePromises = Array.from(uploadedFiles).map(async (file: File) => {
        const dataUrl = await readFileAsDataURL(file);
        let textContent: string | undefined = undefined;
        
        if (file.type.startsWith('text/')) {
          textContent = await readFileAsText(file);
        }

        const newFile: AcademicFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          category: selectedCategory,
          size: file.size,
          uploadDate: new Date().toISOString(),
          dataUrl: dataUrl,
          content: textContent || (file.type.startsWith('text/') ? undefined : `Document: ${file.name}`)
        };
        return newFile;
      });

      const processedFiles = await Promise.all(filePromises);
      setFiles(prev => [...processedFiles, ...prev]);
    } catch (err) {
      console.error("Error uploading files:", err);
      alert("Failed to process some files. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handlePasteSave = (file: AcademicFile) => {
    setFiles(prev => [file, ...prev]);
    setIsPasting(false);
  };

  const updateFileCategory = (fileId: string, newCategory: AcademicFile['category']) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, category: newCategory } : f));
    setEditingFileId(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Local Academic Storage</h2>
          <p className="text-slate-500 dark:text-slate-400">All data stays private. AI can read PDFs, Images, and Chats.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="relative group">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents..."
              className="w-full md:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-11 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as AcademicFile['category'])}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors shadow-sm"
            >
              {FILE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPasting(true)}
                className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-2 shadow-sm"
              >
                <i className="fa-solid fa-paste"></i>
                Paste
              </button>
              <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold cursor-pointer shadow-lg shadow-indigo-100 dark:shadow-none flex items-center gap-2 transition-all active:scale-95">
                <i className={`fa-solid ${isUploading ? 'fa-spinner fa-spin' : 'fa-plus'}`}></i>
                {isUploading ? 'Processing...' : 'Add File'}
                <input type="file" className="hidden" multiple onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upload Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Size</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredFiles.length > 0 ? filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${CATEGORY_COLORS[file.category]} bg-opacity-10`}>
                        <i className={`fa-solid ${FILE_CATEGORIES.find(c => c.value === file.category)?.icon || 'fa-file'} text-sm`}></i>
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px] md:max-w-md">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingFileId === file.id ? (
                      <select 
                        autoFocus
                        onBlur={() => setEditingFileId(null)}
                        onChange={(e) => updateFileCategory(file.id, e.target.value as any)}
                        value={file.category}
                        className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-[10px] rounded-lg px-2 py-1 outline-none"
                      >
                        {FILE_CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    ) : (
                      <button 
                        onClick={() => setEditingFileId(file.id)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${FILE_CATEGORIES.find(c => c.value === file.category)?.color} hover:ring-1 ring-current transition-all`}
                        title="Click to change category"
                      >
                        {file.category}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(file.uploadDate).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{formatSize(file.size)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setPreviewFile(file)}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      <button 
                        onClick={() => setEditingFileId(file.id)}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button 
                        onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-600 italic">
                    {searchTerm ? 'No documents match your search.' : 'No documents uploaded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewFile && (
        <FilePreviewModal 
          file={previewFile} 
          onClose={() => setPreviewFile(null)} 
        />
      )}

      {isPasting && (
        <PasteTextModal 
          onSave={handlePasteSave}
          onClose={() => setIsPasting(false)}
        />
      )}
    </div>
  );
};

export default Storage;
