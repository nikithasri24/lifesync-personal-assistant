/**
 * Unit tests for useSharedState hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSharedState } from '../useSharedState';

describe('useSharedState', () => {
  it('should initialize with partner tab', () => {
    const { result } = renderHook(() => useSharedState());

    expect(result.current.activeTab).toBe('partner');
  });

  it('should switch to invites tab', () => {
    const { result } = renderHook(() => useSharedState());

    act(() => {
      result.current.setActiveTab('invites');
    });

    expect(result.current.activeTab).toBe('invites');
  });

  it('should switch to activity tab', () => {
    const { result } = renderHook(() => useSharedState());

    act(() => {
      result.current.setActiveTab('activity');
    });

    expect(result.current.activeTab).toBe('activity');
  });

  it('should switch between tabs multiple times', () => {
    const { result } = renderHook(() => useSharedState());

    expect(result.current.activeTab).toBe('partner');

    act(() => {
      result.current.setActiveTab('invites');
    });
    expect(result.current.activeTab).toBe('invites');

    act(() => {
      result.current.setActiveTab('activity');
    });
    expect(result.current.activeTab).toBe('activity');

    act(() => {
      result.current.setActiveTab('partner');
    });
    expect(result.current.activeTab).toBe('partner');
  });

  it('should maintain independent state across multiple instances', () => {
    const { result: result1 } = renderHook(() => useSharedState());
    const { result: result2 } = renderHook(() => useSharedState());

    act(() => {
      result1.current.setActiveTab('invites');
    });

    expect(result1.current.activeTab).toBe('invites');
    expect(result2.current.activeTab).toBe('partner');
  });

  it('should handle rapid tab switches', () => {
    const { result } = renderHook(() => useSharedState());

    act(() => {
      result.current.setActiveTab('invites');
      result.current.setActiveTab('activity');
      result.current.setActiveTab('partner');
      result.current.setActiveTab('invites');
    });

    expect(result.current.activeTab).toBe('invites');
  });
});
