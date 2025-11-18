import Course from '../models/Course';
import Module from '../models/Module';
import Lesson from '../models/Lesson';
import Assignment from '../models/Assignment';
import Rubric from '../models/Rubric';
import logger from '../utils/logger';

export interface ValidationReport {
  passed: boolean;
  contentIssues: string[];
  flowIssues: string[];
  brokenLinks: string[];
  missingPrerequisites: string[];
  warnings: string[];
}

export const validateCourse = async (courseId: string): Promise<ValidationReport> => {
  const report: ValidationReport = {
    passed: true,
    contentIssues: [],
    flowIssues: [],
    brokenLinks: [],
    missingPrerequisites: [],
    warnings: [],
  };

  try {
    const course = await Course.findById(courseId)
      .populate('modules')
      .populate('prerequisites');

    if (!course) {
      report.passed = false;
      report.contentIssues.push('Course not found');
      return report;
    }

    // Validate required fields
    if (!course.title || course.title.trim().length === 0) {
      report.passed = false;
      report.contentIssues.push('Course title is required');
    }

    if (!course.description || course.description.trim().length === 0) {
      report.passed = false;
      report.contentIssues.push('Course description is required');
    }

    if (!course.thumbnail) {
      report.warnings.push('Course thumbnail is missing (recommended)');
    }

    // Validate course structure
    if (!course.modules || course.modules.length === 0) {
      report.passed = false;
      report.contentIssues.push('Course must have at least one module');
    }

    // Validate modules and lessons
    const modules = course.modules as any[];
    for (const module of modules) {
      const moduleDoc = await Module.findById(module._id || module)
        .populate('lessons');
      
      if (!moduleDoc) {
        report.passed = false;
        report.contentIssues.push(`Module ${module._id || module} not found`);
        continue;
      }

      if (!moduleDoc.lessons || moduleDoc.lessons.length === 0) {
        report.passed = false;
        report.contentIssues.push(`Module "${moduleDoc.title}" has no lessons`);
      }

      // Validate lessons
      const lessons = moduleDoc.lessons as any[];
      for (const lesson of lessons) {
        const lessonDoc = await Lesson.findById(lesson._id || lesson);
        
        if (!lessonDoc) {
          report.passed = false;
          report.contentIssues.push(`Lesson ${lesson._id || lesson} not found`);
          continue;
        }

        if (!lessonDoc.title || lessonDoc.title.trim().length === 0) {
          report.passed = false;
          report.contentIssues.push(`Lesson in module "${moduleDoc.title}" has no title`);
        }

        if (!lessonDoc.content || lessonDoc.content.trim().length === 0) {
          report.passed = false;
          report.contentIssues.push(`Lesson "${lessonDoc.title}" has no content`);
        }

        // Validate video links if present
        if (lessonDoc.hasVideo && lessonDoc.videoUrl) {
          if (lessonDoc.videoSource === 'youtube') {
            // Validate YouTube URL format
            const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
            if (!youtubeRegex.test(lessonDoc.videoUrl)) {
              report.brokenLinks.push(`Invalid YouTube URL in lesson "${lessonDoc.title}"`);
            }
          }
        }

        // Validate assignments
        if (lessonDoc.assignments && lessonDoc.assignments.length > 0) {
          for (const assignmentId of lessonDoc.assignments) {
            const assignment = await Assignment.findById(assignmentId);
            if (!assignment) {
              report.passed = false;
              report.contentIssues.push(`Assignment ${assignmentId} in lesson "${lessonDoc.title}" not found`);
            } else {
              // Check if assignment has a rubric
              if (assignment.rubric) {
                const rubric = await Rubric.findById(assignment.rubric);
                if (!rubric) {
                  report.passed = false;
                  report.contentIssues.push(`Rubric for assignment "${assignment.title}" not found`);
                }
              } else {
                report.warnings.push(`Assignment "${assignment.title}" has no rubric`);
              }
            }
          }
        }
      }
    }

    // Validate prerequisites
    if (course.prerequisites && course.prerequisites.length > 0) {
      const prerequisites = course.prerequisites as any[];
      for (const prereqId of prerequisites) {
        const prereq = await Course.findById(prereqId._id || prereqId);
        if (!prereq) {
          report.passed = false;
          report.missingPrerequisites.push(`Prerequisite course ${prereqId._id || prereqId} not found`);
        } else if (prereq.status !== 'published') {
          report.warnings.push(`Prerequisite course "${prereq.title}" is not published`);
        }
      }
    }

    // Validate pricing
    if (!course.isFree && (!course.price || course.price <= 0)) {
      report.passed = false;
      report.contentIssues.push('Paid course must have a valid price');
    }

    return report;
  } catch (error) {
    logger.error('Error validating course:', error);
    report.passed = false;
    report.contentIssues.push('Error during validation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return report;
  }
};

