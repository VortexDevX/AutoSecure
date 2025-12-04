'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onFilesChange,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxFiles = 1,
  maxSize = 10,
  label,
  error,
  disabled = false,
  className = '',
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[], event?: any) => {
      setUploadError(null);

      if (fileRejections.length > 0) {
        const errors = fileRejections[0].errors;
        if (errors.some((e) => e.message.includes('too large'))) {
          setUploadError(`File too large. Maximum size is ${maxSize}MB`);
        } else if (errors.some((e) => e.message.includes('type'))) {
          setUploadError('Invalid file type. Please upload PDF, JPG, or PNG files');
        } else {
          setUploadError(errors[0]?.message || 'Failed to upload file');
        }
        return;
      }

      const remainingSlots = maxFiles - files.length;
      const filesToAdd = acceptedFiles.slice(0, remainingSlots);

      if (acceptedFiles.length > remainingSlots) {
        setUploadError(`Maximum ${maxFiles} file(s) allowed`);
      }

      const newFiles = [...files, ...filesToAdd];
      setFiles(newFiles);
      onFilesChange(filesToAdd);
    },
    [files, maxFiles, maxSize, onFilesChange]
  );

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept
      ? accept.split(',').reduce(
          (acc, type) => {
            const trimmed = type.trim();
            if (trimmed === '.pdf') acc['application/pdf'] = ['.pdf'];
            else if (trimmed === '.jpg' || trimmed === '.jpeg')
              acc['image/jpeg'] = ['.jpg', '.jpeg'];
            else if (trimmed === '.png') acc['image/png'] = ['.png'];
            return acc;
          },
          {} as Record<string, string[]>
        )
      : undefined,
    maxSize: maxSize * 1024 * 1024,
    maxFiles: maxFiles - files.length,
    disabled: disabled || files.length >= maxFiles,
  });

  const canUploadMore = files.length < maxFiles && !disabled;

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

      {/* Dropzone */}
      {canUploadMore && (
        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-red-500'
          )}
        >
          <input {...getInputProps()} />
          <CloudArrowUpIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          {isDragActive ? (
            <p className="text-sm text-primary font-medium">Drop files here...</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                <span className="text-primary font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {accept.replace(/\./g, '').toUpperCase().replace(/,/g, ', ')} (max {maxSize}MB)
              </p>
            </>
          )}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <DocumentIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {(error || uploadError) && (
        <p className="text-xs text-red-500 mt-2">{error || uploadError}</p>
      )}
    </div>
  );
}
