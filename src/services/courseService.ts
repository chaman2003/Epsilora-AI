import axiosInstance from '../config/axios';

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Course Service - Handles all course API calls
 */
class CourseService {
  /**
   * Get all courses for authenticated user
   */
  async getCourses(): Promise<any> {
    const response = await axiosInstance.get('/api/courses');
    return response.data;
  }

  /**
   * Create a new course
   */
  async createCourse(courseData: any): Promise<any> {
    const response = await axiosInstance.post('/api/courses', courseData);
    return response.data;
  }

  /**
   * Delete a course
   */
  async deleteCourse(courseId: string): Promise<void> {
    await axiosInstance.delete(`/api/courses/${courseId}`);
  }

  /**
   * Extract course information from URL
   */
  async extractCourseInfo(courseUrl: string, hoursPerWeek: number = 10): Promise<any> {
    const response = await axiosInstance.post('/api/extract-course', {
      courseUrl,
      hoursPerWeek
    });
    return response.data;
  }
}

export default new CourseService();
