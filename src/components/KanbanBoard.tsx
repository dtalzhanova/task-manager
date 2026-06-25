import { useState } from 'react';
import { DndContext, DragOverlay, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useStore, useAppState } from '../StoreContext';
import { COLUMNS, RECURRENCE_LABELS, WEEKDAYS, CATEGORIES, CATEGORY_COLORS } from '../types';
import type { TaskColumn, TaskCategory, PersonalTask, RecurrenceType } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { Plus, Repeat, Trash2, PauseCircle, PlayCircle } from 'lucide-react';
import { EditTaskModal } from './EditTaskModal';

const COLUMN_STYLES: Record<TaskColumn, string> = {
  urgent: 'border-t-red-500',
  important: 'border-t-amber-500',
  planned: 'border-t-blue-500',
  done: 'border-t-green-500',
};

export function KanbanBoard() {
  const store = useStore();
  const state = useAppState();
  const [showForm, setShowForm] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [isRecurringMode, setIsRecurringMode] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', category: 'work' as TaskCategory, column: 'planned' as TaskColumn, dueDate: '' });
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [activeTask, setActiveTask] = useState<PersonalTask | null>(null);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [mobileColumn, setMobileColumn] = useState<TaskColumn>('urgent');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const filteredTasks = state.personalTasks.filter(t => t.category === 'work');
  const columns = Object.keys(COLUMNS) as TaskColumn[];

  function handleDragStart(event: DragStartEvent) {
    const task = state.personalTasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const columnId = over.id as string;
      if (columns.includes(columnId as TaskColumn)) {
        store.moveTask(active.id as string, columnId as TaskColumn);
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    if (isRecurringMode) {
      store.addRecurringTemplate({
        title: newTask.title.trim(),
        category: newTask.category,
        column: newTask.column,
        recurrence: {
          type: recurrenceType,
          ...(recurrenceType === 'weekly' || recurrenceType === 'biweekly' ? { dayOfWeek } : {}),
          ...(recurrenceType === 'monthly' ? { dayOfMonth } : {}),
        },
      });
    } else {
      store.addPersonalTask({
        title: newTask.title.trim(),
        category: newTask.category,
        column: newTask.column,
        dueDate: newTask.dueDate || null,
      });
    }

    setNewTask({ title: '', category: 'work', column: 'planned', dueDate: '' });
    setIsRecurringMode(false);
    setShowForm(false);
  }

  function describeRecurrence(t: { recurrence: { type: RecurrenceType; dayOfWeek?: number; dayOfMonth?: number } }): string {
    const r = t.recurrence;
    switch (r.type) {
      case 'daily': return 'Каждый день';
      case 'weekday': return 'По будням (Пн–Пт)';
      case 'weekly': return `Каждый ${WEEKDAYS[r.dayOfWeek ?? 1].toLowerCase()}`;
      case 'biweekly': return `Раз в 2 нед. (${WEEKDAYS[r.dayOfWeek ?? 1].toLowerCase()})`;
      case 'monthly': return `${r.dayOfMonth}-го числа`;
      default: return '';
    }
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200";

  return (
    <div className="p-3 sm:p-6">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <div className="flex gap-2 ml-auto shrink-0">
          <button
            onClick={() => setShowRecurring(!showRecurring)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              showRecurring
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            <Repeat size={16} />
            <span className="hidden sm:inline">Повторяющиеся</span>
            {state.recurringTemplates.length > 0 && (
              <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs px-1.5 py-0.5 rounded-full">
                {state.recurringTemplates.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setShowForm(true); setIsRecurringMode(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm font-medium"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Новая задача</span>
            <span className="sm:hidden">Новая</span>
          </button>
        </div>
      </div>

      {/* Recurring panel */}
      {showRecurring && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Repeat size={14} /> Повторяющиеся задачи
            </h3>
            <button
              onClick={() => { setShowForm(true); setIsRecurringMode(true); }}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-xs font-medium"
            >
              <Plus size={14} /> <span className="hidden sm:inline">Добавить</span>
            </button>
          </div>
          {state.recurringTemplates.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-400">Нет повторяющихся задач.</p>
          ) : (
            <div className="space-y-2">
              {state.recurringTemplates.map(template => (
                <div key={template.id} className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border ${
                  template.active
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-100 opacity-60'
                }`}>
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Repeat size={14} className="text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-medium dark:text-gray-200 block truncate">{template.title}</span>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[template.category]}`}>
                          {CATEGORIES[template.category]}
                        </span>
                        <span className="text-xs text-gray-500">{describeRecurrence(template)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => store.toggleRecurringTemplate(template.id)} className="p-1 sm:p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                      {template.active ? <PauseCircle size={16} className="text-amber-500" /> : <PlayCircle size={16} className="text-green-500" />}
                    </button>
                    <button onClick={() => store.deleteRecurringTemplate(template.id)} className="p-1 sm:p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/edit form — modal on mobile */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-start justify-center z-[100] sm:relative sm:inset-auto sm:bg-transparent sm:mb-6" onClick={() => { setShowForm(false); setIsRecurringMode(false); }}>
          <form
            onSubmit={handleSubmit}
            onClick={e => e.stopPropagation()}
            className="w-full sm:w-auto bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-4 max-h-[85vh] overflow-y-auto"
          >
            {isRecurringMode && (
              <div className="flex items-center gap-2 mb-3">
                <Repeat size={16} className="text-amber-500" />
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Новая повторяющаяся задача</span>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Название</label>
                <input autoFocus value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="Что нужно сделать?" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Колонка</label>
                <select value={newTask.column} onChange={e => setNewTask(p => ({ ...p, column: e.target.value as TaskColumn }))} className={inputClass}>
                  {(Object.entries(COLUMNS) as [TaskColumn, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              {isRecurringMode ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Повтор</label>
                    <select value={recurrenceType} onChange={e => setRecurrenceType(e.target.value as RecurrenceType)} className={inputClass}>
                      {(Object.entries(RECURRENCE_LABELS) as [RecurrenceType, string][]).filter(([k]) => k !== 'none').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  {(recurrenceType === 'weekly' || recurrenceType === 'biweekly') && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">День недели</label>
                      <select value={dayOfWeek} onChange={e => setDayOfWeek(Number(e.target.value))} className={inputClass}>
                        {WEEKDAYS.map((name, i) => <option key={i} value={i}>{name}</option>)}
                      </select>
                    </div>
                  )}
                  {recurrenceType === 'monthly' && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Число месяца</label>
                      <select value={dayOfMonth} onChange={e => setDayOfMonth(Number(e.target.value))} className={inputClass}>
                        {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Срок</label>
                  <input type="date" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))} className={inputClass} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-4">
              {!isRecurringMode && (
                <button type="button" onClick={() => setIsRecurringMode(true)} className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <Repeat size={14} /> Повторяющаяся
                </button>
              )}
              {isRecurringMode && (
                <button type="button" onClick={() => setIsRecurringMode(false)} className="text-xs text-gray-500">Обычная</button>
              )}
              <div className="flex-1" />
              <button type="button" onClick={() => { setShowForm(false); setIsRecurringMode(false); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm dark:text-gray-300">Отмена</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                {isRecurringMode ? 'Создать' : 'Добавить'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile column tabs */}
      <div className="flex sm:hidden gap-1 mb-3 overflow-x-auto -mx-3 px-3">
        {columns.map(col => (
          <button
            key={col}
            onClick={() => setMobileColumn(col)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              mobileColumn === col
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {COLUMNS[col]}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${mobileColumn === col ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
              {filteredTasks.filter(t => t.column === col).length}
            </span>
          </button>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Desktop: 4-column grid */}
        <div className="hidden sm:grid grid-cols-4 gap-4">
          {columns.map(col => (
            <KanbanColumn key={col} id={col} title={COLUMNS[col]} count={filteredTasks.filter(t => t.column === col).length} className={COLUMN_STYLES[col]}>
              {filteredTasks.filter(t => t.column === col).map(task => (
                <TaskCard key={task.id} task={task} onDelete={() => store.deletePersonalTask(task.id)} onEdit={() => setEditingTask(task)} />
              ))}
            </KanbanColumn>
          ))}
        </div>

        {/* Mobile: single column view */}
        <div className="sm:hidden">
          <KanbanColumn id={mobileColumn} title={COLUMNS[mobileColumn]} count={filteredTasks.filter(t => t.column === mobileColumn).length} className={COLUMN_STYLES[mobileColumn]}>
            {filteredTasks.filter(t => t.column === mobileColumn).map(task => (
              <TaskCard key={task.id} task={task} onDelete={() => store.deletePersonalTask(task.id)} onEdit={() => setEditingTask(task)} />
            ))}
          </KanbanColumn>
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} overlay />}
        </DragOverlay>
      </DndContext>

      {editingTask && (
        <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} />
      )}
    </div>
  );
}
