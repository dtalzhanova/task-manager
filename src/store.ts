import type { AppState, Employee, PersonalTask, Assignment, AssignmentExecutor, Comment, TaskColumn, AssignmentStatus, RecurringTemplate, RecurrenceRule } from './types';
import { sendWhatsApp, getWhatsAppSettings } from './notifications';

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Сотрудник 1', department: 'ХХХХХ', badgeColor: 'bg-blue-500' },
  { id: '2', name: 'Сотрудник 2', department: 'ХХХХХ', badgeColor: 'bg-purple-500' },
  { id: '3', name: 'Сотрудник 3', department: 'ХХХХХ', badgeColor: 'bg-green-500' },
  { id: '4', name: 'Сотрудник 4', department: 'ХХХХХ', badgeColor: 'bg-amber-500' },
];

const STORAGE_KEY = 'task-manager-state';
const DATA_VERSION = '2';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getNextOccurrence(rule: RecurrenceRule, after: Date): Date {
  const next = new Date(after);
  next.setHours(0, 0, 0, 0);

  switch (rule.type) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      return next;

    case 'weekday': {
      next.setDate(next.getDate() + 1);
      while (next.getDay() === 0 || next.getDay() === 6) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }

    case 'weekly': {
      const target = rule.dayOfWeek ?? 1;
      next.setDate(next.getDate() + 1);
      while (next.getDay() !== target) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }

    case 'biweekly': {
      const target2 = rule.dayOfWeek ?? 1;
      next.setDate(next.getDate() + 1);
      while (next.getDay() !== target2) {
        next.setDate(next.getDate() + 1);
      }
      if (Math.floor((next.getTime() - after.getTime()) / (7 * 24 * 60 * 60 * 1000)) < 1) {
        next.setDate(next.getDate() + 7);
      }
      return next;
    }

    case 'monthly': {
      const targetDay = rule.dayOfMonth ?? 1;
      next.setMonth(next.getMonth() + 1);
      const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(targetDay, maxDay));
      return next;
    }

    default:
      return next;
  }
}

function shouldGenerate(template: RecurringTemplate, today: Date): boolean {
  if (!template.active) return false;
  if (!template.lastGenerated) return true;

  const lastGen = new Date(template.lastGenerated);
  const nextOcc = getNextOccurrence(template.recurrence, lastGen);
  return today >= nextOcc;
}

function generateRecurringTasks(state: AppState): AppState {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let changed = false;
  const newTasks: PersonalTask[] = [];
  const updatedTemplates = state.recurringTemplates.map(template => {
    if (!shouldGenerate(template, today)) return template;
    changed = true;

    const lastGen = template.lastGenerated ? new Date(template.lastGenerated) : new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const nextOcc = getNextOccurrence(template.recurrence, lastGen);

    if (today >= nextOcc) {
      newTasks.push({
        id: generateId(),
        title: template.title,
        category: template.category,
        column: template.column,
        dueDate: toDateStr(nextOcc),
        createdAt: new Date().toISOString(),
        recurrence: template.recurrence,
        recurringSourceId: template.id,
      });
      return { ...template, lastGenerated: toDateStr(today) };
    }
    return template;
  });

  if (!changed) return state;
  return {
    ...state,
    personalTasks: [...state.personalTasks, ...newTasks],
    recurringTemplates: updatedTemplates,
  };
}

function loadState(): AppState {
  try {
    const version = localStorage.getItem(STORAGE_KEY + '-version');
    if (version !== DATA_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY + '-version', DATA_VERSION);
      return getDefaultState();
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...getDefaultState(), ...parsed };
    }
  } catch { /* ignore */ }
  return getDefaultState();
}

function getDefaultState(): AppState {
  return {
    personalTasks: [],
    assignments: [],
    employees: DEFAULT_EMPLOYEES,
    recurringTemplates: [],
    currentUser: { role: 'manager' },
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  };
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function createStore() {
  let state = loadState();
  state = generateRecurringTasks(state);
  saveState(state);

  const listeners = new Set<() => void>();

  function notify() {
    saveState(state);
    listeners.forEach(l => l());
  }

  return {
    getState: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    toggleDarkMode: () => {
      state = { ...state, darkMode: !state.darkMode };
      notify();
    },

    switchUser: (role: 'manager' | 'director', employeeId?: string) => {
      state = { ...state, currentUser: { role, employeeId } };
      notify();
    },

    // Personal tasks
    addPersonalTask: (task: Omit<PersonalTask, 'id' | 'createdAt'>) => {
      state = {
        ...state,
        personalTasks: [...state.personalTasks, { ...task, id: generateId(), createdAt: new Date().toISOString() }],
      };
      notify();
    },

    addRecurringTemplate: (template: Omit<RecurringTemplate, 'id' | 'createdAt' | 'lastGenerated' | 'active'>) => {
      const now = new Date();
      const newTemplate: RecurringTemplate = {
        ...template,
        id: generateId(),
        lastGenerated: null,
        active: true,
        createdAt: now.toISOString(),
      };
      state = { ...state, recurringTemplates: [...state.recurringTemplates, newTemplate] };
      state = generateRecurringTasks(state);
      notify();
    },

    toggleRecurringTemplate: (templateId: string) => {
      state = {
        ...state,
        recurringTemplates: state.recurringTemplates.map(t =>
          t.id === templateId ? { ...t, active: !t.active } : t
        ),
      };
      notify();
    },

    deleteRecurringTemplate: (templateId: string) => {
      state = {
        ...state,
        recurringTemplates: state.recurringTemplates.filter(t => t.id !== templateId),
      };
      notify();
    },

    updatePersonalTask: (taskId: string, updates: Partial<Pick<PersonalTask, 'title' | 'category' | 'column' | 'dueDate'>>) => {
      state = {
        ...state,
        personalTasks: state.personalTasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
      };
      notify();
    },

    updateAssignment: (assignmentId: string, updates: Partial<Pick<Assignment, 'title' | 'priority' | 'dueDate'>>) => {
      state = {
        ...state,
        assignments: state.assignments.map(a => a.id === assignmentId ? { ...a, ...updates } : a),
      };
      notify();
    },

    moveTask: (taskId: string, column: TaskColumn) => {
      state = {
        ...state,
        personalTasks: state.personalTasks.map(t => t.id === taskId ? { ...t, column } : t),
      };
      notify();
    },

    deletePersonalTask: (taskId: string) => {
      state = { ...state, personalTasks: state.personalTasks.filter(t => t.id !== taskId) };
      notify();
    },

    // Assignments
    addAssignment: (title: string, priority: 'urgent' | 'important' | 'normal', dueDate: string | null, executorIds: string[]) => {
      const executors: AssignmentExecutor[] = executorIds.map(id => ({
        employeeId: id,
        status: 'pending' as AssignmentStatus,
        comments: [],
      }));
      const assignment: Assignment = {
        id: generateId(),
        title,
        priority,
        dueDate,
        createdAt: new Date().toISOString(),
        executors,
        sharedWith: [],
      };
      state = { ...state, assignments: [...state.assignments, assignment] };
      notify();

      for (const execId of executorIds) {
        const emp = state.employees.find(e => e.id === execId);
        if (emp?.phone) {
          const dueLine = dueDate ? `\nСрок: ${new Date(dueDate).toLocaleDateString('ru-RU')}` : '';
          sendWhatsApp(emp.phone, `📋 Новое поручение: "${title}"${dueLine}`);
        }
      }
    },

    updateAssignmentStatus: (assignmentId: string, employeeId: string, status: AssignmentStatus) => {
      const prevAssignment = state.assignments.find(a => a.id === assignmentId);
      const prevStatus = prevAssignment?.executors.find(e => e.employeeId === employeeId)?.status;

      state = {
        ...state,
        assignments: state.assignments.map(a =>
          a.id === assignmentId
            ? { ...a, executors: a.executors.map(e => e.employeeId === employeeId ? { ...e, status } : e) }
            : a
        ),
      };
      notify();

      if (prevStatus !== status && state.currentUser.role === 'director' && prevAssignment) {
        const emp = state.employees.find(e => e.id === employeeId);
        const statusLabels: Record<AssignmentStatus, string> = { pending: 'В ожидании', in_progress: 'В работе', done: 'Выполнено' };
        const s = getWhatsAppSettings();
        if (s.managerPhone) {
          sendWhatsApp(s.managerPhone, `📊 ${emp?.name || 'Сотрудник'} изменил статус задачи "${prevAssignment.title}" → ${statusLabels[status]}`);
        }
      }
    },

    addComment: (assignmentId: string, employeeId: string, text: string, author: string, authorRole: 'manager' | 'director') => {
      const comment: Comment = { id: generateId(), author, authorRole, text, createdAt: new Date().toISOString() };
      state = {
        ...state,
        assignments: state.assignments.map(a =>
          a.id === assignmentId
            ? { ...a, executors: a.executors.map(e => e.employeeId === employeeId ? { ...e, comments: [...e.comments, comment] } : e) }
            : a
        ),
      };
      notify();

      const assignment = state.assignments.find(a => a.id === assignmentId);
      if (authorRole === 'director' && assignment) {
        const s = getWhatsAppSettings();
        if (s.managerPhone) {
          sendWhatsApp(s.managerPhone, `💬 ${author} прокомментировал "${assignment.title}":\n${text}`);
        }
      }
      if (authorRole === 'manager' && assignment) {
        const emp = state.employees.find(e => e.id === employeeId);
        if (emp?.phone) {
          sendWhatsApp(emp.phone, `💬 Руководитель прокомментировал "${assignment.title}":\n${text}`);
        }
      }
    },

    deleteAssignment: (assignmentId: string) => {
      state = { ...state, assignments: state.assignments.filter(a => a.id !== assignmentId) };
      notify();
    },

    shareAssignment: (assignmentId: string, _fromEmployeeId: string, toEmployeeIds: string[]) => {
      state = {
        ...state,
        assignments: state.assignments.map(a =>
          a.id === assignmentId
            ? { ...a, sharedWith: [...new Set([...a.sharedWith, ...toEmployeeIds])] }
            : a
        ),
      };
      notify();
    },

    unshareAssignment: (assignmentId: string, employeeId: string) => {
      state = {
        ...state,
        assignments: state.assignments.map(a =>
          a.id === assignmentId
            ? { ...a, sharedWith: a.sharedWith.filter(id => id !== employeeId) }
            : a
        ),
      };
      notify();
    },

    addEmployee: (name: string, department: string, phone?: string) => {
      const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500'];
      const employee: Employee = {
        id: generateId(),
        name,
        department,
        badgeColor: colors[state.employees.length % colors.length],
        phone,
      };
      state = { ...state, employees: [...state.employees, employee] };
      notify();
    },

    updateEmployee: (employeeId: string, updates: Partial<Pick<Employee, 'name' | 'department' | 'phone'>>) => {
      state = {
        ...state,
        employees: state.employees.map(e => e.id === employeeId ? { ...e, ...updates } : e),
      };
      notify();
    },

    deleteEmployee: (employeeId: string) => {
      state = {
        ...state,
        employees: state.employees.filter(e => e.id !== employeeId),
        assignments: state.assignments.map(a => ({
          ...a,
          executors: a.executors.filter(ex => ex.employeeId !== employeeId),
          sharedWith: a.sharedWith.filter(id => id !== employeeId),
        })).filter(a => a.executors.length > 0),
      };
      notify();
    },
  };
}

export type Store = ReturnType<typeof createStore>;
