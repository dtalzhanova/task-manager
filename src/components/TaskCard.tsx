import { useDraggable } from '@dnd-kit/core';
import { CATEGORIES, CATEGORY_COLORS } from '../types';
import type { PersonalTask, TaskCategory } from '../types';
import { Trash2, GripVertical, AlertCircle, Clock, Repeat, Pencil } from 'lucide-react';

function getDueStatus(dueDate: string | null): 'overdue' | 'soon' | 'ok' | null {
  if (!dueDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'overdue';
  if (diff <= 1) return 'soon';
  return 'ok';
}

interface Props {
  task: PersonalTask;
  onDelete?: () => void;
  onEdit?: () => void;
  overlay?: boolean;
}

export function TaskCard({ task, onDelete, onEdit, overlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;
  const dueStatus = getDueStatus(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 group cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-50' : ''
      } ${overlay ? 'shadow-lg rotate-2' : ''} ${
        dueStatus === 'overdue' ? 'border-l-4 border-l-red-500' : dueStatus === 'soon' ? 'border-l-4 border-l-amber-500' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <GripVertical size={14} className="text-gray-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">{task.title}</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {onEdit && (
            <button
              onClick={e => { e.stopPropagation(); e.preventDefault(); onEdit(); }}
              onPointerDown={e => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-500 transition-all p-0.5"
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); e.preventDefault(); onDelete(); }}
              onPointerDown={e => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[task.category as TaskCategory]}`}>
          {CATEGORIES[task.category as TaskCategory]}
        </span>
        {task.recurringSourceId && (
          <Repeat size={12} className="text-amber-500" title="Повторяющаяся" />
        )}
        {task.dueDate && (
          <span className={`text-xs flex items-center gap-1 ${
            dueStatus === 'overdue' ? 'text-red-600 dark:text-red-400' : dueStatus === 'soon' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'
          }`}>
            {dueStatus === 'overdue' ? <AlertCircle size={12} /> : <Clock size={12} />}
            {new Date(task.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  );
}
