import React, { useState, useEffect } from 'react';
import axiosInstance from '../config/axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { 
  Calendar, 
  Clock, 
  Book, 
  Target, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit2, 
  BarChart2, 
  BookOpen, 
  Award, 
  Flag, 
  Building2, 
  Gauge, 
  CheckCircle, 
  X 
} from 'lucide-react';

interface CourseInfo {
  name: string;
  provider: string;
  duration: string;
  pace: string;
  objectives: string[];
  milestones: { name: string; deadline: string; }[];
  prerequisites: string[];
  mainSkills: string[];
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: keyof CourseInfo | null;
  value: any;
  onSave: (newValue: any) => void;
}

const courseSchema = Yup.object().shape({
  name: Yup.string().required('Course name is required'),
  provider: Yup.string().required('Provider is required'),
  duration: Yup.string().required('Duration is required'),
  pace: Yup.string().required('Pace is required'),
  prerequisites: Yup.array().of(Yup.string()),
  mainSkills: Yup.array().of(Yup.string()),
  milestones: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('Milestone name is required'),
      deadline: Yup.date().required('Deadline is required')
    })
  )
});

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

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

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div 
          className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-headline"
        >
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-headline">
                  {title}
                </h3>
                <div className="mt-4">
                  {children}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Courses: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
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
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [saveConfirmationOpen, setSaveConfirmationOpen] = useState(false);

  const [extractedCourse, setExtractedCourse] = useState<CourseInfo | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const [milestoneProgress, setMilestoneProgress] = useState<Array<{ courseId: string; milestoneIndex: number; completed: boolean }>>([]);

  const navigate = useNavigate();

  // Calculate progress based on completed milestones
  const calculateProgress = (course: any) => {
    if (!course.milestones || course.milestones.length === 0) return 0;
    
    const completedMilestones = milestoneProgress.filter(
      progress => progress.courseId === course._id && progress.completed
    );

    return Math.round((completedMilestones.length / course.milestones.length) * 100);
  };

  useEffect(() => {
    console.log('Courses component mounted, auth status:', isAuthenticated);
    if (isAuthenticated) {
      fetchSavedCourses();
      fetchMilestoneProgress();
    }
  }, [isAuthenticated]);

  const fetchSavedCourses = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to view your courses');
      return;
    }

    console.log('Fetching saved courses...');
    try {
      const response = await axiosInstance.get('/api/courses', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
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

  const fetchMilestoneProgress = async () => {
    try {
      const response = await axiosInstance.get('/api/progress/milestones', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (Array.isArray(response.data)) {
        setMilestoneProgress(response.data);
      }
    } catch (error) {
      console.error('Error fetching milestone progress:', error);
      setMilestoneProgress([]);
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
    e.preventDefault();
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
           - Duration (in weeks)
           - Study pace (hours per week)

        2. Based on the course content and objectives:
           - ANALYZE and LIST the top 3-5 prerequisites that a student should have before starting this course
           - IDENTIFY and LIST the top 3-5 main skills that students will gain from this course

        3. Course Structure:
           - Extract or create 3-5 detailed learning objectives
           - Break down the course into 4-6 weekly milestones with clear topics

        Based on studying ${hoursPerWeek} hours per week, create a realistic schedule.

        Return ONLY a JSON object with the following structure:
        {
          "name": "Full course name",
          "provider": "Provider name",
          "duration": "X weeks",
          "pace": "${hoursPerWeek} hours/week",
          "prerequisites": [
            "Based on course content, list 3-5 essential prerequisites"
          ],
          "mainSkills": [
            "Based on course content, list 3-5 key skills to be gained"
          ],
          "objectives": [
            "Detailed learning objective 1",
            "Detailed learning objective 2"
          ],
          "milestones": [
            {
              "name": "Week 1: [Specific Topic/Theme]",
              "deadline": "YYYY-MM-DD"
            }
          ]
        }

        Ensure milestones are evenly spaced and follow a logical progression. Each milestone should have a clear topic focus.`;

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
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid API response structure');
      }

      const parsedInfo = cleanAndParseJSON(data.candidates[0].content.parts[0].text);
      
      // Calculate milestone dates
      const totalWeeks = parseInt(parsedInfo.duration.split(' ')[0]) || parsedInfo.milestones.length;
      const weekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
      
      parsedInfo.milestones = parsedInfo.milestones.map((milestone: any, index: number) => {
        const milestoneDate = new Date(today.getTime() + (index + 1) * weekInMilliseconds);
        return {
          ...milestone,
          deadline: milestoneDate.toISOString().split('T')[0],
          week: index + 1
        };
      });

      // Set course deadline to the last milestone date
      const lastMilestone = parsedInfo.milestones[parsedInfo.milestones.length - 1];
      
      setExtractedCourse({
        ...parsedInfo,
        deadline: lastMilestone?.deadline || 
                 new Date(today.getTime() + (totalWeeks * weekInMilliseconds)).toISOString().split('T')[0]
      });
      setShowPreview(true);

    } catch (error: any) {
      console.error('Error extracting course info:', error);
      toast.error(error.message || 'Error extracting course information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    try {
      if (!extractedCourse) return;

      const courseData = {
        ...extractedCourse,
        userId: user?.id
      };

      const savedCourse = await axiosInstance.post('/api/courses', courseData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Course saved successfully!');
      
      // Reset states
      setExtractedCourse(null);
      setShowPreview(false);
      setShowAddCourseModal(false);
      setCourseUrl('');
      
      // Refresh the courses list
      fetchSavedCourses();
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast.error(error.response?.data?.message || 'Error saving course');
    }
  };

  const handleAddCourse = async () => {
    if (!courseInfo) {
      toast.error('No course information to save');
      return;
    }
    
    try {
      console.log('Adding course:', courseInfo);
      const response = await axiosInstance.post('/api/courses', courseInfo, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
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
      const response = await axiosInstance.delete(`/api/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.status === 200) {
        toast.success('Course deleted successfully!');
        fetchSavedCourses(); // Refresh the courses list
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleUpdateCourse = async () => {
    if (!updatedCourse) return;
    setSaveConfirmationOpen(true);
  };

  const confirmUpdate = async () => {
    if (!updatedCourse) return;
    
    try {
      await axiosInstance.put(`/api/courses/${updatedCourse._id}`, updatedCourse, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Course updated successfully!');
      await fetchSavedCourses();
      setEditingCourse(null);
      setUpdatedCourse(null);
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

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course);
    setShowEditCourseModal(true);
  };

  const handleEditCourseSubmit = async (editedCourse: any) => {
    try {
      const response = await axiosInstance.put(`/api/courses/${selectedCourse._id}`, editedCourse, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.status === 200) {
        toast.success('Course updated successfully!');
        fetchSavedCourses(); // Refresh the courses list
        setShowEditCourseModal(false);
      }
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course. Please try again.');
    }
  };

  const handleDeleteClick = (courseId: string) => {
    setCourseToDelete(courseId);
    setDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    
    try {
      const response = await axiosInstance.delete(`/api/courses/${courseToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        toast.success('Course deleted successfully!');
        fetchSavedCourses(); // Refresh the courses list
        setDeleteConfirmationOpen(false);
        setCourseToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmationOpen(false);
    setCourseToDelete(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Add New Course Section */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Add New Course</h2>
          <p className="text-indigo-100 mt-1">Enter a course URL and we'll analyze it for you</p>
        </div>
        
        {!showPreview ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course URL Input */}
              <div className="col-span-2">
                <label htmlFor="courseUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    id="courseUrl"
                    value={courseUrl}
                    onChange={(e) => setCourseUrl(e.target.value)}
                    className="shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg h-12 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Hours Per Week Input */}
              <div className="col-span-2 md:col-span-1">
                <label htmlFor="hoursPerWeek" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hours per Week
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="hoursPerWeek"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    min="1"
                    max="168"
                    className="shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg h-12 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">hours</span>
                  </div>
                </div>
              </div>

              {/* Analyze Button */}
              <div className="col-span-2 md:col-span-1">
                <label className="invisible block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Action
                </label>
                <button
                  onClick={extractCourseInfo}
                  disabled={isLoading}
                  className="w-full h-12 inline-flex justify-center items-center px-6 text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing Course...
                    </>
                  ) : (
                    <>
                      <BarChart2 className="w-5 h-5 mr-2" />
                      Analyze Course
                    </>
                  )}
                </button>
              </div>

              {/* Tips Section */}
              <div className="col-span-2 mt-4">
                <div className="bg-indigo-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Tips for best results</h3>
                      <div className="mt-2 text-sm text-indigo-700 dark:text-indigo-300">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Use the official course URL</li>
                          <li>Make sure the course content is publicly accessible</li>
                          <li>Set realistic weekly hours based on your schedule</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 transition-all duration-200">
              {/* Course Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
                <h3 className="text-xl font-bold text-white mb-2">{extractedCourse?.name}</h3>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center bg-white/10 rounded-md px-3 py-1.5 hover:bg-white/20 transition-colors duration-200 cursor-pointer group">
                    <Building2 className="h-4 w-4 text-white/80 mr-1.5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium text-white/90 group-hover:text-white">{extractedCourse?.provider}</span>
                  </div>
                  <div className="flex items-center bg-white/10 rounded-md px-3 py-1.5 hover:bg-white/20 transition-colors duration-200 cursor-pointer group">
                    <Clock className="h-4 w-4 text-white/80 mr-1.5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium text-white/90 group-hover:text-white">{extractedCourse?.duration}</span>
                  </div>
                  <div className="flex items-center bg-white/10 rounded-md px-3 py-1.5 hover:bg-white/20 transition-colors duration-200 cursor-pointer group">
                    <Gauge className="h-4 w-4 text-white/80 mr-1.5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium text-white/90 group-hover:text-white">{extractedCourse?.pace}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Prerequisites */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-3 group">
                    <Flag className="h-4 w-4 text-blue-500 mr-1.5 group-hover:scale-110 transition-transform duration-200" />
                    <h4 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200">Prerequisites</h4>
                  </div>
                  <div className="space-y-1.5">
                    {extractedCourse?.prerequisites.map((prereq, index) => (
                      <div key={index} 
                        className="flex items-center bg-blue-50/50 dark:bg-blue-900/20 rounded-md p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transform hover:-translate-x-1 transition-all duration-200 group cursor-pointer"
                      >
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center mr-2 shrink-0 group-hover:scale-110 transition-transform duration-200">
                          <span className="text-xs font-bold">{index + 1}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-300">{prereq}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-3 group">
                    <Award className="h-4 w-4 text-purple-500 mr-1.5 group-hover:scale-110 transition-transform duration-200" />
                    <h4 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors duration-200">Skills You'll Gain</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedCourse?.mainSkills.map((skill, index) => (
                      <span key={index} 
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-sm bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/30 dark:hover:to-pink-800/30 transform hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-purple-500 mr-1 group-hover:scale-110 transition-transform duration-200" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Learning Objectives */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 md:col-span-2">
                  <div className="flex items-center mb-3 group">
                    <Target className="h-4 w-4 text-green-500 mr-1.5 group-hover:scale-110 transition-transform duration-200" />
                    <h4 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors duration-200">Learning Objectives</h4>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {extractedCourse?.objectives.map((objective, index) => (
                      <div key={index} 
                        className="flex items-start bg-green-50/50 dark:bg-green-900/20 rounded-md p-2 hover:bg-green-100 dark:hover:bg-green-900/30 transform hover:-translate-x-1 transition-all duration-200 group cursor-pointer"
                      >
                        <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center mr-2 mt-0.5 shrink-0 group-hover:scale-110 transition-transform duration-200">
                          <span className="text-xs font-bold">{index + 1}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-300">{objective}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center mb-4 group">
                  <Calendar className="h-4 w-4 text-blue-500 mr-1.5 group-hover:scale-110 transition-transform duration-200" />
                  <h4 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200">Course Timeline</h4>
                </div>
                <div className="relative">
                  <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500/50" />
                  
                  <div className="space-y-3">
                    {extractedCourse?.milestones.map((milestone, index) => (
                      <div key={index} className="relative pl-6 group">
                        {/* Timeline Node */}
                        <div className="absolute left-0 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-200">
                          <span className="text-[10px] font-bold text-white">{index + 1}</span>
                        </div>

                        {/* Content */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2.5 ml-2 group-hover:bg-gray-100 dark:group-hover:bg-gray-700 transform group-hover:-translate-x-1 transition-all duration-200">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-200">
                                {milestone.name}
                              </h5>
                              <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="h-3.5 w-3.5 mr-1 group-hover:scale-110 transition-transform duration-200" />
                                <time dateTime={milestone.deadline} className="group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200">
                                  {new Date(milestone.deadline).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </time>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-all duration-200 ${
                              index === 0 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/70'
                                : index === extractedCourse.milestones.length - 1
                                ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300 group-hover:bg-pink-200 dark:group-hover:bg-pink-900/70'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/70'
                            }`}>
                              {index === 0 ? 'Start' : index === extractedCourse.milestones.length - 1 ? 'End' : `Week ${index + 1}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setExtractedCourse(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-sm transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSaveCourse}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform duration-200" />
                  Add to My Courses
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Saved Courses Section */}
      {savedCourses.length > 0 && (
        <div className="mt-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Saved Courses</h2>
          <div className="space-y-3">
            {savedCourses.map((course) => (
              <div
                key={course._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
              >
                {/* Course Header */}
                <div className="p-3 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-colors duration-200 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                        {course.name}
                      </h3>
                      <div className="mt-0.5 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Building2 className="h-3.5 w-3.5 text-indigo-500 mr-1" />
                        <span className="truncate group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-200">
                          {course.provider}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1" />
                          <span>{course.weeks || 12} weeks</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 text-gray-400 mr-1" />
                          <span>{course.hoursPerWeek || 10} hrs/week</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md transform hover:-translate-y-0.5 transition-all duration-200"
                        title="Edit Course"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(course._id)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transform hover:-translate-y-0.5 transition-all duration-200"
                        title="Delete Course"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                <div className="p-3 space-y-2.5">
                  {/* Progress Bar and Actions */}
                  <div className="flex items-center space-x-4">
                    {/* Progress Section */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors duration-200">
                          Progress
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-200">
                          {calculateProgress(course)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1.5 rounded-full transition-all duration-300 ease-in-out group-hover:from-indigo-600 group-hover:to-purple-700 group-hover:shadow-sm"
                          style={{ width: `${calculateProgress(course)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => navigate(`/progress?course=${course._id}`)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 group-hover:shadow-sm transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <BarChart2 className="h-3.5 w-3.5 mr-1 group-hover:scale-110 transition-transform duration-200" />
                        View Progress
                      </button>
                      <button
                        onClick={() => {
                          setExpandedCourses(prev => ({ ...prev, [course._id]: !prev[course._id] }));
                        }}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 group-hover:shadow-sm transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <ChevronRight 
                          className={`h-3.5 w-3.5 transform transition-transform duration-200 ${
                            expandedCourses[course._id] ? 'rotate-90' : 'group-hover:translate-x-0.5'
                          }`} 
                        />
                        {expandedCourses[course._id] ? 'Show Less' : 'Know More'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedCourses[course._id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-gray-100 dark:border-gray-700"
                    >
                      <div className="p-3 space-y-3 bg-gray-50 dark:bg-gray-700/50">
                        {/* Prerequisites */}
                        {course.prerequisites && course.prerequisites.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                              <BookOpen className="h-3.5 w-3.5 text-indigo-500 mr-1" />
                              Prerequisites
                            </h4>
                            <div className="grid grid-cols-1 gap-1">
                              {course.prerequisites.map((prereq: string, index: number) => (
                                <div key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                                  <div className="w-1 h-1 rounded-full bg-indigo-500 mr-2" />
                                  {prereq}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Main Skills */}
                        {course.mainSkills && course.mainSkills.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                              <Award className="h-3.5 w-3.5 text-purple-500 mr-1" />
                              Skills You'll Gain
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {course.mainSkills.map((skill: string, index: number) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Milestones */}
                        {course.milestones && course.milestones.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                              <Flag className="h-3.5 w-3.5 text-green-500 mr-1" />
                              Milestones
                            </h4>
                            <div className="space-y-1">
                              {course.milestones.map((milestone: any, index: number) => (
                                <div key={index} className="flex items-center text-xs">
                                  <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mr-2 text-[10px] font-medium">
                                    {index + 1}
                                  </div>
                                  <span className="text-gray-600 dark:text-gray-400">{milestone.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Course"
        message="Are you sure you want to delete this course? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

      <ConfirmationModal
        isOpen={saveConfirmationOpen}
        onClose={() => setSaveConfirmationOpen(false)}
        onConfirm={confirmUpdate}
        title="Save Changes"
        message="Are you sure you want to save these changes?"
        confirmText="Save"
        cancelText="Cancel"
      />

      {/* Edit Modal */}
      {editModalOpen && (
        <EditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          field={editModalField}
          value={editModalValue}
          onSave={handleSaveEdit}
        />
      )}

      {/* Edit Course Modal */}
      {showEditCourseModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Course
              </h3>
              <button
                onClick={() => setShowEditCourseModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <Formik
              initialValues={{
                name: selectedCourse.name,
                provider: selectedCourse.provider,
                duration: selectedCourse.duration,
                pace: selectedCourse.pace,
                prerequisites: selectedCourse.prerequisites || [],
                mainSkills: selectedCourse.mainSkills || [],
                milestones: selectedCourse.milestones || []
              }}
              validationSchema={courseSchema}
              onSubmit={handleEditCourseSubmit}
            >
              {({ values, handleChange, handleSubmit, setFieldValue, errors, touched }) => (
                <Form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Course Name
                    </label>
                    <Field
                      type="text"
                      name="name"
                      value={values.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      required
                    />
                    {errors.name && touched.name && (
                      <div className="text-xs text-red-500">{errors.name}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Provider
                    </label>
                    <Field
                      type="text"
                      name="provider"
                      value={values.provider}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      required
                    />
                    {errors.provider && touched.provider && (
                      <div className="text-xs text-red-500">{errors.provider}</div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duration
                      </label>
                      <Field
                        type="text"
                        name="duration"
                        value={values.duration}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        required
                      />
                      {errors.duration && touched.duration && (
                        <div className="text-xs text-red-500">{errors.duration}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Pace
                      </label>
                      <Field
                        type="text"
                        name="pace"
                        value={values.pace}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        required
                      />
                      {errors.pace && touched.pace && (
                        <div className="text-xs text-red-500">{errors.pace}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prerequisites (comma-separated)
                    </label>
                    <Field
                      type="text"
                      value={values.prerequisites.join(', ')}
                      onChange={(e) => {
                        const prerequisites = e.target.value.split(',').map(item => item.trim()).filter(Boolean);
                        setFieldValue('prerequisites', prerequisites);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    {errors.prerequisites && touched.prerequisites && (
                      <div className="text-xs text-red-500">{errors.prerequisites}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Main Skills (comma-separated)
                    </label>
                    <Field
                      type="text"
                      value={values.mainSkills.join(', ')}
                      onChange={(e) => {
                        const skills = e.target.value.split(',').map(item => item.trim()).filter(Boolean);
                        setFieldValue('mainSkills', skills);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    {errors.mainSkills && touched.mainSkills && (
                      <div className="text-xs text-red-500">{errors.mainSkills}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Milestones
                    </label>
                    <div className="space-y-2">
                      {values.milestones.map((milestone: any, index: number) => (
                        <div key={index} className="flex gap-2">
                          <Field
                            type="text"
                            name={`milestones.${index}.name`}
                            value={milestone.name}
                            onChange={handleChange}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="Milestone name"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newMilestones = values.milestones.filter((_: any, i: number) => i !== index);
                              setFieldValue('milestones', newMilestones);
                            }}
                            className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setFieldValue('milestones', [...values.milestones, { name: '', deadline: new Date() }]);
                        }}
                        className="w-full px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md transition-colors duration-200"
                      >
                        Add Milestone
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditCourseModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                    >
                      Save Changes
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
