/**
 * Haptic feedback utilities for mobile PWA
 */

export const haptics = {
  /**
   * Light tap feedback (e.g., button press)
   */
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium impact feedback (e.g., successful action)
   */
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  /**
   * Heavy impact feedback (e.g., error, emergency)
   */
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  },

  /**
   * Success pattern (e.g., booking confirmed)
   */
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Error pattern (e.g., failed action)
   */
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 25, 50, 25, 50]);
    }
  },

  /**
   * Warning pattern (e.g., low health score)
   */
  warning: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 20, 30]);
    }
  },

  /**
   * Emergency SOS pattern (e.g., SOS button)
   */
  emergency: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  },
};
