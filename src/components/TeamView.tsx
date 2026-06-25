import { useState, useEffect } from 'react';
import { useAppState, useStore } from '../StoreContext';
import type { Employee } from '../types';
import { EmployeePage } from './EmployeePage';
import { UserPlus, Users, AlertCircle, CheckCircle, Pencil, Trash2, X, Settings, MessageCircle } from 'lucide-react';
import { getWhatsAppSettings, saveWhatsAppSettings } from '../notifications';

export function TeamView() {
  const state = useAppState();
  const store = useStore();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [showWhatsAppSettings, setShowWhatsAppSettings] = useState(false);
  const [waToken, setWaToken] = useState('');
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waManagerPhone, setWaManagerPhone] = useState('');
  const [waStatus, setWaStatus] = useState('');

  useEffect(() => {
    if (showWhatsAppSettings) {
      getWhatsAppSettings().then(s => {
        setWaManagerPhone(s.managerPhone);
        setWaStatus(s.hasToken ? 'Подключено' : 'Не настроено');
      });
    }
  }, [showWhatsAppSettings]);

  function getEmployeeStats(empId: string) {
    const tasks = state.assignments.filter(a => a.executors.some(e => e.employeeId === empId));
    const total = tasks.length;
    const overdue = tasks.filter(a => {
      const exec = a.executors.find(e => e.employeeId === empId);
      return a.dueDate && new Date(a.dueDate) < new Date() && exec?.status !== 'done';
    }).length;
    const done = tasks.filter(a => a.executors.find(e => e.employeeId === empId)?.status === 'done').length;
    const open = total - done;
    return { total, overdue, done, open };
  }

  function startEdit(emp: Employee, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditDept(emp.department);
    setEditPhone(emp.phone || '');
  }

  function saveEdit() {
    if (!editingEmployee || !editName.trim() || !editDept.trim()) return;
    store.updateEmployee(editingEmployee.id, {
      name: editName.trim(),
      department: editDept.trim(),
      phone: editPhone.trim() || undefined,
    });
    setEditingEmployee(null);
  }

  function handleDelete(empId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm(`Удалить сотрудника? Все его поручения тоже будут удалены.`)) {
      store.deleteEmployee(empId);
    }
  }

  if (selectedEmployee) {
    const fresh = state.employees.find(e => e.id === selectedEmployee.id);
    if (!fresh) return <div className="p-6">Сотрудник удалён</div>;
    return <EmployeePage employee={fresh} onBack={() => setSelectedEmployee(null)} />;
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg sm:text-xl font-bold dark:text-white">Команда</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowWhatsAppSettings(!showWhatsAppSettings)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showWhatsAppSettings
                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            <MessageCircle size={18} />
            WhatsApp
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs sm:text-sm font-medium"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Добавить сотрудника</span>
            <span className="sm:hidden">Добавить</span>
          </button>
        </div>
      </div>

      {showWhatsAppSettings && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <MessageCircle size={16} className="text-green-500" /> <span className="hidden sm:inline">Настройки</span> WhatsApp <span className="hidden sm:inline">уведомлений</span>
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${waStatus === 'Подключено' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-500'}`}>
              {waStatus}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Используется WhatsApp Business Cloud API (Meta). Получите токен и Phone Number ID на{' '}
            <span className="text-indigo-500">developers.facebook.com</span>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">API Token</label>
              <input
                type="password"
                value={waToken}
                onChange={e => setWaToken(e.target.value)}
                placeholder="EAAx..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone Number ID</label>
              <input
                value={waPhoneId}
                onChange={e => setWaPhoneId(e.target.value)}
                placeholder="1234567890"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ваш номер (руководитель)</label>
              <input
                value={waManagerPhone}
                onChange={e => setWaManagerPhone(e.target.value)}
                placeholder="+7XXXXXXXXXX"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200"
              />
            </div>
          </div>
          <button
            onClick={async () => {
              const ok = await saveWhatsAppSettings({
                apiToken: waToken || undefined,
                phoneNumberId: waPhoneId || undefined,
                managerPhone: waManagerPhone,
              });
              setWaStatus(ok ? 'Подключено' : 'Ошибка — сервер недоступен');
              if (ok) { setWaToken(''); setWaPhoneId(''); }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            Сохранить
          </button>
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={e => {
            e.preventDefault();
            if (newName.trim() && newDept.trim()) {
              store.addEmployee(newName.trim(), newDept.trim(), newPhone.trim() || undefined);
              setNewName('');
              setNewDept('');
              setNewPhone('');
              setShowAddForm(false);
            }
          }}
          className="mb-6 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-wrap gap-3 items-end"
        >
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">Имя</label>
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">Департамент</label>
            <input value={newDept} onChange={e => setNewDept(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">WhatsApp номер</label>
            <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+7XXXXXXXXXX" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200" />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Добавить</button>
          <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm dark:text-gray-300">Отмена</button>
        </form>
      )}

      {editingEmployee && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]" onClick={() => setEditingEmployee(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">Редактировать сотрудника</h3>
              <button onClick={() => setEditingEmployee(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Имя</label>
                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Департамент</label>
                <input value={editDept} onChange={e => setEditDept(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">WhatsApp номер</label>
                <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+7XXXXXXXXXX" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-200" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditingEmployee(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm dark:text-gray-300">Отмена</button>
                <button onClick={saveEdit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {state.employees.map(emp => {
          const stats = getEmployeeStats(emp.id);
          return (
            <div
              key={emp.id}
              onClick={() => setSelectedEmployee(emp)}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 text-left hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group cursor-pointer relative"
            >
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => startEdit(emp, e)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-500 transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={e => handleDelete(emp.id, e)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full ${emp.badgeColor} flex items-center justify-center text-white font-bold text-lg`}>
                  {emp.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {emp.name}
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${emp.badgeColor} text-white`}>
                    {emp.department}
                  </div>
                </div>
              </div>
              {emp.phone && (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-2">
                  <MessageCircle size={12} /> {emp.phone}
                </div>
              )}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Открытых</span>
                  <span className="font-medium dark:text-gray-200">{stats.open}</span>
                </div>
                {stats.overdue > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-500 flex items-center gap-1"><AlertCircle size={14} /> Просрочено</span>
                    <span className="font-medium text-red-600">{stats.overdue}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14} /> Выполнено</span>
                  <span className="font-medium text-green-600">{stats.done}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
