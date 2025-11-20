'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { X, Upload, File } from 'lucide-react';
import { showToast } from '@/lib/toast';

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  onUpload: (files: File[]) => Promise<void> | void;
  onRemove?: (file: File) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  helperText?: string;
  error?: string;
  existingFiles?: Array<{ name: string; url?: string; id?: string }>;
  onRemoveExisting?: (id: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  multiple = false,
  maxSize = 10, // 10MB default
  maxFiles = 5,
  onUpload,
  onRemove,
  disabled,
  className,
  label,
  helperText,
  error,
  existingFiles = [],
  onRemoveExisting,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);
    
    // Check max files
    const totalFiles = files.length + fileArray.length;
    if (totalFiles > maxFiles) {
      showToast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Check file sizes
    const oversizedFiles = fileArray.filter(file => file.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      showToast.error(`Some files exceed ${maxSize}MB limit`);
      return;
    }

    const newFiles = multiple ? [...files, ...fileArray] : fileArray;
    setFiles(newFiles);

    if (onUpload) {
      setIsUploading(true);
      try {
        await onUpload(fileArray);
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemove = (index: number) => {
    const fileToRemove = files[index];
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onRemove?.(fileToRemove);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      <div
        className={cn(
          'relative rounded-md border-2 border-dashed transition-colors',
          dragActive
            ? 'border-blue-500 bg-blue-900/10'
            : error
            ? 'border-red-600 bg-red-900/10'
            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled || isUploading}
          className="hidden"
        />

        <div className="p-6 text-center">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <LoadingSpinner />
              <p className="text-sm text-gray-400">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-300 mb-1">
                Drag and drop files here, or{' '}
                <button
                  type="button"
                  onClick={openFileDialog}
                  disabled={disabled}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500">
                Max {maxSize}MB per file, up to {maxFiles} files
              </p>
            </>
          )}
        </div>
      </div>

      {/* Existing files */}
      {existingFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-gray-300">Existing files:</p>
          {existingFiles.map((file, index) => (
            <div
              key={file.id || index}
              className="flex items-center justify-between rounded-md bg-gray-800 p-2"
            >
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">{file.name}</span>
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    View
                  </a>
                )}
              </div>
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => file.id && onRemoveExisting(file.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selected files */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-gray-300">Selected files:</p>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-md bg-gray-800 p-2"
            >
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled || isUploading}
                className="text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-400">{helperText}</p>
      )}
    </div>
  );
};

