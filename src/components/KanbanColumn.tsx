import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';

interface Props {
  id: string;
  title: string;
  count: number;
  className?: string;
  children: ReactNode;
}

export function KanbanColumn({ id, title, count, className, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-100 dark:bg-gray-900 rounded-xl border-t-4 ${className} min-h-[300px] flex flex-col transition-colors ${
        isOver ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">{title}</h3>
        <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="flex-1 px-2 pb-2 space-y-2">
        {children}
      </div>
    </div>
  );
}
