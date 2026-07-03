import { Platform } from 'react-native';

// Same-origin on web; the native build talks to the deployed functions.
export const API_BASE = Platform.OS === 'web' ? '' : 'https://pulsare-peach.vercel.app';
