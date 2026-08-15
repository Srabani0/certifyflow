import { randomInt } from 'node:crypto';

// Excludes 0/O, 1/I/L so printed IDs are unambiguous when typed back in by hand.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const SEGMENT_LENGTH = 10;

export function generateCertificateId(prefix = 'CF', date: Date = new Date()): string {
  const year = date.getFullYear();
  let segment = '';
  for (let i = 0; i < SEGMENT_LENGTH; i += 1) {
    segment += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `${prefix}-${year}-${segment}`;
}
