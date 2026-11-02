/** Exact formats of values the API generates, so tests can check them without knowing the value. */
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** Refresh tokens and guest cart tokens are 32 random bytes in hex. */
export const opaqueTokenPattern = /^[0-9a-f]{64}$/;
export const productIdPattern = /^p-[0-9a-f]{8}$/;
export const orderNumberPattern = /^DS-[0-9A-F]{8}$/;
export const activityIdPattern = /^[1-9]\d*$/;

/** True when the value is a canonical ISO-8601 UTC timestamp, the format the API returns. */
export function isIsoTimestamp(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}
