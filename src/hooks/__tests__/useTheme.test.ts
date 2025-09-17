import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme, Theme } from '../useTheme'

// Mock matchMedia
const mockMatchMedia = vi.fn()

describe('useTheme', () => {
  let mockMediaQuery: {
    matches: boolean
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    // Reset localStorage
    localStorage.clear()
    
    // Reset document classes
    document.documentElement.className = ''
    
    // Mock matchMedia
    mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mockMediaQuery)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('starts with system theme when no saved preference', () => {
      const { result } = renderHook(() => useTheme())
      
      expect(result.current.theme).toBe('system')
      expect(result.current.currentTheme).toBe('light') // default system theme
    })

    it('starts with saved theme from localStorage', () => {
      localStorage.setItem('lifesync-theme', 'dark')
      
      const { result } = renderHook(() => useTheme())
      
      expect(result.current.theme).toBe('dark')
      expect(result.current.currentTheme).toBe('dark')
    })

    it('detects system dark mode preference', () => {
      mockMediaQuery.matches = true
      
      const { result } = renderHook(() => useTheme())
      
      expect(result.current.theme).toBe('system')
      expect(result.current.currentTheme).toBe('dark')
    })

    it('handles invalid saved theme gracefully', () => {
      localStorage.setItem('lifesync-theme', 'invalid-theme')
      
      const { result } = renderHook(() => useTheme())
      
      expect(result.current.theme).toBe('system')
    })
  })

  describe('Theme Setting', () => {
    it('updates theme and saves to localStorage', () => {
      const { result } = renderHook(() => useTheme())
      
      act(() => {
        result.current.setTheme('dark')
      })
      
      expect(result.current.theme).toBe('dark')
      expect(result.current.currentTheme).toBe('dark')
      expect(localStorage.getItem('lifesync-theme')).toBe('dark')
    })

    it('updates currentTheme correctly for system theme', () => {
      mockMediaQuery.matches = true
      const { result } = renderHook(() => useTheme())
      
      act(() => {
        result.current.setTheme('system')
      })
      
      expect(result.current.theme).toBe('system')
      expect(result.current.currentTheme).toBe('dark')
    })

    it('allows setting all valid theme values', () => {
      const { result } = renderHook(() => useTheme())
      
      const themes: Theme[] = ['light', 'dark', 'system']
      
      themes.forEach(theme => {
        act(() => {
          result.current.setTheme(theme)
        })
        expect(result.current.theme).toBe(theme)
      })
    })
  })

  describe('Theme Toggle', () => {
    it('cycles through themes in correct order', () => {
      const { result } = renderHook(() => useTheme())
      
      // Start with light
      act(() => {
        result.current.setTheme('light')
      })
      
      // Light -> Dark
      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('dark')
      
      // Dark -> System
      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('system')
      
      // System -> Light
      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('light')
    })

    it('handles toggle from any starting theme', () => {
      const { result } = renderHook(() => useTheme())
      
      // Start with dark
      act(() => {
        result.current.setTheme('dark')
      })
      
      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('system')
      
      // Start with system
      act(() => {
        result.current.setTheme('system')
      })
      
      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('light')
    })
  })

  describe('DOM Updates', () => {
    it('adds dark class to document when dark theme is active', () => {
      const { result } = renderHook(() => useTheme())
      
      act(() => {
        result.current.setTheme('dark')
      })
      
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('removes dark class when light theme is active', () => {
      // Start with dark
      document.documentElement.classList.add('dark')
      
      const { result } = renderHook(() => useTheme())
      
      act(() => {
        result.current.setTheme('light')
      })
      
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('applies correct class for system theme', () => {
      mockMediaQuery.matches = true // System is dark
      
      const { result } = renderHook(() => useTheme())
      
      act(() => {
        result.current.setTheme('system')
      })
      
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('System Theme Changes', () => {
    it('listens for system theme changes', () => {
      renderHook(() => useTheme())
      
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('updates system theme when media query changes', () => {
      const { result } = renderHook(() => useTheme())
      
      // Get the change handler
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1]
      
      // Simulate system theme change to dark
      act(() => {
        changeHandler({ matches: true })
      })
      
      expect(result.current.currentTheme).toBe('dark')
    })

    it('updates system theme when media query changes to light', () => {
      mockMediaQuery.matches = true // Start with dark
      const { result } = renderHook(() => useTheme())
      
      expect(result.current.currentTheme).toBe('dark')
      
      // Get the change handler
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1]
      
      // Simulate system theme change to light
      act(() => {
        changeHandler({ matches: false })
      })
      
      expect(result.current.currentTheme).toBe('light')
    })

    it('only affects currentTheme when theme is system', () => {
      const { result } = renderHook(() => useTheme())
      
      // Set to explicit dark theme
      act(() => {
        result.current.setTheme('dark')
      })
      
      // Simulate system theme change
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1]
      act(() => {
        changeHandler({ matches: false })
      })
      
      // Should still be dark, not affected by system change
      expect(result.current.currentTheme).toBe('dark')
    })
  })

  describe('Cleanup', () => {
    it('removes event listener on unmount', () => {
      const { unmount } = renderHook(() => useTheme())
      
      unmount()
      
      expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })
  })

  describe('Persistence', () => {
    it('persists theme changes to localStorage', () => {
      const { result } = renderHook(() => useTheme())
      
      const themes: Theme[] = ['light', 'dark', 'system']
      
      themes.forEach(theme => {
        act(() => {
          result.current.setTheme(theme)
        })
        expect(localStorage.getItem('lifesync-theme')).toBe(theme)
      })
    })

    it('maintains theme across hook re-renders', () => {
      localStorage.setItem('lifesync-theme', 'dark')
      
      const { result, rerender } = renderHook(() => useTheme())
      
      expect(result.current.theme).toBe('dark')
      
      rerender()
      
      expect(result.current.theme).toBe('dark')
    })
  })

  describe('Edge Cases', () => {
    it('handles localStorage being unavailable', () => {
      // Mock localStorage to throw
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })
      
      const { result } = renderHook(() => useTheme())
      
      // Should not crash when trying to set theme
      expect(() => {
        act(() => {
          result.current.setTheme('dark')
        })
      }).not.toThrow()
      
      // Restore
      localStorage.setItem = originalSetItem
    })

    it('handles matchMedia being unavailable', () => {
      // Remove matchMedia
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
      })
      
      // Should not crash
      expect(() => {
        renderHook(() => useTheme())
      }).not.toThrow()
    })

    it('handles corrupted localStorage data', () => {
      localStorage.setItem('lifesync-theme', '{invalid json}')
      
      const { result } = renderHook(() => useTheme())
      
      // Should fallback to system theme
      expect(result.current.theme).toBe('system')
    })
  })

  describe('Return Values', () => {
    it('returns all expected properties', () => {
      const { result } = renderHook(() => useTheme())
      
      expect(result.current).toHaveProperty('theme')
      expect(result.current).toHaveProperty('currentTheme')
      expect(result.current).toHaveProperty('setTheme')
      expect(result.current).toHaveProperty('toggleTheme')
      
      expect(typeof result.current.theme).toBe('string')
      expect(typeof result.current.currentTheme).toBe('string')
      expect(typeof result.current.setTheme).toBe('function')
      expect(typeof result.current.toggleTheme).toBe('function')
    })

    it('currentTheme is always light or dark', () => {
      const { result } = renderHook(() => useTheme())
      
      const validThemes = ['light', 'dark']
      
      // Test all theme settings
      const allThemes: Theme[] = ['light', 'dark', 'system']
      allThemes.forEach(theme => {
        act(() => {
          result.current.setTheme(theme)
        })
        expect(validThemes).toContain(result.current.currentTheme)
      })
    })
  })
})