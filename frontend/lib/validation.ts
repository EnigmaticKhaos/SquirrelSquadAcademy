/**
 * Form validation utilities using Zod
 * Provides common validation schemas and helpers
 */

import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const urlSchema = z.string().url('Invalid URL').or(z.literal(''));

// Common form schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const courseReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  difficulty: z.number().min(1).max(5).optional(),
  content: z.string().min(10, 'Review must be at least 10 characters'),
});

export const postSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content is too long'),
  type: z.enum(['text', 'image', 'video']).optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment is required').max(1000, 'Comment is too long'),
});

export const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Helper function to get field errors from Zod
export const getFieldError = (error: any, fieldName: string): string | undefined => {
  if (!error) return undefined;
  
  const fieldError = error?.issues?.find((issue: any) => 
    issue.path?.includes(fieldName)
  );
  
  return fieldError?.message;
};

// Helper to format validation errors for display
export const formatValidationErrors = (error: any): Record<string, string> => {
  if (!error?.issues) return {};
  
  const errors: Record<string, string> = {};
  error.issues.forEach((issue: any) => {
    const field = issue.path?.[0];
    if (field) {
      errors[field] = issue.message;
    }
  });
  
  return errors;
};

