import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../config/axios';
import { toast } from 'react-hot-toast';
import { Course, Milestone } from '../types';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Award, Clock, AlertTriangle, Calendar, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, RadialLinearScale, ArcElement, Tooltip as ChartJSTooltip, Legend } from 'chart.js';
import { PolarArea, Pie, Doughnut } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { testCourses } from '../api/mockData';
import { themeConfig } from '../config/theme';

// Register necessary components and scales for the PolarArea and Bar charts
ChartJS.register(CategoryScale, LinearScale, BarElement, RadialLinearScale, ArcElement, ChartJSTooltip, Legend);

interface MilestoneProgress {
  courseId: string;
  milestoneIndex: number;
  completed: boolean;
}

interface MilestoneWithCourse extends Milestone {
  courseName: string;
}

const Progress: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [milestoneProgress, setMilestoneProgress] = useState<MilestoneProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [courseProgressData, setCourseProgressData] = useState({});
  const [milestonesCompletedData, setMilestonesCompletedData] = useState({});
  const [completedAnimation, setCompletedAnimation] = useState<{courseId: string, milestoneIndex: number} | null>(null);
  const [allMilestones, setAllMilestones] = useState<MilestoneWithCourse[]>([]);

  // Get course ID from URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const courseIdFromUrl = searchParams.get('course');

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCourses();
      fetchMilestoneProgress();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Combine all milestones from all courses with course names
    const combinedMilestones = courses.flatMap(course =>
      course.milestones.map(milestone => ({
        ...milestone,
        courseId: course._id,
        courseName: course.name,
        completed: milestoneProgress.some(
          mp => mp.courseId === course._id && 
          mp.milestoneIndex === course.milestones.indexOf(milestone) && 
          mp.completed
        )
      }))
    );
    setAllMilestones(combinedMilestones);
  }, [courses, milestoneProgress]);

  useEffect(() => {
    // Prepare data for Course Progress chart
    const courseProgressData = {
      labels: courses.map(course => course.name.split(' ').slice(0, 3).join(' ')),
      datasets: [{
        label: 'Course Progress',
        data: courses.map(course => getCourseProgress(course._id, course.milestones.length)),
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
        ],
      }]
    };

    // Prepare data for Milestones Completed chart
    const milestonesCompletedData = {
      labels: courses.map(course => course.name.split(' ').slice(0, 3).join(' ')),
      datasets: [{
        label: 'Milestones Completed',
        data: courses.map(course => milestoneProgress.filter(mp => mp.courseId === course._id && mp.completed).length),
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
        ],
      }]
    };

    setCourseProgressData(courseProgressData);
    setMilestonesCompletedData(milestonesCompletedData);
  }, [courses, milestoneProgress]);

  useEffect(() => {
    // Auto-expand the course from URL parameter if it exists
    if (courseIdFromUrl && courses.some(course => course._id === courseIdFromUrl)) {
      setExpandedCourses(prev => {
        if (!prev.includes(courseIdFromUrl)) {
          return [...prev, courseIdFromUrl];
        }
        return prev;
      });
    }
  }, [courseIdFromUrl, courses]);

  const getMilestonesByStatus = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);

    // Calculate week boundaries
    const startOfThisWeek = new Date(startOfToday);
    startOfThisWeek.setDate(startOfToday.getDate() - startOfToday.getDay()); // Start of current week (Sunday)
    
    const endOfThisWeek = new Date(startOfThisWeek);
    endOfThisWeek.setDate(startOfThisWeek.getDate() + 6); // End of current week (Saturday)
    endOfThisWeek.setHours(23, 59, 59, 999);

    const startOfNextWeek = new Date(endOfThisWeek);
    startOfNextWeek.setDate(endOfThisWeek.getDate() + 1);
    
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    endOfNextWeek.setHours(23, 59, 59, 999);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
    endOfLastWeek.setHours(23, 59, 59, 999);

    // Filter milestones
    const thisWeekMilestones = allMilestones.filter(milestone => {
      const deadline = new Date(milestone.deadline);
      return deadline >= startOfThisWeek && deadline <= endOfThisWeek && !milestone.completed;
    }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    const nextWeekMilestones = allMilestones.filter(milestone => {
      const deadline = new Date(milestone.deadline);
      return deadline > endOfThisWeek && deadline <= endOfNextWeek && !milestone.completed;
    }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    const missedLastWeekMilestones = allMilestones.filter(milestone => {
      const deadline = new Date(milestone.deadline);
      return deadline >= startOfLastWeek && deadline <= endOfLastWeek && !milestone.completed;
    }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    return {
      thisWeek: thisWeekMilestones,
      nextWeek: nextWeekMilestones,
      missedLastWeek: missedLastWeekMilestones
    };
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleMilestoneCheck = async (milestone: MilestoneWithCourse) => {
    try {
      const courseIndex = courses.findIndex(c => c._id === milestone.courseId);
      const milestoneIndex = courses[courseIndex].milestones.findIndex(
        m => m.name === milestone.name && m.deadline === milestone.deadline
      );

      await axiosInstance.post('/api/progress/milestones', {
        courseId: milestone.courseId,
        milestoneIndex: milestoneIndex,
        completed: true
      });

      // Update local state
      setMilestoneProgress(prev => [
        ...prev,
        { courseId: milestone.courseId, milestoneIndex, completed: true }
      ]);

      setCompletedAnimation({ courseId: milestone.courseId, milestoneIndex });
      toast.success('Milestone marked as completed!');

      // Refetch milestone progress
      fetchMilestoneProgress();
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast.error('Failed to update milestone');
    }
  };

  const fetchCourses = async () => {
    try {
      // For testing, use the testCourses data
      const response = await axiosInstance.get('/api/courses');
      if (Array.isArray(response.data)) {
        setCourses(response.data);
      } else {
        // Fallback to test data if API fails
        setCourses(testCourses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Use test data as fallback
      setCourses(testCourses);
      toast.error('Using test data - API connection failed');
    }
  };

  const fetchMilestoneProgress = async () => {
    try {
      const response = await axiosInstance.get('/api/progress/milestones');
      if (Array.isArray(response.data)) {
        setMilestoneProgress(response.data);
      }
    } catch (error) {
      console.error('Error fetching milestone progress:', error);
      setMilestoneProgress([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMilestone = async (courseId: string, milestoneIndex: number) => {
    const currentProgress = milestoneProgress.find(
      p => p.courseId === courseId && p.milestoneIndex === milestoneIndex
    );
    
    const newProgress = {
      courseId,
      milestoneIndex,
      completed: !currentProgress?.completed
    };

    try {
      await axiosInstance.post('/api/progress/milestones', newProgress);
      
      setMilestoneProgress(prev => {
        const filtered = prev.filter(
          p => !(p.courseId === courseId && p.milestoneIndex === milestoneIndex)
        );
        return [...filtered, newProgress];
      });

      if (newProgress.completed) {
        setCompletedAnimation({ courseId, milestoneIndex });
        setTimeout(() => {
          setCompletedAnimation(null);
        }, 2000);
      }

      toast.success(newProgress.completed ? 'Milestone completed! 🎉' : 'Milestone unchecked');
    } catch (error) {
      console.error('Error updating milestone progress:', error);
      toast.error('Failed to update milestone');
    }
  };

  const isMilestoneCompleted = (courseId: string, milestoneIndex: number) => {
    return milestoneProgress.some(
      p => p.courseId === courseId && 
           p.milestoneIndex === milestoneIndex && 
           p.completed
    );
  };

  const getCourseProgress = (courseId: string, totalMilestones: number) => {
    const completedCount = milestoneProgress.filter(
      p => p.courseId === courseId && p.completed
    ).length;
    return (completedCount / totalMilestones) * 100;
  };

  const toggleCourseExpansion = (courseId: string) => {
    setExpandedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const courseCompletionData = {
    labels: courses.map(course => course.name.split(' ').slice(0, 3).join(' ')),
    datasets: [
      {
        label: 'Completed Milestones',
        data: courses.map(course => 
          milestoneProgress.filter(mp => mp.courseId === course._id && mp.completed).length
        ),
        backgroundColor: '#8B5CF6',
      },
      {
        label: 'Total Milestones',
        data: courses.map(course => course.milestones.length),
        backgroundColor: '#E5E7EB',
      },
    ],
  };

  const courseCompletionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        animation: {
          duration: 2000,
        }
      }
    },
    animation: {
      duration: 2000,
    }
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false
      },
      tooltip: {
        animation: {
          duration: 2000,
        }
      }
    },
    maintainAspectRatio: false,
    responsive: true,
    animation: {
      duration: 2000,
    }
  };

  const MilestoneBox: React.FC<{
    title: string;
    milestones: MilestoneWithCourse[];
    icon: React.ReactNode;
    bgColor: string;
  }> = ({ title, milestones, icon, bgColor }) => (
    <div className={`${bgColor} p-6 rounded-2xl shadow-lg flex-1 min-h-[300px] border-2 border-gray-100 dark:border-gray-700`}>
      <div className="flex items-center mb-6">
        <div className="p-2.5 rounded-xl bg-white/50 dark:bg-gray-800/50">
          {icon}
        </div>
        <h3 className="text-xl font-semibold ml-3 text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="space-y-4 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
        {milestones.map((milestone, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center justify-between transform hover:scale-102 transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
          >
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-900 dark:text-white">{milestone.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{milestone.courseName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Due: {formatDate(new Date(milestone.deadline))}
              </p>
            </div>
            <button
              onClick={() => handleMilestoneCheck(milestone)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300 ml-4"
            >
              {milestone.completed ? (
                <CheckSquare className="w-5 h-5 text-green-500" />
              ) : (
                <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              )}
            </button>
          </div>
        ))}
        {milestones.length === 0 && (
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-center italic">No milestones to display</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-2">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 1.5 }}
      className={`min-h-screen bg-${themeConfig.colors.background.page.light} dark:bg-${themeConfig.colors.background.page.dark} py-4 backdrop-blur-md`}
    >
      <div className="container mx-auto px-2 mt-1">
        {/* Charts Section */}
        {courses.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg shadow-lg p-2`}>
                <h2 className="text-lg font-semibold mb-1 text-center">Course Progress</h2>
                <div className="h-[350px]">
                  <Pie data={courseProgressData} options={pieOptions} />
                </div>
              </div>

              <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg shadow-lg p-2`}>
                <h2 className="text-lg font-semibold mb-1 text-center">Milestones Completed</h2>
                <div className="h-[350px]">
                  <Pie data={milestonesCompletedData} options={pieOptions} />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2 mb-2">
              <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-lg shadow-lg p-2`}>
                <h2 className="text-lg font-semibold mb-1 text-center">Course Completion Percentages</h2>
                <div className="h-[300px]">
                  <Bar data={courseCompletionData} options={courseCompletionOptions} />
                </div>
              </div>
            </div>
          </>
        )}
        {/* Milestone Tracking */}
        <div className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} rounded-2xl shadow-lg p-8 mt-6 mb-8`}>
          <h2 className="text-2xl font-semibold mb-8 text-center">Milestone Tracking</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MilestoneBox
              title="This Week"
              milestones={getMilestonesByStatus().thisWeek}
              icon={<Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
              bgColor="bg-indigo-50 dark:bg-gray-800/50"
            />
            <MilestoneBox
              title="Next Week"
              milestones={getMilestonesByStatus().nextWeek}
              icon={<Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
              bgColor="bg-purple-50 dark:bg-gray-800/50"
            />
            <MilestoneBox
              title="Missed Last Week"
              milestones={getMilestonesByStatus().missedLastWeek}
              icon={<AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
              bgColor="bg-red-50 dark:bg-gray-800/50"
            />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center  text-gray-900 dark:text-white mb-4">Manage Your Milestones</h2>
        {/* Course List */}
        <div className="p-2">
          {courses.map(course => {
            const progress = getCourseProgress(course._id, course.milestones.length);
            const isExpanded = expandedCourses.includes(course._id);
            
            return (
              <motion.div 
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5 }}
                className={`bg-gradient-to-br from-${themeConfig.colors.background.page.light} to-${themeConfig.colors.background.page.dark} shadow-sm rounded-2xl overflow-hidden border border-${themeConfig.colors.background.page.light} dark:border-${themeConfig.colors.background.page.dark} hover:border-${themeConfig.colors.primary.light} dark:hover:border-${themeConfig.colors.primary.dark} transition-all duration-500 transform hover:scale-[1.04] hover:-translate-y-1 hover:shadow-2xl cursor-pointer group mb-4`}
              >
                {/* Course header and content */}
                <button 
                  onClick={() => toggleCourseExpansion(course._id)}
                  className="w-full px-4 py-3 flex flex-col space-y-2 text-left hover:bg-${themeConfig.colors.primary.bg.light} dark:hover:bg-${themeConfig.colors.primary.bg.dark} transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-medium text-${themeConfig.colors.text.primary} dark:text-${themeConfig.colors.text.primary} group-hover:text-${themeConfig.colors.primary.light} dark:group-hover:text-${themeConfig.colors.primary.dark} transition-colors">
                        {course.name}
                      </h2>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${themeConfig.colors.background.page.light} dark:bg-${themeConfig.colors.background.page.dark} text-${themeConfig.colors.text.primary} dark:text-${themeConfig.colors.text.primary} shadow-sm">
                        {course.milestones.length} milestones
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-${themeConfig.colors.primary.light} dark:text-${themeConfig.colors.primary.dark}">
                        {Math.round(getCourseProgress(course._id, course.milestones.length))}%
                      </span>
                      {expandedCourses.includes(course._id) ? (
                        <ChevronUp className="w-4 h-4 text-${themeConfig.colors.text.primary} dark:text-${themeConfig.colors.text.primary} group-hover:text-${themeConfig.colors.primary.light} dark:group-hover:text-${themeConfig.colors.primary.dark} transition-colors" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-${themeConfig.colors.text.primary} dark:text-${themeConfig.colors.text.primary} group-hover:text-${themeConfig.colors.primary.light} dark:group-hover:text-${themeConfig.colors.primary.dark} transition-colors" />
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getCourseProgress(course._id, course.milestones.length)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1.5 rounded-full transition-all duration-300 ease-in-out hover:from-indigo-600 hover:to-purple-700"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className={`${
                      getCourseProgress(course._id, course.milestones.length) === 100
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {milestoneProgress.filter(p => p.courseId === course._id && p.completed).length} of {course.milestones.length} completed
                    </span>
                    <span className={`flex items-center ${
                      getCourseProgress(course._id, course.milestones.length) === 100
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      <Clock className="w-3 h-3 mr-1 group-hover:rotate-12 transition-all duration-300" />
                      {course.milestones.length - Math.round((getCourseProgress(course._id, course.milestones.length) / 100) * course.milestones.length)} remaining
                    </span>
                  </div>
                </button>
                
                <AnimatePresence>
                  {expandedCourses.includes(course._id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-${themeConfig.colors.background.page.light} dark:border-${themeConfig.colors.background.page.dark} bg-${themeConfig.colors.background.page.light} dark:bg-${themeConfig.colors.background.page.dark}"
                    >
                      <div className="divide-y divide-${themeConfig.colors.background.page.light} dark:divide-${themeConfig.colors.background.page.dark}">
                        {course.milestones.map((milestone, index) => {
                          const isCompleted = isMilestoneCompleted(course._id, index);
                          return (
                            <div 
                              key={`${course._id}-${index}`}
                              className={`flex items-center px-4 py-2 relative ${
                                isCompleted 
                                  ? `bg-${themeConfig.colors.primary.bg.light} dark:bg-${themeConfig.colors.primary.bg.dark}` 
                                  : `hover:bg-${themeConfig.colors.background.page.light} dark:hover:bg-${themeConfig.colors.background.page.dark}`
                              } transition-all duration-500 transform hover:scale-[1.05] hover:-translate-y-2 hover:shadow-2xl relative z-10 hover:rounded-2xl`}
                            >
                              {completedAnimation?.courseId === course._id && 
                               completedAnimation?.milestoneIndex === index && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="absolute inset-0 bg-${themeConfig.colors.primary.bg.light} dark:bg-${themeConfig.colors.primary.bg.dark} rounded-2xl flex items-center justify-center"
                                >
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                    className="bg-${themeConfig.colors.primary.bg.light} dark:bg-${themeConfig.colors.primary.bg.dark} rounded-full p-2"
                                  >
                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                  </motion.div>
                                </motion.div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleMilestone(course._id, index);
                                }}
                                className={`flex items-center w-full ${
                                  isCompleted
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                                }`}
                              >
                                <span className="flex-shrink-0 transform hover:scale-125 transition-all duration-500">
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 transform hover:rotate-12 transition-all duration-500" />
                                  ) : (
                                    <Circle className="w-4 h-4 transform hover:rotate-12 transition-all duration-500" />
                                  )}
                                </span>
                                <div className="min-w-0 flex-1 group pl-6">
                                  <div className={`text-sm font-medium ${
                                    isCompleted
                                      ? 'text-purple-600 dark:text-purple-400'
                                      : 'text-gray-600 dark:text-gray-400'
                                  } truncate transform group-hover:translate-x-2 group-hover:scale-105 transition-all duration-500`}>
                                    {milestone.name}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center transform group-hover:translate-x-2 group-hover:scale-105 transition-all duration-500">
                                    <Clock className="w-3 h-3 mr-1 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500" />
                                    Due: {new Date(milestone.deadline).toLocaleDateString()}
                                  </div>
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default Progress;
