import { Menu, Bell, User, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTimerStore } from '../../store/timerStore';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { user } = useAuthStore();
  const { isRunning, currentSession, timeLeft } = useTimerStore();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="glass glass-1 border-b border-white/20 shadow-glass">
      <div className="flex items-center justify-between px-4 py-4 lg:px-8">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Timer status */}
          {isRunning && currentSession && (
            <div className="hidden sm:flex items-center space-x-3 glass glass-2 px-4 py-2 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {currentSession.type === 'work' ? 'Focus Time' : 'Break Time'}
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-primary-600 dark:text-primary-400">
                {formatTime(timeLeft)}
              </div>
            </div>
          )}
        </div>

        {/* Center - Search (hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks, time blocks..."
              className="w-full pl-10 pr-4 py-2 glass glass-2 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3 glass glass-2 px-3 py-2 rounded-xl">
            <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                @{user?.username}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;