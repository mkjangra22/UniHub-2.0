
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AcademicFile } from '../types';

interface FilePreviewModalProps {
  file: AcademicFile;
  onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  const isText = file.type.startsWith('text/') || file.category === 'chat';

  // Image Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  // PDF Navigation State
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);

  // Load PDF using pdf.js
  useEffect(() => {
    if (isPdf && file.dataUrl) {
      setPdfLoading(true);
      const loadPdf = async () => {
        try {
          const pdfjsLib = await import('https://esm.sh/pdfjs-dist@3.11.174');
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
          
          const loadingTask = pdfjsLib.getDocument(file.dataUrl);
          const pdf = await loadingTask.promise;
          pdfDocRef.current = pdf;
          setPdfNumPages(pdf.numPages);
          renderPage(1);
        } catch (error) {
          console.error("Error loading PDF:", error);
        } finally {
          setPdfLoading(false);
        }
      };
      loadPdf();
    }
  }, [isPdf, file.dataUrl]);

  const renderPage = useCallback(async (num: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    
    try {
      const page = await pdfDocRef.current.getPage(num);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      await page.render(renderContext).promise;
      setPdfPage(num);
    } catch (error) {
      console.error("Error rendering page:", error);
    }
  }, []);

  const handlePrevPage = () => {
    if (pdfPage > 1) renderPage(pdfPage - 1);
  };

  const handleNextPage = () => {
    if (pdfPage < pdfNumPages) renderPage(pdfPage + 1);
  };

  // Image Interaction Handlers
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <i className={`fa-solid ${isImage ? 'fa-image' : isPdf ? 'fa-file-pdf' : 'fa-file-lines'}`}></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm md:text-base truncate max-w-[200px] md:max-w-md">{file.name}</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">{file.type || 'Unknown Type'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isImage && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-4">
                <button onClick={handleZoomOut} className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors" title="Zoom Out"><i className="fa-solid fa-minus"></i></button>
                <span className="text-[10px] font-bold text-slate-400 w-12 text-center">{Math.round(scale * 100)}%</span>
                <button onClick={handleZoomIn} className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors" title="Zoom In"><i className="fa-solid fa-plus"></i></button>
                <button onClick={handleResetZoom} className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors ml-1 border-l border-slate-200 dark:border-slate-700" title="Reset"><i className="fa-solid fa-arrows-rotate"></i></button>
              </div>
            )}
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950 p-4 flex items-center justify-center relative transition-colors">
          {isImage && file.dataUrl ? (
            <div 
              className="w-full h-full flex items-center justify-center overflow-hidden cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img 
                ref={imageRef}
                src={file.dataUrl} 
                alt={file.name} 
                draggable={false}
                className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out shadow-sm rounded-lg"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-full flex flex-col items-center">
              {pdfLoading && (
                <div className="absolute inset-0 z-10 bg-slate-50/80 dark:bg-slate-950/80 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">Loading PDF document...</p>
                </div>
              )}
              <div className="flex-1 overflow-auto w-full flex justify-center p-4">
                <canvas 
                  ref={canvasRef} 
                  className="shadow-2xl rounded-sm bg-white"
                />
              </div>
              
              {/* PDF Custom Navigation Bar */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-6">
                <button 
                  onClick={handlePrevPage}
                  disabled={pdfPage <= 1}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <div className="flex flex-col items-center min-w-[80px]">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">Page {pdfPage} of {pdfNumPages}</span>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-300" 
                      style={{ width: `${(pdfPage / pdfNumPages) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <button 
                  onClick={handleNextPage}
                  disabled={pdfPage >= pdfNumPages}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          ) : isText ? (
            <div className="w-full h-full bg-white dark:bg-slate-900 p-6 md:p-10 rounded-lg shadow-sm overflow-auto font-mono text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap border border-slate-200 dark:border-slate-800 transition-colors">
              {file.content || "No text content available for this file."}
            </div>
          ) : (
            <div className="text-center p-12">
              <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-600 text-3xl mx-auto mb-4">
                <i className="fa-solid fa-eye-slash"></i>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Preview not available for this file type.</p>
              <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">Please download the file to view it on your device.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center transition-colors">
          <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-4">
             <span className="flex items-center gap-1"><i className="fa-solid fa-calendar"></i> {new Date(file.uploadDate).toLocaleDateString()}</span>
             <span className="flex items-center gap-1"><i className="fa-solid fa-hard-drive"></i> {(file.size / 1024).toFixed(1)} KB</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            {file.dataUrl && (
              <a 
                href={file.dataUrl} 
                download={file.name}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-100 dark:shadow-none flex items-center gap-2 transition-all active:scale-95"
              >
                <i className="fa-solid fa-download"></i>
                Download
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
