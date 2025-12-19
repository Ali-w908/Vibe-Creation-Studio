import React, { useCallback, useState } from 'react';
import { Upload, File, X, Check, AlertCircle } from 'lucide-react';

interface FileDropzoneProps {
    onFilesSelected: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in MB
    label?: string;
    sublabel?: string;
    className?: string;
}

interface FilePreview {
    file: File;
    preview?: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    error?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
    onFilesSelected,
    accept = '*/*',
    multiple = true,
    maxSize = 50,
    label = 'Drop files here',
    sublabel = 'or click to browse',
    className = ''
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<FilePreview[]>([]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const processFiles = useCallback((fileList: FileList | null) => {
        if (!fileList) return;

        const newFiles: FilePreview[] = [];
        const validFiles: File[] = [];

        Array.from(fileList).forEach(file => {
            const isValidSize = file.size <= maxSize * 1024 * 1024;

            const preview: FilePreview = {
                file,
                status: isValidSize ? 'done' : 'error',
                error: isValidSize ? undefined : `File exceeds ${maxSize}MB limit`
            };

            // Generate preview for images
            if (file.type.startsWith('image/') && isValidSize) {
                preview.preview = URL.createObjectURL(file);
            }

            newFiles.push(preview);
            if (isValidSize) {
                validFiles.push(file);
            }
        });

        setFiles(prev => [...prev, ...newFiles]);
        if (validFiles.length > 0) {
            onFilesSelected(validFiles);
        }
    }, [maxSize, onFilesSelected]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    }, [processFiles]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files);
    }, [processFiles]);

    const removeFile = (index: number) => {
        setFiles(prev => {
            const newFiles = [...prev];
            if (newFiles[index].preview) {
                URL.revokeObjectURL(newFiles[index].preview!);
            }
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Dropzone */}
            <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative flex flex-col items-center justify-center
          w-full min-h-[160px] p-6
          border-2 border-dashed rounded-2xl
          cursor-pointer transition-all duration-300
          ${isDragging
                        ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                    }
        `}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleChange}
                />

                <div className={`
          w-14 h-14 rounded-2xl mb-4 flex items-center justify-center
          transition-all duration-300
          ${isDragging
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-500 scale-110'
                        : 'bg-white/5'
                    }
        `}>
                    <Upload className={`w-6 h-6 ${isDragging ? 'text-white' : 'text-gray-400'}`} />
                </div>

                <p className={`text-sm font-medium ${isDragging ? 'text-indigo-400' : 'text-gray-300'}`}>
                    {label}
                </p>
                <p className="text-xs text-gray-500 mt-1">{sublabel}</p>
                <p className="text-[10px] text-gray-600 mt-2">
                    Max {maxSize}MB per file
                </p>
            </label>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((item, index) => (
                        <div
                            key={index}
                            className={`
                flex items-center gap-3 p-3 rounded-xl
                bg-white/[0.03] border border-white/[0.06]
                ${item.status === 'error' ? 'border-red-500/30' : ''}
              `}
                        >
                            {/* Preview or Icon */}
                            {item.preview ? (
                                <img
                                    src={item.preview}
                                    alt=""
                                    className="w-10 h-10 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                    <File className="w-5 h-5 text-gray-500" />
                                </div>
                            )}

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-200 truncate">{item.file.name}</p>
                                <p className="text-xs text-gray-500">
                                    {formatFileSize(item.file.size)}
                                    {item.error && (
                                        <span className="text-red-400 ml-2">• {item.error}</span>
                                    )}
                                </p>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-2">
                                {item.status === 'done' && (
                                    <Check className="w-4 h-4 text-green-400" />
                                )}
                                {item.status === 'error' && (
                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                )}
                                <button
                                    onClick={() => removeFile(index)}
                                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileDropzone;
