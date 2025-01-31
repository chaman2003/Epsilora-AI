import React, { useEffect } from 'react';
import { Book, Target, Brain, Star } from 'lucide-react';
import { QuoteSection } from "../components/dashboard/QuoteSection";
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../contexts/DashboardContext';
import { MetricCard } from '../components/dashboard/MetricCard';
import axiosInstance from '../utils/axios';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Metrics {
  totalCourses: number;
  completedCourses: number;
  totalMilestones: number;
  completedMilestones: number;
  milestonesData: Array<{
    name: string;
    completed: number;
    total: number;
  }>;
}

interface Stats {
  totalQuizzes: number;
  averageScore: number;
  quizHistory: Array<{
    date: string;
    score: number;
  }>;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { shouldRefresh } = useDashboard();
  const [metrics, setMetrics] = React.useState<Metrics>({
    totalCourses: 0,
    completedCourses: 0,
    totalMilestones: 0,
    completedMilestones: 0,
    milestonesData: []
  });
  const [stats, setStats] = React.useState<Stats>({
    totalQuizzes: 0,
    averageScore: 0,
    quizHistory: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, statsRes] = await Promise.all([
          axiosInstance.get('/api/metrics'),
          axiosInstance.get('/api/user/stats')
        ]);
        setMetrics(metricsRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, [user, shouldRefresh]);

  const milestonesChartData = {
    labels: metrics.milestonesData.map((data) => data.name),
    datasets: [
      {
        label: 'Total',
        data: metrics.milestonesData.map((data) => data.total),
        backgroundColor: '#E5E7EB',
      },
      {
        label: 'Completed',
        data: metrics.milestonesData.map((data) => data.completed),
        backgroundColor: '#8B5CF6',
      },
    ],
  };

  const milestonesChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Milestones Progress',
      },
    },
  };

  const courseCompletionData = {
    labels: ['Courses'],
    datasets: [
      {
        label: 'Completed',
        data: [metrics.completedCourses],
        backgroundColor: '#8B5CF6',
      },
      {
        label: 'Total',
        data: [metrics.totalCourses],
        backgroundColor: '#E5E7EB',
      },
    ],
  };

  const courseCompletionOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Course Completion',
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Quote Section */}
        <QuoteSection />

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Learning Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">Track your progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={Book}
            title="Total Courses"
            value={metrics.totalCourses.toString()}
            subtitle={`${metrics.completedCourses} completed`}
          />
          <MetricCard
            icon={Target}
            title="Milestones"
            value={metrics.completedMilestones.toString()}
            subtitle={`of ${metrics.totalMilestones} total`}
          />
          <MetricCard
            icon={Brain}
            title="Quiz Score"
            value={`${Math.round(stats.averageScore)}%`}
            subtitle={`Latest: ${Math.round(stats.averageScore)}%`}
          />
          <MetricCard
            icon={Star}
            title="Quizzes"
            value={stats.totalQuizzes.toString()}
            subtitle={`Latest: ${Math.round(stats.averageScore)}%`}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Course Completion Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Course Progress</h3>
            <div className="h-64">
              <Bar data={courseCompletionData} options={courseCompletionOptions} />
            </div>
          </div>

          {/* Milestones Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Milestones Progress</h3>
            <div className="h-64">
              <Bar data={milestonesChartData} options={milestonesChartOptions} />
            </div>
          </div>

          {/* Quiz Performance Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quiz Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats.quizHistory}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    tickLine={{ stroke: 'currentColor' }}
                    axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                  />
                  <YAxis
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    tickLine={{ stroke: 'currentColor' }}
                    axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '12px',
                      padding: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
