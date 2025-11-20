import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashcardsApi } from '@/lib/api';
import type { FlashcardDeck, Flashcard } from '@/types';

export const useFlashcardDecks = (params?: { archived?: boolean; courseId?: string }) => {
  return useQuery<FlashcardDeck[]>({
    queryKey: ['flashcard-decks', params],
    queryFn: async (): Promise<FlashcardDeck[]> => {
      const response = await flashcardsApi.getDecks(params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data.decks || [];
      }
      return (apiResponse as any).decks || [];
    },
    placeholderData: [],
  });
};

export const useFlashcardDeck = (id: string) => {
  return useQuery<FlashcardDeck | null>({
    queryKey: ['flashcard-deck', id],
    queryFn: async (): Promise<FlashcardDeck | null> => {
      try {
        const response = await flashcardsApi.getDeck(id);
        const apiResponse = response.data;
        if (apiResponse.data) {
          return apiResponse.data.deck || null;
        }
        return (apiResponse as any).deck || null;
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

export const useDeckCards = (deckId: string, params?: { archived?: boolean; active?: boolean }) => {
  return useQuery<Flashcard[]>({
    queryKey: ['deck-cards', deckId, params],
    queryFn: async (): Promise<Flashcard[]> => {
      const response = await flashcardsApi.getDeckCards(deckId, params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data.cards || [];
      }
      return (apiResponse as any).cards || [];
    },
    enabled: !!deckId,
    placeholderData: [],
  });
};

export const useStudySession = (params?: { deckId?: string; newCardsLimit?: number; reviewCardsLimit?: number }) => {
  return useQuery<{ newCards: Flashcard[]; reviewCards: Flashcard[]; totalCards: number }>({
    queryKey: ['study-session', params],
    queryFn: async () => {
      const response = await flashcardsApi.getStudySession(params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      return {
        newCards: (apiResponse as any).newCards || [],
        reviewCards: (apiResponse as any).reviewCards || [],
        totalCards: (apiResponse as any).totalCards || 0,
      };
    },
    placeholderData: { newCards: [], reviewCards: [], totalCards: 0 },
  });
};

export const useCreateDeck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof flashcardsApi.createDeck>[0]) => flashcardsApi.createDeck(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
    },
  });
};

export const useUpdateDeck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof flashcardsApi.updateDeck>[1] }) => 
      flashcardsApi.updateDeck(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-deck', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
    },
  });
};

export const useDeleteDeck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => flashcardsApi.deleteDeck(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
    },
  });
};

export const useCreateFlashcard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ deckId, data }: { deckId: string; data: Parameters<typeof flashcardsApi.createFlashcard>[1] }) => 
      flashcardsApi.createFlashcard(deckId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deck-cards', variables.deckId] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-deck', variables.deckId] });
      queryClient.invalidateQueries({ queryKey: ['study-session'] });
    },
  });
};

export const useDeleteFlashcard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => flashcardsApi.deleteFlashcard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck-cards'] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-deck'] });
      queryClient.invalidateQueries({ queryKey: ['study-session'] });
    },
  });
};

export const useReviewFlashcard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, result }: { id: string; result: 'correct' | 'incorrect' }) => 
      flashcardsApi.reviewFlashcard(id, { result }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flashcard', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['study-session'] });
      queryClient.invalidateQueries({ queryKey: ['deck-cards'] });
    },
  });
};

