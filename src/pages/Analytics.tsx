import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Target, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, LineChart, Line, Area, AreaChart } from 'recharts';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';
import { useTimeBlockStore } from '../store/timeBlockStore';
import { TaskStatus, TaskPriority, TimeBlockStatus } from '../types';

interface AnalyticsData {
  dailyPomodoros: Array<{ date: string; pomodoros: number; focusTime: number }>;
  taskCompletion: Array<{ name: string; value: number; color: string }>;
  priorityDistribution: Array<{ priority: string; count: number; color: string }>;
  weeklyProgress: Array<{ week: string; completed: number; total: number }>;
  productivityTrends: Array<{ date: string; productivity: number; tasks: number }>;
}

const Analytics: React.FC = () => {
  const { user } = useAuthStore();
  const { tasks } = useTaskStore();
  const { timeBlocks } = useTimeBlockStore();
  
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    dailyPomodoros: [],
    taskCompletion: [],
    priorityDistribution: [],
    weeklyProgress: [],
    productivityTrends: []
  });

  useEffect(() => {
    generateAnalyticsData();
  }, [tasks, timeBlocks, timeRange]);

  const generateAnalyticsData = () => {
    const now = new Date();
    const daysBack = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    
    // Generate daily pomodoros data
    const dailyPomodoros = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Mock data - in real app, this would come from session data
      const pomodoros = Math.floor(Math.random() * 8) + 1;
      const focusTime = pomodoros * 25; // 25 minutes per pomodoro
      
      dailyPomodoros.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pomodoros,
        focusTime
      });
    }

    // Task completion data
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const todoTasks = tasks.filter(t => t.status === TaskStatus.TODO).length;
    
    const taskCompletion = [
      { name: 'Completed', value: completedTasks, color: '#10B981' },
      { name: 'In Progress', value: inProgressTasks, color: '#3B82F6' },
      { name: 'To Do', value: todoTasks, color: '#6B7280' }
    ];

    // Priority distribution
    const highPriority = tasks.filter(t => t.priority === TaskPriority.HIGH).length;
    const mediumPriority = tasks.filter(t => t.priority === TaskPriority.MEDIUM).length;
    const lowPriority = tasks.filter(t => t.priority === TaskPriority.LOW).length;
    
    const priorityDistribution = [
      { priority: 'High', count: highPriority, color: '#EF4444' },
      { priority: 'Medium', count: mediumPriority, color: '#F59E0B' },
      { priority: 'Low', count: lowPriority, color: '#10B981' }
    ];

    // Weekly progress
    const weeklyProgress = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });
      
      const completed = weekTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      const total = weekTasks.length;
      
      weeklyProgress.push({
        week: `Week ${4 - i}`,
        completed,
        total
      });
    }

    // Productivity trends
    const productivityTrends = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Mock productivity score (0-100)
      const productivity = Math.floor(Math.random() * 40) + 60;
      const tasksCount = Math.floor(Math.random() * 5) + 1;
      
      productivityTrends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        productivity,
        tasks: tasksCount
      });
    }

    setAnalyticsData({
      dailyPomodoros,
      taskCompletion,
      priorityDistribution,
      weeklyProgress,
      productivityTrends
    });
  };

  const calculateStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const totalPomodoros = analyticsData.dailyPomodoros.reduce((sum, day) => sum + day.pomodoros, 0);
    const totalFocusTime = Math.round(totalPomodoros * 25 / 60 * 10) / 10; // Convert to hours
    
    const avgDailyPomodoros = analyticsData.dailyPomodoros.length > 0 
      ? Math.round(totalPomodoros / analyticsData.dailyPomodoros.length * 10) / 10 
      : 0;

    return {
      totalTasks,
      completedTasks,
      completionRate,
      totalPomodoros,
      totalFocusTime,
      avgDailyPomodoros
    };
  };

  const stats = calculateStats();

  const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400">Track your productivity and progress</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              timeRange === 'week'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              timeRange === 'month'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('quarter')}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              timeRange === 'quarter'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Quarter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Completion Rate</p>
              <p className="text-2xl font-bold text-white">{stats.completionRate}%</p>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {stats.completedTasks} of {stats.totalTasks} tasks completed
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Focus Time</p>
              <p className="text-2xl font-bold text-white">{stats.totalFocusTime}h</p>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {stats.totalPomodoros} pomodoros completed
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Daily Average</p>
              <p className="text-2xl font-bold text-white">{stats.avgDailyPomodoros}</p>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Pomodoros per day
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Activity className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Productivity Score</p>
              <p className="text-2xl font-bold text-white">85%</p>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Based on recent activity
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Pomodoros Chart */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Daily Pomodoros</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.dailyPomodoros}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="pomodoros" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Completion Pie Chart */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Task Status</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={analyticsData.taskCompletion}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.taskCompletion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {analyticsData.taskCompletion.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-300">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Productivity Trends */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Productivity Trends</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.productivityTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="productivity" 
                  stroke="#3B82F6" 
                  fill="url(#colorProductivity)" 
                />
                <defs>
                  <linearGradient id="colorProductivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Task Priority</h3>
          </div>
          <div className="space-y-4">
            {analyticsData.priorityDistribution.map((item, index) => {
              const total = analyticsData.priorityDistribution.reduce((sum, p) => sum + p.count, 0);
              const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{item.priority} Priority</span>
                    <span className="text-sm text-white">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Weekly Progress</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="week" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total" fill="#374151" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Insights & Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="font-medium text-blue-300 mb-2">🎯 Focus Improvement</h4>
            <p className="text-sm text-gray-300">
              Your average session length is 23 minutes. Try extending to the full 25-minute Pomodoro for better focus.
            </p>
          </div>
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <h4 className="font-medium text-green-300 mb-2">📈 Productivity Peak</h4>
            <p className="text-sm text-gray-300">
              You're most productive between 9-11 AM. Schedule your most important tasks during this time.
            </p>
          </div>
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <h4 className="font-medium text-yellow-300 mb-2">⚡ Streak Building</h4>
            <p className="text-sm text-gray-300">
              You're on a 3-day streak! Keep it up by completing at least 4 pomodoros today.
            </p>
          </div>
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <h4 className="font-medium text-purple-300 mb-2">🎨 Task Balance</h4>
            <p className="text-sm text-gray-300">
              Consider breaking down high-priority tasks into smaller chunks for better completion rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;