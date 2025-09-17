import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Settings, 
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  MapPin,
  Users
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  isSameDay
} from 'date-fns';
import { useAppStore } from '../stores/useAppStore';
import { useApiTasks } from '../hooks/useApiTasks';

export default function Calendar() {
  // Use real API for tasks (displayed as calendar events)
  const { 
    tasks: apiTasks,
    projects: apiProjects,
    createTask,
    updateTask,
    deleteTask,
    loading,
    error
  } = useApiTasks();
  
  // Use app store for calendar metadata only
  const {
    calendars
  } = useAppStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSidebar, setShowSidebar] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  
  // Convert API tasks to calendar events format
  const calendarEvents = apiTasks.map(task => {
    const project = apiProjects.find(p => p.id === task.project_id);
    return {
      id: task.id!,
      title: task.title,
      startTime: task.due_date ? new Date(task.due_date) : new Date(),
      endTime: task.due_date ? new Date(new Date(task.due_date).getTime() + (task.estimated_time || 60) * 60 * 1000) : new Date(),
      description: task.description || '',
      location: '',
      calendarId: task.project_id || 'default',
      allDay: false,
      multiDay: false,
      attendees: [],
      source: 'internal' as const,
      priority: task.priority,
      status: task.status,
      completed: task.status === 'done',
      color: project?.color || (
        task.priority === 'urgent' ? '#ef4444' :
        task.priority === 'high' ? '#f97316' :
        task.priority === 'medium' ? '#3b82f6' : '#6b7280'
      )
    };
  });
  
  // Drag to create state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ date: Date; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ date: Date; hour: number } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ startTime: Date; endTime: Date } | null>(null);
  
  // Event drag/resize state
  const [isDraggingEvent, setIsDraggingEvent] = useState(false);
  const [isResizingEvent, setIsResizingEvent] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<any | null>(null);
  const [resizedEvent, setResizedEvent] = useState<any | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'top' | 'bottom' | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [eventDragPreview, setEventDragPreview] = useState<{ startTime: Date; endTime: Date; day: Date } | null>(null);
  
  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '10:00',
    description: '',
    location: '',
    calendarId: 'default',
    allDay: false,
    multiDay: false
  });

  const handleCreateEvent = (date?: Date) => {
    const targetDate = date || new Date();
    setSelectedDate(targetDate);
    setEditingEvent(null);
    setEventForm({
      title: '',
      startDate: format(targetDate, 'yyyy-MM-dd'),
      endDate: format(targetDate, 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      calendarId: 'default',
      allDay: false,
      multiDay: false
    });
    setShowEventModal(true);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    setEventForm({
      title: event.title,
      startDate: format(startTime, 'yyyy-MM-dd'),
      endDate: format(endTime, 'yyyy-MM-dd'),
      startTime: format(startTime, 'HH:mm'),
      endTime: format(endTime, 'HH:mm'),
      description: event.description || '',
      location: '',
      calendarId: event.calendarId || 'default',
      allDay: false,
      multiDay: false
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title) return;
    
    try {
      const startDateTime = new Date(`${eventForm.startDate}T${eventForm.startTime}`);
      const endDateTime = new Date(`${eventForm.endDate}T${eventForm.endTime}`);
      const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));
      
      const taskData = {
        title: eventForm.title,
        description: eventForm.description,
        due_date: startDateTime.toISOString(),
        estimated_time: Math.max(15, durationMinutes), // Minimum 15 minutes
        project_id: eventForm.calendarId === 'default' ? undefined : eventForm.calendarId,
        priority: 'medium' as const,
        status: 'todo' as const,
        category: 'work' as const,
        tags: [],
        actual_time: 0
      };
      
      if (editingEvent) {
        // Update existing task
        await updateTask(editingEvent.id, taskData);
      } else {
        // Create new task
        await createTask(taskData);
      }
      
      setShowEventModal(false);
      setEditingEvent(null);
      setEventForm({
        title: '',
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        calendarId: 'default',
        allDay: false,
        multiDay: false
      });
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(eventId);
        setShowEventModal(false);
        setEditingEvent(null);
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  const getEventsForDate = (date: Date) => {
    return calendarEvents.filter(event => 
      isSameDay(new Date(event.startTime), date) && !event.multiDay
    );
  };

  // Get multi-day events that span across multiple days
  const getMultiDayEventsForWeek = (week: Date[]) => {
    const weekStart = new Date(week[0]);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(week[6]);
    weekEnd.setHours(23, 59, 59, 999);
    
    return calendarEvents.filter(event => {
      if (!event.multiDay) return false;
      
      const eventStart = new Date(event.startTime);
      eventStart.setHours(0, 0, 0, 0);
      const eventEnd = new Date(event.endTime);
      eventEnd.setHours(23, 59, 59, 999);
      
      // Check if the event overlaps with this week
      return (eventStart <= weekEnd && eventEnd >= weekStart);
    }).map(event => {
      const eventStart = new Date(event.startTime);
      eventStart.setHours(0, 0, 0, 0);
      const eventEnd = new Date(event.endTime);
      eventEnd.setHours(23, 59, 59, 999);
      
      // Find which columns this event spans in this week
      const startCol = Math.max(0, Math.floor((eventStart.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)));
      const endCol = Math.min(6, Math.floor((eventEnd.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)));
      
      return {
        ...event,
        startCol: Math.max(0, startCol),
        endCol: Math.min(6, endCol),
        spanDays: Math.max(1, endCol - startCol + 1)
      };
    });
  };

  // Drag to create event handlers
  const handleMouseDown = (day: Date, hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ date: day, hour });
    setDragEnd({ date: day, hour });
    
    const startTime = new Date(day);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 0, 0, 0);
    
    setDragPreview({ startTime, endTime });
  };

  const handleMouseEnter = (day: Date, hour: number) => {
    if (isDragging && dragStart) {
      setDragEnd({ date: day, hour });
      
      // Calculate preview times - support cross-day selection
      let startTime: Date, endTime: Date;
      
      if (day.getTime() === dragStart.date.getTime()) {
        // Same day
        const startHour = Math.min(dragStart.hour, hour);
        const endHour = Math.max(dragStart.hour, hour) + 1;
        
        startTime = new Date(dragStart.date);
        startTime.setHours(startHour, 0, 0, 0);
        endTime = new Date(dragStart.date);
        endTime.setHours(endHour, 0, 0, 0);
      } else {
        // Cross-day selection
        startTime = new Date(dragStart.date);
        startTime.setHours(dragStart.hour, 0, 0, 0);
        endTime = new Date(day);
        endTime.setHours(hour + 1, 0, 0, 0);
        
        // Ensure proper order
        if (endTime < startTime) {
          [startTime, endTime] = [endTime, startTime];
        }
      }
      
      setDragPreview({ startTime, endTime });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd && dragPreview) {
      setIsDragging(false);
      
      // Create event with dragged time range
      setSelectedDate(dragStart.date);
      setEditingEvent(null);
      setEventForm({
        title: '',
        startDate: format(dragPreview.startTime, 'yyyy-MM-dd'),
        endDate: format(dragPreview.endTime, 'yyyy-MM-dd'),
        startTime: format(dragPreview.startTime, 'HH:mm'),
        endTime: format(dragPreview.endTime, 'HH:mm'),
        description: '',
        location: '',
        calendarId: 'default',
        allDay: false
      });
      setShowEventModal(true);
      
      // Clear drag state
      setDragStart(null);
      setDragEnd(null);
      setDragPreview(null);
    }
  };

  // Global mouse up handler to end dragging
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      } else if (isDraggingEvent || isResizingEvent) {
        handleEventDragEnd();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
      } else if (isDraggingEvent || isResizingEvent) {
        e.preventDefault();
        handleEventDrag(e);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    
    // Prevent text selection during drag
    if (isDragging || isDraggingEvent || isResizingEvent) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isDraggingEvent ? 'grabbing' : isResizingEvent ? (resizeHandle === 'top' || resizeHandle === 'bottom' ? 'ns-resize' : 'ew-resize') : 'default';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, isDraggingEvent, isResizingEvent, dragStart, dragEnd, dragPreview, draggedEvent, resizedEvent, resizeHandle]);

  // Check if a cell is in the drag selection
  const isCellInDragSelection = (day: Date, hour: number) => {
    if (!isDragging || !dragStart || !dragEnd || !dragPreview) return false;
    
    const cellTime = new Date(day);
    cellTime.setHours(hour, 0, 0, 0);
    
    const cellEndTime = new Date(day);
    cellEndTime.setHours(hour + 1, 0, 0, 0);
    
    // Check if this cell overlaps with the drag selection
    return (cellTime < dragPreview.endTime && cellEndTime > dragPreview.startTime);
  };

  // Get events that span multiple hours for a specific day
  const getSpanningEventsForDay = (day: Date) => {
    return calendarEvents
      .filter(event => isSameDay(new Date(event.startTime), day) && !event.multiDay)
      .map(event => {
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);
        const startHour = startTime.getHours();
        const endHour = endTime.getHours();
        const startMinute = startTime.getMinutes();
        const endMinute = endTime.getMinutes();
        
        // Calculate the height and position within the hour blocks
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        const topOffset = (startMinute / 60) * 64; // 64px is hour height
        const height = durationHours * 64; // Full height for the duration
        
        const calendar = calendars.find(c => c.id === event.calendarId);
        const color = calendar?.color || '#3b82f6';
        
        return {
          ...event,
          startHour,
          endHour,
          startMinute,
          endMinute,
          topOffset,
          height,
          color,
          durationHours
        };
      });
  };

  // Check if a specific hour cell should show an event
  const getEventForHourCell = (day: Date, hour: number) => {
    const spanningEvents = getSpanningEventsForDay(day);
    return spanningEvents.find(event => {
      const eventStartHour = event.startHour;
      const eventEndHour = event.endHour;
      const eventEndMinute = event.endMinute;
      
      // Event spans this hour if it starts at or before this hour and ends after this hour starts
      return eventStartHour <= hour && (eventEndHour > hour || (eventEndHour === hour && eventEndMinute > 0));
    });
  };

  // Event drag handlers
  const handleEventMouseDown = (event: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    
    // Check if clicking on resize handles (top 8px or bottom 8px)
    if (offsetY <= 8) {
      // Resize from top
      setIsResizingEvent(true);
      setResizedEvent(event);
      setResizeHandle('top');
    } else if (offsetY >= rect.height - 8) {
      // Resize from bottom
      setIsResizingEvent(true);
      setResizedEvent(event);
      setResizeHandle('bottom');
    } else {
      // Drag the event
      setIsDraggingEvent(true);
      setDraggedEvent(event);
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleEventDrag = (e: MouseEvent) => {
    if (isDraggingEvent && draggedEvent) {
      let targetDay: Date;
      
      if (view === 'week') {
        // Calculate which day and hour the mouse is over
        const weekDays = eachDayOfInterval({
          start: startOfWeek(currentDate, { weekStartsOn: 0 }),
          end: endOfWeek(currentDate, { weekStartsOn: 0 })
        });

        // Find the day column under the mouse
        const sidebarWidth = showSidebar ? 320 : 0;
        const dayWidth = (window.innerWidth - sidebarWidth - 80) / 7; // Account for sidebar and time column
        const dayIndex = Math.floor((e.clientX - sidebarWidth - 80) / dayWidth);
        targetDay = weekDays[Math.max(0, Math.min(6, dayIndex))];
      } else {
        // Day view - only one day
        targetDay = currentDate;
      }

      if (targetDay) {
        // Calculate the hour based on Y position
        const headerHeight = 120; // Approximate header height
        const hourHeight = 64;
        const scrollTop = document.querySelector('.overflow-auto')?.scrollTop || 0;
        const relativeY = e.clientY - headerHeight + scrollTop - dragOffset.y;
        const targetHour = Math.max(0, Math.min(23, Math.floor(relativeY / hourHeight)));
        const minuteOffset = ((relativeY % hourHeight) / hourHeight) * 60;

        // Calculate new start and end times
        const originalDuration = new Date(draggedEvent.endTime).getTime() - new Date(draggedEvent.startTime).getTime();
        const newStartTime = new Date(targetDay);
        newStartTime.setHours(targetHour, Math.round(minuteOffset), 0, 0);
        const newEndTime = new Date(newStartTime.getTime() + originalDuration);

        setEventDragPreview({
          startTime: newStartTime,
          endTime: newEndTime,
          day: targetDay
        });
      }
    } else if (isResizingEvent && resizedEvent) {
      // Handle resize logic
      const headerHeight = 120;
      const hourHeight = 64;
      const scrollTop = document.querySelector('.overflow-auto')?.scrollTop || 0;
      const relativeY = e.clientY - headerHeight + scrollTop;
      const targetHour = Math.max(0, Math.min(23, Math.floor(relativeY / hourHeight)));
      const minuteOffset = ((relativeY % hourHeight) / hourHeight) * 60;

      const currentStart = new Date(resizedEvent.startTime);
      const currentEnd = new Date(resizedEvent.endTime);

      if (resizeHandle === 'top') {
        // Resize from top - change start time
        const newStartTime = new Date(currentStart);
        newStartTime.setHours(targetHour, Math.round(minuteOffset), 0, 0);
        
        // Ensure minimum 15-minute duration
        if (newStartTime < new Date(currentEnd.getTime() - 15 * 60 * 1000)) {
          setEventDragPreview({
            startTime: newStartTime,
            endTime: currentEnd,
            day: new Date(resizedEvent.startTime)
          });
        }
      } else if (resizeHandle === 'bottom') {
        // Resize from bottom - change end time
        const newEndTime = new Date(currentEnd);
        newEndTime.setHours(targetHour, Math.round(minuteOffset), 0, 0);
        
        // Ensure minimum 15-minute duration
        if (newEndTime > new Date(currentStart.getTime() + 15 * 60 * 1000)) {
          setEventDragPreview({
            startTime: currentStart,
            endTime: newEndTime,
            day: new Date(resizedEvent.startTime)
          });
        }
      }
    }
  };

  const handleEventDragEnd = async () => {
    if ((isDraggingEvent || isResizingEvent) && eventDragPreview) {
      const eventToUpdate = draggedEvent || resizedEvent;
      if (eventToUpdate) {
        // Update the task with new due date
        const durationMinutes = Math.round((eventDragPreview.endTime.getTime() - eventDragPreview.startTime.getTime()) / (1000 * 60));
        updateTask(eventToUpdate.id, {
          due_date: eventDragPreview.startTime.toISOString(),
          estimated_time: Math.max(15, durationMinutes)
        }).catch(err => {
          console.error('Failed to update task:', err);
        });
      }
    }

    // Reset all drag states
    setIsDraggingEvent(false);
    setIsResizingEvent(false);
    setDraggedEvent(null);
    setResizedEvent(null);
    setResizeHandle(null);
    setDragOffset({ x: 0, y: 0 });
    setEventDragPreview(null);
  };

  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      if (isSameMonth(weekStart, weekEnd)) {
        return `${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'd, yyyy')}`;
      } else {
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      }
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Google Calendar Header */}
      <header className="border-b border-gray-300 bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-3 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Menu className="w-6 h-6 text-black" />
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
              </div>
              <span className="text-xl text-black font-normal">Calendar</span>
            </div>
          </div>
          
          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* API Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                error ? 'bg-red-500' : loading ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <span className={`text-xs font-medium ${
                error ? 'text-red-600' : loading ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {error ? 'API Offline' : loading ? 'Connecting...' : 'API Online'}
              </span>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 w-80 text-sm bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
            
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-black" />
            </button>
            
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
          </div>
        </div>
        
        {/* Navigation row */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-black" />
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-black" />
            </button>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm font-medium text-black hover:bg-gray-100 rounded-md border border-gray-300 transition-colors"
            >
              Today
            </button>
            
            <h1 className="text-xl font-normal text-black ml-4">
              {getDateRangeText()}
            </h1>
          </div>
          
          <div className="flex border border-gray-300 rounded-md">
            <button 
              onClick={() => setView('day')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                view === 'day' ? 'bg-blue-100 text-blue-700' : 'text-black hover:bg-gray-50'
              }`}
            >
              Day
            </button>
            <button 
              onClick={() => setView('week')}
              className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                view === 'week' ? 'bg-blue-100 text-blue-700' : 'text-black hover:bg-gray-50'
              }`}
            >
              Week
            </button>
            <button 
              onClick={() => setView('month')}
              className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                view === 'month' ? 'bg-blue-100 text-blue-700' : 'text-black hover:bg-gray-50'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Create button */}
            <div className="p-6">
              <button 
                onClick={() => handleCreateEvent()}
                className="flex items-center space-x-4 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-full shadow-md hover:shadow-lg transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-black">Create</span>
              </button>
            </div>
            
            {/* Mini calendar */}
            <div className="px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-black" />
                </button>
                <span className="text-sm font-medium text-black">
                  {format(currentDate, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-black" />
                </button>
              </div>
              
              {/* Mini calendar grid */}
              <div>
                {/* Calendar days */}
                <div className="flex flex-col">
                  {(() => {
                    const allDays = eachDayOfInterval({
                      start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
                      end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
                    });
                    
                    // Split into weeks (6 rows of 7 days each)
                    const weeks = [];
                    for (let i = 0; i < 6; i++) {
                      weeks.push(allDays.slice(i * 7, (i + 1) * 7));
                    }
                    
                    return weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex">
                        {week.map((day) => {
                          const isCurrentMonth = isSameMonth(day, currentDate);
                          const isCurrentDay = isToday(day);
                          
                          return (
                            <button
                              key={day.toISOString()}
                              onClick={() => setCurrentDate(day)}
                              className={`text-xs h-8 w-8 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center ${
                                !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                              } ${isCurrentDay ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                            >
                              {format(day, 'd')}
                            </button>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
            
            {/* My projects */}
            <div className="px-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-black">My Projects</h3>
              </div>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-sm text-gray-500">Loading projects...</div>
                ) : error ? (
                  <div className="text-sm text-red-500">Error loading projects</div>
                ) : (
                  <>
                    <div className="flex items-center py-1">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        className="w-4 h-4 mr-3"
                      />
                      <div className="w-3 h-3 rounded-full mr-3 bg-gray-400"></div>
                      <span className="text-sm text-gray-700 flex-1">No Project</span>
                    </div>
                    {apiProjects.map(project => (
                      <div key={project.id} className="flex items-center py-1">
                        <input 
                          type="checkbox" 
                          defaultChecked 
                          className="w-4 h-4 mr-3"
                          style={{ accentColor: project.color }}
                        />
                        <div 
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: project.color }}
                        ></div>
                        <span className="text-sm text-gray-700 flex-1">{project.name}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Main calendar area */}
        <div className="flex-1 bg-white">
          {view === 'month' && (
            <div className="h-full flex flex-col">
              {/* Day headers */}
              <div className="flex border-b border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="py-3 px-4 text-center border-r border-gray-200 last:border-r-0 bg-gray-50" style={{ 
                    width: 'calc(100% / 7)', 
                    minWidth: 'calc(100% / 7)', 
                    maxWidth: 'calc(100% / 7)',
                    flexShrink: 0,
                    flexGrow: 0
                  }}>
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      {day}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Calendar rows */}
              <div className="flex-1 flex flex-col">
                {(() => {
                  const allDays = eachDayOfInterval({
                    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
                    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
                  });
                  
                  // Split into weeks (6 rows of 7 days each)
                  const weeks = [];
                  for (let i = 0; i < 6; i++) {
                    weeks.push(allDays.slice(i * 7, (i + 1) * 7));
                  }
                  
                  return weeks.map((week, weekIndex) => {
                    const multiDayEvents = getMultiDayEventsForWeek(week);
                    
                    return (
                      <div key={weekIndex} className="relative flex h-32"> {/* Fixed height for uniform rows */}
                        {/* Multi-day events overlay */}
                        {multiDayEvents.map((event, eventIndex) => {
                          const calendar = calendars.find(c => c.id === event.calendarId);
                          const color = calendar?.color || '#3b82f6';
                          
                          return (
                            <div
                              key={`multi-${event.id}`}
                              className="absolute text-xs px-2 py-1 text-white rounded font-medium cursor-pointer hover:opacity-90 transition-opacity flex items-center z-10"
                              style={{
                                backgroundColor: color,
                                left: `${(event.startCol / 7) * 100}%`,
                                width: `${(event.spanDays / 7) * 100}%`,
                                top: `${32 + eventIndex * 22}px`, // Position below day numbers
                                height: '20px',
                                marginLeft: '8px',
                                marginRight: '8px'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event);
                              }}
                            >
                              <span className="truncate leading-none">
                                {event.title}
                              </span>
                            </div>
                          );
                        })}
                        
                        {/* Regular day cells */}
                        {week.map((day, dayIndex) => {
                          const isCurrentMonth = isSameMonth(day, currentDate);
                          const isCurrentDay = isToday(day);
                          const dayEvents = getEventsForDate(day);
                          
                          // Calculate available space for single-day events (after multi-day events)
                          const multiDayEventCount = multiDayEvents.length;
                          const availableEventSlots = Math.max(0, 3 - multiDayEventCount);
                          
                          return (
                            <div 
                              key={dayIndex}
                              className={`border-r border-b border-gray-200 last:border-r-0 cursor-pointer hover:bg-blue-50 transition-colors flex flex-col ${
                                !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                              }`}
                              onClick={() => handleCreateEvent(day)}
                              style={{ 
                                height: '128px', 
                                width: 'calc(100% / 7)', 
                                minWidth: 'calc(100% / 7)', 
                                maxWidth: 'calc(100% / 7)',
                                flexShrink: 0,
                                flexGrow: 0
                              }} // Exact dimensions for precise alignment
                            >
                              <div className="p-2 h-full flex flex-col">
                              {/* Day number */}
                              <div className="flex-shrink-0 mb-2">
                                <div className={`w-6 h-6 flex items-center justify-center text-sm font-medium rounded-full ${
                                  !isCurrentMonth ? 'text-gray-400' : 
                                  isCurrentDay ? 'bg-blue-600 text-white' : 
                                  'text-gray-900 hover:bg-gray-100'
                                }`}>
                                  {format(day, 'd')}
                                </div>
                              </div>
                              
                              {/* Events area with overflow handling - positioned after multi-day events */}
                              <div className="flex-1 overflow-hidden" style={{ marginTop: `${multiDayEventCount * 22}px` }}>
                                <div className="space-y-1 h-full">
                                  {dayEvents.slice(0, availableEventSlots).map((event) => {
                                    const calendar = calendars.find(c => c.id === event.calendarId);
                                    const color = calendar?.color || '#3b82f6';
                                    return (
                                      <div 
                                        key={event.id}
                                        className="text-xs px-2 py-1 text-white rounded font-medium cursor-pointer hover:opacity-90 transition-opacity flex items-center overflow-hidden"
                                        style={{ 
                                          backgroundColor: color,
                                          height: '20px', // Fixed height for uniform events
                                          minHeight: '20px',
                                          maxHeight: '20px',
                                          width: '100%'
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditEvent(event);
                                        }}
                                      >
                                        <span className="truncate leading-none">
                                          {event.title}
                                        </span>
                                      </div>
                                    );
                                  })}
                                  {dayEvents.length > availableEventSlots && availableEventSlots > 0 && (
                                    <div className="text-xs text-gray-500 px-2 font-medium overflow-hidden" style={{ height: '20px', lineHeight: '20px', width: '100%' }}>
                                      +{dayEvents.length - availableEventSlots} more
                                    </div>
                                  )}
                                </div>
                              </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                })()}
              </div>
            </div>
          )}

          {view === 'week' && (
            <div className={`h-full flex flex-col ${isDragging ? 'cursor-grabbing' : ''}`}>
              {/* Week header with days */}
              <div className="flex border-b border-gray-300 bg-gray-50 sticky top-0">
                {/* Time column header */}
                <div className="w-20 py-4 px-2 border-r border-gray-200 bg-white text-center flex-shrink-0">
                  <div className="text-xs text-gray-500 font-medium">GMT-8</div>
                </div>
                
                {/* Day headers */}
                {eachDayOfInterval({
                  start: startOfWeek(currentDate, { weekStartsOn: 0 }),
                  end: endOfWeek(currentDate, { weekStartsOn: 0 })
                }).map((day) => (
                  <div key={day.toISOString()} className="flex-1 py-4 px-3 text-center border-r border-gray-200 last:border-r-0 bg-white">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      {format(day, 'EEE')}
                    </div>
                    <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium ${
                      isToday(day) 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Multi-day events area */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="flex">
                  {/* Time column spacer */}
                  <div className="w-20 flex-shrink-0 border-r border-gray-200"></div>
                  
                  {/* Multi-day events container */}
                  <div className="flex-1 relative" style={{ minHeight: '60px' }}>
                    {(() => {
                      const weekDays = eachDayOfInterval({
                        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
                        end: endOfWeek(currentDate, { weekStartsOn: 0 })
                      });
                      const multiDayEvents = getMultiDayEventsForWeek(weekDays);
                      
                      return multiDayEvents.map((event, eventIndex) => {
                        const calendar = calendars.find(c => c.id === event.calendarId);
                        const color = calendar?.color || '#3b82f6';
                        
                        return (
                          <div
                            key={`week-multi-${event.id}`}
                            className="absolute text-xs px-2 py-1 text-white rounded font-medium cursor-pointer hover:opacity-90 transition-opacity flex items-center z-10"
                            style={{
                              backgroundColor: color,
                              left: `${(event.startCol / 7) * 100}%`,
                              width: `${(event.spanDays / 7) * 100}%`,
                              top: `${8 + eventIndex * 26}px`,
                              height: '22px',
                              marginLeft: '4px',
                              marginRight: '4px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                          >
                            <span className="truncate leading-none">
                              {event.title}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Week grid matrix */}
              <div className="flex-1 overflow-auto relative">
                {/* Day columns with spanning events */}
                <div className="flex">
                  {/* Time column */}
                  <div className="w-20 flex-shrink-0">
                    {Array.from({ length: 24 }, (_, hour) => (
                      <div 
                        key={`time-${hour}`}
                        className="h-16 px-2 py-2 border-r border-b border-gray-200 bg-gray-50 flex items-start"
                      >
                        <div className="text-xs text-gray-500 font-medium">
                          {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Day columns */}
                  {eachDayOfInterval({
                    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
                    end: endOfWeek(currentDate, { weekStartsOn: 0 })
                  }).map((day) => (
                    <div key={day.toISOString()} className="flex-1 relative border-r border-gray-200 last:border-r-0">
                      {/* Hour cells for this day */}
                      {Array.from({ length: 24 }, (_, hour) => {
                        const isInSelection = isCellInDragSelection(day, hour);
                        const eventInCell = getEventForHourCell(day, hour);
                        
                        return (
                          <div
                            key={`${day.toISOString()}-${hour}`}
                            className={`h-16 border-b border-gray-200 cursor-pointer transition-colors relative select-none ${
                              isInSelection 
                                ? 'bg-blue-200 border-blue-300' 
                                : eventInCell
                                ? 'bg-gray-50'  // Slightly different background when event is present
                                : 'bg-white hover:bg-blue-50'
                            }`}
                            onMouseDown={(e) => {
                              // Only start drag on empty areas (not on existing events)
                              if (e.target === e.currentTarget && !eventInCell) {
                                handleMouseDown(day, hour, e);
                              }
                            }}
                            onMouseEnter={() => handleMouseEnter(day, hour)}
                            onClick={(e) => {
                              // Only create event on click if not dragging and no existing event
                              if (!isDragging && e.target === e.currentTarget && !eventInCell) {
                                const eventDate = new Date(day);
                                eventDate.setHours(hour, 0, 0, 0);
                                handleCreateEvent(eventDate);
                              }
                            }}
                          >
                            {/* Drag preview overlay */}
                            {isInSelection && dragPreview && (
                              <div className="absolute inset-1 bg-blue-400 bg-opacity-30 border border-blue-500 rounded pointer-events-none z-20 flex flex-col items-center justify-center">
                                <span className="text-xs text-blue-800 font-medium">New Event</span>
                                {dragStart && day.getTime() === dragStart.date.getTime() && hour === dragStart.hour && (
                                  <span className="text-xs text-blue-700 mt-1 bg-white bg-opacity-80 px-1 rounded">
                                    {format(dragPreview.startTime, 'h:mm a')} - {format(dragPreview.endTime, 'h:mm a')}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Spanning events for this day */}
                      {getSpanningEventsForDay(day).map((event) => {
                        const isBeingDragged = draggedEvent?.id === event.id;
                        const isBeingResized = resizedEvent?.id === event.id;
                        const shouldShowPreview = eventDragPreview && (isBeingDragged || isBeingResized);
                        
                        // If this event is being dragged/resized, show it at the preview position
                        const displayEvent = shouldShowPreview ? {
                          ...event,
                          startTime: eventDragPreview.startTime,
                          endTime: eventDragPreview.endTime,
                          startHour: eventDragPreview.startTime.getHours(),
                          endHour: eventDragPreview.endTime.getHours(),
                          startMinute: eventDragPreview.startTime.getMinutes(),
                          endMinute: eventDragPreview.endTime.getMinutes(),
                          topOffset: (eventDragPreview.startTime.getMinutes() / 60) * 64,
                          height: ((eventDragPreview.endTime.getTime() - eventDragPreview.startTime.getTime()) / (1000 * 60 * 60)) * 64,
                        } : event;

                        // Don't render if event is being dragged to a different day
                        if (shouldShowPreview && !isSameDay(eventDragPreview.day, day)) {
                          return null;
                        }

                        return (
                          <div
                            key={event.id}
                            className={`absolute left-1 right-1 rounded-lg shadow-lg border-2 border-opacity-50 cursor-move hover:shadow-xl transition-all duration-200 z-10 group transform hover:scale-[1.02] ${
                              isBeingDragged || isBeingResized ? 'opacity-75 scale-105 shadow-2xl' : ''
                            }`}
                            style={{
                              backgroundColor: event.color,
                              borderColor: event.color,
                              top: `${displayEvent.startHour * 64 + displayEvent.topOffset}px`,
                              height: `${Math.max(32, displayEvent.height - 2)}px`,
                            }}
                            onMouseDown={(e) => handleEventMouseDown(event, e)}
                          >
                            {/* Resize handle - top */}
                            <div className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white bg-opacity-30 transition-opacity rounded-t-lg" />
                            
                            <div className="p-2 text-white h-full flex flex-col justify-start pointer-events-none">
                              <div className="font-semibold text-sm leading-tight truncate">{displayEvent.title}</div>
                              {displayEvent.height > 32 && (
                                <div className="text-xs opacity-95 mt-1 font-medium">
                                  {format(new Date(displayEvent.startTime), 'h:mm a')} - {format(new Date(displayEvent.endTime), 'h:mm a')}
                                </div>
                              )}
                              {displayEvent.height > 56 && event.location && (
                                <div className="text-xs opacity-85 mt-1 truncate">📍 {event.location}</div>
                              )}
                              {displayEvent.height > 72 && event.description && (
                                <div className="text-xs opacity-80 mt-1 leading-relaxed line-clamp-2">
                                  {event.description.substring(0, 60)}{event.description.length > 60 && '...'}
                                </div>
                              )}
                            </div>

                            {/* Resize handle - bottom */}
                            <div className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white bg-opacity-30 transition-opacity rounded-b-lg" />
                          </div>
                        );
                      })}

                      {/* Ghost event preview for cross-day drags */}
                      {eventDragPreview && draggedEvent && isSameDay(eventDragPreview.day, day) && !getSpanningEventsForDay(day).find(e => e.id === draggedEvent.id) && (
                        <div
                          className="absolute left-1 right-1 rounded-lg border-2 border-dashed border-opacity-80 z-20 pointer-events-none shadow-lg"
                          style={{
                            borderColor: draggedEvent.color,
                            backgroundColor: `${draggedEvent.color}30`, // 20% opacity
                            top: `${eventDragPreview.startTime.getHours() * 64 + (eventDragPreview.startTime.getMinutes() / 60) * 64}px`,
                            height: `${Math.max(32, ((eventDragPreview.endTime.getTime() - eventDragPreview.startTime.getTime()) / (1000 * 60 * 60)) * 64 - 2)}px`,
                          }}
                        >
                          <div className="p-2 text-gray-800 h-full flex flex-col justify-start">
                            <div className="font-semibold text-sm truncate leading-tight">{draggedEvent.title}</div>
                            <div className="text-xs opacity-90 mt-1 font-medium">
                              {format(eventDragPreview.startTime, 'h:mm a')} - {format(eventDragPreview.endTime, 'h:mm a')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'day' && (
            <div className="h-full flex flex-col">
              {/* Multi-day events area for day view */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="flex">
                  {/* Time column spacer */}
                  <div className="w-20 flex-shrink-0 border-r border-gray-200"></div>
                  
                  {/* Multi-day events container */}
                  <div className="flex-1 relative" style={{ minHeight: '40px' }}>
                    {(() => {
                      const dayEvents = calendarEvents.filter(event => 
                        event.multiDay && isSameDay(new Date(event.startTime), currentDate)
                      );
                      
                      return dayEvents.map((event, eventIndex) => {
                        const calendar = calendars.find(c => c.id === event.calendarId);
                        const color = calendar?.color || '#3b82f6';
                        
                        return (
                          <div
                            key={`day-multi-${event.id}`}
                            className="absolute text-xs px-2 py-1 text-white rounded font-medium cursor-pointer hover:opacity-90 transition-opacity flex items-center z-10"
                            style={{
                              backgroundColor: color,
                              left: '4px',
                              right: '4px',
                              top: `${8 + eventIndex * 26}px`,
                              height: '22px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                          >
                            <span className="truncate leading-none">
                              {event.title}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Day content */}
              <div className="flex-1 flex">
                {/* Time column */}
                <div className="w-20 border-r border-gray-200 flex-shrink-0">
                  {Array.from({ length: 24 }, (_, hour) => (
                    <div key={hour} className="h-16 border-b border-gray-200 px-2 py-2 bg-gray-50">
                      <div className="text-xs text-gray-500 font-medium">
                        {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Day content */}
                <div className="flex-1 relative">
                {/* Hour cells */}
                {Array.from({ length: 24 }, (_, hour) => {
                  const eventInCell = getEventForHourCell(currentDate, hour);
                  return (
                    <div 
                      key={hour} 
                      className={`h-16 border-b border-gray-200 cursor-pointer transition-colors relative ${
                        eventInCell ? 'bg-gray-50' : 'bg-white hover:bg-blue-50'
                      }`}
                      onClick={(e) => {
                        if (e.target === e.currentTarget && !eventInCell) {
                          const eventDate = new Date(currentDate);
                          eventDate.setHours(hour, 0, 0, 0);
                          handleCreateEvent(eventDate);
                        }
                      }}
                    />
                  );
                })}
                
                {/* Spanning events for this day */}
                {getSpanningEventsForDay(currentDate).map((event) => {
                  const isBeingDragged = draggedEvent?.id === event.id;
                  const isBeingResized = resizedEvent?.id === event.id;
                  const shouldShowPreview = eventDragPreview && (isBeingDragged || isBeingResized);
                  
                  // If this event is being dragged/resized, show it at the preview position
                  const displayEvent = shouldShowPreview ? {
                    ...event,
                    startTime: eventDragPreview.startTime,
                    endTime: eventDragPreview.endTime,
                    startHour: eventDragPreview.startTime.getHours(),
                    endHour: eventDragPreview.endTime.getHours(),
                    startMinute: eventDragPreview.startTime.getMinutes(),
                    endMinute: eventDragPreview.endTime.getMinutes(),
                    topOffset: (eventDragPreview.startTime.getMinutes() / 60) * 64,
                    height: ((eventDragPreview.endTime.getTime() - eventDragPreview.startTime.getTime()) / (1000 * 60 * 60)) * 64,
                  } : event;

                  return (
                    <div
                      key={event.id}
                      className={`absolute left-2 right-2 rounded-lg shadow-lg border-2 border-opacity-50 cursor-move hover:shadow-xl transition-all duration-200 z-10 group transform hover:scale-[1.01] ${
                        isBeingDragged || isBeingResized ? 'opacity-75 scale-105 shadow-2xl' : ''
                      }`}
                      style={{
                        backgroundColor: event.color,
                        borderColor: event.color,
                        top: `${displayEvent.startHour * 64 + displayEvent.topOffset}px`,
                        height: `${Math.max(40, displayEvent.height - 2)}px`,
                      }}
                      onMouseDown={(e) => handleEventMouseDown(event, e)}
                    >
                      {/* Resize handle - top */}
                      <div className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white bg-opacity-30 transition-opacity rounded-t-lg" />
                      
                      <div className="p-3 text-white h-full flex flex-col justify-start pointer-events-none">
                        <div className="font-bold text-base leading-tight">{displayEvent.title}</div>
                        <div className="text-sm opacity-95 mt-1 font-medium">
                          {format(new Date(displayEvent.startTime), 'h:mm a')} - {format(new Date(displayEvent.endTime), 'h:mm a')}
                        </div>
                        {event.location && (
                          <div className="text-sm opacity-85 mt-1 truncate">📍 {event.location}</div>
                        )}
                        {event.description && displayEvent.height > 80 && (
                          <div className="text-sm opacity-80 mt-2 leading-relaxed">
                            {event.description.substring(0, 120)}
                            {event.description.length > 120 && '...'}
                          </div>
                        )}
                        {displayEvent.height > 100 && (
                          <div className="text-xs opacity-75 mt-2 flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full bg-white bg-opacity-20 font-medium ${
                              event.priority === 'urgent' ? 'text-red-200' :
                              event.priority === 'high' ? 'text-orange-200' :
                              event.priority === 'medium' ? 'text-blue-200' : 'text-gray-200'
                            }`}>
                              {event.priority || 'low'} priority
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Resize handle - bottom */}
                      <div className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white bg-opacity-30 transition-opacity rounded-b-lg" />
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Creation Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingEvent ? 'Edit Event' : 'Create Event'}
              </h3>
              <div className="flex items-center space-x-2">
                {editingEvent && (
                  <button
                    onClick={() => handleDeleteEvent(editingEvent.id)}
                    className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-600"
                    title="Delete event"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setShowEventModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Add title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>

              {/* All Day and Multi-Day Toggles */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={eventForm.allDay}
                    onChange={(e) => setEventForm({ ...eventForm, allDay: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="allDay" className="ml-2 text-sm text-gray-700">
                    All day
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="multiDay"
                    checked={eventForm.multiDay}
                    onChange={(e) => setEventForm({ ...eventForm, multiDay: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="multiDay" className="ml-2 text-sm text-gray-700">
                    Multi-day event
                  </label>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {!eventForm.allDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={eventForm.startTime}
                      onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Add description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="Add location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                <select
                  value={eventForm.calendarId}
                  onChange={(e) => setEventForm({ ...eventForm, calendarId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="default">No Project</option>
                  {apiProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={!eventForm.title}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}