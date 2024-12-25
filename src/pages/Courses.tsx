import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Book, Target, ChevronRight, Plus, Trash2, Edit2 } from 'lucide-react';
import axiosInstance from '../config/axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

interface CourseInfo {
  name: string;
  provider: string;
  duration: string;
  pace: string;
  objectives: string[];
  deadline: string;
  milestones: { name: string; deadline: string; }[];
  prerequisites: string[];
  mainSkills: string[];
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: keyof CourseInfo | null;
  value: any;
  onSave: (newValue: any) => void;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, field, value, onSave }) => {
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
    onClose();
  };

  if (!isOpen || !field) return null;

  const isArray = Array.isArray(value);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Edit {field.charAt(0).toUpperCase() + field.slice(1)}
        </h3>
        
        {isArray ? (
          <div className="space-y-2">
            {editValue.map((item: string, index: number) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newValue = [...editValue];
                    newValue[index] = e.target.value;
                    setEditValue(newValue);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={() => {
                    const newValue = editValue.filter((_: any, i: number) => i !== index);
                    setEditValue(newValue);
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setEditValue([...editValue, ''])}
              className="w-full px-3 py-2 text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              + Add Item
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-white"
          />
        )}
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const Courses: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [courseUrl, setCourseUrl] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [savedCourses, setSavedCourses] = useState<(CourseInfo & { _id: string })[]>([]);
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
  const { user } = useAuth();

  const [expandedCourses, setExpandedCourses] = useState<{ [key: string]: boolean }>({});
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [updatedCourse, setUpdatedCourse] = useState<CourseInfo & { _id: string } | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalField, setEditModalField] = useState<keyof CourseInfo | null>(null);
  const [editModalValue, setEditModalValue] = useState<any>(null);

  useEffect(() => {
    console.log('Courses component mounted, auth status:', isAuthenticated);
    if (isAuthenticated) {
      fetchSavedCourses();
    }
  }, [isAuthenticated]);

  const fetchSavedCourses = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to view your courses');
      return;
    }

    try {
      console.log('Fetching saved courses...');
      const response = await axiosInstance.get('/api/courses');
      console.log('Raw saved courses response:', response);
      
      if (!response.data) {
        console.error('No data in response');
        setSavedCourses([]);
        return;
      }

      if (Array.isArray(response.data)) {
        console.log('Saved courses array:', response.data);
        setSavedCourses(response.data);
      } else {
        console.error('Saved courses response is not an array:', response.data);
        setSavedCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch saved courses');
      setSavedCourses([]);
    }
  };

  const cleanAndParseJSON = (text: string) => {
    console.log('Raw text from API:', text);
    
    try {
      // First try direct parsing
      const directParse = JSON.parse(text);
      console.log('Direct parse successful:', directParse);
      if (validateCourseInfo(directParse)) {
        return directParse;
      }
      throw new Error('Invalid course info structure');
    } catch (e1) {
      console.log('Direct parse failed:', e1);
      try {
        // Clean the text
        let cleanText = text;
        
        // Debug log before cleaning
        console.log('Text before cleaning:', cleanText);
        
        // Check if text contains any curly braces
        if (!cleanText.includes('{') || !cleanText.includes('}')) {
          console.error('No JSON object found in response');
          throw new Error('Invalid API response format: No JSON object found');
        }
        
        // Remove any text before the first {
        cleanText = cleanText.substring(cleanText.indexOf('{'));
        console.log('After removing text before {:', cleanText);
        
        // Remove any text after the last }
        cleanText = cleanText.substring(0, cleanText.lastIndexOf('}') + 1);
        console.log('After removing text after }:', cleanText);
        
        // Remove markdown code blocks
        cleanText = cleanText.replace(/```json|```/g, '');
        
        // Remove line breaks and extra spaces within the JSON
        cleanText = cleanText.replace(/\\n/g, ' ')
                          .replace(/\\s+/g, ' ')
                          .trim();
        
        console.log('Final cleaned text:', cleanText);
        
        // Try parsing the cleaned text
        const parsed = JSON.parse(cleanText);
        console.log('Parsed cleaned text:', parsed);
        
        if (!validateCourseInfo(parsed)) {
          throw new Error('Missing required fields in course info');
        }
        
        return parsed;
      } catch (e2) {
        console.error('Failed to parse JSON after cleaning:', e2);
        if (e2.message.includes('Invalid API response format')) {
          throw new Error('The AI response did not contain a valid JSON object. Please try again.');
        }
        if (e2.message.includes('Missing required fields')) {
          throw new Error('The AI response is missing required course information. Please try again.');
        }
        throw new Error('Failed to parse course information. Please check the format and try again.');
      }
    }
  };

  const validateCourseInfo = (data: any): boolean => {
    const requiredFields = [
      'name',
      'provider',
      'duration',
      'pace',
      'objectives',
      'deadline',
      'milestones',
      'prerequisites',
      'mainSkills'
    ];
    
    const missingFields = requiredFields.filter(field => {
      if (field === 'objectives' || field === 'prerequisites' || field === 'mainSkills') {
        return !Array.isArray(data[field]);
      }
      if (field === 'milestones') {
        return !Array.isArray(data[field]) || !data[field].every((milestone: any) => 
          milestone.name && milestone.deadline
        );
      }
      return !data[field];
    });
    
    if (missingFields.length > 0) {
      console.error('Missing or invalid fields:', missingFields);
      return false;
    }
    
    return true;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const extractCourseInfo = async (e: React.MouseEvent) => {
    e.preventDefault(); // Keep this to prevent scrolling
    if (!API_KEY) {
      toast.error('API key is not configured. Please check your environment variables.');
      return;
    }

    if (!courseUrl) {
      toast.error('Please enter a course URL');
      return;
    }

    if (hoursPerWeek < 1 || hoursPerWeek > 168) {
      toast.error('Please enter a valid number of hours per week (1-168)');
      return;
    }

    setIsLoading(true);
    try {
      const today = new Date();
      const prompt = `
        Analyze this course URL: ${courseUrl} comprehensively.
        Starting from today (${formatDate(today)}), analyze and extract the following information:

        1. Course Essentials:
           - Complete course name and subtitle
           - Provider/Institution details
           - Duration and intensity
           - Study pace

        2. Based on the course content and objectives:
           - ANALYZE and LIST the top 3-5 prerequisites that a student should have before starting this course
           - IDENTIFY and LIST the top 3-5 main skills that students will gain from this course

        3. Course Structure:
           - Extract or create detailed learning objectives
           - Break down the course into weekly milestones

        Based on studying ${hoursPerWeek} hours per week, create a realistic schedule.

        Return ONLY a JSON object with the following structure:
        {
          "name": "Full course name",
          "provider": "Provider name",
          "duration": "X weeks",
          "pace": "X hours/week",
          "prerequisites": [
            "Based on course content, list 3-5 essential prerequisites",
            "Example: Basic understanding of programming",
            "Example: Familiarity with web development"
          ],
          "mainSkills": [
            "Based on course content, list 3-5 key skills to be gained",
            "Example: Advanced React development",
            "Example: REST API integration"
          ],
          "objectives": [
            "Detailed learning objective 1",
            "Detailed learning objective 2"
          ],
          "deadline": "YYYY-MM-DD",
          "milestones": [
            {
              "name": "Week X: Topic",
              "deadline": "YYYY-MM-DD"
            }
          ]
        }

        Analyze the course content deeply and provide accurate, realistic prerequisites and skills that would be needed and gained from this course. Be specific and practical in your analysis.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw API Response:', data);
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid API response structure');
      }

      const parsedInfo = cleanAndParseJSON(data.candidates[0].content.parts[0].text);
      
      // Validate dates using the same today instance
      if (new Date(parsedInfo.deadline) <= today) {
        throw new Error('Generated deadline must be after today');
      }

      parsedInfo.milestones.forEach((milestone: { deadline: string }, index: number) => {
        if (new Date(milestone.deadline) <= today) {
          throw new Error(`Milestone ${index + 1} deadline must be after today`);
        }
      });

      setCourseInfo(parsedInfo);
      toast.success('Course information extracted successfully!');
    } catch (error) {
      console.error('Error extracting course info:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to extract course information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCourse = async () => {
    if (!courseInfo) {
      toast.error('No course information to save');
      return;
    }
    
    try {
      console.log('Adding course:', courseInfo);
      const response = await axiosInstance.post('/api/courses', courseInfo);
      console.log('Add course response:', response);
      
      toast.success('Course added successfully!');
      await fetchSavedCourses(); // Wait for courses to be fetched
      setCourseInfo(null);
      setCourseUrl('');
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast.error(error.response?.data?.message || 'Failed to save course');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await axiosInstance.delete(`/api/courses/${courseId}`);
      toast.success('Course deleted successfully!');
      fetchSavedCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleUpdateCourse = async () => {
    if (!updatedCourse) return;
    
    try {
      await axiosInstance.put(`/api/courses/${updatedCourse._id}`, updatedCourse);
      toast.success('Course updated successfully!');
      await fetchSavedCourses(); // Wait for courses to be fetched
    } catch (error: any) {
      console.error('Error updating course:', error);
      toast.error(error.response?.data?.message || 'Failed to update course');
    }
  };

  const handleEditField = (field: keyof CourseInfo, value: any) => {
    setEditModalOpen(true);
    setEditModalField(field);
    setEditModalValue(value);
  };

  const handleSaveEdit = (newValue: any) => {
    if (!updatedCourse || !editModalField) return;
    const newCourse = { ...updatedCourse };
    newCourse[editModalField] = newValue;
    setUpdatedCourse(newCourse);
    setEditModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New Course</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="courseUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course URL
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="courseUrl"
                value={courseUrl}
                onChange={(e) => setCourseUrl(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                placeholder="Enter course URL"
              />
            </div>
          </div>

          <div>
            <label htmlFor="hoursPerWeek" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hours per Week
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="hoursPerWeek"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                min="1"
                max="168"
              />
            </div>
          </div>

          <button
            onClick={extractCourseInfo}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Course'}
          </button>
        </div>

        {courseInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mt-6"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <h3 className="text-2xl font-bold text-white">{courseInfo.name}</h3>
              <p className="text-indigo-100 mt-1">{courseInfo.provider}</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-center space-x-3 bg-indigo-50 dark:bg-gray-700 p-4 rounded-lg">
                  <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{courseInfo.duration}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-purple-50 dark:bg-gray-700 p-4 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pace</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{courseInfo.pace}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Prerequisites</h4>
                  <div className="space-y-2">
                    {courseInfo.prerequisites.map((prerequisite, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"
                      >
                        <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                        <p>{prerequisite}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Key Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {courseInfo.mainSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Learning Objectives</h4>
                <div className="space-y-2">
                  {courseInfo.objectives.map((objective, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{index + 1}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{objective}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Course Timeline</h4>
                <div className="relative">
                  {courseInfo.milestones.map((milestone, index) => (
                    <div key={index} className="relative pl-10 pb-8 last:pb-0">
                      {index < courseInfo.milestones.length - 1 && (
                        <div 
                          className="absolute left-4 top-8 w-0.5 h-full bg-gradient-to-b from-indigo-500 to-purple-600 opacity-30" 
                          style={{ height: 'calc(100% - 2rem)' }}
                        />
                      )}
                      <div className="flex items-center mb-2">
                        <div className="absolute left-0 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-md font-semibold text-gray-900 dark:text-white">{milestone.name}</h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Deadline: {milestone.deadline}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Course Deadline</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{courseInfo.deadline}</p>
                  </div>
                  <button
                    onClick={() => handleAddCourse()}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Save Course
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {savedCourses.length > 0 && (
        <div className="mt-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Saved Courses</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {savedCourses.map((course, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{course.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{course.provider}</p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">{course.duration}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">{course.pace}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Target className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">Due: {course.deadline}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-4">
                  <button
                    onClick={() => setExpandedCourses(prev => ({ ...prev, [course._id]: !prev[course._id] }))}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    {expandedCourses[course._id] ? 'Show Less' : 'Know More'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCourse(course._id);
                      setUpdatedCourse(course);
                    }}
                    className="inline-flex items-center text-sm text-green-600 hover:text-green-700"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course._id)}
                    className="inline-flex items-center text-sm text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>

                {expandedCourses[course._id] && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Course Objectives</h4>
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        {course.objectives?.map((objective, index) => (
                          <li key={index} className="text-sm text-gray-900 dark:text-white">{objective}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Key Skills</h4>
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        {course.mainSkills?.map((skill, index) => (
                          <li key={index} className="text-sm text-gray-900 dark:text-white">{skill}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Topics Covered</h4>
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        {course.topics?.map((topic, index) => (
                          <li key={index} className="text-sm text-gray-900 dark:text-white">{topic}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Certification</h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{course.certification}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Weekly Milestones</h4>
                      <div className="mt-2 space-y-2">
                        {course.milestones?.map((milestone, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-900 dark:text-white">{milestone.name}</span>
                            <span className="text-gray-500 dark:text-gray-400">{milestone.deadline}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {editingCourse === course._id && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provider</label>
                      <input
                        type="text"
                        value={updatedCourse?.provider || ''}
                        onChange={(e) => {
                          setUpdatedCourse(prev => ({ ...prev, provider: e.target.value }));
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
                      <input
                        type="text"
                        value={updatedCourse?.duration || ''}
                        onChange={(e) => {
                          setUpdatedCourse(prev => ({ ...prev, duration: e.target.value }));
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Study Pace</label>
                      <input
                        type="text"
                        value={updatedCourse?.pace || ''}
                        onChange={(e) => {
                          setUpdatedCourse(prev => ({ ...prev, pace: e.target.value }));
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty Level</label>
                      <input
                        type="text"
                        value={updatedCourse?.difficulty || ''}
                        onChange={(e) => {
                          setUpdatedCourse(prev => ({ ...prev, difficulty: e.target.value }));
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prerequisites</label>
                      {updatedCourse?.prerequisites?.map((prerequisite, index) => (
                        <div key={index} className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={prerequisite}
                            onChange={(e) => {
                              const newPrerequisites = [...(updatedCourse?.prerequisites || [])];
                              newPrerequisites[index] = e.target.value;
                              setUpdatedCourse(prev => ({ ...prev, prerequisites: newPrerequisites }));
                            }}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            onClick={() => {
                              const newPrerequisites = updatedCourse.prerequisites.filter((_, i) => i !== index);
                              setUpdatedCourse(prev => ({ ...prev, prerequisites: newPrerequisites }));
                            }}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newPrerequisites = [...(updatedCourse?.prerequisites || []), ''];
                          setUpdatedCourse(prev => ({ ...prev, prerequisites: newPrerequisites }));
                        }}
                        className="mt-2 inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Prerequisite
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course Format</label>
                      <input
                        type="text"
                        value={updatedCourse?.format || ''}
                        onChange={(e) => {
                          setUpdatedCourse(prev => ({ ...prev, format: e.target.value }));
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teaching Methods</label>
                      {updatedCourse?.methods?.map((method, index) => (
                        <div key={index} className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={method}
                            onChange={(e) => {
                              const newMethods = [...(updatedCourse?.methods || [])];
                              newMethods[index] = e.target.value;
                              setUpdatedCourse(prev => ({ ...prev, methods: newMethods }));
                            }}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            onClick={() => {
                              const newMethods = updatedCourse.methods.filter((_, i) => i !== index);
                              setUpdatedCourse(prev => ({ ...prev, methods: newMethods }));
                            }}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newMethods = [...(updatedCourse?.methods || []), ''];
                          setUpdatedCourse(prev => ({ ...prev, methods: newMethods }));
                        }}
                        className="mt-2 inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Method
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Learning Objectives</label>
                      {updatedCourse?.objectives?.map((objective, index) => (
                        <div key={index} className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={objective}
                            onChange={(e) => {
                              const newObjectives = [...(updatedCourse?.objectives || [])];
                              newObjectives[index] = e.target.value;
                              setUpdatedCourse(prev => ({ ...prev, objectives: newObjectives }));
                            }}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            onClick={() => {
                              const newObjectives = updatedCourse.objectives.filter((_, i) => i !== index);
                              setUpdatedCourse(prev => ({ ...prev, objectives: newObjectives }));
                            }}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newObjectives = [...(updatedCourse?.objectives || []), ''];
                          setUpdatedCourse(prev => ({ ...prev, objectives: newObjectives }));
                        }}
                        className="mt-2 inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Objective
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Key Skills</label>
                      {updatedCourse?.mainSkills?.map((skill, index) => (
                        <div key={index} className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={skill}
                            onChange={(e) => {
                              const newSkills = [...(updatedCourse?.mainSkills || [])];
                              newSkills[index] = e.target.value;
                              setUpdatedCourse(prev => ({ ...prev, mainSkills: newSkills }));
                            }}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            onClick={() => {
                              const newSkills = updatedCourse.mainSkills.filter((_, i) => i !== index);
                              setUpdatedCourse(prev => ({ ...prev, mainSkills: newSkills }));
                            }}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newSkills = [...(updatedCourse?.mainSkills || []), ''];
                          setUpdatedCourse(prev => ({ ...prev, mainSkills: newSkills }));
                        }}
                        className="mt-2 inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Skill
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Topics Covered</label>
                      {updatedCourse?.topics?.map((topic, index) => (
                        <div key={index} className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={topic}
                            onChange={(e) => {
                              const newTopics = [...(updatedCourse?.topics || [])];
                              newTopics[index] = e.target.value;
                              setUpdatedCourse(prev => ({ ...prev, topics: newTopics }));
                            }}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            onClick={() => {
                              const newTopics = updatedCourse.topics.filter((_, i) => i !== index);
                              setUpdatedCourse(prev => ({ ...prev, topics: newTopics }));
                            }}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newTopics = [...(updatedCourse?.topics || []), ''];
                          setUpdatedCourse(prev => ({ ...prev, topics: newTopics }));
                        }}
                        className="mt-2 inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Topic
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Certification</label>
                      <input
                        type="text"
                        value={updatedCourse?.certification || ''}
                        onChange={(e) => {
                          setUpdatedCourse(prev => ({ ...prev, certification: e.target.value }));
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deadline</label>
                      <input
                        type="date"
                        value={updatedCourse?.deadline || ''}
                        onChange={(e) => {
                          setUpdatedCourse(prev => ({ ...prev, deadline: e.target.value }));
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    {/* Weekly Milestones */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weekly Milestones</label>
                      {updatedCourse?.milestones?.map((milestone, index) => (
                        <div key={index} className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={milestone.name}
                            onChange={(e) => {
                              const newMilestones = [...(updatedCourse?.milestones || [])];
                              newMilestones[index] = { ...milestone, name: e.target.value };
                              setUpdatedCourse(prev => ({ ...prev, milestones: newMilestones }));
                            }}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Milestone name"
                          />
                          <input
                            type="date"
                            value={milestone.deadline}
                            onChange={(e) => {
                              const newMilestones = [...(updatedCourse?.milestones || [])];
                              newMilestones[index] = { ...milestone, deadline: e.target.value };
                              setUpdatedCourse(prev => ({ ...prev, milestones: newMilestones }));
                            }}
                            className="w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            onClick={() => {
                              const newMilestones = updatedCourse.milestones.filter((_, i) => i !== index);
                              setUpdatedCourse(prev => ({ ...prev, milestones: newMilestones }));
                            }}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newMilestones = [...(updatedCourse?.milestones || []), { name: '', deadline: '' }];
                          setUpdatedCourse(prev => ({ ...prev, milestones: newMilestones }));
                        }}
                        className="mt-2 inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Milestone
                      </button>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingCourse(null)}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateCourse}
                        className="px-3 py-1 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {editModalOpen && (
        <EditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          field={editModalField}
          value={editModalValue}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default Courses;
