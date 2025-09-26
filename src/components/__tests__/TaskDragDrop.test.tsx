import { describe, it, expect } from 'vitest';
import { mockDndKit, resetDragDropMocks } from '../../test/drag-drop-utils';

describe('drag and drop test utilities', () => {
  it('initialises and tears down without throwing', () => {
    expect(() => {
      mockDndKit();
      resetDragDropMocks();
    }).not.toThrow();
  });
});
