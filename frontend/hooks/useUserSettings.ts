import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';

export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      privacySettings?: any;
      notificationPreferences?: any;
      theme?: string;
      language?: string;
      accessibilityPreferences?: any;
    }) => usersApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

