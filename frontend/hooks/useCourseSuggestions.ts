import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseSuggestionsApi, type CourseSuggestion, type SuggestionStatus, type CreateSuggestionData } from '@/lib/api/courseSuggestions';
import { useAuth } from '@/hooks/useAuth';
import { showToast, getErrorMessage } from '@/lib/toast';

export const useCourseSuggestions = (params?: { status?: SuggestionStatus; sort?: 'voteCount' | 'createdAt' }) => {
  const { user } = useAuth();
  
  return useQuery<CourseSuggestion[]>({
    queryKey: ['course-suggestions', params],
    queryFn: async () => {
      const response = await courseSuggestionsApi.getSuggestions(params);
      // Backend returns { success: true, count, suggestions: [...] }
      const data = response.data.data || response.data;
      const suggestions = data?.suggestions || [];
      
      // Check if current user has voted on each suggestion
      if (user?._id) {
        return suggestions.map((suggestion: CourseSuggestion) => ({
          ...suggestion,
          hasVoted: suggestion.votes?.some((vote: any) => {
            const voteUserId = typeof vote.user === 'string' ? vote.user : vote.user?._id;
            return voteUserId === user._id;
          }),
        }));
      }
      
      return suggestions;
    },
    placeholderData: [],
  });
};

export const useCreateCourseSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSuggestionData) => courseSuggestionsApi.createSuggestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-suggestions'] });
      showToast.success('Course suggestion submitted', 'Thank you for your suggestion! It will be reviewed by our team.');
    },
    onError: (error) => {
      showToast.error('Failed to submit suggestion', getErrorMessage(error));
    },
  });
};

export const useVoteOnSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => courseSuggestionsApi.voteOnSuggestion(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['course-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['course-suggestion', id] });
      const message = (data as any)?.data?.message || (data as any)?.message;
      if (message?.includes('removed')) {
        showToast.success('Vote removed');
      } else {
        showToast.success('Vote added', 'Thank you for your vote!');
      }
    },
    onError: (error) => {
      showToast.error('Failed to vote', getErrorMessage(error));
    },
  });
};

export const useApproveSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => courseSuggestionsApi.approveSuggestion(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['course-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['course-suggestion', id] });
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const course = responseData?.course;
      
      if (course?._id) {
        showToast.success('Course generated', `Course "${course.title}" has been created from this suggestion.`);
      } else {
        showToast.success('Suggestion approved', 'The course is being generated.');
      }
    },
    onError: (error) => {
      showToast.error('Failed to approve suggestion', getErrorMessage(error));
    },
  });
};

export const useDenySuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reviewNotes }: { id: string; reviewNotes?: string }) =>
      courseSuggestionsApi.denySuggestion(id, reviewNotes),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['course-suggestion', variables.id] });
      showToast.success('Suggestion denied');
    },
    onError: (error) => {
      showToast.error('Failed to deny suggestion', getErrorMessage(error));
    },
  });
};

