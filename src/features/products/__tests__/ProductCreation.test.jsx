import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductBuilderPage from '@/features/products/pages/ProductBuilderPage';
import { useProductBuilderStore } from '@/features/products/stores/productBuilderStore';

const mockCreateProduct = vi.fn();
const mockUpdateProduct = vi.fn();

vi.mock('@/features/products/api', () => ({
  createProduct: (...args) => mockCreateProduct(...args),
  updateProduct: (...args) => mockUpdateProduct(...args),
  getProduct: vi.fn(),
  listProducts: vi.fn(),
  deleteProduct: vi.fn(),
}));

describe('Product Creation Flow', () => {
  beforeEach(() => {
    useProductBuilderStore.getState().reset();
  });

  it('should call createProduct when submitting a new tour', async () => {
    render(
      <MemoryRouter initialEntries={['/products/build/new/review']}>
        <Routes>
          <Route path="/products/build/:id?/:step?" element={<ProductBuilderPage />} />
          <Route path="/products" element={<div>Products List</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Set up a complete product state
    const store = useProductBuilderStore.getState();
    store.updateProduct({
      title: 'Test Safari',
      description: 'A great safari experience that takes you through the wilderness to see wildlife in their natural habitat. This is an unforgettable journey.',
      category: 'safari',
      subcategory: 'Wildlife',
      activityType: 'Guided Tour',
      city: 'Arusha',
      country: 'Tanzania',
      metaTitle: 'Test Safari',
      duration: '3',
      durationUnit: 'hours',
      productType: 'tour',
      tourTransportationModes: ['4WD'],
      tourDurationCategory: 'one_day_or_less',
      pricing: {
        basePrice: 100,
        currency: 'USD',
        pricingModel: 'perPerson',
        startDate: '2026-05-21',
        endDate: '2026-12-31',
        tiers: [
          { name: 'Adult', price: 100, minAge: 18, maxAge: 64 },
        ],
        taxes: '',
        fees: '',
        commissionRate: 15,
      },
      schedule: {
        operatingDays: ['monday', 'tuesday'],
        timeSlots: [{ startTime: '09:00', endTime: '12:00' }],
        seasonalAvailability: 'all_year',
        blackoutDates: [],
        capacityPerSlot: 20,
        bookingCutoffHours: 24,
      },
      bookingRules: {
        confirmationType: 'manual',
        minAdvanceBookingHours: 48,
        maxGroupSize: 20,
        minGroupSize: 1,
        meetingPoint: 'Hotel Lobby',
        meetingPointAddress: '123 Main St',
        meetingPointLat: null,
        meetingPointLng: null,
        instantBooking: false,
        refundPercentage: 100,
        pickupAvailable: false,
        pickupDetails: '',
        inclusions: [],
        exclusions: [],
      },
      content: {
        itinerary: [{ day: "Day 1", time: "09:00", title: "Arrival", description: "Arrive and settle in" }],
        highlights: [{ title: "Amazing wildlife", description: "See all the animals" }],
        included: [],
        excluded: [],
        whatToBring: [],
        meetingInstructions: 'Meet at lobby',
        pickupDescription: '',
        additionalInfo: '',
        uniqueSellingPoints: 'Unique experience',
        travelerRequirements: '',
        languages: ['English'],
      },
      photos: ['https://example.com/photo1.jpg'],
      status: 'draft',
    });

    // Navigate to review step if not already there
    store.setStep(7);

    // Find and click the submit button
    const submitButton = await screen.findByText(/Create Tour/i);
    expect(submitButton).toBeInTheDocument();

    fireEvent.click(submitButton);

    // Wait for createProduct to be called
    await waitFor(() => {
      expect(mockCreateProduct).toHaveBeenCalled();
    });

    // Check the payload structure (FormData)
    const payload = mockCreateProduct.mock.calls[0][0];
    expect(payload instanceof FormData).toBe(true);
    expect(payload.get('title')).toBe('Test Safari');
    expect(payload.has('status')).toBe(true);
    expect(payload.has('categorization')).toBe(true);
    expect(payload.has('productContent')).toBe(true);
    expect(payload.has('schedulesAndPricing')).toBe(true);
    expect(payload.has('bookingAndTickets')).toBe(true);
  });
});
