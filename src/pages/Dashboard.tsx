import { useEffect, useState } from 'react';
import { 
  Clock, 
  CheckSquare, 
  Calendar, 
  TrendingUp, 
  Play, 
  Pause,
  SkipForward,
  Target,
  Timer as TimerIcon,
  Plus
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTimerStore } from '../store/timerStore';
import { useTaskStore } from '../store/taskStore';
import { useTimeBlockStore } from '../store/timeBlockStore';
import Layout from '../components/Layout/Layout';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { 
    isRunning, 
    currentSession, 
    timeLeft, 
    startSession, 
    pauseSession, 
    resumeSession,
    skipSession 
  } = useTimerStore();
  const { 
    tasks, 
    todayTasks, 
    overdueTasks, 
    fetchTasks 
  } = useTaskStore();
  const { 
    todayTimeBlocks, 
    currentTimeBlock, 
    upcomingTimeBlocks, 
    fetchTodayTimeBlocks 
  } = useTimeBlockStore();

  const [stats, setStats] = useState({
    todayPomodoros: 0,
    todayFocusTime: 0,
    weeklyStreak: 0,
    completionRate: 0
  });

  useEffect(() => {
    fetchTasks();
    fetchTodayTimeBlocks();
    // TODO: Fetch user statistics
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerAction = () => {
    if (!currentSession) {
      startSession('work');
    } else if (isRunning) {
      pauseSession();
    } else {
      resumeSession();
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="glass glass-1 rounded-2xl p-6 border border-white/20 shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Ready to focus and achieve your goals today?
              </p>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass glass-2 rounded-2xl p-6 border border-white/20 shadow-glass">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Today's Pomodoros
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.todayPomodoros}
                </p>
              </div>
              <div className="h-12 w-12 glass glass-3 rounded-xl flex items-center justify-center">
                <TimerIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>

          <div className="glass glass-2 rounded-2xl p-6 border border-white/20 shadow-glass">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Focus Time
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.floor(stats.todayFocusTime / 60)}h {stats.todayFocusTime % 60}m
                </p>
              </div>
              <div className="h-12 w-12 glass glass-3 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
              </div>
            </div>
          </div>

          <div className="glass glass-2 rounded-2xl p-6 border border-white/20 shadow-glass">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Weekly Streak
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.weeklyStreak} days
                </p>
              </div>
              <div className="h-12 w-12 glass glass-3 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="glass glass-2 rounded-2xl p-6 border border-white/20 shadow-glass">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completionRate}%
                </p>
              </div>
              <div className="h-12 w-12 glass glass-3 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timer Section */}
          <div className="lg:col-span-1">
            <div className="glass glass-2 rounded-2xl p-6 border border-white/20 shadow-glass">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Pomodoro Timer
              </h2>
              
              <div className="text-center">
                {/* Timer Display */}
                <div className="relative mb-8">
                  <div className="h-48 w-48 mx-auto glass glass-3 rounded-full flex items-center justify-center border-4 border-primary-200/30">
                    <div className="text-center">
                      <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white">
                        {currentSession ? formatTime(timeLeft) : '25:00'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {currentSession ? 
                          (currentSession.type === 'work' ? 'Focus Time' : 'Break Time') : 
                          'Ready to start'
                        }
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Ring */}
                  {currentSession && (
                    <div className="absolute inset-0 h-48 w-48 mx-auto">
                      <svg className="transform -rotate-90 h-full w-full">
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 88}`}
                          strokeDashoffset={`${2 * Math.PI * 88 * (1 - (timeLeft / (currentSession.duration * 60)))}`}
                          className="text-primary-500 transition-all duration-1000 ease-linear"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Timer Controls */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleTimerAction}
                    className="flex items-center justify-center h-12 w-12 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl shadow-lg transition-all duration-200"
                  >
                    {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </button>
                  
                  {currentSession && (
                    <button
                      onClick={skipSession}
                      className="flex items-center justify-center h-12 w-12 glass glass-3 hover:glass hover:glass-2 text-gray-600 dark:text-gray-400 rounded-xl transition-all duration-200"
                    >
                      <SkipForward className="h-6 w-6" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tasks & Schedule */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Tasks */}
            <div className="glass glass-2 rounded-2xl p-6 border border-white/20 shadow-glass">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Today's Tasks
                </h2>
                <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl transition-all duration-200">
                  <Plus className="h-4 w-4" />
                  <span>Add Task</span>
                </button>
              </div>

              <div className="space-y-3">
                {todayTasks.length > 0 ? (
                  todayTasks.slice(0, 5).map((task) => (
                    <div key={task._id} className="flex items-center space-x-3 p-3 glass glass-3 rounded-xl">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        readOnly
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          task.status === 'completed' 
                            ? 'text-gray-500 dark:text-gray-400 line-through' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {task.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            task.priority === 'high' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : task.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {task.estimatedPomodoros} pomodoros
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No tasks for today. Add some to get started!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="glass glass-2 rounded-2xl p-6 border border-white/20 shadow-glass">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Today's Schedule
                </h2>
                <button className="flex items-center space-x-2 px-4 py-2 glass glass-3 hover:glass hover:glass-2 text-gray-600 dark:text-gray-400 rounded-xl transition-all duration-200">
                  <Calendar className="h-4 w-4" />
                  <span>View Calendar</span>
                </button>
              </div>

              <div className="space-y-3">
                {todayTimeBlocks.length > 0 ? (
                  todayTimeBlocks.slice(0, 4).map((block) => (
                    <div key={block._id} className="flex items-center space-x-3 p-3 glass glass-3 rounded-xl">
                      <div 
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: block.color }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {block.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(block.startTime).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })} - {new Date(block.endTime).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        block.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : block.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {block.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No time blocks scheduled for today.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass glass-2 rounded-2xl p-6 border border-white/20 shadow-glass">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 glass glass-3 hover:glass hover:glass-2 rounded-xl transition-all duration-200">
              <Plus className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Add Task</span>
            </button>
            
            <button className="flex flex-col items-center p-4 glass glass-3 hover:glass hover:glass-2 rounded-xl transition-all duration-200">
              <Calendar className="h-8 w-8 text-secondary-600 dark:text-secondary-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Schedule</span>
            </button>
            
            <button className="flex flex-col items-center p-4 glass glass-3 hover:glass hover:glass-2 rounded-xl transition-all duration-200">
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Analytics</span>
            </button>
            
            <button className="flex flex-col items-center p-4 glass glass-3 hover:glass hover:glass-2 rounded-xl transition-all duration-200">
              <TimerIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Timer</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;