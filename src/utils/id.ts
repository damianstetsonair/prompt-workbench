/**
 * Generates a unique ID string
 * @returns A random 9-character alphanumeric string
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};
