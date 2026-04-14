import { ToastType } from './utils/toast';

declare global {
  interface Window {
    pwa_initialized?: boolean;
    L?: any;
    userMarker?: any;
    toastTimeout?: any;
    showToast?: (message: string, type?: ToastType, duration?: number) => void;
    jsQR?: any;
  }
}

export {};
