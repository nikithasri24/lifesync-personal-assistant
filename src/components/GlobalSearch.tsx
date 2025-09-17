import { useState, useEffect } from 'react';
import { Search, X, FileText, Target, CheckSquare, BookOpen, Heart } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  type: 'habit' | 'todo' | 'note' | 'journal' | 'recipe' | 'shopping';
  title: string;
  content: string;
  category?: string;
  date?: Date;
  icon: typeof FileText;
  onClick: () => void;
}

interface GlobalSearchProps {
  onClose: () => void;
}

export default function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const { 
    habits, 
    todos, 
    notes, 
    journalEntries, 
    recipes, 
    shoppingItems,
    setActiveView 
  } = useAppStore();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lowercaseQuery = query.toLowerCase();

    // Search habits
    habits.forEach(habit => {
      if (
        habit.name.toLowerCase().includes(lowercaseQuery) ||
        habit.description?.toLowerCase().includes(lowercaseQuery)
      ) {
        searchResults.push({
          id: habit.id,
          type: 'habit',
          title: habit.name,
          content: habit.description || '',
          category: habit.category,
          date: habit.createdAt,
          icon: Target,
          onClick: () => {
            setActiveView('habits');
            onClose();
          }
        });
      }
    });

    // Search todos
    todos.forEach(todo => {
      if (
        todo.title.toLowerCase().includes(lowercaseQuery) ||
        todo.description?.toLowerCase().includes(lowercaseQuery) ||
        todo.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      ) {
        searchResults.push({
          id: todo.id,
          type: 'todo',
          title: todo.title,
          content: todo.description || '',
          category: todo.priority,
          date: todo.createdAt,
          icon: CheckSquare,
          onClick: () => {
            setActiveView('todos');
            onClose();
          }
        });
      }
    });

    // Search notes
    notes.forEach(note => {
      if (
        note.title.toLowerCase().includes(lowercaseQuery) ||
        note.content.toLowerCase().includes(lowercaseQuery) ||
        note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      ) {
        searchResults.push({
          id: note.id,
          type: 'note',
          title: note.title,
          content: note.content.substring(0, 100) + '...',
          category: note.category,
          date: note.updatedAt,
          icon: FileText,
          onClick: () => {
            setActiveView('notes');
            onClose();
          }
        });
      }
    });

    // Search journal entries
    journalEntries.forEach(entry => {
      if (
        entry.title.toLowerCase().includes(lowercaseQuery) ||
        entry.content.toLowerCase().includes(lowercaseQuery) ||
        entry.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      ) {
        searchResults.push({
          id: entry.id,
          type: 'journal',
          title: entry.title,
          content: entry.content.substring(0, 100) + '...',
          category: entry.mood,
          date: entry.createdAt,
          icon: BookOpen,
          onClick: () => {
            setActiveView('journal');
            onClose();
          }
        });
      }
    });

    // Search recipes
    recipes.forEach(recipe => {
      if (
        recipe.name.toLowerCase().includes(lowercaseQuery) ||
        recipe.description?.toLowerCase().includes(lowercaseQuery) ||
        recipe.ingredients.some(ing => ing.name.toLowerCase().includes(lowercaseQuery))
      ) {
        searchResults.push({
          id: recipe.id,
          type: 'recipe',
          title: recipe.name,
          content: recipe.description || `${recipe.ingredients.length} ingredients`,
          category: recipe.difficulty,
          date: recipe.createdAt,
          icon: Heart,
          onClick: () => {
            setActiveView('personal');
            onClose();
          }
        });
      }
    });

    // Search shopping items
    shoppingItems.forEach(item => {
      if (item.name.toLowerCase().includes(lowercaseQuery)) {
        searchResults.push({
          id: item.id,
          type: 'shopping',
          title: item.name,
          content: `${item.quantity} ${item.category}`,
          category: item.category,
          date: item.createdAt,
          icon: Heart,
          onClick: () => {
            setActiveView('personal');
            onClose();
          }
        });
      }
    });

    // Sort by relevance and date
    searchResults.sort((a, b) => {
      const aRelevance = a.title.toLowerCase().indexOf(lowercaseQuery);
      const bRelevance = b.title.toLowerCase().indexOf(lowercaseQuery);
      
      if (aRelevance !== bRelevance) {
        return aRelevance - bRelevance;
      }
      
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });

    setResults(searchResults.slice(0, 20)); // Limit to 20 results
  }, [query, habits, todos, notes, journalEntries, recipes, shoppingItems, setActiveView, onClose]);

  const getTypeLabel = (type: string) => {
    const labels = {
      habit: 'Habit',
      todo: 'Task',
      note: 'Note',
      journal: 'Journal',
      recipe: 'Recipe',
      shopping: 'Shopping'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getCategoryColor = (type: string, category?: string) => {
    if (type === 'todo') {
      const colors = {
        low: 'bg-gray-100 text-gray-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-orange-100 text-orange-800',
        urgent: 'bg-red-100 text-red-800'
      };
      return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 max-h-96 flex flex-col animate-fade-in">
        {/* Search Header */}
        <div className="flex items-center p-4 border-b border-gray-200">
          <Search className="text-gray-400 mr-3" size={20} />
          <input
            type="text"
            placeholder="Search everything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-lg outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 ml-3"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {query.length < 2 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="mx-auto mb-4" size={48} />
              <p>Type at least 2 characters to search</p>
              <p className="text-sm mt-2">Search across habits, tasks, notes, journal entries, and more</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="mx-auto mb-4" size={48} />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-2">Try different keywords or check your spelling</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={result.onClick}
                  className="w-full px-4 py-3 hover:bg-gray-50 flex items-start space-x-3 text-left transition-colors"
                >
                  <result.icon className="text-gray-400 mt-1 flex-shrink-0" size={18} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">{result.title}</h4>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full flex-shrink-0">
                        {getTypeLabel(result.type)}
                      </span>
                      {result.category && (
                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${getCategoryColor(result.type, result.category)}`}>
                          {result.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{result.content}</p>
                    {result.date && (
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(result.date), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Footer */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-500 text-center">
            Showing {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}