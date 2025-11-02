import { isNativePlatform } from '../capacitor';

// Utility functions for Capacitor integration

/**
 * Check if the app is running in a native environment (Android/iOS)
 * @returns boolean
 */
export const isNative = (): boolean => {
  return isNativePlatform;
};

/**
 * Get the current platform
 * @returns 'web' | 'ios' | 'android'
 */
export const getPlatform = (): string => {
  if (typeof Capacitor !== 'undefined') {
    return Capacitor.getPlatform();
  }
  return 'web';
};

/**
 * Check if the app is running on Android
 * @returns boolean
 */
export const isAndroid = (): boolean => {
  return getPlatform() === 'android';
};

/**
 * Check if the app is running on iOS
 * @returns boolean
 */
export const isIOS = (): boolean => {
  return getPlatform() === 'ios';
};

/**
 * Handle platform-specific functionality
 * @param webCallback Function to run on web platform
 * @param nativeCallback Function to run on native platform
 */
export const handlePlatformSpecific = async (
  webCallback: () => void,
  nativeCallback: () => void
): Promise<void> => {
  if (isNative()) {
    nativeCallback();
  } else {
    webCallback();
  }
};

/**
 * Show a toast notification using native capabilities when available
 * @param message The message to display
 */
export const showToast = async (message: string): Promise<void> => {
  if (isNative() && typeof Toast !== 'undefined') {
    try {
      const { Toast } = await import('@capacitor/toast');
      await Toast.show({ text: message });
    } catch (error) {
      console.warn('Toast plugin not available:', error);
      // Fallback to web notification
      if ('Notification' in window) {
        new Notification(message);
      }
    }
  } else {
    // Web fallback
    if ('Notification' in window) {
      new Notification(message);
    } else {
      console.log(message);
    }
  }
};

export default {
  isNative,
  getPlatform,
  isAndroid,
  isIOS,
  handlePlatformSpecific,
  showToast
};