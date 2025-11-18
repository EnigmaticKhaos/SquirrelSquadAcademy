import User from '../models/User';
import mongoose from 'mongoose';

/**
 * Extract usernames from text using @mention pattern
 */
export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Convert usernames to user IDs
 */
export const resolveMentions = async (usernames: string[]): Promise<mongoose.Types.ObjectId[]> => {
  if (usernames.length === 0) {
    return [];
  }

  const users = await User.find({
    username: { $in: usernames },
  }).select('_id');

  return users.map((user) => user._id);
};

/**
 * Extract and resolve mentions from text
 */
export const extractAndResolveMentions = async (text: string): Promise<mongoose.Types.ObjectId[]> => {
  const usernames = extractMentions(text);
  return resolveMentions(usernames);
};

/**
 * Extract and resolve mentions with user details
 */
export const extractAndResolveMentionsWithDetails = async (text: string): Promise<Array<{ userId: string; username: string }>> => {
  const usernames = extractMentions(text);
  if (usernames.length === 0) {
    return [];
  }

  const users = await User.find({
    username: { $in: usernames },
  }).select('_id username');

  return users.map((user) => ({
    userId: user._id.toString(),
    username: user.username,
  }));
};

