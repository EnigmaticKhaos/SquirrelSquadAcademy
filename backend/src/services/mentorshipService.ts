import Mentorship, { IMentorship, MentorshipStatus } from '../models/Mentorship';
import { MentorshipRequest, IMentorshipRequest, MentorshipRequestStatus } from '../models/Mentorship';
import User from '../models/User';
import CourseCompletion from '../models/CourseCompletion';
import { createNotification } from './notificationService';
import logger from '../utils/logger';

/**
 * Find potential mentors for a mentee
 */
export const findPotentialMentors = async (
  menteeId: string,
  options?: {
    courseId?: string;
    limit?: number;
  }
): Promise<Array<{
  user: any;
  matchScore: number;
  completedCourses: number;
  experience: string;
}>> => {
  try {
    const mentee = await User.findById(menteeId);
    if (!mentee) {
      throw new Error('Mentee not found');
    }

    // Get mentee's completed courses
    const menteeCompletions = await CourseCompletion.find({ user: menteeId });
    const menteeCourseIds = menteeCompletions.map(c => c.course.toString());

    // Find users who are approved mentors and have completed more courses
    const approvedMentors = await User.find({
      'mentorStatus.isMentor': true,
      'mentorStatus.isAvailable': true,
      _id: { $ne: menteeId },
    }).select('_id');

    const mentorIds = approvedMentors.map(m => m._id);

    if (mentorIds.length === 0) {
      return [];
    }

    // Find users who have completed more courses (potential mentors)
    const allCompletions = await CourseCompletion.find({
      user: { $in: mentorIds },
    }).populate('user');

    // Group by user and count completions
    const userCompletions = new Map<string, Set<string>>();
    allCompletions.forEach(completion => {
      const userId = completion.user.toString();
      if (!userCompletions.has(userId)) {
        userCompletions.set(userId, new Set());
      }
      userCompletions.get(userId)!.add(completion.course.toString());
    });

    // Calculate match scores
    const mentors: Array<{
      userId: string;
      completedCourses: Set<string>;
      matchScore: number;
    }> = [];

    userCompletions.forEach((completedCourses, userId) => {
      // Calculate overlap (courses both have completed)
      const overlap = new Set([...menteeCourseIds].filter(c => completedCourses.has(c)));
      
      // Calculate match score (overlap + mentor's additional experience)
      const matchScore = overlap.size * 2 + (completedCourses.size - overlap.size);

      mentors.push({
        userId,
        completedCourses,
        matchScore,
      });
    });

    // Sort by match score and get top matches
    mentors.sort((a, b) => b.matchScore - a.matchScore);
    const topMentors = mentors.slice(0, options?.limit || 10);

    // Get user details
    const topMentorIds = topMentors.map(m => m.userId);
    const users = await User.find({ _id: { $in: topMentorIds } }).select('username profilePhoto bio level xp');

    // Check existing mentorships/requests
    const existingMentorships = await Mentorship.find({
      mentee: menteeId,
      status: { $in: ['pending', 'active'] },
    });
    const existingRequests = await MentorshipRequest.find({
      mentee: menteeId,
      status: 'pending',
    });

    const activeMentorIds = new Set([
      ...existingMentorships.map(m => m.mentor.toString()),
      ...existingRequests.map(r => r.mentor.toString()),
    ]);

    // Build result
    const result = topMentors
      .filter(m => !activeMentorIds.has(m.userId))
      .map(mentor => {
        const user = users.find(u => u._id.toString() === mentor.userId);
        if (!user) return null;

        const completedCount = mentor.completedCourses.size;
        let experience = 'Beginner';
        if (completedCount >= 20) experience = 'Expert';
        else if (completedCount >= 10) experience = 'Advanced';
        else if (completedCount >= 5) experience = 'Intermediate';

        return {
          user,
          matchScore: mentor.matchScore,
          completedCourses: completedCount,
          experience,
        };
      })
      .filter(Boolean) as any[];

    return result;
  } catch (error) {
    logger.error('Error finding potential mentors:', error);
    return [];
  }
};

/**
 * Send mentorship request
 */
export const sendMentorshipRequest = async (
  menteeId: string,
  mentorId: string,
  data: {
    message?: string;
    goals?: string[];
    preferredCommunicationMethod?: 'message' | 'video' | 'both';
    expectedDuration?: number;
  }
): Promise<IMentorshipRequest> => {
  try {
    // Check if request already exists
    const existingRequest = await MentorshipRequest.findOne({
      mentee: menteeId,
      mentor: mentorId,
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingRequest) {
      throw new Error('Mentorship request already exists');
    }

    // Check if already in an active mentorship
    const existingMentorship = await Mentorship.findOne({
      mentee: menteeId,
      mentor: mentorId,
      status: { $in: ['pending', 'active'] },
    });

    if (existingMentorship) {
      throw new Error('Active mentorship already exists');
    }

    // Create request
    const request = await MentorshipRequest.create({
      mentee: menteeId,
      mentor: mentorId,
      status: 'pending',
      message: data.message,
      goals: data.goals,
      preferredCommunicationMethod: data.preferredCommunicationMethod || 'message',
      expectedDuration: data.expectedDuration,
    });

    // Send notification to mentor
    const mentee = await User.findById(menteeId).select('username');
    await createNotification(mentorId, 'system_announcement', {
      title: 'New Mentorship Request',
      message: `${mentee?.username || 'Someone'} has requested you as a mentor`,
      actionUrl: `/mentorship/requests/${request._id}`,
      relatedUser: menteeId,
      sendEmail: true,
    });

    logger.info(`Mentorship request sent: ${request._id} from ${menteeId} to ${mentorId}`);
    return request;
  } catch (error) {
    logger.error('Error sending mentorship request:', error);
    throw error;
  }
};

/**
 * Respond to mentorship request
 */
export const respondToMentorshipRequest = async (
  requestId: string,
  mentorId: string,
  accept: boolean
): Promise<IMentorship | IMentorshipRequest> => {
  try {
    const request = await MentorshipRequest.findById(requestId);
    if (!request) {
      throw new Error('Mentorship request not found');
    }

    if (request.mentor.toString() !== mentorId) {
      throw new Error('Unauthorized to respond to this request');
    }

    if (request.status !== 'pending') {
      throw new Error('Request has already been responded to');
    }

    if (accept) {
      // Create mentorship
      const mentorship = await Mentorship.create({
        mentee: request.mentee,
        mentor: request.mentor,
        status: 'active',
        goals: request.goals || [],
        startDate: new Date(),
        expectedDuration: request.expectedDuration,
        preferredCommunicationMethod: request.preferredCommunicationMethod || 'message',
      });

      // Update request
      request.status = 'accepted';
      request.respondedAt = new Date();
      await request.save();

      // Send notification to mentee
      const mentor = await User.findById(mentorId).select('username');
      await createNotification(request.mentee.toString(), 'system_announcement', {
        title: 'Mentorship Request Accepted!',
        message: `${mentor?.username || 'Your mentor'} has accepted your mentorship request`,
        actionUrl: `/mentorship/${mentorship._id}`,
        relatedUser: mentorId,
        sendEmail: true,
      });

      logger.info(`Mentorship request accepted: ${requestId}, mentorship created: ${mentorship._id}`);
      return mentorship;
    } else {
      // Reject request
      request.status = 'rejected';
      request.respondedAt = new Date();
      await request.save();

      // Send notification to mentee
      const mentor = await User.findById(mentorId).select('username');
      await createNotification(request.mentee.toString(), 'system_announcement', {
        title: 'Mentorship Request Declined',
        message: `${mentor?.username || 'The mentor'} has declined your mentorship request`,
        actionUrl: `/mentorship/requests`,
        relatedUser: mentorId,
      });

      logger.info(`Mentorship request rejected: ${requestId}`);
      return request;
    }
  } catch (error) {
    logger.error('Error responding to mentorship request:', error);
    throw error;
  }
};

/**
 * Add mentorship session
 */
export const addMentorshipSession = async (
  mentorshipId: string,
  userId: string,
  session: {
    date: Date;
    duration?: number;
    notes?: string;
    goalsDiscussed?: string[];
    nextSteps?: string[];
    rating?: number;
    feedback?: string;
  }
): Promise<IMentorship> => {
  try {
    const mentorship = await Mentorship.findById(mentorshipId);
    if (!mentorship) {
      throw new Error('Mentorship not found');
    }

    // Check if user is part of this mentorship
    if (mentorship.mentee.toString() !== userId && mentorship.mentor.toString() !== userId) {
      throw new Error('Unauthorized to add sessions');
    }

    mentorship.sessions.push({
      date: session.date,
      duration: session.duration,
      notes: session.notes,
      goalsDiscussed: session.goalsDiscussed,
      nextSteps: session.nextSteps,
      rating: session.rating,
      feedback: session.feedback,
    });

    await mentorship.save();

    // Award XP for session (both parties)
    const { awardXP } = await import('./xpService');
    await awardXP({
      userId,
      amount: 50,
      source: 'mentorship_session',
      sourceId: mentorshipId,
      description: 'Mentorship session completed',
    }).catch((error) => {
      logger.error('Error awarding XP for session:', error);
    });

    // Notify the other party
    const otherUserId = mentorship.mentee.toString() === userId
      ? mentorship.mentor.toString()
      : mentorship.mentee.toString();
    
    const user = await User.findById(userId).select('username');
    await createNotification(otherUserId, 'system_announcement', {
      title: 'New Mentorship Session Added',
      message: `${user?.username || 'Your partner'} has added a new mentorship session`,
      actionUrl: `/mentorship/${mentorshipId}`,
      relatedUser: userId,
    });

    logger.info(`Session added to mentorship ${mentorshipId}`);
    return mentorship;
  } catch (error) {
    logger.error('Error adding mentorship session:', error);
    throw error;
  }
};

/**
 * Add milestone
 */
export const addMilestone = async (
  mentorshipId: string,
  userId: string,
  milestone: {
    title: string;
    description?: string;
    targetDate?: Date;
  }
): Promise<IMentorship> => {
  try {
    const mentorship = await Mentorship.findById(mentorshipId);
    if (!mentorship) {
      throw new Error('Mentorship not found');
    }

    // Check if user is part of this mentorship
    if (mentorship.mentee.toString() !== userId && mentorship.mentor.toString() !== userId) {
      throw new Error('Unauthorized to add milestones');
    }

    mentorship.milestones.push({
      title: milestone.title,
      description: milestone.description,
      targetDate: milestone.targetDate,
      completed: false,
    });

    await mentorship.save();

    logger.info(`Milestone added to mentorship ${mentorshipId}`);
    return mentorship;
  } catch (error) {
    logger.error('Error adding milestone:', error);
    throw error;
  }
};

/**
 * Complete milestone
 */
export const completeMilestone = async (
  mentorshipId: string,
  milestoneId: string,
  userId: string,
  notes?: string
): Promise<IMentorship> => {
  try {
    const mentorship = await Mentorship.findById(mentorshipId);
    if (!mentorship) {
      throw new Error('Mentorship not found');
    }

    // Check if user is part of this mentorship
    if (mentorship.mentee.toString() !== userId && mentorship.mentor.toString() !== userId) {
      throw new Error('Unauthorized to complete milestones');
    }

    const milestone = (mentorship.milestones as any).id(milestoneId);
    if (!milestone) {
      throw new Error('Milestone not found');
    }

    milestone.completed = true;
    milestone.completedAt = new Date();
    if (notes) {
      milestone.notes = notes;
    }

    await mentorship.save();

    // Award XP for milestone completion
    const { awardXP } = await import('./xpService');
    await awardXP({
      userId,
      amount: 100,
      source: 'mentorship_milestone',
      sourceId: milestoneId,
      description: 'Mentorship milestone completed',
    }).catch((error) => {
      logger.error('Error awarding XP for milestone:', error);
    });

    logger.info(`Milestone ${milestoneId} completed in mentorship ${mentorshipId}`);
    return mentorship;
  } catch (error) {
    logger.error('Error completing milestone:', error);
    throw error;
  }
};

/**
 * Complete mentorship
 */
export const completeMentorship = async (
  mentorshipId: string,
  userId: string,
  data: {
    rating?: number;
    feedback?: string;
  }
): Promise<IMentorship> => {
  try {
    const mentorship = await Mentorship.findById(mentorshipId);
    if (!mentorship) {
      throw new Error('Mentorship not found');
    }

    // Check if user is part of this mentorship
    if (mentorship.mentee.toString() !== userId && mentorship.mentor.toString() !== userId) {
      throw new Error('Unauthorized to complete mentorship');
    }

    // Update rating and feedback
    if (mentorship.mentee.toString() === userId) {
      mentorship.menteeRating = data.rating;
      mentorship.menteeFeedback = data.feedback;
    } else {
      mentorship.mentorRating = data.rating;
      mentorship.mentorFeedback = data.feedback;
    }

    // Complete if both parties have rated
    if (mentorship.menteeRating && mentorship.mentorRating) {
      mentorship.status = 'completed';
      mentorship.completedAt = new Date();
      mentorship.endDate = new Date();

      // Award XP for completing mentorship
      const { awardXP } = await import('./xpService');
      
      // Award to mentee
      await awardXP({
        userId: mentorship.mentee.toString(),
        amount: 200,
        source: 'mentorship_completed',
        sourceId: mentorshipId,
        description: 'Mentorship completed',
      }).catch((error) => {
        logger.error('Error awarding XP to mentee:', error);
      });

      // Award to mentor (bonus for being a mentor)
      await awardXP({
        userId: mentorship.mentor.toString(),
        amount: 300,
        source: 'mentorship_completed_mentor',
        sourceId: mentorshipId,
        description: 'Mentorship completed as mentor',
      }).catch((error) => {
        logger.error('Error awarding XP to mentor:', error);
      });

      // Update mentor stats
      import('./mentorApplicationService').then(({ updateMentorStats }) => {
        updateMentorStats(mentorship.mentor.toString()).catch((error) => {
          logger.error('Error updating mentor stats:', error);
        });
      });
    }

    await mentorship.save();

    logger.info(`Mentorship ${mentorshipId} completed by user ${userId}`);
    return mentorship;
  } catch (error) {
    logger.error('Error completing mentorship:', error);
    throw error;
  }
};

/**
 * Get user mentorships
 */
export const getUserMentorships = async (
  userId: string,
  options?: {
    role?: 'mentee' | 'mentor';
    status?: MentorshipStatus;
    limit?: number;
    offset?: number;
  }
): Promise<{ mentorships: any[]; total: number }> => {
  try {
    const query: any = {};

    if (options?.role === 'mentee') {
      query.mentee = userId;
    } else if (options?.role === 'mentor') {
      query.mentor = userId;
    } else {
      query.$or = [
        { mentee: userId },
        { mentor: userId },
      ];
    }

    if (options?.status) {
      query.status = options.status;
    }

    const total = await Mentorship.countDocuments(query);

    const mentorships = await Mentorship.find(query)
      .populate('mentee', 'username profilePhoto level xp')
      .populate('mentor', 'username profilePhoto level xp')
      .sort({ updatedAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { mentorships, total };
  } catch (error) {
    logger.error('Error getting user mentorships:', error);
    return { mentorships: [], total: 0 };
  }
};

/**
 * Get mentorship requests
 */
export const getMentorshipRequests = async (
  userId: string,
  options?: {
    type?: 'sent' | 'received';
    status?: MentorshipRequestStatus;
    limit?: number;
    offset?: number;
  }
): Promise<{ requests: any[]; total: number }> => {
  try {
    const query: any = {};

    if (options?.type === 'sent') {
      query.mentee = userId;
    } else if (options?.type === 'received') {
      query.mentor = userId;
    } else {
      query.$or = [
        { mentee: userId },
        { mentor: userId },
      ];
    }

    if (options?.status) {
      query.status = options.status;
    }

    const total = await MentorshipRequest.countDocuments(query);

    const requests = await MentorshipRequest.find(query)
      .populate('mentee', 'username profilePhoto level xp')
      .populate('mentor', 'username profilePhoto level xp')
      .sort({ createdAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { requests, total };
  } catch (error) {
    logger.error('Error getting mentorship requests:', error);
    return { requests: [], total: 0 };
  }
};

