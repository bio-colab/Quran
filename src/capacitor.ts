// Capacitor integration file
import { Capacitor } from '@capacitor/core';

// Check if we're running in a Capacitor environment
export const isNativePlatform = Capacitor.isNativePlatform();

// Export Capacitor utilities
export { Capacitor };

// Platform-specific functionality
export const getPlatform = () => {
  return Capacitor.getPlatform();
};

// Initialize PWA elements for web platform
export const initializePWAElements = async () => {
  if (!isNative) {
    try {
      const { defineCustomElements } = await import('@ionic/pwa-elements/loader');
      defineCustomElements(window);
    } catch (e) {
      console.warn('PWA elements not available', e);
    }
  }
};
