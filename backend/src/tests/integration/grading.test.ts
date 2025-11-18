import { gradeSubmission } from '../../services/ai/gradingService';
import Submission from '../../models/Submission';
import { createTestUser, createTestCourse, cleanDatabase } from '../helpers/testHelpers';
import Assignment from '../../models/Assignment';
import Rubric from '../../models/Rubric';
import Module from '../../models/Module';
import Lesson from '../../models/Lesson';

describe('AI Grading System', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Coding Assignment Grading', () => {
    it('should grade coding assignment with rubric', async () => {
      const user = await createTestUser();
      const course = await createTestCourse();
      const module = await Module.create({
        course: course._id,
        title: 'Test Module',
        description: 'Test module description',
        order: 1,
      });
      const lesson = await Lesson.create({
        module: module._id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order: 1,
      });

      // Create rubric for coding assignment
      const rubric = await Rubric.create({
        name: 'Coding Assignment Rubric',
        description: 'Rubric for evaluating coding assignments',
        rubricType: 'coding',
        criteria: [
          {
            name: 'Functionality',
            description: 'Code works correctly',
            points: 0,
            maxPoints: 50,
          },
          {
            name: 'Code Quality',
            description: 'Clean, readable code',
            points: 0,
            maxPoints: 30,
          },
          {
            name: 'Best Practices',
            description: 'Follows best practices',
            points: 0,
            maxPoints: 20,
          },
        ],
        totalPoints: 100,
      });

      const assignment = await Assignment.create({
        title: 'Test Coding Assignment',
        description: 'Test coding assignment description',
        assignmentType: 'coding',
        rubric: rubric._id,
        course: course._id,
        lesson: lesson._id,
        totalPoints: 100,
      });

      const submissionDoc = await Submission.create({
        assignment: assignment._id,
        user: user._id,
        course: course._id,
        content: JSON.stringify({
          code: 'function add(a, b) { return a + b; }',
          language: 'javascript',
        }),
        status: 'pending',
        maxScore: 100,
      });

      await gradeSubmission(submissionDoc._id.toString());

      const gradedSubmission = await Submission.findById(submissionDoc._id).populate('grade');
      expect(gradedSubmission?.grade).toBeDefined();
      if (gradedSubmission?.grade) {
        const grade = gradedSubmission.grade as any;
        expect(grade.score).toBeGreaterThanOrEqual(0);
        expect(grade.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Non-Coding Assignment Grading', () => {
    it('should grade written assignment with rubric', async () => {
      const user = await createTestUser();
      const course = await createTestCourse({ courseType: 'non-coding' });
      const module = await Module.create({
        course: course._id,
        title: 'Test Module',
        description: 'Test module description',
        order: 1,
      });
      const lesson = await Lesson.create({
        module: module._id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order: 1,
      });

      const rubric = await Rubric.create({
        name: 'Written Assignment Rubric',
        description: 'Rubric for evaluating written assignments',
        rubricType: 'non-coding',
        criteria: [
          {
            name: 'Content Quality',
            description: 'Quality of written content',
            points: 0,
            maxPoints: 50,
          },
          {
            name: 'Grammar',
            description: 'Grammar and spelling',
            points: 0,
            maxPoints: 30,
          },
          {
            name: 'Structure',
            description: 'Organization and structure',
            points: 0,
            maxPoints: 20,
          },
        ],
        totalPoints: 100,
      });

      const assignment = await Assignment.create({
        title: 'Test Written Assignment',
        description: 'Test written assignment description',
        assignmentType: 'written',
        rubric: rubric._id,
        course: course._id,
        lesson: lesson._id,
        totalPoints: 100,
      });

      const submissionDoc = await Submission.create({
        assignment: assignment._id,
        user: user._id,
        course: course._id,
        content: JSON.stringify({
          text: 'This is a well-written essay about the topic.',
        }),
        status: 'pending',
        maxScore: 100,
      });

      await gradeSubmission(submissionDoc._id.toString());

      const gradedSubmission = await Submission.findById(submissionDoc._id).populate('grade');
      expect(gradedSubmission?.grade).toBeDefined();
      if (gradedSubmission?.grade) {
        const grade = gradedSubmission.grade as any;
        expect(grade.score).toBeGreaterThanOrEqual(0);
        expect(grade.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Rubric Consistency', () => {
    it('should apply rubric consistently for same submission', async () => {
      const user = await createTestUser();
      const course = await createTestCourse();
      const module = await Module.create({
        course: course._id,
        title: 'Test Module',
        description: 'Test module description',
        order: 1,
      });
      const lesson = await Lesson.create({
        module: module._id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order: 1,
      });

      const rubric = await Rubric.create({
        name: 'Consistency Test Rubric',
        description: 'Rubric for testing grading consistency',
        rubricType: 'coding',
        criteria: [
          {
            name: 'Functionality',
            description: 'Code works correctly',
            points: 0,
            maxPoints: 100,
          },
        ],
        totalPoints: 100,
      });

      const assignment = await Assignment.create({
        title: 'Test Assignment',
        description: 'Test assignment description',
        assignmentType: 'coding',
        rubric: rubric._id,
        course: course._id,
        lesson: lesson._id,
        totalPoints: 100,
      });

      // Create multiple submissions with same content
      const submissionContent = JSON.stringify({
        code: 'function test() { return true; }',
        language: 'javascript',
      });
      const submissions = await Promise.all([
        Submission.create({
          assignment: assignment._id,
          user: user._id,
          course: course._id,
          content: submissionContent,
          status: 'pending',
          maxScore: 100,
        }),
        Submission.create({
          assignment: assignment._id,
          user: user._id,
          course: course._id,
          content: submissionContent,
          status: 'pending',
          maxScore: 100,
        }),
        Submission.create({
          assignment: assignment._id,
          user: user._id,
          course: course._id,
          content: submissionContent,
          status: 'pending',
          maxScore: 100,
        }),
      ]);

      // Grade multiple times
      await Promise.all(submissions.map((s) => gradeSubmission(s._id.toString())));

      // Get graded submissions
      const gradedSubmissions = await Submission.find({
        _id: { $in: submissions.map((s) => s._id) },
      }).populate('grade');

      // Scores should be similar (within 10 points due to AI variability)
      const scores = gradedSubmissions
        .map((s) => (s.grade as any)?.score)
        .filter((score: any) => score !== undefined) as number[];
      const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
      scores.forEach((score: number) => {
        expect(Math.abs(score - avgScore)).toBeLessThan(10);
      });
    });
  });
});

