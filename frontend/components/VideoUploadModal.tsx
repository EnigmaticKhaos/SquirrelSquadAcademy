'use client';

import React, { useState, useRef } from 'react';
import { useUploadVideo, useSetYouTubeVideo } from '@/hooks/useVideos';
import { Modal, Button, Input, LoadingSpinner } from '@/components/ui';
import { showToast } from '@/lib/toast';
import { Upload, Youtube, X } from 'lucide-react';

interface VideoUploadModalProps {
  lessonId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({
  lessonId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'youtube'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadVideo = useUploadVideo();
  const setYouTubeVideo = useSetYouTubeVideo();
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (500MB limit)
      if (file.size > 500 * 1024 * 1024) {
        showToast.error('File too large', 'Video file must be less than 500MB');
        return;
      }
      // Check file type
      if (!file.type.startsWith('video/')) {
        showToast.error('Invalid file type', 'Please select a video file');
        return;
      }
      setSelectedFile(file);
    }
  };
  
  const handleUpload = async () => {
    if (uploadMethod === 'file') {
      if (!selectedFile) {
        showToast.error('No file selected', 'Please select a video file to upload');
        return;
      }
      
      try {
        await uploadVideo.mutateAsync({ lessonId, file: selectedFile });
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onSuccess?.();
        onClose();
      } catch (error) {
        // Error handled by mutation
      }
    } else {
      if (!youtubeUrl.trim()) {
        showToast.error('YouTube URL required', 'Please enter a valid YouTube URL');
        return;
      }
      
      try {
        await setYouTubeVideo.mutateAsync({ lessonId, youtubeUrl: youtubeUrl.trim() });
        setYoutubeUrl('');
        onSuccess?.();
        onClose();
      } catch (error) {
        // Error handled by mutation
      }
    }
  };
  
  const isValidYouTubeUrl = (url: string) => {
    return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(url);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Video">
      <div className="space-y-4">
        {/* Upload Method Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setUploadMethod('file')}
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
              uploadMethod === 'file'
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Upload className="w-5 h-5 mx-auto mb-1" />
            <div className="text-sm">Upload File</div>
          </button>
          <button
            onClick={() => setUploadMethod('youtube')}
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
              uploadMethod === 'youtube'
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Youtube className="w-5 h-5 mx-auto mb-1" />
            <div className="text-sm">YouTube URL</div>
          </button>
        </div>
        
        {/* File Upload */}
        {uploadMethod === 'file' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Video File
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-400">
                  {selectedFile ? selectedFile.name : 'Click to select video file'}
                </span>
                <span className="text-xs text-gray-500">
                  Max 500MB, MP4, WebM, or other video formats
                </span>
              </label>
            </div>
            {selectedFile && (
              <div className="flex items-center justify-between bg-gray-800 p-2 rounded">
                <span className="text-sm text-gray-300">{selectedFile.name}</span>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* YouTube URL */}
        {uploadMethod === 'youtube' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              YouTube URL
            </label>
            <Input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full"
            />
            <p className="text-xs text-gray-400">
              Enter a valid YouTube video URL
            </p>
            {youtubeUrl && !isValidYouTubeUrl(youtubeUrl) && (
              <p className="text-xs text-red-400">
                Please enter a valid YouTube URL
              </p>
            )}
          </div>
        )}
        
        {/* Upload Progress */}
        {(uploadVideo.isPending || setYouTubeVideo.isPending) && (
          <div className="space-y-2">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 text-center">
              {uploadMethod === 'file' ? 'Uploading video...' : 'Processing YouTube URL...'}
            </p>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={uploadVideo.isPending || setYouTubeVideo.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={
              (uploadMethod === 'file' && !selectedFile) ||
              (uploadMethod === 'youtube' && (!youtubeUrl.trim() || !isValidYouTubeUrl(youtubeUrl))) ||
              uploadVideo.isPending ||
              setYouTubeVideo.isPending
            }
          >
            {(uploadVideo.isPending || setYouTubeVideo.isPending) ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {uploadMethod === 'file' ? 'Uploading...' : 'Processing...'}
              </>
            ) : (
              uploadMethod === 'file' ? 'Upload Video' : 'Add YouTube Video'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

