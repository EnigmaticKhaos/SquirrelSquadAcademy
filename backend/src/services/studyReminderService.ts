import StudyReminder from '../models/StudyReminder';
import { createNotification } from './notificationService';
import { sendEmail } from './email/emailService';
import logger from '../utils/logger';

/**
 * Create a study reminder
 */
export const createStudyReminder = async (
  userId: string,
  data: {
    title: string;
    description?: string;
    reminderType: 'study' | 'flashcard_review' | 'assignment_deadline' | 'course_reminder' | 'custom';
    scheduledTime: Date;
    frequency?: 'once' | 'daily' | 'weekly' | 'custom';
    customDays?: number[];
    customTime?: string;
    timezone?: string;
    courseId?: string;
    lessonId?: string;
    assignmentId?: string;
    flashcardDeckId?: string;
    sendEmail?: boolean;
    sendPush?: boolean;
    sendInApp?: boolean;
  }
): Promise<any> => {
  try {
    // Calculate next send time
    let nextSend = data.scheduledTime;
    if (data.frequency === 'daily' && data.customTime) {
      const [hours, minutes] = data.customTime.split(':').map(Number);
      nextSend = new Date(data.scheduledTime);
      nextSend.setHours(hours, minutes, 0, 0);
      if (nextSend <= new Date()) {
        nextSend.setDate(nextSend.getDate() + 1);
      }
    } else if (data.frequency === 'weekly' && data.customDays && data.customTime) {
      const [hours, minutes] = data.customTime.split(':').map(Number);
      nextSend = new Date(data.scheduledTime);
      nextSend.setHours(hours, minutes, 0, 0);
      // Find next occurrence based on customDays
      const today = new Date().getDay();
      const nextDay = data.customDays.find(day => day > today) || data.customDays[0];
      const daysUntilNext = nextDay > today ? nextDay - today : 7 - today + nextDay;
      nextSend.setDate(nextSend.getDate() + daysUntilNext);
    }

    const reminder = await StudyReminder.create({
      user: userId,
      title: data.title,
      description: data.description,
      reminderType: data.reminderType,
      scheduledTime: data.scheduledTime,
      frequency: data.frequency || 'once',
      customDays: data.customDays,
      customTime: data.customTime,
      timezone: data.timezone,
      course: data.courseId,
      lesson: data.lessonId,
      assignment: data.assignmentId,
      flashcardDeck: data.flashcardDeckId,
      sendEmail: data.sendEmail !== undefined ? data.sendEmail : true,
      sendPush: data.sendPush || false,
      sendInApp: data.sendInApp !== undefined ? data.sendInApp : true,
      nextSend,
    });

    logger.info(`Study reminder created: ${reminder._id} for user ${userId}`);
    return reminder;
  } catch (error) {
    logger.error('Error creating study reminder:', error);
    throw error;
  }
};

/**
 * Update study reminder
 */
export const updateStudyReminder = async (
  reminderId: string,
  userId: string,
  data: Partial<{
    title: string;
    description: string;
    scheduledTime: Date;
    frequency: 'once' | 'daily' | 'weekly' | 'custom';
    customDays: number[];
    customTime: string;
    isActive: boolean;
    sendEmail: boolean;
    sendPush: boolean;
    sendInApp: boolean;
  }>
): Promise<any> => {
  try {
    const reminder = await StudyReminder.findOne({
      _id: reminderId,
      user: userId,
    });

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    Object.assign(reminder, data);

    // Recalculate nextSend if scheduling changed
    if (data.scheduledTime || data.frequency || data.customTime || data.customDays) {
      let nextSend = reminder.scheduledTime;
      if (reminder.frequency === 'daily' && reminder.customTime) {
        const [hours, minutes] = reminder.customTime.split(':').map(Number);
        nextSend = new Date(reminder.scheduledTime);
        nextSend.setHours(hours, minutes, 0, 0);
        if (nextSend <= new Date()) {
          nextSend.setDate(nextSend.getDate() + 1);
        }
      } else if (reminder.frequency === 'weekly' && reminder.customDays && reminder.customTime) {
        const [hours, minutes] = reminder.customTime.split(':').map(Number);
        nextSend = new Date(reminder.scheduledTime);
        nextSend.setHours(hours, minutes, 0, 0);
        const today = new Date().getDay();
        const nextDay = reminder.customDays.find(day => day > today) || reminder.customDays[0];
        const daysUntilNext = nextDay > today ? nextDay - today : 7 - today + nextDay;
        nextSend.setDate(nextSend.getDate() + daysUntilNext);
      }
      reminder.nextSend = nextSend;
    }

    await reminder.save();
    return reminder;
  } catch (error) {
    logger.error('Error updating study reminder:', error);
    throw error;
  }
};

/**
 * Delete study reminder
 */
export const deleteStudyReminder = async (
  reminderId: string,
  userId: string
): Promise<void> => {
  try {
    const reminder = await StudyReminder.findOne({
      _id: reminderId,
      user: userId,
    });

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    await StudyReminder.findByIdAndDelete(reminderId);
    logger.info(`Study reminder deleted: ${reminderId}`);
  } catch (error) {
    logger.error('Error deleting study reminder:', error);
    throw error;
  }
};

/**
 * Process and send due reminders
 */
export const processDueReminders = async (): Promise<void> => {
  try {
    const now = new Date();
    const dueReminders = await StudyReminder.find({
      isActive: true,
      isCompleted: false,
      nextSend: { $lte: now },
    }).populate('user', 'email username');

    for (const reminder of dueReminders) {
      try {
        const user = reminder.user as any;

        // Send in-app notification
        if (reminder.sendInApp) {
          await createNotification(user._id.toString(), 'study_reminder', {
            title: reminder.title,
            message: reminder.description || 'Time to study!',
            actionUrl: reminder.course
              ? `/courses/${reminder.course}`
              : reminder.flashcardDeck
              ? `/flashcards/decks/${reminder.flashcardDeck}`
              : '/study',
            relatedCourse: reminder.course?.toString(),
            sendEmail: false,
          });
        }

        // Send email notification
        if (reminder.sendEmail && user.email) {
          await sendEmail({
            to: user.email,
            subject: `Study Reminder: ${reminder.title}`,
            html: `
              <h2>${reminder.title}</h2>
              ${reminder.description ? `<p>${reminder.description}</p>` : ''}
              <p>Time to study!</p>
              ${reminder.course ? `<p><a href="${process.env.FRONTEND_URL}/courses/${reminder.course}">View Course</a></p>` : ''}
            `,
          });
        }

        // Update reminder
        reminder.lastSent = now;
        reminder.totalSent += 1;

        // Calculate next send time
        if (reminder.frequency === 'once') {
          reminder.isCompleted = true;
          reminder.completedAt = now;
        } else if (reminder.frequency === 'daily' && reminder.customTime) {
          const [hours, minutes] = reminder.customTime.split(':').map(Number);
          const nextSend = new Date();
          nextSend.setHours(hours, minutes, 0, 0);
          nextSend.setDate(nextSend.getDate() + 1);
          reminder.nextSend = nextSend;
        } else if (reminder.frequency === 'weekly' && reminder.customDays && reminder.customTime) {
          const [hours, minutes] = reminder.customTime.split(':').map(Number);
          const nextSend = new Date();
          nextSend.setHours(hours, minutes, 0, 0);
          const today = nextSend.getDay();
          const nextDay = reminder.customDays.find(day => day > today) || reminder.customDays[0];
          const daysUntilNext = nextDay > today ? nextDay - today : 7 - today + nextDay;
          nextSend.setDate(nextSend.getDate() + daysUntilNext);
          reminder.nextSend = nextSend;
        }

        await reminder.save();
      } catch (error) {
        logger.error(`Error processing reminder ${reminder._id}:`, error);
      }
    }

    logger.info(`Processed ${dueReminders.length} due reminders`);
  } catch (error) {
    logger.error('Error processing due reminders:', error);
  }
};

