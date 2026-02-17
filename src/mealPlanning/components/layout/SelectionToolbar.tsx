import React, { type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';

interface SelectionToolbarProps {
  selectedCount: number;
  query: string;
  onQueryChange: (query: string) => void;
  matches: Array<{ id: string; name: string; type: string; count?: number }>;
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  showList: boolean;
  onShowListChange: (show: boolean) => void;
  onAddMeal: (recipeId: string, customMeal?: string) => Promise<void>;
  onDeleteMeals: () => Promise<void>;
  onClearSelection: () => void;
}

interface MultiCellDropdownProps {
  matches: Array<{ id: string; name: string; type: string; count?: number }>;
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  onAddMeal: (recipeId: string, customMeal?: string) => Promise<void>;
  onClose: () => void;
  query: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Multi-cell dropdown component for selecting recipes or custom meals
 */
function MultiCellDropdown({
  matches,
  selectedIndex,
  onIndexChange,
  onAddMeal,
  onClose,
  query,
  inputRef,
}: MultiCellDropdownProps): ReactElement {
  const rect = inputRef.current?.getBoundingClientRect();
  return (
    <div
      className="fixed z-[100] min-w-[240px] max-w-[320px] rounded-lg border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5"
      style={{
        left: rect?.left ?? 0,
        top: (rect?.bottom ?? 0) + 4,
      }}
    >
      {matches.length === 0 ? (
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-[#F5EBE0] transition-colors first:rounded-t-lg last:rounded-b-lg"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            void onAddMeal('', query.trim()).then(() => {
              onClose();
            });
          }}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F5EBE0] text-xs font-semibold text-[#8B6F47]">
            +
          </span>
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium">Add "{query.trim()}"</div>
            <div className="text-xs text-slate-500">Create new meal</div>
          </div>
        </button>
      ) : (
        <div className="max-h-[280px] overflow-auto py-1">
          {matches.map((r, idx: number) => {
            const isSelected = idx === selectedIndex;
            const isRecipe = r.type === 'recipe';
            const isCustom = r.type === 'custom';
            return (
              <button
                key={`${r.id}-${idx}`}
                type="button"
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  isSelected ? 'bg-[#F5EBE0] text-[#8B6F47]' : 'text-slate-700 hover:bg-slate-50'
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => onIndexChange(idx)}
                onClick={() => {
                  void (isCustom ? onAddMeal('', r.name) : onAddMeal(r.id)).then(() => {
                    onClose();
                  });
                }}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${
                    isRecipe
                      ? 'bg-emerald-100 text-emerald-700'
                      : isCustom
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isRecipe ? '📖' : isCustom ? '⭐' : '🍽️'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{r.name}</div>
                  <div className="text-xs text-slate-500">
                    {isRecipe ? 'Recipe' : isCustom ? `Used ${r.count ?? 1}x` : 'Meal option'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Toolbar for multi-cell selection mode
 */
export function SelectionToolbar({
  selectedCount,
  query,
  onQueryChange,
  matches,
  selectedIndex,
  onIndexChange,
  onKeyDown,
  inputRef,
  showList,
  onShowListChange,
  onAddMeal,
  onDeleteMeals,
  onClearSelection,
}: SelectionToolbarProps): ReactElement {
  return (
    <section className="rounded-lg border-2 border-[#C18B5E] bg-[#F5EBE0] p-3 sm:p-4 shadow-lg animate-in slide-in-from-top">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C18B5E] text-white font-semibold text-sm">
              {selectedCount}
            </div>
            <span className="text-sm font-medium text-[#8B6F47]">
              {selectedCount} cell{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>
          <span className="text-xs text-[#C18B5E]">
            <span className="hidden sm:inline">Cmd/Ctrl + click to select more cells</span>
            <span className="sm:hidden">Tap cells to select</span>
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative w-full sm:w-64">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                onQueryChange(e.target.value);
                onShowListChange(true);
              }}
              onFocus={() => onShowListChange(true)}
              onBlur={() => setTimeout(() => onShowListChange(false), 200)}
              onKeyDown={onKeyDown}
              placeholder="Type meal name..."
              aria-label="Search meals to add to selected cells"
              className="w-full rounded-md border border-[#E5B88A] px-3 py-2 text-sm focus:border-[#C18B5E] focus:outline-none focus:ring-2 focus:ring-[#E5B88A]"
            />
            {showList &&
              query.trim().length > 0 &&
              inputRef.current &&
              createPortal(
                <MultiCellDropdown
                  matches={matches}
                  selectedIndex={selectedIndex}
                  onIndexChange={onIndexChange}
                  onAddMeal={onAddMeal}
                  onClose={() => onShowListChange(false)}
                  query={query}
                  inputRef={inputRef}
                />,
                document.body
              )}
          </div>
          <button
            type="button"
            onClick={() => void onDeleteMeals()}
            className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition flex items-center gap-2"
            title="Delete all meals from selected cells"
          >
            <Trash2 className="w-4 h-4" />
            Delete Meals
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            className="rounded-md border border-[#E5B88A] px-4 py-2 text-sm font-medium text-[#8B6F47] hover:bg-[#F5EBE0] transition"
          >
            Clear Selection
          </button>
        </div>
      </div>
    </section>
  );
}
