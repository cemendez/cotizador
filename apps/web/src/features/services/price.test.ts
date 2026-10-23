import { describe, expect, it } from 'vitest';
import { servicePrice } from './price';

describe('servicePrice', () => {
    it('el precio fijo gana sobre horas × tarifa', () => {
        expect(servicePrice({ estimatedHours: '20', fixedPrice: '3500' }, 350)).toBe(3500);
    });

    it('sin precio fijo calcula horas × tarifa', () => {
        expect(servicePrice({ estimatedHours: '12.5', fixedPrice: null }, 350)).toBe(4375);
    });

    it('sin tarifa configurada ni precio fijo no hay precio', () => {
        expect(servicePrice({ estimatedHours: '20', fixedPrice: null }, null)).toBeNull();
    });
});