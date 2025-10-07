import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Brand */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 glass glass-2 rounded-2xl flex items-center justify-center mb-4">
            <div className="text-2xl font-bold gradient-text">SD</div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            StrayDog Pomodoro
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Focus. Achieve. Repeat.
          </p>
        </div>

        {/* Auth Form Container */}
        <div className="glass glass-2 rounded-2xl p-8 border border-white/20 shadow-glass">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>&copy; 2024 StrayDog Syndicate. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;