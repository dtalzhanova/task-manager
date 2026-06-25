import { useState } from 'react';
import { useAppState, useStore } from '../StoreContext';
import { STATUSES } from '../types';
import type { Assignment } from '../types';
import { Send, Share2, X, Users } from 'lucide-react';

interface Props {
  assignment: Assignment;
  employeeId: string;
  isShared?: boolean;
}

export function AssignmentDetail({ assignment, employeeId, isShared }: Props) {
  const state = useAppState();
  const store = useStore();
  const isManager = state.currentUser.role === 'manager';
  const [comment, setComment] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  const executor = assignment.executors.find(e => e.employeeId === employeeId);
  const comments = executor?.comments || [];

  const currentUserName = isManager
    ? 'Руководитель'
    : state.employees.find(e => e.id === state.currentUser.employeeId)?.name || '';

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    store.addComment(
      assignment.id,
      employeeId,
      comment.trim(),
      currentUserName,
      state.currentUser.role
    );
    setComment('');
  }

  const canComment = isManager || state.currentUser.employeeId === employeeId || isShared;
  const isOriginalExecutor = assignment.executors.some(e => e.employeeId === state.currentUser.employeeId);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-850">
      {isManager && assignment.executors.length > 1 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
            <Users size={14} /> Исполнители
          </h4>
          <div className="space-y-1">
            {assignment.executors.map(exec => {
              const emp = state.employees.find(e => e.id === exec.employeeId);
              if (!emp) return null;
              return (
                <div key={exec.employeeId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full ${emp.badgeColor} flex items-center justify-center text-white text-xs font-bold`}>{emp.name[0]}</span>
                    <span className="dark:text-gray-300">{emp.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    exec.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    exec.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>{STATUSES[exec.status]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isManager && assignment.sharedWith.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">Поделились с:</h4>
          <div className="flex gap-2">
            {assignment.sharedWith.map(id => {
              const emp = state.employees.find(e => e.id === id);
              return emp ? (
                <span key={id} className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  {emp.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {!isManager && isOriginalExecutor && !isShared && (
        <button
          onClick={() => setShowShareModal(true)}
          className="mb-4 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <Share2 size={14} /> Поделиться
        </button>
      )}

      {showShareModal && (
        <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium dark:text-gray-200">Поделиться с:</span>
            <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="space-y-1">
            {state.employees
              .filter(e => e.id !== employeeId && !assignment.executors.some(ex => ex.employeeId === e.id))
              .map(emp => (
                <button
                  key={emp.id}
                  onClick={() => {
                    store.shareAssignment(assignment.id, employeeId, [emp.id]);
                    setShowShareModal(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-gray-300"
                >
                  <span className={`w-6 h-6 rounded-full ${emp.badgeColor} flex items-center justify-center text-white text-xs font-bold`}>{emp.name[0]}</span>
                  {emp.name} — {emp.department}
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">Комментарии</h4>
        {comments.length === 0 && <p className="text-xs text-gray-400">Нет комментариев</p>}
        {comments.map(c => (
          <div key={c.id} className={`p-3 rounded-lg text-sm ${
            c.authorRole === 'manager'
              ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-xs text-gray-700 dark:text-gray-300">{c.author}</span>
              <span className="text-xs text-gray-400">
                {new Date(c.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-gray-800 dark:text-gray-200">{c.text}</p>
          </div>
        ))}
      </div>

      {canComment && (
        <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
          <input
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200"
            placeholder="Написать комментарий..."
          />
          <button type="submit" className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Send size={16} />
          </button>
        </form>
      )}
    </div>
  );
}
