import { api } from '../apiClient';
import type { ApiResponse, FlashcardDeck, Flashcard } from '@/types';

export const flashcardsApi = {
  getDecks: (params?: { archived?: boolean; courseId?: string }) => {
    const queryParams: any = {};
    if (params?.archived !== undefined) queryParams.archived = params.archived;
    if (params?.courseId) queryParams.courseId = params.courseId;
    
    return api.get<ApiResponse<{ decks: FlashcardDeck[] }>>('/flashcards/decks', { params: queryParams });
  },
  
  getDeck: (id: string) => api.get<ApiResponse<{ deck: FlashcardDeck }>>(`/flashcards/decks/${id}`),
  
  createDeck: (data: {
    title: string;
    description?: string;
    color?: string;
    icon?: string;
    tags?: string[];
    category?: string;
    courseId?: string;
    lessonId?: string;
    isPublic?: boolean;
    allowDuplicates?: boolean;
    newCardsPerDay?: number;
    reviewCardsPerDay?: number;
  }) => api.post<ApiResponse<{ deck: FlashcardDeck }>>('/flashcards/decks', data),
  
  updateDeck: (id: string, data: Partial<FlashcardDeck>) => 
    api.put<ApiResponse<{ deck: FlashcardDeck }>>(`/flashcards/decks/${id}`, data),
  
  deleteDeck: (id: string) => api.delete<ApiResponse<void>>(`/flashcards/decks/${id}`),
  
  archiveDeck: (id: string) => api.patch<ApiResponse<{ deck: FlashcardDeck }>>(`/flashcards/decks/${id}/archive`),
  
  getDeckCards: (deckId: string, params?: { archived?: boolean; active?: boolean }) => {
    const queryParams: any = {};
    if (params?.archived !== undefined) queryParams.archived = params.archived;
    if (params?.active !== undefined) queryParams.active = params.active;
    
    return api.get<ApiResponse<{ cards: Flashcard[] }>>(`/flashcards/decks/${deckId}/cards`, { params: queryParams });
  },
  
  createFlashcard: (deckId: string, data: {
    front: string;
    back: string;
    hint?: string;
    frontImage?: string;
    backImage?: string;
    frontAudio?: string;
    backAudio?: string;
    tags?: string[];
    courseId?: string;
    lessonId?: string;
  }) => api.post<ApiResponse<{ card: Flashcard }>>(`/flashcards/decks/${deckId}/cards`, data),
  
  getFlashcard: (id: string) => api.get<ApiResponse<{ card: Flashcard }>>(`/flashcards/cards/${id}`),
  
  updateFlashcard: (id: string, data: Partial<Flashcard>) => 
    api.put<ApiResponse<{ card: Flashcard }>>(`/flashcards/cards/${id}`, data),
  
  deleteFlashcard: (id: string) => api.delete<ApiResponse<void>>(`/flashcards/cards/${id}`),
  
  archiveFlashcard: (id: string) => api.patch<ApiResponse<{ card: Flashcard }>>(`/flashcards/cards/${id}/archive`),
  
  reviewFlashcard: (id: string, data: { result: 'correct' | 'incorrect' }) => 
    api.post<ApiResponse<{ card: Flashcard }>>(`/flashcards/cards/${id}/review`, data),
  
  getStudySession: (params?: { deckId?: string; newCardsLimit?: number; reviewCardsLimit?: number }) => {
    const queryParams: any = {};
    if (params?.deckId) queryParams.deckId = params.deckId;
    if (params?.newCardsLimit) queryParams.newCardsLimit = params.newCardsLimit;
    if (params?.reviewCardsLimit) queryParams.reviewCardsLimit = params.reviewCardsLimit;
    
    return api.get<ApiResponse<{ newCards: Flashcard[]; reviewCards: Flashcard[]; totalCards: number }>>('/flashcards/study', { params: queryParams });
  },
  
  getFlashcardReviews: (id: string, params?: { limit?: number }) => {
    const queryParams: any = {};
    if (params?.limit) queryParams.limit = params.limit;
    
    return api.get<ApiResponse<any[]>>(`/flashcards/cards/${id}/reviews`, { params: queryParams });
  },
};

