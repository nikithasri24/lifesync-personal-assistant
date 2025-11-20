import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../../lib/supabase';
import {
  getUserPassports,
  getPrimaryPassport,
  addPassport,
  updatePassport,
  deletePassport,
  getUserVisas,
  getActiveVisas,
  addVisa,
  updateVisa,
  deleteVisa,
} from '../passportAPI';
import type { UserPassport, UserVisa } from '../../types/visa';

// Mock Supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('passportAPI', () => {
  const mockUser = { id: 'test-user-123' };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
    });
  });

  describe('getUserPassports', () => {
    it('should fetch all passports for authenticated user', async () => {
      const mockPassports = [
        {
          id: 'passport-1',
          user_id: 'test-user-123',
          country_code: 'US',
          country_name: 'United States',
          passport_number: 'US123456',
          issue_date: '2020-01-01',
          expiry_date: '2030-01-01',
          is_primary: true,
          created_at: '2025-11-19T12:00:00Z',
          updated_at: '2025-11-19T12:00:00Z',
        },
        {
          id: 'passport-2',
          user_id: 'test-user-123',
          country_code: 'GB',
          country_name: 'United Kingdom',
          passport_number: 'GB789012',
          issue_date: '2021-01-01',
          expiry_date: '2031-01-01',
          is_primary: false,
          created_at: '2025-11-18T12:00:00Z',
          updated_at: '2025-11-18T12:00:00Z',
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockPassports,
            error: null,
          }),
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await getUserPassports();

      expect(supabase.from).toHaveBeenCalledWith('user_passports');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(result).toHaveLength(2);
      expect(result[0].countryCode).toBe('US');
      expect(result[0].isPrimary).toBe(true);
      expect(result[1].countryCode).toBe('GB');
    });

    it('should return empty array when no passports found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await getUserPassports();

      expect(result).toEqual([]);
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(getUserPassports()).rejects.toThrow('Not authenticated');
    });

    it('should throw error when database query fails', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(getUserPassports()).rejects.toThrow();
    });
  });

  describe('getPrimaryPassport', () => {
    it('should fetch primary passport for authenticated user', async () => {
      const mockPassport = {
        id: 'passport-1',
        user_id: 'test-user-123',
        country_code: 'US',
        country_name: 'United States',
        passport_number: 'US123456',
        issue_date: '2020-01-01',
        expiry_date: '2030-01-01',
        is_primary: true,
        created_at: '2025-11-19T12:00:00Z',
        updated_at: '2025-11-19T12:00:00Z',
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPassport,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await getPrimaryPassport();

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockQuery.eq).toHaveBeenCalledWith('is_primary', true);
      expect(result).not.toBeNull();
      expect(result!.isPrimary).toBe(true);
      expect(result!.countryCode).toBe('US');
    });

    it('should return null when no primary passport exists', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // No rows returned
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await getPrimaryPassport();

      expect(result).toBeNull();
    });

    it('should throw error for non-PGRST116 errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Other database error' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(getPrimaryPassport()).rejects.toThrow();
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(getPrimaryPassport()).rejects.toThrow('Not authenticated');
    });
  });

  describe('addPassport', () => {
    it('should create a new passport', async () => {
      const mockInsertedPassport = {
        id: 'passport-new',
        user_id: 'test-user-123',
        country_code: 'CA',
        country_name: 'Canada',
        passport_number: 'CA123456',
        issue_date: '2022-01-01',
        expiry_date: '2032-01-01',
        is_primary: false,
        created_at: '2025-11-19T12:00:00Z',
        updated_at: '2025-11-19T12:00:00Z',
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInsertedPassport,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockInsertQuery);

      const newPassport = {
        countryCode: 'CA',
        countryName: 'Canada',
        passportNumber: 'CA123456',
        issueDate: '2022-01-01',
        expiryDate: '2032-01-01',
        isPrimary: false,
      };

      const result = await addPassport(newPassport);

      expect(supabase.from).toHaveBeenCalledWith('user_passports');
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          country_code: 'CA',
          country_name: 'Canada',
          passport_number: 'CA123456',
          issue_date: '2022-01-01',
          expiry_date: '2032-01-01',
          is_primary: false,
        })
      );
      expect(result.countryCode).toBe('CA');
      expect(result.isPrimary).toBe(false);
    });

    it('should unset other primary passports when adding a new primary passport', async () => {
      const mockUpdateEq1 = vi.fn().mockReturnThis();
      const mockUpdateEq2 = vi.fn().mockResolvedValue({ data: null, error: null });

      const mockUpdateQuery = {
        update: vi.fn().mockReturnValue({ eq: mockUpdateEq1 }),
      };

      mockUpdateEq1.mockReturnValue({ eq: mockUpdateEq2 });

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'passport-new',
            user_id: 'test-user-123',
            country_code: 'CA',
            country_name: 'Canada',
            is_primary: true,
            created_at: '2025-11-19T12:00:00Z',
            updated_at: '2025-11-19T12:00:00Z',
          },
          error: null,
        }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(mockUpdateQuery)
        .mockReturnValueOnce(mockInsertQuery);

      await addPassport({
        countryCode: 'CA',
        countryName: 'Canada',
        isPrimary: true,
      });

      expect(mockUpdateQuery.update).toHaveBeenCalledWith({ is_primary: false });
      expect(mockUpdateEq1).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockUpdateEq2).toHaveBeenCalledWith('is_primary', true);
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(
        addPassport({
          countryCode: 'CA',
          countryName: 'Canada',
          isPrimary: false,
        })
      ).rejects.toThrow('Not authenticated');
    });

    it('should throw error when insert fails', async () => {
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockInsertQuery);

      await expect(
        addPassport({
          countryCode: 'CA',
          countryName: 'Canada',
          isPrimary: false,
        })
      ).rejects.toThrow();
    });
  });

  describe('updatePassport', () => {
    it('should update an existing passport', async () => {
      const mockUpdatedPassport = {
        id: 'passport-1',
        user_id: 'test-user-123',
        country_code: 'US',
        country_name: 'United States',
        passport_number: 'US-UPDATED',
        issue_date: '2020-01-01',
        expiry_date: '2030-01-01',
        is_primary: true,
        created_at: '2025-11-19T12:00:00Z',
        updated_at: '2025-11-19T13:00:00Z',
      };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedPassport,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const updates = {
        passportNumber: 'US-UPDATED',
      };

      const result = await updatePassport('passport-1', updates);

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          passport_number: 'US-UPDATED',
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'passport-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(result.passportNumber).toBe('US-UPDATED');
    });

    it('should unset other primary passports when setting as primary', async () => {
      const mockPrimaryEq1 = vi.fn().mockReturnThis();
      const mockPrimaryEq2 = vi.fn().mockReturnThis();
      const mockPrimaryNeq = vi.fn().mockResolvedValue({ data: null, error: null });

      const mockUpdatePrimaryQuery = {
        update: vi.fn().mockReturnValue({ eq: mockPrimaryEq1 }),
      };

      mockPrimaryEq1.mockReturnValue({ eq: mockPrimaryEq2 });
      mockPrimaryEq2.mockReturnValue({ neq: mockPrimaryNeq });

      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'passport-2',
          user_id: 'test-user-123',
          country_code: 'GB',
          country_name: 'United Kingdom',
          is_primary: true,
          created_at: '2025-11-19T12:00:00Z',
          updated_at: '2025-11-19T13:00:00Z',
        },
        error: null,
      });

      const mockUpdateQuery = {
        update: vi.fn().mockReturnValue({ eq: mockEq1 }),
      };

      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      (supabase.from as any)
        .mockReturnValueOnce(mockUpdatePrimaryQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      await updatePassport('passport-2', { isPrimary: true });

      expect(mockUpdatePrimaryQuery.update).toHaveBeenCalledWith({ is_primary: false });
      expect(mockPrimaryNeq).toHaveBeenCalledWith('id', 'passport-2');
    });

    it('should only update provided fields', async () => {
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'passport-1',
          user_id: 'test-user-123',
          country_code: 'US',
          country_name: 'United States',
          expiry_date: '2035-01-01',
          is_primary: true,
          created_at: '2025-11-19T12:00:00Z',
          updated_at: '2025-11-19T13:00:00Z',
        },
        error: null,
      });

      const mockQuery = {
        update: vi.fn().mockReturnValue({ eq: mockEq1 }),
      };

      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      (supabase.from as any).mockReturnValue(mockQuery);

      await updatePassport('passport-1', { expiryDate: '2035-01-01' });

      const updateCall = mockQuery.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('expiry_date', '2035-01-01');
      expect(updateCall).not.toHaveProperty('passport_number');
      expect(updateCall).not.toHaveProperty('country_code');
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(
        updatePassport('passport-1', { passportNumber: 'NEW' })
      ).rejects.toThrow('Not authenticated');
    });

    it('should throw error when update fails', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(
        updatePassport('passport-1', { passportNumber: 'NEW' })
      ).rejects.toThrow();
    });
  });

  describe('deletePassport', () => {
    it('should delete a passport', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });

      const mockQuery = {
        delete: mockDelete,
      };

      mockDelete.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });

      (supabase.from as any).mockReturnValue(mockQuery);

      await deletePassport('passport-1');

      expect(supabase.from).toHaveBeenCalledWith('user_passports');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith('id', 'passport-1');
      expect(mockEq2).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(deletePassport('passport-1')).rejects.toThrow('Not authenticated');
    });

    it('should throw error when deletion fails', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockResolvedValue({
        error: { message: 'Delete failed' },
      });

      const mockQuery = {
        delete: mockDelete,
      };

      mockDelete.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(deletePassport('passport-1')).rejects.toThrow();
    });
  });

  describe('getUserVisas', () => {
    it('should fetch all visas for authenticated user', async () => {
      const mockVisas = [
        {
          id: 'visa-1',
          user_id: 'test-user-123',
          country_code: 'JP',
          country_name: 'Japan',
          visa_type: 'Tourist',
          issue_date: '2025-01-01',
          expiry_date: '2026-01-01',
          multiple_entry: true,
          max_stay_days: 90,
          notes: 'Test visa',
          created_at: '2025-11-19T12:00:00Z',
          updated_at: '2025-11-19T12:00:00Z',
        },
        {
          id: 'visa-2',
          user_id: 'test-user-123',
          country_code: 'CN',
          country_name: 'China',
          visa_type: 'Business',
          issue_date: '2024-06-01',
          expiry_date: '2024-12-01',
          multiple_entry: false,
          max_stay_days: 30,
          notes: null,
          created_at: '2025-11-18T12:00:00Z',
          updated_at: '2025-11-18T12:00:00Z',
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockVisas,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await getUserVisas();

      expect(supabase.from).toHaveBeenCalledWith('user_visas');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockQuery.order).toHaveBeenCalledWith('expiry_date', { ascending: false });
      expect(result).toHaveLength(2);
      expect(result[0].countryCode).toBe('JP');
      expect(result[0].multipleEntry).toBe(true);
    });

    it('should return empty array when no visas found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await getUserVisas();

      expect(result).toEqual([]);
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(getUserVisas()).rejects.toThrow('Not authenticated');
    });

    it('should throw error when database query fails', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(getUserVisas()).rejects.toThrow();
    });
  });

  describe('getActiveVisas', () => {
    it('should fetch only active (non-expired) visas', async () => {
      const mockVisas = [
        {
          id: 'visa-1',
          user_id: 'test-user-123',
          country_code: 'JP',
          country_name: 'Japan',
          visa_type: 'Tourist',
          issue_date: '2025-01-01',
          expiry_date: '2026-01-01',
          multiple_entry: true,
          max_stay_days: 90,
          notes: null,
          created_at: '2025-11-19T12:00:00Z',
          updated_at: '2025-11-19T12:00:00Z',
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockVisas,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await getActiveVisas();

      expect(mockQuery.gte).toHaveBeenCalledWith('expiry_date', expect.any(String));
      expect(result).toHaveLength(1);
      expect(result[0].countryCode).toBe('JP');
    });

    it('should return empty array when no active visas found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await getActiveVisas();

      expect(result).toEqual([]);
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(getActiveVisas()).rejects.toThrow('Not authenticated');
    });
  });

  describe('addVisa', () => {
    it('should create a new visa', async () => {
      const mockInsertedVisa = {
        id: 'visa-new',
        user_id: 'test-user-123',
        country_code: 'IN',
        country_name: 'India',
        visa_type: 'Tourist',
        issue_date: '2025-01-01',
        expiry_date: '2026-01-01',
        multiple_entry: true,
        max_stay_days: 90,
        notes: 'E-visa',
        created_at: '2025-11-19T12:00:00Z',
        updated_at: '2025-11-19T12:00:00Z',
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInsertedVisa,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const newVisa = {
        countryCode: 'IN',
        countryName: 'India',
        visaType: 'Tourist',
        issueDate: '2025-01-01',
        expiryDate: '2026-01-01',
        multipleEntry: true,
        maxStayDays: 90,
        notes: 'E-visa',
      };

      const result = await addVisa(newVisa);

      expect(supabase.from).toHaveBeenCalledWith('user_visas');
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          country_code: 'IN',
          country_name: 'India',
          visa_type: 'Tourist',
          issue_date: '2025-01-01',
          expiry_date: '2026-01-01',
          multiple_entry: true,
          max_stay_days: 90,
          notes: 'E-visa',
        })
      );
      expect(result.countryCode).toBe('IN');
      expect(result.multipleEntry).toBe(true);
    });

    it('should handle optional fields', async () => {
      const mockInsertedVisa = {
        id: 'visa-new',
        user_id: 'test-user-123',
        country_code: 'BR',
        country_name: 'Brazil',
        visa_type: null,
        issue_date: null,
        expiry_date: '2026-06-01',
        multiple_entry: false,
        max_stay_days: null,
        notes: null,
        created_at: '2025-11-19T12:00:00Z',
        updated_at: '2025-11-19T12:00:00Z',
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInsertedVisa,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const newVisa = {
        countryCode: 'BR',
        countryName: 'Brazil',
        expiryDate: '2026-06-01',
        multipleEntry: false,
      };

      await addVisa(newVisa);

      const insertCall = mockQuery.insert.mock.calls[0][0];
      expect(insertCall.country_code).toBe('BR');
      expect(insertCall.multiple_entry).toBe(false);
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(
        addVisa({
          countryCode: 'IN',
          countryName: 'India',
          expiryDate: '2026-01-01',
          multipleEntry: true,
        })
      ).rejects.toThrow('Not authenticated');
    });

    it('should throw error when insert fails', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(
        addVisa({
          countryCode: 'IN',
          countryName: 'India',
          expiryDate: '2026-01-01',
          multipleEntry: true,
        })
      ).rejects.toThrow();
    });
  });

  describe('updateVisa', () => {
    it('should update an existing visa', async () => {
      const mockUpdatedVisa = {
        id: 'visa-1',
        user_id: 'test-user-123',
        country_code: 'JP',
        country_name: 'Japan',
        visa_type: 'Tourist',
        issue_date: '2025-01-01',
        expiry_date: '2027-01-01',
        multiple_entry: true,
        max_stay_days: 90,
        notes: 'Extended',
        created_at: '2025-11-19T12:00:00Z',
        updated_at: '2025-11-19T13:00:00Z',
      };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedVisa,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const updates = {
        expiryDate: '2027-01-01',
        notes: 'Extended',
      };

      const result = await updateVisa('visa-1', updates);

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          expiry_date: '2027-01-01',
          notes: 'Extended',
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'visa-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(result.expiryDate).toBe('2027-01-01');
      expect(result.notes).toBe('Extended');
    });

    it('should only update provided fields', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'visa-1',
            user_id: 'test-user-123',
            country_code: 'JP',
            country_name: 'Japan',
            multiple_entry: false,
            created_at: '2025-11-19T12:00:00Z',
            updated_at: '2025-11-19T13:00:00Z',
          },
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await updateVisa('visa-1', { multipleEntry: false });

      const updateCall = mockQuery.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('multiple_entry', false);
      expect(updateCall).not.toHaveProperty('expiry_date');
      expect(updateCall).not.toHaveProperty('visa_type');
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(
        updateVisa('visa-1', { notes: 'Updated' })
      ).rejects.toThrow('Not authenticated');
    });

    it('should throw error when update fails', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(
        updateVisa('visa-1', { notes: 'Updated' })
      ).rejects.toThrow();
    });
  });

  describe('deleteVisa', () => {
    it('should delete a visa', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });

      const mockQuery = {
        delete: mockDelete,
      };

      mockDelete.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });

      (supabase.from as any).mockReturnValue(mockQuery);

      await deleteVisa('visa-1');

      expect(supabase.from).toHaveBeenCalledWith('user_visas');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith('id', 'visa-1');
      expect(mockEq2).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(deleteVisa('visa-1')).rejects.toThrow('Not authenticated');
    });

    it('should throw error when deletion fails', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockResolvedValue({
        error: { message: 'Delete failed' },
      });

      const mockQuery = {
        delete: mockDelete,
      };

      mockDelete.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(deleteVisa('visa-1')).rejects.toThrow();
    });
  });
});
