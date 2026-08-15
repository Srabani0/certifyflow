// Turns an arbitrary CSV header ("Team Name", "Project Title") into a camelCase
// placeholder key ("teamName", "projectTitle") usable in {{...}} certificate text,
// consistent with the rest of the built-in placeholder vocabulary (eventName, issueDate, ...).
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

export function sanitizeMetadataFields(metadata: unknown): Record<string, string> {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata as Record<string, unknown>)) {
    if (value === null || value === undefined) {
      continue;
    }
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      continue;
    }
    const sanitizedKey = sanitizeFieldKey(key);
    if (sanitizedKey) {
      result[sanitizedKey] = String(value);
    }
  }
  return result;
}
