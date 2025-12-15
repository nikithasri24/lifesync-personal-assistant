import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toCSV, downloadCSV } from '../csv';

describe('csv utilities', () => {
  describe('toCSV', () => {
    it('should convert array of objects to CSV', () => {
      const data = [
        { name: 'Alice', age: 30, city: 'NYC' },
        { name: 'Bob', age: 25, city: 'LA' },
      ];

      const result = toCSV(data);

      expect(result).toBe('name,age,city\nAlice,30,NYC\nBob,25,LA');
    });

    it('should handle empty array', () => {
      const result = toCSV([]);
      expect(result).toBe('');
    });

    it('should escape fields containing commas', () => {
      const data = [
        { name: 'Smith, John', amount: 100 },
      ];

      const result = toCSV(data);

      expect(result).toContain('"Smith, John"');
    });

    it('should escape fields containing newlines', () => {
      const data = [
        { description: 'Line 1\nLine 2', amount: 100 },
      ];

      const result = toCSV(data);

      expect(result).toContain('"Line 1\nLine 2"');
    });

    it('should escape fields containing quotes', () => {
      const data = [
        { name: 'John "Johnny" Doe', amount: 100 },
      ];

      const result = toCSV(data);

      expect(result).toContain('"John ""Johnny"" Doe"');
    });

    it('should handle null values', () => {
      const data = [
        { name: 'Alice', age: null, city: 'NYC' },
      ];

      const result = toCSV(data);

      expect(result).toBe('name,age,city\nAlice,,NYC');
    });

    it('should handle undefined values', () => {
      const data = [
        { name: 'Alice', age: undefined, city: 'NYC' },
      ];

      const result = toCSV(data);

      expect(result).toBe('name,age,city\nAlice,,NYC');
    });

    it('should convert numbers to strings', () => {
      const data = [
        { amount: 1234.56, count: 10 },
      ];

      const result = toCSV(data);

      expect(result).toBe('amount,count\n1234.56,10');
    });

    it('should handle boolean values', () => {
      const data = [
        { active: true, verified: false },
      ];

      const result = toCSV(data);

      expect(result).toBe('active,verified\ntrue,false');
    });

    it('should handle special characters', () => {
      const data = [
        { name: 'Café & Restaurant', symbol: '@#$%' },
      ];

      const result = toCSV(data);

      expect(result).toContain('Café & Restaurant');
      expect(result).toContain('@#$%');
    });

    it('should maintain consistent column order', () => {
      const data = [
        { c: 3, a: 1, b: 2 },
        { c: 6, a: 4, b: 5 },
      ];

      const result = toCSV(data);
      const lines = result.split('\n');

      expect(lines[0]).toBe('c,a,b');
      expect(lines[1]).toBe('3,1,2');
      expect(lines[2]).toBe('6,4,5');
    });

    it('should handle large dataset', () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        value: i * 100,
      }));

      const result = toCSV(data);
      const lines = result.split('\n');

      expect(lines).toHaveLength(1001); // Header + 1000 rows
      expect(lines[0]).toBe('id,name,value');
      expect(lines[1000]).toBe('999,User 999,99900');
    });

    it('should handle objects with nested values (converted to string)', () => {
      const data = [
        { name: 'Alice', metadata: { city: 'NYC' } },
      ];

      const result = toCSV(data);

      expect(result).toContain('[object Object]');
    });

    it('should handle single row', () => {
      const data = [
        { name: 'Alice', age: 30 },
      ];

      const result = toCSV(data);

      expect(result).toBe('name,age\nAlice,30');
    });

    it('should handle fields that need quotes but have no special chars', () => {
      const data = [
        { name: 'Simple', value: 100 },
      ];

      const result = toCSV(data);

      expect(result).toBe('name,value\nSimple,100');
    });
  });

  describe('downloadCSV', () => {
    let createElementSpy: any;
    let _appendChildSpy: any;
    let _removeChildSpy: any;
    let createObjectURLSpy: any;
    let revokeObjectURLSpy: any;

    beforeEach(() => {
      // Mock DOM elements and methods
      const mockAnchor = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
        remove: vi.fn(),
      };

      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      _appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
      _removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);

      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create and trigger download', () => {
      downloadCSV('test.csv', 'name,age\nAlice,30');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should set correct filename', () => {
      downloadCSV('transactions.csv', 'data');

      const anchor = createElementSpy.mock.results[0].value;
      expect(anchor.download).toBe('transactions.csv');
    });

    it('should create blob with correct content', () => {
      const csvContent = 'name,age\nAlice,30';
      downloadCSV('test.csv', csvContent);

      expect(createObjectURLSpy).toHaveBeenCalled();
      const blobCall = createObjectURLSpy.mock.calls[0][0];
      expect(blobCall).toBeInstanceOf(Blob);
      expect(blobCall.type).toBe('text/csv;charset=utf-8;');
    });

    it('should hide anchor element', () => {
      downloadCSV('test.csv', 'data');

      const anchor = createElementSpy.mock.results[0].value;
      expect(anchor.style.display).toBe('none');
    });

    it('should trigger click', () => {
      downloadCSV('test.csv', 'data');

      const anchor = createElementSpy.mock.results[0].value;
      expect(anchor.click).toHaveBeenCalled();
    });

    it('should clean up after download', () => {
      downloadCSV('test.csv', 'data');

      const anchor = createElementSpy.mock.results[0].value;
      expect(anchor.remove).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should handle empty CSV', () => {
      downloadCSV('empty.csv', '');

      expect(createElementSpy).toHaveBeenCalled();
      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('should handle large CSV content', () => {
      const largeCSV = Array.from({ length: 10000 }, (_, i) => `row${i}`).join('\n');

      downloadCSV('large.csv', largeCSV);

      expect(createObjectURLSpy).toHaveBeenCalled();
    });
  });
});
