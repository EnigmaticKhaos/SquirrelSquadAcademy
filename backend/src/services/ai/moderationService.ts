import OpenAI from 'openai';
import { config } from '../../config/env';
import logger from '../../utils/logger';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export interface ModerationResult {
  isFlagged: boolean;
  categories: {
    harassment?: boolean;
    hate?: boolean;
    selfHarm?: boolean;
    sexual?: boolean;
    violence?: boolean;
    [key: string]: boolean | undefined;
  };
  severity: 'low' | 'medium' | 'high';
  reason?: string;
}

export const moderateContent = async (content: string): Promise<ModerationResult> => {
  try {
    // Use OpenAI moderation API
    const response = await openai.moderations.create({
      input: content,
    });

    const result = response.results[0];
    
    if (!result) {
      return {
        isFlagged: false,
        categories: {},
        severity: 'low',
      };
    }

    const isFlagged = result.flagged;
    const categories = result.categories;
    const categoryScores = result.category_scores;

    // Determine severity
    let severity: 'low' | 'medium' | 'high' = 'low';
    const maxScore = Math.max(...Object.values(categoryScores));
    if (maxScore > 0.8) severity = 'high';
    else if (maxScore > 0.5) severity = 'medium';

    // Check for harassment specifically
    const harassmentDetected = categories.harassment || categories['harassment/threatening'];

    return {
      isFlagged,
      categories: {
        harassment: categories.harassment || categories['harassment/threatening'],
        hate: categories.hate || categories['hate/threatening'],
        selfHarm: categories['self-harm'] || categories['self-harm/intent'] || categories['self-harm/instructions'],
        sexual: categories.sexual || categories['sexual/minors'],
        violence: categories.violence || categories['violence/graphic'],
      },
      severity,
      reason: isFlagged ? 'Content flagged by AI moderation' : undefined,
    };
  } catch (error) {
    logger.error('Error in content moderation:', error);
    // Return safe default - don't block content if moderation fails
    return {
      isFlagged: false,
      categories: {},
      severity: 'low',
    };
  }
};

export const checkForHarassment = async (content: string): Promise<boolean> => {
  const result = await moderateContent(content);
  return result.categories.harassment === true || result.severity === 'high';
};

