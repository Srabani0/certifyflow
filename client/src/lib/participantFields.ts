// Mirrors server/src/lib/participantFields.ts — used here only to preview which
// {{placeholder}} names a participant's CSV columns will resolve to.
export function sanitizeFieldKey(header: string): string {
  const words = header
    .trim()
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);

  if (words.length === 0) {
    return '';
  }

  return words
    .map((word, index) => (index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join('');
}
