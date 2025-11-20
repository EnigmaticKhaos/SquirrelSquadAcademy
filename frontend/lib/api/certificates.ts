import { api } from '../apiClient';
import type { ApiResponse, Certificate } from '@/types';

export const certificatesApi = {
  getCertificates: (params?: { courseId?: string; limit?: number; offset?: number }) => {
    const queryParams: any = {};
    if (params?.courseId) queryParams.courseId = params.courseId;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.offset) queryParams.offset = params.offset;
    
    return api.get<ApiResponse<{ certificates: Certificate[]; count: number; total: number }>>('/certificates', { params: queryParams });
  },
  
  getCertificate: (certificateId: string) => 
    api.get<ApiResponse<Certificate>>(`/certificates/${certificateId}`),
  
  downloadCertificate: (certificateId: string) => 
    api.get(`/certificates/${certificateId}/download`, { responseType: 'blob' }),
  
  verifyCertificate: (certificateId: string, code?: string) => {
    const params = code ? { code } : undefined;
    return api.get<ApiResponse<{ certificate: Certificate; valid: boolean }>>(`/certificates/verify/${certificateId}`, { params });
  },
};

