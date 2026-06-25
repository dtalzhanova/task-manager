import { useAppState } from '../StoreContext';
import { EmployeePage } from './EmployeePage';

export function DirectorView() {
  const state = useAppState();
  const employee = state.employees.find(e => e.id === state.currentUser.employeeId);

  if (!employee) {
    return <div className="p-6 text-center text-gray-500">Сотрудник не найден</div>;
  }

  return <EmployeePage employee={employee} onBack={() => {}} />;
}
