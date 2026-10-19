import { expect, test } from 'bun:test';
import { registrationFee } from './registration-fees';

test('FC Mobile registration costs 300 rupees for one player', () => {
  expect(registrationFee('fc-mobile')).toBe(300);
});

test('BGMI registration costs 200 rupees per player', () => {
  expect(registrationFee('bgmi')).toBe(200);
});

test('a full five-player BGMI squad costs 1000 rupees', () => {
  expect(registrationFee('bgmi', 5)).toBe(1000);
});