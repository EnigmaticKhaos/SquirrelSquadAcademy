import { create } from 'zustand';
import type { Course } from '@/types';

interface CourseStore {
  enrolledCourses: Course[];
  setEnrolledCourses: (courses: Course[]) => void;
  addEnrolledCourse: (course: Course) => void;
  removeEnrolledCourse: (courseId: string) => void;
  isEnrolled: (courseId: string) => boolean;
}

export const useCourseStore = create<CourseStore>((set, get) => ({
  enrolledCourses: [],
  setEnrolledCourses: (courses) => set({ enrolledCourses: courses }),
  addEnrolledCourse: (course) =>
    set((state) => ({
      enrolledCourses: [...state.enrolledCourses, course],
    })),
  removeEnrolledCourse: (courseId) =>
    set((state) => ({
      enrolledCourses: state.enrolledCourses.filter((c) => c._id !== courseId),
    })),
  isEnrolled: (courseId) =>
    get().enrolledCourses.some((c) => c._id === courseId),
}));

