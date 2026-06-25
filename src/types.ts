export type TaskCategory = 'work' | 'personal';
export type TaskColumn = 'urgent' | 'important' | 'planned' | 'done';
export type TaskPriority = 'urgent' | 'important' | 'normal';
export type AssignmentStatus = 'pending' | 'in_progress' | 'done';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'weekday';

export interface RecurrenceRule {
  type: RecurrenceType;
  dayOfWeek?: number; // 0=Sun, 1=Mon, ..., 6=Sat — for 'weekly'/'biweekly'
  dayOfMonth?: number; // 1-31 — for 'monthly'
}

export interface PersonalTask {
  id: string;
  title: string;
  category: TaskCategory;
  column: TaskColumn;
  dueDate: string | null;
  createdAt: string;
  recurrence?: RecurrenceRule;
  recurringSourceId?: string;
}

export interface Comment {
  id: string;
  author: string;
  authorRole: 'manager' | 'director';
  text: string;
  createdAt: string;
}

export interface AssignmentExecutor {
  employeeId: string;
  status: AssignmentStatus;
  comments: Comment[];
}

export interface Assignment {
  id: string;
  title: string;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  executors: AssignmentExecutor[];
  sharedWith: string[];
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  badgeColor: string;
  phone?: string;
}

export interface RecurringTemplate {
  id: string;
  title: string;
  category: TaskCategory;
  column: TaskColumn;
  recurrence: RecurrenceRule;
  lastGenerated: string | null;
  active: boolean;
  createdAt: string;
}

export interface AppState {
  personalTasks: PersonalTask[];
  assignments: Assignment[];
  employees: Employee[];
  recurringTemplates: RecurringTemplate[];
  currentUser: { role: 'manager' | 'director'; employeeId?: string };
  darkMode: boolean;
}

export const CATEGORIES: Record<TaskCategory, string> = {
  work: 'Работа',
  personal: 'Личное',
};

export const COLUMNS: Record<TaskColumn, string> = {
  urgent: 'Срочно',
  important: 'Важно',
  planned: 'Запланировано',
  done: 'Готово',
};

export const STATUSES: Record<AssignmentStatus, string> = {
  pending: 'В ожидании',
  in_progress: 'В работе',
  done: 'Выполнено',
};

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: 'Без повтора',
  daily: 'Ежедневно',
  weekly: 'Еженедельно',
  biweekly: 'Раз в 2 недели',
  monthly: 'Ежемесячно',
  weekday: 'По будням',
};

export const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  work: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  personal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

export const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
