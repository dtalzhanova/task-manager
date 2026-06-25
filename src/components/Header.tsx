import { Moon, Sun, LayoutDashboard, Users } from 'lucide-react';
import { useStore, useAppState } from '../StoreContext';

interface HeaderProps {
  activeTab: 'tasks' | 'team';
  onTabChange: (tab: 'tasks' | 'team') => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const store = useStore();
  const state = useAppState();

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400 shrink-0">TaskFlow</h1>

        <div className="flex items-center gap-2 sm:gap-3">
          {state.currentUser.role === 'manager' ? (
            <select
              className="text-xs sm:text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 dark:text-gray-300 max-w-[130px] sm:max-w-none"
              value={state.currentUser.role}
              onChange={e => {
                if (e.target.value === 'manager') {
                  store.switchUser('manager');
                } else {
                  store.switchUser('director', e.target.value);
                }
              }}
            >
              <option value="manager">Руководитель</option>
              {state.employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {state.employees.find(e => e.id === state.currentUser.employeeId)?.name}
              </span>
              <button
                onClick={() => store.switchUser('manager')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Выйти
              </button>
            </div>
          )}

          <button
            onClick={store.toggleDarkMode}
            className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {state.darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {state.currentUser.role === 'manager' && (
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex sticky top-[45px] sm:top-[52px] z-40">
          <button
            onClick={() => onTabChange('tasks')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'tasks'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/20'
                : 'border-transparent text-gray-500 dark:text-gray-400'
            }`}
          >
            <LayoutDashboard size={18} />
            Мои задачи
          </button>
          <button
            onClick={() => onTabChange('team')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'team'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/20'
                : 'border-transparent text-gray-500 dark:text-gray-400'
            }`}
          >
            <Users size={18} />
            Команда
          </button>
        </nav>
      )}
    </>
  );
}
