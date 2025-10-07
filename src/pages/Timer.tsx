import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Settings, 
  Volume2, 
  VolumeX,
  Coffee,
  Target,
  Clock
} from 'lucide-react';
import { useTimerStore } from '../store/timerStore';
import { useTaskStore } from '../store/taskStore';
import Layout from '../components/Layout/Layout';
import toast from 'react-hot-toast';

const Timer = () => {
  const {
    isRunning,
    isPaused,
    currentSession,
    timeLeft,
    settings,
    sessionCount,
    startSession,
    pauseSession,
    resumeSession,
    skipSession,
    resetTimer,
    updateSettings
  } = useTimerStore();

  const { tasks, currentTask, setCurrentTask } = useTaskStore();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  useEffect(() => {
    // Play notification sound when session completes
    if (currentSession && timeLeft === 0 && soundEnabled) {
      playNotificationSound();
    }
  }, [timeLeft, currentSession, soundEnabled]);

  const playNotificationSound = () => {
    // Create audio context for notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTypeDisplay = () => {
    if (!currentSession) return 'Ready to Focus';
    
    switch (currentSession.type) {
      case 'work':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Session';
    }
  };

  const getSessionColor = () => {
    if (!currentSession) return 'from-primary-500 to-secondary-500';
    
    switch (currentSession.type) {
      case 'work':
        return 'from-primary-500 to-secondary-500';
      case 'shortBreak':
        return 'from-green-500 to-emerald-500';
      case 'longBreak':
        return 'from-blue-500 to-indigo-500';
      default:
        return 'from-primary-500 to-secondary-500';
    }
  };

  const handleTimerAction = () => {
    if (!currentSession) {
      startSession('work');
      toast.success('Focus session started!');
    } else if (isRunning) {
      pauseSession();
      toast('Timer paused');
    } else {
      resumeSession();
      toast.success('Timer resumed');
    }
  };

  const handleSkip = () => {
    skipSession();
    toast('Session skipped');
  };

  const handleReset = () => {
    resetTimer();
    toast('Timer reset');
  };

  const handleSettingsUpdate = () => {
    updateSettings(tempSettings);
    setShowSettings(false);
    toast.success('Settings updated');
  };

  const progress = currentSession ? 
    ((currentSession.duration * 60 - timeLeft) / (currentSession.duration * 60)) * 100 : 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Timer Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Pomodoro Timer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay focused and productive with the Pomodoro Technique
          </p>
        </div>

        {/* Main Timer Section */}
        <div className="glass glass-1 rounded-3xl p-8 border border-white/20 shadow-glass">
          <div className="text-center">
            {/* Session Type */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {getSessionTypeDisplay()}
              </h2>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Target className="h-4 w-4" />
                  <span>Session {sessionCount + 1}</span>
                </div>
                {currentTask && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{currentTask.title}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Timer Circle */}
            <div className="relative mb-12">
              <div className="h-80 w-80 mx-auto glass glass-2 rounded-full flex items-center justify-center border-8 border-white/10 relative overflow-hidden">
                {/* Progress Ring */}
                <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                  <circle
                    cx="160"
                    cy="160"
                    r="140"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200/30 dark:text-gray-700/30"
                  />
                  <circle
                    cx="160"
                    cy="160"
                    r="140"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 140}`}
                    strokeDashoffset={`${2 * Math.PI * 140 * (1 - progress / 100)}`}
                    className="transition-all duration-1000 ease-linear"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" className={`stop-color-primary-500`} />
                      <stop offset="100%" className={`stop-color-secondary-500`} />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Timer Display */}
                <div className="text-center z-10">
                  <div className="text-6xl font-mono font-bold text-gray-900 dark:text-white mb-2">
                    {currentSession ? formatTime(timeLeft) : formatTime(settings.workDuration * 60)}
                  </div>
                  <div className="text-lg text-gray-500 dark:text-gray-400">
                    {currentSession ? 
                      `${Math.floor(progress)}% complete` : 
                      'Ready to start'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center items-center space-x-6">
              <button
                onClick={handleReset}
                disabled={!currentSession}
                className="flex items-center justify-center h-14 w-14 glass glass-3 hover:glass hover:glass-2 text-gray-600 dark:text-gray-400 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="h-6 w-6" />
              </button>

              <button
                onClick={handleTimerAction}
                className={`flex items-center justify-center h-20 w-20 bg-gradient-to-r ${getSessionColor()} hover:shadow-lg text-white rounded-2xl transition-all duration-200 transform hover:scale-105`}
              >
                {isRunning ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
              </button>

              <button
                onClick={handleSkip}
                disabled={!currentSession}
                className="flex items-center justify-center h-14 w-14 glass glass-3 hover:glass hover:glass-2 text-gray-600 dark:text-gray-400 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipForward className="h-6 w-6" />
              </button>
            </div>

            {/* Session Info */}
            {currentSession && (
              <div className="mt-8 flex justify-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {Math.floor(sessionCount / 4)}
                  </div>
                  <div>Cycles</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {sessionCount}
                  </div>
                  <div>Sessions</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {Math.floor((sessionCount * settings.workDuration) / 60)}h
                  </div>
                  <div>Focus Time</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Task */}
          <div className="glass glass-2 rounded-2xl p-6 border border-white/20 shadow-glass">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Current Task
              </h3>
              <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                Change
              </button>
            </div>

            {currentTask ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {currentTask.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentTask.description}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <span className={`px-2 py-1 rounded-full ${
                    currentTask.priority === 'high' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : currentTask.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {currentTask.priority}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {currentTask.estimatedPomodoros} pomodoros
                  </span>
                </div>

                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(currentTask.completedPomodoros / currentTask.estimatedPomodoros) * 100}%` 
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {currentTask.completedPomodoros} / {currentTask.estimatedPomodoros} pomodoros completed
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No task selected
                </p>
                <button className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl transition-all duration-200">
                  Select Task
                </button>
              </div>
            )}
          </div>

          {/* Settings & Controls */}
          <div className="glass glass-2 rounded-2xl p-6 border border-white/20 shadow-glass">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Settings
              </h3>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 glass glass-3 hover:glass hover:glass-2 rounded-xl transition-all duration-200"
              >
                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {showSettings ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Work Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={tempSettings.workDuration}
                    onChange={(e) => setTempSettings(prev => ({ 
                      ...prev, 
                      workDuration: parseInt(e.target.value) 
                    }))}
                    className="w-full px-3 py-2 glass glass-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Short Break (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={tempSettings.shortBreakDuration}
                    onChange={(e) => setTempSettings(prev => ({ 
                      ...prev, 
                      shortBreakDuration: parseInt(e.target.value) 
                    }))}
                    className="w-full px-3 py-2 glass glass-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Long Break (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={tempSettings.longBreakDuration}
                    onChange={(e) => setTempSettings(prev => ({ 
                      ...prev, 
                      longBreakDuration: parseInt(e.target.value) 
                    }))}
                    className="w-full px-3 py-2 glass glass-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSettingsUpdate}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl transition-all duration-200"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setTempSettings(settings);
                      setShowSettings(false);
                    }}
                    className="flex-1 px-4 py-2 glass glass-3 hover:glass hover:glass-2 text-gray-600 dark:text-gray-400 rounded-xl transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Work Duration</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {settings.workDuration} min
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Short Break</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {settings.shortBreakDuration} min
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Long Break</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {settings.longBreakDuration} min
                  </span>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="flex items-center justify-between w-full p-3 glass glass-3 hover:glass hover:glass-2 rounded-xl transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      {soundEnabled ? (
                        <Volume2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      ) : (
                        <VolumeX className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Sound Notifications
                      </span>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      soundEnabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                        soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`} />
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Timer;