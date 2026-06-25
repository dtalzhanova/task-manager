import { useState } from 'react';
import { useStore, useAppState } from '../StoreContext';
import { CATEGORIES, CATEGORY_COLORS, WEEKDAYS_SHORT } from '../types';
import type { TaskCategory, PersonalTask } from '../types';
import { Plus, Trash2, ChevronLeft, ChevronRight, Pencil, Repeat, CheckCircle2 } from 'lucide-react';
import { EditTaskModal } from './EditTaskModal';

interface Props {
  category: TaskCategory;
}

function getWeekDays(offset: number): Date[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function WeekCalendar({ category }: Props) {
  const store = useStore();
  const state = useAppState();
  const [weekOffset, setWeekOffset] = useState(0);
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);

  const days = getWeekDays(weekOffset);
  const tasks = state.personalTasks.filter(t => t.category === category);

  function getTasksForDate(dateStr: string) {
    return tasks.filter(t => t.dueDate === dateStr);
  }

  function getUnscheduled() {
    return tasks.filter(t => !t.dueDate && t.column !== 'done');
  }

  function handleAdd(dateStr: string) {
    if (!newTitle.trim()) return;
    store.addPersonalTask({
      title: newTitle.trim(),
      category,
      column: 'planned',
      dueDate: dateStr,
    });
    setNewTitle('');
    setAddingDate(null);
  }

  const weekStart = days[0];
  const weekEnd = days[6];
  const monthLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? weekStart.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
    : `${weekStart.toLocaleDateString('ru-RU', { month: 'short' })} – ${weekEnd.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })}`;

  const unscheduled = getUnscheduled();

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div className="text-center">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">{monthLabel}</span>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="ml-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              Сегодня
            </button>
          )}
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Desktop: horizontal week */}
      <div className="hidden sm:grid grid-cols-7 gap-2">
        {days.map(day => {
          const dateStr = toDateStr(day);
          const dayTasks = getTasksForDate(dateStr);
          const today = isToday(day);
          return (
            <div key={dateStr} className={`rounded-xl border p-2 min-h-[140px] flex flex-col ${
              today
                ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
            }`}>
              <div className="text-center mb-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">{WEEKDAYS_SHORT[day.getDay()]}</div>
                <div className={`text-sm font-semibold ${today ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'}`}>
                  {day.getDate()}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                {dayTasks.map(task => (
                  <div key={task.id} className={`group text-xs p-1.5 rounded-lg flex items-start gap-1 ${
                    task.column === 'done'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 line-through'
                      : `${CATEGORY_COLORS[category]} bg-opacity-50`
                  }`}>
                    <button
                      onClick={() => store.moveTask(task.id, task.column === 'done' ? 'planned' : 'done')}
                      className={`shrink-0 mt-0.5 ${task.column === 'done' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                    >
                      <CheckCircle2 size={12} />
                    </button>
                    <span className="flex-1 leading-tight">{task.title}</span>
                    {task.recurringSourceId && <Repeat size={10} className="text-amber-500 shrink-0 mt-0.5" />}
                    <div className="hidden group-hover:flex gap-0.5 shrink-0">
                      <button onClick={() => setEditingTask(task)} className="text-gray-400 hover:text-indigo-500"><Pencil size={10} /></button>
                      <button onClick={() => store.deletePersonalTask(task.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={10} /></button>
                    </div>
                  </div>
                ))}
              </div>
              {addingDate === dateStr ? (
                <form onSubmit={e => { e.preventDefault(); handleAdd(dateStr); }} className="mt-1">
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onBlur={() => { if (!newTitle.trim()) setAddingDate(null); }}
                    placeholder="Задача..."
                    className="w-full text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200"
                  />
                </form>
              ) : (
                <button
                  onClick={() => { setAddingDate(dateStr); setNewTitle(''); }}
                  className="mt-1 w-full text-xs text-gray-400 hover:text-indigo-500 flex items-center justify-center gap-1 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Plus size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical day list */}
      <div className="sm:hidden space-y-2">
        {days.map(day => {
          const dateStr = toDateStr(day);
          const dayTasks = getTasksForDate(dateStr);
          const today = isToday(day);
          return (
            <div key={dateStr} className={`rounded-xl border p-3 ${
              today
                ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${today ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {WEEKDAYS_SHORT[day.getDay()]}, {day.getDate()}
                  </span>
                  {today && <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-1.5 py-0.5 rounded-full">сегодня</span>}
                </div>
                <button
                  onClick={() => { setAddingDate(dateStr); setNewTitle(''); }}
                  className="p-1 text-gray-400 hover:text-indigo-500"
                >
                  <Plus size={16} />
                </button>
              </div>
              {dayTasks.length === 0 && addingDate !== dateStr && (
                <p className="text-xs text-gray-400">—</p>
              )}
              <div className="space-y-1">
                {dayTasks.map(task => (
                  <div key={task.id} className={`text-sm p-2 rounded-lg flex items-center gap-2 ${
                    task.column === 'done'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 line-through'
                      : `${CATEGORY_COLORS[category]} bg-opacity-50`
                  }`}>
                    <button
                      onClick={() => store.moveTask(task.id, task.column === 'done' ? 'planned' : 'done')}
                      className={`shrink-0 ${task.column === 'done' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <span className="flex-1">{task.title}</span>
                    {task.recurringSourceId && <Repeat size={12} className="text-amber-500 shrink-0" />}
                    <button onClick={() => setEditingTask(task)} className="text-gray-400 hover:text-indigo-500 p-0.5"><Pencil size={14} /></button>
                    <button onClick={() => store.deletePersonalTask(task.id)} className="text-gray-400 hover:text-red-500 p-0.5"><Trash2 size={14} /></button>
                  </div>
                ))}
                {addingDate === dateStr && (
                  <form onSubmit={e => { e.preventDefault(); handleAdd(dateStr); }} className="flex gap-2">
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onBlur={() => { if (!newTitle.trim()) setAddingDate(null); }}
                      placeholder="Новая задача..."
                      className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200"
                    />
                    <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm">OK</button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unscheduled tasks */}
      {unscheduled.length > 0 && (
        <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Без даты</h4>
          <div className="space-y-1">
            {unscheduled.map(task => (
              <div key={task.id} className="flex items-center gap-2 text-sm p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group">
                <span className="flex-1 text-gray-700 dark:text-gray-300">{task.title}</span>
                <button onClick={() => setEditingTask(task)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-500"><Pencil size={14} /></button>
                <button onClick={() => store.deletePersonalTask(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingTask && <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} />}
    </div>
  );
}
