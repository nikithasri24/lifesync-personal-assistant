import { useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { useTasks } from '../hooks/useTasksQuery';
import type { TaskData } from '../services/types';

const Calendar: React.FC = () => {
  const { data: tasks = [] } = useTasks();

  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, TaskData[]>();
    tasks.filter((task): task is TaskData => !!task.dueDate)
      .forEach((task: TaskData) => {
        const key = format(task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate), 'yyyy-MM-dd');
        const existing = grouped.get(key) ?? [];
        grouped.set(key, [...existing, task]);
      });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(0, 14);
  }, [tasks]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Schedule</h1>
        <p className="text-sm text-slate-600">Upcoming tasks with due dates over the next two weeks.</p>
      </header>

      {tasksByDate.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          Nothing scheduled yet. Add due dates from the tasks view to see items here.
        </div>
      ) : (
        <ul className="space-y-4">
          {tasksByDate.map(([key, items]) => (
            <li key={key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays className="h-4 w-4" />
                <span className="font-medium text-slate-900">{format(new Date(key), 'EEEE, MMM d')}</span>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {items.map((task) => (
                  <li key={task.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    <div>
                      <p className="font-medium text-slate-900">{task.title}</p>
                      {task.description && <p className="text-xs text-slate-500">{task.description}</p>}
                    </div>
                    {task.completed && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Calendar;
