import { useState } from 'react';
import { useStore } from '../StoreContext';
import { CATEGORIES, COLUMNS } from '../types';
import type { PersonalTask, TaskCategory, TaskColumn } from '../types';
import { X } from 'lucide-react';

interface Props {
  task: PersonalTask;
  onClose: () => void;
}

export function EditTaskModal({ task, onClose }: Props) {
  const store = useStore();
  const [title, setTitle] = useState(task.title);
  const [category, setCategory] = useState(task.category);
  const [column, setColumn] = useState(task.column);
  const [dueDate, setDueDate] = useState(task.dueDate || '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    store.updatePersonalTask(task.id, {
      title: title.trim(),
      category,
      column,
      dueDate: dueDate || null,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Редактировать задачу</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Название</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Категория</label>
              <select value={category} onChange={e => setCategory(e.target.value as TaskCategory)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200">
                {(Object.entries(CATEGORIES) as [TaskCategory, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Колонка</label>
              <select value={column} onChange={e => setColumn(e.target.value as TaskColumn)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200">
                {(Object.entries(COLUMNS) as [TaskColumn, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Срок</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm dark:text-gray-300">Отмена</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
}
