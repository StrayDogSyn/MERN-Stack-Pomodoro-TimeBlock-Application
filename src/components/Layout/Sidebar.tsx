import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Timer, 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const location = useLocation();
  const { logout } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Timer', href: '/timer', icon: Timer },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full glass glass-2 border-r border-white/20 shadow-glass">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 glass glass-3 rounded-xl flex items-center justify-center">
            <span className="text-lg font-bold gradient-text">SD</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              StrayDog
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pomodoro Timer
            </p>
          </div>
        </div>
        
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                ${isActive 
                  ? 'glass glass-3 text-primary-600 dark:text-primary-400 shadow-glass border border-primary-200/30' 
                  : 'text-gray-700 dark:text-gray-300 hover:glass hover:glass-2 hover:text-primary-600 dark:hover:text-primary-400'
                }
              `}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:glass hover:glass-2 transition-all duration-200"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;