/**
 * Travel AI Tools
 * AI tools for trip planning, itineraries, and travel management
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import {
  getTrips,
  createTrip,
  createTripDay,
  createTravelDocument,
  createPackingList,
  checkVisaRequirement,
  getTripBudgetSummary,
} from '@/api/travelAPI';
import type { Trip, TripDay, TravelDocument } from '@/services/types';
import { logger } from '@/services/logger';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const createTripDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'create_trip',
    description:
      'Create a new trip. Requires name, destination_countries (array), start_date, end_date. Optional: status, budget, travelers.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Trip name - required' },
        destination_countries: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of destination countries - required',
        },
        start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format - required' },
        end_date: { type: 'string', description: 'End date in YYYY-MM-DD format - required' },
        status: {
          type: 'string',
          enum: ['planning', 'booked', 'in-progress', 'completed'],
          description: 'Trip status - optional, defaults to planning',
        },
        budget: { type: 'number', description: 'Trip budget - optional' },
        travelers: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of traveler names - optional',
        },
      },
      required: ['name', 'destination_countries', 'start_date', 'end_date'],
    },
  },
};

const addToItineraryDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'add_to_itinerary',
    description: 'Add a day to trip itinerary. Requires trip_id, date, location. Optional: activities, accommodations, transportation, notes.',
    parameters: {
      type: 'object',
      properties: {
        trip_id: { type: 'string', description: 'Trip ID - required' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format - required' },
        location: { type: 'string', description: 'Location for this day - required' },
        activities: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of activities - optional',
        },
        accommodations: { type: 'string', description: 'Where staying - optional' },
        transportation: { type: 'string', description: 'Transportation details - optional' },
        notes: { type: 'string', description: 'Additional notes - optional' },
      },
      required: ['trip_id', 'date', 'location'],
    },
  },
};

const checkVisaRequirementsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'check_visa_requirements',
    description: 'Check visa requirements for travel. Requires passport_country and destination_country.',
    parameters: {
      type: 'object',
      properties: {
        passport_country: { type: 'string', description: 'Your passport country - required' },
        destination_country: { type: 'string', description: 'Destination country - required' },
      },
      required: ['passport_country', 'destination_country'],
    },
  },
};

const createPackingListDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'create_packing_list',
    description: 'Create a packing list for a trip. Requires name. Optional: trip_id.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Packing list name - required' },
        trip_id: { type: 'string', description: 'Associated trip ID - optional' },
      },
      required: ['name'],
    },
  },
};

const addTravelDocumentDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'add_travel_document',
    description: 'Add a travel document (passport, visa, ticket, etc.). Requires type and name. Optional: trip_id, expiry_date, document_number.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['passport', 'visa', 'ticket', 'booking', 'insurance', 'vaccination'],
          description: 'Document type - required',
        },
        name: { type: 'string', description: 'Document name - required' },
        trip_id: { type: 'string', description: 'Associated trip ID - optional' },
        document_number: { type: 'string', description: 'Document number - optional' },
        expiry_date: { type: 'string', description: 'Expiry date in YYYY-MM-DD format - optional' },
        notes: { type: 'string', description: 'Additional notes - optional' },
      },
      required: ['type', 'name'],
    },
  },
};

const getTripBudgetSummaryDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_trip_budget_summary',
    description: 'Get budget summary for a trip. Requires trip_id.',
    parameters: {
      type: 'object',
      properties: {
        trip_id: { type: 'string', description: 'Trip ID - required' },
      },
      required: ['trip_id'],
    },
  },
};

// =====================================================
// TOOL EXECUTION FUNCTIONS
// =====================================================

async function executeCreateTrip(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const trip = await createTrip({
      name: args.name as string,
      destination_countries: args.destination_countries as string[],
      start_date: args.start_date as string,
      end_date: args.end_date as string,
      status: (args.status as Trip['status']) || 'planning',
      budget: args.budget as number | undefined,
      travelers: (args.travelers as string[]) || [],
    });

    logger.info('TravelTools', 'Trip created', { id: trip.id, name: trip.name });
    return {
      success: true,
      message: `Trip created: ${trip.name}`,
      data: trip,
    };
  } catch (error) {
    logger.error('TravelTools', error as Error, { context: 'executeCreateTrip' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeAddToItinerary(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const tripDay = await createTripDay({
      trip_id: args.trip_id as string,
      date: args.date as string,
      location: args.location as string,
      activities: (args.activities as string[]) || [],
      accommodations: args.accommodations as string | undefined,
      transportation: args.transportation as string | undefined,
      notes: args.notes as string | undefined,
    });

    logger.info('TravelTools', 'Itinerary day added', { id: tripDay.id, date: tripDay.date });
    return {
      success: true,
      message: `Added itinerary for ${tripDay.date} in ${tripDay.location}`,
      data: tripDay,
    };
  } catch (error) {
    logger.error('TravelTools', error as Error, { context: 'executeAddToItinerary' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeCheckVisaRequirements(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const requirement = await checkVisaRequirement(
      args.passport_country as string,
      args.destination_country as string
    );

    if (requirement) {
      return {
        success: true,
        message: requirement.visa_required
          ? `Visa required for ${args.destination_country}`
          : `No visa required for ${args.destination_country}`,
        data: requirement,
      };
    } else {
      return {
        success: true,
        message: `No visa requirement data found for ${args.passport_country} to ${args.destination_country}`,
        data: null,
      };
    }
  } catch (error) {
    logger.error('TravelTools', error as Error, { context: 'executeCheckVisaRequirements' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeCreatePackingList(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const list = await createPackingList({
      name: args.name as string,
      trip_id: args.trip_id as string | undefined,
    });

    logger.info('TravelTools', 'Packing list created', { id: list.id, name: list.name });
    return {
      success: true,
      message: `Packing list created: ${list.name}`,
      data: list,
    };
  } catch (error) {
    logger.error('TravelTools', error as Error, { context: 'executeCreatePackingList' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeAddTravelDocument(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const document = await createTravelDocument({
      type: args.type as TravelDocument['type'],
      name: args.name as string,
      trip_id: args.trip_id as string | undefined,
      document_number: args.document_number as string | undefined,
      expiry_date: args.expiry_date as string | undefined,
      notes: args.notes as string | undefined,
    });

    logger.info('TravelTools', 'Travel document added', { id: document.id, name: document.name });
    return {
      success: true,
      message: `Travel document added: ${document.name}`,
      data: document,
    };
  } catch (error) {
    logger.error('TravelTools', error as Error, { context: 'executeAddTravelDocument' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeGetTripBudgetSummary(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const summary = await getTripBudgetSummary(args.trip_id as string);

    logger.info('TravelTools', 'Trip budget summary retrieved', { tripId: args.trip_id });
    return {
      success: true,
      message: `Budget: $${summary.budget}, Spent: $${summary.actualCost}, Remaining: $${summary.remaining}`,
      data: summary,
    };
  } catch (error) {
    logger.error('TravelTools', error as Error, { context: 'executeGetTripBudgetSummary' });
    return { success: false, error: (error as Error).message };
  }
}

// =====================================================
// EXPORT TOOLS
// =====================================================

export const travelTools: Tool[] = [
  { definition: createTripDefinition, execute: executeCreateTrip },
  { definition: addToItineraryDefinition, execute: executeAddToItinerary },
  { definition: checkVisaRequirementsDefinition, execute: executeCheckVisaRequirements },
  { definition: createPackingListDefinition, execute: executeCreatePackingList },
  { definition: addTravelDocumentDefinition, execute: executeAddTravelDocument },
  { definition: getTripBudgetSummaryDefinition, execute: executeGetTripBudgetSummary },
];
