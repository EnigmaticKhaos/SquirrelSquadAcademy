import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '@/lib/api';
import type { Note } from '@/types';

interface NotesResponse {
  notes: Note[];
  total: number;
}

export const useNotes = (params?: {
  tags?: string[];
  isHighlight?: boolean;
  isPinned?: boolean;
  courseId?: string;
  limit?: number;
  offset?: number;
  search?: string;
}) => {
  return useQuery<NotesResponse>({
    queryKey: ['notes', params],
    queryFn: async (): Promise<NotesResponse> => {
      const response = await notesApi.getNotes(params);
      // Backend returns { success: true, count, total, notes }
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      return {
        notes: (apiResponse as any).notes || [],
        total: (apiResponse as any).total || 0,
      };
    },
    placeholderData: { notes: [], total: 0 },
  });
};

export const useNote = (id: string) => {
  return useQuery<Note | null>({
    queryKey: ['note', id],
    queryFn: async (): Promise<Note | null> => {
      try {
        const response = await notesApi.getNote(id);
        const apiResponse = response.data;
        if (apiResponse.data) {
          return apiResponse.data;
        }
        return (apiResponse as any).note || null;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!id,
    placeholderData: null,
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof notesApi.createNote>[0]) => notesApi.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof notesApi.updateNote>[1] }) => 
      notesApi.updateNote(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['note', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notesApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

export const useTogglePinNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notesApi.togglePin(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['note', id] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

export const useNoteTags = () => {
  return useQuery<string[]>({
    queryKey: ['note-tags'],
    queryFn: async (): Promise<string[]> => {
      const response = await notesApi.getTags();
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      return (apiResponse as any).tags || [];
    },
    placeholderData: [],
  });
};

