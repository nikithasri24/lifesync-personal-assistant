import { Popover } from '@headlessui/react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import React, { useMemo, useState } from 'react'

interface DatePickerPopoverProps {
  value: Date
  onChange: (d: Date) => void
  weekStartsOn?: 0 | 1
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function DatePickerPopover({ value, onChange, weekStartsOn = 0 }: DatePickerPopoverProps) {
  const [month, setMonth] = useState<Date>(startOfMonth(value))
  const [selected, setSelected] = useState<Date>(value)

  React.useEffect(() => {
    setSelected(value)
    setMonth(startOfMonth(value))
  }, [value])

  const grid = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn })
    return eachDayOfInterval({ start, end })
  }, [month, weekStartsOn])

  const weekDayLabels = useMemo(() => {
    return [...DAY_LABELS.slice(weekStartsOn), ...DAY_LABELS.slice(0, weekStartsOn)]
  }, [weekStartsOn])

  const handleToday = (): void => {
    const today = new Date()
    setSelected(today)
    setMonth(startOfMonth(today))
    onChange(today)
  }

  return (
    <Popover className="relative">
      <Popover.Button className="inline-flex items-center gap-2 rounded-full border-2 border-indigo-500 bg-slate-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <Calendar className="h-4 w-4" />
        {format(selected, 'MMM d, yyyy')}
      </Popover.Button>

      <Popover.Overlay className="fixed inset-0 z-40 bg-black/20" />

      <Popover.Panel className="absolute right-0 z-50 mt-2 w-[280px] rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
        {/* Month navigation */}
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={() => setMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-semibold text-slate-900">{format(month, 'MMMM yyyy')}</div>
          <button
            type="button"
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day labels */}
        <div className="mb-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {weekDayLabels.map((label, i) => (
            <div key={`${label}-${i}`} className="select-none text-center text-xs font-medium text-slate-500">
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {grid.map((day) => {
            const inMonth = isSameMonth(day, month)
            const isSelected = isSameDay(day, selected)
            const isToday = isSameDay(day, new Date())

            return (
              <button
                key={day.toISOString()}
                type="button"
                className={`flex h-9 items-center justify-center rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                  isSelected
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : isToday
                      ? 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200'
                      : inMonth
                        ? 'text-slate-900 hover:bg-slate-100'
                        : 'text-slate-400 hover:bg-slate-50'
                }`}
                onClick={() => {
                  setSelected(day)
                  onChange(day)
                }}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>

        {/* Quick action */}
        <div className="mt-3 border-t border-slate-200 pt-3">
          <button
            type="button"
            className="w-full rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={handleToday}
          >
            Jump to today
          </button>
        </div>
      </Popover.Panel>
    </Popover>
  )
}
