import toast, { ToastOptions } from 'react-hot-toast';

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
};

export function useToast() {
  const success = (message: string, options?: ToastOptions) => {
    toast.success(message, { ...defaultOptions, ...options });
  };

  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, { ...defaultOptions, ...options });
  };

  const loading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, { ...defaultOptions, ...options });
  };

  const dismiss = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  const promise = <T>(
    promiseFn: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string | ((err: Error) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promiseFn, messages, { ...defaultOptions, ...options });
  };

  const custom = (message: string, options?: ToastOptions) => {
    toast(message, { ...defaultOptions, ...options });
  };

  // Show API error with proper message extraction
  const apiError = (err: unknown, fallbackMessage = 'Something went wrong') => {
    let message = fallbackMessage;

    if (err && typeof err === 'object') {
      if ('response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        message = response?.data?.message || fallbackMessage;
      } else if ('message' in err) {
        message = (err as Error).message;
      }
    }

    error(message);
  };

  return {
    success,
    error,
    loading,
    dismiss,
    promise,
    custom,
    apiError,
  };
}

// Standalone functions for use outside of components
export const showToast = {
  success: (message: string, options?: ToastOptions) =>
    toast.success(message, { ...defaultOptions, ...options }),

  error: (message: string, options?: ToastOptions) =>
    toast.error(message, { ...defaultOptions, ...options }),

  loading: (message: string, options?: ToastOptions) =>
    toast.loading(message, { ...defaultOptions, ...options }),

  dismiss: (toastId?: string) => (toastId ? toast.dismiss(toastId) : toast.dismiss()),

  promise: <T>(
    promiseFn: Promise<T>,
    messages: { loading: string; success: string; error: string | ((err: Error) => string) },
    options?: ToastOptions
  ) => toast.promise(promiseFn, messages, { ...defaultOptions, ...options }),
};
