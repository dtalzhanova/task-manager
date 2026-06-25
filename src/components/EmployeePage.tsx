import { useState } from 'react';
import { useAppState, useStore } from '../StoreContext';
import { STATUSES } from '../types';
import type { Employee, Assignment, AssignmentStatus, TaskPriority } from '../types';
import { ArrowLeft, Plus, Trash2, MessageSquare, AlertCircle, Clock, Share2, Users, Pencil } from 'lucide-react';
import { AssignmentDetail } from './AssignmentDetail';
import { EditAssignmentModal } from './EditAssignmentModal';

interface Props {
  employee: Employee;
  onBack: () => void;
}

export function EmployeePage({ employee, onBack }: Props) {
  const state = useAppState();
  const store = useStore();
  const isManager = state.currentUser.role === 'manager';
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [selectedExecutors, setSelectedExecutors] = useState<string[]>([employee.id]);
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const assignments = state.assignments.filter(a =>
    a.executors.some(e => e.employeeId === employee.id)
  );

  const sharedAssignments = state.assignments.filter(a =>
    a.sharedWith.includes(employee.id) && !a.executors.some(e => e.employeeId === employee.id)
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    store.addAssignment(title.trim(), priority, dueDate || null, selectedExecutors);
    setTitle('');
    setPriority('normal');
    setDueDate('');
    setSelectedExecutors([employee.id]);
    setShowForm(false);
  }

  function getDueStatus(dueDate: string | null, status: AssignmentStatus) {
    if (!dueDate || status === 'done') return null;
    const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'overdue';
    if (diff <= 1) return 'soon';
    return null;
  }

  function renderAssignment(assignment: Assignment, isShared = false) {
    const executor = assignment.executors.find(e => e.employeeId === employee.id);
    const status = executor?.status || 'pending';
    const dueStatus = getDueStatus(assignment.dueDate, status);
    const commentCount = executor?.comments.length || 0;

    return (
      <div key={assignment.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div
          className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 ${
            dueStatus === 'overdue' ? 'border-l-4 border-l-red-500' : dueStatus === 'soon' ? 'border-l-4 border-l-amber-500' : ''
          }`}
          onClick={() => setExpandedAssignment(expandedAssignment === assignment.id ? null : assignment.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                assignment.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                assignment.priority === 'important' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {assignment.priority === 'urgent' ? 'Срочно' : assignment.priority === 'important' ? 'Важно' : 'Обычное'}
              </span>
              <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{assignment.title}</span>
              {isShared && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  Общая
                </span>
              )}
              {assignment.executors.length > 1 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Users size={12} /> {assignment.executors.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {assignment.dueDate && (
                <span className={`text-xs flex items-center gap-1 ${
                  dueStatus === 'overdue' ? 'text-red-600' : dueStatus === 'soon' ? 'text-amber-600' : 'text-gray-500'
                }`}>
                  {dueStatus === 'overdue' ? <AlertCircle size={12} /> : <Clock size={12} />}
                  {new Date(assignment.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
              )}
              {commentCount > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MessageSquare size={12} /> {commentCount}
                </span>
              )}
              {(isManager || (!isShared && state.currentUser.employeeId === employee.id)) && (
                <select
                  value={status}
                  onChange={e => { e.stopPropagation(); store.updateAssignmentStatus(assignment.id, employee.id, e.target.value as AssignmentStatus); }}
                  onClick={e => e.stopPropagation()}
                  className={`text-xs px-2 py-1 rounded border-0 font-medium ${
                    status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {(Object.entries(STATUSES) as [AssignmentStatus, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              )}
              {isShared && (
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>{STATUSES[status]}</span>
              )}
              {isManager && (
                <button
                  onClick={e => { e.stopPropagation(); setEditingAssignment(assignment); }}
                  className="text-gray-400 hover:text-indigo-500 transition-colors"
                >
                  <Pencil size={14} />
                </button>
              )}
              {isManager && (
                <button
                  onClick={e => { e.stopPropagation(); store.deleteAssignment(assignment.id); }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
        {expandedAssignment === assignment.id && (
          <AssignmentDetail assignment={assignment} employeeId={employee.id} isShared={isShared} />
        )}
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <button onClick={onBack} className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${employee.badgeColor} flex items-center justify-center text-white font-bold shrink-0`}>
          {employee.name[0]}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold dark:text-white truncate">{employee.name}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${employee.badgeColor} text-white`}>{employee.department}</span>
        </div>
        {isManager && (
          <button
            onClick={() => setShowForm(true)}
            className="ml-auto flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs sm:text-sm font-medium shrink-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Новое поручение</span>
            <span className="sm:hidden">Новое</span>
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3 sm:items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Название</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200" placeholder="Описание поручения" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Приоритет</label>
            <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200">
              <option value="urgent">Срочно</option>
              <option value="important">Важно</option>
              <option value="normal">Обычное</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Срок</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Исполнители</label>
            <div className="flex flex-wrap gap-2">
              {state.employees.map(emp => (
                <label key={emp.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs cursor-pointer border transition-colors ${
                  selectedExecutors.includes(emp.id)
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={selectedExecutors.includes(emp.id)}
                    onChange={e => {
                      setSelectedExecutors(prev =>
                        e.target.checked ? [...prev, emp.id] : prev.filter(id => id !== emp.id)
                      );
                    }}
                    className="sr-only"
                  />
                  <span className={`w-4 h-4 rounded-full ${emp.badgeColor} inline-block`} />
                  {emp.name}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Добавить</button>
          <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm dark:text-gray-300">Отмена</button>
        </form>
      )}

      <div className="space-y-2">
        {assignments.length === 0 && sharedAssignments.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Нет поручений
          </div>
        )}
        {assignments.map(a => renderAssignment(a))}
      </div>

      {sharedAssignments.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-8 mb-3 flex items-center gap-2">
            <Share2 size={16} /> Общие задачи
          </h3>
          <div className="space-y-2">
            {sharedAssignments.map(a => renderAssignment(a, true))}
          </div>
        </>
      )}

      {editingAssignment && (
        <EditAssignmentModal assignment={editingAssignment} onClose={() => setEditingAssignment(null)} />
      )}
    </div>
  );
}
