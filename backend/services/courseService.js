import Course from '../models/Course.js';
import { generateContent } from '../utils/gemini.js';
import config from '../config/config.js';

/**
 * Course Service - Handles course business logic
 */
class CourseService {
  /**
   * Get all courses for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of courses
   */
  async getCourses(userId) {
    return await Course.find({ userId });
  }

  /**
   * Create a new course
   * @param {Object} courseData - Course data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created course
   */
  async createCourse(courseData, userId) {
    const course = new Course({
      ...courseData,
      userId
    });
    return await course.save();
  }

  /**
   * Delete a course
   * @param {string} courseId - Course ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deleted course
   */
  async deleteCourse(courseId, userId) {
    return await Course.findOneAndDelete({ _id: courseId, userId });
  }

  /**
   * Extract course information from URL using AI
   * @param {string} courseUrl - Course URL
   * @param {number} hoursPerWeek - Hours per week
   * @returns {Promise<Object>} Extracted course data
   */
  async extractCourseInfo(courseUrl, hoursPerWeek = 10) {
    if (!courseUrl) {
      throw new Error('Course URL is required');
    }

    if (!config.geminiApiKey) {
      throw new Error('API key is not configured');
    }

    const today = new Date();
    const prompt = `You are a helpful course information extraction tool. I need you to generate structured information about the following course URL: "${courseUrl}".

Your task is to output ONLY a valid JSON object with the following structure:
{
  "name": "Course Name",
  "provider": "Provider Name",
  "duration": "Duration in weeks",
  "pace": "${hoursPerWeek} hours per week",
  "objectives": ["Objective 1", "Objective 2", "Objective 3"],
  "milestones": [
    {"name": "Milestone 1"},
    {"name": "Milestone 2"}
  ],
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "mainSkills": ["Skill 1", "Skill 2", "Skill 3"]
}

IMPORTANT RULES:
1. Output ONLY the JSON object. No markdown formatting (no \`\`\`json blocks), no explanations.
2. Every property must be included and must not be null or undefined.
3. "name", "provider", "duration", and "pace" must be strings.
4. "objectives", "prerequisites", "mainSkills" must be arrays of strings.
5. "milestones" must be an array of objects, each with a "name" property.
6. Do not include deadline properties in milestones - those will be added later.
7. Provide at least 3 items in objectives, milestones, and mainSkills arrays.
8. Keep fields exactly as named in the example - don't rename any properties.`;

    console.log('Extracting course info using model:', config.geminiModel);

    const responseText = await generateContent(prompt, config.geminiModel);
    
    // Clean and parse JSON
    let cleanText = responseText;
    
    // Remove markdown code blocks
    cleanText = cleanText.replace(/```json|```/g, '');
    
    // Trim whitespace
    cleanText = cleanText.trim();
    
    // Try to parse JSON
    let courseInfo;
    try {
      courseInfo = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text was:', cleanText);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate required fields
    const requiredFields = ['name', 'provider', 'duration', 'pace', 'objectives', 'milestones', 'prerequisites', 'mainSkills'];
    const missingFields = requiredFields.filter(field => !courseInfo[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`AI response missing required fields: ${missingFields.join(', ')}`);
    }

    // Add deadlines to milestones
    if (courseInfo.milestones && Array.isArray(courseInfo.milestones)) {
      const durationMatch = courseInfo.duration?.match(/(\d+)/);
      const durationWeeks = durationMatch ? parseInt(durationMatch[1]) : 12;
      const weeksPerMilestone = Math.ceil(durationWeeks / courseInfo.milestones.length);

      courseInfo.milestones = courseInfo.milestones.map((milestone, index) => {
        const deadline = new Date(today);
        deadline.setDate(deadline.getDate() + (weeksPerMilestone * (index + 1) * 7));
        
        return {
          ...milestone,
          deadline: deadline.toISOString().split('T')[0]
        };
      });
    }

    return courseInfo;
  }
}

export default new CourseService();
