import { STORAGE_KEYS } from '../constants';
import type { WorkbenchData, Settings } from '../types';

/**
 * Storage service for persisting data to localStorage
 */
export const storage = {
  /**
   * Get data from localStorage
   */
  getData: (): WorkbenchData | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading data from localStorage:', error);
      return null;
    }
  },

  /**
   * Save data to localStorage
   */
  setData: (data: WorkbenchData): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  },

  /**
   * Get settings from localStorage
   */
  getSettings: (): Settings | null => {
    try {
      const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error reading settings from localStorage:', error);
      return null;
    }
  },

  /**
   * Save settings to localStorage
   */
  setSettings: (settings: Settings): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  },

  /**
   * Export all data as JSON string
   */
  exportData: (data: WorkbenchData): string => {
    return JSON.stringify(data, null, 2);
  },

  /**
   * Import data from JSON string
   */
  importData: (jsonString: string): WorkbenchData | null => {
    try {
      const data = JSON.parse(jsonString);
      if (data && typeof data.projects === 'object') {
        return data as WorkbenchData;
      }
      return null;
    } catch (error) {
      console.error('Error parsing import data:', error);
      return null;
    }
  },
};
