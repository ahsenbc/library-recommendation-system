/**
 * Error handling utilities
 *
 * These functions use the Toast context to display notifications.
 * Make sure ToastProvider is set up in your app (see App.tsx)
 */

// Global toast functions - will be set by ToastProvider
let toastFunctions: {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
} | null = null;

/**
 * Initialize toast functions (called by ToastProvider)
 * @internal
 */
export function setToastFunctions(functions: typeof toastFunctions) {
  toastFunctions = functions;
}

/**
 * Handles API errors and displays user-friendly messages using toast notifications
 */
export function handleApiError(error: unknown): void {
  let message = 'An unexpected error occurred';

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  if (toastFunctions) {
    toastFunctions.showError(message);
  } else {
    // Fallback to alert if toast is not initialized
    console.warn('Toast not initialized, using alert fallback');
    alert(`Error: ${message}`);
  }

  console.error('API Error:', error);
}

/**
 * Shows a success message to the user using toast notifications
 */
export function showSuccess(message: string): void {
  if (toastFunctions) {
    toastFunctions.showSuccess(message);
  } else {
    // Fallback to alert if toast is not initialized
    console.warn('Toast not initialized, using alert fallback');
    alert(`Success: ${message}`);
  }
  console.log('Success:', message);
}

/**
 * Shows an info message to the user using toast notifications
 */
export function showInfo(message: string): void {
  if (toastFunctions) {
    toastFunctions.showInfo(message);
  } else {
    console.warn('Toast not initialized, using alert fallback');
    alert(`Info: ${message}`);
  }
}

/**
 * Shows a warning message to the user using toast notifications
 */
export function showWarning(message: string): void {
  if (toastFunctions) {
    toastFunctions.showWarning(message);
  } else {
    console.warn('Toast not initialized, using alert fallback');
    alert(`Warning: ${message}`);
  }
}
