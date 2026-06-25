import { useState, useEffect } from 'react';
import { useAppState } from './StoreContext';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { TeamView } from './components/TeamView';
import { DirectorView } from './components/DirectorView';
import { WeekCalendar } from './components/WeekCalendar';
import type { TaskCategory } from './types';
import { CATEGORIES, CATEGORY_COLORS } from './types';
import { Briefcase, User } from 'lucide-react';

const CATEGORY_ICONS: Record<TaskCategory, typeof Briefcase> = {
  work: Briefcase,
  personal: User,
};

function App() {
  const state = useAppState();
  const [activeTab, setActiveTab] = useState<'tasks' | 'team'>('tasks');
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('work');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode);
  }, [state.darkMode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      {state.currentUser.role === 'director' ? (
        <DirectorView />
      ) : activeTab === 'tasks' ? (
        <>
          {/* Category tabs */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 sm:px-6">
            <div className="flex gap-1">
              {(Object.entries(CATEGORIES) as [TaskCategory, string][]).map(([key, label]) => {
                const Icon = CATEGORY_ICONS[key];
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                      activeCategory === key
                        ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeCategory === 'work' ? (
            <KanbanBoard />
          ) : (
            <div className="p-3 sm:p-6">
              <WeekCalendar category="personal" />
            </div>
          )}
        </>
      ) : (
        <TeamView />
      )}
    </div>
  );
}

export default App;
