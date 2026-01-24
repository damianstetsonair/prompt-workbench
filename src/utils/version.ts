import type { Version } from '../types';

/**
 * Calculates the next version number based on existing versions
 * @param versions - Array of existing versions
 * @returns The next version number string (e.g., "0.1", "1.5")
 */
export const getVersionNumber = (versions: Version[] | undefined): string => {
  if (!versions || versions.length === 0) return '0.0';
  
  const lastVersion = versions[versions.length - 1];
  if (!lastVersion) return '0.0';
  
  const [major, minor] = lastVersion.version.split('.').map(Number);
  return `${major}.${(minor ?? 0) + 1}`;
};
