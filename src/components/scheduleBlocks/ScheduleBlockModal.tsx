import React, { useEffect, useState } from 'react';
import { format, addMinutes, parseISO } from 'date-fns';
import { X, Calendar, Trash2 } from 'lucide-react';
import type { ScheduleBlock } from '@/services/types';

interface ScheduleBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStart: Date | null;
  block: ScheduleBlock | null;
  onSave: (input: Omit<ScheduleBlock, 'id' | 'user_id' | 'created_at' | 'updated_at'>, id?: string) => void;
  onDelete: (id: string) => void;
}

const DEFAULT_TYPE: ScheduleBlock['type'] = 'focus';

export function ScheduleBlockModal({
  isOpen,
  onClose,
  initialStart,
  block,
  onSave,
  onDelete,
}: ScheduleBlockModalProps) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ScheduleBlock['type']>(DEFAULT_TYPE);
  const [color, setColor] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (block) {
      setDate(block.date);
      setStartTime(block.start_time);
      setEndTime(block.end_time);
      setTitle(block.title || '');
      setType(block.type || DEFAULT_TYPE);
      setColor(block.color || '');
      return;
    }

    if (initialStart) {
      const start = initialStart;
      const end = addMinutes(start, 60);
      setDate(format(start, 'yyyy-MM-dd'));
      setStartTime(format(start, 'HH:mm'));
      setEndTime(format(end, 'HH:mm'));
    }
    setTitle('');
    setType(DEFAULT_TYPE);
    setColor('');
  }, [isOpen, block, initialStart]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!date || !startTime || !endTime) return;
    if (parseISO(`${date}T${endTime}`) <= parseISO(`${date}T${startTime}`)) return;

    onSave(
      {
        date,
        start_time: startTime,
        end_time: endTime,
        title: title.trim() ? title.trim() : null,
        type,
        color: color.trim() ? color.trim() : null,
        is_recurring: false,
      },
      block?.id
    );
    onClose();
  };

  const handleDelete = () => {
    if (!block) return;
    onDelete(block.id);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#C18B5E] dark:text-[#E5B88A]" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {block ? 'Edit Schedule Block' : 'New Schedule Block'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Time block for focus, breaks, or events
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-slate-600 dark:text-slate-300">
                Date
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-600 dark:text-slate-300">
                Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ScheduleBlock['type'])}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="task">Task</option>
                  <option value="event">Event</option>
                  <option value="focus">Focus</option>
                  <option value="break">Break</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-slate-600 dark:text-slate-300">
                Start
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-600 dark:text-slate-300">
                End
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </label>
            </div>

            <label className="text-xs text-slate-600 dark:text-slate-300">
              Title
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Focus block, meeting, etc."
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="text-xs text-slate-600 dark:text-slate-300">
              Color (optional)
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#6366f1"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </label>
          </div>

          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            {block ? (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            ) : (
              <span className="text-xs text-slate-400"> </span>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-xs font-semibold bg-[#C18B5E] hover:bg-[#B5795A] text-white rounded-lg"
              >
                {block ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
