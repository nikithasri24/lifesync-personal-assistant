/**
 * Meal Autocomplete Component
 *
 * Dropdown autocomplete for meal names with search across recipes,
 * historical custom meals, and food items.
 * Uses React Portal to render dropdown outside parent overflow constraints.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Clock, Apple, ChevronUp, ChevronDown } from 'lucide-react';
import { useMealSearchQuery, type MealSearchResult } from '@/hooks/useMealPlanningQuery';

export interface MealAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: MealSearchResult) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onBlur?: () => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
}

export function MealAutocomplete({
  value,
  onChange,
  onSelect,
  onKeyDown,
  onBlur,
  placeholder = 'e.g., Scrambled eggs, Oatmeal...',
  inputRef: externalRef,
  className,
}: MealAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef || internalRef;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search - only search after 300ms of no typing
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  const { data: results = [], isLoading } = useMealSearchQuery(debouncedQuery, {
    enabled: debouncedQuery.trim().length >= 2,
  });

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen, results]);

  // Open dropdown when we have results
  useEffect(() => {
    if (results.length > 0 && value.trim().length >= 2) {
      setIsOpen(true);
      setHighlightedIndex(0);
    } else {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }, [results, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) {
        onKeyDown?.(e);
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
          break;
        case 'Enter':
          if (highlightedIndex >= 0 && highlightedIndex < results.length) {
            e.preventDefault();
            const selected = results[highlightedIndex];
            onSelect(selected);
            setIsOpen(false);
          } else {
            onKeyDown?.(e);
          }
          break;
        case 'Escape':
          if (isOpen) {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
          } else {
            onKeyDown?.(e);
          }
          break;
        case 'Tab':
          setIsOpen(false);
          onKeyDown?.(e);
          break;
        default:
          onKeyDown?.(e);
      }
    },
    [isOpen, results, highlightedIndex, onSelect, onKeyDown]
  );

  const getTypeIcon = (type: MealSearchResult['type']) => {
    switch (type) {
      case 'recipe':
        return <BookOpen className="w-3.5 h-3.5 text-indigo-500" />;
      case 'custom_meal':
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
      case 'food_item':
        return <Apple className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  // Render dropdown via portal to escape overflow:hidden containers
  const dropdownContent = isOpen && results.length > 0 && createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 9999,
      }}
      className="bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
    >
      {results.map((result, index) => (
        <button
          key={result.id}
          type="button"
          onClick={() => {
            onSelect(result);
            setIsOpen(false);
          }}
          onMouseEnter={() => setHighlightedIndex(index)}
          className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
            index === highlightedIndex
              ? 'bg-indigo-50 text-indigo-900'
              : 'hover:bg-slate-50 text-slate-700'
          }`}
        >
          {getTypeIcon(result.type)}
          <span className="flex-1 truncate">{result.name}</span>
          {result.frequency && result.frequency > 1 && (
            <span className="text-xs text-slate-400">
              {result.frequency}×
            </span>
          )}
          {result.calories && (
            <span className="text-xs text-slate-400">
              {result.calories} cal
            </span>
          )}
        </button>
      ))}

      {/* Keyboard hints */}
      <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex items-center gap-3">
        <span className="flex items-center gap-1">
          <ChevronUp className="w-3 h-3" /><ChevronDown className="w-3 h-3" /> navigate
        </span>
        <span>↵ select</span>
        <span>esc close</span>
      </div>
    </div>,
    document.body
  );

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Delay to allow click on dropdown item
          setTimeout(() => {
            setIsOpen(false);
            onBlur?.();
          }, 200);
        }}
        placeholder={placeholder}
        className={className || "flex-1 min-w-0 w-full px-3 py-1.5 text-sm border-0 bg-slate-50 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-100 placeholder:text-slate-400"}
      />

      {/* Dropdown rendered via portal */}
      {dropdownContent}

      {/* Loading indicator */}
      {isLoading && value.trim().length >= 2 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export default MealAutocomplete;

