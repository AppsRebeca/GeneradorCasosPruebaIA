
import React, { useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (files: FileList) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
        disabled={disabled}
        multiple
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className="w-full flex justify-center items-center px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-green-500 dark:hover:border-green-400 hover:text-green-500 dark:hover:text-green-400 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {/* Fix: Corrected incomplete viewBox attribute in SVG. */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span className="font-medium text-lg">
          {disabled ? 'Procesando...' : 'Selecciona uno o más PDFs (hasta 25 HU en total)'}
        </span>
      </button>
    </div>
  );
};

export default FileUpload;
