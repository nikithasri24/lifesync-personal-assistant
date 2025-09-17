import { useAppStore } from '../stores/useAppStore';
import { 
  TrendingUp, 
  Calendar,
  Target,
  CheckSquare,
  Award,
  BarChart3,
  Flame
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, isToday, isSameDay } from 'date-fns';

export default function Analytics() {
  const { habits, todos, journalEntries } = useAppStore();

  // Calculate habit streaks
  const calculateStreak = (habit: any) => {
    const today = new Date();
    let streak = 0;
    let currentDate = today;

    while (true) {
      const dayCompletions = habit.completions.filter((completion: any) => 
        isSameDay(new Date(completion.completedAt), currentDate)
      );
      
      if (dayCompletions.length >= habit.targetCount) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else if (isToday(currentDate)) {
        // If today is not complete, check yesterday
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Get habit statistics
  const habitStats = habits.map(habit => {
    const streak = calculateStreak(habit);
    const totalCompletions = habit.completions.length;
    const thisWeekCompletions = habit.completions.filter(completion => {
      const date = new Date(completion.completedAt);
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());
      return date >= weekStart && date <= weekEnd;
    }).length;

    return {
      ...habit,
      streak,
      totalCompletions,
      thisWeekCompletions
    };
  });

  // Calculate productivity metrics
  const thisWeek = eachDayOfInterval({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date())
  });

  const weeklyProductivity = thisWeek.map(day => {
    const dayTodos = todos.filter(todo => 
      todo.completed && 
      isSameDay(new Date(todo.updatedAt), day)
    );
    
    const dayHabits = habits.reduce((total, habit) => {
      const dayCompletions = habit.completions.filter(completion =>
        isSameDay(new Date(completion.completedAt), day)
      );
      return total + dayCompletions.length;
    }, 0);

    const dayJournal = journalEntries.filter(entry =>
      isSameDay(new Date(entry.createdAt), day)
    ).length;

    return {
      date: day,
      todos: dayTodos.length,
      habits: dayHabits,
      journal: dayJournal,
      total: dayTodos.length + dayHabits + dayJournal
    };
  });

  const totalProductivityScore = weeklyProductivity.reduce((sum, day) => sum + day.total, 0);
  const avgDailyScore = Math.round(totalProductivityScore / 7);

  // Get best performing habit
  const bestHabit = habitStats.reduce((best, current) => 
    current.streak > best.streak ? current : best
  , habitStats[0] || { streak: 0, name: 'None' });

  // Calculate completion rates
  const completedTodos = todos.filter(todo => todo.completed).length;
  const todoCompletionRate = todos.length > 0 ? Math.round((completedTodos / todos.length) * 100) : 0;

  const overallHabitRate = habits.length > 0 
    ? Math.round(habitStats.reduce((sum, habit) => sum + (habit.thisWeekCompletions / 7), 0) / habits.length * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your productivity and habit performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Weekly Score</p>
              <p className="text-3xl font-bold text-primary-600">{totalProductivityScore}</p>
              <p className="text-xs text-gray-500">{avgDailyScore}/day avg</p>
            </div>
            <div className="bg-primary-600 p-3 rounded-lg">
              <TrendingUp className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Best Streak</p>
              <p className="text-3xl font-bold text-orange-600">{bestHabit?.streak || 0}</p>
              <p className="text-xs text-gray-500 truncate">{bestHabit?.name || 'No habits'}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <Flame className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Task Rate</p>
              <p className="text-3xl font-bold text-green-600">{todoCompletionRate}%</p>
              <p className="text-xs text-gray-500">{completedTodos}/{todos.length} done</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckSquare className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Habit Rate</p>
              <p className="text-3xl font-bold text-purple-600">{overallHabitRate}%</p>
              <p className="text-xs text-gray-500">This week avg</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Target className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Productivity Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="mr-2" size={20} />
          Weekly Productivity
        </h3>
        <div className="space-y-4">
          {weeklyProductivity.map((day, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-16 text-sm text-gray-600 flex-shrink-0">
                {format(day.date, 'EEE')}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((day.total / 20) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{day.total}</span>
                </div>
                <div className="flex space-x-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    <CheckSquare size={12} className="mr-1" />
                    {day.todos} tasks
                  </span>
                  <span className="flex items-center">
                    <Target size={12} className="mr-1" />
                    {day.habits} habits
                  </span>
                  <span className="flex items-center">
                    <Calendar size={12} className="mr-1" />
                    {day.journal} journal
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habit Streaks */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Flame className="mr-2" size={20} />
            Habit Streaks
          </h3>
          <div className="space-y-3">
            {habitStats.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No habits to track</p>
            ) : (
              habitStats
                .sort((a, b) => b.streak - a.streak)
                .map((habit) => (
                  <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{habit.name}</p>
                        <p className="text-xs text-gray-500">{habit.totalCompletions} total completions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">{habit.streak}</p>
                      <p className="text-xs text-gray-500">day streak</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Task Insights */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="mr-2" size={20} />
            Task Insights
          </h3>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Completed Tasks</span>
                <span className="text-lg font-bold text-green-600">{completedTodos}</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${todoCompletionRate}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Average Time</span>
                <span className="text-lg font-bold text-blue-600">
                  {todos.length > 0 
                    ? Math.round(todos.reduce((sum, todo) => sum + (todo.estimatedTime || 30), 0) / todos.length)
                    : 0}m
                </span>
              </div>
              <p className="text-xs text-blue-600">Per task estimation</p>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-800">High Priority</span>
                <span className="text-lg font-bold text-purple-600">
                  {todos.filter(todo => todo.priority === 'high' || todo.priority === 'urgent').length}
                </span>
              </div>
              <p className="text-xs text-purple-600">Tasks need attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mood Tracking */}
      {journalEntries.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Trends</h3>
          <div className="grid grid-cols-5 gap-4">
            {['excellent', 'good', 'neutral', 'bad', 'terrible'].map(mood => {
              const count = journalEntries.filter(entry => entry.mood === mood).length;
              const percentage = journalEntries.length > 0 ? (count / journalEntries.length) * 100 : 0;
              
              const moodEmojis = {
                excellent: '😄',
                good: '😊',
                neutral: '😐',
                bad: '😟',
                terrible: '😢'
              };

              return (
                <div key={mood} className="text-center">
                  <div className="text-2xl mb-2">{moodEmojis[mood as keyof typeof moodEmojis]}</div>
                  <div className="text-sm font-medium text-gray-900 capitalize">{mood}</div>
                  <div className="text-lg font-bold text-gray-600">{count}</div>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className="bg-blue-600 h-1 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}