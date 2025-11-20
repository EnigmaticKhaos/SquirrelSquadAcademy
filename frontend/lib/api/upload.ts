import { api } from '../apiClient';
import type { ApiResponse } from '@/types';

export interface UploadFileResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export const uploadApi = {
  // Upload document
  uploadDocument: (file: File, folder?: string, metadata?: Record<string, any>) => {
    const formData = new FormData();
    formData.append('document', file);
    if (folder) formData.append('folder', folder);
    if (metadata) formData.append('metadata', JSON.stringify(metadata));
    
    return api.post<ApiResponse<UploadFileResult>>('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Upload code file
  uploadCode: (file: File, folder?: string, metadata?: Record<string, any>) => {
    const formData = new FormData();
    formData.append('code', file);
    if (folder) formData.append('folder', folder);
    if (metadata) formData.append('metadata', JSON.stringify(metadata));
    
    return api.post<ApiResponse<UploadFileResult>>('/upload/code', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Upload image
  uploadImage: (file: File, folder?: string, metadata?: Record<string, any>) => {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) formData.append('folder', folder);
    if (metadata) formData.append('metadata', JSON.stringify(metadata));
    
    return api.post<ApiResponse<UploadFileResult>>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

