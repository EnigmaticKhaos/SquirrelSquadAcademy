import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataPrivacyApi, type DataExport, type CookieConsent, type PrivacySettings, type ExportOptions, type CookieConsentPreferences } from '@/lib/api/dataPrivacy';
import { showToast, getErrorMessage } from '@/lib/toast';

// Helper function to convert data to CSV
const convertToCSV = (data: any): string => {
  if (!data || typeof data !== 'object') return '';
  
  // Simple CSV conversion for flat objects
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(','));
    return [headers.join(','), ...rows].join('\n');
  }
  
  // For single object, convert to key-value pairs
  const lines = Object.entries(data).map(([key, value]) => {
    const val = typeof value === 'object' ? JSON.stringify(value) : value;
    return `${key},${typeof val === 'string' && val.includes(',') ? `"${val}"` : val}`;
  });
  return ['Key,Value', ...lines].join('\n');
};

// Data Export
export const useExportHistory = () => {
  return useQuery<DataExport[]>({
    queryKey: ['data-exports'],
    queryFn: async () => {
      const response = await dataPrivacyApi.getExportHistory();
      const data = response.data.data || response.data;
      return data?.exports || [];
    },
    placeholderData: [],
  });
};

export const useExportStatus = (id: string, enabled = true) => {
  return useQuery<DataExport>({
    queryKey: ['data-export', id],
    queryFn: async () => {
      const response = await dataPrivacyApi.getExportStatus(id);
      const data = response.data.data || response.data;
      return data?.export;
    },
    enabled: enabled && !!id,
    refetchInterval: (query) => {
      // Poll while processing
      const exportData = query.state.data;
      if (exportData?.status === 'pending' || exportData?.status === 'processing') {
        return 5000; // Poll every 5 seconds
      }
      return false;
    },
  });
};

export const useExportUserData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: ExportOptions) => dataPrivacyApi.exportUserData(options),
    onSuccess: (response, variables) => {
      // Backend returns { success: true, export: {...}, data: {...} }
      const responseData = response.data.data || response.data;
      const exportData = responseData?.export;
      const exportDataDirect = responseData?.data;
      
      queryClient.invalidateQueries({ queryKey: ['data-exports'] });
      
      // If data is returned directly, trigger download
      if (typeof window !== 'undefined' && exportDataDirect && exportData?.format) {
        try {
          let blob: Blob;
          let mimeType: string;
          let content: string;
          
          if (exportData.format === 'json') {
            content = JSON.stringify(exportDataDirect, null, 2);
            mimeType = 'application/json';
          } else if (exportData.format === 'csv') {
            // Simple CSV conversion
            content = convertToCSV(exportDataDirect);
            mimeType = 'text/csv';
          } else {
            content = JSON.stringify(exportDataDirect, null, 2);
            mimeType = 'application/json';
          }
          
          blob = new Blob([content], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `data-export-${Date.now()}.${exportData.format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast.success('Data export downloaded', 'Your data has been exported successfully');
        } catch (error) {
          console.error('Error downloading export:', error);
          showToast.success('Data export requested', 'Your export will be ready soon.');
        }
      } else if (exportData) {
        showToast.success('Data export requested', 'Your export will be ready soon. We will notify you when it\'s available.');
      }
    },
    onError: (error) => {
      showToast.error('Failed to export data', getErrorMessage(error));
    },
  });
};

// Account Deletion
export const useRequestAccountDeletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { password: string; deletionDelayDays?: number }) =>
      dataPrivacyApi.requestAccountDeletion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] });
      showToast.success('Account deletion requested', 'You will receive a confirmation email. You can cancel this request anytime.');
    },
    onError: (error) => {
      showToast.error('Failed to request account deletion', getErrorMessage(error));
    },
  });
};

export const useCancelAccountDeletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dataPrivacyApi.cancelAccountDeletion(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] });
      showToast.success('Account deletion cancelled', 'Your account will not be deleted.');
    },
    onError: (error) => {
      showToast.error('Failed to cancel account deletion', getErrorMessage(error));
    },
  });
};

export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: (data: { password: string; confirm: string }) =>
      dataPrivacyApi.deleteAccount(data),
    onSuccess: () => {
      showToast.success('Account deleted', 'Your account and all data have been permanently deleted.');
      // Redirect to home after a short delay
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    },
    onError: (error) => {
      showToast.error('Failed to delete account', getErrorMessage(error));
    },
  });
};

// Cookie Consent
export const useCookieConsent = (sessionId?: string, enabled = true) => {
  return useQuery<CookieConsent | null>({
    queryKey: ['cookie-consent', sessionId],
    queryFn: async () => {
      const response = await dataPrivacyApi.getCookieConsent(sessionId);
      const data = response.data.data || response.data;
      return data?.consent || null;
    },
    enabled,
    staleTime: Infinity, // Cookie consent doesn't change often
  });
};

export const useSaveCookieConsent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: CookieConsentPreferences) =>
      dataPrivacyApi.saveCookieConsent(preferences),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['cookie-consent', variables.sessionId], data.data.data?.consent || data.data.consent);
      queryClient.invalidateQueries({ queryKey: ['cookie-consent'] });
    },
    onError: (error) => {
      showToast.error('Failed to save cookie preferences', getErrorMessage(error));
    },
  });
};

// Privacy Settings
export const usePrivacySettings = () => {
  return useQuery<PrivacySettings>({
    queryKey: ['privacy-settings'],
    queryFn: async () => {
      const response = await dataPrivacyApi.getPrivacySettings();
      // Backend returns { success: true, settings: {...} }
      const data = response.data.data || response.data;
      return data?.settings || data;
    },
  });
};

export const useAcceptPrivacyPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dataPrivacyApi.acceptPrivacyPolicy(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] });
      showToast.success('Privacy policy accepted');
    },
    onError: (error) => {
      showToast.error('Failed to accept privacy policy', getErrorMessage(error));
    },
  });
};

export const useUpdateDataProcessingConsent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (consent: boolean) => dataPrivacyApi.updateDataProcessingConsent(consent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] });
      showToast.success('Data processing consent updated');
    },
    onError: (error) => {
      showToast.error('Failed to update consent', getErrorMessage(error));
    },
  });
};

export const useUpdateMarketingConsent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (consent: boolean) => dataPrivacyApi.updateMarketingConsent(consent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] });
      showToast.success('Marketing consent updated');
    },
    onError: (error) => {
      showToast.error('Failed to update consent', getErrorMessage(error));
    },
  });
};

