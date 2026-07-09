import { Capacitor } from '@capacitor/core';

// On the web the Netlify functions live on the same origin, so relative paths
// work. Inside the native Capacitor app the page is served from
// capacitor://localhost, so relative fetches never reach Netlify — calls must
// target the deployed site directly.
export const API_BASE: string = Capacitor.isNativePlatform()
    ? (import.meta.env.VITE_API_BASE || 'https://keepingrecord.net')
    : '';
