import OpenAI from 'openai';
import { config } from '../../config/env';
import Submission from '../../models/Submission';
import Assignment from '../../models/Assignment';
import Rubric from '../../models/Rubric';
import Grade from '../../models/Grade';
import { getAllCodeFiles } from '../githubService';
import logger from '../../utils/logger';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

interface GradingResult {
  score: number;
  maxScore: number;
  percentage: number;
  criteriaScores: Array<{
    criteriaName: string;
    points: number;
    maxPoints: number;
    feedback: string;
  }>;
  feedback: string;
}

export const gradeSubmission = async (submissionId: string): Promise<void> => {
  try {
    const submission = await Submission.findById(submissionId)
      .populate('assignment')
      .populate({
        path: 'assignment',
        populate: { path: 'rubric' },
      });

    if (!submission || !submission.assignment) {
      throw new Error('Submission or assignment not found');
    }

    const assignment = submission.assignment as any;
    const rubric = await Rubric.findById(assignment.rubric);

    if (!rubric) {
      throw new Error('Rubric not found');
    }

    // Update submission status
    submission.status = 'grading';
    await submission.save();

    // Fetch code from GitHub if submission has GitHub repo
    let githubCodeFiles: Array<{ path: string; content: string; language?: string }> = [];
    if (submission.githubRepoUrl) {
      try {
        // Parse repo URL to get owner and repo name
        const match = submission.githubRepoUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
        if (match) {
          const [, owner, repo] = match;
          githubCodeFiles = await getAllCodeFiles(
            submission.user.toString(),
            owner,
            repo,
            submission.githubCommitSha
          );
          logger.info(`Fetched ${githubCodeFiles.length} code files from GitHub for submission ${submissionId}`);
        }
      } catch (error) {
        logger.warn('Could not fetch code from GitHub, proceeding with submission content only:', error);
      }
    }

    // Build grading prompt based on assignment type
    const gradingPrompt = buildGradingPrompt(assignment, rubric, submission, githubCodeFiles);

    // Call OpenAI API for grading
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator and grader. Grade assignments based on the provided rubric and provide detailed feedback.',
        },
        {
          role: 'user',
          content: gradingPrompt,
        },
      ],
      temperature: 0.3,
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse AI response (assuming JSON format)
    const gradingResult: GradingResult = JSON.parse(aiResponse);

    // Create grade record
    const grade = await Grade.create({
      submission: submissionId,
      assignment: assignment._id,
      user: submission.user,
      course: submission.course,
      rubric: rubric._id,
      score: gradingResult.score,
      maxScore: gradingResult.maxScore,
      percentage: gradingResult.percentage,
      criteriaScores: gradingResult.criteriaScores,
      aiFeedback: gradingResult.feedback,
      aiGradingDetails: {
        model: 'gpt-4',
        prompt: gradingPrompt,
        response: aiResponse,
      },
    });

    // Update submission
    submission.status = 'graded';
    submission.grade = grade._id;
    submission.score = gradingResult.score;
    submission.feedback = gradingResult.feedback;
    submission.gradedAt = new Date();
    await submission.save();

    // Check achievements, badges, goals, and challenges for assignment submission
    const { checkAchievementsForTrigger } = await import('../achievementService');
    const { checkBadgesForTrigger } = await import('../badgeService');
    const { checkGoalsForTrigger } = await import('../learningGoalService');
    const { checkChallengesForTrigger } = await import('../challengeService');
    const triggerType = assignment.assignmentType === 'quiz' ? 'quiz_passed' : 'assignment_submitted';
    
    await checkAchievementsForTrigger({
      userId: submission.user.toString(),
      triggerType,
      triggerData: {
        submissionId: submissionId,
        assignmentId: assignment._id.toString(),
        courseId: submission.course.toString(),
        score: gradingResult.score,
        maxScore: gradingResult.maxScore,
        percentage: gradingResult.percentage,
      },
    });

    await checkBadgesForTrigger({
      userId: submission.user.toString(),
      triggerType,
      triggerData: {
        submissionId: submissionId,
        assignmentId: assignment._id.toString(),
        courseId: submission.course.toString(),
        score: gradingResult.score,
        maxScore: gradingResult.maxScore,
        percentage: gradingResult.percentage,
      },
    });

    await checkGoalsForTrigger(submission.user.toString(), triggerType);
    await checkChallengesForTrigger(submission.user.toString(), triggerType);

    // Send assignment graded notification
    import('../notificationService').then(({ createNotification }) => {
      createNotification(submission.user.toString(), 'assignment_graded', {
        title: 'Assignment Graded',
        message: `Your ${assignment.assignmentType === 'quiz' ? 'quiz' : 'assignment'} "${assignment.title}" has been graded. Score: ${gradingResult.score}/${gradingResult.maxScore} (${gradingResult.percentage}%)`,
        actionUrl: `/courses/${submission.course}/assignments/${assignment._id}/submission/${submissionId}`,
        relatedAssignment: assignment._id.toString(),
        relatedCourse: submission.course.toString(),
        sendEmail: true,
        metadata: {
          score: gradingResult.score,
          maxScore: gradingResult.maxScore,
          percentage: gradingResult.percentage,
          passed: gradingResult.percentage >= (assignment.passingScore || 70),
        },
      }).catch((error) => {
        logger.error('Error sending assignment graded notification:', error);
      });
    });

    // Update course enrollment progress
    import('../courseCompletionService').then(({ updateEnrollmentProgress }) => {
      updateEnrollmentProgress(submission.user.toString(), submission.course.toString()).catch((error) => {
        logger.error('Error updating enrollment progress:', error);
      });
    });

    // Check if this is a perfect score
    if (gradingResult.percentage === 100) {
      await checkAchievementsForTrigger({
        userId: submission.user.toString(),
        triggerType: 'assignment_submitted',
        triggerData: {
          submissionId: submissionId,
          assignmentId: assignment._id.toString(),
          courseId: submission.course.toString(),
          perfectScore: true,
        },
      });
      await checkBadgesForTrigger({
        userId: submission.user.toString(),
        triggerType: 'assignment_submitted',
        triggerData: {
          submissionId: submissionId,
          assignmentId: assignment._id.toString(),
          courseId: submission.course.toString(),
          perfectScore: true,
        },
      });
    }

    logger.info(`Submission ${submissionId} graded successfully`);
  } catch (error) {
    logger.error(`Error grading submission ${submissionId}:`, error);
    
    // Update submission status to failed
    await Submission.findByIdAndUpdate(submissionId, {
      status: 'failed',
    });
    
    throw error;
  }
};

const buildGradingPrompt = (
  assignment: any,
  rubric: any,
  submission: any,
  githubCodeFiles: Array<{ path: string; content: string; language?: string }> = []
): string => {
  let prompt = `Grade the following assignment submission based on the provided rubric.\n\n`;
  prompt += `Assignment: ${assignment.title}\n`;
  prompt += `Description: ${assignment.description}\n\n`;
  prompt += `Assignment Type: ${assignment.assignmentType}\n\n`;
  prompt += `Rubric Criteria:\n`;
  
  rubric.criteria.forEach((criterion: any, index: number) => {
    prompt += `${index + 1}. ${criterion.name} (${criterion.maxPoints} points)\n`;
    prompt += `   Description: ${criterion.description}\n`;
  });

  prompt += `\nSubmission Content:\n${submission.content}\n\n`;

  if (submission.files && submission.files.length > 0) {
    prompt += `Files: ${submission.files.map((f: any) => f.name).join(', ')}\n\n`;
  }

  // Include GitHub code files if available
  if (githubCodeFiles.length > 0) {
    prompt += `\n=== Code from GitHub Repository ===\n`;
    prompt += `Repository: ${submission.githubRepoUrl}\n`;
    if (submission.githubCommitSha) {
      prompt += `Commit SHA: ${submission.githubCommitSha}\n`;
    }
    prompt += `\nCode Files:\n`;
    githubCodeFiles.forEach((file) => {
      prompt += `\n--- File: ${file.path} (${file.language || 'unknown'}) ---\n`;
      prompt += `${file.content}\n`;
    });
    prompt += `\n=== End of GitHub Code ===\n\n`;
  } else if (submission.githubRepoUrl) {
    prompt += `GitHub Repository: ${submission.githubRepoUrl}\n`;
    if (submission.githubCommitSha) {
      prompt += `Commit SHA: ${submission.githubCommitSha}\n`;
    }
    prompt += `Note: Could not fetch code files from GitHub. Please review the repository manually.\n\n`;
  }

  prompt += `Please grade this submission and return a JSON object with the following structure:\n`;
  prompt += `{\n`;
  prompt += `  "score": <total points earned>,\n`;
  prompt += `  "maxScore": ${rubric.totalPoints},\n`;
  prompt += `  "percentage": <percentage score>,\n`;
  prompt += `  "criteriaScores": [\n`;
  prompt += `    {\n`;
  prompt += `      "criteriaName": "<criterion name>",\n`;
  prompt += `      "points": <points earned>,\n`;
  prompt += `      "maxPoints": <max points>,\n`;
  prompt += `      "feedback": "<detailed feedback>"\n`;
  prompt += `    }\n`;
  prompt += `  ],\n`;
  prompt += `  "feedback": "<overall feedback>"\n`;
  prompt += `}\n`;

  return prompt;
};

