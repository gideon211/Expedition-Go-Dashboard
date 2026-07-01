import { describe, it, expect, beforeEach } from 'vitest';
import { useProductBuilderStore } from '@/features/products/stores/productBuilderStore';

describe('productBuilderStore validateStep', () => {
  beforeEach(() => {
    useProductBuilderStore.getState().reset();
  });

  describe('case 3: Photos & Media', () => {
    it('validates combined product + pickup photo limit > 20', () => {
      const store = useProductBuilderStore.getState();
      store.updateProduct({
        photos: new Array(15).fill({ url: 'https://example.com/photo.jpg', id: 'p1' }),
        content: { pickupPhotoUrls: new Array(6).fill({ url: 'https://example.com/pickup.jpg' }) },
      });
      const result = store.validateStep(3);
      const errors = useProductBuilderStore.getState().errors;
      expect(result).toBe(false);
      expect(errors.photos).toContain('Maximum 20 photos total');
    });

    it('passes with exactly 20 combined photos', () => {
      const store = useProductBuilderStore.getState();
      store.updateProduct({
        photos: new Array(15).fill({ url: 'https://example.com/photo.jpg', id: 'p1' }),
        content: { pickupPhotoUrls: new Array(5).fill({ url: 'https://example.com/pickup.jpg' }) },
      });
      const result = store.validateStep(3);
      expect(result).toBe(true);
    });
  });

  describe('case 11: Pricing Schedules', () => {
    it('rejects age group with minAge < 0', () => {
      const store = useProductBuilderStore.getState();
      store.updateNested('pricing.ageGroups', [
        { name: 'Adult', enabled: true, minAge: -1, maxAge: 64 },
      ]);
      store.updateNested('pricing.schedules', [{
        startDate: '2026-01-01',
        prices: [{ ageGroup: 'Adult', retailPrice: 100 }],
      }]);
      store.updateNested('pricing.maxTravelersPerBooking', 10);
      const result = store.validateStep(11);
      expect(result).toBe(false);
      expect(useProductBuilderStore.getState().errors.ageGroups).toContain('minAge must be 0–120');
    });

    it('rejects age group with maxAge > 120', () => {
      const store = useProductBuilderStore.getState();
      store.updateNested('pricing.ageGroups', [
        { name: 'Adult', enabled: true, minAge: 18, maxAge: 150 },
      ]);
      store.updateNested('pricing.schedules', [{
        startDate: '2026-01-01',
        prices: [{ ageGroup: 'Adult', retailPrice: 100 }],
      }]);
      store.updateNested('pricing.maxTravelersPerBooking', 10);
      const result = store.validateStep(11);
      expect(result).toBe(false);
      expect(useProductBuilderStore.getState().errors.ageGroups).toContain('maxAge must be 0–120');
    });

    it('rejects age group with minAge > maxAge', () => {
      const store = useProductBuilderStore.getState();
      store.updateNested('pricing.ageGroups', [
        { name: 'Adult', enabled: true, minAge: 60, maxAge: 18 },
      ]);
      store.updateNested('pricing.schedules', [{
        startDate: '2026-01-01',
        prices: [{ ageGroup: 'Adult', retailPrice: 100 }],
      }]);
      store.updateNested('pricing.maxTravelersPerBooking', 10);
      const result = store.validateStep(11);
      expect(result).toBe(false);
      expect(useProductBuilderStore.getState().errors.ageGroups).toContain('minAge must be ≤ maxAge');
    });

    it('requires schedule startDate', () => {
      const store = useProductBuilderStore.getState();
      store.updateNested('pricing.maxTravelersPerBooking', 10);
      store.updateNested('pricing.ageGroups', [
        { name: 'Adult', enabled: true, minAge: 18, maxAge: 64 },
      ]);
      store.updateNested('pricing.schedules', [{
        startDate: '',
        prices: [{ ageGroup: 'Adult', retailPrice: 100 }],
      }]);
      const result = store.validateStep(11);
      expect(result).toBe(false);
      expect(useProductBuilderStore.getState().errors.startDate).toBe('Schedule start date is required');
    });

    it('rejects endDate before startDate', () => {
      const store = useProductBuilderStore.getState();
      store.updateNested('pricing.maxTravelersPerBooking', 10);
      store.updateNested('pricing.ageGroups', [
        { name: 'Adult', enabled: true, minAge: 18, maxAge: 64 },
      ]);
      store.updateNested('pricing.schedules', [{
        startDate: '2026-06-01',
        endDate: '2026-05-01',
        prices: [{ ageGroup: 'Adult', retailPrice: 100 }],
      }]);
      const result = store.validateStep(11);
      expect(result).toBe(false);
      expect(useProductBuilderStore.getState().errors.endDate).toBe('End date must be on or after start date');
    });

    it('requires retailPrice >= 0.01 for each enabled age group', () => {
      const store = useProductBuilderStore.getState();
      store.updateNested('pricing.maxTravelersPerBooking', 10);
      store.updateNested('pricing.ageGroups', [
        { name: 'Adult', enabled: true, minAge: 18, maxAge: 64 },
      ]);
      store.updateNested('pricing.schedules', [{
        startDate: '2026-01-01',
        prices: [{ ageGroup: 'Adult', retailPrice: 0 }],
      }]);
      const result = store.validateStep(11);
      expect(result).toBe(false);
      expect(useProductBuilderStore.getState().errors.prices).toContain('retail price of at least 0.01');
    });

    it('requires a price entry for each enabled age group', () => {
      const store = useProductBuilderStore.getState();
      store.updateNested('pricing.maxTravelersPerBooking', 10);
      store.updateNested('pricing.ageGroups', [
        { name: 'Adult', enabled: true, minAge: 18, maxAge: 64 },
        { name: 'Child', enabled: true, minAge: 5, maxAge: 12 },
      ]);
      store.updateNested('pricing.schedules', [{
        startDate: '2026-01-01',
        prices: [{ ageGroup: 'Adult', retailPrice: 100 }],
      }]);
      const result = store.validateStep(11);
      expect(result).toBe(false);
      expect(useProductBuilderStore.getState().errors.prices).toContain('Price required for "Child"');
    });

    it('passes with valid complete pricing', () => {
      const store = useProductBuilderStore.getState();
      store.updateNested('pricing.maxTravelersPerBooking', 10);
      store.updateNested('pricing.ageGroups', [
        { name: 'Adult', enabled: true, minAge: 18, maxAge: 64 },
      ]);
      store.updateNested('pricing.schedules', [{
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        prices: [{ ageGroup: 'Adult', retailPrice: 100 }],
      }]);
      const result = store.validateStep(11);
      expect(result).toBe(true);
    });
  });
});
