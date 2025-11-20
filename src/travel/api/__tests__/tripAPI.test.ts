import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../../lib/supabase';
import {
  getUserTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  addDestination,
  removeDestination,
  saveVisaRequirement,
} from '../tripAPI';

// Mock Supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('tripAPI', () => {
  const mockUser = { id: 'test-user-123' };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
    });
  });

  describe('getUserTrips', () => {
    it('should fetch all trips for authenticated user', async () => {
      const mockTrips = [
        {
          id: 'trip-1',
          user_id: 'test-user-123',
          name: 'Europe Trip',
          description: 'Summer vacation',
          start_date: '2025-06-01',
          end_date: '2025-06-30',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockTrips,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await getUserTrips();

      expect(supabase.from).toHaveBeenCalledWith('trips');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('trip-1');
      expect(result[0].name).toBe('Europe Trip');
    });

    it('should return empty array when no trips found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await getUserTrips();

      expect(result).toEqual([]);
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(getUserTrips()).rejects.toThrow('Not authenticated');
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

      await expect(getUserTrips()).rejects.toThrow();
    });
  });

  describe('getTripById', () => {
    it('should fetch trip with all destinations and visa requirements', async () => {
      const mockTrip = {
        id: 'trip-1',
        user_id: 'test-user-123',
        name: 'Europe Trip',
        description: 'Summer vacation',
        start_date: '2025-06-01',
        end_date: '2025-06-30',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockDestinations = [
        {
          id: 'dest-1',
          trip_id: 'trip-1',
          country_code: 'FR',
          country_name: 'France',
          arrival_date: '2025-06-01',
          departure_date: '2025-06-10',
          days_staying: 9,
          order_index: 1,
          notes: 'Paris',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      const mockVisaReqs = [
        {
          id: 'visa-1',
          trip_id: 'trip-1',
          destination_id: 'dest-1',
          visa_type: 'visa-free',
          days_allowed: 90,
          estimated_cost: 0,
          processing_days: 0,
          access_via: 'passport',
          notes: 'Schengen',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      const mockTripQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockTrip,
          error: null,
        }),
      };

      const mockDestQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockDestinations,
          error: null,
        }),
      };

      const mockVisaQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockVisaReqs,
          error: null,
        }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(mockTripQuery)
        .mockReturnValueOnce(mockDestQuery)
        .mockReturnValueOnce(mockVisaQuery);

      const result = await getTripById('trip-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('trip-1');
      expect(result!.destinations).toHaveLength(1);
      expect(result!.destinations[0].countryCode).toBe('FR');
      expect(result!.destinations[0].visaRequirement).toBeDefined();
      expect(result!.destinations[0].visaRequirement!.visaType).toBe('visa-free');
    });

    it('should return null when trip not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await getTripById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(getTripById('trip-1')).rejects.toThrow('Not authenticated');
    });
  });

  describe('createTrip', () => {
    it('should create a new trip', async () => {
      const mockInsertedTrip = {
        id: 'trip-new',
        user_id: 'test-user-123',
        name: 'Asia Trip',
        description: 'Adventure',
        start_date: '2025-07-01',
        end_date: '2025-07-31',
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInsertedTrip,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const newTrip = {
        name: 'Asia Trip',
        description: 'Adventure',
        startDate: '2025-07-01',
        endDate: '2025-07-31',
      };

      const result = await createTrip(newTrip);

      expect(supabase.from).toHaveBeenCalledWith('trips');
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          name: 'Asia Trip',
          description: 'Adventure',
          start_date: '2025-07-01',
          end_date: '2025-07-31',
        })
      );
      expect(result.name).toBe('Asia Trip');
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(
        createTrip({ name: 'Test', startDate: '2025-01-01', endDate: '2025-01-10' })
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
        createTrip({ name: 'Test', startDate: '2025-01-01', endDate: '2025-01-10' })
      ).rejects.toThrow();
    });
  });

  describe('updateTrip', () => {
    it('should update an existing trip', async () => {
      const mockUpdatedTrip = {
        id: 'trip-1',
        user_id: 'test-user-123',
        name: 'Updated Trip Name',
        description: 'Updated description',
        start_date: '2025-06-01',
        end_date: '2025-06-30',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedTrip,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const updates = {
        name: 'Updated Trip Name',
        description: 'Updated description',
      };

      const result = await updateTrip('trip-1', updates);

      expect(mockQuery.update).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'trip-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(result.name).toBe('Updated Trip Name');
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(
        updateTrip('trip-1', { name: 'Updated' })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('deleteTrip', () => {
    it('should delete a trip', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });

      const mockQuery = {
        delete: mockDelete,
      };

      mockDelete.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });

      (supabase.from as any).mockReturnValue(mockQuery);

      await deleteTrip('trip-1');

      expect(supabase.from).toHaveBeenCalledWith('trips');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith('id', 'trip-1');
      expect(mockEq2).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(deleteTrip('trip-1')).rejects.toThrow('Not authenticated');
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

      await expect(deleteTrip('trip-1')).rejects.toThrow();
    });
  });

  describe('addDestination', () => {
    it('should add a destination to a trip', async () => {
      const mockDestination = {
        id: 'dest-new',
        trip_id: 'trip-1',
        country_code: 'IT',
        country_name: 'Italy',
        arrival_date: '2025-06-15',
        departure_date: '2025-06-25',
        days_staying: 10,
        order_index: 2,
        notes: 'Rome and Venice',
        created_at: '2025-01-02T00:00:00Z',
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockDestination,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const newDestination = {
        tripId: 'trip-1',
        countryCode: 'IT',
        countryName: 'Italy',
        arrivalDate: '2025-06-15',
        departureDate: '2025-06-25',
        daysStaying: 10,
        orderIndex: 2,
        notes: 'Rome and Venice',
      };

      const result = await addDestination(newDestination);

      expect(supabase.from).toHaveBeenCalledWith('trip_destinations');
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          trip_id: 'trip-1',
          country_code: 'IT',
          country_name: 'Italy',
        })
      );
      expect(result.countryCode).toBe('IT');
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(
        addDestination({
          tripId: 'trip-1',
          countryCode: 'IT',
          countryName: 'Italy',
          orderIndex: 1,
        })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('removeDestination', () => {
    it('should remove a destination from a trip', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await removeDestination('dest-1');

      expect(supabase.from).toHaveBeenCalledWith('trip_destinations');
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'dest-1');
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(removeDestination('dest-1')).rejects.toThrow('Not authenticated');
    });
  });

  describe('saveVisaRequirement', () => {
    it('should create new visa requirement', async () => {
      const mockVisaReq = {
        id: 'visa-new',
        trip_id: 'trip-1',
        destination_id: 'dest-1',
        visa_type: 'e-visa',
        days_allowed: 30,
        estimated_cost: 50,
        processing_days: 5,
        access_via: 'passport',
        notes: 'Apply online',
        created_at: '2025-01-02T00:00:00Z',
      };

      const mockCheckQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockVisaReq,
          error: null,
        }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(mockCheckQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const result = await saveVisaRequirement('trip-1', 'dest-1', {
        visaType: 'e-visa',
        daysAllowed: 30,
        estimatedCost: 50,
        processingDays: 5,
        notes: 'Apply online',
      });

      expect(result.visaType).toBe('e-visa');
      expect(result.daysAllowed).toBe(30);
    });

    it('should update existing visa requirement', async () => {
      const existingReq = { id: 'visa-existing' };
      const mockUpdatedReq = {
        id: 'visa-existing',
        trip_id: 'trip-1',
        destination_id: 'dest-1',
        visa_type: 'visa-on-arrival',
        days_allowed: 60,
        estimated_cost: 0,
        processing_days: 0,
        access_via: 'passport',
        notes: 'Updated',
        created_at: '2025-01-01T00:00:00Z',
      };

      const mockCheckQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: existingReq,
          error: null,
        }),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedReq,
          error: null,
        }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(mockCheckQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      const result = await saveVisaRequirement('trip-1', 'dest-1', {
        visaType: 'visa-on-arrival',
        daysAllowed: 60,
        notes: 'Updated',
      });

      expect(result.visaType).toBe('visa-on-arrival');
      expect(result.daysAllowed).toBe(60);
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(
        saveVisaRequirement('trip-1', 'dest-1', { visaType: 'visa-free' })
      ).rejects.toThrow('Not authenticated');
    });
  });
});
