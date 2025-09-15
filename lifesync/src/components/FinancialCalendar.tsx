import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Bell,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Target,
  Briefcase,
  Home,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Filter,
  Download,
  Settings,
  X,
  Save
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'bill_due' | 'income' | 'investment' | 'goal_milestone' | 'reminder' | 'tax_deadline' | 'subscription';
  amount?: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'upcoming' | 'completed' | 'overdue' | 'cancelled';
  description?: string;
  recurrence?: 'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  reminderDays?: number[];
  isAutomatic: boolean;
  linkedId?: string; // Links to bills, goals, etc.
}

interface FinancialMilestone {
  id: string;
  name: string;
  targetDate: Date;
  targetAmount: number;
  currentAmount: number;
  category: 'savings' | 'debt_payoff' | 'investment' | 'emergency_fund';
  progress: number;
}

const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'Rent Payment',
    date: new Date('2024-02-01'),
    type: 'bill_due',
    amount: 1800,
    category: 'housing',
    priority: 'high',
    status: 'upcoming',
    recurrence: 'monthly',
    isAutomatic: true,
    linkedId: 'bill_1'
  },
  {
    id: '2',
    title: 'Salary Deposit',
    date: new Date('2024-01-31'),
    type: 'income',
    amount: 5500,
    category: 'salary',
    priority: 'high',
    status: 'upcoming',
    recurrence: 'monthly',
    isAutomatic: true
  },
  {
    id: '3',
    title: 'Electric Bill Due',
    date: new Date('2024-01-25'),
    type: 'bill_due',
    amount: 125,
    category: 'utilities',
    priority: 'medium',
    status: 'upcoming',
    recurrence: 'monthly',
    isAutomatic: false,
    linkedId: 'bill_2'
  },
  {
    id: '4',
    title: 'Emergency Fund Goal',
    date: new Date('2024-03-15'),
    type: 'goal_milestone',
    amount: 10000,
    category: 'savings',
    priority: 'medium',
    status: 'upcoming',
    description: 'Reach $10,000 emergency fund target',
    isAutomatic: false
  },
  {
    id: '5',
    title: 'Investment Contribution',
    date: new Date('2024-02-01'),
    type: 'investment',
    amount: 1200,
    category: 'retirement',
    priority: 'medium',
    status: 'upcoming',
    recurrence: 'monthly',
    isAutomatic: true
  },
  {
    id: '6',
    title: 'Car Insurance Due',
    date: new Date('2024-01-20'),
    type: 'bill_due',
    amount: 145,
    category: 'insurance',
    priority: 'medium',
    status: 'completed',
    recurrence: 'monthly',
    isAutomatic: true
  },
  {
    id: '7',
    title: 'Tax Filing Deadline',
    date: new Date('2024-04-15'),
    type: 'tax_deadline',
    category: 'taxes',
    priority: 'high',
    status: 'upcoming',
    description: 'Federal tax return due',
    isAutomatic: false
  },
  {
    id: '8',
    title: 'Netflix Subscription',
    date: new Date('2024-01-22'),
    type: 'subscription',
    amount: 15.99,
    category: 'entertainment',
    priority: 'low',
    status: 'completed',
    recurrence: 'monthly',
    isAutomatic: true
  },
  {
    id: '9',
    title: 'Credit Card Payment',
    date: new Date('2024-01-28'),
    type: 'bill_due',
    amount: 450,
    category: 'debt',
    priority: 'high',
    status: 'upcoming',
    recurrence: 'monthly',
    isAutomatic: false
  },
  {
    id: '10',
    title: 'Quarterly Investment Review',
    date: new Date('2024-03-31'),
    type: 'reminder',
    category: 'investment',
    priority: 'medium',
    status: 'upcoming',
    description: 'Review portfolio performance and rebalance',
    recurrence: 'quarterly',
    isAutomatic: false
  }
];

const FINANCIAL_MILESTONES: FinancialMilestone[] = [
  {
    id: '1',
    name: 'Emergency Fund',
    targetDate: new Date('2024-03-15'),
    targetAmount: 10000,
    currentAmount: 7500,
    category: 'emergency_fund',
    progress: 75
  },
  {
    id: '2',
    name: 'Credit Card Payoff',
    targetDate: new Date('2024-06-30'),
    targetAmount: 0,
    currentAmount: 3500,
    category: 'debt_payoff',
    progress: 65
  },
  {
    id: '3',
    name: 'Vacation Fund',
    targetDate: new Date('2024-07-01'),
    targetAmount: 5000,
    currentAmount: 2100,
    category: 'savings',
    progress: 42
  }
];

export default function FinancialCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_CALENDAR_EVENTS);
  const [milestones] = useState<FinancialMilestone[]>(FINANCIAL_MILESTONES);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [showValues, setShowValues] = useState(true);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    type: 'bill_due' as const,
    amount: '',
    category: 'utilities',
    priority: 'medium' as const,
    description: '',
    recurrence: 'none' as const
  });

  const formatValue = (value: number) => {
    if (!showValues) return '•••••';
    return `$${value.toLocaleString()}`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'bill_due': return CreditCard;
      case 'income': return TrendingUp;
      case 'investment': return Briefcase;
      case 'goal_milestone': return Target;
      case 'reminder': return Bell;
      case 'tax_deadline': return AlertTriangle;
      case 'subscription': return Clock;
      default: return Calendar;
    }
  };

  const getEventColor = (type: string, status: string) => {
    if (status === 'completed') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'overdue') return 'bg-red-100 text-red-800 border-red-200';
    
    switch (type) {
      case 'bill_due': return 'bg-red-50 text-red-700 border-red-200';
      case 'income': return 'bg-green-50 text-green-700 border-green-200';
      case 'investment': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'goal_milestone': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'reminder': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'tax_deadline': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'subscription': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getUpcomingEvents = (days: number = 7) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now && eventDate <= futureDate && event.status !== 'completed';
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getOverdueEvents = () => {
    const now = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate < now && event.status !== 'completed';
    });
  };

  const getMonthTotal = (type: 'income' | 'expenses') => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= monthStart && eventDate <= monthEnd && event.amount;
      })
      .filter(event => {
        if (type === 'income') {
          return event.type === 'income';
        } else {
          return event.type === 'bill_due' || event.type === 'subscription';
        }
      })
      .reduce((sum, event) => sum + (event.amount || 0), 0);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleAddEvent = () => {
    if (!eventForm.title || !eventForm.date) return;

    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: eventForm.title,
      date: new Date(eventForm.date),
      type: eventForm.type,
      amount: eventForm.amount ? parseFloat(eventForm.amount) : undefined,
      category: eventForm.category,
      priority: eventForm.priority,
      status: 'upcoming',
      description: eventForm.description,
      recurrence: eventForm.recurrence,
      isAutomatic: false
    };

    setEvents([...events, newEvent]);
    setShowAddEvent(false);
    setEventForm({
      title: '',
      date: '',
      type: 'bill_due',
      amount: '',
      category: 'utilities',
      priority: 'medium',
      description: '',
      recurrence: 'none'
    });
  };

  const markEventComplete = (eventId: string) => {
    setEvents(events.map(event =>
      event.id === eventId ? { ...event, status: 'completed' as const } : event
    ));
  };

  const filteredEvents = eventFilter === 'all' ? events : 
    events.filter(event => event.type === eventFilter);

  const upcomingEvents = getUpcomingEvents();
  const overdueEvents = getOverdueEvents();
  const monthlyIncome = getMonthTotal('income');
  const monthlyExpenses = getMonthTotal('expenses');

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-32 p-2 bg-gray-50 border border-gray-200"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      days.push(
        <div 
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`min-h-32 p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
            isToday ? 'bg-blue-50 border-blue-300' : 
            isSelected ? 'bg-blue-100 border-blue-400' : 
            'bg-white'
          }`}
        >
          <div className={`text-sm font-medium mb-2 ${
            isToday ? 'text-blue-600' : 'text-gray-900'
          }`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => {
              const Icon = getEventIcon(event.type);
              return (
                <div 
                  key={event.id}
                  className={`text-xs p-1 rounded border ${getEventColor(event.type, event.status)}`}
                >
                  <div className="flex items-center space-x-1">
                    <Icon size={10} />
                    <span className="truncate">{event.title}</span>
                  </div>
                  {event.amount && (
                    <div className="font-medium">{formatValue(event.amount)}</div>
                  )}
                </div>
              );
            })}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-8 h-8 mr-3 text-indigo-600" />
            Financial Calendar
          </h3>
          <p className="text-gray-600">Track important financial dates and deadlines</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowValues(!showValues)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="ml-2">{showValues ? 'Hide' : 'Show'} Values</span>
          </button>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={16} className="mr-2" />
            Export
          </button>
          
          <button
            onClick={() => setShowAddEvent(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Add Event
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Overdue Items</p>
              <p className="text-2xl font-bold text-red-900">{overdueEvents.length}</p>
              <p className="text-xs text-red-700">Need attention</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Upcoming (7 days)</p>
              <p className="text-2xl font-bold text-orange-900">{upcomingEvents.length}</p>
              <p className="text-xs text-orange-700">items scheduled</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Monthly Income</p>
              <p className="text-2xl font-bold text-green-900">{formatValue(monthlyIncome)}</p>
              <p className="text-xs text-green-700">projected</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Monthly Bills</p>
              <p className="text-2xl font-bold text-blue-900">{formatValue(monthlyExpenses)}</p>
              <p className="text-xs text-blue-700">scheduled</p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-l-lg ${
                  viewMode === 'month' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'week' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-r-lg ${
                  viewMode === 'agenda' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Agenda
              </button>
            </div>

            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Events</option>
              <option value="bill_due">Bills Due</option>
              <option value="income">Income</option>
              <option value="investment">Investments</option>
              <option value="goal_milestone">Goal Milestones</option>
              <option value="reminder">Reminders</option>
              <option value="tax_deadline">Tax Deadlines</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <h4 className="text-lg font-semibold text-gray-900 min-w-48 text-center">
              {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h4>
            
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'month' ? (
        /* Month View */
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center text-sm font-medium text-gray-700 bg-gray-50">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {renderCalendarGrid()}
          </div>
        </div>
      ) : viewMode === 'week' ? (
        /* Week View */
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Week view coming soon</p>
              <p className="text-sm text-gray-500 mt-1">Detailed weekly schedule layout</p>
            </div>
          </div>
        </div>
      ) : (
        /* Agenda View */
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events (Next 7 Days)</h4>
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const Icon = getEventIcon(event.type);
                  const daysUntil = Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={event.id} className={`p-4 rounded-lg border ${getEventColor(event.type, event.status)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <Icon size={20} />
                          <div>
                            <h5 className="font-medium text-gray-900">{event.title}</h5>
                            <p className="text-sm text-gray-600">
                              {event.date.toLocaleDateString()} 
                              {daysUntil === 0 ? ' (Today)' : daysUntil === 1 ? ' (Tomorrow)' : ` (${daysUntil} days)`}
                            </p>
                            {event.description && (
                              <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {event.amount && (
                            <span className="text-lg font-bold">{formatValue(event.amount)}</span>
                          )}
                          {event.status !== 'completed' && (
                            <button
                              onClick={() => markEventComplete(event.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Mark Complete"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Financial Milestones */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Financial Milestones</h4>
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{milestone.name}</h5>
                    <span className="text-sm text-gray-600">
                      Due: {milestone.targetDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      {formatValue(milestone.currentAmount)} of {formatValue(milestone.targetAmount)}
                    </span>
                    <span className="text-sm font-medium text-indigo-600">
                      {milestone.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Financial Event</h3>
              <button
                onClick={() => setShowAddEvent(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Rent Payment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type
                  </label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="bill_due">Bill Due</option>
                    <option value="income">Income</option>
                    <option value="investment">Investment</option>
                    <option value="goal_milestone">Goal Milestone</option>
                    <option value="reminder">Reminder</option>
                    <option value="tax_deadline">Tax Deadline</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={eventForm.amount}
                    onChange={(e) => setEventForm({ ...eventForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Additional details..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recurrence
                </label>
                <select
                  value={eventForm.recurrence}
                  onChange={(e) => setEventForm({ ...eventForm, recurrence: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">None</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddEvent(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!eventForm.title || !eventForm.date}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}