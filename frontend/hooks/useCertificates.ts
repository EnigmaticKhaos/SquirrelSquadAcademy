import { useQuery } from '@tanstack/react-query';
import { certificatesApi } from '@/lib/api';
import type { Certificate } from '@/types';

interface CertificatesResponse {
  certificates: Certificate[];
  count: number;
  total: number;
}

export const useCertificates = (params?: { courseId?: string; limit?: number; offset?: number }) => {
  return useQuery<CertificatesResponse>({
    queryKey: ['certificates', params],
    queryFn: async (): Promise<CertificatesResponse> => {
      const response = await certificatesApi.getCertificates(params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      return {
        certificates: (apiResponse as any).certificates || [],
        count: (apiResponse as any).count || 0,
        total: (apiResponse as any).total || 0,
      };
    },
    placeholderData: { certificates: [], count: 0, total: 0 },
  });
};

export const useCertificate = (certificateId: string) => {
  return useQuery<Certificate | null>({
    queryKey: ['certificate', certificateId],
    queryFn: async (): Promise<Certificate | null> => {
      try {
        const response = await certificatesApi.getCertificate(certificateId);
        const apiResponse = response.data;
        if (apiResponse.data) {
          return apiResponse.data;
        }
        return (apiResponse as any).certificate || null;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!certificateId,
    placeholderData: null,
  });
};

